-- Alter User: BVN/NIN + registration progress tracking
ALTER TABLE "users" ADD COLUMN "bvn" TEXT;
ALTER TABLE "users" ADD COLUMN "nin" TEXT;
ALTER TABLE "users" ADD COLUMN "registration_step" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "users" ADD COLUMN "registration_fee_paid" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN "registration_completed_at" TIMESTAMP(3);

-- Alter Kyc: store verified identity + CreditChek payloads
ALTER TABLE "kyc" ADD COLUMN "bvn" TEXT;
ALTER TABLE "kyc" ADD COLUMN "nin" TEXT;
ALTER TABLE "kyc" ADD COLUMN "credit_report" JSONB;
ALTER TABLE "kyc" ADD COLUMN "verification_data" JSONB;
