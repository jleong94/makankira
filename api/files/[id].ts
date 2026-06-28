/**
 * GET    /api/files/:id — file metadata for display (Screens 3, 9).
 * DELETE /api/files/:id — remove the blob and its row (Screens 3, 4).
 */

import { withErrors, allow, assertSameOrigin, sendJson } from '../_lib/http';
import { requireUser } from '../_lib/auth';
import { getFile, deleteFile } from '../_lib/files';
import { toUploadedFile } from '../_lib/serializers';

export default withErrors(async (req, res) => {
  allow(req, ['GET', 'DELETE']);
  const user = await requireUser(req);
  const id = String(req.query.id);

  if (req.method === 'GET') {
    const file = await getFile(String(user.id), id);
    sendJson(res, 200, { file: toUploadedFile(file) });
    return;
  }

  assertSameOrigin(req);
  await deleteFile(String(user.id), id);
  sendJson(res, 200, { ok: true });
});
