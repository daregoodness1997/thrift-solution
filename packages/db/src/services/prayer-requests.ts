import { prisma } from "./prisma";

export async function getActivePrayerRequests(opts?: { page?: number; limit?: number; category?: string }) {
  const page = opts?.page ?? 1;
  const limit = opts?.limit ?? 20;

  const where: Record<string, unknown> = {
    isActive: true,
    deletedAt: null,
  };

  if (opts?.category) {
    where.category = opts.category;
  }

  const [items, total] = await Promise.all([
    prisma.prayerRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.prayerRequest.count({ where }),
  ]);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function createPrayerRequest(data: {
  authorName: string;
  location?: string;
  category: string;
  request: string;
}) {
  return prisma.prayerRequest.create({
    data: {
      authorName: data.authorName,
      location: data.location,
      category: data.category,
      request: data.request,
      prayersCount: 0,
    },
  });
}

export async function incrementPrayerCount(id: string) {
  return prisma.prayerRequest.update({
    where: { id },
    data: { prayersCount: { increment: 1 } },
  });
}

export async function getAllPrayerRequestsAdmin(opts?: {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  isActive?: boolean;
}) {
  const page = opts?.page ?? 1;
  const limit = opts?.limit ?? 20;

  const where: Record<string, unknown> = {
    deletedAt: null,
  };

  if (opts?.category) {
    where.category = opts.category;
  }

  if (opts?.isActive !== undefined) {
    where.isActive = opts.isActive;
  }

  if (opts?.search) {
    where.OR = [
      { authorName: { contains: opts.search, mode: "insensitive" } },
      { request: { contains: opts.search, mode: "insensitive" } },
      { location: { contains: opts.search, mode: "insensitive" } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.prayerRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.prayerRequest.count({ where }),
  ]);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function updatePrayerRequest(id: string, data: {
  authorName?: string;
  location?: string;
  category?: string;
  request?: string;
  isActive?: boolean;
}) {
  const patch: Record<string, unknown> = {};
  if (data.authorName !== undefined) patch.authorName = data.authorName;
  if (data.location !== undefined) patch.location = data.location;
  if (data.category !== undefined) patch.category = data.category;
  if (data.request !== undefined) patch.request = data.request;
  if (data.isActive !== undefined) patch.isActive = data.isActive;

  return prisma.prayerRequest.update({
    where: { id },
    data: patch,
  });
}

export async function deletePrayerRequest(id: string) {
  return prisma.prayerRequest.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}

export async function getPrayerRequestStats() {
  const [total, active, totalPrayers] = await Promise.all([
    prisma.prayerRequest.count({ where: { deletedAt: null } }),
    prisma.prayerRequest.count({ where: { isActive: true, deletedAt: null } }),
    prisma.prayerRequest.aggregate({
      where: { deletedAt: null },
      _sum: { prayersCount: true },
    }),
  ]);

  return {
    total,
    active,
    totalPrayers: totalPrayers._sum.prayersCount ?? 0,
  };
}
