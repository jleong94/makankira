/** PATCH /api/meals/:mealId/payment-results/:resultId — manual amount override (Screen 8). */

import { withErrors, allow, assertSameOrigin, bodyObject, sendJson } from '../../../_lib/http';
import { requireOwnedMeal } from '../../../_lib/meals';
import { overrideResult } from '../../../_lib/payments';
import { toPaymentResult } from '../../../_lib/serializers';

export default withErrors(async (req, res) => {
  allow(req, ['PATCH']);
  assertSameOrigin(req);
  const mealId = String(req.query.mealId);
  const { user } = await requireOwnedMeal(req, mealId);
  const result = await overrideResult(mealId, String(req.query.resultId), bodyObject(req), String(user.id));
  sendJson(res, 200, { result: toPaymentResult(result) });
});
