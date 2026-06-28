#!/usr/bin/env node
/**
 * load-config.mjs  (README Section 15)
 *
 * Resolves the active profile into build artifacts:
 *   1. Reads config/app-config.yaml (master) to pick the active profile.
 *   2. Reads config/app-config.<profile>.yaml.
 *   3. Loads config/secrets.local (if present) into the environment so ${VAR}
 *      placeholders resolve in local dev. In CI the vars come from the workflow.
 *   4. Resolves ${VAR} and ${VAR:default} placeholders from the environment.
 *   5. Writes:
 *        - config/frontend.<profile>.json  (PUBLIC, flat — for --dart-define-from-file)
 *        - .env                            (SECRET backend vars — for `vercel dev`)
 *
 * Run with:  npm run config        (APP_PROFILE selects the profile; default "local")
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';
import dotenv from 'dotenv';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CONFIG_DIR = resolve(ROOT, 'config');

/** Resolve ${VAR} / ${VAR:default} from process.env, recursively over the parsed YAML. */
function resolvePlaceholders(value, missing) {
  if (typeof value === 'string') {
    return value.replace(/\$\{([A-Za-z_][A-Za-z0-9_]*)(?::([^}]*))?\}/g, (_m, name, def) => {
      const env = process.env[name];
      if (env !== undefined && env !== '') return env;
      if (def !== undefined) return def;
      missing.add(name);
      return '';
    });
  }
  if (Array.isArray(value)) return value.map((v) => resolvePlaceholders(v, missing));
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, resolvePlaceholders(v, missing)]),
    );
  }
  return value;
}

function readYaml(file) {
  if (!existsSync(file)) throw new Error(`Config file not found: ${file}`);
  return parseYaml(readFileSync(file, 'utf8')) ?? {};
}

// 1. Load local secrets into the environment (no-op in CI where the file is absent).
const secretsLocal = resolve(CONFIG_DIR, 'secrets.local');
if (existsSync(secretsLocal)) {
  dotenv.config({ path: secretsLocal });
  console.log('• Loaded config/secrets.local into the environment');
} else {
  console.log('• config/secrets.local not found (expected in CI; in local dev copy it from the .example)');
}

// 2. Master file -> active profile.
const missing = new Set();
const master = resolvePlaceholders(readYaml(resolve(CONFIG_DIR, 'app-config.yaml')), missing);
const profile = process.env.APP_PROFILE || master.activeProfile || 'local';
console.log(`• Active profile: ${profile}`);

// 3. Per-profile file.
const profileCfg = resolvePlaceholders(
  readYaml(resolve(CONFIG_DIR, `app-config.${profile}.yaml`)),
  missing,
);

const app = master.app ?? {};
const frontend = profileCfg.frontend ?? {};
const backend = profileCfg.backend ?? {};

// 4. Frontend (PUBLIC) — flat string map for Flutter's --dart-define-from-file.
const frontendOut = {
  APP_NAME: String(app.name ?? 'MakanKira'),
  DEFAULT_LOCALE: String(app.defaultLocale ?? 'en'),
  SUPPORTED_LOCALES: (app.supportedLocales ?? ['en']).join(','),
  API_BASE_URL: String(frontend.apiBaseUrl ?? '/api'),
  GOOGLE_OAUTH_CLIENT_ID: String(frontend.googleOAuthClientId ?? ''),
  FACEBOOK_APP_ID: String(frontend.facebookAppId ?? ''),
  VAPID_PUBLIC_KEY: String(frontend.vapidPublicKey ?? ''),
};
const frontendPath = resolve(CONFIG_DIR, `frontend.${profile}.json`);
writeFileSync(frontendPath, JSON.stringify(frontendOut, null, 2) + '\n');
console.log(`• Wrote ${frontendPath} (public frontend config)`);

// 5. Backend (SECRET) — .env for `vercel dev`. Map config keys to UPPER_SNAKE env names.
const backendEnv = {
  TURSO_DATABASE_URL: backend.tursoDatabaseUrl ?? '',
  TURSO_AUTH_TOKEN: backend.tursoAuthToken ?? '',
  GOOGLE_OAUTH_CLIENT_ID: frontend.googleOAuthClientId ?? '',
  FACEBOOK_APP_ID: frontend.facebookAppId ?? '',
  FACEBOOK_APP_SECRET: backend.facebookAppSecret ?? '',
  SESSION_SECRET: backend.sessionSecret ?? '',
  BLOB_READ_WRITE_TOKEN: backend.fileStorageToken ?? '',
  RESEND_API_KEY: backend.resendApiKey ?? '',
  RESEND_FROM: backend.resendFrom ?? '',
  VAPID_PUBLIC_KEY: backend.vapidPublicKey ?? frontend.vapidPublicKey ?? '',
  VAPID_PRIVATE_KEY: backend.vapidPrivateKey ?? '',
  VAPID_SUBJECT: backend.vapidSubject ?? '',
  CRON_SECRET: backend.cronSecret ?? '',
  APP_PROFILE: profile,
};
const envLines = Object.entries(backendEnv)
  .map(([k, v]) => `${k}=${String(v)}`)
  .join('\n');
const envPath = resolve(ROOT, '.env');
writeFileSync(envPath, envLines + '\n');
console.log(`• Wrote ${envPath} (backend env for vercel dev)`);

if (missing.size > 0) {
  console.warn(
    `\n⚠  ${missing.size} placeholder(s) had no value and were left empty:\n   ` +
      [...missing].sort().join(', ') +
      `\n   Fill them in config/secrets.local (local) or as CI secrets before running for real.`,
  );
}
console.log('\n✓ Config resolved.');
