import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../api/models.dart';
import '../../l10n/app_localizations.dart';
import '../../shared/formatters.dart';
import 'menu_controller.dart';

String _centsToInput(int? c) => c == null ? '' : (c / 100).toStringAsFixed(2);
int? _parseCents(String s) {
  final t = s.trim();
  if (t.isEmpty) return null;
  final v = double.tryParse(t);
  return v == null ? null : (v * 100).round();
}

/// Screen 4 — menu manager: add/edit items, prices, availability.
class MenuScreen extends ConsumerWidget {
  const MenuScreen({super.key, required this.mealId});
  final String mealId;

  Future<void> _showEditor(BuildContext context, {MenuItem? item}) {
    return showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      builder: (context) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
        child: _MenuItemEditor(mealId: mealId, item: item),
      ),
    );
  }

  Future<void> _confirmDelete(BuildContext context, WidgetRef ref, MenuItem item) async {
    final l = AppLocalizations.of(context);
    final ok = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        content: Text(l.deleteItemConfirm),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: Text(l.cancel)),
          FilledButton(onPressed: () => Navigator.pop(context, true), child: Text(l.delete)),
        ],
      ),
    );
    if (ok != true) return;
    await ref.read(menuRepositoryProvider).remove(mealId, item.id);
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l = AppLocalizations.of(context);
    final menu = ref.watch(menuListProvider(mealId));
    return Scaffold(
      appBar: AppBar(title: Text(l.menuManager)),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showEditor(context),
        icon: const Icon(Icons.add),
        label: Text(l.addItem),
      ),
      body: menu.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('${l.errorTitle}: $e')),
        data: (items) {
          if (items.isEmpty) {
            return Center(child: Padding(padding: const EdgeInsets.all(32), child: Text(l.noMenuItems)));
          }
          return ListView.separated(
            itemCount: items.length,
            separatorBuilder: (_, _) => const Divider(height: 1),
            itemBuilder: (context, i) {
              final item = items[i];
              final price = item.actualPriceCents ?? item.estimatedPriceCents;
              return ListTile(
                leading: Icon(item.available ? Icons.check_circle_outline : Icons.block,
                    color: item.available ? null : Theme.of(context).disabledColor),
                title: Text(item.name),
                subtitle: Text([
                  if (item.category != null && item.category!.isNotEmpty) item.category!,
                  if (price != null) formatRM(price),
                ].join(' · ')),
                onTap: () => _showEditor(context, item: item),
                trailing: PopupMenuButton<String>(
                  onSelected: (v) {
                    if (v == 'edit') _showEditor(context, item: item);
                    if (v == 'delete') _confirmDelete(context, ref, item);
                  },
                  itemBuilder: (context) => [
                    PopupMenuItem(value: 'edit', child: Text(l.edit)),
                    PopupMenuItem(value: 'delete', child: Text(l.delete)),
                  ],
                ),
              );
            },
          );
        },
      ),
    );
  }
}

class _MenuItemEditor extends ConsumerStatefulWidget {
  const _MenuItemEditor({required this.mealId, this.item});
  final String mealId;
  final MenuItem? item;

  @override
  ConsumerState<_MenuItemEditor> createState() => _MenuItemEditorState();
}

class _MenuItemEditorState extends ConsumerState<_MenuItemEditor> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _name;
  late final TextEditingController _category;
  late final TextEditingController _estimated;
  late final TextEditingController _actual;
  late bool _available;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    final it = widget.item;
    _name = TextEditingController(text: it?.name ?? '');
    _category = TextEditingController(text: it?.category ?? '');
    _estimated = TextEditingController(text: _centsToInput(it?.estimatedPriceCents));
    _actual = TextEditingController(text: _centsToInput(it?.actualPriceCents));
    _available = it?.available ?? true;
  }

  @override
  void dispose() {
    for (final c in [_name, _category, _estimated, _actual]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    final body = <String, dynamic>{
      'name': _name.text.trim(),
      'category': _category.text.trim().isEmpty ? null : _category.text.trim(),
      'estimatedPriceCents': _parseCents(_estimated.text),
      'actualPriceCents': _parseCents(_actual.text),
      'available': _available,
    };
    final repo = ref.read(menuRepositoryProvider);
    try {
      if (widget.item == null) {
        await repo.add(widget.mealId, body);
      } else {
        await repo.update(widget.mealId, widget.item!.id, body);
      }
      if (!mounted) return;
      Navigator.pop(context);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
      setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Form(
        key: _formKey,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(widget.item == null ? l.addItem : l.editItem, style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 12),
            TextFormField(
              controller: _name,
              decoration: InputDecoration(labelText: l.itemName),
              validator: (v) => (v == null || v.trim().isEmpty) ? l.required : null,
            ),
            const SizedBox(height: 12),
            TextFormField(controller: _category, decoration: InputDecoration(labelText: l.itemCategory)),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    controller: _estimated,
                    decoration: InputDecoration(labelText: l.estimatedPrice),
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: TextFormField(
                    controller: _actual,
                    decoration: InputDecoration(labelText: l.actualPrice),
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                  ),
                ),
              ],
            ),
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              value: _available,
              onChanged: (v) => setState(() => _available = v),
              title: Text(l.available),
            ),
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                TextButton(onPressed: () => Navigator.pop(context), child: Text(l.cancel)),
                const SizedBox(width: 8),
                FilledButton(
                  onPressed: _saving ? null : _save,
                  child: _saving
                      ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2))
                      : Text(l.save),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
