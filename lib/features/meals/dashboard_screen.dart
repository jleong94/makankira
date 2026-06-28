import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../l10n/app_localizations.dart';
import '../../shared/language_menu.dart';
import '../auth/auth_controller.dart';

/// Screen 2 — meal sessions dashboard (list/create coming next).
class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l = AppLocalizations.of(context);
    final auth = ref.watch(authProvider);
    return Scaffold(
      appBar: AppBar(
        title: Text(l.mealSessions),
        actions: [
          const LanguageMenu(),
          IconButton(
            tooltip: l.signOut,
            icon: const Icon(Icons.logout),
            onPressed: () => ref.read(authProvider.notifier).signOut(),
          ),
          const SizedBox(width: 8),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {},
        icon: const Icon(Icons.add),
        label: Text(l.newMeal),
      ),
      body: auth.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('${l.errorTitle}: $e')),
        data: (user) => Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text('${l.appName} 👋', style: Theme.of(context).textTheme.headlineSmall),
                if (user?.displayName != null) ...[
                  const SizedBox(height: 8),
                  Text(user!.displayName!),
                ],
                const SizedBox(height: 24),
                Text(l.noMeals, textAlign: TextAlign.center),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
