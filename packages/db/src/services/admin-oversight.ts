import { prisma } from "./prisma";

/* ---------------- Transactions ---------------- */

export async function getAllTransactions(params: {
  page?: number;
  limit?: number;
  type?: string;
  status?: string;
  search?: string;
}) {
  const { page = 1, limit = 20, type, status, search } = params;
  const where: Record<string, unknown> = {};
  if (type && type !== "all") where.type = type;
  if (status && status !== "all") where.status = status;
  if (search) {
    where.OR = [
      { reference: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { user: { email: { contains: search, mode: "insensitive" } } },
      { user: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.transaction.count({ where }),
  ]);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getTransactionStats() {
  const [byType, totalCount] = await Promise.all([
    prisma.transaction.groupBy({
      by: ["type"],
      where: { status: "completed" },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.transaction.count(),
  ]);

  return {
    totalCount,
    byType: byType.map((t) => ({ type: t.type, total: t._sum.amount ?? 0, count: t._count })),
  };
}

/* ---------------- Referral earnings ---------------- */

export async function getAllReferralEarnings(params: {
  page?: number;
  limit?: number;
  status?: string;
}) {
  const { page = 1, limit = 20, status } = params;
  const where: Record<string, unknown> = {};
  if (status && status !== "all") where.status = status;

  const [items, total, pendingAgg] = await Promise.all([
    prisma.referralEarning.findMany({
      where,
      include: { referrer: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.referralEarning.count({ where }),
    prisma.referralEarning.aggregate({ where: { status: "pending" }, _sum: { amount: true }, _count: true }),
  ]);

  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    pending: { count: pendingAgg._count, amount: pendingAgg._sum.amount ?? 0 },
  };
}

export async function payReferralEarning(id: string) {
  const earning = await prisma.referralEarning.findUnique({ where: { id } });
  if (!earning) throw new Error("Referral earning not found");
  if (earning.status === "credited") throw new Error("Earning already credited");
  return prisma.referralEarning.update({ where: { id }, data: { status: "credited" } });
}

/* ---------------- Virtual accounts ---------------- */

export async function getAllVirtualAccounts(params: {
  page?: number;
  limit?: number;
  provider?: string;
  status?: string;
  search?: string;
}) {
  const { page = 1, limit = 20, provider, status, search } = params;
  const where: Record<string, unknown> = {};
  if (provider && provider !== "all") where.provider = provider;
  if (status && status !== "all") where.status = status;
  if (search) {
    where.OR = [
      { accountNumber: { contains: search, mode: "insensitive" } },
      { user: { email: { contains: search, mode: "insensitive" } } },
      { user: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.virtualAccount.findMany({
      where,
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.virtualAccount.count({ where }),
  ]);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getMembersWithoutVirtualAccount(): Promise<
  { id: string; email: string; name: string; bvn: string | null; phone: string | null }[]
> {
  const rows = await prisma.$queryRaw<{ id: string; email: string; name: string; bvn: string | null; phone: string | null }[]>`
    SELECT u.id, u.email, u.name, k.id_number AS bvn, k.phone AS phone
    FROM users u
    LEFT JOIN virtual_accounts va ON va.user_id = u.id AND va.deleted_at IS NULL
    LEFT JOIN LATERAL (
      SELECT id_number, phone FROM kyc k2
      WHERE k2.user_id = u.id AND k2.status IN ('verified', 'approved')
      LIMIT 1
    ) k ON true
    WHERE va.id IS NULL AND u.deleted_at IS NULL AND u.role = 'member'
    LIMIT 200
  `;
  return rows;
}

/* ---------------- Marketplace moderation ---------------- */

export async function getAllMarketplaceListingsAdmin(params: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}) {
  const { page = 1, limit = 20, status, search } = params;
  const where: Record<string, unknown> = {};
  if (status && status !== "all") where.status = status;
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.marketplaceListing.findMany({
      where,
      include: {
        seller: { select: { id: true, name: true, email: true } },
        _count: { select: { offers: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.marketplaceListing.count({ where }),
  ]);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

/* ---------------- Jobs moderation ---------------- */

export async function getAllJobListingsAdmin(params: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}) {
  const { page = 1, limit = 20, status, search } = params;
  const where: Record<string, unknown> = {};
  if (status && status !== "all") where.status = status;
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { company: { contains: search, mode: "insensitive" } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.jobListing.findMany({
      where,
      include: {
        poster: { select: { id: true, name: true, email: true } },
        _count: { select: { applications: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.jobListing.count({ where }),
  ]);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

/* ---------------- Donations oversight ---------------- */

export async function getAllDonationsAdmin(params: {
  page?: number;
  limit?: number;
  type?: string;
  status?: string;
  search?: string;
}) {
  const { page = 1, limit = 20, type, status, search } = params;
  const where: Record<string, unknown> = {};
  if (type && type !== "all") where.type = type;
  if (status && status !== "all") where.status = status;
  if (search) {
    where.OR = [
      { itemName: { contains: search, mode: "insensitive" } },
      { user: { email: { contains: search, mode: "insensitive" } } },
      { user: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.donation.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
        group: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.donation.count({ where }),
  ]);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getDonationStatsAdmin() {
  const [monetaryAgg, byStatus, itemCount] = await Promise.all([
    prisma.donation.aggregate({
      where: { type: "monetary", status: "completed" },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.donation.groupBy({ by: ["status"], _count: true }),
    prisma.donation.count({ where: { type: "item" } }),
  ]);

  return {
    totalRaised: monetaryAgg._sum.amount ?? 0,
    monetaryCount: monetaryAgg._count,
    itemCount,
    byStatus: byStatus.map((s) => ({ status: s.status, count: s._count })),
  };
}
