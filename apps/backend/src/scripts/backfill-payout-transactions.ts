import "dotenv/config";
import nodeCrypto from "node:crypto";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DRY_RUN = process.argv.includes("--dry-run");

/**
 * Backfill `circle_payout` and `loan_payout` transactions for disbursements
 * that were completed before payout transactions were recorded. Idempotent:
 * skips any request/loan that already has a matching transaction.
 */
async function backfillCirclePayouts() {
  const requests = await prisma.circlePayoutRequest.findMany({
    where: {
      OR: [{ status: "disbursed" }, { disbursementStatus: { in: ["completed", "pending"] } }],
    },
    include: { circleAccount: { include: { circle: true } } },
  });

  let created = 0;
  for (const r of requests) {
    const ref = r.disbursementRef || `CIRDIS-${nodeCrypto.randomBytes(8).toString("hex")}`;

    const existing = await prisma.transaction.findFirst({
      where: {
        userId: r.userId,
        type: "circle_payout",
        OR: [{ reference: ref }, { amount: r.amount, description: { contains: r.circleAccount.circle.name } }],
      },
    });
    if (existing) continue;

    const status = r.disbursementStatus === "pending" ? "pending" : "completed";
    console.log(
      `${DRY_RUN ? "[dry-run] " : ""}circle_payout user=${r.userId} amount=${r.amount} ref=${ref} status=${status}`,
    );
    if (!DRY_RUN) {
      await prisma.transaction.create({
        data: {
          userId: r.userId,
          type: "circle_payout",
          amount: r.amount,
          reference: ref,
          status,
          description: `Circle payout from ${r.circleAccount.circle.name} sent to your bank account`,
          createdAt: r.disbursedAt ?? undefined,
        },
      });
      created++;
    }
  }
  return created;
}

async function backfillLoanPayouts() {
  const loans = await prisma.loan.findMany({
    where: { status: { in: ["disbursed", "completed"] } },
  });

  let created = 0;
  for (const loan of loans) {
    const existing = await prisma.transaction.findFirst({
      where: { loanId: loan.id, type: "loan_payout" },
    });
    if (existing) continue;

    const ref = loan.disbursementRef || `LOANDIS-${nodeCrypto.randomBytes(8).toString("hex")}`;
    const amount = loan.disbursedAmount ?? loan.amount;
    const status = loan.disbursementStatus === "pending" ? "pending" : "completed";
    console.log(
      `${DRY_RUN ? "[dry-run] " : ""}loan_payout user=${loan.borrowerId} amount=${amount} ref=${ref} status=${status}`,
    );
    if (!DRY_RUN) {
      await prisma.transaction.create({
        data: {
          userId: loan.borrowerId,
          loanId: loan.id,
          type: "loan_payout",
          amount,
          reference: ref,
          status,
          description: "Loan disbursement sent to your bank account",
          createdAt: loan.disbursedAt ?? undefined,
        },
      });
      created++;
    }
  }
  return created;
}

async function main() {
  console.log(DRY_RUN ? "Running in DRY-RUN mode (no writes)\n" : "Backfilling payout transactions\n");
  const circle = await backfillCirclePayouts();
  const loan = await backfillLoanPayouts();
  console.log(`\nDone. Created ${circle} circle payout + ${loan} loan payout transaction(s).`);
}

main()
  .catch((err) => {
    console.error("Backfill failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
