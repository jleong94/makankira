import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../api/api_client.dart';
import '../../api/models.dart';
import '../meals/meals_controller.dart';

/// Participant orders for a meal (Screens 5, 6).
final ordersListProvider = FutureProvider.family<List<ParticipantOrder>, String>((ref, mealId) async {
  final data = await ref.read(apiClientProvider).getJson('/meals/$mealId/orders');
  return (data['orders'] as List).cast<Map<String, dynamic>>().map(ParticipantOrder.fromJson).toList();
});

/// Grouped summary: arg.view is 'restaurant' or 'participant'.
final orderSummaryProvider =
    FutureProvider.family<List<dynamic>, ({String mealId, String view})>((ref, arg) async {
  final data = await ref
      .read(apiClientProvider)
      .getJson('/meals/${arg.mealId}/orders/summary', query: {'view': arg.view});
  return data['summary'] as List<dynamic>;
});

class OrdersRepository {
  OrdersRepository(this.ref);
  final Ref ref;
  ApiClient get _api => ref.read(apiClientProvider);

  void _invalidate(String mealId) {
    ref.invalidate(ordersListProvider(mealId));
    ref.invalidate(orderSummaryProvider);
  }

  Future<void> create(String mealId, Map<String, dynamic> body) async {
    await _api.postJson('/meals/$mealId/orders', body: body);
    _invalidate(mealId);
  }

  Future<void> remove(String mealId, String orderId) async {
    await _api.delete('/meals/$mealId/orders/$orderId');
    _invalidate(mealId);
  }

  Future<void> finalizeMeal(String mealId) async {
    await _api.postJson('/meals/$mealId/finalize');
    _invalidate(mealId);
    ref.invalidate(mealDetailProvider(mealId));
    ref.invalidate(mealsProvider);
  }
}

final ordersRepositoryProvider = Provider((ref) => OrdersRepository(ref));
