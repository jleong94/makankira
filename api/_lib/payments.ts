/**
 * payments.ts — payment_results reads + mutations and the status-event audit log
 * (README Screens 8, 9). Overrides and paid/pending changes are all logged.
 */

import type { Row } from '@libsql/client';
import { query, queryOne, execute } from './db';
import { newId } from './ids';
import { HttpError } from './http';
import { requireIntCents } from './validate';

export async function listResults(mealId: string): Promise<Row[]> {
  return query('SELECT * FROM payment_results WHERE meal_session_id = ? ORDER BY created_at', [mealId]);
}

export async function getResult(mealId: string, resultId: string): Promise<Row> {
  const r = await queryOne('SELECT * FROM payment_results WHERE id = ? AND meal_session_id = ?', [resultId, mealId]);
  if (!r) throw new HttpError(404, 'not_found', 'Payment result not found');
  return r;
}

export async function listEvents(mealId: string): Promise<Row[]> {
  return query('SELECT * FROM payment_status_events WHERE meal_session_id = ? ORDER BY created_at DESC', [mealId]);
}

interface EventOpts {
  mealId: string;
  resultId: string | null;
  eventType: string;
  fromStatus?: string | null;
  toStatus?: string | null;
  amountCents?: number | null;
  note?: string | null;
  userId: string;
}

async function logEvent(o: EventOpts): Promise<void> {
  await execute(
    `INSERT INTO payment_status_events
       (id, meal_session_id, payment_result_id, event_type, from_status, to_status, amount_cents, note, created_by_user_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      newId('evt'),
      o.mealId,
      o.resultId,
      o.eventType,
      o.fromStatus ?? null,
      o.toStatus ?? null,
      o.amountCents ?? null,
      o.note ?? null,
      o.userId,
    ],
  );
}

/** Manually override a participant's amount; flags is_manual_override (Screen 8). */
export async function overrideResult(
  mealId: string,
  resultId: string,
  input: Record<string, unknown>,
  userId: string,
): Promise<Row> {
  await getResult(mealId, resultId);
  const total = requireIntCents(input.totalDueCents, 'totalDueCents');
  const note = typeof input.note === 'string' ? input.note : null;
  await execute(
    "UPDATE payment_results SET total_due_cents = ?, is_manual_override = 1, updated_at = strftime('%Y-%m-%dT%H:%M:%SZ','now') WHERE id = ?",
    [total, resultId],
  );
  await logEvent({ mealId, resultId, eventType: 'amount_overridden', amountCents: total, note, userId });
  return getResult(mealId, resultId);
}

export async function markPaid(
  mealId: string,
  resultId: string,
  paidAt: string | null,
  userId: string,
): Promise<Row> {
  const existing = await getResult(mealId, resultId);
  const from = String(existing.payment_status);
  if (paidAt) {
    await execute(
      "UPDATE payment_results SET payment_status = 'paid', paid_at = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%SZ','now') WHERE id = ?",
      [paidAt, resultId],
    );
  } else {
    await execute(
      "UPDATE payment_results SET payment_status = 'paid', paid_at = strftime('%Y-%m-%dT%H:%M:%SZ','now'), updated_at = strftime('%Y-%m-%dT%H:%M:%SZ','now') WHERE id = ?",
      [resultId],
    );
  }
  await logEvent({
    mealId,
    resultId,
    eventType: 'marked_paid',
    fromStatus: from,
    toStatus: 'paid',
    amountCents: Number(existing.total_due_cents),
    userId,
  });
  return getResult(mealId, resultId);
}

export async function markPending(mealId: string, resultId: string, userId: string): Promise<Row> {
  const existing = await getResult(mealId, resultId);
  const from = String(existing.payment_status);
  await execute(
    "UPDATE payment_results SET payment_status = 'pending', paid_at = NULL, updated_at = strftime('%Y-%m-%dT%H:%M:%SZ','now') WHERE id = ?",
    [resultId],
  );
  await logEvent({ mealId, resultId, eventType: 'marked_pending', fromStatus: from, toStatus: 'pending', userId });
  return getResult(mealId, resultId);
}
