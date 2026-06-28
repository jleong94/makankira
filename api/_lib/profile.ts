import type { Row } from '@libsql/client';
import { queryOne } from './db.js';
import { HttpError } from './http.js';
import { isSupportedLocale, normalizeMobile } from './validate.js';

/** Update the user's profile (Screens 2A, 2D). Returns the updated row. */
export async function updateProfile(userId: string, body: Record<string, unknown>): Promise<Row> {
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
      if (!normalized) throw new HttpError(400, 'invalid_mobile', 'Mobile number is not a valid Malaysian number');
      sets.push('mobile_number = ?');
      args.push(normalized);
    } else {
      throw new HttpError(400, 'invalid_mobile', 'Mobile number must be a string');
    }
  }
  if ('preferredLanguage' in body) {
    if (!isSupportedLocale(body.preferredLanguage)) {
      throw new HttpError(400, 'invalid_locale', 'preferredLanguage must be one of en, zh, ms');
    }
    sets.push('preferred_language = ?');
    args.push(body.preferredLanguage);
  }

  if (sets.length === 0) {
    return (await queryOne('SELECT * FROM users WHERE id = ?', [userId]))!;
  }
  sets.push("updated_at = strftime('%Y-%m-%dT%H:%M:%SZ','now')");
  const updated = await queryOne(`UPDATE users SET ${sets.join(', ')} WHERE id = ? RETURNING *`, [...args, userId]);
  if (!updated) throw new HttpError(500, 'update_failed', 'Could not update profile');
  return updated;
}
