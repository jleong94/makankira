/**
 * GET /api/auth/me — current user, or { user: null } when signed out.
 * Returns 200 either way so the client can use it for the login-loading state.
 */

import { withErrors, allow, sendJson } from '../_lib/http';
import { getSessionUser } from '../_lib/auth';
import { toUser } from '../_lib/serializers';

export default withErrors(async (req, res) => {
  allow(req, ['GET']);
  const user = await getSessionUser(req);
  sendJson(res, 200, { user: user ? toUser(user) : null });
});
