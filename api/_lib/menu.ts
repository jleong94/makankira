/**
 * menu.ts — menu items for a meal session (README Screens 4, 7).
 * Excel import/template are added with the exceljs export work.
 */

import type { Row, InStatement } from '@libsql/client';
import { query, queryOne, execute, batchWrite } from './db';
import { newId } from './ids';
import { HttpError } from './http';
import { optionalIntCents } from './validate';

type Input = Record<string, unknown>;
const asStr = (v: unknown): string | null => (typeof v === 'string' && v.length > 0 ? v : null);

export async function listMenuItems(mealId: string): Promise<Row[]> {
  return query('SELECT * FROM menu_items WHERE meal_session_id = ? ORDER BY sort_order, created_at', [mealId]);
}

export async function addMenuItem(mealId: string, input: Input): Promise<Row> {
  const name = asStr(input.name);
  if (!name) throw new HttpError(400, 'invalid_request', 'Item name is required');
  const id = newId('item');
  await execute(
    `INSERT INTO menu_items
       (id, meal_session_id, item_code, name, category, description,
        estimated_price_cents, actual_price_cents, image_url, menu_url, available, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      mealId,
      asStr(input.itemCode),
      name,
      asStr(input.category),
      asStr(input.description),
      optionalIntCents(input.estimatedPriceCents, 'estimatedPriceCents'),
      optionalIntCents(input.actualPriceCents, 'actualPriceCents'),
      asStr(input.imageUrl),
      asStr(input.menuUrl),
      input.available === false ? 0 : 1,
      typeof input.sortOrder === 'number' ? input.sortOrder : 0,
    ],
  );
  return (await queryOne('SELECT * FROM menu_items WHERE id = ?', [id]))!;
}

export async function updateMenuItem(mealId: string, id: string, input: Input): Promise<Row> {
  const existing = await queryOne('SELECT id FROM menu_items WHERE id = ? AND meal_session_id = ?', [id, mealId]);
  if (!existing) throw new HttpError(404, 'not_found', 'Menu item not found');

  const sets: string[] = [];
  const args: (string | number | null)[] = [];
  const set = (col: string, val: string | number | null): void => {
    sets.push(`${col} = ?`);
    args.push(val);
  };

  if ('itemCode' in input) set('item_code', asStr(input.itemCode));
  if ('name' in input) {
    const v = asStr(input.name);
    if (!v) throw new HttpError(400, 'invalid_request', 'Item name cannot be empty');
    set('name', v);
  }
  if ('category' in input) set('category', asStr(input.category));
  if ('description' in input) set('description', asStr(input.description));
  if ('estimatedPriceCents' in input) set('estimated_price_cents', optionalIntCents(input.estimatedPriceCents, 'estimatedPriceCents'));
  if ('actualPriceCents' in input) set('actual_price_cents', optionalIntCents(input.actualPriceCents, 'actualPriceCents'));
  if ('imageUrl' in input) set('image_url', asStr(input.imageUrl));
  if ('menuUrl' in input) set('menu_url', asStr(input.menuUrl));
  if ('available' in input) set('available', input.available === false ? 0 : 1);
  if ('sortOrder' in input && typeof input.sortOrder === 'number') set('sort_order', input.sortOrder);

  if (sets.length > 0) {
    sets.push("updated_at = strftime('%Y-%m-%dT%H:%M:%SZ','now')");
    await execute(`UPDATE menu_items SET ${sets.join(', ')} WHERE id = ?`, [...args, id]);
  }
  return (await queryOne('SELECT * FROM menu_items WHERE id = ?', [id]))!;
}

export async function deleteMenuItem(mealId: string, id: string): Promise<void> {
  const existing = await queryOne('SELECT id FROM menu_items WHERE id = ? AND meal_session_id = ?', [id, mealId]);
  if (!existing) throw new HttpError(404, 'not_found', 'Menu item not found');
  await query('DELETE FROM menu_items WHERE id = ?', [id]);
}

/** Bulk-set actual prices after the meal (Screen 7). */
export async function setActualPrices(
  mealId: string,
  prices: { itemId: string; actualPriceCents: number }[],
): Promise<Row[]> {
  const stmts: InStatement[] = prices.map((p) => ({
    sql: "UPDATE menu_items SET actual_price_cents = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%SZ','now') WHERE id = ? AND meal_session_id = ?",
    args: [optionalIntCents(p.actualPriceCents, 'actualPriceCents'), p.itemId, mealId],
  }));
  if (stmts.length > 0) await batchWrite(stmts);
  return listMenuItems(mealId);
}
