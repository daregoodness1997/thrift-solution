import { prisma } from "./prisma";
import { toNum } from "./decimal";

export async function getDefaultsSummary(userId: string) {
  const defaults = await prisma.circleDefault.findMany({
    where: { userId, status: "outstanding" },
    include: {
      circleAccount: {
        include: { circle: { select: { name: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalDefaults = defaults.length;
  const totalAmount = defaults.reduce((sum, d) => sum + toNum(d.amountDue), 0);
  const totalClearanceAmount = defaults.reduce((sum, d) => sum + toNum(d.clearanceAmount), 0);

  return {
    totalDefaults,
    totalAmount,
    totalClearanceAmount,
    defaults: defaults.map((d) => ({
      id: d.id,
      circleName: d.circleAccount.circle.name,
      amountDue: toNum(d.amountDue),
      clearanceAmount: toNum(d.clearanceAmount),
      weekNumber: d.weekNumber,
      createdAt: d.createdAt,
    })),
  };
}

export async function getDefaultsForUser(userId: string, opts?: { page?: number; limit?: number; status?: string }) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { items: [], total: 0, page: opts?.page ?? 1, limit: opts?.limit ?? 20, totalPages: 0, stats: { totalDefaults: 0, totalOverdue: 0, totalPending: 0 } };

  const groupMemberships = await prisma.groupMember.findMany({
    where: { userId },
    include: { group: true },
  });

  const allDefaults = [];
  for (const gm of groupMemberships) {
    const pendingContributions = await prisma.transaction.findMany({
      where: {
        userId,
        groupId: gm.groupId,
        type: "contribution",
        status: "pending",
      },
      orderBy: { createdAt: "desc" },
    });

    for (const pc of pendingContributions) {
      const daysOverdue = Math.max(0, Math.floor((Date.now() - pc.createdAt.getTime()) / (1000 * 60 * 60 * 24)) - 3);
      allDefaults.push({
        id: pc.id,
        userId,
        userName: user.name,
        groupId: gm.groupId,
        groupName: gm.group.name,
        amount: toNum(pc.amount),
        dueDate: new Date(pc.createdAt.getTime() + 7 * 24 * 60 * 60 * 1000),
        status: daysOverdue > 0 ? "overdue" : "pending",
        daysOverdue,
        createdAt: pc.createdAt,
      });
    }
  }

  const sorted = allDefaults.sort((a: { createdAt: Date }, b: { createdAt: Date }) => b.createdAt.getTime() - a.createdAt.getTime());

  const filtered = opts?.status && opts.status !== "all"
    ? sorted.filter((d) => d.status === opts.status)
    : sorted;

  const stats = {
    totalDefaults: sorted.length,
    totalOverdue: sorted.filter((d) => d.status === "overdue").reduce((sum, d) => sum + d.amount, 0),
    totalPending: sorted.filter((d) => d.status === "pending").reduce((sum, d) => sum + d.amount, 0),
  };

  const page = opts?.page ?? 1;
  const limit = opts?.limit ?? 20;
  const total = filtered.length;
  const items = filtered.slice((page - 1) * limit, page * limit);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit), stats };
}
