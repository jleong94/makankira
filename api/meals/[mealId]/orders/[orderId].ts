/**
 * GET    /api/meals/:mealId/orders/:orderId — single order (Screens 5, 6).
 * PATCH  /api/meals/:mealId/orders/:orderId — edit before finalization.
 * DELETE /api/meals/:mealId/orders/:orderId — remove the order (Screen 6).
 */

import { withErrors, allow, assertSameOrigin, bodyObject, sendJson } from '../../../_lib/http';
import { requireOwnedMeal } from '../../../_lib/meals';
import { getOrder, updateOrder, deleteOrder } from '../../../_lib/orders';
import { toOrder } from '../../../_lib/serializers';

export default withErrors(async (req, res) => {
  allow(req, ['GET', 'PATCH', 'DELETE']);
  const mealId = String(req.query.mealId);
  await requireOwnedMeal(req, mealId);
  const orderId = String(req.query.orderId);

  if (req.method === 'GET') {
    const { order, items } = await getOrder(mealId, orderId);
    sendJson(res, 200, { order: toOrder(order, items) });
    return;
  }

  assertSameOrigin(req);

  if (req.method === 'PATCH') {
    const { order, items } = await updateOrder(mealId, orderId, bodyObject(req));
    sendJson(res, 200, { order: toOrder(order, items) });
    return;
  }

  await deleteOrder(mealId, orderId);
  sendJson(res, 200, { ok: true });
});
