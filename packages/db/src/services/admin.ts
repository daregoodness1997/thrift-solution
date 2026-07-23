import { prisma } from "./prisma";
import { toNum } from "./decimal";

export async function getAdminStats() {
  const [
    totalUsers,
    newUsersThisMonth,
    kycPending,
    loansPending,
    payoutRequestsPending,
    activeCircleAccounts,
    circlePrincipal,
    completedDonations,
    walletCredits,
    walletDebits,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({
      where: { createdAt: { gte: startOfMonth() } },
    }),
    prisma.kyc.count({ where: { status: "pending" } }),
    prisma.loan.count({ where: { status: "pending" } }),
    prisma.circlePayoutRequest.count({ where: { status: "pending" } }),
    prisma.circleAccount.count({ where: { status: "active" } }),
    prisma.circleAccount.aggregate({
      where: { status: "active" },
      _sum: { principalAmount: true, interestEarned: true },
    }),
    prisma.donation.aggregate({
      where: { status: "completed" },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.transaction.aggregate({
      where: { type: "credit", status: "completed" },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { type: "debit", status: "completed" },
      _sum: { amount: true },
    }),
  ]);

  const principal = toNum(circlePrincipal._sum.principalAmount);
  const interest = toNum(circlePrincipal._sum.interestEarned);

  return {
    users: {
      total: totalUsers,
      newThisMonth: newUsersThisMonth,
    },
    pending: {
      kyc: kycPending,
      loans: loansPending,
      payoutRequests: payoutRequestsPending,
    },
    circles: {
      activeAccounts: activeCircleAccounts,
      totalPrincipal: principal,
      totalInterest: interest,
      assetsUnderManagement: principal + interest,
    },
    donations: {
      completedCount: completedDonations._count,
      completedAmount: toNum(completedDonations._sum.amount),
    },
    wallet: {
      totalCredited: toNum(walletCredits._sum.amount),
      totalDebited: toNum(walletDebits._sum.amount),
    },
  };
}

export async function getUserGrowth(days = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const users = await prisma.user.findMany({
    where: { createdAt: { gte: since } },
    select: { createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const byDay = new Map<string, number>();
  for (const u of users) {
    const key = u.createdAt.toISOString().slice(0, 10);
    byDay.set(key, (byDay.get(key) ?? 0) + 1);
  }

  return Array.from(byDay.entries()).map(([date, count]) => ({ date, count }));
}

export async function listUsers(params: {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: "active" | "suspended";
}) {
  const { page = 1, limit = 20, search, role, status } = params;
  const where: Record<string, unknown> = {};

  if (role) where.role = role;
  if (status === "suspended") where.deletedAt = { not: null };
  else where.deletedAt = null;

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { accountNumber: { contains: search, mode: "insensitive" } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        accountNumber: true,
        accountTier: true,
        referralCode: true,
        deletedAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getUserDetail(id: string) {
  const user = await prisma.user.findFirst({
    where: { id, deletedAt: null },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      accountNumber: true,
      accountTier: true,
      referralCode: true,
      referredBy: true,
      createdAt: true,
      updatedAt: true,
      kyc: { select: { status: true, level: true } },
    },
  });

  if (!user) return null;

  const [transactionCount, circleAccountCount, loanCount, referralCount, walletAgg] = await Promise.all([
    prisma.transaction.count({ where: { userId: id } }),
    prisma.circleAccount.count({ where: { userId: id } }),
    prisma.loan.count({ where: { borrowerId: id } }),
    prisma.referral.count({ where: { referrerId: id } }),
    prisma.transaction.groupBy({
      by: ["type"],
      where: { userId: id, status: "completed" },
      _sum: { amount: true },
    }),
  ]);

  let credited = 0;
  let debited = 0;
  for (const row of walletAgg) {
    if (row.type === "credit") credited = toNum(row._sum.amount);
    if (row.type === "debit") debited = toNum(row._sum.amount);
  }

  return {
    ...user,
    stats: {
      transactions: transactionCount,
      circleAccounts: circleAccountCount,
      loans: loanCount,
      referrals: referralCount,
      walletBalance: credited - debited,
    },
  };
}

export async function updateUserByAdmin(
  id: string,
  data: { name?: string; role?: string; accountTier?: string },
) {
  const patch: Record<string, unknown> = {};
  if (data.name !== undefined) patch.name = data.name;
  if (data.role !== undefined) patch.role = data.role;
  if (data.accountTier !== undefined) patch.accountTier = data.accountTier;

  return prisma.user.update({
    where: { id },
    data: patch,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      accountNumber: true,
      accountTier: true,
      deletedAt: true,
      createdAt: true,
    },
  });
}

export async function suspendUser(id: string) {
  return prisma.user.update({
    where: { id },
    data: { deletedAt: new Date() },
    select: { id: true, name: true, email: true, deletedAt: true },
  });
}

export async function reactivateUser(id: string) {
  return prisma.user.update({
    where: { id },
    data: { deletedAt: null },
    select: { id: true, name: true, email: true, deletedAt: true },
  });
}

function startOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
