import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../api/models.dart';
import '../../l10n/app_localizations.dart';
import '../auth/auth_controller.dart';

/// Screen 2D — profile: display name + mobile (email read-only).
class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  final _formKey = GlobalKey<FormState>();
  final _name = TextEditingController();
  final _mobile = TextEditingController();
  String _email = '';
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    final auth = ref.read(authProvider);
    final user = auth is AsyncData<AppUser?> ? auth.value : null;
    _name.text = user?.displayName ?? '';
    _mobile.text = user?.mobileNumber ?? '';
    _email = user?.email ?? '';
  }

  @override
  void dispose() {
    _name.dispose();
    _mobile.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    final l = AppLocalizations.of(context);
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    try {
      await ref.read(authProvider.notifier).updateProfile({
        'displayName': _name.text.trim(),
        'mobileNumber': _mobile.text.trim(),
      });
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(l.profileSaved)));
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    return Scaffold(
      appBar: AppBar(title: Text(l.profile)),
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 480),
          child: Form(
            key: _formKey,
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                if (_email.isNotEmpty) ...[
                  ListTile(
                    contentPadding: EdgeInsets.zero,
                    leading: const Icon(Icons.email_outlined),
                    title: Text(l.email),
                    subtitle: Text(_email),
                  ),
                  const Divider(),
                ],
                TextFormField(
                  controller: _name,
                  decoration: InputDecoration(labelText: l.displayName),
                  validator: (v) => (v == null || v.trim().isEmpty) ? l.required : null,
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _mobile,
                  decoration: InputDecoration(labelText: l.mobileNumber),
                  keyboardType: TextInputType.phone,
                ),
                const SizedBox(height: 24),
                FilledButton(
                  onPressed: _saving ? null : _save,
                  child: _saving
                      ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2))
                      : Text(l.save),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
