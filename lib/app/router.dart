import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../api/models.dart';
import '../features/auth/auth_controller.dart';
import '../features/auth/login_screen.dart';
import '../features/auth/splash_screen.dart';
import '../features/meals/dashboard_screen.dart';
import '../features/meals/meal_detail_screen.dart';
import '../features/meals/meal_setup_screen.dart';
import '../features/menu/menu_screen.dart';
import '../features/billing/bill_screen.dart';
import '../features/orders/order_form_screen.dart';
import '../features/orders/orders_screen.dart';
import '../features/payments/payment_requests_screen.dart';
import '../features/settings/notifications_screen.dart';
import '../features/settings/payment_defaults_screen.dart';
import '../features/settings/profile_screen.dart';
import '../features/settings/settings_screen.dart';

/// Sanitises a `from` redirect target: only in-app absolute paths are allowed
/// (never protocol-relative or external URLs), and never the gate screens
/// themselves (which would loop). Falls back to the dashboard.
String _safeDestination(String? from) {
  if (from == null || from.isEmpty) return '/';
  if (!from.startsWith('/') || from.startsWith('//')) return '/';
  if (from == '/splash' || from.startsWith('/splash?')) return '/';
  if (from == '/login' || from.startsWith('/login?')) return '/';
  return from;
}

/// App router with an auth gate: unauthenticated users go to /login, then are
/// returned to the page they originally wanted after signing in.
final routerProvider = Provider<GoRouter>((ref) {
  final authListenable = ValueNotifier<AsyncValue<AppUser?>>(const AsyncLoading());
  ref.listen<AsyncValue<AppUser?>>(
    authProvider,
    (_, next) => authListenable.value = next,
    fireImmediately: true,
  );

  final router = GoRouter(
    initialLocation: '/splash',
    refreshListenable: authListenable,
    redirect: (context, state) {
      final auth = authListenable.value;
      final loc = state.matchedLocation;
      final atSplash = loc == '/splash';
      final atLogin = loc == '/login';

      // Where the user is actually trying to go. While parked on the splash or
      // login screens we carry it in a `from` query param; elsewhere it's the
      // current location (e.g. a deep link, or the page they were on when the
      // session expired).
      String intended() => (atSplash || atLogin)
          ? _safeDestination(state.uri.queryParameters['from'])
          : _safeDestination(state.uri.toString());

      // Session check (/auth/me) still in flight: show the splash, never any
      // authenticated content. This is what stops the dashboard from flashing
      // for first-time visitors or expired sessions.
      if (auth.isLoading) {
        return atSplash ? null : '/splash?from=${Uri.encodeComponent(intended())}';
      }

      final loggedIn = auth is AsyncData<AppUser?> && auth.value != null;

      // Signed out (first visit / expired session): login is the only reachable
      // screen; remember where they were headed so we can return after sign-in.
      if (!loggedIn) {
        return atLogin ? null : '/login?from=${Uri.encodeComponent(intended())}';
      }

      // Signed in: leave the splash/login screens for the page they actually
      // wanted (their deep link, or where they were when the session expired).
      if (atSplash || atLogin) return intended();
      return null;
    },
    routes: [
      GoRoute(path: '/splash', builder: (context, state) => const SplashScreen()),
      GoRoute(path: '/login', builder: (context, state) => const LoginScreen()),
      GoRoute(path: '/', builder: (context, state) => const DashboardScreen()),
      GoRoute(path: '/meals/new', builder: (context, state) => const MealSetupScreen()),
      GoRoute(
        path: '/meals/:id',
        builder: (context, state) => MealDetailScreen(mealId: state.pathParameters['id']!),
      ),
      GoRoute(
        path: '/meals/:id/menu',
        builder: (context, state) => MenuScreen(mealId: state.pathParameters['id']!),
      ),
      GoRoute(
        path: '/meals/:id/orders/new',
        builder: (context, state) => OrderFormScreen(mealId: state.pathParameters['id']!),
      ),
      GoRoute(
        path: '/meals/:id/orders',
        builder: (context, state) => OrdersScreen(mealId: state.pathParameters['id']!),
      ),
      GoRoute(
        path: '/meals/:id/bill',
        builder: (context, state) => BillScreen(mealId: state.pathParameters['id']!),
      ),
      GoRoute(
        path: '/meals/:id/payment-requests',
        builder: (context, state) => PaymentRequestsScreen(mealId: state.pathParameters['id']!),
      ),
      GoRoute(path: '/settings', builder: (context, state) => const SettingsScreen()),
      GoRoute(path: '/settings/profile', builder: (context, state) => const ProfileScreen()),
      GoRoute(path: '/settings/payment-methods', builder: (context, state) => const PaymentDefaultsScreen()),
      GoRoute(path: '/settings/notifications', builder: (context, state) => const NotificationsScreen()),
    ],
  );

  ref.onDispose(() {
    router.dispose();
    authListenable.dispose();
  });
  return router;
});
