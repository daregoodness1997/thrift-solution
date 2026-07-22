import { prisma } from "./prisma";

export async function getLiveSession() {
  return prisma.prayerSession.findFirst({
    where: { isLive: true },
    orderBy: { startTime: "desc" },
  });
}

export async function getUpcomingSessions(opts?: { limit?: number }) {
  const limit = opts?.limit ?? 5;
  return prisma.prayerSession.findMany({
    where: { isLive: false, startTime: { gte: new Date() } },
    orderBy: { startTime: "asc" },
    take: limit,
  });
}

export async function getAllPrayerSessionsAdmin(opts?: {
  page?: number;
  limit?: number;
  search?: string;
  isLive?: boolean;
}) {
  const page = opts?.page ?? 1;
  const limit = opts?.limit ?? 20;

  const where: Record<string, unknown> = {};

  if (opts?.isLive !== undefined) {
    where.isLive = opts.isLive;
  }

  if (opts?.search) {
    where.OR = [
      { title: { contains: opts.search, mode: "insensitive" } },
      { description: { contains: opts.search, mode: "insensitive" } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.prayerSession.findMany({
      where,
      orderBy: { startTime: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.prayerSession.count({ where }),
  ]);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function createPrayerSession(data: {
  title: string;
  description?: string;
  streamUrl?: string;
  startTime: string;
  endTime?: string;
  isLive?: boolean;
  isRecurring?: boolean;
  recurrence?: string;
  joinLink?: string;
}) {
  return prisma.prayerSession.create({
    data: {
      title: data.title,
      description: data.description,
      streamUrl: data.streamUrl,
      startTime: new Date(data.startTime),
      endTime: data.endTime ? new Date(data.endTime) : null,
      isLive: data.isLive ?? false,
      isRecurring: data.isRecurring ?? false,
      recurrence: data.recurrence,
      joinLink: data.joinLink,
    },
  });
}

export async function updatePrayerSession(id: string, data: {
  title?: string;
  description?: string;
  streamUrl?: string;
  startTime?: string;
  endTime?: string;
  isLive?: boolean;
  isRecurring?: boolean;
  recurrence?: string;
  joinLink?: string;
}) {
  const patch: Record<string, unknown> = {};
  if (data.title !== undefined) patch.title = data.title;
  if (data.description !== undefined) patch.description = data.description;
  if (data.streamUrl !== undefined) patch.streamUrl = data.streamUrl;
  if (data.startTime !== undefined) patch.startTime = new Date(data.startTime);
  if (data.endTime !== undefined) patch.endTime = data.endTime ? new Date(data.endTime) : null;
  if (data.isLive !== undefined) patch.isLive = data.isLive;
  if (data.isRecurring !== undefined) patch.isRecurring = data.isRecurring;
  if (data.recurrence !== undefined) patch.recurrence = data.recurrence;
  if (data.joinLink !== undefined) patch.joinLink = data.joinLink;

  return prisma.prayerSession.update({
    where: { id },
    data: patch,
  });
}

export async function deletePrayerSession(id: string) {
  return prisma.prayerSession.delete({
    where: { id },
  });
}

export async function getPrayerSessionStats() {
  const [total, live, upcoming] = await Promise.all([
    prisma.prayerSession.count(),
    prisma.prayerSession.count({ where: { isLive: true } }),
    prisma.prayerSession.count({ where: { isLive: false, startTime: { gte: new Date() } } }),
  ]);

  return { total, live, upcoming };
}
