/**
 * PATCH  /api/meals/:mealId/menu-items/:itemId — edit / mark unavailable / set actual price.
 * DELETE /api/meals/:mealId/menu-items/:itemId — delete the item (Screen 4).
 */

import { withErrors, allow, assertSameOrigin, bodyObject, sendJson } from '../../../_lib/http';
import { requireOwnedMeal } from '../../../_lib/meals';
import { updateMenuItem, deleteMenuItem } from '../../../_lib/menu';
import { toMenuItem } from '../../../_lib/serializers';

export default withErrors(async (req, res) => {
  allow(req, ['PATCH', 'DELETE']);
  assertSameOrigin(req);
  const mealId = String(req.query.mealId);
  await requireOwnedMeal(req, mealId);
  const itemId = String(req.query.itemId);

  if (req.method === 'PATCH') {
    const item = await updateMenuItem(mealId, itemId, bodyObject(req));
    sendJson(res, 200, { menuItem: toMenuItem(item) });
    return;
  }

  await deleteMenuItem(mealId, itemId);
  sendJson(res, 200, { ok: true });
});
