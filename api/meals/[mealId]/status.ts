/** POST /api/meals/:mealId/status {status} — guarded status transition (Screens 7, 9). */

import { withErrors, allow, assertSameOrigin, bodyObject, requireString, sendJson } from '../../_lib/http';
import { requireOwnedMeal, setStatus } from '../../_lib/meals';
import { toMealSession } from '../../_lib/serializers';

export default withErrors(async (req, res) => {
  allow(req, ['POST']);
  assertSameOrigin(req);
  const mealId = String(req.query.mealId);
  const { user } = await requireOwnedMeal(req, mealId);
  const status = requireString(bodyObject(req), 'status');
  const meal = await setStatus(String(user.id), mealId, status);
  sendJson(res, 200, { meal: toMealSession(meal) });
});
