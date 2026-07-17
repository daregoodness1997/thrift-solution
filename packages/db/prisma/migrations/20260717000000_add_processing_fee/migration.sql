-- Add configurable processing fee for circles and loans

ALTER TABLE "circles"
  ADD COLUMN IF NOT EXISTS "processing_fee_type" TEXT,
  ADD COLUMN IF NOT EXISTS "processing_fee_value" DOUBLE PRECISION;

ALTER TABLE "circle_accounts"
  ADD COLUMN IF NOT EXISTS "processing_fee" DOUBLE PRECISION NOT NULL DEFAULT 0;

ALTER TABLE "loans"
  ADD COLUMN IF NOT EXISTS "processing_fee_type" TEXT,
  ADD COLUMN IF NOT EXISTS "processing_fee_value" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "processing_fee" DOUBLE PRECISION;
