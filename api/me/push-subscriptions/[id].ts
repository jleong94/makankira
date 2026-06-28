/** DELETE /api/me/push-subscriptions/:id — remove a push subscription (Screen 2C). */

import { withErrors, allow, assertSameOrigin, sendJson } from '../../_lib/http';
import { requireUser } from '../../_lib/auth';
import { removeSubscription } from '../../_lib/push';

export default withErrors(async (req, res) => {
  allow(req, ['DELETE']);
  assertSameOrigin(req);
  const user = await requireUser(req);
  await removeSubscription(String(user.id), String(req.query.id));
  sendJson(res, 200, { ok: true });
});
