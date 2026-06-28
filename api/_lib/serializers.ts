/**
 * serializers.ts — map snake_case DB rows to the camelCase JSON DTOs the UI
 * consumes (README Section 9). Money stays as integer-cents fields.
 */

import type { Row } from '@libsql/client';

const str = (v: unknown): string | null => (v == null ? null : String(v));
const num = (v: unknown): number | null => (v == null ? null : Number(v));
const bool = (v: unknown): boolean => Number(v) === 1;

/** Public user DTO — never exposes the provider's raw user id. */
export function toUser(row: Row): Record<string, unknown> {
  return {
    id: row.id,
    authProvider: row.auth_provider,
    email: str(row.email),
    displayName: str(row.display_name),
    mobileNumber: str(row.mobile_number),
    photoUrl: str(row.photo_url),
    preferredLanguage: row.preferred_language,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toMealSession(row: Row): Record<string, unknown> {
  return {
    id: row.id,
    ownerUserId: row.owner_user_id,
    title: row.title,
    mealType: str(row.meal_type),
    occasionType: row.occasion_type,
    farewellEnabled: bool(row.farewell_enabled),
    restaurantName: row.restaurant_name,
    menuUrl: str(row.menu_url),
    mealDateTime: str(row.meal_date_time),
    seatDetails: str(row.seat_details),
    organizerName: str(row.organizer_name),
    organizerContact: str(row.organizer_contact),
    status: row.status,
    reminderEnabled: bool(row.reminder_enabled),
    reminderLeadMinutes: num(row.reminder_lead_minutes),
    remindAt: str(row.remind_at),
    reminderSentAt: str(row.reminder_sent_at),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Works for both session payment_methods and account user_payment_methods. */
export function toPaymentMethod(row: Row): Record<string, unknown> {
  return {
    id: row.id,
    ...(row.meal_session_id != null ? { mealSessionId: row.meal_session_id } : {}),
    ...(row.user_id != null ? { userId: row.user_id } : {}),
    methodType: row.method_type,
    accountName: str(row.account_name),
    bankName: str(row.bank_name),
    accountNumber: str(row.account_number),
    duitNowId: str(row.duitnow_id),
    qrImageFileId: str(row.qr_image_file_id),
    instructions: str(row.instructions),
    isDefault: bool(row.is_default),
    sortOrder: num(row.sort_order),
  };
}

export function toMenuItem(row: Row): Record<string, unknown> {
  return {
    id: row.id,
    mealSessionId: row.meal_session_id,
    itemCode: str(row.item_code),
    name: row.name,
    category: str(row.category),
    description: str(row.description),
    estimatedPriceCents: num(row.estimated_price_cents),
    actualPriceCents: num(row.actual_price_cents),
    imageUrl: str(row.image_url),
    menuUrl: str(row.menu_url),
    available: bool(row.available),
    sortOrder: num(row.sort_order),
  };
}

export function toOrderItem(row: Row): Record<string, unknown> {
  return {
    id: row.id,
    menuItemId: row.menu_item_id,
    quantity: num(row.quantity),
    remarks: str(row.remarks),
  };
}

export function toOrder(row: Row, items: Row[]): Record<string, unknown> {
  return {
    id: row.id,
    mealSessionId: row.meal_session_id,
    participantUserId: str(row.participant_user_id),
    participantName: row.participant_name,
    participantRole: row.participant_role,
    mobileNumber: str(row.mobile_number),
    items: items.map(toOrderItem),
    submittedAt: str(row.submitted_at),
  };
}

export function toBillAdjustment(row: Row): Record<string, unknown> {
  return {
    id: row.id,
    mealSessionId: row.meal_session_id,
    calculationMode: row.calculation_mode,
    includeOrganizerInSplit: bool(row.include_organizer_in_split),
    taxAmountCents: num(row.tax_amount_cents),
    serviceChargeAmountCents: num(row.service_charge_amount_cents),
    discountAmountCents: num(row.discount_amount_cents),
    companyClaimType: row.company_claim_type,
    companyClaimPercent: num(row.company_claim_percent),
    companyClaimAmountCents: num(row.company_claim_amount_cents),
    taxAllocationMethod: row.tax_allocation_method,
    serviceChargeAllocationMethod: row.service_charge_allocation_method,
    discountAllocationMethod: row.discount_allocation_method,
    companyClaimAllocationMethod: row.company_claim_allocation_method,
    farewellCostAllocationMethod: row.farewell_cost_allocation_method,
    roundingAdjustmentCents: num(row.rounding_adjustment_cents),
    finalBillAmountCents: num(row.final_bill_amount_cents),
  };
}

export function toPaymentResult(row: Row): Record<string, unknown> {
  return {
    id: row.id,
    mealSessionId: row.meal_session_id,
    participantOrderId: str(row.participant_order_id),
    participantName: row.participant_name,
    mobileNumber: str(row.mobile_number),
    participantRole: row.participant_role,
    subtotalCents: num(row.subtotal_cents),
    taxCents: num(row.tax_cents),
    serviceChargeCents: num(row.service_charge_cents),
    discountCents: num(row.discount_cents),
    companyClaimCents: num(row.company_claim_cents),
    farewellSponsoredShareCents: num(row.farewell_sponsored_share_cents),
    roundingAdjustmentCents: num(row.rounding_adjustment_cents),
    totalDueCents: num(row.total_due_cents),
    isManualOverride: bool(row.is_manual_override),
    paymentStatus: row.payment_status,
    paymentMethodId: str(row.payment_method_id),
    paymentReference: str(row.payment_reference),
    paidAt: str(row.paid_at),
  };
}

export function toPaymentStatusEvent(row: Row): Record<string, unknown> {
  return {
    id: row.id,
    mealSessionId: row.meal_session_id,
    paymentResultId: str(row.payment_result_id),
    eventType: row.event_type,
    fromStatus: str(row.from_status),
    toStatus: str(row.to_status),
    amountCents: num(row.amount_cents),
    note: str(row.note),
    createdByUserId: str(row.created_by_user_id),
    createdAt: row.created_at,
  };
}

export function toUploadedFile(row: Row): Record<string, unknown> {
  return {
    id: row.id,
    ownerUserId: row.owner_user_id,
    mealSessionId: str(row.meal_session_id),
    fileKind: row.file_kind,
    blobUrl: row.blob_url,
    blobPathname: str(row.blob_pathname),
    contentType: str(row.content_type),
    sizeBytes: num(row.size_bytes),
    originalFilename: str(row.original_filename),
    createdAt: row.created_at,
  };
}

/** Push subscription DTO — never echoes the p256dh/auth secrets. */
export function toPushSubscription(row: Row): Record<string, unknown> {
  return {
    id: row.id,
    userId: row.user_id,
    endpoint: row.endpoint,
    userAgent: str(row.user_agent),
    createdAt: row.created_at,
  };
}

export const serdeHelpers = { str, num, bool };
