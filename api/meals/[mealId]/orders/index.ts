/**
 * GET  /api/meals/:mealId/orders — all participant orders (Screen 6).
 * POST /api/meals/:mealId/orders — create an order (Screen 5).
 */

import { withErrors, allow, assertSameOrigin, bodyObject, sendJson } from '../../../_lib/http';
import { requireOwnedMeal } from '../../../_lib/meals';
import { listOrders, createOrder } from '../../../_lib/orders';
import { toOrder } from '../../../_lib/serializers';

export default withErrors(async (req, res) => {
  allow(req, ['GET', 'POST']);
  const mealId = String(req.query.mealId);
  await requireOwnedMeal(req, mealId);

  if (req.method === 'GET') {
    const orders = await listOrders(mealId);
    sendJson(res, 200, { orders: orders.map(({ order, items }) => toOrder(order, items)) });
    return;
  }

  assertSameOrigin(req);
  const { order, items } = await createOrder(mealId, bodyObject(req));
  sendJson(res, 201, { order: toOrder(order, items) });
});
