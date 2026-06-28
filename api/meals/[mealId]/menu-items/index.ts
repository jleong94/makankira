/**
 * GET  /api/meals/:mealId/menu-items — list menu items (Screens 4, 5).
 * POST /api/meals/:mealId/menu-items — add an item manually (Screen 4).
 */

import { withErrors, allow, assertSameOrigin, bodyObject, sendJson } from '../../../_lib/http';
import { requireOwnedMeal } from '../../../_lib/meals';
import { listMenuItems, addMenuItem } from '../../../_lib/menu';
import { toMenuItem } from '../../../_lib/serializers';

export default withErrors(async (req, res) => {
  allow(req, ['GET', 'POST']);
  const mealId = String(req.query.mealId);
  await requireOwnedMeal(req, mealId);

  if (req.method === 'GET') {
    const items = await listMenuItems(mealId);
    sendJson(res, 200, { menuItems: items.map(toMenuItem) });
    return;
  }

  assertSameOrigin(req);
  const item = await addMenuItem(mealId, bodyObject(req));
  sendJson(res, 201, { menuItem: toMenuItem(item) });
});
