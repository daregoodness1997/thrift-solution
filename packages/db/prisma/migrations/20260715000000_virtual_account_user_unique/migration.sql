-- Create the virtual_accounts table (it was defined in the Prisma schema but
-- never had a corresponding CREATE TABLE migration).
CREATE TABLE IF NOT EXISTS "virtual_accounts" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "account_number" TEXT NOT NULL,
  "bank_name" TEXT NOT NULL,
  "bank_code" TEXT,
  "currency" TEXT NOT NULL DEFAULT 'NGN',
  "reference" TEXT NOT NULL,
  "provider_ref" TEXT,
  "is_permanent" BOOLEAN NOT NULL DEFAULT true,
  "bvn" TEXT,
  "nin" TEXT,
  "status" TEXT NOT NULL DEFAULT 'active',
  "last_transfer_at" TIMESTAMP(3),
  "deleted_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "virtual_accounts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "virtual_accounts_reference_key" ON "virtual_accounts" ("reference");
CREATE UNIQUE INDEX IF NOT EXISTS "virtual_accounts_provider_ref_key" ON "virtual_accounts" ("provider_ref");
CREATE INDEX IF NOT EXISTS "virtual_accounts_user_id_idx" ON "virtual_accounts" ("user_id");
CREATE INDEX IF NOT EXISTS "virtual_accounts_provider_idx" ON "virtual_accounts" ("provider");
CREATE INDEX IF NOT EXISTS "virtual_accounts_account_number_idx" ON "virtual_accounts" ("account_number");

ALTER TABLE "virtual_accounts"
  ADD CONSTRAINT "virtual_accounts_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Enforce one-to-one (1:1) virtual account per user.
-- Partial unique index ignores soft-deleted rows so a deleted account
-- does not block a future recreation, while guaranteeing at most one
-- ACTIVE virtual account per user at the database level.
CREATE UNIQUE INDEX IF NOT EXISTS virtual_accounts_user_id_unique
  ON virtual_accounts (user_id)
  WHERE deleted_at IS NULL;
