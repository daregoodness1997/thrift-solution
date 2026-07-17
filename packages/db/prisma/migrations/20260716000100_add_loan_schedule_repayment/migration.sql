-- Add payment schedule and repayment support for loans

ALTER TABLE "loans"
  ADD COLUMN IF NOT EXISTS "disbursed_amount" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "paid_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "principal_paid" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "interest_paid" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "outstanding_balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "next_due_date" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "loan_schedule_items" (
  "id" TEXT NOT NULL,
  "loan_id" TEXT NOT NULL,
  "installment_no" INTEGER NOT NULL,
  "due_date" TIMESTAMP(3) NOT NULL,
  "principal" DOUBLE PRECISION NOT NULL,
  "interest" DOUBLE PRECISION NOT NULL,
  "total_due" DOUBLE PRECISION NOT NULL,
  "principal_paid" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "interest_paid" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "paid_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "loan_schedule_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "loan_repayments" (
  "id" TEXT NOT NULL,
  "loan_id" TEXT NOT NULL,
  "borrower_id" TEXT NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "principal" DOUBLE PRECISION NOT NULL,
  "interest" DOUBLE PRECISION NOT NULL,
  "method" TEXT NOT NULL DEFAULT 'wallet',
  "reference" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'completed',
  "note" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "loan_repayments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "loan_schedule_items_loan_id_installment_no_key"
  ON "loan_schedule_items" ("loan_id", "installment_no");

CREATE UNIQUE INDEX IF NOT EXISTS "loan_repayments_reference_key"
  ON "loan_repayments" ("reference");

CREATE INDEX IF NOT EXISTS "loan_schedule_items_loan_id_idx" ON "loan_schedule_items" ("loan_id");
CREATE INDEX IF NOT EXISTS "loan_schedule_items_status_idx" ON "loan_schedule_items" ("status");
CREATE INDEX IF NOT EXISTS "loan_repayments_loan_id_idx" ON "loan_repayments" ("loan_id");
CREATE INDEX IF NOT EXISTS "loan_repayments_borrower_id_idx" ON "loan_repayments" ("borrower_id");

ALTER TABLE "loan_schedule_items"
  ADD CONSTRAINT "loan_schedule_items_loan_id_fkey"
  FOREIGN KEY ("loan_id") REFERENCES "loans" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "loan_repayments"
  ADD CONSTRAINT "loan_repayments_loan_id_fkey"
  FOREIGN KEY ("loan_id") REFERENCES "loans" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "loan_repayments"
  ADD CONSTRAINT "loan_repayments_borrower_id_fkey"
  FOREIGN KEY ("borrower_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
