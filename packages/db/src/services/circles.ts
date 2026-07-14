import nodeCrypto from "node:crypto";
import { prisma } from "./prisma";
import { getWalletBalance } from "./wallet";

export async function createCircle(data: {
  name: string;
  description?: string;
  amount: number;
  durationMonths: number;
  interestRateAnnual: number;
  maxAccountsPerUser?: number;
  autoPayout?: boolean;
}) {
  return prisma.circle.create({ data });
}

export async function getCircleById(id: string) {
  return prisma.circle.findUnique({
    where: { id },
    include: { _count: { select: { accounts: true } } },
  });
}

export async function getAllCircles(params: {
  page?: number;
  limit?: number;
  status?: string;
}) {
  const { page = 1, limit = 20, status } = params;
  const where: Record<string, unknown> = {};
  if (status) where.status = status;

  const [items, total] = await Promise.all([
    prisma.circle.findMany({
      where,
      include: { _count: { select: { accounts: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.circle.count({ where }),
  ]);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getActiveCircles() {
  return prisma.circle.findMany({
    where: { status: "active" },
    include: { _count: { select: { accounts: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function updateCircle(id: string, data: {
  name?: string;
  description?: string;
  amount?: number;
  durationMonths?: number;
  interestRateAnnual?: number;
  maxAccountsPerUser?: number;
  autoPayout?: boolean;
  status?: string;
}) {
  return prisma.circle.update({
    where: { id },
    data,
    include: { _count: { select: { accounts: true } } },
  });
}

export async function openCircleAccount(circleId: string, userId: string) {
  const circle = await prisma.circle.findUnique({ where: { id: circleId } });
  if (!circle) throw new Error("Circle not found");
  if (circle.status !== "active") throw new Error("Circle is not active");

  const userAccounts = await prisma.circleAccount.count({
    where: { circleId, userId, status: "active" },
  });
  if (userAccounts >= circle.maxAccountsPerUser) {
    throw new Error(`Maximum ${circle.maxAccountsPerUser} active accounts per circle reached`);
  }

  const balance = await getWalletBalance(userId);
  if (balance < circle.amount) {
    throw new Error(`Insufficient wallet balance. Required: ${circle.amount}, Available: ${balance}`);
  }

  const now = new Date();
  const maturityDate = new Date(now);
  maturityDate.setMonth(maturityDate.getMonth() + circle.durationMonths);

  return prisma.$transaction(async (tx) => {
    const circleAccount = await tx.circleAccount.create({
      data: {
        circleId,
        userId,
        principalAmount: circle.amount,
        startDate: now,
        maturityDate,
        lastInterestCalculation: now,
      },
      include: {
        circle: { select: { id: true, name: true, amount: true, durationMonths: true, interestRateAnnual: true } },
      },
    });

    const reference = `CIRCLE-DEPOSIT-${circleAccount.id}-${Date.now()}-${nodeCrypto.randomBytes(4).toString("hex")}`;
    await tx.transaction.create({
      data: {
        userId,
        type: "circle_deposit",
        amount: circle.amount,
        reference,
        status: "completed",
        description: `Deposit into ${circle.name} [${circleAccount.id}]`,
      },
    });

    return circleAccount;
  });
}

export async function getCircleAccountById(id: string) {
  return prisma.circleAccount.findUnique({
    where: { id },
    include: {
      circle: { select: { id: true, name: true, amount: true, durationMonths: true, interestRateAnnual: true } },
      user: { select: { id: true, name: true, email: true } },
      interestLogs: { orderBy: { calculatedAt: "desc" }, take: 50 },
    },
  });
}

export async function getCircleAccountsByUser(userId: string, opts?: { page?: number; limit?: number; status?: string }) {
  const page = opts?.page ?? 1;
  const limit = opts?.limit ?? 20;
  const where: Record<string, unknown> = { userId };
  if (opts?.status) where.status = opts.status;

  const [items, total, allAccounts] = await Promise.all([
    prisma.circleAccount.findMany({
      where,
      include: {
        circle: { select: { id: true, name: true, amount: true, durationMonths: true, interestRateAnnual: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.circleAccount.count({ where }),
    prisma.circleAccount.findMany({
      where: { userId },
      select: { status: true, principalAmount: true, interestEarned: true },
    }),
  ]);

  const stats = {
    total: allAccounts.length,
    activeCount: allAccounts.filter((a) => a.status === "active").length,
    maturedCount: allAccounts.filter((a) => a.status === "matured").length,
    totalInvested: allAccounts.reduce((sum, a) => sum + a.principalAmount, 0),
    totalInterest: allAccounts.reduce((sum, a) => sum + a.interestEarned, 0),
    totalMaturityValue: allAccounts.reduce((sum, a) => sum + a.principalAmount + a.interestEarned, 0),
  };

  return { items, total, page, limit, totalPages: Math.ceil(total / limit), stats };
}

export async function getCircleAccountTransactions(accountId: string, userId: string) {
  const account = await prisma.circleAccount.findUnique({ where: { id: accountId } });
  if (!account) throw new Error("Circle account not found");
  if (account.userId !== userId) throw new Error("Not your account");

  return prisma.transaction.findMany({
    where: {
      userId,
      type: { in: ["circle_deposit", "circle_withdrawal", "circle_interest"] },
      OR: [
        { description: { contains: accountId } },
        { reference: { contains: accountId } },
      ],
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getActiveCircleAccountsByUser(userId: string) {
  return prisma.circleAccount.findMany({
    where: { userId, status: "active" },
    include: {
      circle: { select: { id: true, name: true, amount: true, durationMonths: true, interestRateAnnual: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getAllActiveCircleAccounts() {
  return prisma.circleAccount.findMany({
    where: { status: "active" },
    include: {
      circle: { select: { id: true, name: true, amount: true, interestRateAnnual: true } },
    },
  });
}

export async function updateCircleAccount(id: string, data: {
  interestEarned?: number;
  totalWithdrawn?: number;
  status?: string;
  lastInterestCalculation?: Date;
}) {
  return prisma.circleAccount.update({
    where: { id },
    data,
    include: {
      circle: { select: { id: true, name: true, amount: true, durationMonths: true, interestRateAnnual: true } },
    },
  });
}

export async function earlyWithdrawCircleAccount(id: string, userId: string) {
  const account = await prisma.circleAccount.findUnique({ where: { id } });
  if (!account) throw new Error("Circle account not found");
  if (account.userId !== userId) throw new Error("Not your account");
  if (account.status !== "active") throw new Error("Account is not active");

  return prisma.$transaction(async (tx) => {
    const reference = `CIRCLE-WITHDRAWAL-${id}-${Date.now()}-${nodeCrypto.randomBytes(4).toString("hex")}`;
    await tx.transaction.create({
      data: {
        userId,
        type: "circle_withdrawal",
        amount: account.principalAmount,
        reference,
        status: "completed",
        description: `Early circle withdrawal (interest forfeited) [${id}]`,
      },
    });

    return tx.circleAccount.update({
      where: { id },
      data: {
        status: "early_withdrawn",
        totalWithdrawn: account.principalAmount,
        interestEarned: 0,
      },
      include: {
        circle: { select: { id: true, name: true, amount: true, durationMonths: true, interestRateAnnual: true } },
      },
    });
  });
}

export async function matureCircleAccount(id: string, userId: string) {
  const account = await prisma.circleAccount.findUnique({
    where: { id },
    include: { circle: true },
  });
  if (!account) throw new Error("Circle account not found");
  if (account.userId !== userId) throw new Error("Not your account");
  if (account.status !== "active") throw new Error("Account is not active");

  const now = new Date();
  if (now < account.maturityDate) {
    throw new Error(`Account matures on ${account.maturityDate.toISOString()}`);
  }

  if (!account.circle.autoPayout) {
    const existingPending = await prisma.circlePayoutRequest.findFirst({
      where: { circleAccountId: id, status: "pending" },
    });
    if (existingPending) {
      throw new Error("A payout request is already pending for this account");
    }

    const request = await prisma.circlePayoutRequest.create({
      data: {
        circleAccountId: id,
        userId,
        amount: account.principalAmount + account.interestEarned,
      },
    });

    return { type: "payout_request" as const, request };
  }

  const totalPayout = account.principalAmount + account.interestEarned;

  return prisma.$transaction(async (tx) => {
    const reference = `CIRCLE-MATURITY-${id}-${Date.now()}-${nodeCrypto.randomBytes(4).toString("hex")}`;
    await tx.transaction.create({
      data: {
        userId,
        type: "circle_withdrawal",
        amount: totalPayout,
        reference,
        status: "completed",
        description: `Circle maturity payout (principal + interest) [${id}]`,
      },
    });

    return tx.circleAccount.update({
      where: { id },
      data: {
        status: "withdrawn",
        totalWithdrawn: totalPayout,
      },
      include: {
        circle: { select: { id: true, name: true, amount: true, durationMonths: true, interestRateAnnual: true } },
      },
    });
  });
}

interface InterestWeek {
  week: number;
  date: string;
  daysFromStart: number;
  interestThisWeek: number;
  cumulativeInterest: number;
  totalValue: number;
  annualRate: number;
  principal: number;
}

export async function getCircleAccountInterestBreakdown(accountId: string): Promise<InterestWeek[]> {
  const account = await prisma.circleAccount.findUnique({
    where: { id: accountId },
    include: { circle: true },
  });
  if (!account) return [];

  const { principalAmount, startDate, maturityDate, interestEarned, circle } = account;
  const weeklyRate = circle.interestRateAnnual / 100 / 52;
  const weeklyInterest = Math.round(principalAmount * weeklyRate * 100) / 100;

  const start = new Date(startDate);
  const maturity = new Date(maturityDate);
  const totalWeeks = Math.ceil((maturity.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000));

  const weeks: InterestWeek[] = [];
  let cumulative = 0;

  for (let w = 1; w <= totalWeeks; w++) {
    const weekDate = new Date(start.getTime() + w * 7 * 24 * 60 * 60 * 1000);
    cumulative += weeklyInterest;
    const roundedCumulative = Math.round(cumulative * 100) / 100;

    weeks.push({
      week: w,
      date: weekDate.toISOString(),
      daysFromStart: w * 7,
      interestThisWeek: weeklyInterest,
      cumulativeInterest: roundedCumulative,
      totalValue: Math.round((principalAmount + roundedCumulative) * 100) / 100,
      annualRate: circle.interestRateAnnual,
      principal: principalAmount,
    });
  }

  return weeks;
}

export async function calculateWeeklyInterestForAccount(circleAccountId: string) {
  const account = await prisma.circleAccount.findUnique({
    where: { id: circleAccountId },
    include: { circle: true },
  });
  if (!account || account.status !== "active") return null;

  const now = new Date();
  const lastCalc = account.lastInterestCalculation || account.startDate;
  const weeksElapsed = Math.floor((now.getTime() - lastCalc.getTime()) / (7 * 24 * 60 * 60 * 1000));

  if (weeksElapsed <= 0) return null;

  const weeklyInterest = account.principalAmount * (account.circle.interestRateAnnual / 100) / 52;
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

export async function runWeeklyInterestJob() {
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

export async function getCirclePayoutRequests(params: {
  page?: number;
  limit?: number;
  status?: string;
}) {
  const { page = 1, limit = 20, status } = params;
  const where: Record<string, unknown> = {};
  if (status) where.status = status;

  const [items, total] = await Promise.all([
    prisma.circlePayoutRequest.findMany({
      where,
      include: {
        circleAccount: {
          include: {
            circle: { select: { id: true, name: true, amount: true, durationMonths: true, interestRateAnnual: true } },
          },
        },
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.circlePayoutRequest.count({ where }),
  ]);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getCirclePayoutRequestsByUser(userId: string, params?: {
  page?: number;
  limit?: number;
  status?: string;
}) {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 20;
  const where: Record<string, unknown> = { userId };
  if (params?.status) where.status = params.status;

  const [items, total] = await Promise.all([
    prisma.circlePayoutRequest.findMany({
      where,
      include: {
        circleAccount: {
          include: {
            circle: { select: { id: true, name: true, amount: true, durationMonths: true, interestRateAnnual: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.circlePayoutRequest.count({ where }),
  ]);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function approveCirclePayoutRequest(requestId: string, reviewerId: string) {
  const request = await prisma.circlePayoutRequest.findUnique({
    where: { id: requestId },
    include: { circleAccount: true },
  });
  if (!request) throw new Error("Payout request not found");
  if (request.status !== "pending") throw new Error("Request is not pending");

  return prisma.$transaction(async (tx) => {
    const reference = `CIRCLE-PAYOUT-${request.circleAccountId}-${Date.now()}-${nodeCrypto.randomBytes(4).toString("hex")}`;
    await tx.transaction.create({
      data: {
        userId: request.userId,
        type: "circle_withdrawal",
        amount: request.amount,
        reference,
        status: "completed",
        description: `Circle maturity payout (approved) [${request.circleAccountId}]`,
      },
    });

    await tx.circleAccount.update({
      where: { id: request.circleAccountId },
      data: {
        status: "withdrawn",
        totalWithdrawn: request.circleAccount.principalAmount + request.circleAccount.interestEarned,
      },
    });

    return tx.circlePayoutRequest.update({
      where: { id: requestId },
      data: {
        status: "approved",
        reviewedById: reviewerId,
        reviewedAt: new Date(),
      },
    });
  });
}

export async function declineCirclePayoutRequest(requestId: string, reviewerId: string, note?: string) {
  const request = await prisma.circlePayoutRequest.findUnique({ where: { id: requestId } });
  if (!request) throw new Error("Payout request not found");
  if (request.status !== "pending") throw new Error("Request is not pending");

  return prisma.circlePayoutRequest.update({
    where: { id: requestId },
    data: {
      status: "declined",
      reviewedById: reviewerId,
      reviewedAt: new Date(),
      note: note || undefined,
    },
  });
}
