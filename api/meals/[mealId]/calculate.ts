/**
 * POST /api/meals/:mealId/calculate — compute and persist payment_results;
 * returns the results plus a final-bill mismatch summary (Screen 8).
 */

import { withErrors, allow, assertSameOrigin, sendJson } from '../../_lib/http';
import { requireOwnedMeal } from '../../_lib/meals';
import { runCalculation } from '../../_lib/calculate';
import { toPaymentResult } from '../../_lib/serializers';

export default withErrors(async (req, res) => {
  allow(req, ['POST']);
  assertSameOrigin(req);
  const mealId = String(req.query.mealId);
  await requireOwnedMeal(req, mealId);

  const { summary, results } = await runCalculation(mealId);
  sendJson(res, 200, { summary, results: results.map(toPaymentResult) });
});
