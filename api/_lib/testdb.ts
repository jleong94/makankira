/**
 * testdb.ts — test-only helper. Points the DB client at a fresh temp-file SQLite
 * database and applies migration 0001_init, so domain modules can be exercised
 * end-to-end without Turso. Not imported by any handler.
 */

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';
import { db } from './db';

export async function setupTestDb(): Promise<string> {
  const file = resolve(tmpdir(), `mk-test-${process.pid}-${Date.now()}.db`);
  process.env.TURSO_DATABASE_URL = pathToFileURL(file).href;
  delete process.env.TURSO_AUTH_TOKEN;

  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
  const sql = readFileSync(resolve(root, 'migrations', '0001_init.sql'), 'utf8');
  await db().executeMultiple(sql);
  return file;
}
