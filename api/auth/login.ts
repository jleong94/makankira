/**
 * POST /api/auth/login — verify a {provider, credential} pair server-side,
 * upsert the user, and set the session cookie (Screen 1).
 */

import { withErrors, allow, assertSameOrigin, bodyObject, requireString, sendJson } from '../_lib/http';
import { verifyProvider, upsertUser, createSessionToken, setSessionCookie } from '../_lib/auth';
import { toUser } from '../_lib/serializers';

export default withErrors(async (req, res) => {
  allow(req, ['POST']);
  assertSameOrigin(req);

  const body = bodyObject(req);
  const provider = requireString(body, 'provider');
  const credential = requireString(body, 'credential');

  const profile = await verifyProvider(provider, credential);
  const user = await upsertUser(profile);
  const token = await createSessionToken(String(user.id));
  setSessionCookie(res, token);

  sendJson(res, 200, { user: toUser(user) });
});
