import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { rmSync } from 'node:fs';
import ExcelJS from 'exceljs';
import type { Row } from '@libsql/client';
import { setupTestDb } from './testdb.js';
import { upsertUser } from './auth.js';
import { createMeal } from './meals.js';
import { addMenuItem } from './menu.js';
import { createOrder } from './orders.js';
import { addMethod, mealScope } from './paymentMethods.js';
import { upsertBill } from './bill.js';
import { runCalculation } from './calculate.js';
import {
  buildRestaurantOrderWorkbook,
  buildPaymentCalculationWorkbook,
  buildPaymentRequestsCsv,
  buildMenuTemplateWorkbook,
} from './exports.js';

let dbFile: string;
let org: Row;
let mealId: string;

before(async () => {
  dbFile = await setupTestDb();
  org = await upsertUser({ provider: 'google', providerUserId: 'exp-org', displayName: 'Org' });
  const meal = await createMeal(org, { title: 'Team Lunch', restaurantName: 'ABC Chicken Rice' });
  mealId = String(meal.id);
  await addMethod(mealScope(mealId), { methodType: 'duitnow_id', duitNowId: '0123456789' });
  const chicken = await addMenuItem(mealId, { name: 'Chicken Rice', actualPriceCents: 1000 });
  await createOrder(mealId, {
    participantName: 'Alice',
    mobileNumber: '0123456789',
    items: [{ menuItemId: chicken.id, quantity: 1, remarks: 'No cucumber' }],
  });
  await upsertBill(mealId, { calculationMode: 'item_based', finalBillAmountCents: 1000 });
  await runCalculation(mealId);
});

after(() => {
  try {
    rmSync(dbFile, { force: true });
  } catch {
    /* ignore */
  }
});

async function load(buf: Buffer): Promise<ExcelJS.Workbook> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buf as unknown as ArrayBuffer);
  return wb;
}

test('restaurant order workbook has the expected sheets and data', async () => {
  const wb = await load(await buildRestaurantOrderWorkbook(mealId, 'en'));
  assert.equal(wb.getWorksheet('Meal Info')!.getRow(1).getCell(2).value, 'ABC Chicken Rice');
  const rs = wb.getWorksheet('Restaurant Summary')!;
  assert.equal(rs.getRow(2).getCell(1).value, 'Chicken Rice');
  assert.equal(rs.getRow(2).getCell(2).value, 1);
  assert.equal(wb.getWorksheet('Individual Orders')!.getRow(2).getCell(1).value, 'Alice');
});

test('payment calculation workbook lists the participant total', async () => {
  const wb = await load(await buildPaymentCalculationWorkbook(mealId, 'en'));
  const ps = wb.getWorksheet('Payment Summary')!;
  assert.equal(ps.getRow(2).getCell(1).value, 'Alice');
  assert.equal(ps.getRow(2).getCell(11).value, 10); // total due column, RM 10.00
});

test('payment requests CSV contains the participant and message', async () => {
  const csv = await buildPaymentRequestsCsv(mealId, 'en');
  assert.match(csv, /Alice/);
  assert.match(csv, /RM 10\.00/);
});

test('menu template has the import header row', async () => {
  const wb = await load(await buildMenuTemplateWorkbook());
  assert.equal(wb.getWorksheet('Menu')!.getRow(1).getCell(1).value, 'item_code');
});

test('export labels are localized (Malay sheet name)', async () => {
  const wb = await load(await buildRestaurantOrderWorkbook(mealId, 'ms'));
  assert.ok(wb.getWorksheet('Ringkasan Restoran'), 'Malay sheet name present');
});
