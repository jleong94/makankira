import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart' as intl;

import 'app_localizations_en.dart';
import 'app_localizations_ms.dart';
import 'app_localizations_zh.dart';

// ignore_for_file: type=lint

/// Callers can lookup localized strings with an instance of AppLocalizations
/// returned by `AppLocalizations.of(context)`.
///
/// Applications need to include `AppLocalizations.delegate()` in their app's
/// `localizationDelegates` list, and the locales they support in the app's
/// `supportedLocales` list. For example:
///
/// ```dart
/// import 'l10n/app_localizations.dart';
///
/// return MaterialApp(
///   localizationsDelegates: AppLocalizations.localizationsDelegates,
///   supportedLocales: AppLocalizations.supportedLocales,
///   home: MyApplicationHome(),
/// );
/// ```
///
/// ## Update pubspec.yaml
///
/// Please make sure to update your pubspec.yaml to include the following
/// packages:
///
/// ```yaml
/// dependencies:
///   # Internationalization support.
///   flutter_localizations:
///     sdk: flutter
///   intl: any # Use the pinned version from flutter_localizations
///
///   # Rest of dependencies
/// ```
///
/// ## iOS Applications
///
/// iOS applications define key application metadata, including supported
/// locales, in an Info.plist file that is built into the application bundle.
/// To configure the locales supported by your app, you’ll need to edit this
/// file.
///
/// First, open your project’s ios/Runner.xcworkspace Xcode workspace file.
/// Then, in the Project Navigator, open the Info.plist file under the Runner
/// project’s Runner folder.
///
/// Next, select the Information Property List item, select Add Item from the
/// Editor menu, then select Localizations from the pop-up menu.
///
/// Select and expand the newly-created Localizations item then, for each
/// locale your application supports, add a new item and select the locale
/// you wish to add from the pop-up menu in the Value field. This list should
/// be consistent with the languages listed in the AppLocalizations.supportedLocales
/// property.
abstract class AppLocalizations {
  AppLocalizations(String locale)
    : localeName = intl.Intl.canonicalizedLocale(locale.toString());

  final String localeName;

  static AppLocalizations of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations)!;
  }

  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  /// A list of this localizations delegate along with the default localizations
  /// delegates.
  ///
  /// Returns a list of localizations delegates containing this delegate along with
  /// GlobalMaterialLocalizations.delegate, GlobalCupertinoLocalizations.delegate,
  /// and GlobalWidgetsLocalizations.delegate.
  ///
  /// Additional delegates can be added by appending to this list in
  /// MaterialApp. This list does not have to be used at all if a custom list
  /// of delegates is preferred or required.
  static const List<LocalizationsDelegate<dynamic>> localizationsDelegates =
      <LocalizationsDelegate<dynamic>>[
        delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
      ];

  /// A list of this localizations delegate's supported locales.
  static const List<Locale> supportedLocales = <Locale>[
    Locale('en'),
    Locale('ms'),
    Locale('zh'),
  ];

  /// No description provided for @appName.
  ///
  /// In en, this message translates to:
  /// **'MakanKira'**
  String get appName;

  /// No description provided for @appTagline.
  ///
  /// In en, this message translates to:
  /// **'Order together. Kira fairly. Pay easily.'**
  String get appTagline;

  /// No description provided for @loginSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Organize a shared meal, collect orders, split the bill, and request payment.'**
  String get loginSubtitle;

  /// No description provided for @continueWithGoogle.
  ///
  /// In en, this message translates to:
  /// **'Continue with Google'**
  String get continueWithGoogle;

  /// No description provided for @continueWithFacebook.
  ///
  /// In en, this message translates to:
  /// **'Continue with Facebook'**
  String get continueWithFacebook;

  /// No description provided for @signOut.
  ///
  /// In en, this message translates to:
  /// **'Sign out'**
  String get signOut;

  /// No description provided for @termsPrivacy.
  ///
  /// In en, this message translates to:
  /// **'Terms & Privacy'**
  String get termsPrivacy;

  /// No description provided for @loginError.
  ///
  /// In en, this message translates to:
  /// **'Sign-in failed. Please try again.'**
  String get loginError;

  /// No description provided for @language.
  ///
  /// In en, this message translates to:
  /// **'Language'**
  String get language;

  /// No description provided for @languageEnglish.
  ///
  /// In en, this message translates to:
  /// **'English'**
  String get languageEnglish;

  /// No description provided for @languageChinese.
  ///
  /// In en, this message translates to:
  /// **'中文'**
  String get languageChinese;

  /// No description provided for @languageMalay.
  ///
  /// In en, this message translates to:
  /// **'Bahasa Melayu'**
  String get languageMalay;

  /// No description provided for @loading.
  ///
  /// In en, this message translates to:
  /// **'Loading…'**
  String get loading;

  /// No description provided for @errorTitle.
  ///
  /// In en, this message translates to:
  /// **'Something went wrong'**
  String get errorTitle;

  /// No description provided for @retry.
  ///
  /// In en, this message translates to:
  /// **'Retry'**
  String get retry;

  /// No description provided for @save.
  ///
  /// In en, this message translates to:
  /// **'Save'**
  String get save;

  /// No description provided for @cancel.
  ///
  /// In en, this message translates to:
  /// **'Cancel'**
  String get cancel;

  /// No description provided for @delete.
  ///
  /// In en, this message translates to:
  /// **'Delete'**
  String get delete;

  /// No description provided for @edit.
  ///
  /// In en, this message translates to:
  /// **'Edit'**
  String get edit;

  /// No description provided for @add.
  ///
  /// In en, this message translates to:
  /// **'Add'**
  String get add;

  /// No description provided for @create.
  ///
  /// In en, this message translates to:
  /// **'Create'**
  String get create;

  /// No description provided for @search.
  ///
  /// In en, this message translates to:
  /// **'Search'**
  String get search;

  /// No description provided for @required.
  ///
  /// In en, this message translates to:
  /// **'Required'**
  String get required;

  /// No description provided for @comingSoon.
  ///
  /// In en, this message translates to:
  /// **'Coming soon'**
  String get comingSoon;

  /// No description provided for @mealSessions.
  ///
  /// In en, this message translates to:
  /// **'Meal Sessions'**
  String get mealSessions;

  /// No description provided for @newMeal.
  ///
  /// In en, this message translates to:
  /// **'New meal'**
  String get newMeal;

  /// No description provided for @searchMeals.
  ///
  /// In en, this message translates to:
  /// **'Search meals'**
  String get searchMeals;

  /// No description provided for @noMeals.
  ///
  /// In en, this message translates to:
  /// **'No meal sessions yet. Create your first one.'**
  String get noMeals;

  /// No description provided for @filterAll.
  ///
  /// In en, this message translates to:
  /// **'All'**
  String get filterAll;

  /// No description provided for @settings.
  ///
  /// In en, this message translates to:
  /// **'Settings'**
  String get settings;

  /// No description provided for @profile.
  ///
  /// In en, this message translates to:
  /// **'Profile'**
  String get profile;

  /// No description provided for @statusDraft.
  ///
  /// In en, this message translates to:
  /// **'Draft'**
  String get statusDraft;

  /// No description provided for @statusCollecting.
  ///
  /// In en, this message translates to:
  /// **'Collecting orders'**
  String get statusCollecting;

  /// No description provided for @statusFinalized.
  ///
  /// In en, this message translates to:
  /// **'Finalized'**
  String get statusFinalized;

  /// No description provided for @statusBillEntered.
  ///
  /// In en, this message translates to:
  /// **'Bill entered'**
  String get statusBillEntered;

  /// No description provided for @statusClaimApplied.
  ///
  /// In en, this message translates to:
  /// **'Claim applied'**
  String get statusClaimApplied;

  /// No description provided for @statusPaymentRequested.
  ///
  /// In en, this message translates to:
  /// **'Payment requested'**
  String get statusPaymentRequested;

  /// No description provided for @statusClosed.
  ///
  /// In en, this message translates to:
  /// **'Closed'**
  String get statusClosed;

  /// No description provided for @mealSetup.
  ///
  /// In en, this message translates to:
  /// **'Meal setup'**
  String get mealSetup;

  /// No description provided for @mealTitle.
  ///
  /// In en, this message translates to:
  /// **'Meal title'**
  String get mealTitle;

  /// No description provided for @mealType.
  ///
  /// In en, this message translates to:
  /// **'Meal type'**
  String get mealType;

  /// No description provided for @mealTypeBreakfast.
  ///
  /// In en, this message translates to:
  /// **'Breakfast'**
  String get mealTypeBreakfast;

  /// No description provided for @mealTypeLunch.
  ///
  /// In en, this message translates to:
  /// **'Lunch'**
  String get mealTypeLunch;

  /// No description provided for @mealTypeDinner.
  ///
  /// In en, this message translates to:
  /// **'Dinner'**
  String get mealTypeDinner;

  /// No description provided for @mealTypeSupper.
  ///
  /// In en, this message translates to:
  /// **'Supper'**
  String get mealTypeSupper;

  /// No description provided for @mealTypeCustom.
  ///
  /// In en, this message translates to:
  /// **'Custom'**
  String get mealTypeCustom;

  /// No description provided for @restaurantName.
  ///
  /// In en, this message translates to:
  /// **'Restaurant name'**
  String get restaurantName;

  /// No description provided for @menuUrl.
  ///
  /// In en, this message translates to:
  /// **'Menu URL'**
  String get menuUrl;

  /// No description provided for @mealDateTime.
  ///
  /// In en, this message translates to:
  /// **'Date & time'**
  String get mealDateTime;

  /// No description provided for @seatDetails.
  ///
  /// In en, this message translates to:
  /// **'Seat / table details'**
  String get seatDetails;

  /// No description provided for @organizerName.
  ///
  /// In en, this message translates to:
  /// **'Organizer name'**
  String get organizerName;

  /// No description provided for @organizerContact.
  ///
  /// In en, this message translates to:
  /// **'Organizer contact'**
  String get organizerContact;

  /// No description provided for @farewellMeal.
  ///
  /// In en, this message translates to:
  /// **'Farewell meal'**
  String get farewellMeal;

  /// No description provided for @farewellMealHint.
  ///
  /// In en, this message translates to:
  /// **'Honorees join and order but don\'t pay.'**
  String get farewellMealHint;

  /// No description provided for @orderReminder.
  ///
  /// In en, this message translates to:
  /// **'Order reminder'**
  String get orderReminder;

  /// No description provided for @reminderLead.
  ///
  /// In en, this message translates to:
  /// **'Remind (minutes before)'**
  String get reminderLead;

  /// No description provided for @mealCreated.
  ///
  /// In en, this message translates to:
  /// **'Meal created'**
  String get mealCreated;

  /// No description provided for @mealDeleted.
  ///
  /// In en, this message translates to:
  /// **'Meal deleted'**
  String get mealDeleted;

  /// No description provided for @deleteMealConfirm.
  ///
  /// In en, this message translates to:
  /// **'Delete this meal session? This cannot be undone.'**
  String get deleteMealConfirm;

  /// No description provided for @restaurant.
  ///
  /// In en, this message translates to:
  /// **'Restaurant'**
  String get restaurant;

  /// No description provided for @seat.
  ///
  /// In en, this message translates to:
  /// **'Seat'**
  String get seat;

  /// No description provided for @statusLabel.
  ///
  /// In en, this message translates to:
  /// **'Status'**
  String get statusLabel;

  /// No description provided for @paymentMethods.
  ///
  /// In en, this message translates to:
  /// **'Payment methods'**
  String get paymentMethods;

  /// No description provided for @noPaymentMethods.
  ///
  /// In en, this message translates to:
  /// **'No receiving methods yet.'**
  String get noPaymentMethods;

  /// No description provided for @sectionMenu.
  ///
  /// In en, this message translates to:
  /// **'Menu'**
  String get sectionMenu;

  /// No description provided for @sectionOrders.
  ///
  /// In en, this message translates to:
  /// **'Orders'**
  String get sectionOrders;

  /// No description provided for @sectionReview.
  ///
  /// In en, this message translates to:
  /// **'Review order'**
  String get sectionReview;

  /// No description provided for @sectionBill.
  ///
  /// In en, this message translates to:
  /// **'Bill & payment'**
  String get sectionBill;

  /// No description provided for @sectionPaymentRequests.
  ///
  /// In en, this message translates to:
  /// **'Payment requests'**
  String get sectionPaymentRequests;

  /// No description provided for @notSet.
  ///
  /// In en, this message translates to:
  /// **'Not set'**
  String get notSet;

  /// No description provided for @menuManager.
  ///
  /// In en, this message translates to:
  /// **'Menu'**
  String get menuManager;

  /// No description provided for @addItem.
  ///
  /// In en, this message translates to:
  /// **'Add item'**
  String get addItem;

  /// No description provided for @editItem.
  ///
  /// In en, this message translates to:
  /// **'Edit item'**
  String get editItem;

  /// No description provided for @itemName.
  ///
  /// In en, this message translates to:
  /// **'Item name'**
  String get itemName;

  /// No description provided for @itemCategory.
  ///
  /// In en, this message translates to:
  /// **'Category'**
  String get itemCategory;

  /// No description provided for @itemDescription.
  ///
  /// In en, this message translates to:
  /// **'Description'**
  String get itemDescription;

  /// No description provided for @estimatedPrice.
  ///
  /// In en, this message translates to:
  /// **'Estimated price (RM)'**
  String get estimatedPrice;

  /// No description provided for @actualPrice.
  ///
  /// In en, this message translates to:
  /// **'Actual price (RM)'**
  String get actualPrice;

  /// No description provided for @available.
  ///
  /// In en, this message translates to:
  /// **'Available'**
  String get available;

  /// No description provided for @noMenuItems.
  ///
  /// In en, this message translates to:
  /// **'No items yet. Add the first one.'**
  String get noMenuItems;

  /// No description provided for @deleteItemConfirm.
  ///
  /// In en, this message translates to:
  /// **'Delete this item?'**
  String get deleteItemConfirm;

  /// No description provided for @saved.
  ///
  /// In en, this message translates to:
  /// **'Saved'**
  String get saved;

  /// No description provided for @addOrder.
  ///
  /// In en, this message translates to:
  /// **'Add order'**
  String get addOrder;

  /// No description provided for @participantName.
  ///
  /// In en, this message translates to:
  /// **'Name'**
  String get participantName;

  /// No description provided for @mobileNumber.
  ///
  /// In en, this message translates to:
  /// **'Mobile number'**
  String get mobileNumber;

  /// No description provided for @role.
  ///
  /// In en, this message translates to:
  /// **'Role'**
  String get role;

  /// No description provided for @rolePaying.
  ///
  /// In en, this message translates to:
  /// **'Paying'**
  String get rolePaying;

  /// No description provided for @roleHonoree.
  ///
  /// In en, this message translates to:
  /// **'Farewell honoree'**
  String get roleHonoree;

  /// No description provided for @myOrder.
  ///
  /// In en, this message translates to:
  /// **'This is my order'**
  String get myOrder;

  /// No description provided for @quantity.
  ///
  /// In en, this message translates to:
  /// **'Qty'**
  String get quantity;

  /// No description provided for @remarks.
  ///
  /// In en, this message translates to:
  /// **'Remarks'**
  String get remarks;

  /// No description provided for @noOrders.
  ///
  /// In en, this message translates to:
  /// **'No orders yet.'**
  String get noOrders;

  /// No description provided for @selectItems.
  ///
  /// In en, this message translates to:
  /// **'Select at least one item.'**
  String get selectItems;

  /// No description provided for @viewList.
  ///
  /// In en, this message translates to:
  /// **'Orders'**
  String get viewList;

  /// No description provided for @viewByItem.
  ///
  /// In en, this message translates to:
  /// **'By item'**
  String get viewByItem;

  /// No description provided for @viewByPerson.
  ///
  /// In en, this message translates to:
  /// **'By person'**
  String get viewByPerson;

  /// No description provided for @finalize.
  ///
  /// In en, this message translates to:
  /// **'Finalize'**
  String get finalize;

  /// No description provided for @finalizeConfirm.
  ///
  /// In en, this message translates to:
  /// **'Lock orders and finalize? Items can no longer be edited.'**
  String get finalizeConfirm;

  /// No description provided for @orderSaved.
  ///
  /// In en, this message translates to:
  /// **'Order added'**
  String get orderSaved;

  /// No description provided for @totalQuantity.
  ///
  /// In en, this message translates to:
  /// **'Total'**
  String get totalQuantity;

  /// No description provided for @deleteOrderConfirm.
  ///
  /// In en, this message translates to:
  /// **'Delete this order?'**
  String get deleteOrderConfirm;
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  Future<AppLocalizations> load(Locale locale) {
    return SynchronousFuture<AppLocalizations>(lookupAppLocalizations(locale));
  }

  @override
  bool isSupported(Locale locale) =>
      <String>['en', 'ms', 'zh'].contains(locale.languageCode);

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

AppLocalizations lookupAppLocalizations(Locale locale) {
  // Lookup logic when only language code is specified.
  switch (locale.languageCode) {
    case 'en':
      return AppLocalizationsEn();
    case 'ms':
      return AppLocalizationsMs();
    case 'zh':
      return AppLocalizationsZh();
  }

  throw FlutterError(
    'AppLocalizations.delegate failed to load unsupported locale "$locale". This is likely '
    'an issue with the localizations generation tool. Please file an issue '
    'on GitHub with a reproducible sample app and the gen-l10n configuration '
    'that was used.',
  );
}
