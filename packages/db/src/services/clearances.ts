import { prisma } from "./prisma";

export async function getClearancesForUser(userId: string, opts?: { page?: number; limit?: number; status?: string }) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { items: [], total: 0, page: 1, limit: 20, totalPages: 0, stats: { totalCleared: 0, totalPending: 0, totalContributed: 0 } };

  const groupMemberships = await prisma.groupMember.findMany({
    where: { userId },
    include: { group: true },
  });

  const clearances = [];
  for (const gm of groupMemberships) {
    const payoutTransactions = await prisma.transaction.findMany({
      where: {
        groupId: gm.groupId,
        type: "payout",
        status: "completed",
      },
      orderBy: { createdAt: "desc" },
    });

    const contributionCount = await prisma.transaction.count({
      where: {
        userId,
        groupId: gm.groupId,
        type: "contribution",
        status: "completed",
      },
    });

    for (const pt of payoutTransactions) {
      clearances.push({
        id: pt.id,
        userId: pt.userId,
        userName: user.name,
        groupId: gm.groupId,
        groupName: gm.group.name,
        cycleNumber: payoutTransactions.indexOf(pt) + 1,
        payoutAmount: pt.amount,
        contributed: contributionCount * gm.group.targetAmount / gm.group.memberCount,
        status: pt.userId === userId ? "cleared" : "pending",
        clearedDate: pt.createdAt,
        createdAt: pt.createdAt,
      });
    }
  }

  const sorted = clearances.sort((a: { createdAt: Date }, b: { createdAt: Date }) => b.createdAt.getTime() - a.createdAt.getTime());

  const stats = {
    totalCleared: sorted.filter((c) => c.status === "cleared").reduce((sum, c) => sum + c.payoutAmount, 0),
    totalPending: sorted.filter((c) => c.status === "pending" || c.status === "partial").reduce((sum, c) => sum + (c.payoutAmount - c.contributed), 0),
    totalContributed: sorted.reduce((sum, c) => sum + c.contributed, 0),
  };

  const filtered = opts?.status && opts.status !== "all"
    ? sorted.filter((c) => c.status === opts.status)
    : sorted;

  const page = opts?.page ?? 1;
  const limit = opts?.limit ?? 20;
  const total = filtered.length;
  const items = filtered.slice((page - 1) * limit, page * limit);
  return { items, total, page, limit, totalPages: Math.ceil(total / limit), stats };
}

export async function getClearanceStats(userId: string) {
  const { items: clearances } = await getClearancesForUser(userId);
  const totalPayouts = clearances
    .filter((c: { status: string }) => c.status === "cleared")
    .reduce((sum: number, c: { payoutAmount: number }) => sum + c.payoutAmount, 0);
  const totalContributed = clearances.reduce((sum: number, c: { contributed: number }) => sum + c.contributed, 0);

  return { totalPayouts, totalContributed, clearances };
}
