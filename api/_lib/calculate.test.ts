import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { rmSync } from 'node:fs';
import type { Row } from '@libsql/client';
import { setupTestDb } from './testdb';
import { execute } from './db';
import { upsertUser } from './auth';
import { createMeal } from './meals';
import { addMenuItem } from './menu';
import { createOrder } from './orders';
import { upsertBill } from './bill';
import { runCalculation } from './calculate';
import { listResults } from './payments';

let dbFile: string;
let org: Row;

before(async () => {
  dbFile = await setupTestDb();
  org = await upsertUser({ provider: 'google', providerUserId: 'calc-org', displayName: 'Org' });
});
after(() => {
  try {
    rmSync(dbFile, { force: true });
  } catch {
    /* ignore */
  }
});

const byOrder = (results: Row[]): Map<string, Row> =>
  new Map(results.map((r) => [String(r.participant_order_id), r]));

test('end-to-end farewell calculation persists correct payment_results', async () => {
  const meal = await createMeal(org, { title: 'Farewell Lunch', restaurantName: 'R', farewellEnabled: true });
  const mealId = String(meal.id);

  const chicken = await addMenuItem(mealId, { name: 'Chicken Rice', actualPriceCents: 1000 });
  const tea = await addMenuItem(mealId, { name: 'Iced Tea', actualPriceCents: 400 });

  const orgOrder = await createOrder(mealId, {
    participantName: 'Org',
    participantUserId: String(org.id),
    mobileNumber: '0123456789',
    items: [{ menuItemId: chicken.id, quantity: 1 }],
  });
  const aliceOrder = await createOrder(mealId, {
    participantName: 'Alice',
    mobileNumber: '0123456788',
    items: [
      { menuItemId: chicken.id, quantity: 1 },
      { menuItemId: tea.id, quantity: 1 },
    ],
  });
  const benOrder = await createOrder(mealId, {
    participantName: 'Ben',
    participantRole: 'farewell_honoree',
    mobileNumber: '0123456787',
    items: [{ menuItemId: tea.id, quantity: 1 }],
  });

  await upsertBill(mealId, { calculationMode: 'farewell', finalBillAmountCents: 2800 });

  const { summary } = (await runCalculation(mealId)) as { summary: { calculatedTotalCents: number; mismatchCents: number } };
  assert.equal(summary.calculatedTotalCents, 2800);
  assert.equal(summary.mismatchCents, 0);

  const results = byOrder(await listResults(mealId));
  const orgR = results.get(String(orgOrder.order.id))!;
  const aliceR = results.get(String(aliceOrder.order.id))!;
  const benR = results.get(String(benOrder.order.id))!;

  // Honoree's 400 shared equally (200 each) across the two paying participants.
  assert.equal(Number(orgR.subtotal_cents), 1000);
  assert.equal(Number(orgR.farewell_sponsored_share_cents), 200);
  assert.equal(Number(orgR.total_due_cents), 1200);

  assert.equal(Number(aliceR.subtotal_cents), 1400);
  assert.equal(Number(aliceR.farewell_sponsored_share_cents), 200);
  assert.equal(Number(aliceR.total_due_cents), 1600);

  assert.equal(benR.participant_role, 'farewell_honoree');
  assert.equal(Number(benR.total_due_cents), 0);

  const collected =
    Number(orgR.total_due_cents) + Number(aliceR.total_due_cents) + Number(benR.total_due_cents);
  assert.equal(collected, 2800);

  // A manual override survives a recompute.
  await execute(
    'UPDATE payment_results SET is_manual_override = 1, total_due_cents = 9999 WHERE meal_session_id = ? AND participant_order_id = ?',
    [mealId, String(aliceOrder.order.id)],
  );
  await runCalculation(mealId);
  const after = byOrder(await listResults(mealId));
  assert.equal(Number(after.get(String(aliceOrder.order.id))!.total_due_cents), 9999, 'override preserved');
  assert.equal(Number(after.get(String(orgOrder.order.id))!.total_due_cents), 1200, 'others recomputed');
});

test('calculate refuses to run when an ordered item has no actual price', async () => {
  const meal = await createMeal(org, { title: 'Unpriced', restaurantName: 'R' });
  const mealId = String(meal.id);
  const item = await addMenuItem(mealId, { name: 'Mystery', estimatedPriceCents: 500 }); // no actual price
  await createOrder(mealId, {
    participantName: 'Pat',
    mobileNumber: '0123456789',
    items: [{ menuItemId: item.id, quantity: 1 }],
  });
  await assert.rejects(() => runCalculation(mealId), /actual price/i);
});
