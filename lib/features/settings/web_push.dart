import 'dart:js_interop';
import 'package:web/web.dart' as web;

/// Web Push public key, compiled in via --dart-define-from-file (safe to ship).
const vapidPublicKey = String.fromEnvironment('VAPID_PUBLIC_KEY');

/// Registers the push service worker, requests permission, and subscribes.
/// Returns the subscription as {endpoint, p256dh, auth, userAgent}, or null if
/// unavailable/denied. Android + desktop browsers only (not iOS).
Future<Map<String, dynamic>?> subscribeWebPush() async {
  if (vapidPublicKey.isEmpty) return null;

  final registration = await web.window.navigator.serviceWorker.register('push_sw.js'.toJS).toDart;
  final permission = (await web.Notification.requestPermission().toDart).toDart;
  if (permission != 'granted') return null;

  final options = web.PushSubscriptionOptionsInit(
    userVisibleOnly: true,
    applicationServerKey: vapidPublicKey.toJS,
  );
  final subscription = await registration.pushManager.subscribe(options).toDart;

  final decoded = (subscription.toJSON() as JSObject).dartify();
  if (decoded is! Map) return null;
  final map = decoded.cast<String, dynamic>();
  final keys = (map['keys'] as Map?)?.cast<String, dynamic>();
  final endpoint = map['endpoint'] as String?;
  if (endpoint == null || keys == null) return null;

  return {
    'endpoint': endpoint,
    'p256dh': keys['p256dh'],
    'auth': keys['auth'],
    'userAgent': web.window.navigator.userAgent,
  };
}
