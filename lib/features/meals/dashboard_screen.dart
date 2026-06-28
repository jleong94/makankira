import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../l10n/app_localizations.dart';
import '../../shared/formatters.dart';
import '../../shared/language_menu.dart';
import '../auth/auth_controller.dart';
import 'meals_controller.dart';

/// Screen 2 — meal sessions dashboard: list, search, create.
class DashboardScreen extends ConsumerStatefulWidget {
  const DashboardScreen({super.key});

  @override
  ConsumerState<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends ConsumerState<DashboardScreen> {
  String _query = '';

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    final meals = ref.watch(mealsProvider);
    return Scaffold(
      appBar: AppBar(
        title: Text(l.mealSessions),
        actions: [
          const LanguageMenu(),
          IconButton(
            tooltip: l.settings,
            icon: const Icon(Icons.settings_outlined),
            onPressed: () => context.push('/settings'),
          ),
          IconButton(
            tooltip: l.signOut,
            icon: const Icon(Icons.logout),
            onPressed: () => ref.read(authProvider.notifier).signOut(),
          ),
          const SizedBox(width: 8),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push('/meals/new'),
        icon: const Icon(Icons.add),
        label: Text(l.newMeal),
      ),
      body: meals.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => _ErrorView(message: '$e', onRetry: () => ref.read(mealsProvider.notifier).refresh()),
        data: (list) {
          final q = _query.trim().toLowerCase();
          final filtered = q.isEmpty
              ? list
              : list
                  .where((m) =>
                      m.title.toLowerCase().contains(q) || m.restaurantName.toLowerCase().contains(q))
                  .toList();
          return RefreshIndicator(
            onRefresh: () => ref.read(mealsProvider.notifier).refresh(),
            child: Column(
              children: [
                Padding(
                  padding: const EdgeInsets.all(12),
                  child: TextField(
                    decoration: InputDecoration(
                      prefixIcon: const Icon(Icons.search),
                      hintText: l.searchMeals,
                      isDense: true,
                    ),
                    onChanged: (v) => setState(() => _query = v),
                  ),
                ),
                Expanded(
                  child: filtered.isEmpty
                      ? ListView(children: [Padding(padding: const EdgeInsets.all(48), child: Text(l.noMeals, textAlign: TextAlign.center))])
                      : ListView.builder(
                          itemCount: filtered.length,
                          itemBuilder: (context, i) {
                            final m = filtered[i];
                            return Card(
                              margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                              child: ListTile(
                                title: Text(m.title),
                                subtitle: Text(
                                  [m.restaurantName, formatDateTime(m.mealDateTime)].where((s) => s.isNotEmpty).join(' · '),
                                ),
                                trailing: Chip(
                                  label: Text(statusLabel(l, m.status)),
                                  visualDensity: VisualDensity.compact,
                                ),
                                onTap: () => context.push('/meals/${m.id}'),
                              ),
                            );
                          },
                        ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}

class _ErrorView extends StatelessWidget {
  const _ErrorView({required this.message, required this.onRetry});
  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text('${l.errorTitle}\n$message', textAlign: TextAlign.center),
          const SizedBox(height: 12),
          FilledButton(onPressed: onRetry, child: Text(l.retry)),
        ],
      ),
    );
  }
}
