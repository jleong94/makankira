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
  String get create => 'Create';

  @override
  String get search => 'Search';

  @override
  String get required => 'Required';

  @override
  String get comingSoon => 'Coming soon';

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

  @override
  String get mealSetup => 'Meal setup';

  @override
  String get mealTitle => 'Meal title';

  @override
  String get mealType => 'Meal type';

  @override
  String get mealTypeBreakfast => 'Breakfast';

  @override
  String get mealTypeLunch => 'Lunch';

  @override
  String get mealTypeDinner => 'Dinner';

  @override
  String get mealTypeSupper => 'Supper';

  @override
  String get mealTypeCustom => 'Custom';

  @override
  String get restaurantName => 'Restaurant name';

  @override
  String get menuUrl => 'Menu URL';

  @override
  String get mealDateTime => 'Date & time';

  @override
  String get seatDetails => 'Seat / table details';

  @override
  String get organizerName => 'Organizer name';

  @override
  String get organizerContact => 'Organizer contact';

  @override
  String get farewellMeal => 'Farewell meal';

  @override
  String get farewellMealHint => 'Honorees join and order but don\'t pay.';

  @override
  String get orderReminder => 'Order reminder';

  @override
  String get reminderLead => 'Remind (minutes before)';

  @override
  String get mealCreated => 'Meal created';

  @override
  String get mealDeleted => 'Meal deleted';

  @override
  String get deleteMealConfirm =>
      'Delete this meal session? This cannot be undone.';

  @override
  String get restaurant => 'Restaurant';

  @override
  String get seat => 'Seat';

  @override
  String get statusLabel => 'Status';

  @override
  String get paymentMethods => 'Payment methods';

  @override
  String get noPaymentMethods => 'No receiving methods yet.';

  @override
  String get sectionMenu => 'Menu';

  @override
  String get sectionOrders => 'Orders';

  @override
  String get sectionReview => 'Review order';

  @override
  String get sectionBill => 'Bill & payment';

  @override
  String get sectionPaymentRequests => 'Payment requests';

  @override
  String get notSet => 'Not set';

  @override
  String get menuManager => 'Menu';

  @override
  String get addItem => 'Add item';

  @override
  String get editItem => 'Edit item';

  @override
  String get itemName => 'Item name';

  @override
  String get itemCategory => 'Category';

  @override
  String get itemDescription => 'Description';

  @override
  String get estimatedPrice => 'Estimated price (RM)';

  @override
  String get actualPrice => 'Actual price (RM)';

  @override
  String get available => 'Available';

  @override
  String get noMenuItems => 'No items yet. Add the first one.';

  @override
  String get deleteItemConfirm => 'Delete this item?';

  @override
  String get saved => 'Saved';

  @override
  String get addOrder => 'Add order';

  @override
  String get participantName => 'Name';

  @override
  String get mobileNumber => 'Mobile number';

  @override
  String get role => 'Role';

  @override
  String get rolePaying => 'Paying';

  @override
  String get roleHonoree => 'Farewell honoree';

  @override
  String get myOrder => 'This is my order';

  @override
  String get quantity => 'Qty';

  @override
  String get remarks => 'Remarks';

  @override
  String get noOrders => 'No orders yet.';

  @override
  String get selectItems => 'Select at least one item.';

  @override
  String get viewList => 'Orders';

  @override
  String get viewByItem => 'By item';

  @override
  String get viewByPerson => 'By person';

  @override
  String get finalize => 'Finalize';

  @override
  String get finalizeConfirm =>
      'Lock orders and finalize? Items can no longer be edited.';

  @override
  String get orderSaved => 'Order added';

  @override
  String get totalQuantity => 'Total';

  @override
  String get deleteOrderConfirm => 'Delete this order?';

  @override
  String get calcMode => 'Calculation mode';

  @override
  String get modeItemBased => 'Item-based';

  @override
  String get modeEqualSplit => 'Equal split';

  @override
  String get modeFarewell => 'Farewell';

  @override
  String get tax => 'Tax (RM)';

  @override
  String get serviceCharge => 'Service charge (RM)';

  @override
  String get discount => 'Discount (RM)';

  @override
  String get finalBill => 'Final bill (RM)';

  @override
  String get companyClaim => 'Company claim';

  @override
  String get claimNone => 'None';

  @override
  String get claimFixed => 'Fixed (RM)';

  @override
  String get claimPercent => 'Percentage (%)';

  @override
  String get claimValue => 'Value';

  @override
  String get calculate => 'Calculate';

  @override
  String get results => 'Results';

  @override
  String get subtotal => 'Subtotal';

  @override
  String get totalDue => 'Total due';

  @override
  String get calculatedTotal => 'Calculated total';

  @override
  String get mismatch => 'Mismatch';

  @override
  String get billMismatchWarning =>
      'Calculated total differs from the final bill.';

  @override
  String get noResults => 'Run Calculate to see each person\'s amount.';

  @override
  String get farewellShareLabel => 'Farewell share';

  @override
  String get copyMessage => 'Copy';

  @override
  String get copyAll => 'Copy all';

  @override
  String get openWhatsApp => 'WhatsApp';

  @override
  String get markPaid => 'Mark paid';

  @override
  String get markPending => 'Mark pending';

  @override
  String get paid => 'Paid';

  @override
  String get pending => 'Pending';

  @override
  String get copied => 'Copied to clipboard';

  @override
  String get noPaymentRequests =>
      'Calculate first to generate payment requests.';

  @override
  String get displayName => 'Display name';

  @override
  String get email => 'Email';

  @override
  String get paymentDefaults => 'Payment defaults';

  @override
  String get notifications => 'Notifications';

  @override
  String get addPaymentMethod => 'Add method';

  @override
  String get methodType => 'Type';

  @override
  String get methodBank => 'Bank account';

  @override
  String get methodDuitNowId => 'DuitNow ID';

  @override
  String get methodDuitNowQr => 'DuitNow QR';

  @override
  String get methodCustom => 'Custom';

  @override
  String get bankName => 'Bank';

  @override
  String get accountName => 'Account name';

  @override
  String get accountNumber => 'Account number';

  @override
  String get duitNowIdLabel => 'DuitNow ID';

  @override
  String get instructions => 'Instructions';

  @override
  String get setDefault => 'Set as default';

  @override
  String get defaultLabel => 'Default';

  @override
  String get noSavedMethods => 'No saved methods yet.';

  @override
  String get profileSaved => 'Profile saved';
}
