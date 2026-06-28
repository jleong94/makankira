/**
 * Single API function (README Section 17).
 *
 * vercel.json rewrites every /api/* request to /api?__path=<rest>, so the whole
 * backend is ONE Vercel serverless function (api/index.ts) — within the Hobby
 * plan's 12-function limit. Business logic lives in _lib/*; this file parses the
 * path, enforces method + CSRF, and calls the right domain function.
 */

import { buffer } from 'node:stream/consumers';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { Row } from '@libsql/client';
import { withErrors, assertSameOrigin, bodyObject, requireString, sendJson, HttpError } from './_lib/http';
import {
  verifyProvider,
  upsertUser,
  createSessionToken,
  setSessionCookie,
  clearSessionCookie,
  getSessionUser,
  requireUser,
} from './_lib/auth';
import { updateProfile } from './_lib/profile';
import {
  toUser,
  toMealSession,
  toPaymentMethod,
  toMenuItem,
  toOrder,
  toBillAdjustment,
  toPaymentResult,
  toPaymentStatusEvent,
  toUploadedFile,
  toPushSubscription,
} from './_lib/serializers';
import {
  createMeal,
  listMeals,
  getMealDetail,
  updateMeal,
  deleteMeal,
  finalizeMeal,
  closeMeal,
  setStatus,
  requireOwnedMeal,
  getMealForOwner,
} from './_lib/meals';
import { listMethods, addMethod, updateMethod, deleteMethod, userScope, mealScope } from './_lib/paymentMethods';
import { listMenuItems, addMenuItem, updateMenuItem, deleteMenuItem, setActualPrices } from './_lib/menu';
import { importFromExcel } from './_lib/menuImport';
import { listOrders, getOrder, createOrder, updateOrder, deleteOrder, orderSummary } from './_lib/orders';
import { getBill, upsertBill } from './_lib/bill';
import { runCalculation } from './_lib/calculate';
import { listResults, overrideResult, markPaid, markPending, listEvents } from './_lib/payments';
import { buildRequests, buildRequest } from './_lib/paymentRequests';
import { uploadFile, getFile, deleteFile } from './_lib/files';
import { addSubscription, removeSubscription } from './_lib/push';
import { sendReminders } from './_lib/reminders';
import {
  buildRestaurantOrderWorkbook,
  buildPaymentCalculationWorkbook,
  buildPaymentRequestsCsv,
  buildMenuTemplateWorkbook,
} from './_lib/exports';

type Params = Record<string, string>;
type Handler = (req: VercelRequest, res: VercelResponse, p: Params) => Promise<void>;
interface Route {
  method: string;
  parts: string[];
  handler: Handler;
}

const XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

function localeOf(req: VercelRequest, user: Row): string {
  return typeof req.query.locale === 'string' ? req.query.locale : String(user.preferred_language ?? 'en');
}

async function readBody(req: VercelRequest): Promise<Buffer> {
  const b: unknown = req.body;
  if (Buffer.isBuffer(b)) return b;
  if (typeof b === 'string') return Buffer.from(b);
  return Buffer.from(await buffer(req));
}

function route(method: string, pattern: string, handler: Handler): Route {
  return { method, parts: pattern === '' ? [] : pattern.split('/'), handler };
}

function matchRoute(parts: string[], seg: string[]): Params | null {
  if (parts.length !== seg.length) return null;
  const params: Params = {};
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]!;
    if (part.startsWith(':')) params[part.slice(1)] = seg[i]!;
    else if (part !== seg[i]) return null;
  }
  return params;
}

// Routes are matched in order; list literal paths before param paths at the
// same depth + method (e.g. orders/summary before orders/:orderId).
const routes: Route[] = [
  route('GET', 'config', async (_req, res) => {
    sendJson(res, 200, {
      appName: 'MakanKira',
      providers: ['google', 'facebook'],
      defaultLocale: 'en',
      supportedLocales: ['en', 'zh', 'ms'],
    });
  }),

  // --- auth ---
  route('POST', 'auth/login', async (req, res) => {
    const body = bodyObject(req);
    const profile = await verifyProvider(requireString(body, 'provider'), requireString(body, 'credential'));
    const user = await upsertUser(profile);
    setSessionCookie(res, await createSessionToken(String(user.id)));
    sendJson(res, 200, { user: toUser(user) });
  }),
  route('POST', 'auth/logout', async (_req, res) => {
    clearSessionCookie(res);
    sendJson(res, 200, { ok: true });
  }),
  route('GET', 'auth/me', async (req, res) => {
    const user = await getSessionUser(req);
    sendJson(res, 200, { user: user ? toUser(user) : null });
  }),

  // --- profile + account ---
  route('GET', 'me', async (req, res) => {
    sendJson(res, 200, { user: toUser(await requireUser(req)) });
  }),
  route('PATCH', 'me', async (req, res) => {
    const user = await requireUser(req);
    sendJson(res, 200, { user: toUser(await updateProfile(String(user.id), bodyObject(req))) });
  }),
  route('GET', 'me/payment-methods', async (req, res) => {
    const user = await requireUser(req);
    sendJson(res, 200, { paymentMethods: (await listMethods(userScope(String(user.id)))).map(toPaymentMethod) });
  }),
  route('POST', 'me/payment-methods', async (req, res) => {
    const user = await requireUser(req);
    sendJson(res, 201, { paymentMethod: toPaymentMethod(await addMethod(userScope(String(user.id)), bodyObject(req))) });
  }),
  route('PATCH', 'me/payment-methods/:id', async (req, res, p) => {
    const user = await requireUser(req);
    sendJson(res, 200, { paymentMethod: toPaymentMethod(await updateMethod(userScope(String(user.id)), p.id!, bodyObject(req))) });
  }),
  route('DELETE', 'me/payment-methods/:id', async (req, res, p) => {
    const user = await requireUser(req);
    await deleteMethod(userScope(String(user.id)), p.id!);
    sendJson(res, 200, { ok: true });
  }),
  route('POST', 'me/push-subscriptions', async (req, res) => {
    const user = await requireUser(req);
    sendJson(res, 201, { subscription: toPushSubscription(await addSubscription(String(user.id), bodyObject(req))) });
  }),
  route('DELETE', 'me/push-subscriptions/:id', async (req, res, p) => {
    const user = await requireUser(req);
    await removeSubscription(String(user.id), p.id!);
    sendJson(res, 200, { ok: true });
  }),

  // --- meals ---
  route('GET', 'meals', async (req, res) => {
    const user = await requireUser(req);
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const q = typeof req.query.q === 'string' ? req.query.q : undefined;
    sendJson(res, 200, { meals: (await listMeals(String(user.id), { status, q })).map(toMealSession) });
  }),
  route('POST', 'meals', async (req, res) => {
    const user = await requireUser(req);
    sendJson(res, 201, { meal: toMealSession(await createMeal(user, bodyObject(req))) });
  }),
  route('GET', 'meals/:mealId', async (req, res, p) => {
    await requireOwnedMeal(req, p.mealId!);
    const { meal, paymentMethods } = await getMealDetail(p.mealId!);
    sendJson(res, 200, { meal: toMealSession(meal), paymentMethods: paymentMethods.map(toPaymentMethod) });
  }),
  route('PATCH', 'meals/:mealId', async (req, res, p) => {
    const { user } = await requireOwnedMeal(req, p.mealId!);
    sendJson(res, 200, { meal: toMealSession(await updateMeal(String(user.id), p.mealId!, bodyObject(req))) });
  }),
  route('DELETE', 'meals/:mealId', async (req, res, p) => {
    const { user } = await requireOwnedMeal(req, p.mealId!);
    await deleteMeal(String(user.id), p.mealId!);
    sendJson(res, 200, { ok: true });
  }),
  route('POST', 'meals/:mealId/finalize', async (req, res, p) => {
    const { user } = await requireOwnedMeal(req, p.mealId!);
    sendJson(res, 200, { meal: toMealSession(await finalizeMeal(String(user.id), p.mealId!)) });
  }),
  route('POST', 'meals/:mealId/status', async (req, res, p) => {
    const { user } = await requireOwnedMeal(req, p.mealId!);
    sendJson(res, 200, { meal: toMealSession(await setStatus(String(user.id), p.mealId!, requireString(bodyObject(req), 'status'))) });
  }),
  route('POST', 'meals/:mealId/close', async (req, res, p) => {
    const { user } = await requireOwnedMeal(req, p.mealId!);
    sendJson(res, 200, { meal: toMealSession(await closeMeal(String(user.id), p.mealId!)) });
  }),

  // session payment methods
  route('GET', 'meals/:mealId/payment-methods', async (req, res, p) => {
    await requireOwnedMeal(req, p.mealId!);
    sendJson(res, 200, { paymentMethods: (await listMethods(mealScope(p.mealId!))).map(toPaymentMethod) });
  }),
  route('POST', 'meals/:mealId/payment-methods', async (req, res, p) => {
    await requireOwnedMeal(req, p.mealId!);
    sendJson(res, 201, { paymentMethod: toPaymentMethod(await addMethod(mealScope(p.mealId!), bodyObject(req))) });
  }),
  route('PATCH', 'meals/:mealId/payment-methods/:id', async (req, res, p) => {
    await requireOwnedMeal(req, p.mealId!);
    sendJson(res, 200, { paymentMethod: toPaymentMethod(await updateMethod(mealScope(p.mealId!), p.id!, bodyObject(req))) });
  }),
  route('DELETE', 'meals/:mealId/payment-methods/:id', async (req, res, p) => {
    await requireOwnedMeal(req, p.mealId!);
    await deleteMethod(mealScope(p.mealId!), p.id!);
    sendJson(res, 200, { ok: true });
  }),

  // menu
  route('GET', 'meals/:mealId/menu-template.xlsx', async (req, res, p) => {
    await requireOwnedMeal(req, p.mealId!);
    res.setHeader('Content-Type', XLSX);
    res.setHeader('Content-Disposition', 'attachment; filename="menu-template.xlsx"');
    res.status(200).send(await buildMenuTemplateWorkbook());
  }),
  route('PUT', 'meals/:mealId/menu-items/prices', async (req, res, p) => {
    await requireOwnedMeal(req, p.mealId!);
    const raw = bodyObject(req).prices;
    if (!Array.isArray(raw)) throw new HttpError(400, 'invalid_request', 'prices must be an array of { itemId, actualPriceCents }');
    const prices = raw.map((x) => {
      const e = (x ?? {}) as Record<string, unknown>;
      if (typeof e.itemId !== 'string') throw new HttpError(400, 'invalid_request', 'each price needs an itemId');
      return { itemId: e.itemId, actualPriceCents: e.actualPriceCents as number };
    });
    sendJson(res, 200, { menuItems: (await setActualPrices(p.mealId!, prices)).map(toMenuItem) });
  }),
  route('POST', 'meals/:mealId/menu-items/import', async (req, res, p) => {
    await requireOwnedMeal(req, p.mealId!);
    sendJson(res, 201, { menuItems: (await importFromExcel(p.mealId!, requireString(bodyObject(req), 'fileId'))).map(toMenuItem) });
  }),
  route('GET', 'meals/:mealId/menu-items', async (req, res, p) => {
    await requireOwnedMeal(req, p.mealId!);
    sendJson(res, 200, { menuItems: (await listMenuItems(p.mealId!)).map(toMenuItem) });
  }),
  route('POST', 'meals/:mealId/menu-items', async (req, res, p) => {
    await requireOwnedMeal(req, p.mealId!);
    sendJson(res, 201, { menuItem: toMenuItem(await addMenuItem(p.mealId!, bodyObject(req))) });
  }),
  route('PATCH', 'meals/:mealId/menu-items/:itemId', async (req, res, p) => {
    await requireOwnedMeal(req, p.mealId!);
    sendJson(res, 200, { menuItem: toMenuItem(await updateMenuItem(p.mealId!, p.itemId!, bodyObject(req))) });
  }),
  route('DELETE', 'meals/:mealId/menu-items/:itemId', async (req, res, p) => {
    await requireOwnedMeal(req, p.mealId!);
    await deleteMenuItem(p.mealId!, p.itemId!);
    sendJson(res, 200, { ok: true });
  }),

  // orders
  route('GET', 'meals/:mealId/orders/summary', async (req, res, p) => {
    await requireOwnedMeal(req, p.mealId!);
    const view = req.query.view === 'participant' ? 'participant' : 'restaurant';
    sendJson(res, 200, { view, summary: await orderSummary(p.mealId!, view) });
  }),
  route('GET', 'meals/:mealId/orders', async (req, res, p) => {
    await requireOwnedMeal(req, p.mealId!);
    sendJson(res, 200, { orders: (await listOrders(p.mealId!)).map(({ order, items }) => toOrder(order, items)) });
  }),
  route('POST', 'meals/:mealId/orders', async (req, res, p) => {
    await requireOwnedMeal(req, p.mealId!);
    const { order, items } = await createOrder(p.mealId!, bodyObject(req));
    sendJson(res, 201, { order: toOrder(order, items) });
  }),
  route('GET', 'meals/:mealId/orders/:orderId', async (req, res, p) => {
    await requireOwnedMeal(req, p.mealId!);
    const { order, items } = await getOrder(p.mealId!, p.orderId!);
    sendJson(res, 200, { order: toOrder(order, items) });
  }),
  route('PATCH', 'meals/:mealId/orders/:orderId', async (req, res, p) => {
    await requireOwnedMeal(req, p.mealId!);
    const { order, items } = await updateOrder(p.mealId!, p.orderId!, bodyObject(req));
    sendJson(res, 200, { order: toOrder(order, items) });
  }),
  route('DELETE', 'meals/:mealId/orders/:orderId', async (req, res, p) => {
    await requireOwnedMeal(req, p.mealId!);
    await deleteOrder(p.mealId!, p.orderId!);
    sendJson(res, 200, { ok: true });
  }),

  // bill + calculate
  route('GET', 'meals/:mealId/bill', async (req, res, p) => {
    await requireOwnedMeal(req, p.mealId!);
    const bill = await getBill(p.mealId!);
    sendJson(res, 200, { bill: bill ? toBillAdjustment(bill) : null });
  }),
  route('PUT', 'meals/:mealId/bill', async (req, res, p) => {
    await requireOwnedMeal(req, p.mealId!);
    sendJson(res, 200, { bill: toBillAdjustment(await upsertBill(p.mealId!, bodyObject(req))) });
  }),
  route('POST', 'meals/:mealId/calculate', async (req, res, p) => {
    await requireOwnedMeal(req, p.mealId!);
    const { summary, results } = await runCalculation(p.mealId!);
    sendJson(res, 200, { summary, results: results.map(toPaymentResult) });
  }),

  // payment results + events
  route('GET', 'meals/:mealId/payment-results', async (req, res, p) => {
    await requireOwnedMeal(req, p.mealId!);
    sendJson(res, 200, { results: (await listResults(p.mealId!)).map(toPaymentResult) });
  }),
  route('PATCH', 'meals/:mealId/payment-results/:resultId', async (req, res, p) => {
    const { user } = await requireOwnedMeal(req, p.mealId!);
    sendJson(res, 200, { result: toPaymentResult(await overrideResult(p.mealId!, p.resultId!, bodyObject(req), String(user.id))) });
  }),
  route('POST', 'meals/:mealId/payment-results/:resultId/mark-paid', async (req, res, p) => {
    const { user } = await requireOwnedMeal(req, p.mealId!);
    const paidAt = typeof bodyObject(req).paidAt === 'string' ? String(bodyObject(req).paidAt) : null;
    sendJson(res, 200, { result: toPaymentResult(await markPaid(p.mealId!, p.resultId!, paidAt, String(user.id))) });
  }),
  route('POST', 'meals/:mealId/payment-results/:resultId/mark-pending', async (req, res, p) => {
    const { user } = await requireOwnedMeal(req, p.mealId!);
    sendJson(res, 200, { result: toPaymentResult(await markPending(p.mealId!, p.resultId!, String(user.id))) });
  }),
  route('GET', 'meals/:mealId/payment-status-events', async (req, res, p) => {
    await requireOwnedMeal(req, p.mealId!);
    sendJson(res, 200, { events: (await listEvents(p.mealId!)).map(toPaymentStatusEvent) });
  }),

  // payment requests
  route('GET', 'meals/:mealId/payment-requests', async (req, res, p) => {
    const { user } = await requireOwnedMeal(req, p.mealId!);
    sendJson(res, 200, { requests: await buildRequests(p.mealId!, localeOf(req, user)) });
  }),
  route('GET', 'meals/:mealId/payment-requests/:resultId', async (req, res, p) => {
    const { user } = await requireOwnedMeal(req, p.mealId!);
    sendJson(res, 200, { request: await buildRequest(p.mealId!, p.resultId!, localeOf(req, user)) });
  }),

  // exports
  route('GET', 'meals/:mealId/export/restaurant-order.xlsx', async (req, res, p) => {
    const { user } = await requireOwnedMeal(req, p.mealId!);
    res.setHeader('Content-Type', XLSX);
    res.setHeader('Content-Disposition', `attachment; filename="restaurant-order-${p.mealId}.xlsx"`);
    res.status(200).send(await buildRestaurantOrderWorkbook(p.mealId!, localeOf(req, user)));
  }),
  route('GET', 'meals/:mealId/export/payment-calculation.xlsx', async (req, res, p) => {
    const { user } = await requireOwnedMeal(req, p.mealId!);
    res.setHeader('Content-Type', XLSX);
    res.setHeader('Content-Disposition', `attachment; filename="payment-calculation-${p.mealId}.xlsx"`);
    res.status(200).send(await buildPaymentCalculationWorkbook(p.mealId!, localeOf(req, user)));
  }),
  route('GET', 'meals/:mealId/export/payment-requests.csv', async (req, res, p) => {
    const { user } = await requireOwnedMeal(req, p.mealId!);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="payment-requests-${p.mealId}.csv"`);
    res.status(200).send(await buildPaymentRequestsCsv(p.mealId!, localeOf(req, user)));
  }),

  // files
  route('POST', 'files', async (req, res) => {
    const user = await requireUser(req);
    const fileKind = String(req.query.fileKind ?? '');
    const mealId = typeof req.query.mealId === 'string' ? req.query.mealId : null;
    if (mealId) await getMealForOwner(String(user.id), mealId);
    const filename = typeof req.query.filename === 'string' ? req.query.filename : 'upload';
    const contentType = String(req.headers['content-type'] ?? 'application/octet-stream');
    const data = await readBody(req);
    if (data.length === 0) throw new HttpError(400, 'empty_file', 'No file data received');
    const file = await uploadFile({ userId: String(user.id), mealId, fileKind, filename, contentType, data });
    sendJson(res, 201, { id: file.id, url: file.blob_url, file: toUploadedFile(file) });
  }),
  route('GET', 'files/:id', async (req, res, p) => {
    const user = await requireUser(req);
    sendJson(res, 200, { file: toUploadedFile(await getFile(String(user.id), p.id!)) });
  }),
  route('DELETE', 'files/:id', async (req, res, p) => {
    const user = await requireUser(req);
    await deleteFile(String(user.id), p.id!);
    sendJson(res, 200, { ok: true });
  }),

  // cron (CRON_SECRET, not a user session)
  route('POST', 'cron/reminders', async (req, res) => {
    const secret = process.env.CRON_SECRET;
    if (!secret || req.headers.authorization !== `Bearer ${secret}`) {
      throw new HttpError(401, 'unauthorized', 'Invalid cron secret');
    }
    const nowIso = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
    sendJson(res, 200, await sendReminders(nowIso));
  }),
];

export default withErrors(async (req, res) => {
  // The path is delivered by the vercel.json rewrite as ?__path=<rest>.
  const raw = req.query.__path;
  const rel = Array.isArray(raw) ? raw.join('/') : typeof raw === 'string' ? raw : '';
  const seg = rel.split('/').filter(Boolean);
  const method = req.method ?? 'GET';

  // CSRF defense-in-depth for state-changing requests (cron has no Origin and is
  // gated by CRON_SECRET instead).
  if (method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS') assertSameOrigin(req);

  for (const r of routes) {
    if (r.method !== method) continue;
    const params = matchRoute(r.parts, seg);
    if (params) {
      await r.handler(req, res, params);
      return;
    }
  }
  throw new HttpError(404, 'not_found', `No route for ${method} /${seg.join('/')}`);
});
