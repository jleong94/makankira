import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../api/api_client.dart';
import '../../api/models.dart';
import '../../l10n/app_localizations.dart';
import 'payment_defaults_controller.dart';

String _methodTypeLabel(AppLocalizations l, String type) {
  switch (type) {
    case 'bank_account':
      return l.methodBank;
    case 'duitnow_id':
      return l.methodDuitNowId;
    case 'duitnow_qr':
      return l.methodDuitNowQr;
    default:
      return l.methodCustom;
  }
}

String _methodLine(PaymentMethod m) {
  switch (m.methodType) {
    case 'bank_account':
      return [m.bankName, m.accountNumber, m.accountName].where((s) => s != null && s.isNotEmpty).join(' · ');
    case 'duitnow_id':
      return m.duitNowId ?? '';
    case 'duitnow_qr':
      return 'QR';
    default:
      return m.instructions ?? '';
  }
}

/// Screen 2B — account-level saved receiving methods.
class PaymentDefaultsScreen extends ConsumerWidget {
  const PaymentDefaultsScreen({super.key});

  Future<void> _showEditor(BuildContext context, {PaymentMethod? method}) {
    return showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      builder: (context) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
        child: _MethodEditor(method: method),
      ),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l = AppLocalizations.of(context);
    final methods = ref.watch(paymentDefaultsProvider);
    return Scaffold(
      appBar: AppBar(title: Text(l.paymentDefaults)),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showEditor(context),
        icon: const Icon(Icons.add),
        label: Text(l.addPaymentMethod),
      ),
      body: methods.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('${l.errorTitle}: $e')),
        data: (list) {
          if (list.isEmpty) {
            return Center(child: Padding(padding: const EdgeInsets.all(32), child: Text(l.noSavedMethods)));
          }
          return ListView(
            children: list
                .map((m) => ListTile(
                      leading: const Icon(Icons.account_balance_wallet_outlined),
                      title: Text(_methodTypeLabel(l, m.methodType)),
                      subtitle: Text(_methodLine(m)),
                      onTap: () => _showEditor(context, method: m),
                      trailing: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          if (m.isDefault) Chip(label: Text(l.defaultLabel), visualDensity: VisualDensity.compact),
                          IconButton(
                            icon: const Icon(Icons.delete_outline),
                            onPressed: () => ref.read(paymentDefaultsRepositoryProvider).remove(m.id),
                          ),
                        ],
                      ),
                    ))
                .toList(),
          );
        },
      ),
    );
  }
}

class _MethodEditor extends ConsumerStatefulWidget {
  const _MethodEditor({this.method});
  final PaymentMethod? method;

  @override
  ConsumerState<_MethodEditor> createState() => _MethodEditorState();
}

class _MethodEditorState extends ConsumerState<_MethodEditor> {
  late String _type;
  late final TextEditingController _accountName;
  late final TextEditingController _bankName;
  late final TextEditingController _accountNumber;
  late final TextEditingController _duitNowId;
  late final TextEditingController _instructions;
  late bool _isDefault;
  String? _qrFileId;
  bool _uploading = false;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    final m = widget.method;
    _type = m?.methodType ?? 'bank_account';
    _qrFileId = m?.qrImageFileId;
    _accountName = TextEditingController(text: m?.accountName ?? '');
    _bankName = TextEditingController(text: m?.bankName ?? '');
    _accountNumber = TextEditingController(text: m?.accountNumber ?? '');
    _duitNowId = TextEditingController(text: m?.duitNowId ?? '');
    _instructions = TextEditingController(text: m?.instructions ?? '');
    _isDefault = m?.isDefault ?? false;
  }

  @override
  void dispose() {
    for (final c in [_accountName, _bankName, _accountNumber, _duitNowId, _instructions]) {
      c.dispose();
    }
    super.dispose();
  }

  String? _t(TextEditingController c) => c.text.trim().isEmpty ? null : c.text.trim();

  Future<void> _pickQr() async {
    final res = await FilePicker.pickFiles(type: FileType.image, withData: true);
    final file = (res != null && res.files.isNotEmpty) ? res.files.first : null;
    final bytes = file?.bytes;
    if (bytes == null) return;
    final ext = (file!.extension ?? '').toLowerCase();
    final contentType = ext == 'png' ? 'image/png' : (ext == 'webp' ? 'image/webp' : 'image/jpeg');
    setState(() => _uploading = true);
    try {
      final data = await ref.read(apiClientProvider).uploadBytes(
            '/files',
            bytes,
            contentType: contentType,
            query: {'fileKind': 'duitnow_qr', 'filename': file.name},
          );
      if (!mounted) return;
      setState(() => _qrFileId = data['id'] as String?);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    } finally {
      if (mounted) setState(() => _uploading = false);
    }
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    final body = <String, dynamic>{
      'methodType': _type,
      'accountName': _t(_accountName),
      'bankName': _t(_bankName),
      'accountNumber': _t(_accountNumber),
      'duitNowId': _t(_duitNowId),
      'instructions': _t(_instructions),
      'qrImageFileId': _qrFileId,
      'isDefault': _isDefault,
    };
    final repo = ref.read(paymentDefaultsRepositoryProvider);
    try {
      if (widget.method == null) {
        await repo.add(body);
      } else {
        await repo.update(widget.method!.id, body);
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
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          DropdownButtonFormField<String>(
            initialValue: _type,
            decoration: InputDecoration(labelText: l.methodType),
            items: [
              DropdownMenuItem(value: 'bank_account', child: Text(l.methodBank)),
              DropdownMenuItem(value: 'duitnow_id', child: Text(l.methodDuitNowId)),
              DropdownMenuItem(value: 'duitnow_qr', child: Text(l.methodDuitNowQr)),
              DropdownMenuItem(value: 'custom', child: Text(l.methodCustom)),
            ],
            onChanged: (v) => setState(() => _type = v ?? 'bank_account'),
          ),
          const SizedBox(height: 12),
          if (_type == 'bank_account') ...[
            TextField(controller: _bankName, decoration: InputDecoration(labelText: l.bankName)),
            const SizedBox(height: 12),
            TextField(controller: _accountNumber, decoration: InputDecoration(labelText: l.accountNumber)),
            const SizedBox(height: 12),
            TextField(controller: _accountName, decoration: InputDecoration(labelText: l.accountName)),
          ] else if (_type == 'duitnow_id') ...[
            TextField(controller: _duitNowId, decoration: InputDecoration(labelText: l.duitNowIdLabel)),
            const SizedBox(height: 12),
            TextField(controller: _accountName, decoration: InputDecoration(labelText: l.accountName)),
          ] else if (_type == 'duitnow_qr') ...[
            Row(
              children: [
                OutlinedButton.icon(
                  onPressed: _uploading ? null : _pickQr,
                  icon: _uploading
                      ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(strokeWidth: 2))
                      : const Icon(Icons.upload),
                  label: Text(l.methodDuitNowQr),
                ),
                const SizedBox(width: 12),
                if (_qrFileId != null) const Icon(Icons.check_circle, color: Colors.green),
              ],
            ),
            const SizedBox(height: 12),
            TextField(controller: _accountName, decoration: InputDecoration(labelText: l.accountName)),
          ] else ...[
            TextField(
              controller: _instructions,
              decoration: InputDecoration(labelText: l.instructions),
              maxLines: 3,
            ),
          ],
          SwitchListTile(
            contentPadding: EdgeInsets.zero,
            value: _isDefault,
            onChanged: (v) => setState(() => _isDefault = v),
            title: Text(l.setDefault),
          ),
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
    );
  }
}
