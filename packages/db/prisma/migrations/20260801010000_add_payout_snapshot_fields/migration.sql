-- Snapshot the user's bank account at payout-request creation time so that
-- disbursements always go to the original approved account even if the
-- admin later changes the user's bank details.
ALTER TABLE "wallet_payout_requests"
  ADD COLUMN IF NOT EXISTS "payoutBankAccountNumber" TEXT,
  ADD COLUMN IF NOT EXISTS "payoutBankCode" TEXT,
  ADD COLUMN IF NOT EXISTS "payoutBankName" TEXT,
  ADD COLUMN IF NOT EXISTS "payoutBankAccountName" TEXT;