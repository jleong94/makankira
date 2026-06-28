/**
 * GET  /api/meals?status=&q=  — list the user's meal sessions (Screen 2).
 * POST /api/meals             — create a session; prefills the owner's saved
 *                               payment defaults (Screen 3).
 */

import { withErrors, allow, assertSameOrigin, bodyObject, sendJson } from '../_lib/http';
import { requireUser } from '../_lib/auth';
import { listMeals, createMeal } from '../_lib/meals';
import { toMealSession } from '../_lib/serializers';

export default withErrors(async (req, res) => {
  allow(req, ['GET', 'POST']);
  const user = await requireUser(req);

  if (req.method === 'GET') {
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const q = typeof req.query.q === 'string' ? req.query.q : undefined;
    const meals = await listMeals(String(user.id), { status, q });
    sendJson(res, 200, { meals: meals.map(toMealSession) });
    return;
  }

  assertSameOrigin(req);
  const meal = await createMeal(user, bodyObject(req));
  sendJson(res, 201, { meal: toMealSession(meal) });
});
