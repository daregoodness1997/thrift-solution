import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

function toNum(value: unknown): number {
  if (value == null) return 0;
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  if (typeof value === "object" && value !== null && "toNumber" in value) {
    return (value as { toNumber(): number }).toNumber();
  }
  return Number(value);
}

const prisma = new PrismaClient();

function generateRef(prefix: string): string {
  const ts = Date.now();
  const rand = crypto.randomBytes(4).toString("hex");
  return `${prefix}-${ts}-${rand}`;
}

function calculateLoanTerms(amount: number, termMonths: number, annualRate: number = 5) {
  const monthlyRate = annualRate / 100 / 12;
  const monthlyPayment =
    monthlyRate > 0
      ? (amount * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
        (Math.pow(1 + monthlyRate, termMonths) - 1)
      : amount / termMonths;
  const totalRepayment = monthlyPayment * termMonths;
  return {
    monthlyPayment: Math.round(monthlyPayment * 100) / 100,
    totalRepayment: Math.round(totalRepayment * 100) / 100,
    interestRate: annualRate,
  };
}

function randomBetween(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

function randomIntBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function monthsAgo(n: number): Date {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d;
}

function weeksAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n * 7);
  return d;
}

function daysAfter(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

// ── Inline weekly interest job (mirrors runWeeklyInterestJob from @thrift/db) ──

async function calculateWeeklyInterestForAccount(circleAccountId: string) {
  const account = await prisma.circleAccount.findUnique({
    where: { id: circleAccountId },
    include: { circle: true },
  });
  if (!account || account.status !== "active") return null;

  const now = new Date();
  const lastCalc = account.lastInterestCalculation || account.startDate;
  const weeksElapsed = Math.floor(
    (now.getTime() - lastCalc.getTime()) / (7 * 24 * 60 * 60 * 1000)
  );

  if (weeksElapsed <= 0) return null;

  const weeklyInterest =
    (account.principalAmount * account.circle.interestRateAnnual) / 100 / 52;
  const interestToAdd = weeklyInterest * weeksElapsed;
  const roundedInterest = Math.round(interestToAdd * 100) / 100;

  if (roundedInterest <= 0) return null;

  return prisma.$transaction(async (tx) => {
    await tx.circleInterestLog.create({
      data: {
        circleAccountId,
        amount: roundedInterest,
        principalAtCalculation: account.principalAmount,
        annualRate: account.circle.interestRateAnnual,
      },
    });

    return tx.circleAccount.update({
      where: { id: circleAccountId },
      data: {
        interestEarned: { increment: roundedInterest },
        lastInterestCalculation: now,
      },
    });
  });
}

async function runWeeklyInterestJob() {
  const activeAccounts = await prisma.circleAccount.findMany({
    where: { status: "active" },
  });

  let processed = 0;
  let errors = 0;

  for (const account of activeAccounts) {
    try {
      await calculateWeeklyInterestForAccount(account.id);
      processed++;
    } catch (err) {
      console.error(`Interest calculation failed for account ${account.id}:`, err);
      errors++;
    }

    const refreshed = await prisma.circleAccount.findUnique({ where: { id: account.id } });
    if (refreshed && refreshed.status === "active" && new Date() >= refreshed.maturityDate) {
      try {
        await prisma.circleAccount.update({
          where: { id: account.id },
          data: { status: "matured" },
        });
      } catch (err) {
        console.error(`Failed to mark account ${account.id} as matured:`, err);
      }
    }
  }

  return { processed, errors, total: activeAccounts.length };
}

// ── Loan Simulation ──

async function simulateLoans(users: { id: string; name: string; email: string }[]) {
  console.log("=== LOAN EARNINGS SIMULATION ===\n");

  const loanPurposes = [
    "Business expansion",
    "School fees",
    "Medical expenses",
    "Home renovation",
    "Agricultural supplies",
    "Equipment purchase",
    "Wedding expenses",
    "Travel",
    "Inventory restocking",
    "Debt consolidation",
  ];

  const loanAmountRanges: [number, number][] = [
    [50000, 200000],
    [100000, 500000],
    [200000, 1000000],
    [500000, 2000000],
  ];

  const termOptions = [3, 6, 12, 18, 24];
  const statusOptions = ["completed", "disbursed", "approved"];

  let totalLoansCreated = 0;
  let totalTransactionsCreated = 0;

  for (const user of users) {
    const numLoans = randomIntBetween(1, 3);
    console.log(`Processing ${user.name} (${user.email}) - ${numLoans} loan(s)`);

    for (let i = 0; i < numLoans; i++) {
      const amountRange = loanAmountRanges[randomIntBetween(0, loanAmountRanges.length - 1)];
      const amount = randomBetween(amountRange[0], amountRange[1]);
      const termMonths = termOptions[randomIntBetween(0, termOptions.length - 1)];
      const annualRate = randomBetween(5, 15);
      const purpose = loanPurposes[randomIntBetween(0, loanPurposes.length - 1)];

      const { monthlyPayment, totalRepayment } = calculateLoanTerms(amount, termMonths, annualRate);

      const loanCreatedDate = monthsAgo(randomIntBetween(2, 8));
      const approvedDate = daysAfter(loanCreatedDate, randomIntBetween(1, 3));
      const disbursedDate = daysAfter(approvedDate, randomIntBetween(1, 7));

      const loan = await prisma.loan.create({
        data: {
          borrowerId: user.id,
          amount,
          interestRate: annualRate,
          termMonths,
          monthlyPayment,
          totalRepayment,
          purpose,
          status: "pending",
          createdAt: loanCreatedDate,
          updatedAt: loanCreatedDate,
        },
      });

      await prisma.loan.update({
        where: { id: loan.id },
        data: { status: "approved", approvedAt: approvedDate, updatedAt: approvedDate },
      });

      await prisma.transaction.create({
        data: {
          userId: user.id,
          type: "payout",
          amount,
          reference: generateRef("LOAN-DISB"),
          status: "completed",
          description: `Loan disbursement: ${purpose} (${termMonths} months @ ${annualRate}% APR)`,
          createdAt: disbursedDate,
        },
      });

      await prisma.loan.update({
        where: { id: loan.id },
        data: { status: "disbursed", disbursedAt: disbursedDate, updatedAt: disbursedDate },
      });

      totalTransactionsCreated++;

      let completedLoan = false;
      const finalStatus = statusOptions[randomIntBetween(0, statusOptions.length - 1)];

      if (finalStatus === "completed") {
        let currentDate = daysAfter(disbursedDate, 30);
        const completedDate = monthsAgo(randomIntBetween(0, 1));

        for (let month = 0; month < termMonths; month++) {
          if (currentDate >= completedDate) break;

          const repaidAmount = month === termMonths - 1
            ? totalRepayment - monthlyPayment * (termMonths - 1)
            : monthlyPayment;

          await prisma.transaction.create({
            data: {
              userId: user.id,
              type: "contribution",
              amount: Math.round(repaidAmount * 100) / 100,
              reference: generateRef("LOAN-REPAY"),
              status: "completed",
              description: `Loan repayment month ${month + 1}/${termMonths} for: ${purpose}`,
              createdAt: currentDate,
            },
          });

          totalTransactionsCreated++;
          currentDate = daysAfter(currentDate, 30);
        }

        await prisma.loan.update({
          where: { id: loan.id },
          data: {
            status: "completed",
            completedAt: currentDate > completedDate ? currentDate : completedDate,
            updatedAt: currentDate > completedDate ? currentDate : completedDate,
          },
        });

        completedLoan = true;
      } else if (finalStatus === "disbursed") {
        const monthsPaid = randomIntBetween(1, Math.max(1, termMonths - 2));
        let currentDate = daysAfter(disbursedDate, 30);

        for (let month = 0; month < monthsPaid; month++) {
          await prisma.transaction.create({
            data: {
              userId: user.id,
              type: "contribution",
              amount: Math.round(monthlyPayment * 100) / 100,
              reference: generateRef("LOAN-REPAY"),
              status: "completed",
              description: `Loan repayment month ${month + 1}/${termMonths} for: ${purpose}`,
              createdAt: currentDate,
            },
          });

          totalTransactionsCreated++;
          currentDate = daysAfter(currentDate, 30);
        }
      }

      totalLoansCreated++;

      const interestEarned = Math.round((totalRepayment - amount) * 100) / 100;
      console.log(
        `  Created loan: ${amount.toLocaleString()} NGN | ${termMonths}mo | ${annualRate}% APR | ` +
        `Monthly: ${monthlyPayment.toLocaleString()} NGN | Total: ${totalRepayment.toLocaleString()} NGN | ` +
        `Interest: ${interestEarned.toLocaleString()} NGN | Status: ${completedLoan ? "completed" : finalStatus}`
      );
    }
  }

  console.log(`\nLoans created: ${totalLoansCreated}`);
  console.log(`Transactions created: ${totalTransactionsCreated}\n`);
}

// ── Circle + Cron Job Test ──

async function simulateCirclesAndTestJob(users: { id: string; name: string; email: string }[]) {
  console.log("=== CIRCLE INTEREST CRON JOB TEST ===\n");

  let circles = await prisma.circle.findMany({ where: { deletedAt: null } });
  if (circles.length === 0) {
    console.log("No circles found. Seeding default circles...");
    const seedData = [
      { name: "Bronze Circle", description: "8% annual interest.", amount: 5000, durationMonths: 6, interestRateAnnual: 8, maxAccountsPerUser: 10, status: "active" },
      { name: "Silver Circle", description: "10% annual interest.", amount: 10000, durationMonths: 12, interestRateAnnual: 10, maxAccountsPerUser: 10, status: "active" },
      { name: "Gold Circle", description: "12% annual interest.", amount: 25000, durationMonths: 12, interestRateAnnual: 12, maxAccountsPerUser: 5, status: "active" },
      { name: "Platinum Circle", description: "15% annual interest.", amount: 50000, durationMonths: 12, interestRateAnnual: 15, maxAccountsPerUser: 3, status: "active" },
    ];
    for (const s of seedData) {
      await prisma.circle.create({ data: s });
    }
    circles = await prisma.circle.findMany({ where: { deletedAt: null } });
    console.log("Seeded " + circles.length + " circles.\n");
  }

  let accountsCreated = 0;
  let depositTxCreated = 0;

  console.log("Creating circle accounts with backdated start dates...\n");

  for (const user of users) {
    const numAccounts = randomIntBetween(1, Math.min(3, circles.length));

    for (let i = 0; i < numAccounts; i++) {
      const circle = circles[randomIntBetween(0, circles.length - 1)];
      const weeksAgoStart = randomIntBetween(2, 10);
      const startDate = weeksAgo(weeksAgoStart);

      const maturityDate = new Date(startDate);
      maturityDate.setMonth(maturityDate.getMonth() + circle.durationMonths);

      const isAlreadyMatured = randomIntBetween(1, 10) <= 2;

      const actualMaturity = isAlreadyMatured
        ? weeksAgo(randomIntBetween(1, 4))
        : maturityDate;

      await prisma.circleAccount.create({
        data: {
          circleId: circle.id,
          userId: user.id,
          principalAmount: circle.amount,
          interestEarned: 0,
          totalWithdrawn: 0,
          status: "active",
          startDate,
          maturityDate: actualMaturity,
          lastInterestCalculation: startDate,
          createdAt: startDate,
          updatedAt: startDate,
        },
      });

      await prisma.transaction.create({
        data: {
          userId: user.id,
          type: "circle_deposit",
          amount: circle.amount,
          reference: generateRef("CIRCLE-DEP"),
          status: "completed",
          description: "Deposit into " + circle.name,
          createdAt: startDate,
        },
      });

      accountsCreated++;
      depositTxCreated++;

      const expectedWeeklyInterest = (toNum(circle.amount) * toNum(circle.interestRateAnnual) / 100) / 52;
      const expectedTotalInterest = Math.round(expectedWeeklyInterest * weeksAgoStart * 100) / 100;

      console.log(
        "  " + user.name + " -> " + circle.name + " | " +
        Number(circle.amount).toLocaleString() + " NGN | " +
        "Started " + weeksAgoStart + "w ago | Rate: " + circle.interestRateAnnual + "% | " +
        "Maturity: " + (isAlreadyMatured ? "PAST (should mature)" : "future") + " | " +
        "Expected interest: ~" + expectedTotalInterest.toLocaleString() + " NGN"
      );
    }
  }

  console.log("\nCircle accounts created: " + accountsCreated);
  console.log("Deposit transactions created: " + depositTxCreated + "\n");

  console.log("Running weekly interest cron job...\n");
  const startTime = Date.now();
  const jobResult = await runWeeklyInterestJob();
  const elapsed = Date.now() - startTime;

  console.log(
    "Job completed in " + elapsed + "ms: processed=" + jobResult.processed +
    ", errors=" + jobResult.errors + ", total=" + jobResult.total + "\n"
  );

  const updatedAccounts = await prisma.circleAccount.findMany({
    where: { deletedAt: null },
    include: {
      circle: { select: { name: true, amount: true, interestRateAnnual: true } },
      user: { select: { name: true, email: true } },
      interestLogs: { orderBy: { calculatedAt: "desc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  let totalInterest = 0;
  let maturedCount = 0;

  console.log("=== INTEREST CALCULATION RESULTS ===\n");

  for (const acc of updatedAccounts) {
    const logCount = acc.interestLogs.length;
    totalInterest += toNum(acc.interestEarned);
    if (acc.status === "matured") maturedCount++;

    console.log(
      "  " + acc.user.name + " | " + acc.circle.name + " | " +
      "Principal: " + Number(acc.principalAmount).toLocaleString() + " NGN | " +
      "Interest earned: " + Number(acc.interestEarned).toLocaleString() + " NGN | " +
      "Logs: " + logCount + " | Status: " + acc.status
    );
  }

  console.log("\nTotal interest earned across all accounts: " + totalInterest.toLocaleString() + " NGN");
  console.log("Accounts matured: " + maturedCount);
  console.log("Total accounts: " + updatedAccounts.length + "\n");
}

// ── Main ──

async function main() {
  const users = await prisma.user.findMany({
    where: { deletedAt: null },
    select: { id: true, name: true, email: true },
  });

  if (users.length === 0) {
    console.log("No users found in the database. Create users first.");
    return;
  }

  console.log("Found " + users.length + " users.\n");

  await simulateLoans(users);
  await simulateCirclesAndTestJob(users);

  console.log("=== ALL SIMULATIONS COMPLETE ===\n");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
