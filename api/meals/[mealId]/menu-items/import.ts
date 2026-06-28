/** POST /api/meals/:mealId/menu-items/import {fileId} — bulk-create from Excel (Screen 4). */

import { withErrors, allow, assertSameOrigin, bodyObject, requireString, sendJson } from '../../../_lib/http';
import { requireOwnedMeal } from '../../../_lib/meals';
import { importFromExcel } from '../../../_lib/menuImport';
import { toMenuItem } from '../../../_lib/serializers';

export default withErrors(async (req, res) => {
  allow(req, ['POST']);
  assertSameOrigin(req);
  const mealId = String(req.query.mealId);
  await requireOwnedMeal(req, mealId);
  const fileId = requireString(bodyObject(req), 'fileId');
  const items = await importFromExcel(mealId, fileId);
  sendJson(res, 201, { menuItems: items.map(toMenuItem) });
});
