// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for English (`en`).
class AppLocalizationsEn extends AppLocalizations {
  AppLocalizationsEn([String locale = 'en']) : super(locale);

  @override
  String get appName => 'MakanKira';

  @override
  String get appTagline => 'Order together. Kira fairly. Pay easily.';

  @override
  String get loginSubtitle =>
      'Organize a shared meal, collect orders, split the bill, and request payment.';

  @override
  String get continueWithGoogle => 'Continue with Google';

  @override
  String get continueWithFacebook => 'Continue with Facebook';

  @override
  String get signOut => 'Sign out';

  @override
  String get termsPrivacy => 'Terms & Privacy';

  @override
  String get loginError => 'Sign-in failed. Please try again.';

  @override
  String get language => 'Language';

  @override
  String get languageEnglish => 'English';

  @override
  String get languageChinese => '中文';

  @override
  String get languageMalay => 'Bahasa Melayu';

  @override
  String get loading => 'Loading…';

  @override
  String get errorTitle => 'Something went wrong';

  @override
  String get retry => 'Retry';

  @override
  String get save => 'Save';

  @override
  String get cancel => 'Cancel';

  @override
  String get delete => 'Delete';

  @override
  String get edit => 'Edit';

  @override
  String get add => 'Add';

  @override
  String get search => 'Search';

  @override
  String get mealSessions => 'Meal Sessions';

  @override
  String get newMeal => 'New meal';

  @override
  String get searchMeals => 'Search meals';

  @override
  String get noMeals => 'No meal sessions yet. Create your first one.';

  @override
  String get filterAll => 'All';

  @override
  String get settings => 'Settings';

  @override
  String get profile => 'Profile';

  @override
  String get statusDraft => 'Draft';

  @override
  String get statusCollecting => 'Collecting orders';

  @override
  String get statusFinalized => 'Finalized';

  @override
  String get statusBillEntered => 'Bill entered';

  @override
  String get statusClaimApplied => 'Claim applied';

  @override
  String get statusPaymentRequested => 'Payment requested';

  @override
  String get statusClosed => 'Closed';
}
