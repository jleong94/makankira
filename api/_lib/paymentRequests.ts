/**
 * paymentRequests.ts — per-participant payment messages (README Section 6,
 * Screen 9). Localized labels (en/zh/ms); a free wa.me click-to-chat link with
 * the message pre-filled; the DuitNow QR included as a Blob URL link (the
 * click-to-chat link carries text only, not attachments).
 */

import type { Row } from '@libsql/client';
import { query, queryOne } from './db';
import { HttpError } from './http';
import { formatRM } from './money';
import { paymentLabels, type PaymentLabels } from './i18n';

export interface PaymentRequest {
  resultId: string;
  participantName: string;
  mobileNumber: string | null;
  totalDueCents: number;
  message: string;
  whatsappUrl: string | null;
  qrImageUrl: string | null;
  paymentReference: string | null;
}

interface Context {
  mealTitle: string;
  methods: Row[];
}

async function loadContext(mealId: string): Promise<Context> {
  const meal = await queryOne('SELECT id, title FROM meal_sessions WHERE id = ?', [mealId]);
  if (!meal) throw new HttpError(404, 'not_found', 'Meal session not found');
  const methods = await query(
    `SELECT pm.method_type, pm.account_name, pm.bank_name, pm.account_number, pm.duitnow_id,
            pm.instructions, uf.blob_url
       FROM payment_methods pm
       LEFT JOIN uploaded_files uf ON pm.qr_image_file_id = uf.id
      WHERE pm.meal_session_id = ?
      ORDER BY pm.sort_order`,
    [mealId],
  );
  return { mealTitle: String(meal.title), methods };
}

function methodLines(methods: Row[]): string[] {
  const lines: string[] = [];
  for (const m of methods) {
    switch (String(m.method_type)) {
      case 'bank_account':
        lines.push(
          [m.bank_name, m.account_number, m.account_name ? `(${String(m.account_name)})` : '']
            .filter(Boolean)
            .map(String)
            .join(' '),
        );
        break;
      case 'duitnow_id':
        lines.push(`DuitNow ID: ${String(m.duitnow_id ?? '')}`);
        break;
      case 'custom':
        if (m.instructions) lines.push(String(m.instructions));
        break;
      // duitnow_qr is surfaced as qrImageUrl
    }
  }
  return lines;
}

function qrImageUrl(methods: Row[]): string | null {
  const qr = methods.find((m) => String(m.method_type) === 'duitnow_qr' && m.blob_url);
  return qr ? String(qr.blob_url) : null;
}

async function itemLines(orderId: string | null): Promise<string[]> {
  if (!orderId) return [];
  const items = await query(
    `SELECT mi.name, oi.quantity, COALESCE(mi.actual_price_cents, mi.estimated_price_cents, 0) AS price
       FROM order_items oi
       JOIN menu_items mi ON oi.menu_item_id = mi.id
      WHERE oi.participant_order_id = ?
      ORDER BY oi.created_at`,
    [orderId],
  );
  return items.map(
    (it) => `- ${String(it.name)} x${Number(it.quantity)}: ${formatRM(Number(it.price) * Number(it.quantity))}`,
  );
}

function buildMessage(L: PaymentLabels, mealTitle: string, r: Row, lines: string[], methods: Row[]): string {
  const total = Number(r.total_due_cents);
  const share = Number(r.farewell_sponsored_share_cents);
  const taxService = Number(r.tax_cents) + Number(r.service_charge_cents);
  const discount = Number(r.discount_cents);
  const claim = Number(r.company_claim_cents);

  const out: string[] = [L.greeting(String(r.participant_name), mealTitle, formatRM(total)), '', L.items, ...lines];
  if (share > 0) out.push(`- ${L.farewellShare}: ${formatRM(share)}`);
  if (taxService > 0) out.push(`- ${L.taxService}: ${formatRM(taxService)}`);
  if (discount > 0) out.push(`- ${L.discount}: -${formatRM(discount)}`);
  if (claim > 0) out.push(`- ${L.companyClaim}: -${formatRM(claim)}`);

  out.push('', L.transferTo, ...methodLines(methods));
  const qr = qrImageUrl(methods);
  if (qr) out.push(`${L.scanQr} ${qr}`);
  out.push('', `${L.reference}: ${String(r.payment_reference ?? '')}`);
  return out.join('\n');
}

async function toRequest(L: PaymentLabels, ctx: Context, r: Row): Promise<PaymentRequest> {
  const lines = await itemLines(r.participant_order_id != null ? String(r.participant_order_id) : null);
  const message = buildMessage(L, ctx.mealTitle, r, lines, ctx.methods);
  const mobile = r.mobile_number ? String(r.mobile_number) : null;
  return {
    resultId: String(r.id),
    participantName: String(r.participant_name),
    mobileNumber: mobile,
    totalDueCents: Number(r.total_due_cents),
    message,
    whatsappUrl: mobile ? `https://wa.me/${mobile}?text=${encodeURIComponent(message)}` : null,
    qrImageUrl: qrImageUrl(ctx.methods),
    paymentReference: r.payment_reference ? String(r.payment_reference) : null,
  };
}

export async function buildRequests(mealId: string, locale: string): Promise<PaymentRequest[]> {
  const L = paymentLabels(locale);
  const ctx = await loadContext(mealId);
  const results = await query(
    `SELECT * FROM payment_results
      WHERE meal_session_id = ? AND participant_role = 'paying_participant' AND total_due_cents > 0
      ORDER BY created_at`,
    [mealId],
  );
  const out: PaymentRequest[] = [];
  for (const r of results) out.push(await toRequest(L, ctx, r));
  return out;
}

export async function buildRequest(mealId: string, resultId: string, locale: string): Promise<PaymentRequest> {
  const L = paymentLabels(locale);
  const ctx = await loadContext(mealId);
  const r = await queryOne('SELECT * FROM payment_results WHERE id = ? AND meal_session_id = ?', [resultId, mealId]);
  if (!r) throw new HttpError(404, 'not_found', 'Payment result not found');
  return toRequest(L, ctx, r);
}
