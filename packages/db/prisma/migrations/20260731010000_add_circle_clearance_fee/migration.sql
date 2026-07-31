-- AlterTable: Add configurable clearance fee charged per circle account when
-- a member comes for clearance after maturity (clearance payout mode only).
ALTER TABLE "circles"
  ADD COLUMN IF NOT EXISTS "clearance_fee_type" TEXT,
  ADD COLUMN IF NOT EXISTS "clearance_fee_value" DECIMAL(19,4);

-- AlterTable: Track the clearance fee charged per circle account.
ALTER TABLE "circle_accounts"
  ADD COLUMN IF NOT EXISTS "clearance_fee" DECIMAL(19,4) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "clearance_fee_paid_at" TIMESTAMP(3);
