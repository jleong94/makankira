import 'package:http/http.dart' as http;

/// Non-web fallback (the app ships for web; this keeps analysis happy).
http.Client createHttpClient() => http.Client();
