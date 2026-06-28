import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assertUploadType, validateFileKind } from './files.js';

test('QR/menu images must be PNG/JPG/JPEG/WebP', () => {
  assert.doesNotThrow(() => assertUploadType('duitnow_qr', 'image/png'));
  assert.doesNotThrow(() => assertUploadType('menu_image', 'image/webp'));
  assert.throws(() => assertUploadType('duitnow_qr', 'application/pdf'));
  // non-image kinds are not constrained here
  assert.doesNotThrow(() => assertUploadType('menu_excel', 'application/octet-stream'));
});

test('validateFileKind accepts known kinds and rejects others', () => {
  assert.equal(validateFileKind('menu_image'), 'menu_image');
  assert.throws(() => validateFileKind('bogus'));
});
