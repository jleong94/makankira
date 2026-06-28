/** POST /api/meals/:mealId/payment-results/:resultId/mark-paid {paidAt?} (Screen 9). */

import { withErrors, allow, assertSameOrigin, bodyObject, sendJson } from '../../../../_lib/http';
import { requireOwnedMeal } from '../../../../_lib/meals';
import { markPaid } from '../../../../_lib/payments';
import { toPaymentResult } from '../../../../_lib/serializers';

export default withErrors(async (req, res) => {
  allow(req, ['POST']);
  assertSameOrigin(req);
  const mealId = String(req.query.mealId);
  const { user } = await requireOwnedMeal(req, mealId);
  const paidAt = typeof bodyObject(req).paidAt === 'string' ? String(bodyObject(req).paidAt) : null;
  const result = await markPaid(mealId, String(req.query.resultId), paidAt, String(user.id));
  sendJson(res, 200, { result: toPaymentResult(result) });
});
