/**
 * exports.ts — Excel/CSV generation (README Section 7). Sheet labels follow the
 * organizer's locale; user-entered content (names, items, remarks) is verbatim.
 */

import ExcelJS from 'exceljs';
import { query, queryOne } from './db';
import { HttpError } from './http';
import { exportLabels } from './i18n';
import { orderSummary } from './orders';
import { buildRequests } from './paymentRequests';

const rm = (cents: unknown): number => Number(cents ?? 0) / 100;

async function loadMeal(mealId: string) {
  const meal = await queryOne('SELECT * FROM meal_sessions WHERE id = ?', [mealId]);
  if (!meal) throw new HttpError(404, 'not_found', 'Meal session not found');
  return meal;
}

async function toBuffer(wb: ExcelJS.Workbook): Promise<Buffer> {
  return Buffer.from((await wb.xlsx.writeBuffer()) as ArrayBuffer);
}

export async function buildRestaurantOrderWorkbook(mealId: string, locale: string): Promise<Buffer> {
  const L = exportLabels(locale);
  const meal = await loadMeal(mealId);
  const wb = new ExcelJS.Workbook();

  const info = wb.addWorksheet(L.title_mealInfo);
  info.addRows([
    [L.col_restaurant, meal.restaurant_name],
    [L.col_meal, meal.title],
    [L.col_dateTime, meal.meal_date_time],
    [L.col_seat, meal.seat_details],
    [L.col_organizer, meal.organizer_name],
    [L.col_contact, meal.organizer_contact],
  ]);

  const rs = wb.addWorksheet(L.title_restaurantSummary);
  rs.addRow([L.col_item, L.col_totalQty, L.col_remarks]);
  const summary = (await orderSummary(mealId, 'restaurant')) as {
    itemName: string;
    totalQty: number;
    remarksSummary: string;
  }[];
  for (const s of summary) rs.addRow([s.itemName, s.totalQty, s.remarksSummary]);

  const io = wb.addWorksheet(L.title_individualOrders);
  io.addRow([L.col_participant, L.col_item, L.col_quantity, L.col_remarks]);
  const lines = await query(
    `SELECT po.participant_name, mi.name AS item_name, oi.quantity, oi.remarks
       FROM order_items oi
       JOIN participant_orders po ON oi.participant_order_id = po.id
       JOIN menu_items mi ON oi.menu_item_id = mi.id
      WHERE po.meal_session_id = ? ORDER BY po.created_at, mi.sort_order`,
    [mealId],
  );
  for (const l of lines) io.addRow([l.participant_name, l.item_name, Number(l.quantity), l.remarks]);

  const mr = wb.addWorksheet(L.title_menuReference);
  mr.addRow([L.col_itemCode, L.col_itemName, L.col_category, L.col_estimatedPrice, L.col_actualPrice, L.col_available, L.col_menuUrl]);
  const menu = await query('SELECT * FROM menu_items WHERE meal_session_id = ? ORDER BY sort_order', [mealId]);
  for (const m of menu) {
    mr.addRow([
      m.item_code,
      m.name,
      m.category,
      m.estimated_price_cents != null ? rm(m.estimated_price_cents) : null,
      m.actual_price_cents != null ? rm(m.actual_price_cents) : null,
      Number(m.available) === 1 ? L.yes : L.no,
      m.menu_url,
    ]);
  }

  return toBuffer(wb);
}

export async function buildPaymentCalculationWorkbook(mealId: string, locale: string): Promise<Buffer> {
  const L = exportLabels(locale);
  await loadMeal(mealId);
  const wb = new ExcelJS.Workbook();

  const ps = wb.addWorksheet(L.title_paymentSummary);
  ps.addRow([
    L.col_participant, L.col_mobile, L.col_subtotal, L.col_tax, L.col_serviceCharge, L.col_discount,
    L.col_companyClaim, L.col_role, L.col_farewellShare, L.col_rounding, L.col_totalDue, L.col_status, L.col_reference,
  ]);
  const results = await query('SELECT * FROM payment_results WHERE meal_session_id = ? ORDER BY created_at', [mealId]);
  for (const r of results) {
    ps.addRow([
      r.participant_name, r.mobile_number, rm(r.subtotal_cents), rm(r.tax_cents), rm(r.service_charge_cents),
      rm(r.discount_cents), rm(r.company_claim_cents), r.participant_role, rm(r.farewell_sponsored_share_cents),
      rm(r.rounding_adjustment_cents), rm(r.total_due_cents), r.payment_status, r.payment_reference,
    ]);
  }

  const pd = wb.addWorksheet(L.title_participantDetails);
  pd.addRow([L.col_participant, L.col_item, L.col_quantity, L.col_unitPrice, L.col_lineTotal, L.col_remarks]);
  const detail = await query(
    `SELECT po.participant_name, mi.name AS item_name, oi.quantity, oi.remarks,
            COALESCE(mi.actual_price_cents, mi.estimated_price_cents, 0) AS price
       FROM order_items oi
       JOIN participant_orders po ON oi.participant_order_id = po.id
       JOIN menu_items mi ON oi.menu_item_id = mi.id
      WHERE po.meal_session_id = ? ORDER BY po.created_at, mi.sort_order`,
    [mealId],
  );
  for (const d of detail) {
    pd.addRow([
      d.participant_name, d.item_name, Number(d.quantity), rm(d.price),
      rm(Number(d.price) * Number(d.quantity)), d.remarks,
    ]);
  }

  const ip = wb.addWorksheet(L.title_itemPrices);
  ip.addRow([L.col_itemCode, L.col_itemName, L.col_actualPrice]);
  const menu = await query('SELECT * FROM menu_items WHERE meal_session_id = ? ORDER BY sort_order', [mealId]);
  for (const m of menu) ip.addRow([m.item_code, m.name, m.actual_price_cents != null ? rm(m.actual_price_cents) : null]);

  const adj = wb.addWorksheet(L.title_adjustments);
  adj.addRow([L.col_field, L.col_value]);
  const bill = await queryOne('SELECT * FROM bill_adjustments WHERE meal_session_id = ?', [mealId]);
  if (bill) {
    adj.addRows([
      [L.col_calculationMode, bill.calculation_mode],
      [L.col_tax, rm(bill.tax_amount_cents)],
      [L.col_serviceCharge, rm(bill.service_charge_amount_cents)],
      [L.col_discount, rm(bill.discount_amount_cents)],
      [L.col_companyClaim, rm(bill.company_claim_amount_cents)],
      [L.col_finalBill, bill.final_bill_amount_cents != null ? rm(bill.final_bill_amount_cents) : null],
      [L.col_rounding, rm(bill.rounding_adjustment_cents)],
    ]);
  }

  const msg = wb.addWorksheet(L.title_messages);
  msg.addRow([L.col_participant, L.col_mobile, L.col_totalDue, L.col_reference, L.col_message]);
  const requests = await buildRequests(mealId, locale);
  for (const req of requests) {
    msg.addRow([req.participantName, req.mobileNumber, rm(req.totalDueCents), req.paymentReference, req.message]);
  }

  return toBuffer(wb);
}

function csvCell(v: unknown): string {
  const s = v == null ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function buildPaymentRequestsCsv(mealId: string, locale: string): Promise<string> {
  const L = exportLabels(locale);
  await loadMeal(mealId);
  const requests = await buildRequests(mealId, locale);
  const rows = [[L.col_participant, L.col_mobile, L.col_totalDue, L.col_reference, L.col_message]];
  for (const r of requests) {
    rows.push([r.participantName, r.mobileNumber ?? '', String(rm(r.totalDueCents)), r.paymentReference ?? '', r.message]);
  }
  return rows.map((cells) => cells.map(csvCell).join(',')).join('\r\n');
}

/** Menu import template — fixed snake_case headers the importer reads back. */
export async function buildMenuTemplateWorkbook(): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Menu');
  ws.addRow(['item_code', 'item_name', 'category', 'description', 'estimated_price', 'menu_url', 'image_url', 'available']);
  ws.addRow(['A01', 'Chicken Rice', 'Main', 'Roasted chicken with rice', 9.5, '', '', 'Yes']);
  return toBuffer(wb);
}
