/**
 * auth.ts — first-party session auth for the Flutter-web SPA.
 *
 * Flow: the client obtains a Google ID token or Facebook access token and POSTs
 * it to /api/auth/login. The server VERIFIES it (Google JWKS with issuer +
 * audience checks; Facebook debug_token), upserts the user, and issues a signed
 * session JWT in an HttpOnly cookie. Other endpoints read that cookie.
 *
 * Only Google and Facebook are supported (README Section 11).
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { Row } from '@libsql/client';
import { SignJWT, jwtVerify, createRemoteJWKSet } from 'jose';
import { env, isProduction } from './env';
import { queryOne } from './db';
import { newId } from './ids';
import { HttpError } from './http';

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

function sessionSecret(): Uint8Array {
  return new TextEncoder().encode(env('SESSION_SECRET'));
}

// __Host- prefix in production hardens the cookie (requires Secure + Path=/, no Domain).
function cookieName(): string {
  return isProduction() ? '__Host-mk_session' : 'mk_session';
}

// ---- Session token + cookie ----------------------------------------------

export async function createSessionToken(userId: string): Promise<string> {
  return new SignJWT({ uid: userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(sessionSecret());
}

export async function verifySessionToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, sessionSecret());
    return typeof payload.uid === 'string' ? payload.uid : null;
  } catch {
    return null;
  }
}

export function buildSessionCookie(token: string): string {
  const parts = [
    `${cookieName()}=${token}`,
    'HttpOnly',
    'Path=/',
    'SameSite=Lax',
    `Max-Age=${SESSION_TTL_SECONDS}`,
  ];
  if (isProduction()) parts.push('Secure');
  return parts.join('; ');
}

export function buildClearCookie(): string {
  const parts = [`${cookieName()}=`, 'HttpOnly', 'Path=/', 'SameSite=Lax', 'Max-Age=0'];
  if (isProduction()) parts.push('Secure');
  return parts.join('; ');
}

export function setSessionCookie(res: VercelResponse, token: string): void {
  res.setHeader('Set-Cookie', buildSessionCookie(token));
}

export function clearSessionCookie(res: VercelResponse): void {
  res.setHeader('Set-Cookie', buildClearCookie());
}

// ---- Provider verification -----------------------------------------------

export interface VerifiedProfile {
  provider: 'google' | 'facebook';
  providerUserId: string;
  email?: string;
  displayName?: string;
  photoUrl?: string;
}

const googleJwks = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));

async function verifyGoogle(credential: string): Promise<VerifiedProfile> {
  const clientId = env('GOOGLE_OAUTH_CLIENT_ID');
  let sub: string | undefined;
  let email: unknown;
  let name: unknown;
  let picture: unknown;
  try {
    const { payload } = await jwtVerify(credential, googleJwks, {
      issuer: ['https://accounts.google.com', 'accounts.google.com'],
      audience: clientId,
    });
    sub = payload.sub;
    email = payload.email;
    name = payload.name;
    picture = payload.picture;
  } catch {
    throw new HttpError(401, 'invalid_credential', 'Google credential verification failed');
  }
  if (!sub) throw new HttpError(401, 'invalid_credential', 'Google token missing subject');
  return {
    provider: 'google',
    providerUserId: sub,
    email: typeof email === 'string' ? email : undefined,
    displayName: typeof name === 'string' ? name : undefined,
    photoUrl: typeof picture === 'string' ? picture : undefined,
  };
}

interface FbDebug {
  data?: { is_valid?: boolean; app_id?: string | number };
}
interface FbProfile {
  id?: string;
  name?: string;
  email?: string;
  picture?: { data?: { url?: string } };
}

async function verifyFacebook(credential: string): Promise<VerifiedProfile> {
  const appId = env('FACEBOOK_APP_ID');
  const appSecret = env('FACEBOOK_APP_SECRET');
  const appToken = `${appId}|${appSecret}`;
  const tok = encodeURIComponent(credential);

  const debug = (await (
    await fetch(
      `https://graph.facebook.com/debug_token?input_token=${tok}&access_token=${encodeURIComponent(appToken)}`,
    )
  ).json()) as FbDebug;
  if (!debug.data?.is_valid || String(debug.data.app_id) !== appId) {
    throw new HttpError(401, 'invalid_credential', 'Facebook token is not valid for this app');
  }

  const me = (await (
    await fetch(`https://graph.facebook.com/me?fields=id,name,email,picture.type(large)&access_token=${tok}`)
  ).json()) as FbProfile;
  if (!me.id) throw new HttpError(401, 'invalid_credential', 'Facebook profile unavailable');

  return {
    provider: 'facebook',
    providerUserId: String(me.id),
    email: typeof me.email === 'string' ? me.email : undefined,
    displayName: typeof me.name === 'string' ? me.name : undefined,
    photoUrl: me.picture?.data?.url,
  };
}

export async function verifyProvider(provider: string, credential: string): Promise<VerifiedProfile> {
  if (!credential) throw new HttpError(400, 'missing_credential', 'credential is required');
  if (provider === 'google') return verifyGoogle(credential);
  if (provider === 'facebook') return verifyFacebook(credential);
  throw new HttpError(400, 'unsupported_provider', 'Only google and facebook are supported');
}

// ---- User upsert + session lookup ----------------------------------------

/** Create the user on first login; on return logins refresh email/photo but
 *  preserve any display name / mobile the user has since customized. */
export async function upsertUser(p: VerifiedProfile): Promise<Row> {
  const row = await queryOne(
    `INSERT INTO users (id, auth_provider, provider_user_id, email, display_name, photo_url)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT (auth_provider, provider_user_id) DO UPDATE SET
       email = excluded.email,
       photo_url = excluded.photo_url,
       updated_at = strftime('%Y-%m-%dT%H:%M:%SZ','now')
     RETURNING *`,
    [newId('user'), p.provider, p.providerUserId, p.email ?? null, p.displayName ?? null, p.photoUrl ?? null],
  );
  if (!row) throw new HttpError(500, 'user_upsert_failed', 'Could not create user');
  return row;
}

export async function getSessionUser(req: VercelRequest): Promise<Row | null> {
  const token = req.cookies?.[cookieName()];
  if (!token) return null;
  const uid = await verifySessionToken(token);
  if (!uid) return null;
  return queryOne('SELECT * FROM users WHERE id = ?', [uid]);
}

export async function requireUser(req: VercelRequest): Promise<Row> {
  const user = await getSessionUser(req);
  if (!user) throw new HttpError(401, 'unauthenticated', 'Sign in required');
  return user;
}
