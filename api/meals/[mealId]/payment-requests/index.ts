/**
 * GET /api/meals/:mealId/payment-requests?locale= — localized message per paying
 * participant, with method details, a QR image link, and a free wa.me link (Screen 9).
 */

import { withErrors, allow, sendJson } from '../../../_lib/http';
import { requireOwnedMeal } from '../../../_lib/meals';
import { buildRequests } from '../../../_lib/paymentRequests';

export default withErrors(async (req, res) => {
  allow(req, ['GET']);
  const mealId = String(req.query.mealId);
  const { user } = await requireOwnedMeal(req, mealId);
  const locale =
    typeof req.query.locale === 'string' ? req.query.locale : String(user.preferred_language ?? 'en');
  const requests = await buildRequests(mealId, locale);
  sendJson(res, 200, { requests });
});
