/** GET /api/meals/:mealId/payment-results — list computed results (Screens 8, 9). */

import { withErrors, allow, sendJson } from '../../../_lib/http';
import { requireOwnedMeal } from '../../../_lib/meals';
import { listResults } from '../../../_lib/payments';
import { toPaymentResult } from '../../../_lib/serializers';

export default withErrors(async (req, res) => {
  allow(req, ['GET']);
  const mealId = String(req.query.mealId);
  await requireOwnedMeal(req, mealId);
  const results = await listResults(mealId);
  sendJson(res, 200, { results: results.map(toPaymentResult) });
});
