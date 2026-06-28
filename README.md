# MakanKira

## 1. Purpose

MakanKira is a Malaysia-localized web app that helps one person organize a shared team or family meal, collect everyone’s orders, prepare a final restaurant order sheet, calculate each person’s payment after the meal, and request reimbursement from each participant.

The main problem it solves is the messy manual process of:

- Sharing a restaurant menu.
- Asking each person what they want.
- Combining all orders into one bulk order.
- Sending the final order to the restaurant.
- Paying the full bill first.
- Calculating how much each person owes.
- Asking each person to transfer the correct amount.

MakanKira should make this flow simple, traceable, and exportable to Excel.

## 1A. App Name and Positioning

### Name

MakanKira

### Meaning

`Makan` means eating or meal, and `Kira` means calculate or count. Together, MakanKira communicates the core idea clearly in a Malaysian context: organize the makan, calculate the amount, and collect payment fairly.

### Positioning

MakanKira is a practical meal-ordering and payment-splitting tool for Malaysian teams, families, and friend groups.

### Suggested Tagline

```
Order together. Kira fairly. Pay easily.
```

## 2. Target Users

### Organizer

The person arranging the meal. Usually this is the person who:

- Creates the meal session.
- Uploads or enters menu information.
- Invites participants to submit orders.
- Confirms the final order with the restaurant.
- Pays the restaurant bill.
- Enters final item prices, tax, and service charge.
- Sends payment requests to participants.

### Participants

The people joining the meal. They need to:

- View the menu.
- Enter their name.
- Select one or more food or drink items.
- Add remarks, such as no spicy, less sugar, no onion, or takeaway.
- Later view the final amount they owe.
- Transfer money to the organizer.

### Restaurant

The restaurant is not necessarily a system user. The app should generate a clean order sheet that the organizer can send to the restaurant by WhatsApp, email, printout, or Excel.

## 3. Core Workflow

### Phase 0: User Authentication

When a user accesses the app landing page, the app should immediately show social authentication options. Google authentication should be the default and primary login method.

The landing page should not behave like a marketing page. It should be a focused login entry screen with:

- App name: `MakanKira`.
- Short purpose statement.
- Language selector (English, Chinese, Malay) so the user can switch the app language before logging in. English remains the default.
- Primary `Continue with Google` button.
- Secondary `Continue with Facebook` button.
- Optional terms/privacy links.

Only these login methods should be offered:

- Google.
- Facebook.

Email/password, magic link, phone number, GitHub, and other login methods should not be shown.

After successful login:

- New users are taken to basic profile setup if required.
- Returning users are taken to the meal sessions dashboard.
- The app should remember the login session where possible.

Authentication is required for organizer features such as creating meal sessions, exporting Excel files, managing payment details, and tracking payment status.

Participant access can be handled in two possible ways:

- MVP option: participants are entered by the organizer or use the organizer's logged-in device.
- Future option: participants can access shared order links, with optional guest entry or supported social sign-in.

### Phase 1: Create Meal Session

The organizer creates a new meal session with:

- Meal title, for example `Friday Team Lunch`.
- Meal type: breakfast, lunch, dinner, supper, or custom.
- Restaurant name.
- Restaurant menu URL.
- Optional menu image upload.
- Meal date and time.
- Seat/table details if known.
- Organizer name.
- Organizer payment details (auto-prefilled from the organizer's saved Payment Defaults; editable per session).
- Order-submission reminder setting (defaults to a reminder 2 hours before the meal).

Example:

```
Meal: Friday Team Lunch
Restaurant: ABC Chicken Rice
Date/Time: 2026-06-26 12:30 PM
Seat: Table for 5, indoor
Payment: Maybank 1234567890, Tan Wei Ming
DuitNow ID: 0123456789
DuitNow QR: Uploaded wallet QR image
```

### Phase 2: Provide Menu

The organizer can provide the menu in one or more ways:

- Upload an Excel file containing menu items.
- Paste a restaurant menu URL.
- Upload one or more menu images.
- Manually add menu items.

The app should support imperfect menu data because some restaurants only provide image menus or social media links.

Recommended menu fields:

| **Field** | **Required** | **Example** |
| --- | --- | --- |
| Item Code | Optional | A01 |
| Item Name | Yes | Chicken Rice |
| Category | Optional | Main |
| Description | Optional | Roasted chicken with rice |
| Estimated Price | Optional | 9.50 |
| Menu URL | Optional | https://restaurant.example/menu |
| Image URL | Optional | https://restaurant.example/chicken-rice.jpg |
| Available | Optional | Yes |

If exact prices are unknown before the meal, the app can still collect orders first. The organizer will enter final prices later.

### Phase 3: Participants Submit Orders

Each participant opens the meal order form and enters:

- Name.
- Mobile number, entered immediately after name.
- Food or drink items.
- Quantity for each item.
- Remarks for each item.

Participants can select multiple items.

The mobile number should make it easier for the organizer to contact the participant later, especially when sending payment request messages or WhatsApp reminders.

Example:

| **Name** | **Mobile Number** | **Item** | **Quantity** | **Remarks** |
| --- | --- | --- | ---: | --- |
| Alice | 0123456789 | Chicken Rice | 1 | No cucumber |
| Alice | 0123456789 | Iced Lemon Tea | 1 | Less ice |
| Ben | 0198765432 | Curry Noodle | 1 | Extra spicy |

The app should prevent common mistakes:

- Name is required.
- Mobile number is required unless the organizer marks it as optional for a specific session.
- At least one item is required.
- Quantity must be greater than zero.
- Duplicate item selections should either be merged or clearly shown.
- Participant can edit their order before the organizer finalizes the session.

### Phase 4: Organizer Reviews and Finalizes Orders

Before sending to the restaurant, the organizer reviews:

- All participants.
- All selected items.
- Total quantity by item.
- Item-level remarks.
- Participant-level order details.

The app should provide two useful views:

### Restaurant View

Grouped by food item, optimized for preparation.

| **Item** | **Total Qty** | **Remarks Summary** |
| --- | ---: | --- |
| Chicken Rice | 3 | Alice no cucumber; John extra rice |
| Curry Noodle | 2 | Ben extra spicy |
| Iced Lemon Tea | 4 | Alice less ice |

### Participant View

Grouped by person, optimized for checking individual orders.

| **Participant** | **Item** | **Qty** | **Remarks** |
| --- | --- | ---: | --- |
| Alice | Chicken Rice | 1 | No cucumber |
| Alice | Iced Lemon Tea | 1 | Less ice |
| Ben | Curry Noodle | 1 | Extra spicy |

After checking, the organizer marks the order as finalized. Once finalized:

- Participants should no longer freely edit orders.
- Changes should require organizer approval or be logged.
- The exported restaurant sheet should be considered the source of truth for food preparation.

### Phase 5: Export Restaurant Order Excel

The organizer exports an Excel file to send to the restaurant.

Recommended workbook tabs:

### Tab 1: Restaurant Summary

Contains:

- Restaurant name.
- Meal date/time.
- Seat/table details.
- Organizer contact.
- Grouped item totals.
- Remarks.

### Tab 2: Individual Orders

Contains:

- Participant names.
- Each ordered item.
- Quantity.
- Remarks.

### Tab 3: Menu Reference

Contains:

- Original menu items.
- Estimated prices if available.
- Menu URL or image references.

This file can be sent to the restaurant to prepare the food at the correct date, time, and seat.

### Phase 6: Organizer Pays the Bill

After the meal, the organizer pays the total bill first.

At this point, the final actual prices are known. The organizer enters:

- Actual item price.
- Tax amount or tax percentage.
- Service charge amount or percentage.
- Discount if any.
- Company claim or subsidy, if any.
- Rounding adjustment if any.
- Items that are shared by everyone, if any.

The app then calculates how much each participant owes.

## 4. Payment Calculation Rules

The app should support three calculation modes.

### Mode A: Item-Based Calculation

Each person pays for exactly what they ordered.

Formula:

```
Person subtotal = sum(item actual price * quantity ordered by that person)
```

Then tax and service charge can be distributed proportionally based on each person’s subtotal.

Formula:

```
Person tax = total tax * (person subtotal / total subtotal)
Person service charge = total service charge * (person subtotal / total subtotal)
Person discount = total discount * (person subtotal / total subtotal)
Person company claim = total company claim * (person subtotal / total subtotal)
Person total = person subtotal + person tax + person service charge - person discount - person company claim + rounding adjustment
```

### Mode B: Equal Split Calculation

The final bill is split equally across all participants.

Formula:

```
Person total = final bill amount / number of participants
```

This is useful when everyone agrees to split evenly.

### Mode C: Farewell Meal Calculation

For farewell meals, one or more team members may be treated as farewell honorees. These people are joining the meal and can order food, but they do not need to pay.

Rules:

- Farewell honorees can be more than one person.
- Farewell honorees still submit orders like normal participants.
- Farewell honorees' own ordered items are included in the restaurant order.
- Farewell honorees' payable amount is `RM 0.00`.
- The cost of farewell honorees' ordered items is shared across the paying participants.
- Paying participants still pay for their own ordered items, plus their share of the farewell honorees' meal cost.
- Farewell honorees should not be included in the denominator when splitting the sponsored farewell cost.

Recommended default: split farewell honoree meal costs equally across all paying participants.

Alternative allocation options:

- Split equally across paying participants.
- Split proportionally by each paying participant's own subtotal.
- Manual allocation.

Formula:

```
Farewell honoree subtotal = sum(items ordered by farewell honorees)
Paying participant own subtotal = sum(items ordered by that paying participant)
Farewell sponsorship share = farewell honoree subtotal / number of paying participants
Paying participant subtotal before adjustments = paying participant own subtotal + farewell sponsorship share
Farewell honoree total due = 0
```

Tax, service charge, discount, company claim, and rounding should then be calculated based on the selected allocation method. The app should clearly show how much of each paying participant's amount is for their own order and how much is for the farewell honoree share.

When allocation is proportional, each paying participant's base is their combined `own + farewell-share` subtotal, so the company claim is applied **after** the farewell share has been distributed (see Section 19, Q16).

### Recommended Default

The recommended default is item-based calculation because it matches the user’s described flow: each member pays for the portion of the calculated amount based on what they ordered.

## 5. Handling Tax, Service Charge, Discount, and Rounding

The app should allow the organizer to choose how adjustments are allocated.

### Tax

Options:

- Proportional by item subtotal.
- Equal split.
- Manual allocation.

Recommended default: proportional by item subtotal.

### Service Charge

Options:

- Proportional by item subtotal.
- Equal split.
- Manual allocation.

Recommended default: proportional by item subtotal.

### Discount

Options:

- Proportional by item subtotal.
- Apply to organizer only.
- Apply to selected participants.
- Manual allocation.

Recommended default: proportional by item subtotal.

### Company Claim or Subsidy

Sometimes part of the meal can be claimed from the company, or the company may subsidize a percentage of the bill. This reduces the amount each participant needs to transfer to the organizer.

The app should support two company claim input types:

- Fixed amount, for example `RM 50.00 company claim`.
- Percentage, for example `30% claimable by company`.

The company claim can be applied to:

- Entire bill.
- Food only.
- Selected categories, such as main meals only.
- Selected participants.
- Manual allocation.

Recommended default: apply the company claim proportionally by each participant's subtotal.

Example:

```
Total participant payable before company claim: RM 200.00
Company claim: 25%
Claim amount: RM 50.00
Remaining amount to collect from participants: RM 150.00
```

For reporting, the app should preserve both values:

- Amount paid by organizer to restaurant.
- Amount expected to be claimed from company.
- Amount expected to be collected from participants.

### Rounding Difference

Because cents may not divide perfectly, the app should handle small differences.

Recommended approach:

- Calculate each participant’s amount to two decimal places.
- Compare participant total sum against final bill amount.
- Add or subtract the rounding difference from the organizer’s own amount by default.
- Allow manual adjustment if needed.

Example:

```
Final bill: RM 103.00
Calculated participant total: RM 102.99
Rounding difference: RM 0.01
Organizer adjustment: +RM 0.01
```

## 6. Payment Request Output

After calculation, the app should generate payment request details for each participant.

The organizer can save these receiving methods once on their account profile (Payment Defaults, Screen 2B); they are then auto-prefilled into each new meal session and can be adjusted per session.

The organizer should be able to configure one or more receiving payment methods:

- Bank account.
- DuitNow ID.
- DuitNow QR image uploaded from a wallet or banking app.
- Optional custom payment instructions.

The DuitNow QR image is not generated by this app in the MVP. The organizer uploads the QR image that was already generated from their wallet account, banking app, or e-wallet app. The app stores and displays that QR image inside payment requests so participants can scan and pay.

Example:

```
Hi Alice, your total for Friday Team Lunch is RM 17.70.

Items:
- Chicken Rice x1: RM 10.00
- Iced Lemon Tea x1: RM 4.00
- Farewell share: RM 4.00
- Tax/service charge: RM 3.20
- Company claim subsidy: -RM 3.50

Please transfer to:
Maybank 1234567890
Tan Wei Ming
DuitNow ID: 0123456789

Or scan the attached DuitNow QR image.

Reference: Friday Team Lunch - Alice
```

The app should support:

- Copy message per participant, and copy all messages for selected participants at once.
- Export all payment requests to Excel.
- Export all payment requests to CSV.
- WhatsApp delivery via a **free click-to-chat link** (`https://wa.me/<number>?text=...`): tapping it opens WhatsApp with the message pre-filled to that participant, and the organizer taps Send. This uses no paid service.
- Select multiple or all participants (checkboxes) and send via WhatsApp as a **guided sequential flow**: the app opens each selected participant's click-to-chat link one at a time. A true one-click blast to everyone would require the paid WhatsApp Business API and is out of scope (see Section 13).
- Include the uploaded DuitNow QR image in the payment request screen, and include it in the WhatsApp message as a **link** to the QR's Vercel Blob URL, because the click-to-chat link pre-fills text only, not attachments.
- Include a QR image reference in exported payment files where practical.

The **WhatsApp Business / Cloud API is intentionally not used in the MVP** (it is paid per message and requires business verification and approved templates). All WhatsApp delivery in the MVP is the free click-to-chat link, sent manually by the organizer.

## 7. Excel Import and Export Requirements

Exported sheet labels and headings follow the organizer's selected app language (English, Simplified Chinese, or Malay). User-entered content — restaurant names, menu item names, participant names, and remarks — is exported exactly as entered and never auto-translated.

### Input Excel: Menu Template

The organizer can upload an Excel file with these columns:

| **Column** | **Required** | **Notes** |
| --- | --- | --- |
| item_code | No | Useful for restaurant ordering |
| item_name | Yes | Main display name |
| category | No | Main, Drink, Dessert, etc. |
| description | No | Short details |
| estimated_price | No | Used before actual price is known |
| menu_url | No | Link to menu or item |
| image_url | No | Link to item image |
| available | No | Yes/No |

### Export Excel: Restaurant Order

Workbook tabs:

- `Meal Info`
- `Restaurant Summary`
- `Individual Orders`
- `Menu Reference`

### Export Excel: Payment Calculation

Workbook tabs:

- `Payment Summary`
- `Participant Details`
- `Item Prices`
- `Adjustments`
- `Messages`

### Payment Summary Columns

| **Column** | **Example** |
| --- | --- |
| participant_name | Alice |
| mobile_number | 0123456789 |
| subtotal | 14.00 |
| tax | 1.12 |
| service_charge | 1.40 |
| discount | 0.00 |
| company_claim | 5.00 |
| participant_role | Paying Participant |
| farewell_sponsored_share | 4.00 |
| rounding_adjustment | 0.00 |
| total_due | 16.52 |
| payment_status | Pending |
| paid_at |  |
| reference | Friday Team Lunch - Alice |

## 8. Main App Screens

### Screen 1: Social Login Landing Page

Purpose: authenticate the user before they access the app.

Default behavior:

- Show Google authentication immediately when the app loads.
- Use Google sign-in as the primary/default login method.
- Offer Facebook as a secondary login method.
- Do not offer any other login methods.
- Redirect authenticated users to the meal sessions dashboard.
- Redirect unauthenticated users back to the login screen when they try to access protected pages.

Key features:

- `Continue with Google` button.
- `Continue with Facebook` button.
- `MakanKira` app name and concise description.
- Language selector (English, Chinese, Malay) so the user can switch language before signing in, with the choice saved as a local preference and applied immediately.
- Loading state while checking existing login session.
- Error state if social login fails.
- Sign-out support after login.

### Screen 2: Meal Sessions

Purpose: show existing meal sessions and allow organizer to create a new session.

Key features:

- Create new meal session.
- Search sessions.
- Filter by status (draft, collecting orders, finalized, bill entered, payment requested, closed).
- Open previous sessions.
- Show sessions owned by the authenticated user.
- Change app language after login.

### Screen 2A: Language Settings

Purpose: allow the user to switch the app language, starting from the landing page before login and anywhere after login.

Supported languages:

- English, default.
- Chinese (Simplified).
- Malay.

Key features:

- Language selector available on the landing page before login, and after login in the user/profile menu or settings page.
- Before login, persist the selected language as a local device/browser preference.
- After login, persist the selected language to the user profile and reconcile it with any language chosen on the landing page.
- Apply language changes immediately without requiring sign-out.
- Use English as fallback when a translation is missing.
- Keep user-entered content, such as restaurant names, menu item names, participant names, and remarks, exactly as entered.
- Translate app UI labels, validation messages, calculation labels, payment message templates, and export sheet labels where practical.

### Screen 2B: Payment Defaults

Purpose: let the signed-in account owner save reusable receiving payment methods on their profile, so new meal sessions can be prefilled instead of re-entering details each time.

Features:

- Add one or more saved payment methods: bank account, DuitNow ID, DuitNow QR image upload, or custom payment instructions.
- Edit or remove a saved method.
- Mark one method as the default.
- Preview the uploaded DuitNow QR image.
- Saved methods are stored on the user account, not on any single meal session.
- These saved methods are copied into a new meal session as its receiving methods when the session is created (see Screen 3). Editing them inside a session does not change the saved profile copy.

### Screen 2C: Notification Settings

Purpose: let the organizer control order-submission reminders and enable Web Push on this device.

Features:

- Enable or disable order-submission reminders (default: enabled).
- Set the default reminder lead time before the meal (default: 2 hours).
- Toggle channels: email (sent to the login email) and Web Push.
- Enable Web Push: prompt the browser for permission and register a push subscription (Android and desktop browsers; not available on iOS).
- Email reminders work on all devices, including iOS.

### Screen 2D: Profile

Purpose: let the signed-in user maintain the personal details that pre-fill forms across the app.

Features:

- Edit **display name** (defaults to the name from Google/Facebook; the user can override it).
- Enter / edit **mobile number** (Malaysian formats; used for WhatsApp/contact links and for prefill).
- Email and profile photo are shown read-only from the login provider.
- These values are the source for auto-prefill: the organizer's name and contact on Meal Setup (Screen 3), and the participant's name and mobile on the Order Form (Screen 5).

### Screen 3: Meal Setup

Purpose: configure restaurant, date/time, and payment details.

**Organizer name** and **contact** are pre-filled from the user's Profile (Screen 2D: name + mobile number), and the payment fields are **auto-prefilled from the saved Payment Defaults** (Screen 2B), when the session is created. The organizer can adjust any of them for this session without changing their saved profile values.

Fields:

- Meal title.
- Meal type.
- Restaurant name.
- Menu URL.
- Menu image upload.
- Meal date/time.
- Seat/table details.
- Organizer name.
- Organizer contact.
- Payment account name.
- Payment account number.
- DuitNow ID.
- DuitNow QR image upload.
- Payment notes.
- Send order-submission reminder (on/off; default on).
- Reminder lead time before the meal (default 2 hours).

### Screen 4: Menu Manager

Purpose: manage food and drink options.

Features:

- Upload Excel menu.
- Add item manually.
- Edit item.
- Mark unavailable.
- Preview menu URL/image.
- Export menu template.

### Screen 5: Participant Order Form

Purpose: allow each participant to submit their order.

For a signed-in user adding their own order (the organizer, or a future signed-in participant), **only the name and mobile number are pre-filled** from their Profile (Screen 2D) and remain editable — no payment details are ever prefilled here (those are the organizer's receiving methods, configured only in Meal Setup). For participants entered manually by the organizer, the fields start blank.

Features:

- Enter participant name.
- Enter participant mobile number immediately after name.
- Mark participant role as normal participant or farewell honoree when configured by organizer.
- Select multiple items.
- Set quantity.
- Add remarks.
- Submit order.
- Edit own order before finalization.

### Screen 6: Order Review

Purpose: organizer checks all orders before sending to restaurant.

Features:

- View by participant.
- View by grouped restaurant item.
- Highlight farewell honoree orders.
- Detect missing names or empty orders.
- Finalize order.
- Export restaurant order Excel.

### Screen 7: Price and Bill Entry

Purpose: enter actual prices after the meal.

Features:

- Enter actual price per item.
- Enter total tax.
- Enter service charge.
- Enter discount.
- Enter company claim amount or percentage.
- Enter final bill amount.
- Compare calculated total with final bill.
- Highlight mismatch.

### Screen 8: Payment Calculation

Purpose: calculate and review amount owed by each participant.

Features:

- Item-based calculation.
- Equal split option.
- Farewell meal calculation for one or more non-paying honorees.
- Proportional tax/service allocation.
- Company claim allocation by fixed amount or percentage.
- Manual override per participant.
- Payment status tracking.
- Export payment Excel.

### Screen 9: Payment Requests

Purpose: generate messages for participants.

Features:

- Copy message for each participant.
- Select participants with checkboxes, including a select-all / select-none toggle.
- Copy all selected messages at once (each labelled with name, amount, and mobile number).
- WhatsApp share link per participant (free `wa.me` click-to-chat; the organizer taps Send).
- Send to selected participants via WhatsApp as a guided sequential flow: the app opens each selected chat one at a time and tracks which have been opened/sent.
- Use participant mobile number to prepare direct WhatsApp/contact actions.
- Mark as paid (individually, or mark all selected as paid).
- Track pending payments.

## 9. Data Model

These are the API/domain object shapes the `/api` layer exchanges with the UI: **camelCase JSON with integer cents** for money (RM 9.50 = `950` sen). Each maps one-to-one to the snake_case columns in the Section 16 schema (for example `subtotalCents` maps to `subtotal_cents`, `mealSessionId` to `meal_session_id`). All 12 core tables are represented; `order_items` appears as the `items` array inside Participant Order.

### User

```
{
  "id": "user_001",
  "authProvider": "google",
  "providerUserId": "google_123456789",
  "email": "organizer@example.com",
  "displayName": "Wei Ming",
  "mobileNumber": "0123456789",
  "photoUrl": "https://example.com/profile.jpg",
  "preferredLanguage": "en",
  "createdAt": "2026-06-24T19:00:00Z",
  "updatedAt": "2026-06-24T19:00:00Z"
}
```

### Meal Session

```
{
  "id": "meal_001",
  "ownerUserId": "user_001",
  "title": "Friday Team Lunch",
  "mealType": "lunch",
  "occasionType": "farewell",
  "farewellEnabled": true,
  "restaurantName": "ABC Chicken Rice",
  "menuUrl": "https://example.com/menu",
  "mealDateTime": "2026-06-26T12:30:00+08:00",
  "seatDetails": "Table for 5, indoor",
  "organizerName": "Wei Ming",
  "organizerContact": "0123456789",
  "status": "draft",
  "reminderEnabled": true,
  "reminderLeadMinutes": 120,
  "remindAt": "2026-06-26T02:30:00Z",
  "reminderSentAt": null,
  "createdAt": "2026-06-24T19:00:00Z",
  "updatedAt": "2026-06-24T19:00:00Z"
}
```

### Payment Method

The organizer's receiving methods (one or more per session). A `duitnow_qr` method references an Uploaded File.

```
{
  "id": "pm_001",
  "mealSessionId": "meal_001",
  "methodType": "bank_account",
  "accountName": "Tan Wei Ming",
  "bankName": "Maybank",
  "accountNumber": "1234567890",
  "duitNowId": null,
  "qrImageFileId": null,
  "instructions": "Please include the meal reference when transferring.",
  "isDefault": true,
  "sortOrder": 0
}
```

`methodType` is one of `bank_account`, `duitnow_id`, `duitnow_qr`, or `custom`. A `duitnow_qr` method sets `qrImageFileId` to an Uploaded File id.

### User Payment Method

Account-level saved payment methods (Screen 2B), keyed by `userId` instead of a meal session. When the owner creates a meal session, these are copied into that session's Payment Methods (prefill). Same fields and `methodType` values as Payment Method.

```
{
  "id": "upm_001",
  "userId": "user_001",
  "methodType": "duitnow_id",
  "accountName": "Tan Wei Ming",
  "bankName": "Maybank",
  "accountNumber": "1234567890",
  "duitNowId": "0123456789",
  "qrImageFileId": "file_001",
  "instructions": "Please include the meal reference when transferring.",
  "isDefault": true,
  "sortOrder": 0
}
```

### Uploaded File

Metadata for files in Vercel Blob (DuitNow QR, menu images, exports). The bytes live in Blob; only the URL and metadata are stored in Turso.

```
{
  "id": "file_001",
  "ownerUserId": "user_001",
  "mealSessionId": "meal_001",
  "fileKind": "duitnow_qr",
  "blobUrl": "https://blob.vercel-storage.com/duitnow-qr-abc123.png",
  "blobPathname": "meal_001/duitnow-qr-abc123.png",
  "contentType": "image/png",
  "sizeBytes": 48213,
  "originalFilename": "my-duitnow-qr.png",
  "createdAt": "2026-06-24T19:05:00Z"
}
```

### Menu Item

```
{
  "id": "item_001",
  "mealSessionId": "meal_001",
  "itemCode": "A01",
  "name": "Chicken Rice",
  "category": "Main",
  "description": "Roasted chicken with rice",
  "estimatedPriceCents": 950,
  "actualPriceCents": 1000,
  "imageUrl": null,
  "menuUrl": null,
  "available": true,
  "sortOrder": 0
}
```

### Participant Order

```
{
  "id": "order_001",
  "mealSessionId": "meal_001",
  "participantUserId": null,
  "participantName": "Alice",
  "participantRole": "paying_participant",
  "mobileNumber": "0123456789",
  "items": [
    {
      "id": "oi_001",
      "menuItemId": "item_001",
      "quantity": 1,
      "remarks": "No cucumber"
    }
  ],
  "submittedAt": "2026-06-24T19:00:00Z"
}
```

### Bill Adjustment

```
{
  "id": "bill_001",
  "mealSessionId": "meal_001",
  "calculationMode": "farewell",
  "includeOrganizerInSplit": true,
  "taxAmountCents": 600,
  "serviceChargeAmountCents": 1000,
  "discountAmountCents": 0,
  "companyClaimType": "percentage",
  "companyClaimPercent": 25.0,
  "companyClaimAmountCents": 2900,
  "taxAllocationMethod": "proportional",
  "serviceChargeAllocationMethod": "proportional",
  "discountAllocationMethod": "proportional",
  "companyClaimAllocationMethod": "proportional",
  "farewellCostAllocationMethod": "equal_paying_participants",
  "roundingAdjustmentCents": 0,
  "finalBillAmountCents": 11600
}
```

### Payment Result

```
{
  "id": "pr_001",
  "mealSessionId": "meal_001",
  "participantOrderId": "order_001",
  "participantName": "Alice",
  "mobileNumber": "0123456789",
  "participantRole": "paying_participant",
  "subtotalCents": 1400,
  "taxCents": 120,
  "serviceChargeCents": 200,
  "discountCents": 0,
  "companyClaimCents": 350,
  "farewellSponsoredShareCents": 400,
  "roundingAdjustmentCents": 0,
  "totalDueCents": 1770,
  "isManualOverride": false,
  "paymentStatus": "pending",
  "paymentMethodId": null,
  "paymentReference": "Friday Team Lunch - Alice",
  "paidAt": null
}
```

### Payment Status Event

Audit log of payment and post-finalize changes.

```
{
  "id": "evt_001",
  "mealSessionId": "meal_001",
  "paymentResultId": "pr_001",
  "eventType": "marked_paid",
  "fromStatus": "pending",
  "toStatus": "paid",
  "amountCents": 1770,
  "note": null,
  "createdByUserId": "user_001",
  "createdAt": "2026-06-26T15:00:00Z"
}
```

### Push Subscription

A Web Push subscription for one of the organizer's devices (Android/desktop), used to deliver order reminders.

```
{
  "id": "push_001",
  "userId": "user_001",
  "endpoint": "https://fcm.googleapis.com/fcm/send/abc123...",
  "p256dh": "BNc...",
  "auth": "k9x...",
  "userAgent": "Chrome on Android",
  "createdAt": "2026-06-24T19:10:00Z"
}
```

## 10. App States

### Draft

Meal session is being prepared. Menu and setup can be edited.

### Collecting Orders

Participants can submit or update orders.

### Finalized

Orders are locked and ready to send to the restaurant.

### Bill Entered

Actual prices, tax, service charge, and final bill have been entered.

### Company Claim Applied

A company claim or subsidy has been entered and allocated against participant payment amounts.

### Payment Requested

Payment messages have been generated and sent.

### Closed

All participants have paid or the organizer manually closes the session.

## 11. Validation Rules

### Authentication

- User must be signed in with Google or Facebook before accessing organizer screens.
- Google and Facebook are the only allowed login methods.
- No other authentication methods are allowed.
- User profile identifier must be available from the selected auth provider.
- Meal sessions must be linked to the authenticated user.
- Sign-out should clear protected local app state from the current session view.

### Language

- Default language must be English.
- Supported language codes should include `en`, `zh`, and `ms`.
- User can change language from the landing page before login and at any time after login.
- Before login, the selected language must be saved as a local user preference; after login, it must be saved to the user profile.
- Missing translations must fall back to English.
- User-entered content must not be auto-translated.

### Meal Setup

- Meal title is required.
- Restaurant name is required.
- Meal date/time is required before finalizing.
- At least one organizer receiving payment method is required before generating payment requests.
- Saved profile payment methods (Payment Defaults) follow the same field rules and can be prefilled to satisfy this requirement.
- If order reminders are enabled, meal date/time is required and the reminder lead time must be zero or greater; the reminder fires only while the session is still in draft or collecting-orders.
- Email reminders require an email on the organizer's profile; if absent, fall back to Web Push, and warn if no channel is available.
- DuitNow QR image must be PNG, JPG, JPEG, or WebP.
- DuitNow QR image should be previewed after upload so the organizer can confirm it is readable.

### Menu

- Item name is required.
- Estimated price and actual price must be zero or greater.
- Actual price is required before final payment calculation.

### Profile

- Display name defaults from the auth provider and is editable; it must not be empty after editing.
- Profile mobile number is optional but, if provided, must use a supported Malaysian format (`0123456789`, `60123456789`, `+60123456789`) and is normalized for WhatsApp/contact links.

### Orders

- Participant name is required.
- Participant mobile number is required by default.
- Mobile number should support Malaysian formats such as `0123456789`, `60123456789`, and `+60123456789`.
- Mobile number should be normalized for WhatsApp/contact links where practical.
- Each order must have at least one item.
- Quantity must be greater than zero.
- Unavailable items cannot be selected.

### Bill

- Tax, service charge, discount, and company claim must be zero or greater.
- Company claim percentage must be between 0 and 100.
- Company claim amount cannot exceed the eligible amount selected by the organizer unless manually confirmed.
- Farewell meal mode must have at least one farewell honoree and at least one paying participant.
- Farewell honorees must have total due equal to zero.
- Farewell honoree meal cost must be fully allocated to paying participants unless the organizer manually excludes part of it.
- Final bill amount should match calculated total after adjustments.
- If there is a mismatch, the app should show a warning and allow organizer confirmation.

## 12. MVP Scope

The first version should include Google and Facebook authentication with a simple organizer workflow.

Included:

- Google login as the default landing page action.
- Facebook as a standard secondary login method.
- Authenticated meal sessions owned by the signed-in user.
- Language switching from the landing page and after login, with English default plus Chinese and Malay support.
- Create one meal session.
- Add menu items manually.
- Import menu from Excel.
- Collect participant orders with name, mobile number, selected items, quantity, and remarks.
- Review grouped restaurant order.
- Export restaurant order Excel.
- Enter actual item prices.
- Enter tax/service/discount.
- Enter company claim or subsidy by fixed amount or percentage.
- Support farewell meal mode with one or more non-paying honorees.
- Calculate amount owed by participant.
- Configure bank account, DuitNow ID, and DuitNow QR image as receiving payment methods.
- Account profile with editable name and mobile number that pre-fill the organizer's meal setup and the user's own order form.
- Save reusable payment methods on the account profile (Payment Defaults) that auto-prefill into each new meal session.
- Remind the organizer to submit the order before meal time, by email and Web Push, scheduled via a free GitHub Actions cron.
- Generate copyable payment messages.
- Export payment calculation Excel.
- Store application data in Turso.
- Deliver the web app as an app-like, mobile-first experience: an installable PWA on Android and desktop, and a responsive in-browser web app on iOS (including in-app browsers such as WhatsApp).

Not included in MVP:

- Real online invite links.
- Multi-device real-time collaboration.
- Payment gateway integration.
- Automatic bank transfer detection.
- Restaurant-side portal.
- OCR extraction from menu images.

## 13. Recommended Future Enhancements

### Shareable Participant Link

Allow organizer to send a link so participants can submit from their own phones.

### Multi-Device Access

Turso is already the MVP database (Section 14). The future enhancement is broader multi-device use: letting the organizer sign in from any device to access saved meals, payment settings, orders, and calculation history, plus real-time multi-device collaboration.

### Menu Image OCR

Extract menu item names and prices from uploaded images.

### Payment QR Improvements

Validate uploaded DuitNow QR images, allow multiple QR images, and optionally generate QR codes for supported payment schemes if official specifications and compliance requirements are available.

### Payment Status Dashboard

Track who has paid, who is pending, and total collected.

### WhatsApp Integration

Automated WhatsApp sending via the **WhatsApp Business / Cloud API** — true one-click delivery to many participants at once, without the organizer tapping Send per chat. This is paid (per-message pricing) and requires business verification and pre-approved message templates, so it is a future option only. The MVP instead uses the free `wa.me` click-to-chat link (organizer taps Send), which already delivers participant-specific messages over WhatsApp at no cost.

### Multi-Currency Support

Support RM, SGD, USD, and other currencies.

### Additional Translation Management

Add admin tooling or translation files for more languages, region-specific terminology, and review workflows for generated payment message wording.

## 14. Suggested Technical Approach

### MVP Frontend

- Flutter web.
- Dart.
- Google authentication as the default login method.
- Facebook as a secondary login method.
- Authentication implemented in-app with **server-side token verification** in the `/api` layer (Section 15): the browser obtains a Google ID token or Facebook access token client-side and POSTs it to `POST /api/auth/login`, which verifies it server-side (Google JWKS with issuer/audience checks via `jose`; Facebook Graph `debug_token`), upserts the user, and issues a signed **httpOnly session cookie**. No provider secret reaches the browser. (This replaces the earlier Auth.js plan, which suits a server-rendered framework more than a Flutter SPA.)
- Flutter localization using `flutter_localizations`, `intl`, and ARB translation files.
- Turso database for persistent app data.
- Excel import parsing and export generation run in the `/api` (TypeScript) layer (for example `exceljs`), not in Flutter. The Flutter UI only picks/uploads the source file and downloads the generated workbook.
- File picker and image upload support for menu files and DuitNow QR images.
- A service worker and Web Push opt-in flow for order reminders (Android and desktop browsers; not iOS).
- Clean responsive UI for desktop and mobile.

### Database

The app will use Turso as the primary database.

Recommended approach:

- Use Turso/libSQL for relational data storage.
- Access Turso through a backend API layer instead of calling the database directly from Flutter web.
- Keep Turso database URL and auth token on the server side.
- Store the authenticated provider user ID on user-owned records for access control.
- Use migrations for schema changes.

Core tables:

- `users`
- `meal_sessions`
- `menu_items`
- `participant_orders`
- `order_items`
- `bill_adjustments`
- `payment_methods`
- `payment_results`
- `payment_status_events`
- `uploaded_files`
- `user_payment_methods`
- `push_subscriptions`

DuitNow QR images and menu images should not be stored directly as large binary database values unless intentionally supported. Recommended approach:

- Store uploaded images in object/file storage (Vercel Blob).
- Store file metadata and public/private URLs in Turso.
- Link the uploaded QR image to the organizer's payment method record.

### Target Platform

The app should be built with Flutter as a web app first. The UI and business logic should be structured so it can later be reused for Android or iOS if needed.

The first release targets **web only**, and it should feel app-like on phones. Ship it as an **installable Progressive Web App (PWA) on Android and desktop**: a web app manifest with `display: standalone` so it can be added to the home screen and run full-screen; a mobile-first, responsive, touch-friendly layout; and app-style navigation, transitions, and safe-area handling. On **iOS there is no PWA or home-screen install** — iOS users run the same responsive web app in Safari and in in-app browsers (for example when opened from a WhatsApp link), which must stay fully functional. Native Android/iOS builds remain a future option on the same codebase.

Recommended Flutter structure:

- `lib/features/auth` for Google and Facebook login and session handling.
- `lib/features/meals` for meal sessions.
- `lib/features/menu` for menu import and management.
- `lib/features/orders` for participant order entry.
- `lib/features/billing` for price entry and calculations.
- `lib/features/payments` for payment methods, DuitNow details, QR image handling, payment messages, and payment status.
- `lib/features/settings` for language preference and user settings.
- `lib/l10n` for English, Chinese, and Malay translation resources.
- `lib/shared` for reusable widgets, formatters, validators, and Excel utilities.

Recommended locale files:

- `app_en.arb` for English.
- `app_zh.arb` for Chinese.
- `app_ms.arb` for Malay.

The first build should use English source keys and provide translated strings for common app flows:

- Authentication and sign-out.
- Meal setup.
- Menu management.
- Order form.
- Bill calculation.
- Company claim/subsidy.
- Payment methods.
- Payment request messages.
- Validation and error states.

### Backend

- API layer co-located in the same Vercel app as the Flutter web UI (one repo, one project, one domain), implemented as TypeScript serverless functions under `/api`. It is the only layer that holds secrets and accesses Turso.
- Turso/libSQL database access.
- Social auth token verification for Google and Facebook.
- Authorization checks for user-owned meal sessions.
- (Future, build Phase 4) Public participant order links — not in the MVP, per the Section 19 decisions.
- Cloud file export.
- Scheduled order-submission reminders: a free **GitHub Actions scheduled workflow** calls a server endpoint (`POST /api/cron/reminders`, authenticated with `CRON_SECRET`) that sends **email** (via a transactional email service such as Resend) and **Web Push** (VAPID + the `web-push` library) to the organizer before the meal time. GitHub Actions cron is used instead of Vercel Cron, which needs a paid plan for sub-daily schedules.
- Hosting, configuration profiles, and CI/CD deployment to Vercel: see Section 15.

### Why Start With Authentication

The app should begin with social authentication because meal sessions contain personal names, payment details, and order history. Google should be the default login method, with Facebook also available. Signing in also allows future sessions to be tied to the organizer instead of being treated as temporary browser data.

### Why Keep the First Build Simple

Even with social login, the first version should still keep the ordering and calculation workflow simple. This allows fast validation of:

- Whether the order form is clear.
- Whether Excel import/export columns are correct.
- Whether calculation rules match real meal scenarios.
- Whether payment messages are useful.

Once the flow is proven, cloud sharing and multi-device participant links can be added.

## 15. Configuration, Local Setup, and Deployment

### Single-App Architecture

MakanKira is built and deployed as **one app**: a single GitHub repository, a single Vercel project, and a single domain. The Flutter web UI and a thin server-side API are bundled and deployed **together** — there is no separately hosted backend to run or manage.

Inside that single app there are two layers separated by a strict security boundary:

- **Browser layer (Flutter web):** the UI compiled to static assets. It holds **only public values** (API base URL, OAuth client/app IDs, default locale). Everything here is visible to anyone, so no secret is ever placed in it.
- **Server layer (`/api` serverless functions, same Vercel project and domain):** the only place that holds **secrets** and the only place that talks to Turso. It performs database access, social-login token verification, and file storage. Secrets live only in this layer's runtime environment and are never sent to the browser.

Because both layers share one domain, the UI calls the API on the same origin (for example `https://makankira.vercel.app/api/...`), so there is no separate service and no cross-origin setup.

Runtime note: Vercel does not execute Dart serverless functions, so the `/api` layer is implemented in **TypeScript / Node.js** with the libSQL/Turso client. This is an internal implementation detail of the same app, not a second app to deploy.

Single repository layout (one app):

```
makankira/
  lib/                 # Flutter web UI (Dart) - browser layer, public values only
  api/                 # serverless API (TypeScript) - server layer, holds secrets, talks to Turso
  config/              # profile-based config (see below)
  scripts/             # Node helper scripts: load-config, migrate, deploy (cross-platform)
  vercel.json          # serves build/web and exposes /api on the same domain
  pubspec.yaml         # Flutter project
  package.json         # API and tooling
```

### Hosting and Deployment Overview

- Source code is hosted on **GitHub** as a single repository containing both the UI (`lib/`) and the server layer (`api/`).
- CI/CD (**GitHub Actions**) builds and deploys the whole app to **Vercel** on every push.
- The Flutter web UI compiles to static assets; the `/api` functions deploy alongside them in the same Vercel project and domain.
- All environment and secret values are stored as **GitHub repository secrets** and injected by the CI/CD pipeline. For **local development and testing, the developer configures these values manually**.

### Configuration Strategy (Profile-Based, Spring Boot Style)

Configuration follows a profile model similar to Spring Boot's `application.yml` + `spring.profiles.active`:

- One **master file** declares the active profile and shared, non-secret defaults.
- One file **per profile** (`local`, `staging`, `production`) holds the full configuration for that environment.
- Secrets are **never hardcoded**. They appear as `${ENV_VAR}` placeholders (Spring Boot style) and are resolved from environment variables at load time — provided manually in local development and from GitHub repository secrets in CI/CD.

Profiles: `local`, `staging`, `production`.

File layout:

```
config/
  app-config.yaml                 # MASTER: selects active profile + shared non-secret defaults
  app-config.local.yaml           # local profile values (committed; secrets via ${...})
  app-config.staging.yaml         # staging profile values (committed; secrets via ${...})
  app-config.production.yaml      # production profile values (committed; secrets via ${...})
  secrets.local.example           # TEMPLATE listing required secret env vars (committed)
  secrets.local                   # actual local secret values (GIT-IGNORED; developer fills in)
```

Master file, which selects the profile and is the single switch between environments:

```
# config/app-config.yaml
# Active profile. Defaults to "local". CI/CD overrides it via the APP_PROFILE env var.
activeProfile: ${APP_PROFILE:local}     # local | staging | production

# Shared, non-secret defaults (overridable per profile)
app:
  name: MakanKira
  defaultLocale: en
  supportedLocales: [en, zh, ms]
```

Per-profile file, using literal values for non-secrets and `${...}` placeholders for secrets:

```
# config/app-config.local.yaml
frontend:                                  # PUBLIC values compiled into the web app
  apiBaseUrl: "http://localhost:3000/api"
  googleOAuthClientId: ${GOOGLE_OAUTH_CLIENT_ID}
  facebookAppId: ${FACEBOOK_APP_ID}
  vapidPublicKey: ${VAPID_PUBLIC_KEY}        # Web Push public key (safe to ship)
backend:                                   # SECRET values, server-side only
  tursoDatabaseUrl: ${TURSO_DATABASE_URL}
  tursoAuthToken: ${TURSO_AUTH_TOKEN}
  facebookAppSecret: ${FACEBOOK_APP_SECRET}
  sessionSecret: ${SESSION_SECRET}
  fileStorageToken: ${BLOB_READ_WRITE_TOKEN}   # Vercel Blob token for QR/menu images
  resendApiKey: ${RESEND_API_KEY}              # transactional email (order reminders)
  vapidPrivateKey: ${VAPID_PRIVATE_KEY}        # Web Push private key
  vapidSubject: "mailto:reminders@makankira.app"   # Web Push contact (non-secret)
  cronSecret: ${CRON_SECRET}                   # protects the reminder cron endpoint
```

`config/app-config.production.yaml` has the same shape; only the non-secret literals differ. In staging and production, set `apiBaseUrl` to the **same-origin relative path `/api`** so Vercel preview URLs and any domain change keep working; the absolute `http://localhost:3000/api` in the local profile is needed only because the dev API runs on a separate port. All secret placeholders stay identical and are filled from GitHub secrets in CI/CD.

### Public vs Secret Values (Critical)

**Flutter web ships to the browser, so anything compiled into the frontend is publicly visible.** Therefore:

- **Frontend (public) config** may contain only non-secret values: API base URL, OAuth **client/app IDs**, default locale, feature flags.
- **Backend (secret) config** holds everything sensitive: Turso URL and auth token, OAuth **client secrets**, session/JWT secret, object-storage tokens. These live only in the API layer's runtime environment and are never sent to the browser.

| **Config key** | **Scope** | **Secret** | **Local source** | **CI/CD source** |
| --- | --- | --- | --- | --- |
| `apiBaseUrl` | Frontend | No | `app-config.local.yaml` | per-profile file |
| `googleOAuthClientId` | Frontend | No (public) | `secrets.local` | GitHub secret |
| `facebookAppId` | Frontend | No (public) | `secrets.local` | GitHub secret |
| `tursoDatabaseUrl` | Backend | Yes | `secrets.local` | GitHub secret to Vercel env |
| `tursoAuthToken` | Backend | Yes | `secrets.local` | GitHub secret to Vercel env |
| `facebookAppSecret` | Backend | Yes | `secrets.local` | GitHub secret to Vercel env |
| `sessionSecret` | Backend | Yes | `secrets.local` | GitHub secret to Vercel env |
| `fileStorageToken` (QR/menu images) | Backend | Yes | `secrets.local` | GitHub secret to Vercel env |
| `vapidPublicKey` | Frontend | No (public) | `secrets.local` | GitHub secret |
| `resendApiKey` | Backend | Yes | `secrets.local` | GitHub secret to Vercel env |
| `vapidPrivateKey` | Backend | Yes | `secrets.local` | GitHub secret to Vercel env |
| `cronSecret` | Backend | Yes | `secrets.local` | GitHub secret to Vercel env |

### Where to Change Config for Local Development

This is the only place a developer edits for local runs:

1. Leave `activeProfile` as `local` in `config/app-config.yaml` (or set `APP_PROFILE=local`). This is the **only switch** that selects which environment loads.

2. Edit **`config/app-config.local.yaml`** for non-secret local values (for example, point `apiBaseUrl` at your local API).

3. Copy **`config/secrets.local.example` to `config/secrets.local`** and fill in your own development secrets (your own Turso dev database token and your own Google and Facebook (Meta) developer-app credentials). **`config/secrets.local` is git-ignored — never commit it.**

`.gitignore` must include:

```
config/secrets.local
config/secrets.*.local
config/frontend.*.json
.env
.env.*
.vercel
```

Only the `*.example` templates and the non-secret per-profile YAML files are committed.

### Local Setup and Run

Prerequisites:

- Flutter SDK with web support enabled (`flutter config --enable-web`).
- Node.js (for the API layer and the Vercel CLI).
- A Turso development database (URL + auth token).
- Your own OAuth development credentials for Google and Facebook.

Steps:

```
# 1. Install dependencies
flutter pub get
npm install            # in the API layer folder, e.g. /api

# 2. Configure local secrets (one-time)
cp config/secrets.local.example config/secrets.local
#    then edit config/secrets.local and fill in your dev values

# 3. Resolve the active profile into build artifacts.
#    Reads config/app-config.yaml + app-config.<profile>.yaml, resolves ${...},
#    writes config/frontend.<profile>.json (public) and exports backend env vars.
node scripts/load-config.mjs        # thin helper to implement during the build phase

# 4. Run the backend API locally (serves /api on http://localhost:3000)
vercel dev                      # or: npm run dev   (in the API folder)

# 5. Run the Flutter web app with the resolved public config
flutter run -d chrome --dart-define-from-file=config/frontend.local.json
```

Notes:

- `--dart-define-from-file` is Flutter's mechanism for injecting build-time config; the helper script bridges the master YAML to the JSON file Flutter expects.
- The backend reads its secret config from the environment (`config/secrets.local` exported into the shell, or a `.env` consumed by `vercel dev`).

### CI/CD: GitHub to Vercel

Recommended approach: **GitHub Actions builds and deploys via the Vercel CLI**, with all values stored as **GitHub repository secrets**. This matches the requirement that config values are retrieved from GitHub secrets.

Setup:

1. In GitHub: **Settings > Secrets and variables > Actions** — add every secret listed below. Optionally use **GitHub Environments** (`production`, `staging`) to scope and protect secrets.

2. The workflow selects the profile from the branch (`main` to `production`, others to `staging`), injects the matching GitHub secrets as env vars, builds, and deploys.

3. Because the API runs on Vercel, **runtime** secrets must also exist in the **Vercel project environment** (per environment). The pipeline syncs them from GitHub secrets, or you set them once in Vercel Project Settings > Environment Variables.

Required GitHub repository secrets:

```
# App - backend (secret, runtime)
TURSO_DATABASE_URL
TURSO_AUTH_TOKEN
FACEBOOK_APP_SECRET
SESSION_SECRET
BLOB_READ_WRITE_TOKEN            # Vercel Blob storage token
RESEND_API_KEY                   # transactional email (order reminders)
VAPID_PRIVATE_KEY                # Web Push private key
CRON_SECRET                      # protects the reminder cron endpoint

# App - frontend (public IDs, still centralized as secrets)
GOOGLE_OAUTH_CLIENT_ID
FACEBOOK_APP_ID
VAPID_PUBLIC_KEY                 # Web Push public key

# Vercel deployment
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID
```

Illustrative workflow (`.github/workflows/deploy.yml`); finalize exact steps during implementation:

```
name: Deploy to Vercel
on:
  push:
    branches: [main]          # production
  pull_request:                # staging / preview

jobs:
  deploy:
    runs-on: ubuntu-latest
    env:
      APP_PROFILE: ${{ github.ref == 'refs/heads/main' && 'production' || 'staging' }}
      # public (frontend build) values
      GOOGLE_OAUTH_CLIENT_ID: ${{ secrets.GOOGLE_OAUTH_CLIENT_ID }}
      FACEBOOK_APP_ID: ${{ secrets.FACEBOOK_APP_ID }}
      VAPID_PUBLIC_KEY: ${{ secrets.VAPID_PUBLIC_KEY }}
      # secret (backend) values
      TURSO_DATABASE_URL: ${{ secrets.TURSO_DATABASE_URL }}
      TURSO_AUTH_TOKEN: ${{ secrets.TURSO_AUTH_TOKEN }}
      FACEBOOK_APP_SECRET: ${{ secrets.FACEBOOK_APP_SECRET }}
      SESSION_SECRET: ${{ secrets.SESSION_SECRET }}
      BLOB_READ_WRITE_TOKEN: ${{ secrets.BLOB_READ_WRITE_TOKEN }}
      RESEND_API_KEY: ${{ secrets.RESEND_API_KEY }}
      VAPID_PRIVATE_KEY: ${{ secrets.VAPID_PRIVATE_KEY }}
      CRON_SECRET: ${{ secrets.CRON_SECRET }}
    steps:
      - uses: actions/checkout@v4
      - uses: subosito/flutter-action@v2
        with:
          channel: stable
      - name: Resolve profile config
        run: node scripts/load-config.mjs        # writes config/frontend.$APP_PROFILE.json from master + profile yaml
      - name: Build Flutter web (public config only)
        run: flutter build web --release --dart-define-from-file=config/frontend.${APP_PROFILE}.json
      - name: Install Vercel CLI
        run: npm i -g vercel
      - name: Sync runtime secrets to Vercel (per environment)
        run: node scripts/sync-vercel-env.mjs     # idempotent "vercel env add" for each backend secret
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
      - name: Deploy to Vercel
        # exact flags (--prebuilt vs. letting Vercel serve build/web) finalized during implementation
        run: vercel deploy ${{ github.ref == 'refs/heads/main' && '--prod' || '' }} --token "$VERCEL_TOKEN"
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
```

Minimal `vercel.json` to serve the built web app and expose the API:

```
{
  "outputDirectory": "build/web",
  "functions": { "api/**/*.ts": { "runtime": "nodejs20.x" } },
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/$1" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

Alternative (simpler) approach: connect the GitHub repo to **Vercel's native Git integration** and store values in **Vercel Project Environment Variables**. This requires a custom build step to install the Flutter SDK on Vercel and does not use GitHub secrets, so it is noted only as an option.

### Scheduled Reminders (free cron via GitHub Actions)

Order-submission reminders are triggered by a free **GitHub Actions scheduled workflow** — not Vercel Cron, whose sub-daily schedules require a paid plan. The workflow calls the deployed reminder endpoint on a schedule; the endpoint then finds due sessions and sends the email + Web Push.

```
# .github/workflows/reminders.yml
name: Order reminders
on:
  schedule:
    - cron: "*/15 * * * *"   # every ~15 min (GitHub may delay under load)
  workflow_dispatch: {}        # allow manual trigger
jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger reminder run
        run: curl -fsS -X POST "$APP_BASE_URL/api/cron/reminders" -H "Authorization: Bearer $CRON_SECRET"
        env:
          APP_BASE_URL: ${{ vars.APP_BASE_URL }}     # production origin, non-secret repo variable
          CRON_SECRET: ${{ secrets.CRON_SECRET }}
```

The endpoint verifies the `CRON_SECRET` bearer token, so only this workflow can trigger it. `APP_BASE_URL` is a non-secret GitHub Actions **variable** (Settings > Secrets and variables > Actions > Variables) set to the production origin. This keeps reminders entirely on free tiers.

### Decisions to Confirm

Decided:

- The app ships as a **single Vercel project** — the Flutter web UI plus a thin **TypeScript/Node.js** serverless API under `/api`, sharing one domain. Secrets live only in the `/api` runtime, never in the browser bundle.
- Object storage for DuitNow QR and menu images is **Vercel Blob**, keeping all storage inside the single Vercel app. Uploads go through the `/api` layer; only the resulting file URL and metadata are stored in Turso. The storage secret is `BLOB_READ_WRITE_TOKEN`.

Still open:

- Whether to commit `staging`/`production` non-secret YAML, or keep only `local` committed and generate the others in CI.

## 16. Database Schema and Migrations

This is the design-level schema for the 12 core tables from Section 14, written for **Turso / libSQL** (SQLite dialect). It is reached only through the `/api` server layer (Section 15); the browser never connects to Turso. Actual migration files and the runner are created when implementation starts.

### Conventions

- **Money is stored as `INTEGER` minor units (sen):** `RM 9.50` is `950`. This avoids floating-point rounding in proportional splits and matches the two-decimal rounding rules in Section 5. The API serializes these as `*_cents` integers; the Section 9 JSON shows major-unit values only for readability.
- **IDs are `TEXT`**, application-generated with a type prefix (for example `meal_` + a short unique id).
- **Timestamps are `TEXT`** in ISO-8601 UTC.
- **Booleans are `INTEGER` 0/1.**
- **Foreign keys require `PRAGMA foreign_keys = ON;`** set on every connection (libSQL does not persist it).
- **All amounts are Malaysian Ringgit (MYR);** multi-currency is a future enhancement.
- **`meal_date_time` is wall-clock Malaysian time (UTC+8);** store it with the `+08:00` offset rather than converting to UTC, so the displayed meal time matches what the organizer entered.

### Migration Strategy

- Plain, ordered SQL files under `migrations/` (`0001_init.sql`, `0002_*.sql`, ...), each ending by recording its version in a `schema_migrations` table.
- A small runner (`scripts/migrate.ts`, using `@libsql/client`) applies any file whose version is not yet in `schema_migrations`, inside a transaction.
- **Local:** `npm run migrate` reads `TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN` from the resolved `local` profile (Section 15).
- **CI/CD:** a migrate step runs against the target Turso database before the Vercel deploy, using the same values from GitHub repository secrets.
- Alternative for ad-hoc use: `turso db shell <db-name> < migrations/0001_init.sql`.

### Migration 0001_init (full DDL)

Tables are created in dependency-safe order; all 12 core tables plus a `schema_migrations` bookkeeping table are included.

```
-- migrations/0001_init.sql  (Turso / libSQL, SQLite dialect)

CREATE TABLE IF NOT EXISTS schema_migrations (
  version    TEXT PRIMARY KEY,
  applied_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);

-- users
CREATE TABLE users (
  id                 TEXT PRIMARY KEY,
  auth_provider      TEXT NOT NULL CHECK (auth_provider IN ('google','facebook')),
  provider_user_id   TEXT NOT NULL,
  email              TEXT,
  display_name       TEXT,
  mobile_number      TEXT,
  photo_url          TEXT,
  preferred_language TEXT NOT NULL DEFAULT 'en' CHECK (preferred_language IN ('en','zh','ms')),
  created_at         TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  updated_at         TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  UNIQUE (auth_provider, provider_user_id)
);

-- meal_sessions
CREATE TABLE meal_sessions (
  id                TEXT PRIMARY KEY,
  owner_user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title             TEXT NOT NULL,
  meal_type         TEXT CHECK (meal_type IN ('breakfast','lunch','dinner','supper','custom')),
  occasion_type     TEXT NOT NULL DEFAULT 'normal' CHECK (occasion_type IN ('normal','farewell')),
  farewell_enabled  INTEGER NOT NULL DEFAULT 0 CHECK (farewell_enabled IN (0,1)),
  restaurant_name   TEXT NOT NULL,
  menu_url          TEXT,
  meal_date_time    TEXT,
  seat_details      TEXT,
  organizer_name    TEXT,
  organizer_contact TEXT,
  status            TEXT NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft','collecting_orders','finalized','bill_entered',
                                      'company_claim_applied','payment_requested','closed')),
  reminder_enabled      INTEGER NOT NULL DEFAULT 1 CHECK (reminder_enabled IN (0,1)),
  reminder_lead_minutes INTEGER NOT NULL DEFAULT 120 CHECK (reminder_lead_minutes >= 0),
  remind_at             TEXT,    -- meal_date_time minus lead, in UTC; recomputed on create/update
  reminder_sent_at      TEXT,    -- set when the order reminder is sent (fire-once)
  created_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  updated_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);
CREATE INDEX idx_meal_sessions_owner  ON meal_sessions(owner_user_id);
CREATE INDEX idx_meal_sessions_remind ON meal_sessions(remind_at) WHERE reminder_sent_at IS NULL;
CREATE INDEX idx_meal_sessions_status ON meal_sessions(owner_user_id, status);

-- uploaded_files  (Vercel Blob metadata; raw bytes live in Blob, not in the DB)
CREATE TABLE uploaded_files (
  id                TEXT PRIMARY KEY,
  owner_user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  meal_session_id   TEXT REFERENCES meal_sessions(id) ON DELETE CASCADE,
  file_kind         TEXT NOT NULL CHECK (file_kind IN
                      ('duitnow_qr','menu_image','menu_excel','export_excel','export_csv','other')),
  blob_url          TEXT NOT NULL,
  blob_pathname     TEXT,
  content_type      TEXT,
  size_bytes        INTEGER,
  original_filename TEXT,
  created_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);
CREATE INDEX idx_files_owner ON uploaded_files(owner_user_id);
CREATE INDEX idx_files_meal  ON uploaded_files(meal_session_id);

-- user_payment_methods  (account-level saved receiving methods; prefilled into a session's payment_methods)
CREATE TABLE user_payment_methods (
  id               TEXT PRIMARY KEY,
  user_id          TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  method_type      TEXT NOT NULL CHECK (method_type IN ('bank_account','duitnow_id','duitnow_qr','custom')),
  account_name     TEXT,
  bank_name        TEXT,
  account_number   TEXT,
  duitnow_id       TEXT,
  qr_image_file_id TEXT REFERENCES uploaded_files(id) ON DELETE SET NULL,
  instructions     TEXT,
  is_default       INTEGER NOT NULL DEFAULT 0 CHECK (is_default IN (0,1)),
  sort_order       INTEGER NOT NULL DEFAULT 0,
  created_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  updated_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);
CREATE INDEX idx_user_payment_methods_user ON user_payment_methods(user_id);

-- menu_items
CREATE TABLE menu_items (
  id                    TEXT PRIMARY KEY,
  meal_session_id       TEXT NOT NULL REFERENCES meal_sessions(id) ON DELETE CASCADE,
  item_code             TEXT,
  name                  TEXT NOT NULL,
  category              TEXT,
  description           TEXT,
  estimated_price_cents INTEGER CHECK (estimated_price_cents IS NULL OR estimated_price_cents >= 0),
  actual_price_cents    INTEGER CHECK (actual_price_cents IS NULL OR actual_price_cents >= 0),
  image_url             TEXT,
  menu_url              TEXT,
  available             INTEGER NOT NULL DEFAULT 1 CHECK (available IN (0,1)),
  sort_order            INTEGER NOT NULL DEFAULT 0,
  created_at            TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  updated_at            TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);
CREATE INDEX idx_menu_items_meal ON menu_items(meal_session_id);

-- participant_orders
CREATE TABLE participant_orders (
  id                  TEXT PRIMARY KEY,
  meal_session_id     TEXT NOT NULL REFERENCES meal_sessions(id) ON DELETE CASCADE,
  participant_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,   -- future: participant sign-in
  participant_name    TEXT NOT NULL,
  participant_role    TEXT NOT NULL DEFAULT 'paying_participant'
                      CHECK (participant_role IN ('paying_participant','farewell_honoree')),
  mobile_number       TEXT,
  submitted_at        TEXT,
  created_at          TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  updated_at          TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);
CREATE INDEX idx_orders_meal ON participant_orders(meal_session_id);

-- order_items
CREATE TABLE order_items (
  id                   TEXT PRIMARY KEY,
  participant_order_id TEXT NOT NULL REFERENCES participant_orders(id) ON DELETE CASCADE,
  menu_item_id         TEXT NOT NULL REFERENCES menu_items(id) ON DELETE RESTRICT,
  quantity             INTEGER NOT NULL CHECK (quantity > 0),
  remarks              TEXT,
  created_at           TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);
CREATE INDEX idx_order_items_order ON order_items(participant_order_id);
CREATE INDEX idx_order_items_item  ON order_items(menu_item_id);

-- bill_adjustments  (one row per meal session)
CREATE TABLE bill_adjustments (
  id                               TEXT PRIMARY KEY,
  meal_session_id                  TEXT NOT NULL UNIQUE REFERENCES meal_sessions(id) ON DELETE CASCADE,
  calculation_mode                 TEXT NOT NULL DEFAULT 'item_based'
                                   CHECK (calculation_mode IN ('item_based','equal_split','farewell')),
  include_organizer_in_split       INTEGER NOT NULL DEFAULT 1 CHECK (include_organizer_in_split IN (0,1)),
  tax_amount_cents                 INTEGER NOT NULL DEFAULT 0 CHECK (tax_amount_cents >= 0),
  service_charge_amount_cents      INTEGER NOT NULL DEFAULT 0 CHECK (service_charge_amount_cents >= 0),
  discount_amount_cents            INTEGER NOT NULL DEFAULT 0 CHECK (discount_amount_cents >= 0),
  company_claim_type               TEXT NOT NULL DEFAULT 'none'
                                   CHECK (company_claim_type IN ('none','fixed','percentage')),
  company_claim_percent            REAL CHECK (company_claim_percent IS NULL
                                     OR (company_claim_percent >= 0 AND company_claim_percent <= 100)),
  company_claim_amount_cents       INTEGER NOT NULL DEFAULT 0 CHECK (company_claim_amount_cents >= 0),
  tax_allocation_method            TEXT NOT NULL DEFAULT 'proportional'
                                   CHECK (tax_allocation_method IN ('proportional','equal','manual')),
  service_charge_allocation_method TEXT NOT NULL DEFAULT 'proportional'
                                   CHECK (service_charge_allocation_method IN ('proportional','equal','manual')),
  discount_allocation_method       TEXT NOT NULL DEFAULT 'proportional'
                                   CHECK (discount_allocation_method IN
                                     ('proportional','equal','organizer_only','selected_participants','manual')),
  company_claim_allocation_method  TEXT NOT NULL DEFAULT 'proportional'
                                   CHECK (company_claim_allocation_method IN
                                     ('proportional','equal','selected_participants','manual')),
  farewell_cost_allocation_method  TEXT NOT NULL DEFAULT 'equal_paying_participants'
                                   CHECK (farewell_cost_allocation_method IN
                                     ('equal_paying_participants','proportional_paying_participants','manual')),
  rounding_adjustment_cents        INTEGER NOT NULL DEFAULT 0,            -- may be negative
  final_bill_amount_cents          INTEGER CHECK (final_bill_amount_cents IS NULL OR final_bill_amount_cents >= 0),
  created_at                       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  updated_at                       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);

-- payment_methods  (one or more receiving methods per meal session)
CREATE TABLE payment_methods (
  id               TEXT PRIMARY KEY,
  meal_session_id  TEXT NOT NULL REFERENCES meal_sessions(id) ON DELETE CASCADE,
  method_type      TEXT NOT NULL CHECK (method_type IN ('bank_account','duitnow_id','duitnow_qr','custom')),
  account_name     TEXT,
  bank_name        TEXT,
  account_number   TEXT,
  duitnow_id       TEXT,
  qr_image_file_id TEXT REFERENCES uploaded_files(id) ON DELETE SET NULL,
  instructions     TEXT,
  is_default       INTEGER NOT NULL DEFAULT 0 CHECK (is_default IN (0,1)),
  sort_order       INTEGER NOT NULL DEFAULT 0,
  created_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  updated_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);
CREATE INDEX idx_payment_methods_meal ON payment_methods(meal_session_id);

-- payment_results  (one computed row per participant per session)
CREATE TABLE payment_results (
  id                             TEXT PRIMARY KEY,
  meal_session_id                TEXT NOT NULL REFERENCES meal_sessions(id) ON DELETE CASCADE,
  participant_order_id           TEXT REFERENCES participant_orders(id) ON DELETE CASCADE,
  participant_name               TEXT NOT NULL,
  mobile_number                  TEXT,
  participant_role               TEXT NOT NULL DEFAULT 'paying_participant'
                                 CHECK (participant_role IN ('paying_participant','farewell_honoree')),
  subtotal_cents                 INTEGER NOT NULL DEFAULT 0,
  tax_cents                      INTEGER NOT NULL DEFAULT 0,
  service_charge_cents           INTEGER NOT NULL DEFAULT 0,
  discount_cents                 INTEGER NOT NULL DEFAULT 0,
  company_claim_cents            INTEGER NOT NULL DEFAULT 0,
  farewell_sponsored_share_cents INTEGER NOT NULL DEFAULT 0,
  rounding_adjustment_cents      INTEGER NOT NULL DEFAULT 0,
  total_due_cents                INTEGER NOT NULL DEFAULT 0,
  is_manual_override             INTEGER NOT NULL DEFAULT 0 CHECK (is_manual_override IN (0,1)),
  payment_status                 TEXT NOT NULL DEFAULT 'pending'
                                 CHECK (payment_status IN ('pending','paid','waived','cancelled')),
  payment_method_id              TEXT REFERENCES payment_methods(id) ON DELETE SET NULL,
  payment_reference              TEXT,
  paid_at                        TEXT,
  computed_at                    TEXT,
  created_at                     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  updated_at                     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);
CREATE INDEX idx_results_meal ON payment_results(meal_session_id);
CREATE UNIQUE INDEX idx_results_order ON payment_results(meal_session_id, participant_order_id);

-- payment_status_events  (audit log for payments and post-finalize edits)
CREATE TABLE payment_status_events (
  id                 TEXT PRIMARY KEY,
  meal_session_id    TEXT NOT NULL REFERENCES meal_sessions(id) ON DELETE CASCADE,
  payment_result_id  TEXT REFERENCES payment_results(id) ON DELETE CASCADE,
  event_type         TEXT NOT NULL CHECK (event_type IN
                       ('marked_paid','marked_pending','marked_waived','amount_overridden',
                        'reminder_sent','recalculated','order_edited_after_finalize','note')),
  from_status        TEXT,
  to_status          TEXT,
  amount_cents       INTEGER,
  note               TEXT,
  created_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at         TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);
CREATE INDEX idx_events_meal   ON payment_status_events(meal_session_id);
CREATE INDEX idx_events_result ON payment_status_events(payment_result_id);

-- push_subscriptions  (Web Push endpoints per user/device, for order reminders)
CREATE TABLE push_subscriptions (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint     TEXT NOT NULL,
  p256dh       TEXT NOT NULL,
  auth         TEXT NOT NULL,
  user_agent   TEXT,
  created_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  UNIQUE (user_id, endpoint)
);
CREATE INDEX idx_push_subscriptions_user ON push_subscriptions(user_id);

INSERT INTO schema_migrations (version) VALUES ('0001_init');
```

### Schema Notes

- **Normalization vs Section 9:** the Section 9 `Meal Session` JSON nests the organizer's payment details. The schema normalizes those into `payment_methods` (to support one or more receiving methods), keeping only `organizer_name` / `organizer_contact` on `meal_sessions`.
- **`bill_adjustments` is 1:1** with a session (`UNIQUE` on `meal_session_id`) and carries the calculation mode plus every allocation method from Section 5, the `include_organizer_in_split` flag (open question 4), and a signed `rounding_adjustment_cents`.
- **Company claim** is stored as a type (`none`/`fixed`/`percentage`) plus the resolved `company_claim_amount_cents`, so the three reporting figures in Section 5 (paid to restaurant, claimed from company, collected from participants) can all be derived.
- **`payment_results` are derived** by `POST /calculate` and re-written on each recompute; `is_manual_override` protects rows the organizer edited by hand.
- **Category- or participant-scoped claims/discounts** beyond the listed allocation methods are handled via the manual-override path in MVP; a dedicated allocation table can be added in a later migration.
- **Identifying the organizer's own row:** the organizer's own order/result is the one whose `participant_orders.participant_user_id` equals the session's `owner_user_id`. The default rounding adjustment (Section 5) is applied to that row.
- **`farewell_enabled` is the source of truth** for Mode C; `occasion_type` is informational and must stay consistent with it (`farewell` is equivalent to `farewell_enabled = 1`).
- **`user_payment_methods` are account-level defaults** (Screen 2B). `POST /api/meals` copies them into the session's `payment_methods`; later edits to either side are independent. A profile DuitNow QR lives in `uploaded_files` with `meal_session_id` NULL and `owner_user_id` set.
- **Order-submission reminders** use `meal_sessions.remind_at` (= `meal_date_time` minus `reminder_lead_minutes`). A free GitHub Actions scheduled workflow calls the reminder endpoint, which fires once per session (guarded by `reminder_sent_at`) and only while `status` is `draft` or `collecting_orders`, sending email (`users.email`) and Web Push (`push_subscriptions`).

## 17. API Endpoints

All endpoints live under `/api` in the same Vercel app (Section 15) and exchange JSON. This is the surface the Flutter UI calls; the `/api` layer is the only code that holds secrets and touches Turso and Vercel Blob.

### Conventions

- **Auth:** social login is verified server-side at `POST /api/auth/login`, which sets an **httpOnly, Secure, SameSite session cookie**. No provider tokens or secrets are kept in the browser. Every request reads the session server-side.
- **Ownership:** every `/api/meals/:mealId/**` route verifies the session user equals `meal_sessions.owner_user_id`, returning `403` otherwise. (Participant order entry is owner-authenticated in the MVP; a public link token is a future addition — open question 8.)
- **Money:** all monetary request/response fields are integer **cents** (for example `totalDueCents`); the UI formats them as RM.
- **Errors:** `{ "error": { "code": "...", "message": "..." } }` with an appropriate HTTP status. Server-side validation mirrors Section 11.
- **`Auth` column below:** `Public` = no session needed; `Owner` = authenticated owner of the meal session; `User` = any authenticated user; `Cron` = invoked only by the scheduled GitHub Actions workflow, authenticated with `CRON_SECRET` (not user-facing).

### Auth, Config, and Profile

| **Method** | **Path** | **Auth** | **Purpose (Screen)** |
| --- | --- | --- | --- |
| GET | `/api/config` | Public | Enabled login providers, supported/default locales, runtime flags (Screen 1) |
| POST | `/api/auth/login` | Public | Verify `{provider, credential}` server-side, upsert user, set session cookie (Screen 1) |
| POST | `/api/auth/logout` | User | Clear the session (Screen 1) |
| GET | `/api/auth/me` | User | Current user; used for the login-session loading state (Screens 1, 2) |
| PATCH | `/api/me` | User | Update profile: `displayName`, `mobileNumber`, `preferredLanguage` (Screens 2A, 2D) |

Note: authentication uses **server-side token verification** (not Auth.js). The browser obtains a Google ID token / Facebook access token client-side and calls `POST /api/auth/login`; the server verifies it (Google JWKS + issuer/audience via `jose`; Facebook Graph `debug_token`), upserts the user, and sets a signed httpOnly session cookie. `POST /api/auth/logout` clears it, and `GET /api/auth/me` returns the current user (or `{ "user": null }` when signed out, for the login-loading state).

### Profile Payment Defaults

| **Method** | **Path** | **Auth** | **Purpose (Screen)** |
| --- | --- | --- | --- |
| GET | `/api/me/payment-methods` | User | List the account's saved receiving methods (Screen 2B) |
| POST | `/api/me/payment-methods` | User | Add a saved method: bank / DuitNow ID / DuitNow QR / custom (Screen 2B) |
| PATCH | `/api/me/payment-methods/:id` | User | Update a saved method (Screen 2B) |
| DELETE | `/api/me/payment-methods/:id` | User | Remove a saved method (Screen 2B) |

DuitNow QR images for saved methods are uploaded via `POST /api/files` (kind `duitnow_qr`, no `mealId`); the file is owned by the user.

### Notifications

| **Method** | **Path** | **Auth** | **Purpose (Screen)** |
| --- | --- | --- | --- |
| POST | `/api/me/push-subscriptions` | User | Register a Web Push subscription for this device (Screen 2C) |
| DELETE | `/api/me/push-subscriptions/:id` | User | Remove a push subscription (Screen 2C) |
| POST | `/api/cron/reminders` | Cron | Internal: invoked by a GitHub Actions scheduled workflow (authenticated with `CRON_SECRET`); sends due order-submission reminders by email + Web Push, once per session |

Reminder on/off and lead time are part of the meal session body (`POST` / `PATCH /api/meals`), not separate endpoints.

### Meal Sessions

| **Method** | **Path** | **Auth** | **Purpose (Screen)** |
| --- | --- | --- | --- |
| GET | `/api/meals?status=&q=` | User | List own sessions, with filter and search (Screen 2) |
| POST | `/api/meals` | User | Create a meal session; copies the owner's saved Profile Payment Defaults into the session's payment methods (prefill) (Screen 3) |
| GET | `/api/meals/:mealId` | Owner | Full session detail (Screens 3, 6) |
| PATCH | `/api/meals/:mealId` | Owner | Update setup fields (Screen 3) |
| DELETE | `/api/meals/:mealId` | Owner | Delete the session (Screen 2) |
| POST | `/api/meals/:mealId/finalize` | Owner | Lock orders, set status `finalized` (Screen 6) |
| POST | `/api/meals/:mealId/status` | Owner | Guarded status transition `{status}` (Screens 7, 9) |
| POST | `/api/meals/:mealId/close` | Owner | Set status `closed` (Screen 9) |

### Payment Methods

| **Method** | **Path** | **Auth** | **Purpose (Screen)** |
| --- | --- | --- | --- |
| GET | `/api/meals/:mealId/payment-methods` | Owner | List receiving methods (Screens 3, 9) |
| POST | `/api/meals/:mealId/payment-methods` | Owner | Add bank / DuitNow ID / DuitNow QR / custom (Screen 3) |
| PATCH | `/api/meals/:mealId/payment-methods/:id` | Owner | Update a method (Screen 3) |
| DELETE | `/api/meals/:mealId/payment-methods/:id` | Owner | Remove a method (Screen 3) |

### Menu

| **Method** | **Path** | **Auth** | **Purpose (Screen)** |
| --- | --- | --- | --- |
| GET | `/api/meals/:mealId/menu-items` | Owner | List menu items (Screens 4, 5) |
| POST | `/api/meals/:mealId/menu-items` | Owner | Add an item manually (Screen 4) |
| PATCH | `/api/meals/:mealId/menu-items/:id` | Owner | Edit / mark unavailable / set actual price (Screens 4, 7) |
| DELETE | `/api/meals/:mealId/menu-items/:id` | Owner | Delete an item (Screen 4) |
| POST | `/api/meals/:mealId/menu-items/import` | Owner | Bulk-create from an uploaded Excel `{fileId}` (Screen 4) |
| PUT | `/api/meals/:mealId/menu-items/prices` | Owner | Bulk set actual prices `[{itemId, actualPriceCents}]` (Screen 7) |
| GET | `/api/meals/:mealId/menu-template.xlsx` | Owner | Download the menu import template (Screen 4) |

### Orders

| **Method** | **Path** | **Auth** | **Purpose (Screen)** |
| --- | --- | --- | --- |
| GET | `/api/meals/:mealId/orders` | Owner | All participant orders (Screen 6) |
| POST | `/api/meals/:mealId/orders` | Owner | Create order `{name, mobile, role, items[]}` (Screen 5) |
| GET | `/api/meals/:mealId/orders/:id` | Owner | Single order (Screens 5, 6) |
| PATCH | `/api/meals/:mealId/orders/:id` | Owner | Edit order before finalization (Screens 5, 6) |
| DELETE | `/api/meals/:mealId/orders/:id` | Owner | Remove order (Screen 6) |
| GET | `/api/meals/:mealId/orders/summary?view=restaurant\|participant` | Owner | Grouped Restaurant / Participant views (Screen 6) |

### Bill, Calculation, and Payment Status

| **Method** | **Path** | **Auth** | **Purpose (Screen)** |
| --- | --- | --- | --- |
| GET | `/api/meals/:mealId/bill` | Owner | Get bill adjustments (Screens 7, 8) |
| PUT | `/api/meals/:mealId/bill` | Owner | Upsert tax / service / discount / company claim / final bill / mode / allocation methods / rounding (Screens 7, 8) |
| POST | `/api/meals/:mealId/calculate` | Owner | Compute and persist `payment_results`; returns results plus a final-bill mismatch warning (Screen 8) |
| GET | `/api/meals/:mealId/payment-results` | Owner | List computed results (Screens 8, 9) |
| PATCH | `/api/meals/:mealId/payment-results/:id` | Owner | Manual override of a participant amount (sets `is_manual_override`) (Screen 8) |
| POST | `/api/meals/:mealId/payment-results/:id/mark-paid` | Owner | Mark paid `{paidAt?}`; logs an event (Screen 9) |
| POST | `/api/meals/:mealId/payment-results/:id/mark-pending` | Owner | Revert to pending; logs an event (Screen 9) |
| GET | `/api/meals/:mealId/payment-status-events` | Owner | Payment / edit audit log (Screen 9) |

### Payment Requests

| **Method** | **Path** | **Auth** | **Purpose (Screen)** |
| --- | --- | --- | --- |
| GET | `/api/meals/:mealId/payment-requests` | Owner | Localized message per participant, with method details, a QR image link (Blob URL), reference, and a free click-to-chat `whatsappUrl` (`wa.me`) (Screen 9) |
| GET | `/api/meals/:mealId/payment-requests/:resultId` | Owner | Single participant message (Screen 9) |

Bulk send is **client-side**: the UI lets the organizer select multiple or all participants and opens each one's free `whatsappUrl` (click-to-chat) in turn, or copies all selected messages. There is no server-side send and no paid WhatsApp Business API.

### Files (Vercel Blob via the server)

| **Method** | **Path** | **Auth** | **Purpose (Screen)** |
| --- | --- | --- | --- |
| POST | `/api/files` | Owner | Multipart upload to Vercel Blob; validates type (QR must be PNG/JPG/JPEG/WebP); writes `uploaded_files`; returns `{id, url}`. Kinds: `duitnow_qr`, `menu_image`, `menu_excel` (Screens 3, 4) |
| GET | `/api/files/:id` | Owner | File metadata / access for display (Screens 3, 9) |
| DELETE | `/api/files/:id` | Owner | Remove the blob and its row (Screens 3, 4) |

### Exports

| **Method** | **Path** | **Auth** | **Purpose (Screen)** |
| --- | --- | --- | --- |
| GET | `/api/meals/:mealId/export/restaurant-order.xlsx` | Owner | Excel: Meal Info, Restaurant Summary, Individual Orders, Menu Reference (Screen 6) |
| GET | `/api/meals/:mealId/export/payment-calculation.xlsx` | Owner | Excel: Payment Summary, Participant Details, Item Prices, Adjustments, Messages (Screen 8) |
| GET | `/api/meals/:mealId/export/payment-requests.csv` | Owner | CSV of payment requests (Screen 9) |

Exports may stream the file directly or store it in Vercel Blob (recorded in `uploaded_files`) and return a URL.

### Example: Create an Order

```
POST /api/meals/meal_001/orders
{
  "participantName": "Alice",
  "mobileNumber": "0123456789",
  "participantRole": "paying_participant",
  "items": [
    { "menuItemId": "item_001", "quantity": 1, "remarks": "No cucumber" },
    { "menuItemId": "item_014", "quantity": 1, "remarks": "Less ice" }
  ]
}
-> 201 { "id": "order_001", "submittedAt": "2026-06-25T04:10:00Z" }
```

### Example: Calculate

```
POST /api/meals/meal_001/calculate
-> 200
{
  "summary": {
    "calculationMode": "farewell",
    "finalBillAmountCents": 11600,
    "calculatedTotalCents": 11600,
    "mismatchCents": 0
  },
  "results": [
    {
      "participantName": "Alice",
      "participantRole": "paying_participant",
      "subtotalCents": 1400,
      "taxCents": 120,
      "serviceChargeCents": 200,
      "companyClaimCents": 350,
      "farewellSponsoredShareCents": 400,
      "roundingAdjustmentCents": 0,
      "totalDueCents": 1770,
      "paymentStatus": "pending",
      "paymentReference": "Friday Team Lunch - Alice"
    }
  ]
}
```

## 18. Example End-to-End Scenario

1. On the landing page, the organizer changes the language if they do not want to use the default English interface.

2. Organizer signs in with Google or Facebook.

3. Organizer creates `Friday Team Lunch` and marks it as a farewell meal.

4. Organizer enters restaurant name and menu URL.

5. Organizer fills in receiving payment methods:

  - Bank account
  - DuitNow ID
  - DuitNow QR image uploaded from wallet account

6. Organizer imports an Excel menu with 20 items.

7. Five people submit orders:

  - Organizer
  - Alice
  - Ben, farewell honoree
  - Chloe
  - Daniel

8. Organizer reviews grouped order:

  - Chicken Rice x3
  - Curry Noodle x1
  - Fried Rice x1
  - Iced Lemon Tea x4

9. Organizer exports restaurant Excel and sends it to the restaurant.

10. Team goes for lunch.

11. Organizer pays RM 116.00.

12. Organizer enters actual item prices, RM 6.00 tax, and RM 10.00 service charge.

13. Organizer enters a company claim, for example `25% claimable`.

14. App subtracts the company claim from the participant payable amount.

15. App sets Ben's payment amount to `RM 0.00`.

16. App shares Ben's ordered meal cost across the paying participants.

17. App calculates each paying person's reduced amount after company claim.

18. Organizer copies each payment message and sends it to paying participants.

19. Participants transfer money by bank transfer, DuitNow ID, or scanning the uploaded DuitNow QR image.

20. Organizer marks each paying participant as paid.

21. Meal session is closed.

## 19. Open Questions Before Building

**All 16 are now resolved.** The decisions are recorded in the table below; the original question wording is kept beneath it for reference.

| **#** | **Topic** | **Decision** |
| --- | --- | --- |
| 1 | Ordering device | Same-device (organizer's device) for MVP; own-device shared links in Phase 4. |
| 2 | Excel timing | Both in Phase 2; export first, then import. |
| 3 | Price timing | Support both; default enters actual prices after the meal, with estimated prices optional before. |
| 4 | Organizer in split | Included by default (`include_organizer_in_split = 1`); can be toggled off. |
| 5 | Equal split | Item-based is the default; equal split is available from day one. |
| 6 | DuitNow QR | Optional; at least one receiving method is required (bank / DuitNow ID / QR). |
| 7 | Multiple restaurants | No; one restaurant per session for MVP. |
| 8 | Participant sign-in | Not required for MVP (owner-authenticated, same device); guest links are future. |
| 9 | Auth implementation | In-app **server-side token verification** in the `/api` layer: the client gets a Google ID token / Facebook access token and POSTs it to `/api/auth/login`, which verifies it (Google JWKS + issuer/audience via `jose`; Facebook Graph `debug_token`), upserts the user, and sets a signed httpOnly session cookie. Google and Facebook only (both free). (Chosen over Auth.js, which suits server-rendered frameworks more than a Flutter SPA; Instagram and Apple Sign In remain out of scope — Apple needs a paid account.) |
| 10 | Platform | **Web only**. Installable, app-like **PWA on Android and desktop**; on **iOS, a responsive in-browser web app** (no iOS PWA / home-screen install), including in-app browsers such as WhatsApp. Native Android/iOS builds remain a future option on the same codebase. |
| 11 | Company claim scope | Full bill by default; category- or participant-scoped claims use the manual path (future). |
| 12 | Finance claim export | MVP: claim figures live in the payment Excel "Adjustments" tab; a dedicated finance claim export is a future enhancement. |
| 13 | Chinese variant | **Simplified Chinese** for the `zh` locale. |
| 14 | Export language | Exports **follow the organizer's selected UI language** (English / Simplified Chinese / Malay). User-entered content (names, item names, remarks) is exported exactly as entered, never auto-translated. |
| 15 | Farewell split | Equal across paying participants by default. |
| 16 | Claim vs farewell order | Company claim is applied **after** the farewell share, on the `own + farewell-share` base (per the Section 4 Mode C formula). |

### Original Questions (for reference)

These are the original questions, kept verbatim for reference. Note: Instagram login, Apple Sign In, and iOS PWA appear in some of the wording below but were later removed from scope; the decision table above is authoritative.

1. Should participants submit orders from their own devices, or is same-device entry acceptable for MVP?

2. Is Excel import/export mandatory for the first version, or can export come first and import later?

3. Should menu prices usually be known before ordering, or only after the meal?

4. Should the organizer’s own meal be included in calculations by default?

5. Should tax and service charge always be split proportionally, or does equal split need to be available from day one?

6. Should the DuitNow QR image be required before payment requests can be generated, or optional when a bank account or DuitNow ID exists?

7. Should the app support multiple restaurants in one meal session?

8. Should participants also be required to sign in with Google, Facebook, Instagram, or conditional Apple Sign In, or should they be allowed to submit orders as guests through shared links?

9. Which auth provider should be used for implementation, given the requirement to support Google, Facebook, Instagram, and conditional Apple Sign In?

10. Should the first Flutter version target web only, or web plus Android/iOS from the start?

11. Should company claim apply to the full bill by default, or only to selected categories such as food excluding drinks?

12. Should company claim reporting export a separate claim summary for finance submission?

13. Should Chinese use Simplified Chinese, Traditional Chinese, or both?

14. Should exported Excel sheets follow the user's selected language, or always use English for easier sharing with restaurants/company finance?

15. For farewell meals, should the honoree meal cost be split equally by default, or proportionally based on each paying participant's own order?

16. Should company claim apply before or after the farewell honoree cost is shared across paying participants?

## 20. Recommended Build Phases

These build phases describe delivery order and are separate from the workflow phases in Section 3 (which describe the in-app user flow). "Phase 4" in the Section 19 decisions refers to build Phase 4 below.

### Phase 1: Prototype

- Social login landing page with Google and Facebook.
- Flutter web app foundation.
- Backend API foundation with Turso connection.
- GitHub to Vercel CI/CD pipeline with profile-based configuration (local, staging, production); see Section 15.
- Initial Turso schema and migrations.
- English, Chinese, and Malay localization setup.
- Single meal session.
- Manual menu entry.
- Participant order entry.
- Basic calculation.
- Farewell meal mode with one or more non-paying honorees.
- Company claim by fixed amount or percentage.
- Bank account, DuitNow ID, and DuitNow QR image payment method setup.
- Copyable payment messages.

### Phase 2: Excel Support

- Import menu Excel.
- Export restaurant order Excel.
- Export payment calculation Excel.

### Phase 3: Better Organizer Tools

- Meal session list.
- Payment status.
- Edit locked orders with audit notes.
- Better mismatch handling.
- Order-submission reminders to the organizer (email + Web Push) via a free GitHub Actions scheduled cron.

### Phase 4: Sharing and Cloud

- Participant invite links.
- Expanded Turso-backed multi-session storage.
- Multi-device support.

### Phase 5: Automation

- OCR menu extraction.
- Automated WhatsApp sending via the Business API (paid; one-click blast to all).
- Payment QR.
- Payment reminders to participants (chasing unpaid amounts).

## 21. Owner Setup and Provisioning Guide

This is the one-time, day-0 setup the **project owner** performs to obtain the credentials listed in Section 15. **Every service below has a free tier sufficient for the MVP; none requires payment.** After creating each value, place it in the locations described next.

### Where each value goes

- **Local development:** `config/secrets.local` (git-ignored; never committed).
- **CI/CD build:** GitHub repository secrets — **Settings > Secrets and variables > Actions**.
- **Runtime on Vercel:** **Vercel Project > Settings > Environment Variables** (per environment), synced from GitHub secrets by the pipeline.

Public (frontend) values are still stored as secrets for convenience but get compiled into the browser bundle, so treat them as non-sensitive. The three Vercel deploy values (`VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`) live in **GitHub secrets only** — they are used by the deploy workflow, not by the running app.

### Authorized origins / domains (needed by Google and Facebook)

Because login uses client-side sign-in + server-side token verification (not a redirect callback), you register **origins / domains**, not `/api/auth/callback/...` URLs:

- **Google** — in the OAuth client, add **Authorized JavaScript origins** for each environment: `http://localhost:3000` (local), your `https://<preview>.vercel.app`, and your production origin. No redirect URI is required for the ID-token flow.
- **Facebook** — under Facebook Login settings, add the app domains / **Allowed Domains for the JavaScript SDK**: `localhost`, your preview host, and your production host.

Vercel preview URLs change per deployment, so for previews use a stable alias. Each value must match the origin the app is served from.

### 1. Google OAuth (free)

1. In **Google Cloud Console**, create a project (e.g. `MakanKira`).
2. Configure the **OAuth consent screen** (External; app name, support email, scopes `email` and `profile`).
3. **Credentials > Create credentials > OAuth client ID > Web application**.
4. Add the **authorized JavaScript origins** above (no redirect URI is needed for the ID-token flow).
5. Copy the **Client ID**. (Google also issues a Client Secret, but this app's token-verify flow does not use it.)

Yields: `GOOGLE_OAUTH_CLIENT_ID` (public).

### 2. Facebook Login (free)

1. In **Meta for Developers**, create an app (type: Consumer).
2. Add the **Facebook Login** product.
3. Under **Facebook Login > Settings**, add the Valid OAuth Redirect URIs above.
4. Request the `email` permission (works for app admins/testers immediately; submit for **App Review** before public launch).
5. From **App settings > Basic**, copy the App ID and App Secret.

Yields: `FACEBOOK_APP_ID` (public), `FACEBOOK_APP_SECRET` (secret).

### 3. Turso database (free)

1. Sign up at **Turso** and install the Turso CLI.
2. Create two databases, e.g. `makankira-dev` and `makankira-prod`.
3. For each, get the URL (`turso db show --url <name>`) and create a token (`turso db tokens create <name>`).

Yields: `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` (secret). Use the dev DB locally, the prod DB in production.

### 4. Vercel project + Blob storage (free)

1. Create a **Vercel** account and import the GitHub repo as a project (or run `vercel link`).
2. **Account Settings > Tokens**: create a token for CI — `VERCEL_TOKEN`.
3. Get `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` from `vercel link` output or `.vercel/project.json`.
4. **Storage > create a Blob store**, connect it to the project, copy `BLOB_READ_WRITE_TOKEN`.
5. No Vercel Cron is used (its sub-daily schedules need a paid plan); the reminder schedule runs as a free GitHub Actions workflow instead — see step 8.

Yields: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, `BLOB_READ_WRITE_TOKEN`.

### 5. Resend email (free)

1. Sign up at **Resend**.
2. Add and **verify a sending domain** (add the DNS records they provide); for dev you can use their test domain.
3. Create an **API key**.
4. Choose a from-address (e.g. `reminders@your-domain`) for reminder emails.

Yields: `RESEND_API_KEY` (secret). Free tier ~3,000 emails/month.

### 6. Web Push VAPID keys (free)

1. Run `npx web-push generate-vapid-keys` once.
2. Public key → `VAPID_PUBLIC_KEY` (frontend); private key → `VAPID_PRIVATE_KEY` (secret).
3. Set `vapidSubject` to a `mailto:` contact (non-secret).

Yields: `VAPID_PUBLIC_KEY` (public), `VAPID_PRIVATE_KEY` (secret).

### 7. Application secrets (free, self-generated)

Generate two random 32-byte strings, for example `openssl rand -base64 32` (or `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`):

- `SESSION_SECRET` — signs the login session cookie.
- `CRON_SECRET` — authenticates the reminder cron endpoint.

### 8. Reminder schedule (free, GitHub Actions)

1. The repo includes `.github/workflows/reminders.yml` (Section 15); it runs on a schedule and `curl`s `POST /api/cron/reminders`.
2. Add a GitHub Actions **variable** (not a secret) `APP_BASE_URL` under **Settings > Secrets and variables > Actions > Variables**, set to your production origin, e.g. `https://makankira.vercel.app`.
3. It reuses `CRON_SECRET` (step 7) as the bearer token — no new secret needed.

Yields: an `APP_BASE_URL` Actions variable (non-secret). No paid plan required.

### Recommended order

1. Turso dev DB + self-generated secrets — app runs locally against a database.
2. Google + Facebook OAuth (local JS origins / app domains) — login works locally.
3. Resend + VAPID — reminders work.
4. Vercel project + Blob + push all values into GitHub secrets — first deploy; then add the preview/production JS origins (Google) and app domains (Facebook).

### Secrets checklist

| Value | Created in | Type | Free tier | Put in |
| --- | --- | --- | --- | --- |
| `GOOGLE_OAUTH_CLIENT_ID` | Google Cloud Console | Public | Yes | local, GitHub, Vercel |
| `FACEBOOK_APP_ID` | Meta for Developers | Public | Yes | local, GitHub, Vercel |
| `FACEBOOK_APP_SECRET` | Meta for Developers | Secret | Yes | local, GitHub, Vercel |
| `TURSO_DATABASE_URL` | Turso | Secret | Yes | local, GitHub, Vercel |
| `TURSO_AUTH_TOKEN` | Turso | Secret | Yes | local, GitHub, Vercel |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob | Secret | Yes | local, GitHub, Vercel |
| `RESEND_API_KEY` | Resend | Secret | Yes | local, GitHub, Vercel |
| `VAPID_PUBLIC_KEY` | `web-push` CLI | Public | Yes | local, GitHub, Vercel |
| `VAPID_PRIVATE_KEY` | `web-push` CLI | Secret | Yes | local, GitHub, Vercel |
| `SESSION_SECRET` | self (`openssl`) | Secret | Yes | local, GitHub, Vercel |
| `CRON_SECRET` | self (`openssl`) | Secret | Yes | local, GitHub, Vercel |
| `VERCEL_TOKEN` | Vercel account | Secret | Yes | GitHub only |
| `VERCEL_ORG_ID` | Vercel (`vercel link`) | Secret | Yes | GitHub only |
| `VERCEL_PROJECT_ID` | Vercel (`vercel link`) | Secret | Yes | GitHub only |

`vapidSubject` is a non-secret literal set directly in `config/app-config.*.yaml` (no provisioning needed). `APP_BASE_URL` (the reminder workflow's target origin) is a non-secret **GitHub Actions variable**, not a secret.
