-- Add max_subscribers column to circles
ALTER TABLE "circles" ADD COLUMN IF NOT EXISTS "max_subscribers" INTEGER;
