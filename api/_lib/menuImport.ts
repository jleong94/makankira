/**
 * menuImport.ts — parse an uploaded menu Excel into menu items (README Section 7).
 * parseMenuWorkbook is pure (unit-tested); importFromExcel downloads the Blob and
 * bulk-inserts.
 */

import type { Row, InStatement } from '@libsql/client';
import ExcelJS from 'exceljs';
import { query, queryOne, batchWrite } from './db';
import { newId } from './ids';
import { HttpError } from './http';

export interface ParsedMenuItem {
  itemCode: string | null;
  name: string;
  category: string | null;
  description: string | null;
  estimatedPriceCents: number | null;
  menuUrl: string | null;
  imageUrl: string | null;
  available: boolean;
}

const NEGATIVE = ['no', 'false', '0', 'tidak', '否'];

export async function parseMenuWorkbook(data: Buffer): Promise<ParsedMenuItem[]> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(data as unknown as ArrayBuffer);
  const ws = wb.worksheets[0];
  if (!ws) return [];

  const colOf = new Map<string, number>();
  ws.getRow(1).eachCell((cell, col) => {
    const key = String(cell.value ?? '').trim().toLowerCase();
    if (key) colOf.set(key, col);
  });
  const get = (row: ExcelJS.Row, key: string): string | null => {
    const col = colOf.get(key);
    if (!col) return null;
    const v = row.getCell(col).value;
    if (v == null) return null;
    const s = String(v).trim();
    return s.length > 0 ? s : null;
  };

  const items: ParsedMenuItem[] = [];
  for (let i = 2; i <= ws.rowCount; i++) {
    const row = ws.getRow(i);
    const name = get(row, 'item_name');
    if (!name) continue;
    const priceStr = get(row, 'estimated_price');
    const cents = priceStr != null ? Math.round(parseFloat(priceStr) * 100) : null;
    const avail = (get(row, 'available') ?? '').toLowerCase();
    items.push({
      itemCode: get(row, 'item_code'),
      name,
      category: get(row, 'category'),
      description: get(row, 'description'),
      estimatedPriceCents: cents != null && Number.isFinite(cents) && cents >= 0 ? cents : null,
      menuUrl: get(row, 'menu_url'),
      imageUrl: get(row, 'image_url'),
      available: avail === '' ? true : !NEGATIVE.includes(avail),
    });
  }
  return items;
}

export async function importFromExcel(mealId: string, fileId: string): Promise<Row[]> {
  const file = await queryOne('SELECT blob_url FROM uploaded_files WHERE id = ?', [fileId]);
  if (!file) throw new HttpError(404, 'not_found', 'Uploaded file not found');

  const resp = await fetch(String(file.blob_url));
  if (!resp.ok) throw new HttpError(400, 'download_failed', 'Could not download the uploaded file');
  const items = await parseMenuWorkbook(Buffer.from(await resp.arrayBuffer()));
  if (items.length === 0) throw new HttpError(400, 'empty_import', 'No menu rows found in the file');

  const stmts: InStatement[] = items.map((it, idx) => ({
    sql: `INSERT INTO menu_items
            (id, meal_session_id, item_code, name, category, description, estimated_price_cents, menu_url, image_url, available, sort_order)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [newId('item'), mealId, it.itemCode, it.name, it.category, it.description, it.estimatedPriceCents, it.menuUrl, it.imageUrl, it.available ? 1 : 0, idx],
  }));
  await batchWrite(stmts);
  return query('SELECT * FROM menu_items WHERE meal_session_id = ? ORDER BY sort_order, created_at', [mealId]);
}
