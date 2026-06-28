import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../l10n/app_localizations.dart';

/// Settings hub (Screens 2B–2D).
class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l = AppLocalizations.of(context);
    return Scaffold(
      appBar: AppBar(title: Text(l.settings)),
      body: ListView(
        children: [
          ListTile(
            leading: const Icon(Icons.person_outline),
            title: Text(l.profile),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => context.push('/settings/profile'),
          ),
          ListTile(
            leading: const Icon(Icons.account_balance_wallet_outlined),
            title: Text(l.paymentDefaults),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => context.push('/settings/payment-methods'),
          ),
          ListTile(
            leading: const Icon(Icons.notifications_outlined),
            title: Text(l.notifications),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(l.comingSoon))),
          ),
        ],
      ),
    );
  }
}
