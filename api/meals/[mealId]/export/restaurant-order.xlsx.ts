/** GET /api/meals/:mealId/export/restaurant-order.xlsx (Screen 6). */

import { withErrors, allow } from '../../../_lib/http';
import { requireOwnedMeal } from '../../../_lib/meals';
import { buildRestaurantOrderWorkbook } from '../../../_lib/exports';

export default withErrors(async (req, res) => {
  allow(req, ['GET']);
  const mealId = String(req.query.mealId);
  const { user } = await requireOwnedMeal(req, mealId);
  const locale = typeof req.query.locale === 'string' ? req.query.locale : String(user.preferred_language ?? 'en');
  const buf = await buildRestaurantOrderWorkbook(mealId, locale);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="restaurant-order-${mealId}.xlsx"`);
  res.status(200).send(buf);
});
