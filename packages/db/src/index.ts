import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// ── Config ──────────────────────────────────────────────

export async function getConfig(): Promise<Record<string, unknown>> {
  const row = await prisma.config.findUnique({ where: { id: "default" } });
  if (row) return JSON.parse(row.data);
  return {};
}

export async function saveConfig(data: Record<string, unknown>): Promise<void> {
  const json = JSON.stringify(data);
  await prisma.config.upsert({
    where: { id: "default" },
    create: { id: "default", data: json },
    update: { data: json },
  });
}

// ── Users ───────────────────────────────────────────────

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

export async function findUserById(id: string) {
  return prisma.user.findUnique({ where: { id } });
}

export async function createUser(data: { email: string; name: string; passwordHash: string }) {
  let code = generateCode(data.name);
  let attempts = 0;
  while (attempts < 10) {
    const existing = await prisma.user.findUnique({ where: { referralCode: code } });
    if (!existing) break;
    code = generateCode(data.name);
    attempts++;
  }

  return prisma.user.create({ data: { ...data, referralCode: code } });
}

// ── Donations ───────────────────────────────────────────

export async function createDonation(data: {
  userId: string;
  type: string;
  amount?: number;
  currency?: string;
  itemName?: string;
  itemDescription?: string;
  itemImage?: string;
  itemCategory?: string;
  itemCondition?: string;
  paymentProvider?: string;
  paymentReference?: string;
  paymentUrl?: string;
  groupId?: string;
  notes?: string;
}) {
  return prisma.donation.create({ data });
}

export async function findDonationById(id: string) {
  return prisma.donation.findUnique({ where: { id } });
}

export async function findDonationByReference(reference: string) {
  return prisma.donation.findFirst({ where: { paymentReference: reference } });
}

export async function updateDonationStatus(id: string, status: string) {
  return prisma.donation.update({ where: { id }, data: { status } });
}

export async function getUserDonations(userId: string, opts?: { limit?: number; offset?: number }) {
  return prisma.donation.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: opts?.limit ?? 50,
    skip: opts?.offset ?? 0,
    include: { group: { select: { id: true, name: true } } },
  });
}

export async function getDonationStats(userId: string) {
  const [totalMonetary, totalCount, completedCount] = await Promise.all([
    prisma.donation.aggregate({
      where: { userId, type: "monetary", status: "completed" },
      _sum: { amount: true },
    }),
    prisma.donation.count({ where: { userId } }),
    prisma.donation.count({ where: { userId, status: "completed" } }),
  ]);
  return {
    totalDonated: totalMonetary._sum.amount ?? 0,
    totalCount,
    completedCount,
  };
}

// ── Groups ──────────────────────────────────────────────

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

// ── Transactions ────────────────────────────────────────

export async function createTransaction(data: {
  userId: string;
  type: string;
  amount: number;
  groupId?: string;
  donationId?: string;
  reference: string;
  description?: string;
}) {
  return prisma.transaction.create({ data });
}

export async function getUserTransactions(userId: string, opts?: { limit?: number; offset?: number }) {
  return prisma.transaction.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: opts?.limit ?? 50,
    skip: opts?.offset ?? 0,
  });
}

// ── Referrals ─────────────────────────────────────────

function generateCode(name: string): string {
  const clean = name.replace(/[^A-Z]/gi, "").toUpperCase().slice(0, 6);
  const suffix = crypto.randomBytes(2).toString("hex").toUpperCase();
  return `${clean}-${suffix}`;
}

export async function generateReferralCode(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found");
  if (user.referralCode) return user.referralCode;

  let code = generateCode(user.name);
  let attempts = 0;
  while (attempts < 10) {
    const existing = await prisma.user.findUnique({ where: { referralCode: code } });
    if (!existing) break;
    code = generateCode(user.name);
    attempts++;
  }

  await prisma.user.update({ where: { id: userId }, data: { referralCode: code } });
  return code;
}

export async function findUserByReferralCode(code: string) {
  return prisma.user.findUnique({ where: { referralCode: code } });
}

export async function createReferral(referrerId: string, referredUserId: string) {
  return prisma.referral.create({
    data: { referrerId, referredUserId, status: "completed" },
  });
}

export async function createReferralEarning(data: {
  referralId: string;
  referrerId: string;
  tier: string;
  amount: number;
  status?: string;
}) {
  return prisma.referralEarning.create({ data });
}

export async function getUserReferrals(userId: string) {
  const referrals = await prisma.referral.findMany({
    where: { referrerId: userId },
    orderBy: { createdAt: "desc" },
  });

  const userIds = [...new Set(referrals.map((r) => r.referredUserId))];
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, email: true, createdAt: true },
  });
  const userMap = new Map(users.map((u) => [u.id, u]));

  return referrals.map((r) => ({
    ...r,
    referredUser: userMap.get(r.referredUserId) ?? { id: r.referredUserId, name: "Unknown", email: "", createdAt: new Date() },
  }));
}

export async function getUserReferralEarnings(userId: string) {
  return prisma.referralEarning.findMany({
    where: { referrerId: userId },
    orderBy: { createdAt: "desc" },
  });
}

const TIERS = [
  { name: "Bronze", min: 0, max: 5, amount: 200 },
  { name: "Silver", min: 6, max: 10, amount: 500 },
  { name: "Gold", min: 11, max: 25, amount: 1000 },
  { name: "Platinum", min: 26, max: Infinity, amount: 2000 },
];

export function getTierForCount(count: number) {
  for (const tier of TIERS) {
    if (count >= tier.min && count <= tier.max) return tier;
  }
  return TIERS[TIERS.length - 1];
}

export function getNextTier(currentTier: string) {
  const idx = TIERS.findIndex((t) => t.name === currentTier);
  if (idx < 0 || idx >= TIERS.length - 1) return null;
  return TIERS[idx + 1];
}

export async function getReferralStats(userId: string) {
  const [totalReferrals, pendingReferrals, completedReferrals, earningsAgg, tierCounts] = await Promise.all([
    prisma.referral.count({ where: { referrerId: userId } }),
    prisma.referral.count({ where: { referrerId: userId, status: "pending" } }),
    prisma.referral.count({ where: { referrerId: userId, status: "completed" } }),
    prisma.referralEarning.aggregate({ where: { referrerId: userId, status: "credited" }, _sum: { amount: true } }),
    prisma.referralEarning.groupBy({ by: ["tier"], where: { referrerId: userId, status: "credited" }, _count: true, _sum: { amount: true } }),
  ]);

  const totalEarnings = earningsAgg._sum.amount ?? 0;
  const currentTier = getTierForCount(completedReferrals);
  const nextTier = getNextTier(currentTier.name);

  return {
    totalReferrals,
    pendingReferrals,
    completedReferrals,
    totalEarnings,
    currentTier: currentTier.name,
    nextTier: nextTier ? nextTier.name : null,
    referralsToNextTier: nextTier ? nextTier.min - completedReferrals : 0,
    tierBreakdown: tierCounts.map((tc) => ({
      tier: tc.tier,
      count: tc._count,
      earnings: tc._sum.amount ?? 0,
    })),
  };
}

// ── KYC ──────────────────────────────────────────────

export async function getKycByUserId(userId: string) {
  return prisma.kyc.findUnique({
    where: { userId },
    include: {
      documents: true,
      auditLogs: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });
}

export async function getKycById(kycId: string) {
  return prisma.kyc.findUnique({
    where: { id: kycId },
    include: {
      documents: true,
      auditLogs: { orderBy: { createdAt: "desc" } },
      user: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function createKycSubmission(data: {
  userId: string;
  idType: string;
  idNumber: string;
  idDocumentUrl?: string;
  selfieUrl?: string;
  documents?: {
    fileUrl: string;
    fileType: string;
    fileName: string;
    fileSize: number;
    purpose?: string;
  }[];
}) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.kyc.findUnique({ where: { userId: data.userId } });
    if (existing && (existing.status === "verified" || existing.status === "pending" || existing.status === "under_review")) {
      throw new Error("KYC already submitted or verified");
    }

    const kyc = await tx.kyc.upsert({
      where: { userId: data.userId },
      create: {
        userId: data.userId,
        idType: data.idType,
        idNumber: data.idNumber,
        idDocumentUrl: data.idDocumentUrl ?? null,
        selfieUrl: data.selfieUrl ?? null,
        status: "pending",
        submittedAt: new Date(),
      },
      update: {
        idType: data.idType,
        idNumber: data.idNumber,
        idDocumentUrl: data.idDocumentUrl ?? null,
        selfieUrl: data.selfieUrl ?? null,
        status: "pending",
        rejectionReason: null,
        reviewedBy: null,
        verifiedAt: null,
        submittedAt: new Date(),
      },
    });

    if (data.documents && data.documents.length > 0) {
      await tx.kycDocument.deleteMany({ where: { kycId: kyc.id } });
      await tx.kycDocument.createMany({
        data: data.documents.map((doc) => ({
          kycId: kyc.id,
          fileUrl: doc.fileUrl,
          fileType: doc.fileType,
          fileName: doc.fileName,
          fileSize: doc.fileSize,
          purpose: doc.purpose ?? "id_document",
        })),
      });
    }

    await tx.kycAuditLog.create({
      data: {
        kycId: kyc.id,
        action: existing ? "resubmitted" : "submitted",
        newStatus: "pending",
        notes: `KYC ${existing ? "resubmitted" : "submitted"} with ${data.idType}`,
      },
    });

    return tx.kyc.findUnique({
      where: { id: kyc.id },
      include: { documents: true, auditLogs: { orderBy: { createdAt: "desc" } } },
    });
  });
}

export async function updateKycStatus(
  userId: string,
  status: string,
  opts?: { rejectionReason?: string; performedBy?: string; notes?: string }
) {
  return prisma.$transaction(async (tx) => {
    const kyc = await tx.kyc.findUnique({ where: { userId } });
    if (!kyc) throw new Error("KYC not found");

    const updated = await tx.kyc.update({
      where: { userId },
      data: {
        status,
        rejectionReason: opts?.rejectionReason ?? null,
        reviewedBy: opts?.performedBy ?? null,
        verifiedAt: status === "verified" ? new Date() : null,
      },
    });

    await tx.kycAuditLog.create({
      data: {
        kycId: kyc.id,
        action: `status_changed_to_${status}`,
        oldStatus: kyc.status,
        newStatus: status,
        notes: opts?.notes ?? opts?.rejectionReason ?? null,
        performedBy: opts?.performedBy ?? null,
      },
    });

    return updated;
  });
}

export async function getPendingKycSubmissions(opts?: { limit?: number; offset?: number }) {
  return prisma.kyc.findMany({
    where: { status: { in: ["pending", "under_review"] } },
    include: {
      documents: true,
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { submittedAt: "asc" },
    take: opts?.limit ?? 50,
    skip: opts?.offset ?? 0,
  });
}

export async function getAllKycSubmissions(opts?: { limit?: number; offset?: number; status?: string }) {
  const where: Record<string, unknown> = {};
  if (opts?.status && opts.status !== "all") {
    where.status = opts.status;
  }

  return prisma.kyc.findMany({
    where,
    include: {
      documents: true,
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
    take: opts?.limit ?? 50,
    skip: opts?.offset ?? 0,
  });
}

export async function getKycStats() {
  const [total, pending, underReview, verified, rejected, expired] = await Promise.all([
    prisma.kyc.count(),
    prisma.kyc.count({ where: { status: "pending" } }),
    prisma.kyc.count({ where: { status: "under_review" } }),
    prisma.kyc.count({ where: { status: "verified" } }),
    prisma.kyc.count({ where: { status: "rejected" } }),
    prisma.kyc.count({ where: { status: "expired" } }),
  ]);

  return { total, pending, underReview, verified, rejected, expired };
}

export async function addKycDocument(data: {
  kycId: string;
  fileUrl: string;
  fileType: string;
  fileName: string;
  fileSize: number;
  purpose?: string;
}) {
  return prisma.kycDocument.create({
    data: {
      kycId: data.kycId,
      fileUrl: data.fileUrl,
      fileType: data.fileType,
      fileName: data.fileName,
      fileSize: data.fileSize,
      purpose: data.purpose ?? "id_document",
    },
  });
}

export async function getKycDocuments(kycId: string) {
  return prisma.kycDocument.findMany({
    where: { kycId },
    orderBy: { uploadedAt: "desc" },
  });
}

export async function getKycAuditLogs(kycId: string) {
  return prisma.kycAuditLog.findMany({
    where: { kycId },
    orderBy: { createdAt: "desc" },
  });
}

// ── User Profile ──────────────────────────────────────

export async function getUserProfile(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return null;

  const [totalDonated, totalContributed, totalReceived, activeCircles, defaults, clearances, referralCount] = await Promise.all([
    prisma.donation.aggregate({
      where: { userId, type: "monetary", status: "completed" },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { userId, type: "contribution", status: "completed" },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { userId, type: "payout", status: "completed" },
      _sum: { amount: true },
    }),
    prisma.groupMember.count({ where: { userId, group: { status: "active" } } }),
    prisma.transaction.count({ where: { userId, type: "default", status: "pending" } }),
    prisma.transaction.count({ where: { userId, type: "clearance", status: "completed" } }),
    prisma.referral.count({ where: { referrerId: userId } }),
  ]);

  const totalSaved = (totalContributed._sum.amount ?? 0) + (totalReceived._sum.amount ?? 0);
  const trustScore = Math.min(5, Math.max(1, Math.ceil(totalSaved / 100000) + (activeCircles > 0 ? 1 : 0)));
  const trustLevels = ["", "Bronze", "Silver", "Gold", "Platinum", "Diamond"];
  const trustLevel = trustLevels[trustScore] || "Bronze";

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    createdAt: user.createdAt,
    stats: {
      totalSaved,
      totalDonated: totalDonated._sum.amount ?? 0,
      totalContributed: totalContributed._sum.amount ?? 0,
      totalReceived: totalReceived._sum.amount ?? 0,
      activeCircles,
      trustScore,
      trustLevel,
      defaults,
      clearances,
      referralCount,
    },
  };
}

export async function updateUserProfile(userId: string, data: { name?: string; email?: string }) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.email !== undefined && { email: data.email }),
    },
  });
}

// ── User Groups ──────────────────────────────────────

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

// ── Transactions (with filter) ────────────────────────

export async function getUserTransactionsFiltered(
  userId: string,
  opts?: { limit?: number; offset?: number; type?: string }
) {
  const where: Record<string, unknown> = { userId };
  if (opts?.type && opts.type !== "all") {
    where.type = opts.type;
  }
  return prisma.transaction.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: opts?.limit ?? 50,
    skip: opts?.offset ?? 0,
  });
}

// ── Wallet Funding ────────────────────────────────────

export async function fundWallet(userId: string, amount: number) {
  const reference = `FUND-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
  return prisma.transaction.create({
    data: {
      userId,
      type: "funding",
      amount,
      reference,
      status: "completed",
      description: "Wallet funding",
    },
  });
}

// ── Clearances ──────────────────────────────────────

export async function getClearancesForUser(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return [];

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

  return clearances.sort((a: { createdAt: Date }, b: { createdAt: Date }) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function getClearanceStats(userId: string) {
  const clearances = await getClearancesForUser(userId);
  const totalPayouts = clearances
    .filter((c: { status: string }) => c.status === "cleared")
    .reduce((sum: number, c: { payoutAmount: number }) => sum + c.payoutAmount, 0);
  const totalContributed = clearances.reduce((sum: number, c: { contributed: number }) => sum + c.contributed, 0);

  return { totalPayouts, totalContributed, clearances };
}

// ── Defaults ──────────────────────────────────────

export async function getDefaultsForUser(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return [];

  const groupMemberships = await prisma.groupMember.findMany({
    where: { userId },
    include: { group: true },
  });

  const defaults = [];
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
      defaults.push({
        id: pc.id,
        userId,
        userName: user.name,
        groupId: gm.groupId,
        groupName: gm.group.name,
        amount: pc.amount,
        dueDate: new Date(pc.createdAt.getTime() + 7 * 24 * 60 * 60 * 1000),
        status: daysOverdue > 0 ? "overdue" : "pending",
        daysOverdue,
        createdAt: pc.createdAt,
      });
    }
  }

  return defaults.sort((a: { createdAt: Date }, b: { createdAt: Date }) => b.createdAt.getTime() - a.createdAt.getTime());
}

// ── Chat ─────────────────────────────────────────────

export async function getUserConversations(userId: string) {
  const memberships = await prisma.conversationMember.findMany({
    where: { userId },
    include: {
      conversation: {
        include: {
          members: {
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
          },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
            include: { sender: { select: { id: true, name: true } } },
          },
        },
      },
    },
    orderBy: { conversation: { updatedAt: "desc" } },
  });

  return memberships.map((m) => ({
    id: m.conversation.id,
    name: m.conversation.name,
    members: m.conversation.members.map((mem) => ({
      id: mem.user.id,
      name: mem.user.name,
      email: mem.user.email,
    })),
    lastMessage: m.conversation.messages[0]
      ? {
          id: m.conversation.messages[0].id,
          text: m.conversation.messages[0].text,
          senderName: m.conversation.messages[0].sender.name,
          timestamp: m.conversation.messages[0].createdAt,
        }
      : null,
    updatedAt: m.conversation.updatedAt,
  }));
}

export async function getConversationMessages(conversationId: string, userId: string) {
  const membership = await prisma.conversationMember.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
  });
  if (!membership) throw new Error("Not a member of this conversation");

  const messages = await prisma.message.findMany({
    where: { conversationId },
    include: { sender: { select: { id: true, name: true } } },
    orderBy: { createdAt: "asc" },
  });

  return messages.map((m) => ({
    id: m.id,
    senderId: m.senderId,
    senderName: m.sender.name,
    text: m.text,
    timestamp: m.createdAt,
  }));
}

export async function sendMessage(conversationId: string, senderId: string, text: string) {
  const membership = await prisma.conversationMember.findUnique({
    where: { conversationId_userId: { conversationId, userId: senderId } },
  });
  if (!membership) throw new Error("Not a member of this conversation");

  const message = await prisma.message.create({
    data: { conversationId, senderId, text },
    include: { sender: { select: { id: true, name: true } } },
  });

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  });

  return {
    id: message.id,
    senderId: message.senderId,
    senderName: message.sender.name,
    text: message.text,
    timestamp: message.createdAt,
  };
}

export async function createConversation(name: string | null, memberIds: string[]) {
  const conversation = await prisma.conversation.create({
    data: {
      name,
      members: {
        create: memberIds.map((userId) => ({ userId })),
      },
    },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
    },
  });

  return {
    id: conversation.id,
    name: conversation.name,
    members: conversation.members.map((m) => ({
      id: m.user.id,
      name: m.user.name,
      email: m.user.email,
    })),
  };
}

export async function getOrCreateConversation(userId1: string, userId2: string) {
  const existing = await prisma.conversation.findFirst({
    where: {
      AND: [
        { members: { some: { userId: userId1 } } },
        { members: { some: { userId: userId2 } } },
      ],
    },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
    },
  });

  if (existing) {
    return {
      id: existing.id,
      name: existing.name,
      members: existing.members.map((m) => ({
        id: m.user.id,
        name: m.user.name,
        email: m.user.email,
      })),
    };
  }

  return createConversation(null, [userId1, userId2]);
}

// ── WhatsApp Groups ─────────────────────────────────

export async function getWhatsappGroups(userId: string) {
  const memberships = await prisma.whatsappGroupMember.findMany({
    where: { userId },
    include: { group: true },
    orderBy: { group: { updatedAt: "desc" } },
  });

  return memberships.map((m) => ({
    id: m.group.id,
    name: m.group.name,
    description: m.group.description,
    circleName: m.group.circleName,
    inviteLink: m.group.inviteLink,
    memberCount: m.group.memberCount,
    pinned: m.group.pinned,
    joinedAt: m.joinedAt,
  }));
}

export async function getAllWhatsappGroups() {
  const groups = await prisma.whatsappGroup.findMany({
    orderBy: { memberCount: "desc" },
  });
  return groups;
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
