/** POST /api/meals/:mealId/payment-results/:resultId/mark-pending (Screen 9). */

import { withErrors, allow, assertSameOrigin, sendJson } from '../../../../_lib/http';
import { requireOwnedMeal } from '../../../../_lib/meals';
import { markPending } from '../../../../_lib/payments';
import { toPaymentResult } from '../../../../_lib/serializers';

export default withErrors(async (req, res) => {
  allow(req, ['POST']);
  assertSameOrigin(req);
  const mealId = String(req.query.mealId);
  const { user } = await requireOwnedMeal(req, mealId);
  const result = await markPending(mealId, String(req.query.resultId), String(user.id));
  sendJson(res, 200, { result: toPaymentResult(result) });
});
