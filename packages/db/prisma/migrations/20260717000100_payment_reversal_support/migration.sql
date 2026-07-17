-- Payment reversal support: track which transaction a reversal belongs to,
-- and link circle subscriptions back to the wallet-funding payment that paid
-- for them so a reversed payment can unwind the dependent subscription.

ALTER TABLE "transactions"
  ADD COLUMN IF NOT EXISTS "reversal_of" TEXT,
  ADD COLUMN IF NOT EXISTS "reversed_at" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "transactions_reversal_of_idx" ON "transactions" ("reversal_of");

ALTER TABLE "circle_accounts"
  ADD COLUMN IF NOT EXISTS "funded_by_txn_ref" TEXT,
  ADD COLUMN IF NOT EXISTS "reversed_at" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "circle_accounts_funded_by_txn_ref_idx" ON "circle_accounts" ("funded_by_txn_ref");
