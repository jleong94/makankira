/**
 * GET  /api/me/payment-methods — list the account's saved receiving methods (Screen 2B).
 * POST /api/me/payment-methods — add a saved method (Screen 2B).
 */

import { withErrors, allow, assertSameOrigin, bodyObject, sendJson } from '../../_lib/http';
import { requireUser } from '../../_lib/auth';
import { listMethods, addMethod, userScope } from '../../_lib/paymentMethods';
import { toPaymentMethod } from '../../_lib/serializers';

export default withErrors(async (req, res) => {
  allow(req, ['GET', 'POST']);
  const user = await requireUser(req);
  const scope = userScope(String(user.id));

  if (req.method === 'GET') {
    const methods = await listMethods(scope);
    sendJson(res, 200, { paymentMethods: methods.map(toPaymentMethod) });
    return;
  }

  assertSameOrigin(req);
  const created = await addMethod(scope, bodyObject(req));
  sendJson(res, 201, { paymentMethod: toPaymentMethod(created) });
});
