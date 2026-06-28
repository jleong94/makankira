import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../api/api_client.dart';
import '../../api/models.dart';

final billProvider = FutureProvider.family<BillAdjustment, String>((ref, mealId) async {
  final data = await ref.read(apiClientProvider).getJson('/meals/$mealId/bill');
  final bill = data['bill'];
  return bill == null ? BillAdjustment() : BillAdjustment.fromJson(bill as Map<String, dynamic>);
});

final paymentResultsProvider = FutureProvider.family<List<PaymentResult>, String>((ref, mealId) async {
  final data = await ref.read(apiClientProvider).getJson('/meals/$mealId/payment-results');
  return (data['results'] as List).cast<Map<String, dynamic>>().map(PaymentResult.fromJson).toList();
});

class CalcResult {
  final CalcSummary summary;
  final List<PaymentResult> results;
  CalcResult(this.summary, this.results);
}

class BillRepository {
  BillRepository(this.ref);
  final Ref ref;
  ApiClient get _api => ref.read(apiClientProvider);

  Future<void> saveBill(String mealId, Map<String, dynamic> body) async {
    await _api.putJson('/meals/$mealId/bill', body: body);
    ref.invalidate(billProvider(mealId));
  }

  Future<CalcResult> calculate(String mealId) async {
    final data = await _api.postJson('/meals/$mealId/calculate');
    final summary = CalcSummary.fromJson(data['summary'] as Map<String, dynamic>);
    final results = (data['results'] as List).cast<Map<String, dynamic>>().map(PaymentResult.fromJson).toList();
    ref.invalidate(paymentResultsProvider(mealId));
    return CalcResult(summary, results);
  }
}

final billRepositoryProvider = Provider((ref) => BillRepository(ref));
