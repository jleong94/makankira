// API DTOs (camelCase JSON from the /api layer). Money fields are integer sen.

class ApiException implements Exception {
  final int status;
  final String code;
  final String message;
  ApiException(this.status, this.code, this.message);
  @override
  String toString() => message;
}

class AppUser {
  final String id;
  final String authProvider;
  final String? email;
  final String? displayName;
  final String? mobileNumber;
  final String? photoUrl;
  final String preferredLanguage;

  AppUser({
    required this.id,
    required this.authProvider,
    this.email,
    this.displayName,
    this.mobileNumber,
    this.photoUrl,
    required this.preferredLanguage,
  });

  factory AppUser.fromJson(Map<String, dynamic> j) => AppUser(
        id: j['id'] as String,
        authProvider: j['authProvider'] as String? ?? 'google',
        email: j['email'] as String?,
        displayName: j['displayName'] as String?,
        mobileNumber: j['mobileNumber'] as String?,
        photoUrl: j['photoUrl'] as String?,
        preferredLanguage: j['preferredLanguage'] as String? ?? 'en',
      );
}

class MealSession {
  final String id;
  final String title;
  final String? mealType;
  final bool farewellEnabled;
  final String restaurantName;
  final String? menuUrl;
  final String? mealDateTime;
  final String? seatDetails;
  final String? organizerName;
  final String? organizerContact;
  final String status;
  final bool reminderEnabled;
  final int reminderLeadMinutes;

  MealSession({
    required this.id,
    required this.title,
    required this.mealType,
    required this.farewellEnabled,
    required this.restaurantName,
    required this.menuUrl,
    required this.mealDateTime,
    required this.seatDetails,
    required this.organizerName,
    required this.organizerContact,
    required this.status,
    required this.reminderEnabled,
    required this.reminderLeadMinutes,
  });

  factory MealSession.fromJson(Map<String, dynamic> j) => MealSession(
        id: j['id'] as String,
        title: j['title'] as String,
        mealType: j['mealType'] as String?,
        farewellEnabled: j['farewellEnabled'] as bool? ?? false,
        restaurantName: j['restaurantName'] as String? ?? '',
        menuUrl: j['menuUrl'] as String?,
        mealDateTime: j['mealDateTime'] as String?,
        seatDetails: j['seatDetails'] as String?,
        organizerName: j['organizerName'] as String?,
        organizerContact: j['organizerContact'] as String?,
        status: j['status'] as String? ?? 'draft',
        reminderEnabled: j['reminderEnabled'] as bool? ?? true,
        reminderLeadMinutes: (j['reminderLeadMinutes'] as num?)?.toInt() ?? 120,
      );
}

class PaymentMethod {
  final String id;
  final String methodType;
  final String? accountName;
  final String? bankName;
  final String? accountNumber;
  final String? duitNowId;
  final String? qrImageFileId;
  final String? instructions;
  final bool isDefault;

  PaymentMethod({
    required this.id,
    required this.methodType,
    this.accountName,
    this.bankName,
    this.accountNumber,
    this.duitNowId,
    this.qrImageFileId,
    this.instructions,
    this.isDefault = false,
  });

  factory PaymentMethod.fromJson(Map<String, dynamic> j) => PaymentMethod(
        id: j['id'] as String,
        methodType: j['methodType'] as String,
        accountName: j['accountName'] as String?,
        bankName: j['bankName'] as String?,
        accountNumber: j['accountNumber'] as String?,
        duitNowId: j['duitNowId'] as String?,
        qrImageFileId: j['qrImageFileId'] as String?,
        instructions: j['instructions'] as String?,
        isDefault: j['isDefault'] as bool? ?? false,
      );
}

class MenuItem {
  final String id;
  final String? itemCode;
  final String name;
  final String? category;
  final String? description;
  final int? estimatedPriceCents;
  final int? actualPriceCents;
  final bool available;

  MenuItem({
    required this.id,
    this.itemCode,
    required this.name,
    this.category,
    this.description,
    this.estimatedPriceCents,
    this.actualPriceCents,
    this.available = true,
  });

  factory MenuItem.fromJson(Map<String, dynamic> j) => MenuItem(
        id: j['id'] as String,
        itemCode: j['itemCode'] as String?,
        name: j['name'] as String,
        category: j['category'] as String?,
        description: j['description'] as String?,
        estimatedPriceCents: (j['estimatedPriceCents'] as num?)?.toInt(),
        actualPriceCents: (j['actualPriceCents'] as num?)?.toInt(),
        available: j['available'] as bool? ?? true,
      );
}

class OrderItem {
  final String id;
  final String menuItemId;
  final int quantity;
  final String? remarks;

  OrderItem({required this.id, required this.menuItemId, required this.quantity, this.remarks});

  factory OrderItem.fromJson(Map<String, dynamic> j) => OrderItem(
        id: j['id'] as String? ?? '',
        menuItemId: j['menuItemId'] as String,
        quantity: (j['quantity'] as num?)?.toInt() ?? 1,
        remarks: j['remarks'] as String?,
      );
}

class ParticipantOrder {
  final String id;
  final String participantName;
  final String participantRole;
  final String? mobileNumber;
  final List<OrderItem> items;

  ParticipantOrder({
    required this.id,
    required this.participantName,
    required this.participantRole,
    this.mobileNumber,
    required this.items,
  });

  bool get isHonoree => participantRole == 'farewell_honoree';

  factory ParticipantOrder.fromJson(Map<String, dynamic> j) => ParticipantOrder(
        id: j['id'] as String,
        participantName: j['participantName'] as String,
        participantRole: j['participantRole'] as String? ?? 'paying_participant',
        mobileNumber: j['mobileNumber'] as String?,
        items: (j['items'] as List? ?? const [])
            .cast<Map<String, dynamic>>()
            .map(OrderItem.fromJson)
            .toList(),
      );
}
