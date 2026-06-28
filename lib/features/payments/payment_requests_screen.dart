import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../api/models.dart';
import '../../l10n/app_localizations.dart';
import '../../shared/formatters.dart';
import '../billing/bill_controller.dart';
import 'payments_controller.dart';

/// Screen 9 — payment requests: localized message, copy, free wa.me, mark paid.
class PaymentRequestsScreen extends ConsumerWidget {
  const PaymentRequestsScreen({super.key, required this.mealId});
  final String mealId;

  Future<void> _copy(BuildContext context, String text) async {
    await Clipboard.setData(ClipboardData(text: text));
    if (!context.mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(AppLocalizations.of(context).copied)));
  }

  Future<void> _openWhatsApp(BuildContext context, String url) async {
    final ok = await launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);
    if (!ok && context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(AppLocalizations.of(context).errorTitle)));
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l = AppLocalizations.of(context);
    final requests = ref.watch(paymentRequestsProvider(mealId));
    final resultsAsync = ref.watch(paymentResultsProvider(mealId));
    final statusById = {
      for (final r in (resultsAsync.asData?.value ?? const <PaymentResult>[])) r.id: r.paymentStatus,
    };

    return Scaffold(
      appBar: AppBar(
        title: Text(l.sectionPaymentRequests),
        actions: [
          requests.maybeWhen(
            data: (list) => IconButton(
              tooltip: l.copyAll,
              icon: const Icon(Icons.copy_all),
              onPressed: list.isEmpty
                  ? null
                  : () => _copy(context, list.map((r) => r.message).join('\n\n----------\n\n')),
            ),
            orElse: () => const SizedBox.shrink(),
          ),
        ],
      ),
      body: requests.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('${l.errorTitle}: $e')),
        data: (list) {
          if (list.isEmpty) {
            return Center(child: Padding(padding: const EdgeInsets.all(32), child: Text(l.noPaymentRequests)));
          }
          return ListView.builder(
            padding: const EdgeInsets.all(12),
            itemCount: list.length,
            itemBuilder: (context, i) {
              final r = list[i];
              final paid = statusById[r.resultId] == 'paid';
              return Card(
                margin: const EdgeInsets.symmetric(vertical: 6),
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(r.participantName, style: Theme.of(context).textTheme.titleMedium),
                          ),
                          if (paid)
                            Chip(
                              label: Text(l.paid),
                              visualDensity: VisualDensity.compact,
                              backgroundColor: Theme.of(context).colorScheme.secondaryContainer,
                            ),
                          const SizedBox(width: 8),
                          Text(formatRM(r.totalDueCents), style: const TextStyle(fontWeight: FontWeight.bold)),
                        ],
                      ),
                      const SizedBox(height: 8),
                      SelectableText(r.message, style: Theme.of(context).textTheme.bodySmall),
                      const SizedBox(height: 8),
                      Wrap(
                        spacing: 8,
                        children: [
                          TextButton.icon(
                            onPressed: () => _copy(context, r.message),
                            icon: const Icon(Icons.copy, size: 18),
                            label: Text(l.copyMessage),
                          ),
                          if (r.whatsappUrl != null)
                            TextButton.icon(
                              onPressed: () => _openWhatsApp(context, r.whatsappUrl!),
                              icon: const Icon(Icons.chat, size: 18),
                              label: Text(l.openWhatsApp),
                            ),
                          paid
                              ? TextButton.icon(
                                  onPressed: () => ref.read(paymentsRepositoryProvider).markPending(mealId, r.resultId),
                                  icon: const Icon(Icons.undo, size: 18),
                                  label: Text(l.markPending),
                                )
                              : FilledButton.tonalIcon(
                                  onPressed: () => ref.read(paymentsRepositoryProvider).markPaid(mealId, r.resultId),
                                  icon: const Icon(Icons.check, size: 18),
                                  label: Text(l.markPaid),
                                ),
                        ],
                      ),
                    ],
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }
}
