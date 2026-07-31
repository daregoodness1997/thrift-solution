import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DRY_RUN = process.argv.includes("--dry-run");

/**
 * Backfill CirclePayoutRequest records for existing early withdrawals.
 *
 * Before the clearance-mode early withdrawal feature was introduced,
 * early withdrawals were processed immediately: a `circle_withdrawal`
 * transaction was created and the account status was set to `early_withdrawn`.
 *
 * This script creates CirclePayoutRequest records for those accounts so they
 * appear in the clearance management / my-clearance pages.
 * Records are marked as `approved` with the original transaction's createdAt
 * date so they reflect the historical withdrawal.
 */
async function backfillEarlyWithdrawals() {
  const earlyWithdrawnAccounts = await prisma.circleAccount.findMany({
    where: { status: "early_withdrawn" },
    include: { circle: { select: { name: true } } },
  });

  let created = 0;

  for (const account of earlyWithdrawnAccounts) {
    const existing = await prisma.circlePayoutRequest.findFirst({
      where: { circleAccountId: account.id },
    });
    if (existing) {
      console.log(`[skip] account ${account.id} — already has payout request`);
      continue;
    }

    const tx = await prisma.transaction.findFirst({
      where: {
        userId: account.userId,
        type: "circle_withdrawal",
        description: { contains: account.id },
      },
      orderBy: { createdAt: "desc" },
    });

    const amount = Number(account.principalAmount);
    const createdAt = tx?.createdAt ?? account.updatedAt;

    console.log(
      `${DRY_RUN ? "[dry-run] " : ""}early_withdrawal user=${account.userId} circle=${account.circle.name} amount=${amount} account=${account.id}`,
    );

    if (!DRY_RUN) {
      await prisma.circlePayoutRequest.create({
        data: {
          circleAccountId: account.id,
          userId: account.userId,
          amount,
          status: "approved",
          reviewedAt: createdAt,
          createdAt,
        },
      });
      created++;
    }
  }

  return created;
}

async function main() {
  console.log(DRY_RUN ? "Running in DRY-RUN mode (no writes)\n" : "Backfilling early withdrawal payout requests\n");
  const count = await backfillEarlyWithdrawals();
  console.log(`\nDone. Created ${count} early withdrawal payout request(s).`);
}

main()
  .catch((err) => {
    console.error("Backfill failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
