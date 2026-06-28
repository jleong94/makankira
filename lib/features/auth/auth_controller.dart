import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../api/api_client.dart';
import '../../api/models.dart';

/// Current signed-in user (null when signed out). Loads /auth/me on startup.
class AuthController extends AsyncNotifier<AppUser?> {
  @override
  Future<AppUser?> build() async {
    final data = await ref.read(apiClientProvider).getJson('/auth/me');
    final user = data['user'];
    return user == null ? null : AppUser.fromJson(user as Map<String, dynamic>);
  }

  /// Exchange a verified provider credential for a session cookie.
  Future<void> signIn(String provider, String credential) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      final data = await ref
          .read(apiClientProvider)
          .postJson('/auth/login', body: {'provider': provider, 'credential': credential});
      return AppUser.fromJson(data['user'] as Map<String, dynamic>);
    });
  }

  Future<void> signOut() async {
    await ref.read(apiClientProvider).postJson('/auth/logout');
    state = const AsyncData(null);
  }
}

final authProvider = AsyncNotifierProvider<AuthController, AppUser?>(AuthController.new);
