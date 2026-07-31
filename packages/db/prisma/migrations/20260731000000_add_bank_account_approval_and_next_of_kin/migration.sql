-- AlterTable: Add payout account approval workflow and next of kin fields.
-- Existing saved accounts are grandfathered as "approved" via the column default.
ALTER TABLE "users" ADD COLUMN "bank_account_status" TEXT DEFAULT 'approved';
ALTER TABLE "users" ADD COLUMN "bank_account_rejection_reason" TEXT;
ALTER TABLE "users" ADD COLUMN "bank_account_reviewed_by_id" TEXT;
ALTER TABLE "users" ADD COLUMN "bank_account_reviewed_at" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN "next_of_kin_name" TEXT;
ALTER TABLE "users" ADD COLUMN "next_of_kin_phone" TEXT;
ALTER TABLE "users" ADD COLUMN "next_of_kin_email" TEXT;
ALTER TABLE "users" ADD COLUMN "next_of_kin_relationship" TEXT;
