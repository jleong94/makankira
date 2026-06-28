/**
 * push.ts — Web Push subscriptions per device (README Screen 2C). Used by the
 * reminder cron. Android/desktop only; iOS uses email reminders.
 */

import type { Row } from '@libsql/client';
import { query, queryOne, execute } from './db';
import { newId } from './ids';
import { HttpError } from './http';

const asStr = (v: unknown): string | null => (typeof v === 'string' && v.length > 0 ? v : null);

export async function listSubscriptions(userId: string): Promise<Row[]> {
  return query('SELECT * FROM push_subscriptions WHERE user_id = ?', [userId]);
}

export async function addSubscription(userId: string, input: Record<string, unknown>): Promise<Row> {
  const endpoint = asStr(input.endpoint);
  const p256dh = asStr(input.p256dh);
  const auth = asStr(input.auth);
  if (!endpoint || !p256dh || !auth) {
    throw new HttpError(400, 'invalid_subscription', 'endpoint, p256dh, and auth are required');
  }
  // Upsert on (user_id, endpoint) so re-subscribing the same device is idempotent.
  await execute(
    `INSERT INTO push_subscriptions (id, user_id, endpoint, p256dh, auth, user_agent)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT (user_id, endpoint) DO UPDATE SET p256dh = excluded.p256dh, auth = excluded.auth, user_agent = excluded.user_agent`,
    [newId('push'), userId, endpoint, p256dh, auth, asStr(input.userAgent)],
  );
  return (await queryOne('SELECT * FROM push_subscriptions WHERE user_id = ? AND endpoint = ?', [userId, endpoint]))!;
}

export async function removeSubscription(userId: string, id: string): Promise<void> {
  const existing = await queryOne('SELECT id FROM push_subscriptions WHERE id = ? AND user_id = ?', [id, userId]);
  if (!existing) throw new HttpError(404, 'not_found', 'Subscription not found');
  await query('DELETE FROM push_subscriptions WHERE id = ?', [id]);
}
