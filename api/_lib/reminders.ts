/**
 * reminders.ts — order-submission reminders (README Section 15). Invoked by the
 * free GitHub Actions cron. Sends email (Resend) + Web Push (web-push) to the
 * organizer before meal time, once per session. Sends are best-effort; the
 * find-due query is pure and unit-tested.
 */

import type { Row } from '@libsql/client';
import { query, execute } from './db';
import { reminderText } from './i18n';
import { Resend } from 'resend';
import * as webpush from 'web-push';

/** Sessions whose reminder is due and not yet sent, while still collecting. */
export async function findDueSessions(nowIso: string): Promise<Row[]> {
  return query(
    `SELECT ms.*, u.email AS owner_email, u.preferred_language AS owner_language
       FROM meal_sessions ms
       JOIN users u ON ms.owner_user_id = u.id
      WHERE ms.reminder_enabled = 1
        AND ms.reminder_sent_at IS NULL
        AND ms.remind_at IS NOT NULL
        AND ms.remind_at <= ?
        AND ms.status IN ('draft', 'collecting_orders')
      ORDER BY ms.remind_at`,
    [nowIso],
  );
}

async function sendEmail(to: string, subject: string, body: string): Promise<void> {
  if (!process.env.RESEND_API_KEY) return;
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: process.env.RESEND_FROM || 'MakanKira <reminders@makankira.app>',
      to,
      subject,
      text: body,
    });
  } catch (e) {
    console.error('reminder email failed:', e);
  }
}

async function sendPush(userId: string, title: string, body: string): Promise<void> {
  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return;
  try {
    webpush.setVapidDetails(process.env.VAPID_SUBJECT ?? 'mailto:reminders@makankira.app', pub, priv);
  } catch (e) {
    console.error('vapid setup failed:', e);
    return;
  }
  const subs = await query('SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = ?', [userId]);
  const payload = JSON.stringify({ title, body });
  for (const s of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: String(s.endpoint), keys: { p256dh: String(s.p256dh), auth: String(s.auth) } },
        payload,
      );
    } catch (e) {
      console.error('push send failed:', e);
    }
  }
}

export async function sendReminders(nowIso: string): Promise<{ processed: number }> {
  const due = await findDueSessions(nowIso);
  for (const m of due) {
    const { subject, body } = reminderText(String(m.owner_language ?? 'en'), String(m.title));
    if (m.owner_email) await sendEmail(String(m.owner_email), subject, body);
    await sendPush(String(m.owner_user_id), subject, body);
    await execute('UPDATE meal_sessions SET reminder_sent_at = ? WHERE id = ?', [nowIso, String(m.id)]);
  }
  return { processed: due.length };
}
