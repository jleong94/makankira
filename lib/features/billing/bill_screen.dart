import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../api/api_client.dart';
import '../../api/models.dart';
import '../../l10n/app_localizations.dart';
import '../../shared/formatters.dart';
import 'bill_controller.dart';

/// Screens 7-8 — bill entry (tax/service/discount/company claim/final bill +
/// mode) and the calculation results.
class BillScreen extends ConsumerWidget {
  const BillScreen({super.key, required this.mealId});
  final String mealId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l = AppLocalizations.of(context);
    final bill = ref.watch(billProvider(mealId));
    return Scaffold(
      appBar: AppBar(
        title: Text(l.sectionBill),
        actions: [
          IconButton(
            tooltip: l.exportExcel,
            icon: const Icon(Icons.download),
            onPressed: () => launchUrl(
              ref.read(apiClientProvider).fileUri('/meals/$mealId/export/payment-calculation.xlsx'),
              webOnlyWindowName: '_blank',
            ),
          ),
        ],
      ),
      body: bill.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('${l.errorTitle}: $e')),
        data: (b) => _BillForm(mealId: mealId, initial: b),
      ),
    );
  }
}

class _BillForm extends ConsumerStatefulWidget {
  const _BillForm({required this.mealId, required this.initial});
  final String mealId;
  final BillAdjustment initial;

  @override
  ConsumerState<_BillForm> createState() => _BillFormState();
}

class _BillFormState extends ConsumerState<_BillForm> {
  late String _mode;
  late String _claimType;
  late final TextEditingController _tax;
  late final TextEditingController _service;
  late final TextEditingController _discount;
  late final TextEditingController _finalBill;
  late final TextEditingController _claimValue;
  CalcSummary? _summary;
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    final b = widget.initial;
    _mode = b.calculationMode;
    _claimType = b.companyClaimType;
    _tax = TextEditingController(text: centsToInput(b.taxAmountCents == 0 ? null : b.taxAmountCents));
    _service = TextEditingController(text: centsToInput(b.serviceChargeAmountCents == 0 ? null : b.serviceChargeAmountCents));
    _discount = TextEditingController(text: centsToInput(b.discountAmountCents == 0 ? null : b.discountAmountCents));
    _finalBill = TextEditingController(text: centsToInput(b.finalBillAmountCents));
    _claimValue = TextEditingController(
      text: b.companyClaimType == 'percentage'
          ? (b.companyClaimPercent?.toString() ?? '')
          : centsToInput(b.companyClaimAmountCents == 0 ? null : b.companyClaimAmountCents),
    );
  }

  @override
  void dispose() {
    for (final c in [_tax, _service, _discount, _finalBill, _claimValue]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _calculate() async {
    setState(() => _busy = true);
    final body = <String, dynamic>{
      'calculationMode': _mode,
      'taxAmountCents': parseRMToCents(_tax.text) ?? 0,
      'serviceChargeAmountCents': parseRMToCents(_service.text) ?? 0,
      'discountAmountCents': parseRMToCents(_discount.text) ?? 0,
      'finalBillAmountCents': parseRMToCents(_finalBill.text),
      'companyClaimType': _claimType,
      if (_claimType == 'fixed') 'companyClaimAmountCents': parseRMToCents(_claimValue.text) ?? 0,
      if (_claimType == 'percentage') 'companyClaimPercent': double.tryParse(_claimValue.text.trim()) ?? 0,
    };
    try {
      final repo = ref.read(billRepositoryProvider);
      await repo.saveBill(widget.mealId, body);
      final result = await repo.calculate(widget.mealId);
      if (!mounted) return;
      setState(() => _summary = result.summary);
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
    final results = ref.watch(paymentResultsProvider(widget.mealId));
    return Center(
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 640),
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            SegmentedButton<String>(
              segments: [
                ButtonSegment(value: 'item_based', label: Text(l.modeItemBased)),
                ButtonSegment(value: 'equal_split', label: Text(l.modeEqualSplit)),
                ButtonSegment(value: 'farewell', label: Text(l.modeFarewell)),
              ],
              selected: {_mode},
              onSelectionChanged: (s) => setState(() => _mode = s.first),
            ),
            const SizedBox(height: 16),
            Row(children: [
              Expanded(child: _moneyField(_tax, l.tax)),
              const SizedBox(width: 12),
              Expanded(child: _moneyField(_service, l.serviceCharge)),
            ]),
            const SizedBox(height: 12),
            Row(children: [
              Expanded(child: _moneyField(_discount, l.discount)),
              const SizedBox(width: 12),
              Expanded(child: _moneyField(_finalBill, l.finalBill)),
            ]),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              initialValue: _claimType,
              decoration: InputDecoration(labelText: l.companyClaim),
              items: [
                DropdownMenuItem(value: 'none', child: Text(l.claimNone)),
                DropdownMenuItem(value: 'fixed', child: Text(l.claimFixed)),
                DropdownMenuItem(value: 'percentage', child: Text(l.claimPercent)),
              ],
              onChanged: (v) => setState(() => _claimType = v ?? 'none'),
            ),
            if (_claimType != 'none') ...[
              const SizedBox(height: 12),
              TextField(
                controller: _claimValue,
                decoration: InputDecoration(labelText: l.claimValue),
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
              ),
            ],
            const SizedBox(height: 20),
            FilledButton.icon(
              onPressed: _busy ? null : _calculate,
              icon: _busy
                  ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(strokeWidth: 2))
                  : const Icon(Icons.calculate),
              label: Text(l.calculate),
            ),
            const SizedBox(height: 20),
            if (_summary != null) _summaryCard(context, l, _summary!),
            const SizedBox(height: 8),
            Text(l.results, style: Theme.of(context).textTheme.titleMedium),
            results.when(
              loading: () => const Padding(padding: EdgeInsets.all(16), child: Center(child: CircularProgressIndicator())),
              error: (e, _) => Padding(padding: const EdgeInsets.all(8), child: Text('$e')),
              data: (list) => list.isEmpty
                  ? Padding(padding: const EdgeInsets.all(8), child: Text(l.noResults))
                  : Column(children: list.map((r) => _resultTile(context, l, r)).toList()),
            ),
          ],
        ),
      ),
    );
  }

  Widget _moneyField(TextEditingController c, String label) => TextField(
        controller: c,
        decoration: InputDecoration(labelText: label),
        keyboardType: const TextInputType.numberWithOptions(decimal: true),
      );

  Widget _summaryCard(BuildContext context, AppLocalizations l, CalcSummary s) {
    final mismatch = s.mismatchCents != 0;
    return Card(
      color: mismatch ? Theme.of(context).colorScheme.errorContainer : null,
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _kv('${l.calculatedTotal}:', formatRM(s.calculatedTotalCents)),
            if (s.finalBillAmountCents != null) _kv('${l.finalBill}:', formatRM(s.finalBillAmountCents!)),
            if (s.companyClaimAmountCents > 0) _kv('${l.companyClaim}:', formatRM(s.companyClaimAmountCents)),
            if (mismatch) ...[
              const SizedBox(height: 4),
              Text('${l.mismatch}: ${formatRM(s.mismatchCents)} — ${l.billMismatchWarning}'),
            ],
          ],
        ),
      ),
    );
  }

  Widget _resultTile(BuildContext context, AppLocalizations l, PaymentResult r) {
    final parts = <String>[
      '${l.subtotal} ${formatRM(r.subtotalCents)}',
      if (r.farewellSponsoredShareCents > 0) '${l.farewellShareLabel} ${formatRM(r.farewellSponsoredShareCents)}',
      if (r.taxCents + r.serviceChargeCents > 0) '+${formatRM(r.taxCents + r.serviceChargeCents)}',
      if (r.companyClaimCents > 0) '-${formatRM(r.companyClaimCents)}',
    ];
    return ListTile(
      dense: true,
      title: Row(children: [
        Flexible(child: Text(r.participantName)),
        if (r.isHonoree) ...[
          const SizedBox(width: 8),
          Chip(label: Text(l.roleHonoree), visualDensity: VisualDensity.compact),
        ],
      ]),
      subtitle: Text(parts.join(' · ')),
      trailing: Text(formatRM(r.totalDueCents), style: const TextStyle(fontWeight: FontWeight.bold)),
    );
  }

  Widget _kv(String k, String v) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 1),
        child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [Text(k), Text(v)]),
      );
}
