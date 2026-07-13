import { prisma } from "./prisma";
import { getWalletBalance } from "./wallet";

export async function getUserProfile(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return null;

  const [totalDonated, totalContributed, totalReceived, activeCircles, defaults, clearances, referralCount] = await Promise.all([
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
  ]);

  const totalSaved = totalContributed._sum.amount ?? 0;
  const walletBalance = await getWalletBalance(userId);
  const trustScore = Math.min(5, Math.max(1, Math.ceil(totalSaved / 100000) + (activeCircles > 0 ? 1 : 0)));
  const trustLevels = ["", "Bronze", "Silver", "Gold", "Platinum", "Diamond"];
  const trustLevel = trustLevels[trustScore] || "Bronze";

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    accountNumber: user.accountNumber,
    accountTier: user.accountTier,
    createdAt: user.createdAt,
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
