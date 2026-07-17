import nodeCrypto from "node:crypto";
import { prisma } from "./prisma";
import type { Prisma } from "@prisma/client";

export async function createTransaction(data: {
  userId: string;
  type: string;
  amount: number;
  groupId?: string;
  donationId?: string;
  loanId?: string;
  status?: string;
  metadata?: Prisma.InputJsonValue;
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

export async function findTransactionByReference(reference: string) {
  return prisma.transaction.findUnique({ where: { reference } });
}

export async function updateTransactionStatus(id: string, status: string) {
  return prisma.transaction.update({
    where: { id },
    data: { status },
  });
}
