/**
 * POST /api/cron/reminders — invoked only by the GitHub Actions schedule,
 * authenticated with CRON_SECRET (README Section 15). Sends due order reminders.
 */

import { withErrors, allow, sendJson, HttpError } from '../_lib/http';
import { sendReminders } from '../_lib/reminders';

export default withErrors(async (req, res) => {
  allow(req, ['POST']);
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.authorization !== `Bearer ${secret}`) {
    throw new HttpError(401, 'unauthorized', 'Invalid cron secret');
  }
  const nowIso = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
  const result = await sendReminders(nowIso);
  sendJson(res, 200, result);
});
