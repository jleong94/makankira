import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Row } from '@libsql/client';
import {
  createSessionToken,
  verifySessionToken,
  buildSessionCookie,
  buildClearCookie,
} from './auth.js';
import { toUser } from './serializers.js';

process.env.SESSION_SECRET = 'unit-test-secret-unit-test-secret-123456';
process.env.APP_PROFILE = 'local';

test('session token round-trips the user id', async () => {
  const token = await createSessionToken('user_abc');
  assert.equal(await verifySessionToken(token), 'user_abc');
});

test('tampered or garbage tokens verify to null', async () => {
  assert.equal(await verifySessionToken('not-a-jwt'), null);
  const token = await createSessionToken('user_abc');
  assert.equal(await verifySessionToken(token + 'x'), null);
});

test('session cookie is HttpOnly + SameSite=Lax; clear cookie expires it', () => {
  const cookie = buildSessionCookie('tok');
  assert.match(cookie, /mk_session=tok/);
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /SameSite=Lax/);
  assert.match(cookie, /Max-Age=\d+/);
  assert.doesNotMatch(cookie, /Secure/); // local profile
  assert.match(buildClearCookie(), /Max-Age=0/);
});

test('production cookie uses the __Host- prefix and Secure', () => {
  process.env.APP_PROFILE = 'production';
  const cookie = buildSessionCookie('tok');
  assert.match(cookie, /__Host-mk_session=tok/);
  assert.match(cookie, /Secure/);
  process.env.APP_PROFILE = 'local';
});

test('toUser maps fields and never leaks provider_user_id', () => {
  const row = {
    id: 'user_1',
    auth_provider: 'google',
    provider_user_id: 'g-secret-123',
    email: 'a@b.com',
    display_name: 'Ann',
    mobile_number: '60123456789',
    photo_url: null,
    preferred_language: 'en',
    created_at: 't0',
    updated_at: 't1',
  } as unknown as Row;
  const dto = toUser(row);
  assert.equal(dto.id, 'user_1');
  assert.equal(dto.displayName, 'Ann');
  assert.equal(dto.mobileNumber, '60123456789');
  assert.equal(dto.photoUrl, null);
  assert.equal('providerUserId' in dto, false);
  assert.equal('provider_user_id' in dto, false);
});
