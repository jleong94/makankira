/**
 * POST /api/files?fileKind=&mealId=&filename= — upload raw bytes to Vercel Blob
 * (body is the file; content-type header is the file's type). Returns {id, url}.
 * Kinds: duitnow_qr, menu_image, menu_excel (Screens 3, 4).
 */

import { buffer } from 'node:stream/consumers';
import type { VercelRequest } from '@vercel/node';
import { withErrors, allow, assertSameOrigin, sendJson, HttpError } from '../_lib/http';
import { requireUser } from '../_lib/auth';
import { getMealForOwner } from '../_lib/meals';
import { uploadFile } from '../_lib/files';
import { toUploadedFile } from '../_lib/serializers';

async function readBody(req: VercelRequest): Promise<Buffer> {
  const b: unknown = req.body;
  if (Buffer.isBuffer(b)) return b;
  if (typeof b === 'string') return Buffer.from(b);
  return Buffer.from(await buffer(req));
}

export default withErrors(async (req, res) => {
  allow(req, ['POST']);
  assertSameOrigin(req);
  const user = await requireUser(req);

  const fileKind = String(req.query.fileKind ?? '');
  const mealId = typeof req.query.mealId === 'string' ? req.query.mealId : null;
  if (mealId) await getMealForOwner(String(user.id), mealId);
  const filename = typeof req.query.filename === 'string' ? req.query.filename : 'upload';
  const contentType = String(req.headers['content-type'] ?? 'application/octet-stream');

  const data = await readBody(req);
  if (data.length === 0) throw new HttpError(400, 'empty_file', 'No file data received');

  const file = await uploadFile({ userId: String(user.id), mealId, fileKind, filename, contentType, data });
  sendJson(res, 201, { id: file.id, url: file.blob_url, file: toUploadedFile(file) });
});
