#!/usr/bin/env tsx
/**
 * migrate.ts  (README Section 16)
 *
 * Applies any migrations/*.sql whose version is not yet recorded in
 * schema_migrations, each inside a transaction. Idempotent: already-applied
 * versions are skipped.
 *
 *   Local:  npm run migrate         (reads TURSO_* from config/secrets.local or .env)
 *   CI/CD:  TURSO_DATABASE_URL / TURSO_AUTH_TOKEN provided as env vars
 *
 * The version of each file is its basename without ".sql" (e.g. "0001_init").
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@libsql/client';
import dotenv from 'dotenv';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const MIGRATIONS_DIR = resolve(ROOT, 'migrations');

// Load env from config/secrets.local then .env (without overriding real env).
for (const f of ['config/secrets.local', '.env']) {
  const p = resolve(ROOT, f);
  if (existsSync(p)) dotenv.config({ path: p });
}

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
if (!url) {
  console.error(
    'TURSO_DATABASE_URL is not set. Fill config/secrets.local (then `npm run config`) ' +
      'or export it in your shell / CI.',
  );
  process.exit(1);
}

/** Split a SQL script into individual statements (strips line comments). */
function splitStatements(sql: string): string[] {
  return sql
    .replace(/--[^\n]*$/gm, '') // strip line comments
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

async function main(): Promise<void> {
  const client = createClient({ url: url as string, authToken });

  // Ensure bookkeeping table exists before we query it.
  await client.execute(
    `CREATE TABLE IF NOT EXISTS schema_migrations (
       version    TEXT PRIMARY KEY,
       applied_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
     );`,
  );

  const applied = new Set<string>();
  const rows = await client.execute('SELECT version FROM schema_migrations;');
  for (const r of rows.rows) applied.add(String(r.version));

  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  let count = 0;
  for (const file of files) {
    const version = basename(file, '.sql');
    if (applied.has(version)) {
      console.log(`• ${version} already applied — skipping`);
      continue;
    }
    const sql = readFileSync(resolve(MIGRATIONS_DIR, file), 'utf8');
    const statements = splitStatements(sql);
    console.log(`• Applying ${version} (${statements.length} statements)…`);

    const tx = await client.transaction('write');
    try {
      for (const stmt of statements) await tx.execute(stmt);
      await tx.commit();
    } catch (err) {
      await tx.rollback();
      console.error(`✗ Failed applying ${version}:`, err);
      process.exit(1);
    }
    count++;
    console.log(`  ✓ ${version} applied`);
  }

  client.close();
  console.log(count === 0 ? '\n✓ Database already up to date.' : `\n✓ Applied ${count} migration(s).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
