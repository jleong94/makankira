/**
 * serializers.ts — map snake_case DB rows to the camelCase JSON DTOs the UI
 * consumes (README Section 9). Money stays as integer-cents fields.
 */

import type { Row } from '@libsql/client';

const str = (v: unknown): string | null => (v == null ? null : String(v));
const num = (v: unknown): number | null => (v == null ? null : Number(v));
const bool = (v: unknown): boolean => Number(v) === 1;

/** Public user DTO — never exposes the provider's raw user id. */
export function toUser(row: Row): Record<string, unknown> {
  return {
    id: row.id,
    authProvider: row.auth_provider,
    email: str(row.email),
    displayName: str(row.display_name),
    mobileNumber: str(row.mobile_number),
    photoUrl: str(row.photo_url),
    preferredLanguage: row.preferred_language,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const serdeHelpers = { str, num, bool };
