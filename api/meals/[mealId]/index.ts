/**
 * GET    /api/meals/:mealId  — full session detail + payment methods (Screens 3, 6).
 * PATCH  /api/meals/:mealId  — update setup fields (Screen 3).
 * DELETE /api/meals/:mealId  — delete the session (Screen 2).
 */

import { withErrors, allow, assertSameOrigin, bodyObject, sendJson } from '../../_lib/http';
import { requireOwnedMeal, getMealDetail, updateMeal, deleteMeal } from '../../_lib/meals';
import { toMealSession, toPaymentMethod } from '../../_lib/serializers';

export default withErrors(async (req, res) => {
  allow(req, ['GET', 'PATCH', 'DELETE']);
  const mealId = String(req.query.mealId);
  const { user } = await requireOwnedMeal(req, mealId);

  if (req.method === 'GET') {
    const { meal, paymentMethods } = await getMealDetail(mealId);
    sendJson(res, 200, {
      meal: toMealSession(meal),
      paymentMethods: paymentMethods.map(toPaymentMethod),
    });
    return;
  }

  assertSameOrigin(req);

  if (req.method === 'PATCH') {
    const meal = await updateMeal(String(user.id), mealId, bodyObject(req));
    sendJson(res, 200, { meal: toMealSession(meal) });
    return;
  }

  await deleteMeal(String(user.id), mealId);
  sendJson(res, 200, { ok: true });
});
