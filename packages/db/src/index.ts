import { PrismaClient } from "@prisma/client";
import nodeCrypto from "node:crypto";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// ── Soft Delete Middleware ────────────────────────────────

const SOFT_DELETE_MODELS = [
  "config",
  "user",
  "group",
  "groupMember",
  "donation",
  "transaction",
  "referral",
  "referralEarning",
  "kyc",
  "kycDocument",
  "kycAuditLog",
  "conversation",
  "conversationMember",
  "message",
  "whatsappGroup",
  "whatsappGroupMember",
  "marketplaceListing",
  "marketplaceOffer",
  "jobListing",
  "jobApplication",
  "loan",
  "circle",
  "circleAccount",
  "circleInterestLog",
  "navigationItem",
  "roleNavigation",
];

prisma.$use(async (params, next) => {
  if (SOFT_DELETE_MODELS.includes(params.model || "")) {
    if (params.action === "findUnique" || params.action === "findFirst") {
      params.args.where = { ...params.args.where, deletedAt: null };
    }
    if (params.action === "findMany") {
      if (!params.args.where) params.args.where = {};
      if (params.args.where.deletedAt === undefined) {
        params.args.where.deletedAt = null;
      }
    }
    if (params.action === "count") {
      if (!params.args?.where) {
        params.args = { ...params.args, where: { deletedAt: null } };
      } else if (params.args.where.deletedAt === undefined) {
        params.args.where.deletedAt = null;
      }
    }
    if (params.action === "aggregate") {
      if (!params.args?.where) {
        params.args = { ...params.args, where: { deletedAt: null } };
      } else if (params.args.where.deletedAt === undefined) {
        params.args.where.deletedAt = null;
      }
    }
    if (params.action === "groupBy") {
      if (!params.args?.where) {
        params.args = { ...params.args, where: { deletedAt: null } };
      } else if (params.args.where.deletedAt === undefined) {
        params.args.where.deletedAt = null;
      }
    }
  }
  return next(params);
});

// ── Soft Delete Helper ────────────────────────────────────

export async function softDelete(model: string, id: string) {
  return (prisma as any)[model].update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}

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

async function generateAccountNumber(): Promise<string> {
  const lastUser = await prisma.user.findFirst({
    orderBy: { createdAt: "desc" },
    select: { accountNumber: true },
  });

  let nextNumber = 1;
  if (lastUser?.accountNumber) {
    const match = lastUser.accountNumber.match(/(\d+)$/);
    if (match) {
      nextNumber = parseInt(match[1], 10) + 1;
    }
  }

  return `THR-${String(nextNumber).padStart(6, "0")}`;
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

  let accountNumber = await generateAccountNumber();
  let accAttempts = 0;
  while (accAttempts < 10) {
    const existing = await prisma.user.findUnique({ where: { accountNumber } });
    if (!existing) break;
    accountNumber = await generateAccountNumber();
    accAttempts++;
  }

  return prisma.user.create({ data: { ...data, referralCode: code, accountNumber, accountTier: "basic" } });
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
  const limit = opts?.limit ?? 50;
  const offset = opts?.offset ?? 0;
  const [items, total] = await Promise.all([
    prisma.donation.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
      include: { group: { select: { id: true, name: true } } },
    }),
    prisma.donation.count({ where: { userId } }),
  ]);
  return { items, total };
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
  const limit = opts?.limit ?? 50;
  const offset = opts?.offset ?? 0;
  const [items, total] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.transaction.count({ where: { userId } }),
  ]);
  return { items, total };
}

// ── Referrals ─────────────────────────────────────────

function generateCode(name: string): string {
  const clean = name.replace(/[^A-Z]/gi, "").toUpperCase().slice(0, 6);
  const suffix = nodeCrypto.randomBytes(2).toString("hex").toUpperCase();
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

export async function getUserReferrals(userId: string, opts?: { page?: number; limit?: number }) {
  const page = opts?.page ?? 1;
  const limit = opts?.limit ?? 20;
  const [referrals, total] = await Promise.all([
    prisma.referral.findMany({
      where: { referrerId: userId },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.referral.count({ where: { referrerId: userId } }),
  ]);

  const userIds = [...new Set(referrals.map((r) => r.referredUserId))];
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, email: true, createdAt: true },
  });
  const userMap = new Map(users.map((u) => [u.id, u]));

  const items = referrals.map((r) => ({
    ...r,
    referredUser: userMap.get(r.referredUserId) ?? { id: r.referredUserId, name: "Unknown", email: "", createdAt: new Date() },
  }));

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getUserReferralEarnings(userId: string, opts?: { page?: number; limit?: number }) {
  const page = opts?.page ?? 1;
  const limit = opts?.limit ?? 20;
  const [items, total] = await Promise.all([
    prisma.referralEarning.findMany({
      where: { referrerId: userId },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.referralEarning.count({ where: { referrerId: userId } }),
  ]);
  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
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
  level?: number;
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

    const level = data.level ?? 1;

    const kyc = await tx.kyc.upsert({
      where: { userId: data.userId },
      create: {
        userId: data.userId,
        level,
        idType: data.idType,
        idNumber: data.idNumber,
        idDocumentUrl: data.idDocumentUrl ?? null,
        selfieUrl: data.selfieUrl ?? null,
        status: "pending",
        submittedAt: new Date(),
      },
      update: {
        level,
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
      await tx.kycDocument.updateMany({ where: { kycId: kyc.id, deletedAt: null }, data: { deletedAt: new Date() } });
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

export async function getPendingKycSubmissions(opts?: { page?: number; limit?: number }) {
  const page = opts?.page ?? 1;
  const limit = opts?.limit ?? 20;
  const [items, total] = await Promise.all([
    prisma.kyc.findMany({
      where: { status: { in: ["pending", "under_review"] } },
      include: {
        documents: true,
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { submittedAt: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.kyc.count({ where: { status: { in: ["pending", "under_review"] } } }),
  ]);
  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getAllKycSubmissions(opts?: { page?: number; limit?: number; status?: string }) {
  const page = opts?.page ?? 1;
  const limit = opts?.limit ?? 20;
  const where: Record<string, unknown> = {};
  if (opts?.status && opts.status !== "all") {
    where.status = opts.status;
  }

  const [items, total] = await Promise.all([
    prisma.kyc.findMany({
      where,
      include: {
        documents: true,
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.kyc.count({ where }),
  ]);
  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
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
      where: { userId, type: "circle_deposit", status: "completed" },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { userId, type: "circle_withdrawal", status: "completed" },
      _sum: { amount: true },
    }),
    prisma.circleAccount.count({ where: { userId, status: "active" } }),
    prisma.transaction.count({ where: { userId, type: "default", status: "pending" } }),
    prisma.transaction.count({ where: { userId, type: "clearance", status: "completed" } }),
    prisma.referral.count({ where: { referrerId: userId } }),
  ]);

  const totalSaved = totalContributed._sum.amount ?? 0;
  const walletBalance = await getWalletBalance(userId);
  const trustScore = Math.min(5, Math.max(1, Math.ceil(totalSaved / 100000) + (activeCircles > 0 ? 1 : 0)));
  const trustLevels = ["", "Bronze", "Silver", "Gold", "Platinum", "Diamond"];
  const trustLevel = trustLevels[trustScore] || "Bronze";

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    accountNumber: user.accountNumber,
    accountTier: user.accountTier,
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
      walletBalance,
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
  const limit = opts?.limit ?? 50;
  const offset = opts?.offset ?? 0;
  const [items, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.transaction.count({ where }),
  ]);
  return { items, total };
}

// ── Wallet Funding ────────────────────────────────────

export async function fundWallet(userId: string, amount: number) {
  const reference = `FUND-${Date.now()}-${nodeCrypto.randomBytes(4).toString("hex")}`;
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

export async function getClearancesForUser(userId: string, opts?: { page?: number; limit?: number }) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { items: [], total: 0, page: 1, limit: 20, totalPages: 0 };

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
  const page = opts?.page ?? 1;
  const limit = opts?.limit ?? 20;
  const total = sorted.length;
  const items = sorted.slice((page - 1) * limit, page * limit);
  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getClearanceStats(userId: string) {
  const { items: clearances } = await getClearancesForUser(userId);
  const totalPayouts = clearances
    .filter((c: { status: string }) => c.status === "cleared")
    .reduce((sum: number, c: { payoutAmount: number }) => sum + c.payoutAmount, 0);
  const totalContributed = clearances.reduce((sum: number, c: { contributed: number }) => sum + c.contributed, 0);

  return { totalPayouts, totalContributed, clearances };
}

// ── Defaults ──────────────────────────────────────

export async function getDefaultsForUser(userId: string, opts?: { page?: number; limit?: number }) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { items: [], total: 0, page: opts?.page ?? 1, limit: opts?.limit ?? 20, totalPages: 0 };

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
        amount: pc.amount,
        dueDate: new Date(pc.createdAt.getTime() + 7 * 24 * 60 * 60 * 1000),
        status: daysOverdue > 0 ? "overdue" : "pending",
        daysOverdue,
        createdAt: pc.createdAt,
      });
    }
  }

  const sorted = allDefaults.sort((a: { createdAt: Date }, b: { createdAt: Date }) => b.createdAt.getTime() - a.createdAt.getTime());
  const page = opts?.page ?? 1;
  const limit = opts?.limit ?? 20;
  const total = sorted.length;
  const items = sorted.slice((page - 1) * limit, page * limit);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

// ── Chat ─────────────────────────────────────────────

export async function getUserConversations(userId: string, opts?: { page?: number; limit?: number }) {
  const page = opts?.page ?? 1;
  const limit = opts?.limit ?? 20;

  const [memberships, total] = await Promise.all([
    prisma.conversationMember.findMany({
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
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.conversationMember.count({ where: { userId } }),
  ]);

  const items = memberships.map((m) => ({
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

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getConversationMessages(conversationId: string, userId: string, opts?: { page?: number; limit?: number }) {
  const membership = await prisma.conversationMember.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
  });
  if (!membership) throw new Error("Not a member of this conversation");

  const page = opts?.page ?? 1;
  const limit = opts?.limit ?? 20;

  const [messages, total] = await Promise.all([
    prisma.message.findMany({
      where: { conversationId },
      include: { sender: { select: { id: true, name: true } } },
      orderBy: { createdAt: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.message.count({ where: { conversationId } }),
  ]);

  const items = messages.map((m) => ({
    id: m.id,
    senderId: m.senderId,
    senderName: m.sender.name,
    text: m.text,
    timestamp: m.createdAt,
  }));

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
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

export async function getWhatsappGroups(userId: string, opts?: { page?: number; limit?: number }) {
  const page = opts?.page ?? 1;
  const limit = opts?.limit ?? 20;

  const [memberships, total] = await Promise.all([
    prisma.whatsappGroupMember.findMany({
      where: { userId },
      include: { group: true },
      orderBy: { group: { updatedAt: "desc" } },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.whatsappGroupMember.count({ where: { userId } }),
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

// ── Marketplace ───────────────────────────────────────

export async function createMarketplaceListing(data: {
  sellerId: string;
  title: string;
  description: string;
  price: number;
  currency?: string;
  category: string;
  condition: string;
  imageUrl?: string;
}) {
  return prisma.marketplaceListing.create({ data });
}

export async function getMarketplaceListings(params: {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  status?: string;
}) {
  const { page = 1, limit = 20, category, search, minPrice, maxPrice, status = "active" } = params;
  const where: Record<string, unknown> = { status };

  if (category) where.category = category;
  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = {};
    if (minPrice !== undefined) (where.price as Record<string, number>).gte = minPrice;
    if (maxPrice !== undefined) (where.price as Record<string, number>).lte = maxPrice;
  }
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.marketplaceListing.findMany({
      where,
      include: { seller: { select: { id: true, name: true, email: true } }, _count: { select: { offers: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.marketplaceListing.count({ where }),
  ]);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getMarketplaceListingById(id: string) {
  return prisma.marketplaceListing.findUnique({
    where: { id },
    include: {
      seller: { select: { id: true, name: true, email: true } },
      offers: {
        include: { offerer: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

export async function updateMarketplaceListing(id: string, data: {
  title?: string;
  description?: string;
  price?: number;
  category?: string;
  condition?: string;
  imageUrl?: string;
  status?: string;
}) {
  return prisma.marketplaceListing.update({ where: { id }, data });
}

export async function deleteMarketplaceListing(id: string) {
  return prisma.marketplaceListing.update({ where: { id }, data: { deletedAt: new Date() } });
}

export async function getMarketplaceListingsBySeller(sellerId: string, opts?: { page?: number; limit?: number }) {
  const page = opts?.page ?? 1;
  const limit = opts?.limit ?? 20;
  const [items, total] = await Promise.all([
    prisma.marketplaceListing.findMany({
      where: { sellerId },
      include: { _count: { select: { offers: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.marketplaceListing.count({ where: { sellerId } }),
  ]);
  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function createMarketplaceOffer(data: {
  listingId: string;
  offererId: string;
  amount: number;
  message?: string;
}) {
  return prisma.marketplaceOffer.create({
    data,
    include: {
      offerer: { select: { id: true, name: true, email: true } },
      listing: { select: { id: true, title: true, price: true, currency: true } },
    },
  });
}

export async function updateMarketplaceOffer(id: string, data: { status: string }) {
  return prisma.marketplaceOffer.update({
    where: { id },
    data,
    include: {
      offerer: { select: { id: true, name: true, email: true } },
      listing: { select: { id: true, title: true, price: true, currency: true } },
    },
  });
}

export async function getMarketplaceOffersByListing(listingId: string) {
  return prisma.marketplaceOffer.findMany({
    where: { listingId },
    include: { offerer: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getMarketplaceOffersForSeller(sellerId: string, opts?: { page?: number; limit?: number }) {
  const page = opts?.page ?? 1;
  const limit = opts?.limit ?? 20;
  const [items, total] = await Promise.all([
    prisma.marketplaceOffer.findMany({
      where: { listing: { sellerId } },
      include: {
        offerer: { select: { id: true, name: true, email: true } },
        listing: { select: { id: true, title: true, price: true, currency: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.marketplaceOffer.count({ where: { listing: { sellerId } } }),
  ]);
  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getMarketplaceOffererOffers(offererId: string, opts?: { page?: number; limit?: number }) {
  const page = opts?.page ?? 1;
  const limit = opts?.limit ?? 20;
  const [items, total] = await Promise.all([
    prisma.marketplaceOffer.findMany({
      where: { offererId },
      include: {
        listing: {
          select: { id: true, title: true, price: true, currency: true, seller: { select: { id: true, name: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.marketplaceOffer.count({ where: { offererId } }),
  ]);
  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

// ── Jobs ───────────────────────────────────────

export async function createJobListing(data: {
  posterId: string;
  title: string;
  description: string;
  company?: string;
  location: string;
  jobType: string;
  salaryMin?: number;
  salaryMax?: number;
  currency?: string;
  category: string;
}) {
  return prisma.jobListing.create({ data });
}

export async function getJobListings(params: {
  page?: number;
  limit?: number;
  category?: string;
  jobType?: string;
  search?: string;
  status?: string;
}) {
  const { page = 1, limit = 20, category, jobType, search, status = "active" } = params;
  const where: Record<string, unknown> = { status };

  if (category) where.category = category;
  if (jobType) where.jobType = jobType;
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { company: { contains: search, mode: "insensitive" } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.jobListing.findMany({
      where,
      include: { poster: { select: { id: true, name: true, email: true } }, _count: { select: { applications: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.jobListing.count({ where }),
  ]);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getJobListingById(id: string) {
  return prisma.jobListing.findUnique({
    where: { id },
    include: {
      poster: { select: { id: true, name: true, email: true } },
      applications: {
        include: { applicant: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

export async function updateJobListing(id: string, data: {
  title?: string;
  description?: string;
  company?: string;
  location?: string;
  jobType?: string;
  salaryMin?: number;
  salaryMax?: number;
  category?: string;
  status?: string;
}) {
  return prisma.jobListing.update({ where: { id }, data });
}

export async function deleteJobListing(id: string) {
  return prisma.jobListing.update({ where: { id }, data: { deletedAt: new Date() } });
}

export async function getJobListingsByPoster(posterId: string, opts?: { page?: number; limit?: number }) {
  const page = opts?.page ?? 1;
  const limit = opts?.limit ?? 20;
  const [items, total] = await Promise.all([
    prisma.jobListing.findMany({
      where: { posterId },
      include: { _count: { select: { applications: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.jobListing.count({ where: { posterId } }),
  ]);
  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function createJobApplication(data: {
  listingId: string;
  applicantId: string;
  resumeUrl?: string;
  coverLetter?: string;
}) {
  return prisma.jobApplication.create({
    data,
    include: {
      applicant: { select: { id: true, name: true, email: true } },
      listing: { select: { id: true, title: true, company: true, location: true } },
    },
  });
}

export async function updateJobApplication(id: string, data: { status: string }) {
  return prisma.jobApplication.update({
    where: { id },
    data,
    include: {
      applicant: { select: { id: true, name: true, email: true } },
      listing: { select: { id: true, title: true, company: true, location: true } },
    },
  });
}

export async function getJobApplicationsByListing(listingId: string) {
  return prisma.jobApplication.findMany({
    where: { listingId },
    include: { applicant: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getJobApplicationsByApplicant(applicantId: string, opts?: { page?: number; limit?: number }) {
  const page = opts?.page ?? 1;
  const limit = opts?.limit ?? 20;
  const [items, total] = await Promise.all([
    prisma.jobApplication.findMany({
      where: { applicantId },
      include: {
        listing: {
          select: { id: true, title: true, company: true, location: true, jobType: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.jobApplication.count({ where: { applicantId } }),
  ]);
  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getJobApplicationsForPoster(posterId: string, opts?: { page?: number; limit?: number }) {
  const page = opts?.page ?? 1;
  const limit = opts?.limit ?? 20;
  const [items, total] = await Promise.all([
    prisma.jobApplication.findMany({
      where: { listing: { posterId } },
      include: {
        applicant: { select: { id: true, name: true, email: true } },
        listing: { select: { id: true, title: true, company: true, location: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.jobApplication.count({ where: { listing: { posterId } } }),
  ]);
  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getJobApplicationById(id: string) {
  return prisma.jobApplication.findUnique({
    where: { id },
    include: {
      applicant: { select: { id: true, name: true, email: true } },
      listing: {
        select: {
          id: true, title: true, description: true, company: true, location: true,
          jobType: true, salaryMin: true, salaryMax: true, currency: true, category: true,
          status: true, createdAt: true,
          poster: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });
}

// ── Loans ───────────────────────────────────────

export async function createLoan(data: {
  borrowerId: string;
  amount: number;
  interestRate: number;
  termMonths: number;
  monthlyPayment: number;
  totalRepayment: number;
  purpose?: string;
}) {
  return prisma.loan.create({ data });
}

export async function getLoanById(id: string) {
  return prisma.loan.findUnique({
    where: { id },
    include: { borrower: { select: { id: true, name: true, email: true } } },
  });
}

export async function getLoansByBorrower(borrowerId: string, opts?: { page?: number; limit?: number }) {
  const page = opts?.page ?? 1;
  const limit = opts?.limit ?? 20;
  const [items, total] = await Promise.all([
    prisma.loan.findMany({
      where: { borrowerId },
      include: { borrower: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.loan.count({ where: { borrowerId } }),
  ]);
  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getAllLoans(params: {
  page?: number;
  limit?: number;
  status?: string;
}) {
  const { page = 1, limit = 20, status } = params;
  const where: Record<string, unknown> = {};
  if (status) where.status = status;

  const [items, total] = await Promise.all([
    prisma.loan.findMany({
      where,
      include: { borrower: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.loan.count({ where }),
  ]);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function updateLoan(id: string, data: {
  status?: string;
  approvedAt?: Date;
  disbursedAt?: Date;
  completedAt?: Date;
}) {
  return prisma.loan.update({
    where: { id },
    data,
    include: { borrower: { select: { id: true, name: true, email: true } } },
  });
}

export function calculateLoanTerms(amount: number, termMonths: number, annualRate: number = 5) {
  const monthlyRate = annualRate / 100 / 12;
  const monthlyPayment = monthlyRate > 0
    ? (amount * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / (Math.pow(1 + monthlyRate, termMonths) - 1)
    : amount / termMonths;
  const totalRepayment = monthlyPayment * termMonths;
  return {
    monthlyPayment: Math.round(monthlyPayment * 100) / 100,
    totalRepayment: Math.round(totalRepayment * 100) / 100,
    interestRate: annualRate,
  };
}

// ── Wallet Helpers ─────────────────────────────────────

const CREDIT_TYPES = ["funding", "payout", "circle_withdrawal", "circle_interest", "referral_earning"];
const DEBIT_TYPES = ["contribution", "circle_deposit"];

export async function getWalletBalance(userId: string): Promise<number> {
  const credits = await prisma.transaction.aggregate({
    where: { userId, status: "completed", type: { in: CREDIT_TYPES } },
    _sum: { amount: true },
  });
  const debits = await prisma.transaction.aggregate({
    where: { userId, status: "completed", type: { in: DEBIT_TYPES } },
    _sum: { amount: true },
  });
  return (credits._sum.amount || 0) - (debits._sum.amount || 0);
}

export async function debitWallet(userId: string, amount: number, description: string) {
  const reference = `DEBIT-${Date.now()}-${nodeCrypto.randomBytes(4).toString("hex")}`;
  return prisma.transaction.create({
    data: { userId, type: "circle_deposit", amount, reference, status: "completed", description },
  });
}

export async function creditWallet(userId: string, amount: number, type: string, description: string) {
  const reference = `${type.toUpperCase()}-${Date.now()}-${nodeCrypto.randomBytes(4).toString("hex")}`;
  return prisma.transaction.create({
    data: { userId, type, amount, reference, status: "completed", description },
  });
}

// ── Circles ───────────────────────────────────────────

export async function createCircle(data: {
  name: string;
  description?: string;
  amount: number;
  durationMonths: number;
  interestRateAnnual: number;
  maxAccountsPerUser?: number;
}) {
  return prisma.circle.create({ data });
}

export async function getCircleById(id: string) {
  return prisma.circle.findUnique({
    where: { id },
    include: { _count: { select: { accounts: true } } },
  });
}

export async function getAllCircles(params: {
  page?: number;
  limit?: number;
  status?: string;
}) {
  const { page = 1, limit = 20, status } = params;
  const where: Record<string, unknown> = {};
  if (status) where.status = status;

  const [items, total] = await Promise.all([
    prisma.circle.findMany({
      where,
      include: { _count: { select: { accounts: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.circle.count({ where }),
  ]);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getActiveCircles() {
  return prisma.circle.findMany({
    where: { status: "active" },
    include: { _count: { select: { accounts: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function updateCircle(id: string, data: {
  name?: string;
  description?: string;
  amount?: number;
  durationMonths?: number;
  interestRateAnnual?: number;
  maxAccountsPerUser?: number;
  status?: string;
}) {
  return prisma.circle.update({
    where: { id },
    data,
    include: { _count: { select: { accounts: true } } },
  });
}

// ── Circle Accounts ───────────────────────────────────

export async function openCircleAccount(circleId: string, userId: string) {
  const circle = await prisma.circle.findUnique({ where: { id: circleId } });
  if (!circle) throw new Error("Circle not found");
  if (circle.status !== "active") throw new Error("Circle is not active");

  const userAccounts = await prisma.circleAccount.count({
    where: { circleId, userId, status: "active" },
  });
  if (userAccounts >= circle.maxAccountsPerUser) {
    throw new Error(`Maximum ${circle.maxAccountsPerUser} active accounts per circle reached`);
  }

  const balance = await getWalletBalance(userId);
  if (balance < circle.amount) {
    throw new Error(`Insufficient wallet balance. Required: ${circle.amount}, Available: ${balance}`);
  }

  const now = new Date();
  const maturityDate = new Date(now);
  maturityDate.setMonth(maturityDate.getMonth() + circle.durationMonths);

  return prisma.$transaction(async (tx) => {
    const reference = `CIRCLE-DEPOSIT-${Date.now()}-${nodeCrypto.randomBytes(4).toString("hex")}`;
    await tx.transaction.create({
      data: {
        userId,
        type: "circle_deposit",
        amount: circle.amount,
        reference,
        status: "completed",
        description: `Deposit into ${circle.name}`,
      },
    });

    return tx.circleAccount.create({
      data: {
        circleId,
        userId,
        principalAmount: circle.amount,
        startDate: now,
        maturityDate,
        lastInterestCalculation: now,
      },
      include: {
        circle: { select: { id: true, name: true, amount: true, durationMonths: true, interestRateAnnual: true } },
      },
    });
  });
}

export async function getCircleAccountById(id: string) {
  return prisma.circleAccount.findUnique({
    where: { id },
    include: {
      circle: { select: { id: true, name: true, amount: true, durationMonths: true, interestRateAnnual: true } },
      user: { select: { id: true, name: true, email: true } },
      interestLogs: { orderBy: { calculatedAt: "desc" }, take: 50 },
    },
  });
}

export async function getCircleAccountsByUser(userId: string, opts?: { page?: number; limit?: number }) {
  const page = opts?.page ?? 1;
  const limit = opts?.limit ?? 20;
  const [items, total] = await Promise.all([
    prisma.circleAccount.findMany({
      where: { userId },
      include: {
        circle: { select: { id: true, name: true, amount: true, durationMonths: true, interestRateAnnual: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.circleAccount.count({ where: { userId } }),
  ]);
  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getCircleAccountTransactions(accountId: string, userId: string) {
  const account = await prisma.circleAccount.findUnique({ where: { id: accountId } });
  if (!account) throw new Error("Circle account not found");
  if (account.userId !== userId) throw new Error("Not your account");

  return prisma.transaction.findMany({
    where: {
      userId,
      type: { in: ["circle_deposit", "circle_withdrawal", "circle_interest"] },
      OR: [
        { description: { contains: accountId } },
        { reference: { contains: accountId } },
      ],
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getActiveCircleAccountsByUser(userId: string) {
  return prisma.circleAccount.findMany({
    where: { userId, status: "active" },
    include: {
      circle: { select: { id: true, name: true, amount: true, durationMonths: true, interestRateAnnual: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getAllActiveCircleAccounts() {
  return prisma.circleAccount.findMany({
    where: { status: "active" },
    include: {
      circle: { select: { id: true, name: true, amount: true, interestRateAnnual: true } },
    },
  });
}

export async function updateCircleAccount(id: string, data: {
  interestEarned?: number;
  totalWithdrawn?: number;
  status?: string;
  lastInterestCalculation?: Date;
}) {
  return prisma.circleAccount.update({
    where: { id },
    data,
    include: {
      circle: { select: { id: true, name: true, amount: true, durationMonths: true, interestRateAnnual: true } },
    },
  });
}

export async function earlyWithdrawCircleAccount(id: string, userId: string) {
  const account = await prisma.circleAccount.findUnique({ where: { id } });
  if (!account) throw new Error("Circle account not found");
  if (account.userId !== userId) throw new Error("Not your account");
  if (account.status !== "active") throw new Error("Account is not active");

  return prisma.$transaction(async (tx) => {
    const reference = `CIRCLE-WITHDRAWAL-${Date.now()}-${nodeCrypto.randomBytes(4).toString("hex")}`;
    await tx.transaction.create({
      data: {
        userId,
        type: "circle_withdrawal",
        amount: account.principalAmount,
        reference,
        status: "completed",
        description: "Early circle withdrawal (interest forfeited)",
      },
    });

    return tx.circleAccount.update({
      where: { id },
      data: {
        status: "early_withdrawn",
        totalWithdrawn: account.principalAmount,
        interestEarned: 0,
      },
      include: {
        circle: { select: { id: true, name: true, amount: true, durationMonths: true, interestRateAnnual: true } },
      },
    });
  });
}

export async function matureCircleAccount(id: string, userId: string) {
  const account = await prisma.circleAccount.findUnique({ where: { id } });
  if (!account) throw new Error("Circle account not found");
  if (account.userId !== userId) throw new Error("Not your account");
  if (account.status !== "active") throw new Error("Account is not active");

  const now = new Date();
  if (now < account.maturityDate) {
    throw new Error(`Account matures on ${account.maturityDate.toISOString()}`);
  }

  const totalPayout = account.principalAmount + account.interestEarned;

  return prisma.$transaction(async (tx) => {
    const reference = `CIRCLE-MATURITY-${Date.now()}-${nodeCrypto.randomBytes(4).toString("hex")}`;
    await tx.transaction.create({
      data: {
        userId,
        type: "circle_withdrawal",
        amount: totalPayout,
        reference,
        status: "completed",
        description: "Circle maturity payout (principal + interest)",
      },
    });

    return tx.circleAccount.update({
      where: { id },
      data: {
        status: "withdrawn",
        totalWithdrawn: totalPayout,
      },
      include: {
        circle: { select: { id: true, name: true, amount: true, durationMonths: true, interestRateAnnual: true } },
      },
    });
  });
}

// ── Circle Interest Calculation ────────────────────────

interface InterestWeek {
  week: number;
  date: string;
  daysFromStart: number;
  interestThisWeek: number;
  cumulativeInterest: number;
  totalValue: number;
  annualRate: number;
  principal: number;
}

export async function getCircleAccountInterestBreakdown(accountId: string): Promise<InterestWeek[]> {
  const account = await prisma.circleAccount.findUnique({
    where: { id: accountId },
    include: { circle: true },
  });
  if (!account) return [];

  const { principalAmount, startDate, maturityDate, interestEarned, circle } = account;
  const weeklyRate = circle.interestRateAnnual / 100 / 52;
  const weeklyInterest = Math.round(principalAmount * weeklyRate * 100) / 100;

  const start = new Date(startDate);
  const maturity = new Date(maturityDate);
  const totalWeeks = Math.ceil((maturity.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000));

  const weeks: InterestWeek[] = [];
  let cumulative = 0;

  for (let w = 1; w <= totalWeeks; w++) {
    const weekDate = new Date(start.getTime() + w * 7 * 24 * 60 * 60 * 1000);
    cumulative += weeklyInterest;
    const roundedCumulative = Math.round(cumulative * 100) / 100;

    weeks.push({
      week: w,
      date: weekDate.toISOString(),
      daysFromStart: w * 7,
      interestThisWeek: weeklyInterest,
      cumulativeInterest: roundedCumulative,
      totalValue: Math.round((principalAmount + roundedCumulative) * 100) / 100,
      annualRate: circle.interestRateAnnual,
      principal: principalAmount,
    });
  }

  return weeks;
}

export async function calculateWeeklyInterestForAccount(circleAccountId: string) {
  const account = await prisma.circleAccount.findUnique({
    where: { id: circleAccountId },
    include: { circle: true },
  });
  if (!account || account.status !== "active") return null;

  const now = new Date();
  const lastCalc = account.lastInterestCalculation || account.startDate;
  const weeksElapsed = Math.floor((now.getTime() - lastCalc.getTime()) / (7 * 24 * 60 * 60 * 1000));

  if (weeksElapsed <= 0) return null;

  const weeklyInterest = account.principalAmount * (account.circle.interestRateAnnual / 100) / 52;
  const interestToAdd = weeklyInterest * weeksElapsed;
  const roundedInterest = Math.round(interestToAdd * 100) / 100;

  if (roundedInterest <= 0) return null;

  return prisma.$transaction(async (tx) => {
    await tx.circleInterestLog.create({
      data: {
        circleAccountId,
        amount: roundedInterest,
        principalAtCalculation: account.principalAmount,
        annualRate: account.circle.interestRateAnnual,
      },
    });

    return tx.circleAccount.update({
      where: { id: circleAccountId },
      data: {
        interestEarned: { increment: roundedInterest },
        lastInterestCalculation: now,
      },
    });
  });
}

export async function runWeeklyInterestJob() {
  const activeAccounts = await prisma.circleAccount.findMany({
    where: { status: "active" },
  });

  let processed = 0;
  let errors = 0;

  for (const account of activeAccounts) {
    try {
      await calculateWeeklyInterestForAccount(account.id);
      processed++;
    } catch (err) {
      console.error(`Interest calculation failed for account ${account.id}:`, err);
      errors++;
    }

    const refreshed = await prisma.circleAccount.findUnique({ where: { id: account.id } });
    if (refreshed && refreshed.status === "active" && new Date() >= refreshed.maturityDate) {
      try {
        await prisma.circleAccount.update({
          where: { id: account.id },
          data: { status: "matured" },
        });
      } catch (err) {
        console.error(`Failed to mark account ${account.id} as matured:`, err);
      }
    }
  }

  return { processed, errors, total: activeAccounts.length };
}

// ── Navigation ──────────────────────────────────────

export async function getNavigationForRole(role: string) {
  const roleNavigations = await prisma.roleNavigation.findMany({
    where: { role },
    orderBy: { sortOrder: "asc" },
  });

  const navItemIds = roleNavigations.map((rn) => rn.navigationItemId);
  const navItems = await prisma.navigationItem.findMany({
    where: { id: { in: navItemIds }, isActive: true },
    orderBy: { sortOrder: "asc" },
  });
  const navItemMap = new Map(navItems.map((item) => [item.id, item]));

  const orderedItems = roleNavigations
    .map((rn) => navItemMap.get(rn.navigationItemId))
    .filter(Boolean);

  const sections: Record<string, { label: string; href: string; icon: string }[]> = {};

  for (const navItem of orderedItems) {
    if (!navItem) continue;

    const section = navItem.section || "";
    if (!sections[section]) {
      sections[section] = [];
    }

    sections[section].push({
      label: navItem.label,
      href: navItem.href,
      icon: navItem.icon,
    });
  }

  return Object.entries(sections).map(([title, items]) => ({
    title,
    items,
  }));
}

export async function getAllNavigationItems() {
  return prisma.navigationItem.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
}

export async function createNavigationItem(data: {
  label: string;
  href: string;
  icon: string;
  section?: string;
  sortOrder?: number;
}) {
  return prisma.navigationItem.create({ data });
}

export async function updateNavigationItem(id: string, data: {
  label?: string;
  href?: string;
  icon?: string;
  section?: string;
  sortOrder?: number;
  isActive?: boolean;
}) {
  return prisma.navigationItem.update({ where: { id }, data });
}

export async function deleteNavigationItem(id: string) {
  return prisma.navigationItem.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}

export async function assignNavigationToRole(role: string, navigationItemId: string, sortOrder?: number) {
  return prisma.roleNavigation.upsert({
    where: { role_navigationItemId: { role, navigationItemId } },
    create: { role, navigationItemId, sortOrder: sortOrder ?? 0 },
    update: { sortOrder: sortOrder ?? 0 },
  });
}

export async function removeNavigationFromRole(role: string, navigationItemId: string) {
  return prisma.roleNavigation.deleteMany({
    where: { role, navigationItemId },
  });
}

export async function getRoles() {
  const roles = await prisma.roleNavigation.findMany({
    select: { role: true },
    distinct: ["role"],
  });
  return roles.map((r) => r.role);
}
