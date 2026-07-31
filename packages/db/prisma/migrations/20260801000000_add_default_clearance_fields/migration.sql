ALTER TABLE "circle_defaults"
  ADD COLUMN "cleared_by" VARCHAR(255) NULL,
  ADD COLUMN "clearance_proof_url" VARCHAR(500) NULL,
  ADD COLUMN "clearance_note" TEXT NULL;