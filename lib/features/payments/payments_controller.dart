import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../api/api_client.dart';
import '../../api/models.dart';
import '../billing/bill_controller.dart';
import '../settings/locale_controller.dart';

/// Localized payment-request messages per paying participant (Screen 9).
/// Rebuilds when the app language changes.
final paymentRequestsProvider = FutureProvider.family<List<PaymentRequest>, String>((ref, mealId) async {
  final locale = ref.watch(localeProvider)?.languageCode ?? 'en';
  final data = await ref
      .read(apiClientProvider)
      .getJson('/meals/$mealId/payment-requests', query: {'locale': locale});
  return (data['requests'] as List).cast<Map<String, dynamic>>().map(PaymentRequest.fromJson).toList();
});

class PaymentsRepository {
  PaymentsRepository(this.ref);
  final Ref ref;
  ApiClient get _api => ref.read(apiClientProvider);

  Future<void> markPaid(String mealId, String resultId) async {
    await _api.postJson('/meals/$mealId/payment-results/$resultId/mark-paid');
    ref.invalidate(paymentResultsProvider(mealId));
  }

  Future<void> markPending(String mealId, String resultId) async {
    await _api.postJson('/meals/$mealId/payment-results/$resultId/mark-pending');
    ref.invalidate(paymentResultsProvider(mealId));
  }
}

final paymentsRepositoryProvider = Provider((ref) => PaymentsRepository(ref));
