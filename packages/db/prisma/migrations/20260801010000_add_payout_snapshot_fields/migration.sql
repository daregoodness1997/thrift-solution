-- Snapshot the user's bank account at payout-request creation time so that
-- disbursements always go to the original approved account even if the
-- admin later changes the user's bank details.
ALTER TABLE "wallet_payout_requests"
  ADD COLUMN IF NOT EXISTS "payout_bank_account_number" TEXT,
  ADD COLUMN IF NOT EXISTS "payout_bank_code" TEXT,
  ADD COLUMN IF NOT EXISTS "payout_bank_name" TEXT,
  ADD COLUMN IF NOT EXISTS "payout_bank_account_name" TEXT;