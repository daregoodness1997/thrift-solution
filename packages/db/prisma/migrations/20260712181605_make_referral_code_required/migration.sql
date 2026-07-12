/*
  Warnings:

  - You are about to drop the column `id_document` on the `kyc` table. All the data in the column will be lost.
  - Made the column `referral_code` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "kyc" DROP COLUMN "id_document",
ADD COLUMN     "id_document_url" TEXT,
ADD COLUMN     "reviewed_by" TEXT,
ADD COLUMN     "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Backfill existing users with NULL referral codes
UPDATE "users"
SET "referral_code" = UPPER(SUBSTRING(REGEXP_REPLACE("name", '[^A-Za-z]', '', 'g') FROM 1 FOR 6)) || '-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4))
WHERE "referral_code" IS NULL;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "referral_code" SET NOT NULL;

-- CreateTable
CREATE TABLE "kyc_documents" (
    "id" TEXT NOT NULL,
    "kyc_id" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_type" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "purpose" TEXT NOT NULL DEFAULT 'id_document',
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kyc_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kyc_audit_logs" (
    "id" TEXT NOT NULL,
    "kyc_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "old_status" TEXT,
    "new_status" TEXT,
    "notes" TEXT,
    "performed_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kyc_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "kyc_documents_kyc_id_idx" ON "kyc_documents"("kyc_id");

-- CreateIndex
CREATE INDEX "kyc_audit_logs_kyc_id_idx" ON "kyc_audit_logs"("kyc_id");

-- CreateIndex
CREATE INDEX "kyc_audit_logs_created_at_idx" ON "kyc_audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "kyc_status_idx" ON "kyc"("status");

-- AddForeignKey
ALTER TABLE "kyc_documents" ADD CONSTRAINT "kyc_documents_kyc_id_fkey" FOREIGN KEY ("kyc_id") REFERENCES "kyc"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kyc_audit_logs" ADD CONSTRAINT "kyc_audit_logs_kyc_id_fkey" FOREIGN KEY ("kyc_id") REFERENCES "kyc"("id") ON DELETE CASCADE ON UPDATE CASCADE;
