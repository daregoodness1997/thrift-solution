import nodeCrypto from "node:crypto";
import { prisma } from "./prisma";

const TIERS = [
  { name: "Bronze", min: 0, max: 5, amount: 200 },
  { name: "Silver", min: 6, max: 10, amount: 500 },
  { name: "Gold", min: 11, max: 25, amount: 1000 },
  { name: "Platinum", min: 26, max: Infinity, amount: 2000 },
];

function generateCode(name: string): string {
  const clean = name.replace(/[^A-Z]/gi, "").toUpperCase().slice(0, 6);
  const suffix = nodeCrypto.randomBytes(2).toString("hex").toUpperCase();
  return `${clean}-${suffix}`;
}

export async function generateReferralCode(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found");
  if (user.referralCode) return user.referralCode;

  let code = generateCode(user.name);
  let attempts = 0;
  while (attempts < 10) {
    const existing = await prisma.user.findUnique({ where: { referralCode: code } });
    if (!existing) break;
    code = generateCode(user.name);
    attempts++;
  }

  await prisma.user.update({ where: { id: userId }, data: { referralCode: code } });
  return code;
}

export async function findUserByReferralCode(code: string) {
  return prisma.user.findUnique({ where: { referralCode: code } });
}

export async function createReferral(referrerId: string, referredUserId: string) {
  return prisma.referral.create({
    data: { referrerId, referredUserId, status: "completed" },
  });
}

export async function createReferralEarning(data: {
  referralId: string;
  referrerId: string;
  tier: string;
  amount: number;
  status?: string;
}) {
  return prisma.referralEarning.create({ data });
}

export async function getUserReferrals(userId: string, opts?: { page?: number; limit?: number }) {
  const page = opts?.page ?? 1;
  const limit = opts?.limit ?? 20;
  const [referrals, total] = await Promise.all([
    prisma.referral.findMany({
      where: { referrerId: userId },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.referral.count({ where: { referrerId: userId } }),
  ]);

  const userIds = [...new Set(referrals.map((r) => r.referredUserId))];
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, email: true, createdAt: true },
  });
  const userMap = new Map(users.map((u) => [u.id, u]));

  const items = referrals.map((r) => ({
    ...r,
    referredUser: userMap.get(r.referredUserId) ?? { id: r.referredUserId, name: "Unknown", email: "", createdAt: new Date() },
  }));

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getUserReferralEarnings(userId: string, opts?: { page?: number; limit?: number }) {
  const page = opts?.page ?? 1;
  const limit = opts?.limit ?? 20;
  const [items, total] = await Promise.all([
    prisma.referralEarning.findMany({
      where: { referrerId: userId },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.referralEarning.count({ where: { referrerId: userId } }),
  ]);
  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export function getTierForCount(count: number) {
  for (const tier of TIERS) {
    if (count >= tier.min && count <= tier.max) return tier;
  }
  return TIERS[TIERS.length - 1];
}

export function getNextTier(currentTier: string) {
  const idx = TIERS.findIndex((t) => t.name === currentTier);
  if (idx < 0 || idx >= TIERS.length - 1) return null;
  return TIERS[idx + 1];
}

export async function getReferralStats(userId: string) {
  const [totalReferrals, pendingReferrals, completedReferrals, earningsAgg, tierCounts] = await Promise.all([
    prisma.referral.count({ where: { referrerId: userId } }),
    prisma.referral.count({ where: { referrerId: userId, status: "pending" } }),
    prisma.referral.count({ where: { referrerId: userId, status: "completed" } }),
    prisma.referralEarning.aggregate({ where: { referrerId: userId, status: "credited" }, _sum: { amount: true } }),
    prisma.referralEarning.groupBy({ by: ["tier"], where: { referrerId: userId, status: "credited" }, _count: true, _sum: { amount: true } }),
  ]);

  const totalEarnings = earningsAgg._sum.amount ?? 0;
  const currentTier = getTierForCount(completedReferrals);
  const nextTier = getNextTier(currentTier.name);

  return {
    totalReferrals,
    pendingReferrals,
    completedReferrals,
    totalEarnings,
    currentTier: currentTier.name,
    nextTier: nextTier ? nextTier.name : null,
    referralsToNextTier: nextTier ? nextTier.min - completedReferrals : 0,
    tierBreakdown: tierCounts.map((tc) => ({
      tier: tc.tier,
      count: tc._count,
      earnings: tc._sum.amount ?? 0,
    })),
  };
}
