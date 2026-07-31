-- CreateTable: Wallet payout requests. Users request a payout of wallet funds to
-- their admin-approved bank account; an admin reviews, approves and then
-- initiates (Flutterwave) or records (manual) the disbursement.
CREATE TABLE "wallet_payout_requests" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "amount" NUMERIC(19,4) NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "note" TEXT,
  "reviewed_by_id" TEXT,
  "reviewed_at" TIMESTAMP(3),
  "reviewed_note" TEXT,
  "disbursement_method" TEXT,
  "disbursement_status" TEXT NOT NULL DEFAULT 'pending',
  "disbursement_ref" TEXT,
  "disbursement_proof_url" TEXT,
  "disbursement_note" TEXT,
  "disbursed_by_id" TEXT,
  "disbursed_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "wallet_payout_requests_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "wallet_payout_requests_user_id_idx" ON "wallet_payout_requests" ("user_id");
CREATE INDEX "wallet_payout_requests_status_idx" ON "wallet_payout_requests" ("status");

ALTER TABLE "wallet_payout_requests"
  ADD CONSTRAINT "wallet_payout_requests_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "wallet_payout_requests"
  ADD CONSTRAINT "wallet_payout_requests_reviewed_by_id_fkey"
  FOREIGN KEY ("reviewed_by_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
