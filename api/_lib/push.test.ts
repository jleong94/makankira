import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { rmSync } from 'node:fs';
import type { Row } from '@libsql/client';
import { setupTestDb } from './testdb';
import { upsertUser } from './auth';
import { addSubscription, listSubscriptions, removeSubscription } from './push';

let dbFile: string;
let user: Row;

before(async () => {
  dbFile = await setupTestDb();
  user = await upsertUser({ provider: 'google', providerUserId: 'push-user', displayName: 'U' });
});
after(() => {
  try {
    rmSync(dbFile, { force: true });
  } catch {
    /* ignore */
  }
});

test('subscriptions add, upsert by endpoint, and remove', async () => {
  const sub = await addSubscription(String(user.id), {
    endpoint: 'https://push.example/abc',
    p256dh: 'key',
    auth: 'secret',
    userAgent: 'Chrome',
  });
  assert.equal((await listSubscriptions(String(user.id))).length, 1);

  // Re-subscribing the same endpoint updates in place (no duplicate).
  await addSubscription(String(user.id), { endpoint: 'https://push.example/abc', p256dh: 'key2', auth: 'secret2' });
  assert.equal((await listSubscriptions(String(user.id))).length, 1);

  await removeSubscription(String(user.id), String(sub.id));
  assert.equal((await listSubscriptions(String(user.id))).length, 0);
});
