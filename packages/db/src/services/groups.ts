import { prisma } from "./prisma";

export async function getGroups(opts?: { limit?: number; offset?: number }) {
  return prisma.group.findMany({
    where: { status: "active" },
    orderBy: { createdAt: "desc" },
    take: opts?.limit ?? 50,
    skip: opts?.offset ?? 0,
  });
}

export async function findGroupById(id: string) {
  return prisma.group.findUnique({
    where: { id },
    include: { members: { include: { user: { select: { id: true, name: true, email: true } } } } },
  });
}

export async function createGroup(data: {
  name: string;
  description?: string;
  targetAmount: number;
  cycleFrequency: string;
}) {
  return prisma.group.create({ data });
}

export async function updateGroupAmount(groupId: string, amount: number) {
  return prisma.group.update({
    where: { id: groupId },
    data: { currentAmount: { increment: amount }, memberCount: { increment: 1 } },
  });
}
