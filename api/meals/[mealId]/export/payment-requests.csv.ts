/** GET /api/meals/:mealId/export/payment-requests.csv (Screen 9). */

import { withErrors, allow } from '../../../_lib/http';
import { requireOwnedMeal } from '../../../_lib/meals';
import { buildPaymentRequestsCsv } from '../../../_lib/exports';

export default withErrors(async (req, res) => {
  allow(req, ['GET']);
  const mealId = String(req.query.mealId);
  const { user } = await requireOwnedMeal(req, mealId);
  const locale = typeof req.query.locale === 'string' ? req.query.locale : String(user.preferred_language ?? 'en');
  const csv = await buildPaymentRequestsCsv(mealId, locale);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="payment-requests-${mealId}.csv"`);
  res.status(200).send(csv);
});
