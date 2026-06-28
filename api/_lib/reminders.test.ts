import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { rmSync } from 'node:fs';
import type { Row } from '@libsql/client';
import { setupTestDb } from './testdb.js';
import { execute } from './db.js';
import { upsertUser } from './auth.js';
import { createMeal } from './meals.js';
import { findDueSessions } from './reminders.js';

let dbFile: string;
let org: Row;

before(async () => {
  dbFile = await setupTestDb();
  org = await upsertUser({ provider: 'google', providerUserId: 'rem-org', displayName: 'Org', email: 'o@x.com' });
});
after(() => {
  try {
    rmSync(dbFile, { force: true });
  } catch {
    /* ignore */
  }
});

test('findDueSessions returns only due, unsent, still-collecting sessions', async () => {
  const due = await createMeal(org, { title: 'Due', restaurantName: 'R' });
  const future = await createMeal(org, { title: 'Future', restaurantName: 'R' });
  const sent = await createMeal(org, { title: 'Sent', restaurantName: 'R' });
  const finalized = await createMeal(org, { title: 'Finalized', restaurantName: 'R' });

  await execute("UPDATE meal_sessions SET remind_at = '2026-06-27T00:00:00Z', status = 'collecting_orders' WHERE id = ?", [String(due.id)]);
  await execute("UPDATE meal_sessions SET remind_at = '2030-01-01T00:00:00Z', status = 'collecting_orders' WHERE id = ?", [String(future.id)]);
  await execute("UPDATE meal_sessions SET remind_at = '2026-06-27T00:00:00Z', reminder_sent_at = '2026-06-27T01:00:00Z' WHERE id = ?", [String(sent.id)]);
  await execute("UPDATE meal_sessions SET remind_at = '2026-06-27T00:00:00Z', status = 'finalized' WHERE id = ?", [String(finalized.id)]);

  const ids = (await findDueSessions('2026-06-28T00:00:00Z')).map((r) => String(r.id));
  assert.ok(ids.includes(String(due.id)), 'due session found');
  assert.ok(!ids.includes(String(future.id)), 'future excluded');
  assert.ok(!ids.includes(String(sent.id)), 'already-sent excluded');
  assert.ok(!ids.includes(String(finalized.id)), 'finalized excluded');
});
