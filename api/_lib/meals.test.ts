import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { rmSync } from 'node:fs';
import type { Row } from '@libsql/client';
import { setupTestDb } from './testdb';
import { upsertUser } from './auth';
import { addMethod, listMethods, userScope, mealScope } from './paymentMethods';
import {
  createMeal,
  listMeals,
  getMeal,
  getMealForOwner,
  updateMeal,
  setStatus,
  finalizeMeal,
  deleteMeal,
  computeRemindAt,
} from './meals';
import { HttpError } from './http';

let dbFile: string;
let org: Row;
let other: Row;

before(async () => {
  dbFile = await setupTestDb();
  org = await upsertUser({
    provider: 'google',
    providerUserId: 'org-1',
    displayName: 'Organizer',
    email: 'o@x.com',
  });
  other = await upsertUser({ provider: 'google', providerUserId: 'other-1', displayName: 'Other' });
  // One saved account default that new meals should inherit.
  await addMethod(userScope(String(org.id)), {
    methodType: 'duitnow_id',
    duitNowId: '0123456789',
    isDefault: true,
  });
});

after(() => {
  try {
    rmSync(dbFile, { force: true });
  } catch {
    /* ignore */
  }
});

test('computeRemindAt subtracts the lead in UTC', () => {
  assert.equal(computeRemindAt('2026-06-26T12:30:00+08:00', 120, true), '2026-06-26T02:30:00Z');
  assert.equal(computeRemindAt('2026-06-26T12:30:00+08:00', 120, false), null);
  assert.equal(computeRemindAt(null, 120, true), null);
});

test('createMeal prefills payment methods and the organizer profile', async () => {
  const meal = await createMeal(org, {
    title: 'Friday Team Lunch',
    restaurantName: 'ABC Chicken Rice',
    mealDateTime: '2026-06-26T12:30:00+08:00',
    reminderEnabled: true,
    reminderLeadMinutes: 120,
  });
  assert.equal(meal.status, 'draft');
  assert.equal(meal.remind_at, '2026-06-26T02:30:00Z');
  assert.equal(meal.organizer_name, 'Organizer');

  const methods = await listMethods(mealScope(String(meal.id)));
  assert.equal(methods.length, 1);
  assert.equal(methods[0]!.duitnow_id, '0123456789');
});

test('ownership: another user cannot access the meal', async () => {
  const meal = await createMeal(org, { title: 'Private', restaurantName: 'R' });
  await assert.rejects(
    () => getMealForOwner(String(other.id), String(meal.id)),
    (e: unknown) => e instanceof HttpError && e.status === 403,
  );
});

test('updateMeal recomputes remind_at; list search matches', async () => {
  const meal = await createMeal(org, {
    title: 'Lunch A',
    restaurantName: 'R',
    mealDateTime: '2026-06-26T12:30:00+08:00',
    reminderLeadMinutes: 120,
  });
  const updated = await updateMeal(String(org.id), String(meal.id), {
    title: 'Lunch B',
    reminderLeadMinutes: 60,
  });
  assert.equal(updated.title, 'Lunch B');
  assert.equal(updated.remind_at, '2026-06-26T03:30:00Z');

  const found = await listMeals(String(org.id), { q: 'Lunch B' });
  assert.ok(found.some((m) => m.id === meal.id));
});

test('status transitions are guarded', async () => {
  const meal = await createMeal(org, { title: 'Flow', restaurantName: 'R' });
  assert.equal((await setStatus(String(org.id), String(meal.id), 'collecting_orders')).status, 'collecting_orders');
  assert.equal((await finalizeMeal(String(org.id), String(meal.id))).status, 'finalized');
  await assert.rejects(
    () => setStatus(String(org.id), String(meal.id), 'draft'),
    (e: unknown) => e instanceof HttpError && e.status === 409,
  );
});

test('deleteMeal removes the meal and its payment methods', async () => {
  const meal = await createMeal(org, { title: 'Doomed', restaurantName: 'R' });
  assert.equal((await listMethods(mealScope(String(meal.id)))).length, 1);
  await deleteMeal(String(org.id), String(meal.id));
  assert.equal(await getMeal(String(meal.id)), null);
  assert.equal((await listMethods(mealScope(String(meal.id)))).length, 0);
});
