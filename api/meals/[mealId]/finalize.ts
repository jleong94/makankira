/** POST /api/meals/:mealId/finalize — lock orders, set status finalized (Screen 6). */

import { withErrors, allow, assertSameOrigin, sendJson } from '../../_lib/http';
import { requireOwnedMeal, finalizeMeal } from '../../_lib/meals';
import { toMealSession } from '../../_lib/serializers';

export default withErrors(async (req, res) => {
  allow(req, ['POST']);
  assertSameOrigin(req);
  const mealId = String(req.query.mealId);
  const { user } = await requireOwnedMeal(req, mealId);
  const meal = await finalizeMeal(String(user.id), mealId);
  sendJson(res, 200, { meal: toMealSession(meal) });
});
