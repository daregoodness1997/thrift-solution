-- AlterTable
ALTER TABLE "users" ADD COLUMN "account_number" TEXT NOT NULL DEFAULT '';
ALTER TABLE "users" ADD COLUMN "account_tier" TEXT NOT NULL DEFAULT 'basic';

-- CreateIndex
CREATE UNIQUE INDEX "users_account_number_key" ON "users"("account_number");

-- Backfill account numbers for existing users
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) AS rn
  FROM users
  WHERE account_number = '' OR account_number IS NULL
)
UPDATE users
SET account_number = 'THR-' || LPAD(n.rn::TEXT, 6, '0')
FROM numbered n
WHERE users.id = n.id;
