import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../api/api_client.dart';
import '../../l10n/app_localizations.dart';
import 'orders_controller.dart';

/// Screen 6 — order review: list, by item, by person; finalize.
class OrdersScreen extends ConsumerStatefulWidget {
  const OrdersScreen({super.key, required this.mealId});
  final String mealId;

  @override
  ConsumerState<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends ConsumerState<OrdersScreen> {
  int _view = 0;

  Future<void> _finalize() async {
    final l = AppLocalizations.of(context);
    final ok = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        content: Text(l.finalizeConfirm),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: Text(l.cancel)),
          FilledButton(onPressed: () => Navigator.pop(context, true), child: Text(l.finalize)),
        ],
      ),
    );
    if (ok != true) return;
    try {
      await ref.read(ordersRepositoryProvider).finalizeMeal(widget.mealId);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(l.statusFinalized)));
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    }
  }

  Future<void> _deleteOrder(String orderId) async {
    final l = AppLocalizations.of(context);
    final ok = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        content: Text(l.deleteOrderConfirm),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: Text(l.cancel)),
          FilledButton(onPressed: () => Navigator.pop(context, true), child: Text(l.delete)),
        ],
      ),
    );
    if (ok != true) return;
    await ref.read(ordersRepositoryProvider).remove(widget.mealId, orderId);
  }

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    return Scaffold(
      appBar: AppBar(
        title: Text(l.sectionOrders),
        actions: [
          IconButton(
            tooltip: l.exportExcel,
            icon: const Icon(Icons.download),
            onPressed: () => launchUrl(
              ref.read(apiClientProvider).fileUri('/meals/${widget.mealId}/export/restaurant-order.xlsx'),
              webOnlyWindowName: '_blank',
            ),
          ),
          IconButton(tooltip: l.finalize, icon: const Icon(Icons.lock_outline), onPressed: _finalize),
        ],
      ),
      floatingActionButton: _view == 0
          ? FloatingActionButton.extended(
              onPressed: () => context.push('/meals/${widget.mealId}/orders/new'),
              icon: const Icon(Icons.add),
              label: Text(l.addOrder),
            )
          : null,
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(12),
            child: SegmentedButton<int>(
              segments: [
                ButtonSegment(value: 0, label: Text(l.viewList)),
                ButtonSegment(value: 1, label: Text(l.viewByItem)),
                ButtonSegment(value: 2, label: Text(l.viewByPerson)),
              ],
              selected: {_view},
              onSelectionChanged: (s) => setState(() => _view = s.first),
            ),
          ),
          Expanded(child: switch (_view) { 1 => _byItem(), 2 => _byPerson(), _ => _list() }),
        ],
      ),
    );
  }

  Widget _list() {
    final l = AppLocalizations.of(context);
    final orders = ref.watch(ordersListProvider(widget.mealId));
    return orders.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => Center(child: Text('${l.errorTitle}: $e')),
      data: (list) {
        if (list.isEmpty) return Center(child: Text(l.noOrders));
        return ListView.builder(
          itemCount: list.length,
          itemBuilder: (context, i) {
            final o = list[i];
            return ListTile(
              title: Row(
                children: [
                  Flexible(child: Text(o.participantName)),
                  if (o.isHonoree) ...[
                    const SizedBox(width: 8),
                    Chip(label: Text(l.roleHonoree), visualDensity: VisualDensity.compact),
                  ],
                ],
              ),
              subtitle: Text('${o.items.length} · ${o.mobileNumber ?? ''}'),
              trailing: IconButton(
                icon: const Icon(Icons.delete_outline),
                onPressed: () => _deleteOrder(o.id),
              ),
            );
          },
        );
      },
    );
  }

  Widget _byItem() {
    final l = AppLocalizations.of(context);
    final summary = ref.watch(orderSummaryProvider((mealId: widget.mealId, view: 'restaurant')));
    return summary.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => Center(child: Text('${l.errorTitle}: $e')),
      data: (rows) {
        if (rows.isEmpty) return Center(child: Text(l.noOrders));
        return ListView(
          children: rows.cast<Map<String, dynamic>>().map((r) {
            final remarks = (r['remarksSummary'] as String?) ?? '';
            return ListTile(
              title: Text(r['itemName'] as String? ?? ''),
              subtitle: remarks.isEmpty ? null : Text(remarks),
              trailing: Text('${l.totalQuantity}: ${r['totalQty']}'),
            );
          }).toList(),
        );
      },
    );
  }

  Widget _byPerson() {
    final l = AppLocalizations.of(context);
    final summary = ref.watch(orderSummaryProvider((mealId: widget.mealId, view: 'participant')));
    return summary.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => Center(child: Text('${l.errorTitle}: $e')),
      data: (rows) {
        if (rows.isEmpty) return Center(child: Text(l.noOrders));
        return ListView(
          children: rows.cast<Map<String, dynamic>>().map((p) {
            final items = (p['items'] as List? ?? const []).cast<Map<String, dynamic>>();
            return Card(
              margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(p['participantName'] as String? ?? '', style: Theme.of(context).textTheme.titleMedium),
                    const SizedBox(height: 4),
                    ...items.map((it) => Text(
                          '• ${it['itemName']} ×${it['quantity']}'
                          '${(it['remarks'] != null && (it['remarks'] as String).isNotEmpty) ? ' — ${it['remarks']}' : ''}',
                        )),
                  ],
                ),
              ),
            );
          }).toList(),
        );
      },
    );
  }
}
