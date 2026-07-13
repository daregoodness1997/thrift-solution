import { prisma } from "./prisma";

export async function getWhatsappGroups(userId: string, opts?: { page?: number; limit?: number; search?: string; pinned?: boolean }) {
  const page = opts?.page ?? 1;
  const limit = opts?.limit ?? 20;

  const groupWhere: Record<string, unknown> = {};
  if (opts?.search) {
    groupWhere.OR = [
      { name: { contains: opts.search, mode: "insensitive" } },
      { circleName: { contains: opts.search, mode: "insensitive" } },
    ];
  }
  if (opts?.pinned) {
    groupWhere.pinned = true;
  }

  const memberWhere: Record<string, unknown> = { userId };
  if (Object.keys(groupWhere).length > 0) {
    memberWhere.group = groupWhere;
  }

  const [memberships, total] = await Promise.all([
    prisma.whatsappGroupMember.findMany({
      where: memberWhere,
      include: { group: true },
      orderBy: { group: { updatedAt: "desc" } },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.whatsappGroupMember.count({ where: memberWhere }),
  ]);

  const items = memberships.map((m) => ({
    id: m.group.id,
    name: m.group.name,
    description: m.group.description,
    circleName: m.group.circleName,
    inviteLink: m.group.inviteLink,
    memberCount: m.group.memberCount,
    pinned: m.group.pinned,
    joinedAt: m.joinedAt,
  }));

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getAllWhatsappGroups(opts?: { page?: number; limit?: number }) {
  const page = opts?.page ?? 1;
  const limit = opts?.limit ?? 20;
  const [items, total] = await Promise.all([
    prisma.whatsappGroup.findMany({
      orderBy: { memberCount: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.whatsappGroup.count(),
  ]);
  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function createWhatsappGroup(data: {
  name: string;
  description?: string;
  circleName?: string;
  inviteLink?: string;
}) {
  return prisma.whatsappGroup.create({
    data: {
      name: data.name,
      description: data.description,
      circleName: data.circleName,
      inviteLink: data.inviteLink,
      memberCount: 1,
    },
  });
}

export async function joinWhatsappGroup(groupId: string, userId: string) {
  const existing = await prisma.whatsappGroupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });
  if (existing) return existing;

  const softDeleted = await prisma.$queryRawUnsafe<{ id: string }[]>(
    `SELECT id FROM whatsapp_group_members WHERE group_id = $1 AND user_id = $2 AND deleted_at IS NOT NULL LIMIT 1`,
    groupId,
    userId,
  );

  if (softDeleted.length > 0) {
    await prisma.whatsappGroupMember.delete({ where: { id: softDeleted[0].id } });
  }

  const membership = await prisma.whatsappGroupMember.create({
    data: { groupId, userId },
  });

  await prisma.whatsappGroup.update({
    where: { id: groupId },
    data: { memberCount: { increment: 1 } },
  });

  return membership;
}

export async function toggleWhatsappGroupPin(groupId: string, userId: string) {
  const membership = await prisma.whatsappGroupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
    include: { group: true },
  });
  if (!membership) throw new Error("Not a member of this group");

  const group = await prisma.whatsappGroup.update({
    where: { id: groupId },
    data: { pinned: !membership.group?.pinned },
  });

  return group;
}

export async function seedDefaultWhatsappGroups() {
  const count = await prisma.whatsappGroup.count();
  if (count > 0) return;

  const defaults = [
    { name: "General Announcements", description: "Platform-wide updates and announcements", circleName: "All Circles", memberCount: 44 },
    { name: "Savings Tips & Advice", description: "Share and learn savings strategies", circleName: "Community", memberCount: 38 },
    { name: "New Member Welcome", description: "Introductions and onboarding for new members", circleName: "Community", memberCount: 32 },
    { name: "Events & Meetups", description: "Upcoming events and in-person gatherings", circleName: "Community", memberCount: 28 },
  ];

  for (const g of defaults) {
    await prisma.whatsappGroup.create({ data: g });
  }
}
