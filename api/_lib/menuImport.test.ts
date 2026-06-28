import { test } from 'node:test';
import assert from 'node:assert/strict';
import ExcelJS from 'exceljs';
import { parseMenuWorkbook } from './menuImport';

test('parseMenuWorkbook maps headers, converts price to sen, skips nameless rows', async () => {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Menu');
  ws.addRow(['item_code', 'item_name', 'category', 'description', 'estimated_price', 'menu_url', 'image_url', 'available']);
  ws.addRow(['A01', 'Chicken Rice', 'Main', 'Roasted', 9.5, '', '', 'Yes']);
  ws.addRow(['', '', '', '', '', '', '', '']); // no name -> skipped
  ws.addRow(['B01', 'Iced Tea', 'Drink', '', 2, '', '', 'No']);
  const buf = Buffer.from((await wb.xlsx.writeBuffer()) as ArrayBuffer);

  const items = await parseMenuWorkbook(buf);
  assert.equal(items.length, 2);
  assert.equal(items[0]!.name, 'Chicken Rice');
  assert.equal(items[0]!.estimatedPriceCents, 950);
  assert.equal(items[0]!.available, true);
  assert.equal(items[1]!.name, 'Iced Tea');
  assert.equal(items[1]!.estimatedPriceCents, 200);
  assert.equal(items[1]!.available, false);
});
