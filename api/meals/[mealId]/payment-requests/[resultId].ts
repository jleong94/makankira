/** GET /api/meals/:mealId/payment-requests/:resultId — single participant message (Screen 9). */

import { withErrors, allow, sendJson } from '../../../_lib/http';
import { requireOwnedMeal } from '../../../_lib/meals';
import { buildRequest } from '../../../_lib/paymentRequests';

export default withErrors(async (req, res) => {
  allow(req, ['GET']);
  const mealId = String(req.query.mealId);
  const { user } = await requireOwnedMeal(req, mealId);
  const locale =
    typeof req.query.locale === 'string' ? req.query.locale : String(user.preferred_language ?? 'en');
  const request = await buildRequest(mealId, String(req.query.resultId), locale);
  sendJson(res, 200, { request });
});
