-- AlterTable: Add transaction_pin_hash to users
ALTER TABLE "users" ADD COLUMN "transaction_pin_hash" TEXT;

-- CreateTable: Transfer
CREATE TABLE "transfers" (
    "id" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "recipient_type" TEXT NOT NULL,
    "recipient_user_id" TEXT,
    "recipient_name" TEXT,
    "recipient_bank" TEXT,
    "recipient_account" TEXT,
    "amount" NUMERIC(19,4) NOT NULL,
    "fee" NUMERIC(19,4) NOT NULL DEFAULT 0,
    "reference" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "description" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "transfers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "transfers_reference_key" ON "transfers"("reference");
CREATE INDEX "transfers_sender_id_idx" ON "transfers"("sender_id");
CREATE INDEX "transfers_reference_idx" ON "transfers"("reference");

-- AddForeignKey
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
