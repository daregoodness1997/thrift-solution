-- AlterTable
ALTER TABLE "donations" ADD COLUMN "donor_email" TEXT;
ALTER TABLE "donations" ADD COLUMN "donor_name" TEXT;
ALTER TABLE "donations" ALTER COLUMN "user_id" DROP NOT NULL;

-- DropForeignKey
ALTER TABLE "donations" DROP CONSTRAINT "donations_user_id_fkey";

-- AddForeignKey
ALTER TABLE "donations" ADD CONSTRAINT "donations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
