import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../api/api_client.dart';
import '../../l10n/app_localizations.dart';
import 'web_push.dart';

/// Screen 2C — notifications: email reminders note + Web Push opt-in.
class NotificationsScreen extends ConsumerStatefulWidget {
  const NotificationsScreen({super.key});

  @override
  ConsumerState<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends ConsumerState<NotificationsScreen> {
  bool _busy = false;

  Future<void> _enable() async {
    final l = AppLocalizations.of(context);
    setState(() => _busy = true);
    try {
      final sub = await subscribeWebPush();
      if (!mounted) return;
      if (sub == null) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(l.webPushFailed)));
        return;
      }
      await ref.read(apiClientProvider).postJson('/me/push-subscriptions', body: sub);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(l.webPushEnabled)));
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    return Scaffold(
      appBar: AppBar(title: Text(l.notifications)),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          ListTile(
            leading: const Icon(Icons.email_outlined),
            title: Text(l.emailReminderNote),
          ),
          const SizedBox(height: 8),
          Text(l.webPushNote, style: Theme.of(context).textTheme.bodySmall),
          const SizedBox(height: 16),
          FilledButton.icon(
            onPressed: _busy ? null : _enable,
            icon: _busy
                ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(strokeWidth: 2))
                : const Icon(Icons.notifications_active_outlined),
            label: Text(l.enableWebPush),
          ),
        ],
      ),
    );
  }
}
