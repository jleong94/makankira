/** POST /api/me/push-subscriptions — register a Web Push subscription (Screen 2C). */

import { withErrors, allow, assertSameOrigin, bodyObject, sendJson } from '../../_lib/http';
import { requireUser } from '../../_lib/auth';
import { addSubscription } from '../../_lib/push';
import { toPushSubscription } from '../../_lib/serializers';

export default withErrors(async (req, res) => {
  allow(req, ['POST']);
  assertSameOrigin(req);
  const user = await requireUser(req);
  const sub = await addSubscription(String(user.id), bodyObject(req));
  sendJson(res, 201, { subscription: toPushSubscription(sub) });
});
