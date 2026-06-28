/**
 * GET  /api/me — current user's profile.
 * PATCH /api/me — update displayName, mobileNumber, preferredLanguage
 *                 (Screens 2A, 2D). README Section 11 (Profile) validation.
 */

import { withErrors, allow, assertSameOrigin, bodyObject, sendJson, HttpError } from './_lib/http';
import { requireUser } from './_lib/auth';
import { queryOne } from './_lib/db';
import { toUser } from './_lib/serializers';
import { isSupportedLocale, normalizeMobile } from './_lib/validate';

export default withErrors(async (req, res) => {
  allow(req, ['GET', 'PATCH']);
  const user = await requireUser(req);

  if (req.method === 'GET') {
    sendJson(res, 200, { user: toUser(user) });
    return;
  }

  assertSameOrigin(req);
  const body = bodyObject(req);

  const sets: string[] = [];
  const args: (string | null)[] = [];

  if ('displayName' in body) {
    const v = body.displayName;
    if (typeof v !== 'string' || v.trim().length === 0) {
      throw new HttpError(400, 'invalid_display_name', 'Display name cannot be empty');
    }
    sets.push('display_name = ?');
    args.push(v.trim());
  }

  if ('mobileNumber' in body) {
    const v = body.mobileNumber;
    if (v == null || v === '') {
      sets.push('mobile_number = ?');
      args.push(null);
    } else if (typeof v === 'string') {
      const normalized = normalizeMobile(v);
      if (!normalized) {
        throw new HttpError(400, 'invalid_mobile', 'Mobile number is not a valid Malaysian number');
      }
      sets.push('mobile_number = ?');
      args.push(normalized);
    } else {
      throw new HttpError(400, 'invalid_mobile', 'Mobile number must be a string');
    }
  }

  if ('preferredLanguage' in body) {
    const v = body.preferredLanguage;
    if (!isSupportedLocale(v)) {
      throw new HttpError(400, 'invalid_locale', 'preferredLanguage must be one of en, zh, ms');
    }
    sets.push('preferred_language = ?');
    args.push(v);
  }

  if (sets.length === 0) {
    sendJson(res, 200, { user: toUser(user) });
    return;
  }

  sets.push("updated_at = strftime('%Y-%m-%dT%H:%M:%SZ','now')");
  const updated = await queryOne(
    `UPDATE users SET ${sets.join(', ')} WHERE id = ? RETURNING *`,
    [...args, String(user.id)],
  );
  if (!updated) throw new HttpError(500, 'update_failed', 'Could not update profile');
  sendJson(res, 200, { user: toUser(updated) });
});
