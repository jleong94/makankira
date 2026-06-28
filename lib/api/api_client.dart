import 'dart:convert';
import 'dart:typed_data';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:http/http.dart' as http;
import 'client_factory_io.dart' if (dart.library.html) 'client_factory_web.dart';
import '../features/auth/auth_controller.dart';
import 'models.dart';

/// API base URL is compiled in via --dart-define-from-file (config/frontend.*.json):
/// "/api" same-origin in prod, "http://localhost:3000/api" in local dev.
const _apiBaseUrl = String.fromEnvironment('API_BASE_URL', defaultValue: '/api');

class ApiClient {
  ApiClient({http.Client? client, this.onUnauthorized}) : _client = client ?? createHttpClient();
  final http.Client _client;

  /// Invoked when any request returns HTTP 401, so the session can be dropped
  /// and the auth gate can send the user back to sign in.
  final void Function()? onUnauthorized;

  Uri _uri(String path, Map<String, String>? query) {
    final base = _apiBaseUrl.endsWith('/') ? _apiBaseUrl.substring(0, _apiBaseUrl.length - 1) : _apiBaseUrl;
    final full = '$base$path';
    final uri = full.startsWith('http') ? Uri.parse(full) : Uri.base.resolve(full);
    return query == null ? uri : uri.replace(queryParameters: query);
  }

  Future<dynamic> _send(String method, String path, {Object? body, Map<String, String>? query}) async {
    final uri = _uri(path, query);
    const headers = {'content-type': 'application/json'};
    final payload = body == null ? null : jsonEncode(body);
    final http.Response res;
    switch (method) {
      case 'GET':
        res = await _client.get(uri, headers: headers);
      case 'POST':
        res = await _client.post(uri, headers: headers, body: payload);
      case 'PATCH':
        res = await _client.patch(uri, headers: headers, body: payload);
      case 'PUT':
        res = await _client.put(uri, headers: headers, body: payload);
      case 'DELETE':
        res = await _client.delete(uri, headers: headers);
      default:
        throw ArgumentError('Unsupported method: $method');
    }

    final dynamic data = res.body.isEmpty ? null : jsonDecode(res.body);
    if (res.statusCode >= 400) {
      if (res.statusCode == 401) onUnauthorized?.call();
      final err = (data is Map && data['error'] is Map) ? data['error'] as Map : const {};
      throw ApiException(
        res.statusCode,
        (err['code'] ?? 'error').toString(),
        (err['message'] ?? 'Request failed').toString(),
      );
    }
    return data;
  }

  Future<Map<String, dynamic>> getJson(String path, {Map<String, String>? query}) async =>
      (await _send('GET', path, query: query)) as Map<String, dynamic>;
  Future<Map<String, dynamic>> postJson(String path, {Object? body}) async =>
      (await _send('POST', path, body: body) ?? <String, dynamic>{}) as Map<String, dynamic>;
  Future<Map<String, dynamic>> patchJson(String path, {Object? body}) async =>
      (await _send('PATCH', path, body: body)) as Map<String, dynamic>;
  Future<Map<String, dynamic>> putJson(String path, {Object? body}) async =>
      (await _send('PUT', path, body: body)) as Map<String, dynamic>;
  Future<void> delete(String path) async => _send('DELETE', path);

  /// Absolute URL for a file/export endpoint (open in a new tab so the browser
  /// downloads it with the session cookie).
  Uri fileUri(String path, {Map<String, String>? query}) => _uri(path, query);

  /// Upload raw file bytes (e.g. a DuitNow QR image) to POST /api/files. The
  /// server reads fileKind/mealId/filename from the query and bytes from the body.
  Future<Map<String, dynamic>> uploadBytes(
    String path,
    Uint8List bytes, {
    required String contentType,
    Map<String, String>? query,
  }) async {
    final res = await _client.post(_uri(path, query), headers: {'content-type': contentType}, body: bytes);
    final dynamic data = res.body.isEmpty ? null : jsonDecode(res.body);
    if (res.statusCode >= 400) {
      if (res.statusCode == 401) onUnauthorized?.call();
      final err = (data is Map && data['error'] is Map) ? data['error'] as Map : const {};
      throw ApiException(
        res.statusCode,
        (err['code'] ?? 'error').toString(),
        (err['message'] ?? 'Upload failed').toString(),
      );
    }
    return (data ?? <String, dynamic>{}) as Map<String, dynamic>;
  }
}

final apiClientProvider = Provider<ApiClient>(
  (ref) => ApiClient(onUnauthorized: () => ref.read(authProvider.notifier).markSignedOut()),
);
