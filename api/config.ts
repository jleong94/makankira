/** GET /api/config — public runtime config for the login screen (Screen 1). */

import { withErrors, allow, sendJson } from './_lib/http';

export default withErrors((req, res) => {
  allow(req, ['GET']);
  sendJson(res, 200, {
    appName: 'MakanKira',
    providers: ['google', 'facebook'],
    defaultLocale: 'en',
    supportedLocales: ['en', 'zh', 'ms'],
  });
});
