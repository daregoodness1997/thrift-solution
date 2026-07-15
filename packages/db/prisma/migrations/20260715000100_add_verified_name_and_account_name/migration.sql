ALTER TABLE "kyc" ADD COLUMN IF NOT EXISTS "verified_name" TEXT;
ALTER TABLE "virtual_accounts" ADD COLUMN IF NOT EXISTS "account_name" TEXT;
