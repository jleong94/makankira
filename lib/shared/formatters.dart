import 'package:intl/intl.dart';
import '../l10n/app_localizations.dart';

String statusLabel(AppLocalizations l, String status) {
  switch (status) {
    case 'collecting_orders':
      return l.statusCollecting;
    case 'finalized':
      return l.statusFinalized;
    case 'bill_entered':
      return l.statusBillEntered;
    case 'company_claim_applied':
      return l.statusClaimApplied;
    case 'payment_requested':
      return l.statusPaymentRequested;
    case 'closed':
      return l.statusClosed;
    default:
      return l.statusDraft;
  }
}

String mealTypeLabel(AppLocalizations l, String? type) {
  switch (type) {
    case 'breakfast':
      return l.mealTypeBreakfast;
    case 'lunch':
      return l.mealTypeLunch;
    case 'dinner':
      return l.mealTypeDinner;
    case 'supper':
      return l.mealTypeSupper;
    case 'custom':
      return l.mealTypeCustom;
    default:
      return '';
  }
}

/// Formats an ISO meal time (stored with +08:00). Uses a locale-agnostic pattern
/// so it works without per-locale date symbols being initialized.
String formatDateTime(String? iso) {
  if (iso == null || iso.isEmpty) return '';
  final dt = DateTime.tryParse(iso);
  if (dt == null) return iso;
  return DateFormat('EEE, d MMM y · h:mm a').format(dt.toLocal());
}

/// RM formatting from integer sen (RM 9.50 = 950).
String formatRM(int cents) {
  final sign = cents < 0 ? '-' : '';
  return '${sign}RM ${(cents.abs() / 100).toStringAsFixed(2)}';
}
