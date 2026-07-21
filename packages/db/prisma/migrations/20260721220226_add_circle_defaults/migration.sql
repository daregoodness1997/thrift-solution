-- AlterTable
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='circles' AND column_name='default_penalty_type') THEN
    ALTER TABLE "circles" ADD COLUMN "default_penalty_type" TEXT NOT NULL DEFAULT 'percent';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='circles' AND column_name='default_penalty_value') THEN
    ALTER TABLE "circles" ADD COLUMN "default_penalty_value" DOUBLE PRECISION NOT NULL DEFAULT 100;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='circles' AND column_name='initial_weeks_count') THEN
    ALTER TABLE "circles" ADD COLUMN "initial_weeks_count" INTEGER NOT NULL DEFAULT 3;
  END IF;
END $$;

-- CreateTable
CREATE TABLE "circle_addons" (
    "id" TEXT NOT NULL,
    "circle_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "estimated_cost" DOUBLE PRECISION NOT NULL,
    "image_url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "circle_addons_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "circle_addons_circle_id_idx" ON "circle_addons"("circle_id");

-- CreateIndex
CREATE INDEX "circle_addons_status_idx" ON "circle_addons"("status");

-- AddForeignKey
ALTER TABLE "circle_addons" ADD CONSTRAINT "circle_addons_circle_id_fkey" FOREIGN KEY ("circle_id") REFERENCES "circles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
