/**
 * paymentMethods.ts — receiving payment methods, shared by:
 *   - account-level defaults (user_payment_methods, Screen 2B), and
 *   - per-session methods (payment_methods, Screen 3).
 * Both have the same shape; a Scope selects the table + owner column.
 */

import type { Row, InStatement } from '@libsql/client';
import { query, queryOne, batchWrite } from './db';
import { newId } from './ids';
import { HttpError } from './http';

const METHOD_TYPES = ['bank_account', 'duitnow_id', 'duitnow_qr', 'custom'] as const;
type MethodType = (typeof METHOD_TYPES)[number];

export interface Scope {
  table: 'user_payment_methods' | 'payment_methods';
  col: 'user_id' | 'meal_session_id';
  owner: string;
  idPrefix: 'upm' | 'pm';
}

export function userScope(userId: string): Scope {
  return { table: 'user_payment_methods', col: 'user_id', owner: userId, idPrefix: 'upm' };
}
export function mealScope(mealId: string): Scope {
  return { table: 'payment_methods', col: 'meal_session_id', owner: mealId, idPrefix: 'pm' };
}

type Input = Record<string, unknown>;

const asStr = (v: unknown): string | null =>
  typeof v === 'string' && v.length > 0 ? v : null;

function validMethodType(v: unknown): MethodType {
  if (typeof v === 'string' && (METHOD_TYPES as readonly string[]).includes(v)) {
    return v as MethodType;
  }
  throw new HttpError(400, 'invalid_method_type', `methodType must be one of ${METHOD_TYPES.join(', ')}`);
}

interface Normalized {
  methodType: MethodType;
  accountName: string | null;
  bankName: string | null;
  accountNumber: string | null;
  duitNowId: string | null;
  qrImageFileId: string | null;
  instructions: string | null;
  isDefault: boolean;
  sortOrder: number;
}

function normalize(input: Input): Normalized {
  return {
    methodType: validMethodType(input.methodType),
    accountName: asStr(input.accountName),
    bankName: asStr(input.bankName),
    accountNumber: asStr(input.accountNumber),
    duitNowId: asStr(input.duitNowId),
    qrImageFileId: asStr(input.qrImageFileId),
    instructions: asStr(input.instructions),
    isDefault: input.isDefault === true,
    sortOrder: typeof input.sortOrder === 'number' ? input.sortOrder : 0,
  };
}

function assertKeyField(m: Normalized): void {
  const ok =
    (m.methodType === 'bank_account' && !!m.accountNumber) ||
    (m.methodType === 'duitnow_id' && !!m.duitNowId) ||
    (m.methodType === 'duitnow_qr' && !!m.qrImageFileId) ||
    (m.methodType === 'custom' && !!m.instructions);
  if (!ok) {
    throw new HttpError(400, 'invalid_method', `${m.methodType} is missing its required field`);
  }
}

const INSERT_COLS =
  'method_type,account_name,bank_name,account_number,duitnow_id,qr_image_file_id,instructions,is_default,sort_order';

function insertValues(m: Normalized): (string | number | null)[] {
  return [
    m.methodType,
    m.accountName,
    m.bankName,
    m.accountNumber,
    m.duitNowId,
    m.qrImageFileId,
    m.instructions,
    m.isDefault ? 1 : 0,
    m.sortOrder,
  ];
}

export async function listMethods(s: Scope): Promise<Row[]> {
  return query(`SELECT * FROM ${s.table} WHERE ${s.col} = ? ORDER BY sort_order, created_at`, [s.owner]);
}

export async function addMethod(s: Scope, input: Input): Promise<Row> {
  const m = normalize(input);
  assertKeyField(m);
  const id = newId(s.idPrefix);
  const stmts: InStatement[] = [];
  if (m.isDefault) {
    stmts.push({ sql: `UPDATE ${s.table} SET is_default = 0 WHERE ${s.col} = ?`, args: [s.owner] });
  }
  stmts.push({
    sql: `INSERT INTO ${s.table} (id, ${s.col}, ${INSERT_COLS}) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [id, s.owner, ...insertValues(m)],
  });
  await batchWrite(stmts);
  return (await queryOne(`SELECT * FROM ${s.table} WHERE id = ?`, [id]))!;
}

export async function updateMethod(s: Scope, id: string, input: Input): Promise<Row> {
  const existing = await queryOne(`SELECT * FROM ${s.table} WHERE id = ? AND ${s.col} = ?`, [id, s.owner]);
  if (!existing) throw new HttpError(404, 'not_found', 'Payment method not found');

  const sets: string[] = [];
  const args: (string | number | null)[] = [];
  const field = (key: string, col: string): void => {
    if (key in input) {
      sets.push(`${col} = ?`);
      args.push(asStr(input[key]));
    }
  };
  if ('methodType' in input) {
    sets.push('method_type = ?');
    args.push(validMethodType(input.methodType));
  }
  field('accountName', 'account_name');
  field('bankName', 'bank_name');
  field('accountNumber', 'account_number');
  field('duitNowId', 'duitnow_id');
  field('qrImageFileId', 'qr_image_file_id');
  field('instructions', 'instructions');
  if ('sortOrder' in input && typeof input.sortOrder === 'number') {
    sets.push('sort_order = ?');
    args.push(input.sortOrder);
  }

  const stmts: InStatement[] = [];
  if (input.isDefault === true) {
    stmts.push({ sql: `UPDATE ${s.table} SET is_default = 0 WHERE ${s.col} = ?`, args: [s.owner] });
  }
  if ('isDefault' in input) {
    sets.push('is_default = ?');
    args.push(input.isDefault === true ? 1 : 0);
  }

  if (sets.length > 0) {
    sets.push("updated_at = strftime('%Y-%m-%dT%H:%M:%SZ','now')");
    stmts.push({ sql: `UPDATE ${s.table} SET ${sets.join(', ')} WHERE id = ?`, args: [...args, id] });
  }
  if (stmts.length > 0) await batchWrite(stmts);
  return (await queryOne(`SELECT * FROM ${s.table} WHERE id = ?`, [id]))!;
}

export async function deleteMethod(s: Scope, id: string): Promise<void> {
  const existing = await queryOne(`SELECT id FROM ${s.table} WHERE id = ? AND ${s.col} = ?`, [id, s.owner]);
  if (!existing) throw new HttpError(404, 'not_found', 'Payment method not found');
  await query(`DELETE FROM ${s.table} WHERE id = ?`, [id]);
}

/**
 * Statements that copy the owner's saved account defaults into a new session's
 * payment_methods (prefill on meal creation). Returns [] if there are none.
 */
export async function prefillSessionMethods(mealId: string, userId: string): Promise<InStatement[]> {
  const defaults = await listMethods(userScope(userId));
  return defaults.map((d) => ({
    sql: `INSERT INTO payment_methods (id, meal_session_id, ${INSERT_COLS}) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      newId('pm'),
      mealId,
      String(d.method_type),
      d.account_name as string | null,
      d.bank_name as string | null,
      d.account_number as string | null,
      d.duitnow_id as string | null,
      d.qr_image_file_id as string | null,
      d.instructions as string | null,
      Number(d.is_default),
      Number(d.sort_order),
    ],
  }));
}
