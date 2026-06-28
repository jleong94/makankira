import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../api/api_client.dart';
import '../../api/models.dart';

/// The signed-in user's meal sessions (Screen 2).
class MealsController extends AsyncNotifier<List<MealSession>> {
  @override
  Future<List<MealSession>> build() => _fetch();

  Future<List<MealSession>> _fetch() async {
    final data = await ref.read(apiClientProvider).getJson('/meals');
    final list = (data['meals'] as List).cast<Map<String, dynamic>>();
    return list.map(MealSession.fromJson).toList();
  }

  Future<void> refresh() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(_fetch);
  }

  Future<MealSession> create(Map<String, dynamic> body) async {
    final data = await ref.read(apiClientProvider).postJson('/meals', body: body);
    final meal = MealSession.fromJson(data['meal'] as Map<String, dynamic>);
    await refresh();
    return meal;
  }

  Future<void> deleteMeal(String id) async {
    await ref.read(apiClientProvider).delete('/meals/$id');
    await refresh();
  }
}

final mealsProvider = AsyncNotifierProvider<MealsController, List<MealSession>>(MealsController.new);

class MealDetail {
  final MealSession meal;
  final List<PaymentMethod> paymentMethods;
  MealDetail({required this.meal, required this.paymentMethods});
}

/// Full detail for one meal (Screens 3, 6).
final mealDetailProvider = FutureProvider.family<MealDetail, String>((ref, id) async {
  final data = await ref.read(apiClientProvider).getJson('/meals/$id');
  final methods = (data['paymentMethods'] as List? ?? const [])
      .cast<Map<String, dynamic>>()
      .map(PaymentMethod.fromJson)
      .toList();
  return MealDetail(meal: MealSession.fromJson(data['meal'] as Map<String, dynamic>), paymentMethods: methods);
});
