/**
 * validate.ts — small shared validators (README Section 11).
 */

export type Locale = 'en' | 'zh' | 'ms';

export function isSupportedLocale(v: unknown): v is Locale {
  return v === 'en' || v === 'zh' || v === 'ms';
}

/**
 * Normalize a Malaysian mobile number to the `60XXXXXXXXX` form (no `+`),
 * suitable for wa.me links. Accepts `0123456789`, `60123456789`,
 * `+60123456789` with optional spaces/dashes. Returns null if it doesn't look
 * like a Malaysian mobile number.
 */
export function normalizeMobile(raw: string): string | null {
  const s = raw.replace(/[\s-]/g, '');
  if (!/^(?:\+?60|0)1\d{7,9}$/.test(s)) return null;
  let digits = s.replace(/^\+/, '');
  if (digits.startsWith('0')) digits = '60' + digits.slice(1);
  return digits;
}
