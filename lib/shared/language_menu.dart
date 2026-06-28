import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../features/settings/locale_controller.dart';
import '../l10n/app_localizations.dart';

/// Language switcher available before login (local preference) and after.
class LanguageMenu extends ConsumerWidget {
  const LanguageMenu({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l = AppLocalizations.of(context);
    final current = ref.watch(localeProvider);
    return PopupMenuButton<String>(
      icon: const Icon(Icons.language),
      tooltip: l.language,
      initialValue: current?.languageCode ?? 'en',
      onSelected: (code) => ref.read(localeProvider.notifier).setLocale(Locale(code)),
      itemBuilder: (context) => [
        PopupMenuItem(value: 'en', child: Text(l.languageEnglish)),
        PopupMenuItem(value: 'zh', child: Text(l.languageChinese)),
        PopupMenuItem(value: 'ms', child: Text(l.languageMalay)),
      ],
    );
  }
}
