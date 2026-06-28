/**
 * PATCH  /api/meals/:mealId/payment-methods/:id — update a method (Screen 3).
 * DELETE /api/meals/:mealId/payment-methods/:id — remove a method (Screen 3).
 */

import { withErrors, allow, assertSameOrigin, bodyObject, sendJson } from '../../../_lib/http';
import { requireOwnedMeal } from '../../../_lib/meals';
import { updateMethod, deleteMethod, mealScope } from '../../../_lib/paymentMethods';
import { toPaymentMethod } from '../../../_lib/serializers';

export default withErrors(async (req, res) => {
  allow(req, ['PATCH', 'DELETE']);
  assertSameOrigin(req);
  const mealId = String(req.query.mealId);
  await requireOwnedMeal(req, mealId);
  const scope = mealScope(mealId);
  const id = String(req.query.id);

  if (req.method === 'PATCH') {
    const updated = await updateMethod(scope, id, bodyObject(req));
    sendJson(res, 200, { paymentMethod: toPaymentMethod(updated) });
    return;
  }

  await deleteMethod(scope, id);
  sendJson(res, 200, { ok: true });
});
