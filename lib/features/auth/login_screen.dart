import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../l10n/app_localizations.dart';
import '../../shared/language_menu.dart';

/// Screen 1 — focused social-login entry. Google primary, Facebook secondary.
/// (The provider SDK that fetches the credential is wired in a follow-up; the
/// buttons already target AuthController.signIn.)
class LoginScreen extends ConsumerWidget {
  const LoginScreen({super.key});

  void _pending(BuildContext context, String provider) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('$provider sign-in is wired next (OAuth SDK).')),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l = AppLocalizations.of(context);
    final text = Theme.of(context).textTheme;
    return Scaffold(
      appBar: AppBar(actions: const [LanguageMenu(), SizedBox(width: 8)]),
      body: Center(
        child: SingleChildScrollView(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 420),
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Icon(Icons.ramen_dining, size: 64),
                  const SizedBox(height: 16),
                  Text(l.appName, textAlign: TextAlign.center, style: text.displaySmall),
                  const SizedBox(height: 8),
                  Text(l.appTagline, textAlign: TextAlign.center, style: text.titleMedium),
                  const SizedBox(height: 16),
                  Text(l.loginSubtitle, textAlign: TextAlign.center, style: text.bodyMedium),
                  const SizedBox(height: 32),
                  FilledButton.icon(
                    onPressed: () => _pending(context, 'Google'),
                    icon: const Icon(Icons.login),
                    label: Text(l.continueWithGoogle),
                  ),
                  const SizedBox(height: 12),
                  OutlinedButton.icon(
                    onPressed: () => _pending(context, 'Facebook'),
                    icon: const Icon(Icons.facebook),
                    label: Text(l.continueWithFacebook),
                  ),
                  const SizedBox(height: 24),
                  Text(l.termsPrivacy, textAlign: TextAlign.center, style: text.bodySmall),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
