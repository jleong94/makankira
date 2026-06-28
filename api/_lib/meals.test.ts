import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { rmSync } from 'node:fs';
import type { Row } from '@libsql/client';
import { setupTestDb } from './testdb.js';
import { upsertUser } from './auth.js';
import { addMethod, listMethods, userScope, mealScope } from './paymentMethods.js';
import {
  createMeal,
  listMeals,
  getMeal,
  getMealForOwner,
  updateMeal,
  setStatus,
  finalizeMeal,
  deleteMeal,
  normalizeRemindAt,
} from './meals.js';
import { HttpError } from './http.js';

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

test('normalizeRemindAt stores UTC and rejects past / after-meal', () => {
  const now = Date.parse('2026-06-28T00:00:00Z');
  const meal = '2099-06-26T12:30:00+08:00';
  assert.equal(normalizeRemindAt('2099-06-26T10:30:00+08:00', true, meal, now), '2099-06-26T02:30:00Z');
  assert.equal(normalizeRemindAt('2099-06-26T10:30:00+08:00', false, meal, now), null); // disabled
  assert.equal(normalizeRemindAt(null, true, meal, now), null); // no time set
  assert.throws(() => normalizeRemindAt('2000-01-01T00:00:00Z', true, meal, now), /future/i);
  assert.throws(() => normalizeRemindAt('2099-06-26T13:00:00+08:00', true, meal, now), /earlier/i);
});

test('createMeal prefills payment methods and the organizer profile', async () => {
  const meal = await createMeal(org, {
    title: 'Friday Team Lunch',
    restaurantName: 'ABC Chicken Rice',
    mealDateTime: '2099-06-26T12:30:00+08:00',
    reminderEnabled: true,
    remindAt: '2099-06-26T10:30:00+08:00',
  });
  assert.equal(meal.status, 'draft');
  assert.equal(meal.remind_at, '2099-06-26T02:30:00Z');
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

test('updateMeal updates remind_at; list search matches', async () => {
  const meal = await createMeal(org, {
    title: 'Lunch A',
    restaurantName: 'R',
    mealDateTime: '2099-06-26T12:30:00+08:00',
    remindAt: '2099-06-26T10:30:00+08:00',
  });
  const updated = await updateMeal(String(org.id), String(meal.id), {
    title: 'Lunch B',
    remindAt: '2099-06-26T11:30:00+08:00',
  });
  assert.equal(updated.title, 'Lunch B');
  assert.equal(updated.remind_at, '2099-06-26T03:30:00Z');

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
