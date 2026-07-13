import { prisma } from "./prisma";

export async function getUserGroups(userId: string) {
  const memberships = await prisma.groupMember.findMany({
    where: { userId },
    include: { group: true },
    orderBy: { joinedAt: "desc" },
  });

  return memberships.map((m) => ({
    groupId: m.groupId,
    groupName: m.group.name,
    groupDescription: m.group.description,
    role: m.role,
    joinedAt: m.joinedAt,
    targetAmount: m.group.targetAmount,
    currentAmount: m.group.currentAmount,
    memberCount: m.group.memberCount,
    cycleFrequency: m.group.cycleFrequency,
    groupStatus: m.group.status,
  }));
}
