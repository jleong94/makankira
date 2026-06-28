/** GET /api/meals/:mealId/menu-template.xlsx — menu import template (Screen 4). */

import { withErrors, allow } from '../../_lib/http';
import { requireOwnedMeal } from '../../_lib/meals';
import { buildMenuTemplateWorkbook } from '../../_lib/exports';

export default withErrors(async (req, res) => {
  allow(req, ['GET']);
  const mealId = String(req.query.mealId);
  await requireOwnedMeal(req, mealId);
  const buf = await buildMenuTemplateWorkbook();
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="menu-template.xlsx"');
  res.status(200).send(buf);
});
