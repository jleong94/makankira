/**
 * GET /api/meals/:mealId/orders/summary?view=restaurant|participant
 * Grouped Restaurant / Participant views (Screen 6).
 */

import { withErrors, allow, sendJson } from '../../../_lib/http';
import { requireOwnedMeal } from '../../../_lib/meals';
import { orderSummary } from '../../../_lib/orders';

export default withErrors(async (req, res) => {
  allow(req, ['GET']);
  const mealId = String(req.query.mealId);
  await requireOwnedMeal(req, mealId);
  const view = req.query.view === 'participant' ? 'participant' : 'restaurant';
  sendJson(res, 200, { view, summary: await orderSummary(mealId, view) });
});
