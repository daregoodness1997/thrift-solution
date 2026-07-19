-- Track loan disbursement method/status for Flutterwave payouts

ALTER TABLE "loans"
  ADD COLUMN IF NOT EXISTS "disbursement_method" TEXT,
  ADD COLUMN IF NOT EXISTS "disbursement_status" TEXT,
  ADD COLUMN IF NOT EXISTS "disbursement_ref" TEXT,
  ADD COLUMN IF NOT EXISTS "disbursement_note" TEXT,
  ADD COLUMN IF NOT EXISTS "disbursed_by_id" TEXT;
