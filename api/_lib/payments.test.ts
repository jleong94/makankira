import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { rmSync } from 'node:fs';
import type { Row } from '@libsql/client';
import { setupTestDb } from './testdb';
import { upsertUser } from './auth';
import { createMeal } from './meals';
import { addMenuItem } from './menu';
import { createOrder } from './orders';
import { addMethod, mealScope } from './paymentMethods';
import { upsertBill } from './bill';
import { runCalculation } from './calculate';
import { listResults, getResult, markPaid, markPending, overrideResult, listEvents } from './payments';
import { buildRequests } from './paymentRequests';

let dbFile: string;
let org: Row;
let mealId: string;
let aliceResultId: string;

before(async () => {
  dbFile = await setupTestDb();
  org = await upsertUser({ provider: 'google', providerUserId: 'pay-org', displayName: 'Org' });
  const meal = await createMeal(org, { title: 'Team Lunch', restaurantName: 'ABC' });
  mealId = String(meal.id);
  await addMethod(mealScope(mealId), { methodType: 'duitnow_id', duitNowId: '0123456789' });
  const chicken = await addMenuItem(mealId, { name: 'Chicken Rice', actualPriceCents: 1000 });
  await createOrder(mealId, {
    participantName: 'Alice',
    mobileNumber: '0123456789',
    items: [{ menuItemId: chicken.id, quantity: 1 }],
  });
  await upsertBill(mealId, { calculationMode: 'item_based', finalBillAmountCents: 1000 });
  await runCalculation(mealId);
  aliceResultId = String((await listResults(mealId))[0]!.id);
});

after(() => {
  try {
    rmSync(dbFile, { force: true });
  } catch {
    /* ignore */
  }
});

test('mark-paid then mark-pending update status and log events', async () => {
  const paid = await markPaid(mealId, aliceResultId, null, String(org.id));
  assert.equal(paid.payment_status, 'paid');
  assert.ok(paid.paid_at, 'paid_at set');

  const pending = await markPending(mealId, aliceResultId, String(org.id));
  assert.equal(pending.payment_status, 'pending');
  assert.equal(pending.paid_at, null);

  const events = await listEvents(mealId);
  const types = events.map((e) => String(e.event_type));
  assert.ok(types.includes('marked_paid'));
  assert.ok(types.includes('marked_pending'));
});

test('override sets is_manual_override and logs the new amount', async () => {
  const overridden = await overrideResult(mealId, aliceResultId, { totalDueCents: 777, note: 'goodwill' }, String(org.id));
  assert.equal(Number(overridden.total_due_cents), 777);
  assert.equal(Number(overridden.is_manual_override), 1);

  const event = (await listEvents(mealId)).find((e) => e.event_type === 'amount_overridden');
  assert.ok(event);
  assert.equal(Number(event!.amount_cents), 777);
  assert.equal(String(event!.note), 'goodwill');
});

test('payment request: message, wa.me link, and method details', async () => {
  // reset Alice to a clean computed state for a predictable message
  await runCalculation(mealId);
  const result = await getResult(mealId, aliceResultId);
  // override test set is_manual_override; runCalculation preserves it — clear for this check
  if (Number(result.is_manual_override) === 1) {
    await overrideResult(mealId, aliceResultId, { totalDueCents: 1000 }, String(org.id));
  }

  const reqs = await buildRequests(mealId, 'en');
  assert.equal(reqs.length, 1);
  const r = reqs[0]!;
  assert.equal(r.participantName, 'Alice');
  assert.match(r.message, /Alice/);
  assert.match(r.message, /RM 10\.00/);
  assert.match(r.message, /DuitNow ID: 0123456789/);
  assert.equal(r.whatsappUrl, `https://wa.me/60123456789?text=${encodeURIComponent(r.message)}`);
});

test('payment request greeting is localized', async () => {
  const ms = (await buildRequests(mealId, 'ms'))[0]!;
  assert.match(ms.message, /^Hai Alice/);
  const zh = (await buildRequests(mealId, 'zh'))[0]!;
  assert.match(zh.message, /Alice 您好/);
});
