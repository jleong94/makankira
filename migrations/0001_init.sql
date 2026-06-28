-- migrations/0001_init.sql  (Turso / libSQL, SQLite dialect)
-- MakanKira initial schema: 12 core tables + schema_migrations bookkeeping.
-- Money is stored as INTEGER minor units (sen): RM 9.50 = 950.

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
  remind_at             TEXT,
  reminder_sent_at      TEXT,
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
  participant_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
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
  rounding_adjustment_cents        INTEGER NOT NULL DEFAULT 0,
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
