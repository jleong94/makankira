/**
 * GET  /api/meals/:mealId/payment-methods — list session receiving methods (Screens 3, 9).
 * POST /api/meals/:mealId/payment-methods — add one (Screen 3).
 */

import { withErrors, allow, assertSameOrigin, bodyObject, sendJson } from '../../../_lib/http';
import { requireOwnedMeal } from '../../../_lib/meals';
import { listMethods, addMethod, mealScope } from '../../../_lib/paymentMethods';
import { toPaymentMethod } from '../../../_lib/serializers';

export default withErrors(async (req, res) => {
  allow(req, ['GET', 'POST']);
  const mealId = String(req.query.mealId);
  await requireOwnedMeal(req, mealId);
  const scope = mealScope(mealId);

  if (req.method === 'GET') {
    const methods = await listMethods(scope);
    sendJson(res, 200, { paymentMethods: methods.map(toPaymentMethod) });
    return;
  }

  assertSameOrigin(req);
  const created = await addMethod(scope, bodyObject(req));
  sendJson(res, 201, { paymentMethod: toPaymentMethod(created) });
});
