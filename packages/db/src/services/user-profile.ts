import { prisma } from "./prisma";
import { getWalletBalance } from "./wallet";
import { getVirtualAccountsByUser } from "./virtual-accounts";

export async function getUserProfile(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return null;

  const [totalDonated, totalContributed, totalReceived, activeCircles, defaults, clearances, referralCount, virtualAccounts] = await Promise.all([
    prisma.donation.aggregate({
      where: { userId, type: "monetary", status: "completed" },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { userId, type: "circle_deposit", status: "completed" },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { userId, type: "circle_withdrawal", status: "completed" },
      _sum: { amount: true },
    }),
    prisma.circleAccount.count({ where: { userId, status: "active" } }),
    prisma.transaction.count({ where: { userId, type: "default", status: "pending" } }),
    prisma.transaction.count({ where: { userId, type: "clearance", status: "completed" } }),
    prisma.referral.count({ where: { referrerId: userId } }),
    getVirtualAccountsByUser(userId),
  ]);

  const totalSaved = totalContributed._sum.amount ?? 0;
  const walletBalance = await getWalletBalance(userId);
  const trustScore = Math.min(5, Math.max(1, Math.ceil(totalSaved / 100000) + (activeCircles > 0 ? 1 : 0)));
  const trustLevels = ["", "Bronze", "Silver", "Gold", "Platinum", "Diamond"];
  const trustLevel = trustLevels[trustScore] || "Bronze";

  const virtualAccount = virtualAccounts[0]
    ? {
        id: virtualAccounts[0].id,
        accountNumber: virtualAccounts[0].accountNumber,
        accountName: virtualAccounts[0].accountName || user.name,
        bankName: virtualAccounts[0].bankName,
        bankCode: virtualAccounts[0].bankCode,
        provider: virtualAccounts[0].provider,
        status: virtualAccounts[0].status,
      }
    : null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    accountNumber: user.accountNumber,
    accountTier: user.accountTier,
    createdAt: user.createdAt,
    bankName: user.bankName,
    bankCode: user.bankCode,
    bankAccountNumber: user.bankAccountNumber,
    bankAccountName: user.bankAccountName,
    virtualAccount,
    stats: {
      totalSaved,
      totalDonated: totalDonated._sum.amount ?? 0,
      totalContributed: totalContributed._sum.amount ?? 0,
      totalReceived: totalReceived._sum.amount ?? 0,
      activeCircles,
      trustScore,
      trustLevel,
      defaults,
      clearances,
      referralCount,
      walletBalance,
    },
  };
}

export async function updateUserProfile(userId: string, data: { name?: string; email?: string }) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.email !== undefined && { email: data.email }),
    },
  });
}
