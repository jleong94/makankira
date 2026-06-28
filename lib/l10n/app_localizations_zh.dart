// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Chinese (`zh`).
class AppLocalizationsZh extends AppLocalizations {
  AppLocalizationsZh([String locale = 'zh']) : super(locale);

  @override
  String get appName => 'MakanKira';

  @override
  String get appTagline => '一起点餐，公平计算，轻松付款。';

  @override
  String get loginSubtitle => '组织聚餐、收集点餐、分摊账单并请求付款。';

  @override
  String get continueWithGoogle => '使用 Google 继续';

  @override
  String get continueWithFacebook => '使用 Facebook 继续';

  @override
  String get signOut => '退出登录';

  @override
  String get termsPrivacy => '条款与隐私';

  @override
  String get loginError => '登录失败，请重试。';

  @override
  String get language => '语言';

  @override
  String get languageEnglish => 'English';

  @override
  String get languageChinese => '中文';

  @override
  String get languageMalay => 'Bahasa Melayu';

  @override
  String get loading => '加载中…';

  @override
  String get errorTitle => '出错了';

  @override
  String get retry => '重试';

  @override
  String get save => '保存';

  @override
  String get cancel => '取消';

  @override
  String get delete => '删除';

  @override
  String get edit => '编辑';

  @override
  String get add => '添加';

  @override
  String get search => '搜索';

  @override
  String get mealSessions => '聚餐';

  @override
  String get newMeal => '新建聚餐';

  @override
  String get searchMeals => '搜索聚餐';

  @override
  String get noMeals => '还没有聚餐，创建第一个吧。';

  @override
  String get filterAll => '全部';

  @override
  String get settings => '设置';

  @override
  String get profile => '个人资料';

  @override
  String get statusDraft => '草稿';

  @override
  String get statusCollecting => '收集点餐中';

  @override
  String get statusFinalized => '已确认';

  @override
  String get statusBillEntered => '已录入账单';

  @override
  String get statusClaimApplied => '已报销';

  @override
  String get statusPaymentRequested => '已请求付款';

  @override
  String get statusClosed => '已关闭';
}
