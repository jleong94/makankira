/**
 * GET /api/meals/:mealId/bill — current bill adjustments (Screens 7, 8).
 * PUT /api/meals/:mealId/bill — upsert tax/service/discount/company claim/final
 *                               bill/mode/allocation methods/rounding (Screens 7, 8).
 */

import { withErrors, allow, assertSameOrigin, bodyObject, sendJson } from '../../_lib/http';
import { requireOwnedMeal } from '../../_lib/meals';
import { getBill, upsertBill } from '../../_lib/bill';
import { toBillAdjustment } from '../../_lib/serializers';

export default withErrors(async (req, res) => {
  allow(req, ['GET', 'PUT']);
  const mealId = String(req.query.mealId);
  await requireOwnedMeal(req, mealId);

  if (req.method === 'GET') {
    const bill = await getBill(mealId);
    sendJson(res, 200, { bill: bill ? toBillAdjustment(bill) : null });
    return;
  }

  assertSameOrigin(req);
  const bill = await upsertBill(mealId, bodyObject(req));
  sendJson(res, 200, { bill: toBillAdjustment(bill) });
});
