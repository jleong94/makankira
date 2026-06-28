import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../api/models.dart';
import '../../l10n/app_localizations.dart';
import '../../shared/formatters.dart';
import '../auth/auth_controller.dart';
import '../menu/menu_controller.dart';
import 'orders_controller.dart';

/// Screen 5 — participant order form (organizer enters on their device).
class OrderFormScreen extends ConsumerStatefulWidget {
  const OrderFormScreen({super.key, required this.mealId});
  final String mealId;

  @override
  ConsumerState<OrderFormScreen> createState() => _OrderFormScreenState();
}

class _OrderFormScreenState extends ConsumerState<OrderFormScreen> {
  final _formKey = GlobalKey<FormState>();
  final _name = TextEditingController();
  final _mobile = TextEditingController();
  final Map<String, int> _qty = {};
  final Map<String, String> _remarks = {};
  bool _honoree = false;
  bool _myOrder = false;
  String? _userId;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    final auth = ref.read(authProvider);
    final user = auth is AsyncData<AppUser?> ? auth.value : null;
    _userId = user?.id;
    _name.text = user?.displayName ?? '';
    _mobile.text = user?.mobileNumber ?? '';
  }

  @override
  void dispose() {
    _name.dispose();
    _mobile.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final l = AppLocalizations.of(context);
    if (!_formKey.currentState!.validate()) return;
    final items = _qty.entries.where((e) => e.value > 0).map((e) {
      final r = (_remarks[e.key] ?? '').trim();
      return {'menuItemId': e.key, 'quantity': e.value, if (r.isNotEmpty) 'remarks': r};
    }).toList();
    if (items.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(l.selectItems)));
      return;
    }
    setState(() => _saving = true);
    final body = <String, dynamic>{
      'participantName': _name.text.trim(),
      'mobileNumber': _mobile.text.trim(),
      'participantRole': _honoree ? 'farewell_honoree' : 'paying_participant',
      if (_myOrder && _userId != null) 'participantUserId': _userId,
      'items': items,
    };
    try {
      await ref.read(ordersRepositoryProvider).create(widget.mealId, body);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(l.orderSaved)));
      Navigator.of(context).pop();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
      setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    final menu = ref.watch(menuListProvider(widget.mealId));
    return Scaffold(
      appBar: AppBar(title: Text(l.addOrder)),
      body: menu.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('${l.errorTitle}: $e')),
        data: (items) {
          final available = items.where((i) => i.available).toList();
          return Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 560),
              child: Form(
                key: _formKey,
                child: ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    TextFormField(
                      controller: _name,
                      decoration: InputDecoration(labelText: l.participantName),
                      validator: (v) => (v == null || v.trim().isEmpty) ? l.required : null,
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _mobile,
                      decoration: InputDecoration(labelText: l.mobileNumber),
                      keyboardType: TextInputType.phone,
                      validator: (v) => (v == null || v.trim().isEmpty) ? l.required : null,
                    ),
                    SwitchListTile(
                      contentPadding: EdgeInsets.zero,
                      value: _honoree,
                      onChanged: (v) => setState(() => _honoree = v),
                      title: Text(l.roleHonoree),
                    ),
                    CheckboxListTile(
                      contentPadding: EdgeInsets.zero,
                      value: _myOrder,
                      onChanged: (v) => setState(() => _myOrder = v ?? false),
                      title: Text(l.myOrder),
                    ),
                    const Divider(),
                    if (available.isEmpty)
                      Padding(padding: const EdgeInsets.all(16), child: Text(l.noMenuItems)),
                    ...available.map(_itemRow),
                    const SizedBox(height: 24),
                    FilledButton(
                      onPressed: _saving ? null : _submit,
                      child: _saving
                          ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2))
                          : Text(l.save),
                    ),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _itemRow(MenuItem item) {
    final l = AppLocalizations.of(context);
    final q = _qty[item.id] ?? 0;
    final price = item.actualPriceCents ?? item.estimatedPriceCents;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        ListTile(
          contentPadding: EdgeInsets.zero,
          title: Text(item.name),
          subtitle: price == null ? null : Text(formatRM(price)),
          trailing: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              IconButton(
                icon: const Icon(Icons.remove_circle_outline),
                onPressed: q > 0 ? () => setState(() => _qty[item.id] = q - 1) : null,
              ),
              Text('$q'),
              IconButton(
                icon: const Icon(Icons.add_circle_outline),
                onPressed: () => setState(() => _qty[item.id] = q + 1),
              ),
            ],
          ),
        ),
        if (q > 0)
          Padding(
            padding: const EdgeInsets.only(left: 0, bottom: 8),
            child: TextFormField(
              initialValue: _remarks[item.id],
              decoration: InputDecoration(labelText: l.remarks, isDense: true),
              onChanged: (v) => _remarks[item.id] = v,
            ),
          ),
      ],
    );
  }
}
