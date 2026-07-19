-- Create circle (thrift) tables and navigation tables. These models existed in
-- the Prisma schema but were never captured by a migration (they had been
-- applied to local DBs via `db push`). This migration reconciles the history.

CREATE TABLE IF NOT EXISTS "circles" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "cycle_type" TEXT NOT NULL DEFAULT 'deposit',
  "amount" DOUBLE PRECISION NOT NULL,
  "weekly_amount" DOUBLE PRECISION,
  "total_weeks" INTEGER,
  "duration_months" INTEGER NOT NULL,
  "interest_rate_annual" DOUBLE PRECISION NOT NULL,
  "max_accounts_per_user" INTEGER NOT NULL DEFAULT 0,
  "auto_payout" BOOLEAN NOT NULL DEFAULT false,
  "payout_mode" TEXT NOT NULL DEFAULT 'auto',
  "block_payout_on_default" BOOLEAN NOT NULL DEFAULT true,
  "status" TEXT NOT NULL DEFAULT 'active',
  "deleted_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "circles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "circle_accounts" (
  "id" TEXT NOT NULL,
  "circle_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "principal_amount" DOUBLE PRECISION NOT NULL,
  "interest_earned" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "total_withdrawn" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "status" TEXT NOT NULL DEFAULT 'active',
  "weeks_contributed" INTEGER NOT NULL DEFAULT 0,
  "weeks_defaulted" INTEGER NOT NULL DEFAULT 0,
  "last_contribution_attempt" TIMESTAMP(3),
  "start_date" TIMESTAMP(3) NOT NULL,
  "maturity_date" TIMESTAMP(3) NOT NULL,
  "last_interest_calculation" TIMESTAMP(3),
  "deleted_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "circle_accounts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "circle_contributions" (
  "id" TEXT NOT NULL,
  "circle_account_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "week_number" INTEGER NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "type" TEXT NOT NULL DEFAULT 'weekly',
  "transaction_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "circle_contributions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "circle_defaults" (
  "id" TEXT NOT NULL,
  "circle_account_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "week_number" INTEGER NOT NULL,
  "amount_due" DOUBLE PRECISION NOT NULL,
  "clearance_amount" DOUBLE PRECISION NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'outstanding',
  "cleared_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "circle_defaults_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "circle_interest_logs" (
  "id" TEXT NOT NULL,
  "circle_account_id" TEXT NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "principal_at_calculation" DOUBLE PRECISION NOT NULL,
  "annual_rate" DOUBLE PRECISION NOT NULL,
  "deleted_at" TIMESTAMP(3),
  "calculated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "circle_interest_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "circle_payout_requests" (
  "id" TEXT NOT NULL,
  "circle_account_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "note" TEXT,
  "reviewed_by_id" TEXT,
  "reviewed_at" TIMESTAMP(3),
  "cleared_by_id" TEXT,
  "cleared_at" TIMESTAMP(3),
  "clearance_note" TEXT,
  "disbursement_method" TEXT,
  "disbursement_status" TEXT NOT NULL DEFAULT 'pending',
  "disbursement_ref" TEXT,
  "disbursement_proof_url" TEXT,
  "disbursement_note" TEXT,
  "disbursed_by_id" TEXT,
  "disbursed_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "circle_payout_requests_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "navigation_items" (
  "id" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "href" TEXT NOT NULL,
  "icon" TEXT NOT NULL,
  "badge" TEXT,
  "section" TEXT NOT NULL DEFAULT '',
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "deleted_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "navigation_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "role_navigation" (
  "id" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "navigation_item_id" TEXT NOT NULL,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "deleted_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "role_navigation_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "circle_accounts_circle_id_idx" ON "circle_accounts" ("circle_id");
CREATE INDEX IF NOT EXISTS "circle_accounts_user_id_idx" ON "circle_accounts" ("user_id");
CREATE INDEX IF NOT EXISTS "circle_accounts_status_idx" ON "circle_accounts" ("status");
CREATE INDEX IF NOT EXISTS "circle_contributions_circle_account_id_idx" ON "circle_contributions" ("circle_account_id");
CREATE INDEX IF NOT EXISTS "circle_contributions_user_id_idx" ON "circle_contributions" ("user_id");
CREATE INDEX IF NOT EXISTS "circle_defaults_circle_account_id_idx" ON "circle_defaults" ("circle_account_id");
CREATE INDEX IF NOT EXISTS "circle_defaults_user_id_idx" ON "circle_defaults" ("user_id");
CREATE INDEX IF NOT EXISTS "circle_defaults_status_idx" ON "circle_defaults" ("status");
CREATE INDEX IF NOT EXISTS "circle_interest_logs_circle_account_id_idx" ON "circle_interest_logs" ("circle_account_id");
CREATE INDEX IF NOT EXISTS "circle_interest_logs_calculated_at_idx" ON "circle_interest_logs" ("calculated_at");
CREATE INDEX IF NOT EXISTS "circle_payout_requests_circle_account_id_idx" ON "circle_payout_requests" ("circle_account_id");
CREATE INDEX IF NOT EXISTS "circle_payout_requests_user_id_idx" ON "circle_payout_requests" ("user_id");
CREATE INDEX IF NOT EXISTS "circle_payout_requests_status_idx" ON "circle_payout_requests" ("status");
CREATE UNIQUE INDEX IF NOT EXISTS "navigation_items_href_key" ON "navigation_items" ("href");
CREATE INDEX IF NOT EXISTS "role_navigation_role_idx" ON "role_navigation" ("role");
CREATE UNIQUE INDEX IF NOT EXISTS "role_navigation_role_navigation_item_id_key" ON "role_navigation" ("role", "navigation_item_id");

ALTER TABLE "circle_accounts"
  ADD CONSTRAINT "circle_accounts_circle_id_fkey"
  FOREIGN KEY ("circle_id") REFERENCES "circles" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "circle_accounts"
  ADD CONSTRAINT "circle_accounts_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "circle_contributions"
  ADD CONSTRAINT "circle_contributions_circle_account_id_fkey"
  FOREIGN KEY ("circle_account_id") REFERENCES "circle_accounts" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "circle_defaults"
  ADD CONSTRAINT "circle_defaults_circle_account_id_fkey"
  FOREIGN KEY ("circle_account_id") REFERENCES "circle_accounts" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "circle_interest_logs"
  ADD CONSTRAINT "circle_interest_logs_circle_account_id_fkey"
  FOREIGN KEY ("circle_account_id") REFERENCES "circle_accounts" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "circle_payout_requests"
  ADD CONSTRAINT "circle_payout_requests_circle_account_id_fkey"
  FOREIGN KEY ("circle_account_id") REFERENCES "circle_accounts" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "circle_payout_requests"
  ADD CONSTRAINT "circle_payout_requests_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "circle_payout_requests"
  ADD CONSTRAINT "circle_payout_requests_reviewed_by_id_fkey"
  FOREIGN KEY ("reviewed_by_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "role_navigation"
  ADD CONSTRAINT "role_navigation_navigation_item_id_fkey"
  FOREIGN KEY ("navigation_item_id") REFERENCES "navigation_items" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
