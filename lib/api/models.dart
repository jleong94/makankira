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
