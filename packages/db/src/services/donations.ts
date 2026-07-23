import { prisma } from "./prisma";
import { toNum } from "./decimal";

export async function createDonation(data: {
  userId: string;
  type: string;
  amount?: number;
  currency?: string;
  itemName?: string;
  itemDescription?: string;
  itemImage?: string;
  itemCategory?: string;
  itemCondition?: string;
  paymentProvider?: string;
  paymentReference?: string;
  paymentUrl?: string;
  groupId?: string;
  notes?: string;
}) {
  return prisma.donation.create({ data });
}

export async function findDonationById(id: string) {
  return prisma.donation.findUnique({ where: { id } });
}

export async function findDonationByReference(reference: string) {
  return prisma.donation.findFirst({ where: { paymentReference: reference } });
}

export async function updateDonationStatus(id: string, status: string) {
  return prisma.donation.update({ where: { id }, data: { status } });
}

export async function updateDonationPaymentUrl(id: string, paymentUrl: string, paymentProvider: string) {
  return prisma.donation.update({
    where: { id },
    data: { paymentUrl, paymentProvider },
  });
}

export async function getPendingDonations(userId: string) {
  return prisma.donation.findMany({
    where: { userId, status: "pending", paymentUrl: { not: null } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getUserDonations(userId: string, opts?: { limit?: number; offset?: number; type?: string }) {
  const limit = opts?.limit ?? 50;
  const offset = opts?.offset ?? 0;
  const where: Record<string, unknown> = { userId };
  if (opts?.type) where.type = opts.type;
  const [items, total] = await Promise.all([
    prisma.donation.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
      include: { group: { select: { id: true, name: true } } },
    }),
    prisma.donation.count({ where }),
  ]);
  return { items, total };
}

export async function getDonationStats(userId: string) {
  const [totalMonetary, totalCount, completedCount] = await Promise.all([
    prisma.donation.aggregate({
      where: { userId, type: "monetary", status: "completed" },
      _sum: { amount: true },
    }),
    prisma.donation.count({ where: { userId } }),
    prisma.donation.count({ where: { userId, status: "completed" } }),
  ]);
  return {
    totalDonated: toNum(totalMonetary._sum.amount),
    totalCount,
    completedCount,
  };
}
