import { prisma } from "./prisma";

export async function getActiveImpactNarratives() {
  return prisma.impactNarrative.findMany({
    where: { isActive: true, deletedAt: null },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    include: { gallery: { orderBy: { sortOrder: "asc" } }, timeline: { orderBy: { sortOrder: "asc" } } },
  });
}

export async function getImpactNarrativeById(id: string) {
  return prisma.impactNarrative.findUnique({
    where: { id, deletedAt: null },
    include: { gallery: { orderBy: { sortOrder: "asc" } }, timeline: { orderBy: { sortOrder: "asc" } } },
  });
}

export async function createImpactNarrative(data: {
  name: string;
  age: number;
  country: string;
  countryCode: string;
  role: string;
  cohort: string;
  avatarUrl: string;
  coverImageUrl: string;
  headlineQuote: string;
  impactMetric: string;
  impactLabel: string;
  longFormNarrative: string[];
  sortOrder?: number;
  isActive?: boolean;
  gallery?: { url: string; caption: string; tag: string; sortOrder?: number }[];
  timeline?: { year: string; title: string; description: string; tag: string; status: string; sortOrder?: number }[];
}) {
  const { gallery, timeline, ...narrativeData } = data;
  return prisma.impactNarrative.create({
    data: {
      ...narrativeData,
      sortOrder: data.sortOrder ?? 0,
      isActive: data.isActive ?? true,
      gallery: gallery ? { create: gallery } : undefined,
      timeline: timeline ? { create: timeline } : undefined,
    },
    include: { gallery: true, timeline: true },
  });
}

export async function updateImpactNarrative(id: string, data: {
  name?: string;
  age?: number;
  country?: string;
  countryCode?: string;
  role?: string;
  cohort?: string;
  avatarUrl?: string;
  coverImageUrl?: string;
  headlineQuote?: string;
  impactMetric?: string;
  impactLabel?: string;
  longFormNarrative?: string[];
  sortOrder?: number;
  isActive?: boolean;
}) {
  const patch: Record<string, unknown> = {};
  if (data.name !== undefined) patch.name = data.name;
  if (data.age !== undefined) patch.age = data.age;
  if (data.country !== undefined) patch.country = data.country;
  if (data.countryCode !== undefined) patch.countryCode = data.countryCode;
  if (data.role !== undefined) patch.role = data.role;
  if (data.cohort !== undefined) patch.cohort = data.cohort;
  if (data.avatarUrl !== undefined) patch.avatarUrl = data.avatarUrl;
  if (data.coverImageUrl !== undefined) patch.coverImageUrl = data.coverImageUrl;
  if (data.headlineQuote !== undefined) patch.headlineQuote = data.headlineQuote;
  if (data.impactMetric !== undefined) patch.impactMetric = data.impactMetric;
  if (data.impactLabel !== undefined) patch.impactLabel = data.impactLabel;
  if (data.longFormNarrative !== undefined) patch.longFormNarrative = data.longFormNarrative;
  if (data.sortOrder !== undefined) patch.sortOrder = data.sortOrder;
  if (data.isActive !== undefined) patch.isActive = data.isActive;

  return prisma.impactNarrative.update({
    where: { id },
    data: patch,
    include: { gallery: true, timeline: true },
  });
}

export async function deleteImpactNarrative(id: string) {
  return prisma.impactNarrative.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}

export async function getAllImpactNarrativesAdmin(opts?: {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}) {
  const page = opts?.page ?? 1;
  const limit = opts?.limit ?? 20;

  const where: Record<string, unknown> = { deletedAt: null };
  if (opts?.isActive !== undefined) where.isActive = opts.isActive;
  if (opts?.search) {
    where.OR = [
      { name: { contains: opts.search, mode: "insensitive" } },
      { role: { contains: opts.search, mode: "insensitive" } },
      { country: { contains: opts.search, mode: "insensitive" } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.impactNarrative.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
      include: { gallery: { orderBy: { sortOrder: "asc" } }, timeline: { orderBy: { sortOrder: "asc" } } },
    }),
    prisma.impactNarrative.count({ where }),
  ]);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function createGalleryPhoto(narrativeId: string, data: { url: string; caption: string; tag: string; sortOrder?: number }) {
  return prisma.impactGalleryPhoto.create({
    data: { narrativeId, ...data, sortOrder: data.sortOrder ?? 0 },
  });
}

export async function updateGalleryPhoto(id: string, data: { url?: string; caption?: string; tag?: string; sortOrder?: number }) {
  const patch: Record<string, unknown> = {};
  if (data.url !== undefined) patch.url = data.url;
  if (data.caption !== undefined) patch.caption = data.caption;
  if (data.tag !== undefined) patch.tag = data.tag;
  if (data.sortOrder !== undefined) patch.sortOrder = data.sortOrder;
  return prisma.impactGalleryPhoto.update({ where: { id }, data: patch });
}

export async function deleteGalleryPhoto(id: string) {
  return prisma.impactGalleryPhoto.update({ where: { id }, data: { deletedAt: new Date() } });
}

export async function createTimelineMilestone(narrativeId: string, data: { year: string; title: string; description: string; tag: string; status: string; sortOrder?: number }) {
  return prisma.impactTimelineMilestone.create({
    data: { narrativeId, ...data, sortOrder: data.sortOrder ?? 0 },
  });
}

export async function updateTimelineMilestone(id: string, data: { year?: string; title?: string; description?: string; tag?: string; status?: string; sortOrder?: number }) {
  const patch: Record<string, unknown> = {};
  if (data.year !== undefined) patch.year = data.year;
  if (data.title !== undefined) patch.title = data.title;
  if (data.description !== undefined) patch.description = data.description;
  if (data.tag !== undefined) patch.tag = data.tag;
  if (data.status !== undefined) patch.status = data.status;
  if (data.sortOrder !== undefined) patch.sortOrder = data.sortOrder;
  return prisma.impactTimelineMilestone.update({ where: { id }, data: patch });
}

export async function deleteTimelineMilestone(id: string) {
  return prisma.impactTimelineMilestone.update({ where: { id }, data: { deletedAt: new Date() } });
}
