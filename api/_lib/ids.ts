/**
 * ids.ts — application-generated primary keys: a type prefix + a short unique id
 * (README Section 16, "IDs are TEXT, application-generated with a type prefix").
 */

import { customAlphabet } from 'nanoid';

// URL-safe, lowercase, no ambiguous separators inside the random part.
const nano = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 20);

export type IdPrefix =
  | 'user'
  | 'meal'
  | 'item'
  | 'order'
  | 'oi'
  | 'bill'
  | 'pm'
  | 'upm'
  | 'file'
  | 'pr'
  | 'evt'
  | 'push';

export function newId(prefix: IdPrefix): string {
  return `${prefix}_${nano()}`;
}
