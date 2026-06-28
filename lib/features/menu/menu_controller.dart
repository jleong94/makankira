import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../api/api_client.dart';
import '../../api/models.dart';

/// Menu items for a meal (Screen 4). Read via a family future; mutations go
/// through the repository, which invalidates the list to refresh.
final menuListProvider = FutureProvider.family<List<MenuItem>, String>((ref, mealId) async {
  final data = await ref.read(apiClientProvider).getJson('/meals/$mealId/menu-items');
  return (data['menuItems'] as List).cast<Map<String, dynamic>>().map(MenuItem.fromJson).toList();
});

class MenuRepository {
  MenuRepository(this.ref);
  final Ref ref;
  ApiClient get _api => ref.read(apiClientProvider);

  Future<void> add(String mealId, Map<String, dynamic> body) async {
    await _api.postJson('/meals/$mealId/menu-items', body: body);
    ref.invalidate(menuListProvider(mealId));
  }

  Future<void> update(String mealId, String itemId, Map<String, dynamic> body) async {
    await _api.patchJson('/meals/$mealId/menu-items/$itemId', body: body);
    ref.invalidate(menuListProvider(mealId));
  }

  Future<void> remove(String mealId, String itemId) async {
    await _api.delete('/meals/$mealId/menu-items/$itemId');
    ref.invalidate(menuListProvider(mealId));
  }
}

final menuRepositoryProvider = Provider((ref) => MenuRepository(ref));
