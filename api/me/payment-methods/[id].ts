/**
 * PATCH  /api/me/payment-methods/:id — update a saved method (Screen 2B).
 * DELETE /api/me/payment-methods/:id — remove a saved method (Screen 2B).
 */

import { withErrors, allow, assertSameOrigin, bodyObject, sendJson } from '../../_lib/http';
import { requireUser } from '../../_lib/auth';
import { updateMethod, deleteMethod, userScope } from '../../_lib/paymentMethods';
import { toPaymentMethod } from '../../_lib/serializers';

export default withErrors(async (req, res) => {
  allow(req, ['PATCH', 'DELETE']);
  assertSameOrigin(req);
  const user = await requireUser(req);
  const scope = userScope(String(user.id));
  const id = String(req.query.id);

  if (req.method === 'PATCH') {
    const updated = await updateMethod(scope, id, bodyObject(req));
    sendJson(res, 200, { paymentMethod: toPaymentMethod(updated) });
    return;
  }

  await deleteMethod(scope, id);
  sendJson(res, 200, { ok: true });
});
