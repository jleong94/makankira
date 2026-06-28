/**
 * bill.ts — the single bill_adjustments row per meal (README Screens 7, 8).
 * Holds the calculation mode, all allocation methods, tax/service/discount,
 * company claim, final bill, and rounding.
 */

import type { Row } from '@libsql/client';
import { queryOne, execute } from './db.js';
import { newId } from './ids.js';
import { HttpError } from './http.js';
import { optionalIntCents } from './validate.js';

type Input = Record<string, unknown>;

const CALC_MODES = ['item_based', 'equal_split', 'farewell'];
const SIMPLE_ALLOC = ['proportional', 'equal', 'manual'];
const DISCOUNT_ALLOC = ['proportional', 'equal', 'organizer_only', 'selected_participants', 'manual'];
const CLAIM_ALLOC = ['proportional', 'equal', 'selected_participants', 'manual'];
const FAREWELL_ALLOC = ['equal_paying_participants', 'proportional_paying_participants', 'manual'];
const CLAIM_TYPES = ['none', 'fixed', 'percentage'];

function inEnum(v: unknown, allowed: string[], field: string, fallback: string): string {
  if (v === undefined) return fallback;
  if (typeof v === 'string' && allowed.includes(v)) return v;
  throw new HttpError(400, 'invalid_enum', `${field} must be one of ${allowed.join(', ')}`);
}

export async function getBill(mealId: string): Promise<Row | null> {
  return queryOne('SELECT * FROM bill_adjustments WHERE meal_session_id = ?', [mealId]);
}

export async function upsertBill(mealId: string, input: Input): Promise<Row> {
  const existing = await getBill(mealId);

  const calculationMode = inEnum(input.calculationMode, CALC_MODES, 'calculationMode',
    existing ? String(existing.calculation_mode) : 'item_based');
  const includeOrganizer =
    'includeOrganizerInSplit' in input
      ? input.includeOrganizerInSplit !== false
      : existing
        ? Number(existing.include_organizer_in_split) === 1
        : true;

  const claimType = inEnum(input.companyClaimType, CLAIM_TYPES, 'companyClaimType',
    existing ? String(existing.company_claim_type) : 'none');
  let claimPercent: number | null =
    existing ? (existing.company_claim_percent as number | null) : null;
  if ('companyClaimPercent' in input) {
    if (input.companyClaimPercent == null) claimPercent = null;
    else if (typeof input.companyClaimPercent === 'number' && input.companyClaimPercent >= 0 && input.companyClaimPercent <= 100)
      claimPercent = input.companyClaimPercent;
    else throw new HttpError(400, 'invalid_percent', 'companyClaimPercent must be between 0 and 100');
  }

  const numOr = (key: string, col: string, def = 0): number =>
    key in input ? optionalIntCents(input[key], key) ?? 0 : existing ? Number(existing[col]) : def;

  const tax = numOr('taxAmountCents', 'tax_amount_cents');
  const service = numOr('serviceChargeAmountCents', 'service_charge_amount_cents');
  const discount = numOr('discountAmountCents', 'discount_amount_cents');
  const claimAmount = numOr('companyClaimAmountCents', 'company_claim_amount_cents');

  const finalBill =
    'finalBillAmountCents' in input
      ? optionalIntCents(input.finalBillAmountCents, 'finalBillAmountCents')
      : existing
        ? (existing.final_bill_amount_cents as number | null)
        : null;
  const rounding =
    'roundingAdjustmentCents' in input && typeof input.roundingAdjustmentCents === 'number'
      ? input.roundingAdjustmentCents
      : existing
        ? Number(existing.rounding_adjustment_cents)
        : 0;

  const taxAlloc = inEnum(input.taxAllocationMethod, SIMPLE_ALLOC, 'taxAllocationMethod',
    existing ? String(existing.tax_allocation_method) : 'proportional');
  const serviceAlloc = inEnum(input.serviceChargeAllocationMethod, SIMPLE_ALLOC, 'serviceChargeAllocationMethod',
    existing ? String(existing.service_charge_allocation_method) : 'proportional');
  const discountAlloc = inEnum(input.discountAllocationMethod, DISCOUNT_ALLOC, 'discountAllocationMethod',
    existing ? String(existing.discount_allocation_method) : 'proportional');
  const claimAlloc = inEnum(input.companyClaimAllocationMethod, CLAIM_ALLOC, 'companyClaimAllocationMethod',
    existing ? String(existing.company_claim_allocation_method) : 'proportional');
  const farewellAlloc = inEnum(input.farewellCostAllocationMethod, FAREWELL_ALLOC, 'farewellCostAllocationMethod',
    existing ? String(existing.farewell_cost_allocation_method) : 'equal_paying_participants');

  const cols = [
    'calculation_mode', 'include_organizer_in_split', 'tax_amount_cents', 'service_charge_amount_cents',
    'discount_amount_cents', 'company_claim_type', 'company_claim_percent', 'company_claim_amount_cents',
    'tax_allocation_method', 'service_charge_allocation_method', 'discount_allocation_method',
    'company_claim_allocation_method', 'farewell_cost_allocation_method', 'rounding_adjustment_cents',
    'final_bill_amount_cents',
  ];
  const vals = [
    calculationMode, includeOrganizer ? 1 : 0, tax, service, discount, claimType, claimPercent, claimAmount,
    taxAlloc, serviceAlloc, discountAlloc, claimAlloc, farewellAlloc, rounding, finalBill,
  ];

  if (existing) {
    await execute(
      `UPDATE bill_adjustments SET ${cols.map((c) => `${c} = ?`).join(', ')},
         updated_at = strftime('%Y-%m-%dT%H:%M:%SZ','now') WHERE meal_session_id = ?`,
      [...vals, mealId],
    );
  } else {
    await execute(
      `INSERT INTO bill_adjustments (id, meal_session_id, ${cols.join(', ')})
       VALUES (?, ?, ${cols.map(() => '?').join(', ')})`,
      [newId('bill'), mealId, ...vals],
    );
  }
  return (await getBill(mealId))!;
}
