/**
 * orders.ts — participant orders + their items (README Screens 5, 6).
 * Orders are editable only while the session is collecting (draft/collecting_orders);
 * once finalized they are locked.
 */

import type { Row, InStatement } from '@libsql/client';
import { query, queryOne, batchWrite } from './db';
import { newId } from './ids';
import { HttpError } from './http';
import { normalizeMobile, requirePositiveInt } from './validate';

type Input = Record<string, unknown>;
const asStr = (v: unknown): string | null => (typeof v === 'string' && v.length > 0 ? v : null);

interface ParsedItem {
  menuItemId: string;
  quantity: number;
  remarks: string | null;
}

async function assertEditable(mealId: string): Promise<void> {
  const meal = await queryOne('SELECT status FROM meal_sessions WHERE id = ?', [mealId]);
  const status = meal ? String(meal.status) : '';
  if (status !== 'draft' && status !== 'collecting_orders') {
    throw new HttpError(409, 'orders_locked', 'Orders are locked once the session is finalized');
  }
}

/** Validate the items array against this meal's available menu. */
async function parseItems(mealId: string, raw: unknown): Promise<ParsedItem[]> {
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new HttpError(400, 'invalid_request', 'At least one item is required');
  }
  const menu = await query('SELECT id, available FROM menu_items WHERE meal_session_id = ?', [mealId]);
  const available = new Map(menu.map((m) => [String(m.id), Number(m.available) === 1]));

  return raw.map((entry): ParsedItem => {
    const e = (entry ?? {}) as Record<string, unknown>;
    const menuItemId = asStr(e.menuItemId);
    if (!menuItemId || !available.has(menuItemId)) {
      throw new HttpError(400, 'invalid_item', `Unknown menu item: ${String(e.menuItemId)}`);
    }
    if (!available.get(menuItemId)) {
      throw new HttpError(400, 'item_unavailable', `Menu item ${menuItemId} is not available`);
    }
    return {
      menuItemId,
      quantity: requirePositiveInt(e.quantity, 'quantity'),
      remarks: asStr(e.remarks),
    };
  });
}

async function itemsFor(orderIds: string[]): Promise<Map<string, Row[]>> {
  const byOrder = new Map<string, Row[]>();
  if (orderIds.length === 0) return byOrder;
  const placeholders = orderIds.map(() => '?').join(',');
  const rows = await query(
    `SELECT * FROM order_items WHERE participant_order_id IN (${placeholders}) ORDER BY created_at`,
    orderIds,
  );
  for (const r of rows) {
    const key = String(r.participant_order_id);
    (byOrder.get(key) ?? byOrder.set(key, []).get(key)!).push(r);
  }
  return byOrder;
}

export async function listOrders(mealId: string): Promise<{ order: Row; items: Row[] }[]> {
  const orders = await query(
    'SELECT * FROM participant_orders WHERE meal_session_id = ? ORDER BY created_at',
    [mealId],
  );
  const items = await itemsFor(orders.map((o) => String(o.id)));
  return orders.map((order) => ({ order, items: items.get(String(order.id)) ?? [] }));
}

export async function getOrder(mealId: string, id: string): Promise<{ order: Row; items: Row[] }> {
  const order = await queryOne('SELECT * FROM participant_orders WHERE id = ? AND meal_session_id = ?', [id, mealId]);
  if (!order) throw new HttpError(404, 'not_found', 'Order not found');
  const items = await query('SELECT * FROM order_items WHERE participant_order_id = ? ORDER BY created_at', [id]);
  return { order, items };
}

function role(input: Input): 'paying_participant' | 'farewell_honoree' {
  return input.participantRole === 'farewell_honoree' ? 'farewell_honoree' : 'paying_participant';
}

function requireMobile(input: Input): string {
  const raw = asStr(input.mobileNumber);
  if (!raw) throw new HttpError(400, 'invalid_request', 'Mobile number is required');
  const normalized = normalizeMobile(raw);
  if (!normalized) throw new HttpError(400, 'invalid_mobile', 'Mobile number is not a valid Malaysian number');
  return normalized;
}

export async function createOrder(mealId: string, input: Input): Promise<{ order: Row; items: Row[] }> {
  await assertEditable(mealId);
  const name = asStr(input.participantName);
  if (!name) throw new HttpError(400, 'invalid_request', 'Participant name is required');
  const mobile = requireMobile(input);
  const items = await parseItems(mealId, input.items);

  const orderId = newId('order');
  const stmts: InStatement[] = [
    {
      sql: `INSERT INTO participant_orders
              (id, meal_session_id, participant_user_id, participant_name, participant_role, mobile_number, submitted_at)
            VALUES (?, ?, ?, ?, ?, ?, strftime('%Y-%m-%dT%H:%M:%SZ','now'))`,
      args: [orderId, mealId, asStr(input.participantUserId), name, role(input), mobile],
    },
    ...items.map((it) => ({
      sql: 'INSERT INTO order_items (id, participant_order_id, menu_item_id, quantity, remarks) VALUES (?, ?, ?, ?, ?)',
      args: [newId('oi'), orderId, it.menuItemId, it.quantity, it.remarks] as (string | number | null)[],
    })),
  ];
  await batchWrite(stmts);
  return getOrder(mealId, orderId);
}

export async function updateOrder(mealId: string, id: string, input: Input): Promise<{ order: Row; items: Row[] }> {
  await assertEditable(mealId);
  await getOrder(mealId, id); // 404 if missing/not in meal

  const sets: string[] = [];
  const args: (string | number | null)[] = [];
  if ('participantName' in input) {
    const v = asStr(input.participantName);
    if (!v) throw new HttpError(400, 'invalid_request', 'Participant name cannot be empty');
    sets.push('participant_name = ?');
    args.push(v);
  }
  if ('mobileNumber' in input) {
    sets.push('mobile_number = ?');
    args.push(requireMobile(input));
  }
  if ('participantRole' in input) {
    sets.push('participant_role = ?');
    args.push(role(input));
  }

  const stmts: InStatement[] = [];
  if (sets.length > 0) {
    sets.push("updated_at = strftime('%Y-%m-%dT%H:%M:%SZ','now')");
    stmts.push({ sql: `UPDATE participant_orders SET ${sets.join(', ')} WHERE id = ?`, args: [...args, id] });
  }
  if ('items' in input) {
    const items = await parseItems(mealId, input.items);
    stmts.push({ sql: 'DELETE FROM order_items WHERE participant_order_id = ?', args: [id] });
    for (const it of items) {
      stmts.push({
        sql: 'INSERT INTO order_items (id, participant_order_id, menu_item_id, quantity, remarks) VALUES (?, ?, ?, ?, ?)',
        args: [newId('oi'), id, it.menuItemId, it.quantity, it.remarks],
      });
    }
  }
  if (stmts.length > 0) await batchWrite(stmts);
  return getOrder(mealId, id);
}

export async function deleteOrder(mealId: string, id: string): Promise<void> {
  await assertEditable(mealId);
  await getOrder(mealId, id);
  await batchWrite([
    { sql: 'DELETE FROM order_items WHERE participant_order_id = ?', args: [id] },
    { sql: 'DELETE FROM participant_orders WHERE id = ?', args: [id] },
  ]);
}

/** Grouped views for Screen 6. */
export async function orderSummary(
  mealId: string,
  view: 'restaurant' | 'participant',
): Promise<unknown> {
  const rows = await query(
    `SELECT oi.menu_item_id, oi.quantity, oi.remarks, mi.name AS item_name,
            po.id AS order_id, po.participant_name, po.participant_role
       FROM order_items oi
       JOIN participant_orders po ON oi.participant_order_id = po.id
       JOIN menu_items mi ON oi.menu_item_id = mi.id
      WHERE po.meal_session_id = ?
      ORDER BY mi.sort_order, po.created_at`,
    [mealId],
  );

  if (view === 'restaurant') {
    const byItem = new Map<string, { menuItemId: string; itemName: string; totalQty: number; remarks: string[] }>();
    for (const r of rows) {
      const key = String(r.menu_item_id);
      const entry =
        byItem.get(key) ??
        byItem.set(key, { menuItemId: key, itemName: String(r.item_name), totalQty: 0, remarks: [] }).get(key)!;
      entry.totalQty += Number(r.quantity);
      if (r.remarks) entry.remarks.push(`${String(r.participant_name)}: ${String(r.remarks)}`);
    }
    return [...byItem.values()].map((e) => ({
      menuItemId: e.menuItemId,
      itemName: e.itemName,
      totalQty: e.totalQty,
      remarksSummary: e.remarks.join('; '),
    }));
  }

  const byParticipant = new Map<
    string,
    { participantOrderId: string; participantName: string; role: string; items: unknown[] }
  >();
  for (const r of rows) {
    const key = String(r.order_id);
    const entry =
      byParticipant.get(key) ??
      byParticipant
        .set(key, {
          participantOrderId: key,
          participantName: String(r.participant_name),
          role: String(r.participant_role),
          items: [],
        })
        .get(key)!;
    entry.items.push({
      menuItemId: r.menu_item_id,
      itemName: r.item_name,
      quantity: Number(r.quantity),
      remarks: r.remarks ?? null,
    });
  }
  return [...byParticipant.values()];
}
