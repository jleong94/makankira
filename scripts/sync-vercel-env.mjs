#!/usr/bin/env node
/**
 * sync-vercel-env.mjs  (README Section 15)
 *
 * Idempotently pushes the backend (runtime) secrets into the Vercel project's
 * Environment Variables for the target environment, so the deployed /api
 * functions have them at runtime. Run in CI after `load-config` and before
 * `vercel deploy`.
 *
 * Requires (from GitHub secrets in CI):
 *   VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID
 * Reads the secret values themselves from the environment (the workflow maps
 * GitHub secrets to env vars). Target = "production" when APP_PROFILE=production,
 * otherwise "preview".
 */

import { spawnSync } from 'node:child_process';

const profile = process.env.APP_PROFILE || 'local';
const target = profile === 'production' ? 'production' : 'preview';

const token = process.env.VERCEL_TOKEN;
if (!token) {
  console.error('VERCEL_TOKEN is required.');
  process.exit(1);
}

// Default the non-secret Web Push subject if the workflow did not provide it.
process.env.VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:reminders@makankira.app';

// Runtime values the deployed API needs. Public IDs are included so the server
// can verify tokens; the truly-secret ones are the bulk of the list.
const RUNTIME_VARS = [
  'TURSO_DATABASE_URL',
  'TURSO_AUTH_TOKEN',
  'GOOGLE_OAUTH_CLIENT_ID',
  'GOOGLE_OAUTH_CLIENT_SECRET',
  'FACEBOOK_APP_ID',
  'FACEBOOK_APP_SECRET',
  'SESSION_SECRET',
  'BLOB_READ_WRITE_TOKEN',
  'RESEND_API_KEY',
  'VAPID_PUBLIC_KEY',
  'VAPID_PRIVATE_KEY',
  'VAPID_SUBJECT',
  'CRON_SECRET',
];

function vercel(args, input) {
  return spawnSync('vercel', args, { input, encoding: 'utf8', env: process.env });
}

let synced = 0;
for (const name of RUNTIME_VARS) {
  const value = process.env[name];
  if (value === undefined || value === '') {
    console.warn(`• skip ${name} (no value in environment)`);
    continue;
  }
  // Remove the existing value first so re-runs update cleanly (ignore failures).
  vercel(['env', 'rm', name, target, '--yes', '--token', token]);
  const res = vercel(['env', 'add', name, target, '--token', token], value + '\n');
  if (res.status !== 0) {
    console.error(`✗ failed to set ${name}:`, res.stderr || res.stdout);
    process.exit(1);
  }
  synced++;
  console.log(`• set ${name} (${target})`);
}

console.log(`\n✓ Synced ${synced} runtime variable(s) to Vercel (${target}).`);
