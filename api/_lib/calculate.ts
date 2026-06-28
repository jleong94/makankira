/**
 * calculate.ts — wire the pure engine (calc.ts) to stored data (README Screen 8).
 *
 * Reads participant orders + menu actual prices + bill_adjustments, runs the
 * calculation, and persists one payment_results row per participant order.
 * Rows the organizer edited by hand (is_manual_override = 1) are preserved.
 */

import type { Row, InStatement } from '@libsql/client';
import { query, queryOne, batchWrite } from './db';
import { newId } from './ids';
import { HttpError } from './http';
import {
  calculate,
  type ParticipantInput,
  type BillInput,
  type CompanyClaim,
  type CalculationMode,
  type SimpleAlloc,
  type DiscountAlloc,
  type ClaimAlloc,
  type FarewellAlloc,
} from './calc';

function billInputFrom(billRow: Row | null): BillInput {
  const claim: CompanyClaim = {
    type: (billRow ? String(billRow.company_claim_type) : 'none') as CompanyClaim['type'],
    amountCents: billRow ? Number(billRow.company_claim_amount_cents) : 0,
    percent: billRow && billRow.company_claim_percent != null ? Number(billRow.company_claim_percent) : undefined,
  };
  const rounding = billRow ? Number(billRow.rounding_adjustment_cents) : 0;
  return {
    mode: (billRow ? String(billRow.calculation_mode) : 'item_based') as CalculationMode,
    includeOrganizerInSplit: billRow ? Number(billRow.include_organizer_in_split) === 1 : true,
    taxCents: billRow ? Number(billRow.tax_amount_cents) : 0,
    serviceChargeCents: billRow ? Number(billRow.service_charge_amount_cents) : 0,
    discountCents: billRow ? Number(billRow.discount_amount_cents) : 0,
    companyClaim: claim,
    taxAlloc: (billRow ? String(billRow.tax_allocation_method) : 'proportional') as SimpleAlloc,
    serviceChargeAlloc: (billRow ? String(billRow.service_charge_allocation_method) : 'proportional') as SimpleAlloc,
    discountAlloc: (billRow ? String(billRow.discount_allocation_method) : 'proportional') as DiscountAlloc,
    companyClaimAlloc: (billRow ? String(billRow.company_claim_allocation_method) : 'proportional') as ClaimAlloc,
    farewellAlloc: (billRow ? String(billRow.farewell_cost_allocation_method) : 'equal_paying_participants') as FarewellAlloc,
    finalBillCents: billRow && billRow.final_bill_amount_cents != null ? Number(billRow.final_bill_amount_cents) : null,
    // Treat a stored non-zero rounding as a manual override; 0 lets the engine auto-reconcile.
    manualRoundingCents: rounding !== 0 ? rounding : null,
  };
}

export async function runCalculation(mealId: string): Promise<{ summary: unknown; results: Row[] }> {
  const meal = await queryOne('SELECT id, title, owner_user_id FROM meal_sessions WHERE id = ?', [mealId]);
  if (!meal) throw new HttpError(404, 'not_found', 'Meal session not found');

  const orders = await query(
    'SELECT id, participant_user_id, participant_name, participant_role, mobile_number FROM participant_orders WHERE meal_session_id = ?',
    [mealId],
  );

  // Per-order subtotal from actual prices; every ordered item must be priced.
  const lines = await query(
    `SELECT oi.participant_order_id AS oid, oi.quantity AS qty, mi.actual_price_cents AS price, mi.name AS item_name
       FROM order_items oi
       JOIN menu_items mi ON oi.menu_item_id = mi.id
       JOIN participant_orders po ON oi.participant_order_id = po.id
      WHERE po.meal_session_id = ?`,
    [mealId],
  );
  const subtotal = new Map<string, number>();
  const unpriced: string[] = [];
  for (const l of lines) {
    if (l.price == null) {
      unpriced.push(String(l.item_name));
      continue;
    }
    const oid = String(l.oid);
    subtotal.set(oid, (subtotal.get(oid) ?? 0) + Number(l.price) * Number(l.qty));
  }
  if (unpriced.length > 0) {
    throw new HttpError(400, 'missing_actual_price', `Set actual prices first: ${[...new Set(unpriced)].join(', ')}`);
  }

  const ownerId = String(meal.owner_user_id);
  const participants: ParticipantInput[] = orders.map((o) => ({
    id: String(o.id),
    name: String(o.participant_name),
    role: o.participant_role === 'farewell_honoree' ? 'farewell_honoree' : 'paying_participant',
    isOrganizer: o.participant_user_id != null && String(o.participant_user_id) === ownerId,
    ownSubtotalCents: subtotal.get(String(o.id)) ?? 0,
  }));

  const billRow = await queryOne('SELECT * FROM bill_adjustments WHERE meal_session_id = ?', [mealId]);
  const output = calculate(participants, billInputFrom(billRow));

  // Persist, preserving manual-override rows and existing payment status.
  const overrideRows = await query(
    'SELECT participant_order_id FROM payment_results WHERE meal_session_id = ? AND is_manual_override = 1',
    [mealId],
  );
  const overridden = new Set(overrideRows.map((r) => String(r.participant_order_id)));
  const ordersById = new Map(orders.map((o) => [String(o.id), o]));

  const stmts: InStatement[] = [];
  const orderIds = orders.map((o) => String(o.id));
  if (orderIds.length === 0) {
    stmts.push({ sql: 'DELETE FROM payment_results WHERE meal_session_id = ?', args: [mealId] });
  } else {
    stmts.push({
      sql: `DELETE FROM payment_results WHERE meal_session_id = ? AND participant_order_id NOT IN (${orderIds.map(() => '?').join(',')})`,
      args: [mealId, ...orderIds],
    });
  }

  for (const r of output.results) {
    if (overridden.has(r.id)) continue; // keep the organizer's manual figure
    const order = ordersById.get(r.id);
    stmts.push({
      sql: `INSERT INTO payment_results
              (id, meal_session_id, participant_order_id, participant_name, mobile_number, participant_role,
               subtotal_cents, tax_cents, service_charge_cents, discount_cents, company_claim_cents,
               farewell_sponsored_share_cents, rounding_adjustment_cents, total_due_cents,
               is_manual_override, payment_reference, computed_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, strftime('%Y-%m-%dT%H:%M:%SZ','now'))
            ON CONFLICT (meal_session_id, participant_order_id) DO UPDATE SET
              participant_name = excluded.participant_name,
              mobile_number = excluded.mobile_number,
              participant_role = excluded.participant_role,
              subtotal_cents = excluded.subtotal_cents,
              tax_cents = excluded.tax_cents,
              service_charge_cents = excluded.service_charge_cents,
              discount_cents = excluded.discount_cents,
              company_claim_cents = excluded.company_claim_cents,
              farewell_sponsored_share_cents = excluded.farewell_sponsored_share_cents,
              rounding_adjustment_cents = excluded.rounding_adjustment_cents,
              total_due_cents = excluded.total_due_cents,
              is_manual_override = 0,
              payment_reference = excluded.payment_reference,
              computed_at = excluded.computed_at,
              updated_at = strftime('%Y-%m-%dT%H:%M:%SZ','now')`,
      args: [
        newId('pr'),
        mealId,
        r.id,
        r.name,
        order ? (order.mobile_number as string | null) : null,
        r.role,
        r.subtotalCents,
        r.taxCents,
        r.serviceChargeCents,
        r.discountCents,
        r.companyClaimCents,
        r.farewellSponsoredShareCents,
        r.roundingAdjustmentCents,
        r.totalDueCents,
        `${String(meal.title)} - ${r.name}`,
      ],
    });
  }

  await batchWrite(stmts);
  const results = await query(
    'SELECT * FROM payment_results WHERE meal_session_id = ? ORDER BY created_at',
    [mealId],
  );
  return { summary: output.summary, results };
}
