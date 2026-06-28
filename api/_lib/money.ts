/** money.ts — format integer sen as Malaysian Ringgit. RM 9.50 = 950. */

export function formatRM(cents: number): string {
  const sign = cents < 0 ? '-' : '';
  const abs = Math.abs(cents);
  return `${sign}RM ${(abs / 100).toFixed(2)}`;
}
