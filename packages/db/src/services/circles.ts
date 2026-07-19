import nodeCrypto from "node:crypto";
import { prisma } from "./prisma";
import { getWalletBalance } from "./wallet";

export async function createCircle(data: {
  name: string;
  description?: string;
  cycleType?: string;
  amount: number;
  weeklyAmount?: number;
  totalWeeks?: number;
  durationMonths: number;
  interestRateAnnual: number;
  maxAccountsPerUser?: number;
  maxSubscribers?: number;
  autoPayout?: boolean;
  payoutMode?: string;
  blockPayoutOnDefault?: boolean;
  processingFeeType?: "fixed" | "percent" | null;
  processingFeeValue?: number | null;
}) {
  const cycleType = data.cycleType === "weekly_contribution" ? "weekly_contribution" : "deposit";
  if (cycleType === "weekly_contribution") {
    if (!data.weeklyAmount || data.weeklyAmount <= 0) {
      throw new Error("weeklyAmount is required for weekly_contribution cycles");
    }
    if (!data.totalWeeks || data.totalWeeks <= 0) {
      throw new Error("totalWeeks is required for weekly_contribution cycles");
    }
  }
  const payoutMode = resolvePayoutMode(data.payoutMode, data.autoPayout);
  const { processingFeeType, processingFeeValue } = resolveProcessingFee(data.processingFeeType, data.processingFeeValue);
  return prisma.circle.create({
    data: {
      name: data.name,
      description: data.description,
      cycleType,
      amount: data.amount,
      weeklyAmount: data.weeklyAmount,
      totalWeeks: data.totalWeeks,
      durationMonths: data.durationMonths,
      interestRateAnnual: data.interestRateAnnual,
      maxAccountsPerUser: data.maxAccountsPerUser,
      maxSubscribers: data.maxSubscribers,
      autoPayout: payoutMode === "auto",
      payoutMode,
      blockPayoutOnDefault: data.blockPayoutOnDefault,
      processingFeeType,
      processingFeeValue,
    },
  });
}

export function resolveProcessingFee(
  type?: "fixed" | "percent" | string | null,
  value?: number | string | null,
): { processingFeeType: "fixed" | "percent" | null; processingFeeValue: number | null } {
  if (type !== "fixed" && type !== "percent") return { processingFeeType: null, processingFeeValue: null };
  const numeric = typeof value === "string" ? Number(value) : value;
  if (numeric == null || isNaN(numeric) || numeric < 0) return { processingFeeType: null, processingFeeValue: null };
  return { processingFeeType: type, processingFeeValue: Math.round(numeric * 100) / 100 };
}

export function computeProcessingFee(
  type: "fixed" | "percent" | null | undefined,
  value: number | null | undefined,
  baseAmount: number,
): number {
  if (type !== "fixed" && type !== "percent") return 0;
  if (value == null || value <= 0) return 0;
  const fee = type === "fixed" ? value : baseAmount * (value / 100);
  return Math.round(fee * 100) / 100;
}

function resolvePayoutMode(payoutMode?: string, autoPayout?: boolean): string {
  if (payoutMode === "auto" || payoutMode === "clearance") return payoutMode;
  if (autoPayout === true) return "auto";
  if (autoPayout === false) return "clearance";
  return "auto";
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
  cycleType?: string;
  amount?: number;
  weeklyAmount?: number;
  totalWeeks?: number;
  durationMonths?: number;
  interestRateAnnual?: number;
  maxAccountsPerUser?: number;
  maxSubscribers?: number;
  autoPayout?: boolean;
  payoutMode?: string;
  blockPayoutOnDefault?: boolean;
  processingFeeType?: "fixed" | "percent" | null;
  processingFeeValue?: number | null;
  status?: string;
}) {
  const patch: Record<string, unknown> = { ...data };
  if (data.payoutMode === "auto" || data.payoutMode === "clearance") {
    patch.payoutMode = data.payoutMode;
    patch.autoPayout = data.payoutMode === "auto";
  } else if (data.autoPayout !== undefined) {
    patch.autoPayout = data.autoPayout;
    patch.payoutMode = data.autoPayout ? "auto" : "clearance";
  }
  if (data.processingFeeType !== undefined || data.processingFeeValue !== undefined) {
    const { processingFeeType, processingFeeValue } = resolveProcessingFee(
      data.processingFeeType ?? null,
      data.processingFeeValue ?? null,
    );
    patch.processingFeeType = processingFeeType;
    patch.processingFeeValue = processingFeeValue;
  }
  return prisma.circle.update({
    where: { id },
    data: patch,
    include: { _count: { select: { accounts: true } } },
  });
}

export async function openCircleAccount(circleId: string, userId: string, fundedByTxnRef?: string) {
  const circle = await prisma.circle.findUnique({ where: { id: circleId } });
  if (!circle) throw new Error("Circle not found");
  if (circle.status !== "active") throw new Error("Circle is not active");

  const userAccounts = await prisma.circleAccount.count({
    where: { circleId, userId, status: "active" },
  });
  if (circle.maxAccountsPerUser > 0 && userAccounts >= circle.maxAccountsPerUser) {
    throw new Error(`Maximum ${circle.maxAccountsPerUser} active accounts per circle reached`);
  }

  if (circle.maxSubscribers != null && circle.maxSubscribers > 0) {
    const totalAccounts = await prisma.circleAccount.count({
      where: { circleId, status: { in: ["active", "matured"] } },
    });
    if (totalAccounts >= circle.maxSubscribers) {
      throw new Error(`Circle is full. Maximum ${circle.maxSubscribers} subscribers reached`);
    }
  }

  const isWeekly = circle.cycleType === "weekly_contribution";
  const initialDebit = isWeekly ? (circle.weeklyAmount ?? 0) : circle.amount;

  const processingFee = computeProcessingFee(
    (circle.processingFeeType as "fixed" | "percent" | null | undefined),
    circle.processingFeeValue,
    initialDebit,
  );
  const totalRequired = Math.round((initialDebit + processingFee) * 100) / 100;

  const balance = await getWalletBalance(userId);
  if (balance < totalRequired) {
    throw new Error(`Insufficient wallet balance. Required: ${totalRequired}, Available: ${balance}`);
  }

  const now = new Date();
  const maturityDate = new Date(now);
  if (isWeekly && circle.totalWeeks) {
    maturityDate.setDate(maturityDate.getDate() + circle.totalWeeks * 7);
  } else {
    maturityDate.setMonth(maturityDate.getMonth() + circle.durationMonths);
  }

  return prisma.$transaction(async (tx) => {
    const circleAccount = await tx.circleAccount.create({
      data: {
        circleId,
        userId,
        principalAmount: initialDebit,
        processingFee,
        weeksContributed: isWeekly ? 1 : 0,
        lastContributionAttempt: isWeekly ? now : null,
        startDate: now,
        maturityDate,
        lastInterestCalculation: now,
        fundedByTxnRef: fundedByTxnRef || null,
      },
      include: {
        circle: { select: { id: true, name: true, amount: true, durationMonths: true, interestRateAnnual: true } },
      },
    });

    const type = isWeekly ? "circle_contribution" : "circle_deposit";
    const reference = `CIRCLE-${isWeekly ? "CONTRIB" : "DEPOSIT"}-${circleAccount.id}-${Date.now()}-${nodeCrypto.randomBytes(4).toString("hex")}`;
    const txn = await tx.transaction.create({
      data: {
        userId,
        type,
        amount: initialDebit,
        reference,
        status: "completed",
        description: `${isWeekly ? "Week 1 contribution" : "Deposit"} into ${circle.name} [${circleAccount.id}]`,
      },
    });

    if (processingFee > 0) {
      const feeReference = `CIRCLE-FEE-${circleAccount.id}-${Date.now()}-${nodeCrypto.randomBytes(4).toString("hex")}`;
      await tx.transaction.create({
        data: {
          userId,
          type: "circle_processing_fee",
          amount: processingFee,
          reference: feeReference,
          status: "completed",
          description: `Processing fee for ${circle.name} [${circleAccount.id}]`,
        },
      });
    }

    if (isWeekly) {
      await tx.circleContribution.create({
        data: {
          circleAccountId: circleAccount.id,
          userId,
          weekNumber: 1,
          amount: initialDebit,
          type: "weekly",
          transactionId: txn.id,
        },
      });
    }

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
        circle: { select: { id: true, name: true, cycleType: true, amount: true, weeklyAmount: true, totalWeeks: true, durationMonths: true, interestRateAnnual: true, autoPayout: true, payoutMode: true } },
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

export async function getOutstandingDefaults(circleAccountId: string) {
  return prisma.circleDefault.findMany({
    where: { circleAccountId, status: "outstanding" },
    orderBy: { weekNumber: "asc" },
  });
}

async function assertNoBlockingDefaults(account: { id: string; circle: { blockPayoutOnDefault: boolean } }) {
  if (!account.circle.blockPayoutOnDefault) return;
  const outstanding = await prisma.circleDefault.count({
    where: { circleAccountId: account.id, status: "outstanding" },
  });
  if (outstanding > 0) {
    throw new Error(
      `Payout blocked: ${outstanding} outstanding default(s) must be cleared before this account can be paid out`,
    );
  }
}

export async function matureCircleAccount(id: string, userId: string) {
  const account = await prisma.circleAccount.findUnique({
    where: { id },
    include: { circle: true },
  });
  if (!account) throw new Error("Circle account not found");
  if (account.userId !== userId) throw new Error("Not your account");
  if (account.status !== "active" && account.status !== "matured") throw new Error("Account is not active");

  await assertNoBlockingDefaults(account);

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
    include: { circleAccount: { include: { circle: true } } },
  });
  if (!request) throw new Error("Payout request not found");
  if (request.status !== "pending") throw new Error("Request is not pending");

  await assertNoBlockingDefaults(request.circleAccount);

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

export async function clearCirclePayoutRequest(requestId: string, adminId: string, note?: string) {
  const request = await prisma.circlePayoutRequest.findUnique({
    where: { id: requestId },
    include: { circleAccount: { include: { circle: true } } },
  });
  if (!request) throw new Error("Payout request not found");
  if (request.status !== "pending") throw new Error("Only pending requests can be cleared");

  await assertNoBlockingDefaults(request.circleAccount);

  return prisma.circlePayoutRequest.update({
    where: { id: requestId },
    data: {
      status: "cleared",
      clearedById: adminId,
      clearedAt: new Date(),
      clearanceNote: note || undefined,
    },
    include: {
      circleAccount: { include: { circle: { select: { id: true, name: true } } } },
      user: { select: { id: true, name: true, email: true } },
    },
  });
}

async function finalizeDisbursedAccount(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  request: { circleAccountId: string; circleAccount: { principalAmount: number; interestEarned: number } },
) {
  await tx.circleAccount.update({
    where: { id: request.circleAccountId },
    data: {
      status: "withdrawn",
      totalWithdrawn: request.circleAccount.principalAmount + request.circleAccount.interestEarned,
    },
  });
}

export async function disburseCirclePayoutRequestViaFlutterwave(
  requestId: string,
  adminId: string,
  transfer: (params: { accountNumber: string; bankCode: string; amount: number; reference: string }) => Promise<{ status: string; providerRef?: string }>,
) {
  const request = await prisma.circlePayoutRequest.findUnique({
    where: { id: requestId },
    include: { circleAccount: { include: { circle: true } }, user: true },
  });
  if (!request) throw new Error("Payout request not found");
  if (request.status === "disbursing") throw new Error("A disbursement for this request is already in progress");
  if (request.status !== "cleared") throw new Error("Request must be cleared before disbursement");
  if (request.disbursementStatus === "completed") throw new Error("Request is already disbursed");

  const { user } = request;
  if (!user.bankAccountNumber || !user.bankCode) {
    throw new Error("User has no saved bank account number and bank code for transfer");
  }

  const reference = `CIRDIS-${Date.now().toString(36)}-${nodeCrypto.randomBytes(6).toString("hex")}`;

  let result: { status: string; providerRef?: string };
  try {
    result = await transfer({
      accountNumber: user.bankAccountNumber,
      bankCode: user.bankCode,
      amount: request.amount,
      reference,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Transfer failed";
    await prisma.circlePayoutRequest.update({
      where: { id: requestId },
      data: {
        disbursementMethod: "flutterwave",
        disbursementStatus: "failed",
        disbursementRef: reference,
        disbursementNote: message,
      },
    });
    throw new Error(`Disbursement failed: ${message}`);
  }

  const accepted = result.status === "completed" || result.status === "pending";
  const txnStatus = result.status === "completed" ? "completed" : result.status === "pending" ? "pending" : "failed";

  return prisma.$transaction(async (tx) => {
    // Only finalize (mark account withdrawn) once the transfer is CONFIRMED
    // completed. Pending transfers can still fail, so we wait for the
    // `transfer` webhook to finalize via reconcileCirclePayoutDisbursementByRef.
    if (result.status === "completed") {
      await finalizeDisbursedAccount(tx, request);
    }
    await tx.transaction.create({
      data: {
        userId: request.userId,
        type: "circle_payout",
        amount: request.amount,
        reference,
        status: txnStatus,
        description: `Circle payout from ${request.circleAccount.circle.name} sent to your bank account`,
      },
    });
    return tx.circlePayoutRequest.update({
      where: { id: requestId },
      data: {
        status: result.status === "completed" ? "disbursed" : accepted ? "disbursing" : "disbursement_failed",
        disbursementMethod: "flutterwave",
        disbursementStatus: txnStatus,
        disbursementRef: result.providerRef || reference,
        disbursedById: adminId,
        disbursedAt: new Date(),
      },
    });
  });
}

export async function markCirclePayoutRequestDisbursed(
  requestId: string,
  adminId: string,
  data: { proofUrl?: string; note?: string; reference?: string },
) {
  const request = await prisma.circlePayoutRequest.findUnique({
    where: { id: requestId },
    include: { circleAccount: { include: { circle: true } } },
  });
  if (!request) throw new Error("Payout request not found");
  if (request.status !== "cleared") throw new Error("Request must be cleared before it can be marked disbursed");
  if (!data.proofUrl && !data.reference) {
    throw new Error("Provide a proof URL or a transfer reference");
  }

  const reference =
    data.reference || `CIRDIS-${Date.now().toString(36)}-${nodeCrypto.randomBytes(6).toString("hex")}`;

  return prisma.$transaction(async (tx) => {
    await finalizeDisbursedAccount(tx, request);
    await tx.transaction.create({
      data: {
        userId: request.userId,
        type: "circle_payout",
        amount: request.amount,
        reference,
        status: "completed",
        description: `Circle payout from ${request.circleAccount.circle.name} sent to your bank account`,
      },
    });
    return tx.circlePayoutRequest.update({
      where: { id: requestId },
      data: {
        status: "disbursed",
        disbursementMethod: "manual",
        disbursementStatus: "completed",
        disbursementRef: reference,
        disbursementProofUrl: data.proofUrl || undefined,
        disbursementNote: data.note || undefined,
        disbursedById: adminId,
        disbursedAt: new Date(),
      },
    });
  });
}

/**
 * Reconcile a circle payout disbursement transfer from a Flutterwave `transfer`
 * webhook. Matches the payout request by its stored `disbursementRef` and
 * updates the disbursement status. Returns true when a match was found.
 */
export async function reconcileCirclePayoutDisbursementByRef(
  reference: string,
  status: "completed" | "failed",
): Promise<boolean> {
  const request = await prisma.circlePayoutRequest.findFirst({
    where: { disbursementRef: reference, disbursementMethod: "flutterwave" },
    include: { circleAccount: true },
  });
  if (!request) return false;
  if (request.disbursementStatus === status) return true;

  return prisma.$transaction(async (tx) => {
    if (status === "completed" && request.circleAccount.status !== "withdrawn") {
      await finalizeDisbursedAccount(tx, request);
    }
    await tx.circlePayoutRequest.update({
      where: { id: request.id },
      data: {
        disbursementStatus: status,
        // A failed transfer returns the request to `cleared` so an admin can
        // retry; a completed transfer finalizes it as `disbursed`.
        status: status === "completed" ? "disbursed" : "cleared",
      },
    });
    // Keep the user-facing payout transaction in sync.
    await tx.transaction.updateMany({
      where: { userId: request.userId, type: "circle_payout", reference, status: { not: status } },
      data: { status },
    });
    return true;
  });
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export async function processWeeklyContributionForAccount(circleAccountId: string) {
  const account = await prisma.circleAccount.findUnique({
    where: { id: circleAccountId },
    include: { circle: true },
  });
  if (!account || account.status !== "active") return null;
  if (account.circle.cycleType !== "weekly_contribution") return null;

  const weeklyAmount = account.circle.weeklyAmount ?? 0;
  const totalWeeks = account.circle.totalWeeks ?? 0;
  if (weeklyAmount <= 0 || totalWeeks <= 0) return null;

  const now = new Date();
  const lastAttempt = account.lastContributionAttempt ?? account.startDate;
  const weeksDue = Math.floor((now.getTime() - lastAttempt.getTime()) / WEEK_MS);
  if (weeksDue <= 0) return null;

  let processed = 0;
  let charged = 0;
  let defaulted = 0;

  for (let i = 0; i < weeksDue; i++) {
    const current = await prisma.circleAccount.findUnique({ where: { id: circleAccountId } });
    if (!current || current.status !== "active") break;
    if (current.weeksContributed + current.weeksDefaulted >= totalWeeks) break;

    const weekNumber = current.weeksContributed + current.weeksDefaulted + 1;
    const balance = await getWalletBalance(account.userId);

    if (balance >= weeklyAmount) {
      await prisma.$transaction(async (tx) => {
        const reference = `CIRCLE-CONTRIB-${circleAccountId}-W${weekNumber}-${Date.now()}-${nodeCrypto.randomBytes(4).toString("hex")}`;
        const txn = await tx.transaction.create({
          data: {
            userId: account.userId,
            type: "circle_contribution",
            amount: weeklyAmount,
            reference,
            status: "completed",
            description: `Week ${weekNumber} contribution into ${account.circle.name} [${circleAccountId}]`,
          },
        });
        await tx.circleContribution.create({
          data: {
            circleAccountId,
            userId: account.userId,
            weekNumber,
            amount: weeklyAmount,
            type: "weekly",
            transactionId: txn.id,
          },
        });
        await tx.circleAccount.update({
          where: { id: circleAccountId },
          data: {
            principalAmount: { increment: weeklyAmount },
            weeksContributed: { increment: 1 },
          },
        });
      });
      charged++;
    } else {
      await prisma.$transaction(async (tx) => {
        await tx.circleDefault.create({
          data: {
            circleAccountId,
            userId: account.userId,
            weekNumber,
            amountDue: weeklyAmount,
            clearanceAmount: weeklyAmount * 2,
            status: "outstanding",
          },
        });
        await tx.circleAccount.update({
          where: { id: circleAccountId },
          data: { weeksDefaulted: { increment: 1 } },
        });
      });
      defaulted++;
    }
    processed++;
  }

  await prisma.circleAccount.update({
    where: { id: circleAccountId },
    data: { lastContributionAttempt: now },
  });

  return { processed, charged, defaulted };
}

export async function runWeeklyContributionJob() {
  const accounts = await prisma.circleAccount.findMany({
    where: { status: "active", circle: { cycleType: "weekly_contribution" } },
    select: { id: true },
  });

  let charged = 0;
  let defaulted = 0;
  let errors = 0;

  for (const account of accounts) {
    try {
      const result = await processWeeklyContributionForAccount(account.id);
      if (result) {
        charged += result.charged;
        defaulted += result.defaulted;
      }
    } catch (err) {
      console.error(`Weekly contribution failed for account ${account.id}:`, err);
      errors++;
    }
  }

  return { total: accounts.length, charged, defaulted, errors };
}

export async function getDefaultsByAccount(circleAccountId: string, userId: string) {
  const account = await prisma.circleAccount.findUnique({ where: { id: circleAccountId } });
  if (!account) throw new Error("Circle account not found");
  if (account.userId !== userId) throw new Error("Not your account");

  return prisma.circleDefault.findMany({
    where: { circleAccountId },
    orderBy: { weekNumber: "asc" },
  });
}

export async function getDefaultsByUser(userId: string, params?: {
  page?: number;
  limit?: number;
  status?: string;
}) {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 20;
  const where: Record<string, unknown> = { userId };
  if (params?.status) where.status = params.status;

  const [items, total] = await Promise.all([
    prisma.circleDefault.findMany({
      where,
      include: {
        circleAccount: {
          include: { circle: { select: { id: true, name: true, weeklyAmount: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.circleDefault.count({ where }),
  ]);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function clearCircleDefault(defaultId: string, userId: string) {
  const record = await prisma.circleDefault.findUnique({
    where: { id: defaultId },
    include: { circleAccount: { include: { circle: true } } },
  });
  if (!record) throw new Error("Default not found");
  if (record.userId !== userId) throw new Error("Not your default");
  if (record.status !== "outstanding") throw new Error("Default is already cleared");

  const balance = await getWalletBalance(userId);
  if (balance < record.clearanceAmount) {
    throw new Error(
      `Insufficient wallet balance to clear default. Required: ${record.clearanceAmount}, Available: ${balance}`,
    );
  }

  return prisma.$transaction(async (tx) => {
    const reference = `CIRCLE-DEFAULT-CLEAR-${record.id}-${Date.now()}-${nodeCrypto.randomBytes(4).toString("hex")}`;
    const txn = await tx.transaction.create({
      data: {
        userId,
        type: "circle_default_clearance",
        amount: record.clearanceAmount,
        reference,
        status: "completed",
        description: `Cleared week ${record.weekNumber} default (2x) for ${record.circleAccount.circle.name} [${record.circleAccountId}]`,
      },
    });

    await tx.circleContribution.create({
      data: {
        circleAccountId: record.circleAccountId,
        userId,
        weekNumber: record.weekNumber,
        amount: record.amountDue,
        type: "default_clearance",
        transactionId: txn.id,
      },
    });

    await tx.circleDefault.update({
      where: { id: record.id },
      data: { status: "cleared", clearedAt: new Date() },
    });

    return tx.circleAccount.update({
      where: { id: record.circleAccountId },
      data: {
        principalAmount: { increment: record.amountDue },
        weeksContributed: { increment: 1 },
        weeksDefaulted: { decrement: 1 },
      },
    });
  });
}
