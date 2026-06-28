/** GET /api/meals/:mealId/payment-status-events — payment / edit audit log (Screen 9). */

import { withErrors, allow, sendJson } from '../../../_lib/http';
import { requireOwnedMeal } from '../../../_lib/meals';
import { listEvents } from '../../../_lib/payments';
import { toPaymentStatusEvent } from '../../../_lib/serializers';

export default withErrors(async (req, res) => {
  allow(req, ['GET']);
  const mealId = String(req.query.mealId);
  await requireOwnedMeal(req, mealId);
  const events = await listEvents(mealId);
  sendJson(res, 200, { events: events.map(toPaymentStatusEvent) });
});
