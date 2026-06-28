/**
 * env.ts — typed access to server-side runtime configuration.
 *
 * Only the /api layer reads these (Turso URL/token, OAuth secrets, etc.).
 * Locally they come from `.env` (written by load-config) consumed by `vercel dev`;
 * in production they are Vercel project environment variables.
 */

/** Required env var. Throws if missing or empty. */
export function env(name: string): string {
  const v = process.env[name];
  if (v === undefined || v === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return v;
}

/** Optional env var. Returns undefined when missing or empty. */
export function envOptional(name: string): string | undefined {
  const v = process.env[name];
  return v !== undefined && v !== '' ? v : undefined;
}

export function activeProfile(): 'local' | 'staging' | 'production' {
  const p = process.env.APP_PROFILE ?? 'local';
  return p === 'production' || p === 'staging' ? p : 'local';
}

export const isProduction = (): boolean => activeProfile() === 'production';
