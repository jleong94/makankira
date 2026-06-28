/**
 * db.ts — Turso / libSQL client and small query helpers.
 *
 * The only module that talks to the database. A single client is reused across
 * warm serverless invocations. Money columns are integer sen; callers convert.
 */

import { createClient } from '@libsql/client';
import type { Client, InArgs, InStatement, ResultSet, Row } from '@libsql/client';
import { env, envOptional } from './env';

let _client: Client | null = null;

export function db(): Client {
  if (!_client) {
    _client = createClient({
      url: env('TURSO_DATABASE_URL'),
      authToken: envOptional('TURSO_AUTH_TOKEN'),
    });
  }
  return _client;
}

/** Run a query and return all rows. */
export async function query(sql: string, args?: InArgs): Promise<Row[]> {
  const rs = await db().execute(args ? { sql, args } : sql);
  return rs.rows;
}

/** Run a query and return the first row, or null. */
export async function queryOne(sql: string, args?: InArgs): Promise<Row | null> {
  const rows = await query(sql, args);
  return rows[0] ?? null;
}

/** Run a single write/DDL statement. */
export async function execute(sql: string, args?: InArgs): Promise<ResultSet> {
  return db().execute(args ? { sql, args } : sql);
}

/**
 * Run several statements atomically (a single write transaction).
 *
 * Note: foreign-key enforcement on remote libSQL is connection-scoped and the
 * PRAGMA cannot be toggled inside a transaction, so we do not rely on it here.
 * Referential integrity is enforced in app logic (ownership checks + deletes in
 * dependency order); ON DELETE CASCADE in the schema is a backstop where active.
 */
export async function batchWrite(statements: InStatement[]): Promise<ResultSet[]> {
  return db().batch(statements, 'write');
}
