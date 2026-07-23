import { prisma } from "./prisma";
import { toNum } from "./decimal";
import { getVirtualAccountsByUser } from "./virtual-accounts";
import { getWalletBalance } from "./wallet";
export async function getComprehensiveUserDetail(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      kyc: true,
      transactions: {
        include: {
          circleAccount: true,
          donation: true,
          loan: true,
          group: true,
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      },
      circleAccounts: {
        include: {
          circle: true,
          defaults: {
            where: { status: "outstanding" },
            orderBy: { weekNumber: "asc" },
            take: 5,
          },
          interestLogs: {
            orderBy: { calculatedAt: "desc" },
            take: 20,
          },
        },
      },
      loans: {
        include: {
          schedule: {
            orderBy: { installmentNo: "asc" },
            take: 12,
          },
          repayments: {
            orderBy: { createdAt: "desc" },
            take: 12,
          },
        },
      },
      referrals: {
        include: {
          referredUser: {
            select: { id: true, name: true, email: true, createdAt: true },
          },
        },
      },
      donations: {
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      circlePayoutRequests: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      defaults: {
        include: {
          circleAccount: {
            include: { circle: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  if (!user) return null;

  const [walletBalance, virtualAccounts] = await Promise.all([
    getWalletBalance(userId),
    getVirtualAccountsByUser(userId),
  ]);

  const userTransactions = user.transactions.map((t) => ({
    id: t.id,
    type: t.type,
    amount: t.amount,
    status: t.status,
    reference: t.reference,
    description: t.description,
    createdAt: t.createdAt,
    metadata: t.metadata,
    circleAccount: t.circleAccount ? {
      id: t.circleAccount.id,
      circleName: t.circleAccount.circle.name,
      principalAmount: t.circleAccount.principalAmount,
      status: t.circleAccount.status,
    } : null,
    donation: t.donation ? {
      id: t.donation.id,
      itemName: t.donation.itemName,
      status: t.donation.status,
    } : null,
    loan: t.loan ? {
      id: t.loan.id,
      amount: t.loan.amount,
      status: t.loan.status,
    } : null,
    group: t.group ? {
      id: t.group.id,
      name: t.group.name,
    } : null,
  }));

  const circleAccounts = user.circleAccounts.map((account) => ({
    id: account.id,
    circleId: account.circleId,
    circleName: account.circle.name,
    circleDescription: account.circle.description,
    circleType: account.circle.cycleType,
    principalAmount: account.principalAmount,
    processingFee: account.processingFee,
    interestEarned: account.interestEarned,
    weeksContributed: account.weeksContributed,
    weeksDefaulted: account.weeksDefaulted,
    status: account.status,
    maturityDate: account.maturityDate,
    paymentMode: account.circle.payoutMode,
    outstandingDefaults: account.defaults.map((d) => ({
      id: d.id,
      weekNumber: d.weekNumber,
      amountDue: d.amountDue,
      clearanceAmount: d.clearanceAmount,
      status: d.status,
    })),
    recentInterestLogs: account.interestLogs.map((log) => ({
      id: log.id,
      amount: log.amount,
      calculatedAt: log.calculatedAt,
      annualRate: log.annualRate,
    })),
  }));

  const loans = user.loans.map((loan) => ({
    id: loan.id,
    amount: loan.amount,
    interestRate: loan.interestRate,
    termMonths: loan.termMonths,
    monthlyPayment: loan.monthlyPayment,
    totalRepayment: loan.totalRepayment,
    status: loan.status,
    purpose: loan.purpose,
    processingFee: loan.processingFee,
    schedule: loan.schedule.map((s) => ({
      installmentNo: s.installmentNo,
      amount: s.amount,
      dueDate: s.dueDate,
      status: s.status,
    })),
    repayments: loan.repayments.map((r) => ({
      id: r.id,
      amount: r.amount,
      createdAt: r.createdAt,
      reference: r.reference,
      status: r.status,
    })),
  }));

  const userReferrals = user.referrals.map((r) => ({
    id: r.id,
    referredUserId: r.referredUserId,
    referredUserName: r.referredUser.name,
    referredUserEmail: r.referredUser.email,
    createdAt: r.createdAt,
    status: r.status,
  }));

  const defaults = user.defaults.map((d) => ({
    id: d.id,
    weekNumber: d.weekNumber,
    amountDue: d.amountDue,
    clearanceAmount: d.clearanceAmount,
    status: d.status,
    createdAt: d.createdAt,
    circleAccount: {
      id: d.circleAccount.id,
      circleName: d.circleAccount.circle.name,
    },
  }));

  const circlePayoutRequests = user.circlePayoutRequests.map((r) => ({
    id: r.id,
    amount: r.amount,
    status: r.status,
    createdAt: r.createdAt,
    circleAccount: r.circleAccount ? {
      id: r.circleAccount.id,
      circleName: r.circleAccount.circle.name,
      principalAmount: r.circleAccount.principalAmount,
      interestEarned: r.circleAccount.interestEarned,
    } : null,
  }));

  const donations = user.donations.map((d) => ({
    id: d.id,
    itemName: d.itemName,
    amount: d.amount,
    type: d.type,
    status: d.status,
    createdAt: d.createdAt,
    groupId: d.groupId,
  }));

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    accountNumber: user.accountNumber,
    accountTier: user.accountTier,
    referralCode: user.referralCode,
    referredBy: user.referredBy,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    phone: user.phone,
    kyc: user.kyc,
    bankName: user.bankName,
    bankCode: user.bankCode,
    bankAccountNumber: user.bankAccountNumber,
    bankAccountName: user.bankAccountName,
    emailVerified: user.emailVerified,
    emailVerifiedAt: user.emailVerifiedAt,
    phoneVerified: user.phoneVerified,
    phoneVerifiedAt: user.phoneVerifiedAt,
    totpSecret: user.totpSecret,
    twoFactorEnabled: user.twoFactorEnabled,
    email2faEnabled: user.email2faEnabled,
    bvn: user.bvn,
    nin: user.nin,
    verifiedName: user.verifiedName,
    registrationStep: user.registrationStep,
    registrationFeePaid: user.registrationFeePaid,
    registrationCompletedAt: user.registrationCompletedAt,
    walletBalance,
    virtualAccounts,
    transactions: userTransactions,
    circleAccounts,
    loans,
    userReferrals,
    defaults,
    circlePayoutRequests,
    donations,
  };
}

export async function getUserDashboardOverview(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      accountNumber: true,
      accountTier: true,
      createdAt: true,
      emailVerified: true,
      phoneVerified: true,
      kyc: true,
      bankName: true,
      bankCode: true,
      bvn: true,
      nin: true,
    },
  });

  if (!user) return null;

  const [
    totalCircleAccounts,
    activeCircleAccounts,
    totalTransactions,
    totalCircleContributions,
    totalInterestEarned,
    upcomingDefaults,
    walletBalance,
    virtualAccounts,
    circleWalletBalance,
  ] = await Promise.all([
    prisma.circleAccount.count({ where: { userId } }),
    prisma.circleAccount.count({ where: { userId, status: "active" } }),
    prisma.transaction.count({ where: { userId } }),
    prisma.transaction.aggregate({
      where: { userId, type: "circle_deposit", status: "completed" },
      _sum: { amount: true },
    }),
    prisma.circleAccount.aggregate({
      where: { userId },
      _sum: { interestEarned: true },
    }),
    prisma.circleDefault.count({ where: { userId, status: "outstanding" } }),
    getWalletBalance(userId),
    getVirtualAccountsByUser(userId),
    prisma.circleAccount.aggregate({
      where: { userId, status: "active" },
      _sum: { principalAmount: true, interestEarned: true },
    }),
  ]);

  const totalSaved = toNum(totalCircleContributions._sum.amount);
  const totalInterest = toNum(totalInterestEarned._sum.interestEarned);
  const circleTotal = totalSaved + totalInterest;
  const circlePrincipal = toNum(circleWalletBalance._sum.principalAmount);
  const circleInterest = toNum(circleWalletBalance._sum.interestEarned);

  return {
    user,
    stats: {
      circleAccounts: {
        total: totalCircleAccounts,
        active: activeCircleAccounts,
      },
      transactions: {
        total: totalTransactions,
      },
      savings: {
        totalSaved,
        totalInterest,
        totalCircleValue: circleTotal,
        circlePrincipal,
        circleInterest,
      },
      defaults: {
        outstanding: upcomingDefaults,
      },
      wallets: {
        mainWalletBalance: walletBalance,
        virtualAccountsCount: virtualAccounts.length,
        circleWalletBalance: circleTotal,
      },
    },
  };
}
