/** POST /api/auth/logout — clear the session cookie (Screen 1). */

import { withErrors, allow, assertSameOrigin, sendJson } from '../_lib/http';
import { clearSessionCookie } from '../_lib/auth';

export default withErrors((req, res) => {
  allow(req, ['POST']);
  assertSameOrigin(req);
  clearSessionCookie(res);
  sendJson(res, 200, { ok: true });
});
