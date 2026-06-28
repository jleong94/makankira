import 'package:http/browser_client.dart';
import 'package:http/http.dart' as http;

/// On web, send the httpOnly session cookie with API requests (needed cross-origin
/// in local dev; harmless same-origin in production).
http.Client createHttpClient() => BrowserClient()..withCredentials = true;
