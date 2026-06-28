/** POST /api/meals/:mealId/close — set status closed (Screen 9). */

import { withErrors, allow, assertSameOrigin, sendJson } from '../../_lib/http';
import { requireOwnedMeal, closeMeal } from '../../_lib/meals';
import { toMealSession } from '../../_lib/serializers';

export default withErrors(async (req, res) => {
  allow(req, ['POST']);
  assertSameOrigin(req);
  const mealId = String(req.query.mealId);
  const { user } = await requireOwnedMeal(req, mealId);
  const meal = await closeMeal(String(user.id), mealId);
  sendJson(res, 200, { meal: toMealSession(meal) });
});
