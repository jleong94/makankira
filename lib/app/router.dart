import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../api/models.dart';
import '../features/auth/auth_controller.dart';
import '../features/auth/login_screen.dart';
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

/// App router with an auth gate: unauthenticated users go to /login.
final routerProvider = Provider<GoRouter>((ref) {
  final authListenable = ValueNotifier<AsyncValue<AppUser?>>(const AsyncLoading());
  ref.listen<AsyncValue<AppUser?>>(
    authProvider,
    (_, next) => authListenable.value = next,
    fireImmediately: true,
  );

  final router = GoRouter(
    initialLocation: '/',
    refreshListenable: authListenable,
    redirect: (context, state) {
      final auth = authListenable.value;
      if (auth.isLoading) return null; // wait for /auth/me
      final loggedIn = auth is AsyncData<AppUser?> && auth.value != null;
      final atLogin = state.matchedLocation == '/login';
      if (!loggedIn) return atLogin ? null : '/login';
      if (atLogin) return '/';
      return null;
    },
    routes: [
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
