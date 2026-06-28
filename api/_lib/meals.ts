/**
 * meals.ts — meal session lifecycle (README Sections 3, 10). Testable domain
 * functions; handlers stay thin. Ownership is enforced here and re-checked per
 * route in handlers via requireOwnedMeal.
 */

import type { VercelRequest } from '@vercel/node';
import type { Row, InStatement } from '@libsql/client';
import { query, queryOne, execute, batchWrite } from './db.js';
import { newId } from './ids.js';
import { HttpError } from './http.js';
import { requireUser } from './auth.js';
import { prefillSessionMethods, listMethods, mealScope } from './paymentMethods.js';

export type MealStatus =
  | 'draft'
  | 'collecting_orders'
  | 'finalized'
  | 'bill_entered'
  | 'company_claim_applied'
  | 'payment_requested'
  | 'closed';

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'supper', 'custom'];

// Allowed status transitions (README Section 10).
const TRANSITIONS: Record<MealStatus, MealStatus[]> = {
  draft: ['collecting_orders', 'finalized', 'closed'],
  collecting_orders: ['draft', 'finalized', 'closed'],
  finalized: ['collecting_orders', 'bill_entered', 'closed'],
  bill_entered: ['finalized', 'company_claim_applied', 'payment_requested', 'closed'],
  company_claim_applied: ['bill_entered', 'payment_requested', 'closed'],
  payment_requested: ['bill_entered', 'company_claim_applied', 'closed'],
  closed: ['payment_requested'],
};

type Input = Record<string, unknown>;
const asStr = (v: unknown): string | null => (typeof v === 'string' && v.length > 0 ? v : null);

/** remind_at = meal_date_time minus the lead, in UTC; null when off or no time. */
export function computeRemindAt(
  mealDateTime: string | null,
  leadMinutes: number,
  enabled: boolean,
): string | null {
  if (!enabled || !mealDateTime) return null;
  const t = new Date(mealDateTime).getTime();
  if (Number.isNaN(t)) return null;
  return new Date(t - leadMinutes * 60_000).toISOString().replace(/\.\d{3}Z$/, 'Z');
}

function mealTypeOrNull(v: unknown): string | null {
  if (v == null) return null;
  if (typeof v === 'string' && MEAL_TYPES.includes(v)) return v;
  throw new HttpError(400, 'invalid_meal_type', `mealType must be one of ${MEAL_TYPES.join(', ')}`);
}

export async function getMeal(mealId: string): Promise<Row | null> {
  return queryOne('SELECT * FROM meal_sessions WHERE id = ?', [mealId]);
}

export async function getMealForOwner(userId: string, mealId: string): Promise<Row> {
  const meal = await getMeal(mealId);
  if (!meal) throw new HttpError(404, 'not_found', 'Meal session not found');
  if (String(meal.owner_user_id) !== userId) {
    throw new HttpError(403, 'forbidden', 'Not your meal session');
  }
  return meal;
}

/** Handler helper: authenticate, then load + authorize the meal. */
export async function requireOwnedMeal(
  req: VercelRequest,
  mealId: string,
): Promise<{ user: Row; meal: Row }> {
  const user = await requireUser(req);
  const meal = await getMealForOwner(String(user.id), mealId);
  return { user, meal };
}

export async function getMealDetail(
  mealId: string,
): Promise<{ meal: Row; paymentMethods: Row[] }> {
  const meal = await getMeal(mealId);
  if (!meal) throw new HttpError(404, 'not_found', 'Meal session not found');
  const paymentMethods = await listMethods(mealScope(mealId));
  return { meal, paymentMethods };
}

export async function listMeals(
  userId: string,
  filters: { status?: string; q?: string },
): Promise<Row[]> {
  const where = ['owner_user_id = ?'];
  const args: (string | number)[] = [userId];
  if (filters.status) {
    where.push('status = ?');
    args.push(filters.status);
  }
  if (filters.q) {
    where.push('(title LIKE ? OR restaurant_name LIKE ?)');
    args.push(`%${filters.q}%`, `%${filters.q}%`);
  }
  return query(
    `SELECT * FROM meal_sessions WHERE ${where.join(' AND ')} ORDER BY created_at DESC`,
    args,
  );
}

export async function createMeal(user: Row, input: Input): Promise<Row> {
  const title = asStr(input.title);
  const restaurantName = asStr(input.restaurantName);
  if (!title) throw new HttpError(400, 'invalid_request', 'Meal title is required');
  if (!restaurantName) throw new HttpError(400, 'invalid_request', 'Restaurant name is required');

  const mealType = mealTypeOrNull(input.mealType);
  const farewellEnabled = input.farewellEnabled === true;
  const occasionType = farewellEnabled ? 'farewell' : 'normal';
  const mealDateTime = asStr(input.mealDateTime);
  const reminderEnabled = input.reminderEnabled !== false; // default on
  const reminderLeadMinutes =
    typeof input.reminderLeadMinutes === 'number' && input.reminderLeadMinutes >= 0
      ? input.reminderLeadMinutes
      : 120;
  const remindAt = computeRemindAt(mealDateTime, reminderLeadMinutes, reminderEnabled);

  const id = newId('meal');
  const insertMeal: InStatement = {
    sql: `INSERT INTO meal_sessions
      (id, owner_user_id, title, meal_type, occasion_type, farewell_enabled, restaurant_name,
       menu_url, meal_date_time, seat_details, organizer_name, organizer_contact, status,
       reminder_enabled, reminder_lead_minutes, remind_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?, ?)`,
    args: [
      id,
      String(user.id),
      title,
      mealType,
      occasionType,
      farewellEnabled ? 1 : 0,
      restaurantName,
      asStr(input.menuUrl),
      mealDateTime,
      asStr(input.seatDetails),
      asStr(input.organizerName) ?? (user.display_name as string | null),
      asStr(input.organizerContact) ?? (user.mobile_number as string | null),
      reminderEnabled ? 1 : 0,
      reminderLeadMinutes,
      remindAt,
    ],
  };

  const prefill = await prefillSessionMethods(id, String(user.id));
  await batchWrite([insertMeal, ...prefill]);
  return (await getMeal(id))!;
}

export async function updateMeal(userId: string, mealId: string, input: Input): Promise<Row> {
  const meal = await getMealForOwner(userId, mealId);

  const sets: string[] = [];
  const args: (string | number | null)[] = [];
  const set = (col: string, val: string | number | null): void => {
    sets.push(`${col} = ?`);
    args.push(val);
  };

  if ('title' in input) {
    const v = asStr(input.title);
    if (!v) throw new HttpError(400, 'invalid_request', 'Meal title cannot be empty');
    set('title', v);
  }
  if ('restaurantName' in input) {
    const v = asStr(input.restaurantName);
    if (!v) throw new HttpError(400, 'invalid_request', 'Restaurant name cannot be empty');
    set('restaurant_name', v);
  }
  if ('mealType' in input) set('meal_type', mealTypeOrNull(input.mealType));
  if ('farewellEnabled' in input) {
    const fe = input.farewellEnabled === true;
    set('farewell_enabled', fe ? 1 : 0);
    set('occasion_type', fe ? 'farewell' : 'normal');
  }
  if ('menuUrl' in input) set('menu_url', asStr(input.menuUrl));
  if ('seatDetails' in input) set('seat_details', asStr(input.seatDetails));
  if ('organizerName' in input) set('organizer_name', asStr(input.organizerName));
  if ('organizerContact' in input) set('organizer_contact', asStr(input.organizerContact));

  // Recompute remind_at from the resulting values if any input affects it.
  const affectsReminder =
    'mealDateTime' in input || 'reminderEnabled' in input || 'reminderLeadMinutes' in input;
  const mealDateTime = 'mealDateTime' in input ? asStr(input.mealDateTime) : (meal.meal_date_time as string | null);
  const reminderEnabled =
    'reminderEnabled' in input ? input.reminderEnabled !== false : Number(meal.reminder_enabled) === 1;
  const reminderLeadMinutes =
    'reminderLeadMinutes' in input && typeof input.reminderLeadMinutes === 'number' && input.reminderLeadMinutes >= 0
      ? input.reminderLeadMinutes
      : Number(meal.reminder_lead_minutes);
  if ('mealDateTime' in input) set('meal_date_time', mealDateTime);
  if ('reminderEnabled' in input) set('reminder_enabled', reminderEnabled ? 1 : 0);
  if ('reminderLeadMinutes' in input) set('reminder_lead_minutes', reminderLeadMinutes);
  if (affectsReminder) {
    set('remind_at', computeRemindAt(mealDateTime, reminderLeadMinutes, reminderEnabled));
    set('reminder_sent_at', null); // reschedule: allow the reminder to fire again
  }

  if (sets.length === 0) return meal;
  sets.push("updated_at = strftime('%Y-%m-%dT%H:%M:%SZ','now')"); // raw expr, no bound arg
  await execute(`UPDATE meal_sessions SET ${sets.join(', ')} WHERE id = ?`, [...args, mealId]);
  return (await getMeal(mealId))!;
}

export async function setStatus(userId: string, mealId: string, to: string): Promise<Row> {
  const meal = await getMealForOwner(userId, mealId);
  const from = String(meal.status) as MealStatus;
  if (TRANSITIONS[to as MealStatus] === undefined) {
    throw new HttpError(400, 'invalid_status', `Unknown status: ${to}`);
  }
  if (from !== to && !TRANSITIONS[from].includes(to as MealStatus)) {
    throw new HttpError(409, 'invalid_transition', `Cannot move from ${from} to ${to}`);
  }
  await execute(
    "UPDATE meal_sessions SET status = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%SZ','now') WHERE id = ?",
    [to, mealId],
  );
  return (await getMeal(mealId))!;
}

export async function finalizeMeal(userId: string, mealId: string): Promise<Row> {
  return setStatus(userId, mealId, 'finalized');
}

export async function closeMeal(userId: string, mealId: string): Promise<Row> {
  return setStatus(userId, mealId, 'closed');
}

export async function deleteMeal(userId: string, mealId: string): Promise<void> {
  await getMealForOwner(userId, mealId);
  // Explicit dependency-ordered delete (FK enforcement is not guaranteed on
  // remote libSQL). Blob objects for uploaded_files are cleaned up separately.
  await batchWrite([
    {
      sql: 'DELETE FROM order_items WHERE participant_order_id IN (SELECT id FROM participant_orders WHERE meal_session_id = ?)',
      args: [mealId],
    },
    { sql: 'DELETE FROM payment_status_events WHERE meal_session_id = ?', args: [mealId] },
    { sql: 'DELETE FROM payment_results WHERE meal_session_id = ?', args: [mealId] },
    { sql: 'DELETE FROM participant_orders WHERE meal_session_id = ?', args: [mealId] },
    { sql: 'DELETE FROM menu_items WHERE meal_session_id = ?', args: [mealId] },
    { sql: 'DELETE FROM bill_adjustments WHERE meal_session_id = ?', args: [mealId] },
    { sql: 'DELETE FROM payment_methods WHERE meal_session_id = ?', args: [mealId] },
    { sql: 'DELETE FROM uploaded_files WHERE meal_session_id = ?', args: [mealId] },
    { sql: 'DELETE FROM meal_sessions WHERE id = ?', args: [mealId] },
  ]);
}
