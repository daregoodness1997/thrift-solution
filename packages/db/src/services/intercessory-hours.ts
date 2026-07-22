import { prisma } from "./prisma";

export async function getActiveIntercessoryHours() {
  return prisma.intercessoryHour.findMany({
    where: { isActive: true },
    orderBy: { timeUtc: "asc" },
  });
}

export async function getAllIntercessoryHoursAdmin(opts?: {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}) {
  const page = opts?.page ?? 1;
  const limit = opts?.limit ?? 20;

  const where: Record<string, unknown> = {};

  if (opts?.isActive !== undefined) {
    where.isActive = opts.isActive;
  }

  if (opts?.search) {
    where.OR = [
      { name: { contains: opts.search, mode: "insensitive" } },
      { description: { contains: opts.search, mode: "insensitive" } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.intercessoryHour.findMany({
      where,
      orderBy: { timeUtc: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.intercessoryHour.count({ where }),
  ]);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function createIntercessoryHour(data: {
  name: string;
  timeUtc: string;
  joinLink?: string;
  isActive?: boolean;
  description?: string;
}) {
  return prisma.intercessoryHour.create({
    data: {
      name: data.name,
      timeUtc: data.timeUtc,
      joinLink: data.joinLink,
      isActive: data.isActive ?? true,
      description: data.description,
    },
  });
}

export async function updateIntercessoryHour(id: string, data: {
  name?: string;
  timeUtc?: string;
  joinLink?: string;
  isActive?: boolean;
  description?: string;
}) {
  const patch: Record<string, unknown> = {};
  if (data.name !== undefined) patch.name = data.name;
  if (data.timeUtc !== undefined) patch.timeUtc = data.timeUtc;
  if (data.joinLink !== undefined) patch.joinLink = data.joinLink;
  if (data.isActive !== undefined) patch.isActive = data.isActive;
  if (data.description !== undefined) patch.description = data.description;

  return prisma.intercessoryHour.update({
    where: { id },
    data: patch,
  });
}

export async function deleteIntercessoryHour(id: string) {
  return prisma.intercessoryHour.delete({
    where: { id },
  });
}
