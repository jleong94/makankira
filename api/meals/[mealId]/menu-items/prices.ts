/**
 * PUT /api/meals/:mealId/menu-items/prices — bulk set actual prices
 * [{ itemId, actualPriceCents }] (Screen 7).
 */

import { withErrors, allow, assertSameOrigin, bodyObject, sendJson, HttpError } from '../../../_lib/http';
import { requireOwnedMeal } from '../../../_lib/meals';
import { setActualPrices } from '../../../_lib/menu';
import { toMenuItem } from '../../../_lib/serializers';

export default withErrors(async (req, res) => {
  allow(req, ['PUT']);
  assertSameOrigin(req);
  const mealId = String(req.query.mealId);
  await requireOwnedMeal(req, mealId);

  const body = bodyObject(req);
  const raw = body.prices;
  if (!Array.isArray(raw)) {
    throw new HttpError(400, 'invalid_request', 'prices must be an array of { itemId, actualPriceCents }');
  }
  const prices = raw.map((p) => {
    const e = (p ?? {}) as Record<string, unknown>;
    if (typeof e.itemId !== 'string') {
      throw new HttpError(400, 'invalid_request', 'each price needs an itemId');
    }
    return { itemId: e.itemId, actualPriceCents: e.actualPriceCents as number };
  });

  const items = await setActualPrices(mealId, prices);
  sendJson(res, 200, { menuItems: items.map(toMenuItem) });
});
