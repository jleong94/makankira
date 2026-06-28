import 'package:flutter_facebook_auth/flutter_facebook_auth.dart';
import 'package:google_sign_in/google_sign_in.dart';

/// Public OAuth client IDs, compiled in via --dart-define-from-file
/// (config/frontend.*.json). Empty until provisioned; login activates once set.
const googleClientId = String.fromEnvironment('GOOGLE_OAUTH_CLIENT_ID');
const facebookAppId = String.fromEnvironment('FACEBOOK_APP_ID');

/// One-time provider SDK setup. Safe to call with empty IDs.
Future<void> initOAuth() async {
  await GoogleSignIn.instance.initialize(
    clientId: googleClientId.isEmpty ? null : googleClientId,
  );
  if (facebookAppId.isNotEmpty) {
    await FacebookAuth.i.webAndDesktopInitialize(
      appId: facebookAppId,
      cookie: true,
      xfbml: true,
      version: 'v19.0',
    );
  }
}
