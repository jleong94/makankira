import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../api/api_client.dart';
import '../../api/models.dart';

/// Account-level saved receiving methods (Screen 2B), prefilled into new meals.
final paymentDefaultsProvider = FutureProvider<List<PaymentMethod>>((ref) async {
  final data = await ref.read(apiClientProvider).getJson('/me/payment-methods');
  return (data['paymentMethods'] as List).cast<Map<String, dynamic>>().map(PaymentMethod.fromJson).toList();
});

class PaymentDefaultsRepository {
  PaymentDefaultsRepository(this.ref);
  final Ref ref;
  ApiClient get _api => ref.read(apiClientProvider);

  Future<void> add(Map<String, dynamic> body) async {
    await _api.postJson('/me/payment-methods', body: body);
    ref.invalidate(paymentDefaultsProvider);
  }

  Future<void> update(String id, Map<String, dynamic> body) async {
    await _api.patchJson('/me/payment-methods/$id', body: body);
    ref.invalidate(paymentDefaultsProvider);
  }

  Future<void> remove(String id) async {
    await _api.delete('/me/payment-methods/$id');
    ref.invalidate(paymentDefaultsProvider);
  }
}

final paymentDefaultsRepositoryProvider = Provider((ref) => PaymentDefaultsRepository(ref));
