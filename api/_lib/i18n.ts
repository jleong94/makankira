/**
 * i18n.ts — server-side labels for generated content (payment messages, export
 * sheet headings). UI strings live in Flutter ARB files; this covers only text
 * the server produces. User-entered content (names, items) is never translated.
 * English is the fallback (README Section 11, Language).
 */

import type { Locale } from './validate';

export interface PaymentLabels {
  greeting: (name: string, meal: string, amount: string) => string;
  items: string;
  farewellShare: string;
  taxService: string;
  discount: string;
  companyClaim: string;
  transferTo: string;
  scanQr: string;
  reference: string;
}

const PAYMENT: Record<Locale, PaymentLabels> = {
  en: {
    greeting: (name, meal, amount) => `Hi ${name}, your total for ${meal} is ${amount}.`,
    items: 'Items:',
    farewellShare: 'Farewell share',
    taxService: 'Tax/service charge',
    discount: 'Discount',
    companyClaim: 'Company claim subsidy',
    transferTo: 'Please transfer to:',
    scanQr: 'Or scan the DuitNow QR:',
    reference: 'Reference',
  },
  zh: {
    greeting: (name, meal, amount) => `${name} 您好，您在「${meal}」的应付总额为 ${amount}。`,
    items: '项目：',
    farewellShare: '欢送分摊',
    taxService: '税务／服务费',
    discount: '折扣',
    companyClaim: '公司报销',
    transferTo: '请转账至：',
    scanQr: '或扫描 DuitNow QR：',
    reference: '参考编号',
  },
  ms: {
    greeting: (name, meal, amount) => `Hai ${name}, jumlah anda untuk ${meal} ialah ${amount}.`,
    items: 'Item:',
    farewellShare: 'Bahagian majlis perpisahan',
    taxService: 'Cukai/caj perkhidmatan',
    discount: 'Diskaun',
    companyClaim: 'Subsidi tuntutan syarikat',
    transferTo: 'Sila pindahkan ke:',
    scanQr: 'Atau imbas DuitNow QR:',
    reference: 'Rujukan',
  },
};

export function paymentLabels(locale: string): PaymentLabels {
  return PAYMENT[(locale as Locale) in PAYMENT ? (locale as Locale) : 'en'];
}

// ---- Export sheet / column labels (README Section 7) ----------------------

export type ExportKey =
  | 'title_mealInfo' | 'title_restaurantSummary' | 'title_individualOrders' | 'title_menuReference'
  | 'title_paymentSummary' | 'title_participantDetails' | 'title_itemPrices' | 'title_adjustments' | 'title_messages'
  | 'col_restaurant' | 'col_meal' | 'col_dateTime' | 'col_seat' | 'col_organizer' | 'col_contact'
  | 'col_item' | 'col_totalQty' | 'col_remarks' | 'col_participant' | 'col_quantity'
  | 'col_itemCode' | 'col_itemName' | 'col_category' | 'col_estimatedPrice' | 'col_actualPrice'
  | 'col_available' | 'col_menuUrl' | 'col_mobile' | 'col_subtotal' | 'col_tax' | 'col_serviceCharge'
  | 'col_discount' | 'col_companyClaim' | 'col_role' | 'col_farewellShare' | 'col_rounding' | 'col_totalDue'
  | 'col_status' | 'col_reference' | 'col_unitPrice' | 'col_lineTotal' | 'col_field' | 'col_value'
  | 'col_message' | 'col_calculationMode' | 'col_finalBill' | 'yes' | 'no';

export type ExportLabels = Record<ExportKey, string>;

const EXPORT: Record<Locale, ExportLabels> = {
  en: {
    title_mealInfo: 'Meal Info', title_restaurantSummary: 'Restaurant Summary',
    title_individualOrders: 'Individual Orders', title_menuReference: 'Menu Reference',
    title_paymentSummary: 'Payment Summary', title_participantDetails: 'Participant Details',
    title_itemPrices: 'Item Prices', title_adjustments: 'Adjustments', title_messages: 'Messages',
    col_restaurant: 'Restaurant', col_meal: 'Meal', col_dateTime: 'Date/Time', col_seat: 'Seat',
    col_organizer: 'Organizer', col_contact: 'Contact', col_item: 'Item', col_totalQty: 'Total Qty',
    col_remarks: 'Remarks', col_participant: 'Participant', col_quantity: 'Quantity',
    col_itemCode: 'Item Code', col_itemName: 'Item Name', col_category: 'Category',
    col_estimatedPrice: 'Estimated Price', col_actualPrice: 'Actual Price', col_available: 'Available',
    col_menuUrl: 'Menu URL', col_mobile: 'Mobile', col_subtotal: 'Subtotal', col_tax: 'Tax',
    col_serviceCharge: 'Service Charge', col_discount: 'Discount', col_companyClaim: 'Company Claim',
    col_role: 'Role', col_farewellShare: 'Farewell Share', col_rounding: 'Rounding', col_totalDue: 'Total Due',
    col_status: 'Status', col_reference: 'Reference', col_unitPrice: 'Unit Price', col_lineTotal: 'Line Total',
    col_field: 'Field', col_value: 'Value', col_message: 'Message', col_calculationMode: 'Calculation Mode',
    col_finalBill: 'Final Bill', yes: 'Yes', no: 'No',
  },
  zh: {
    title_mealInfo: '用餐信息', title_restaurantSummary: '餐厅汇总',
    title_individualOrders: '个人点餐', title_menuReference: '菜单参考',
    title_paymentSummary: '付款汇总', title_participantDetails: '参与者明细',
    title_itemPrices: '项目价格', title_adjustments: '调整项', title_messages: '消息',
    col_restaurant: '餐厅', col_meal: '聚餐', col_dateTime: '日期/时间', col_seat: '座位',
    col_organizer: '组织者', col_contact: '联系方式', col_item: '项目', col_totalQty: '总数量',
    col_remarks: '备注', col_participant: '参与者', col_quantity: '数量',
    col_itemCode: '编号', col_itemName: '名称', col_category: '类别',
    col_estimatedPrice: '预估价格', col_actualPrice: '实际价格', col_available: '可选',
    col_menuUrl: '菜单链接', col_mobile: '手机号', col_subtotal: '小计', col_tax: '税务',
    col_serviceCharge: '服务费', col_discount: '折扣', col_companyClaim: '公司报销',
    col_role: '角色', col_farewellShare: '欢送分摊', col_rounding: '尾差调整', col_totalDue: '应付总额',
    col_status: '状态', col_reference: '参考编号', col_unitPrice: '单价', col_lineTotal: '小计',
    col_field: '项目', col_value: '数值', col_message: '消息', col_calculationMode: '计算方式',
    col_finalBill: '最终账单', yes: '是', no: '否',
  },
  ms: {
    title_mealInfo: 'Maklumat Majlis', title_restaurantSummary: 'Ringkasan Restoran',
    title_individualOrders: 'Pesanan Individu', title_menuReference: 'Rujukan Menu',
    title_paymentSummary: 'Ringkasan Bayaran', title_participantDetails: 'Butiran Peserta',
    title_itemPrices: 'Harga Item', title_adjustments: 'Pelarasan', title_messages: 'Mesej',
    col_restaurant: 'Restoran', col_meal: 'Majlis', col_dateTime: 'Tarikh/Masa', col_seat: 'Tempat Duduk',
    col_organizer: 'Penganjur', col_contact: 'Hubungan', col_item: 'Item', col_totalQty: 'Jumlah Kuantiti',
    col_remarks: 'Catatan', col_participant: 'Peserta', col_quantity: 'Kuantiti',
    col_itemCode: 'Kod Item', col_itemName: 'Nama Item', col_category: 'Kategori',
    col_estimatedPrice: 'Anggaran Harga', col_actualPrice: 'Harga Sebenar', col_available: 'Ada',
    col_menuUrl: 'URL Menu', col_mobile: 'Telefon', col_subtotal: 'Subjumlah', col_tax: 'Cukai',
    col_serviceCharge: 'Caj Perkhidmatan', col_discount: 'Diskaun', col_companyClaim: 'Tuntutan Syarikat',
    col_role: 'Peranan', col_farewellShare: 'Bahagian Perpisahan', col_rounding: 'Pelarasan Bulat', col_totalDue: 'Jumlah Perlu Bayar',
    col_status: 'Status', col_reference: 'Rujukan', col_unitPrice: 'Harga Seunit', col_lineTotal: 'Jumlah Baris',
    col_field: 'Medan', col_value: 'Nilai', col_message: 'Mesej', col_calculationMode: 'Kaedah Pengiraan',
    col_finalBill: 'Bil Akhir', yes: 'Ya', no: 'Tidak',
  },
};

export function exportLabels(locale: string): ExportLabels {
  return EXPORT[(locale as Locale) in EXPORT ? (locale as Locale) : 'en'];
}

// ---- Order-submission reminder text --------------------------------------

const REMINDER: Record<Locale, (meal: string) => { subject: string; body: string }> = {
  en: (meal) => ({
    subject: `Reminder: orders for ${meal}`,
    body: `Please submit or confirm the orders for ${meal} before the meal time.`,
  }),
  zh: (meal) => ({
    subject: `提醒：${meal} 的点餐`,
    body: `请在用餐前提交或确认「${meal}」的点餐。`,
  }),
  ms: (meal) => ({
    subject: `Peringatan: pesanan untuk ${meal}`,
    body: `Sila hantar atau sahkan pesanan untuk ${meal} sebelum waktu makan.`,
  }),
};

export function reminderText(locale: string, meal: string): { subject: string; body: string } {
  return REMINDER[(locale as Locale) in REMINDER ? (locale as Locale) : 'en'](meal);
}
