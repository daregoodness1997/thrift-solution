import { prisma } from "./prisma";

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
    if (existing && (existing.status === "pending" || existing.status === "under_review")) {
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

const KYC_LEVEL_TO_TIER: Record<number, string> = {
  1: "silver",
  2: "gold",
  3: "platinum",
};

const TIER_HIERARCHY = ["basic", "silver", "gold", "platinum", "diamond"];

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

    if (status === "verified" && kyc.level) {
      const newTier = KYC_LEVEL_TO_TIER[kyc.level];
      if (newTier) {
        const user = await tx.user.findUnique({ where: { id: userId }, select: { accountTier: true } });
        const currentTierIndex = TIER_HIERARCHY.indexOf(user?.accountTier ?? "basic");
        const newTierIndex = TIER_HIERARCHY.indexOf(newTier);
        if (newTierIndex > currentTierIndex) {
          await tx.user.update({ where: { id: userId }, data: { accountTier: newTier } });
        }
      }
    }

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

/**
 * Single source of truth for whether a user may be issued a virtual account.
 *
 * A virtual account must NEVER be created unless the user's KYC is verified
 * (or approved) AND both a BVN and NIN are present and non-empty. This blocks
 * document-only approvals (e.g. voter_card) that lack a verified BVN/NIN.
 */
export function isKycVerifiedForVirtualAccount(kyc: {
  status: string;
  bvn?: string | null;
  nin?: string | null;
} | null): boolean {
  return (
    !!kyc &&
    (kyc.status === "verified" || kyc.status === "approved") &&
    !!kyc.bvn &&
    kyc.bvn.trim() !== "" &&
    !!kyc.nin &&
    kyc.nin.trim() !== ""
  );
}
