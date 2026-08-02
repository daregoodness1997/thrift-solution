import nodeCrypto from "node:crypto";
import { prisma } from "./prisma";
import { encryptField } from "../encryption";

export function generateInvitationToken(): string {
  return nodeCrypto.randomBytes(32).toString("hex");
}

export async function createInvitation(data: {
  email: string;
  role: string;
  invitedById: string;
  token: string;
  expiresAt: Date;
  name?: string;
  registrationFeePaid?: boolean;
  bvn?: string;
  nin?: string;
}) {
  return prisma.invitation.create({
    data: {
      email: data.email,
      role: data.role,
      invitedById: data.invitedById,
      token: data.token,
      expiresAt: data.expiresAt,
      name: data.name || null,
      registrationFeePaid: data.registrationFeePaid || false,
      bvn: data.bvn ? encryptField(data.bvn) : null,
      nin: data.nin ? encryptField(data.nin) : null,
      adminInitiated: true,
    },
  });
}

export async function findInvitationByToken(token: string) {
  return prisma.invitation.findUnique({
    where: { token },
    include: { invitedBy: { select: { id: true, name: true, email: true } } },
  });
}

export async function findPendingInvitationByEmail(email: string) {
  return prisma.invitation.findFirst({
    where: {
      email,
      acceptedAt: null,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
  });
}

export async function markInvitationAccepted(id: string) {
  return prisma.invitation.update({
    where: { id },
    data: { acceptedAt: new Date() },
  });
}

export async function revokeInvitation(id: string) {
  return prisma.invitation.update({
    where: { id },
    data: { revokedAt: new Date() },
  });
}

export async function listInvitations(opts: {
  page?: number;
  limit?: number;
  status?: "pending" | "accepted" | "revoked" | "expired";
}) {
  const page = opts.page || 1;
  const limit = opts.limit || 20;
  const skip = (page - 1) * limit;

  const now = new Date();
  let where: Record<string, unknown> = {};

  if (opts.status === "pending") {
    where = { acceptedAt: null, revokedAt: null, expiresAt: { gt: now } };
  } else if (opts.status === "accepted") {
    where = { acceptedAt: { not: null } };
  } else if (opts.status === "revoked") {
    where = { revokedAt: { not: null } };
  } else if (opts.status === "expired") {
    where = { acceptedAt: null, revokedAt: null, expiresAt: { lte: now } };
  }

  const [items, total] = await Promise.all([
    prisma.invitation.findMany({
      where,
      include: { invitedBy: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.invitation.count({ where }),
  ]);

  return {
    items,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}
