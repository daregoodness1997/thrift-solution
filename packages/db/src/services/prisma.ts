import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

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
  "notification",
  "ticket",
  "ticketMessage",
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

export async function softDelete(model: string, id: string) {
  return (prisma as any)[model].update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}
