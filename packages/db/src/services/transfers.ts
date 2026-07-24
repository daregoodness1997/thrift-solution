import { prisma } from "./prisma";
import type { Prisma } from "@prisma/client";

export interface CreateTransferInput {
  senderId: string;
  recipientType: string;
  recipientUserId?: string;
  recipientName?: string;
  recipientBank?: string;
  recipientAccount?: string;
  amount: number;
  fee?: number;
  reference: string;
  description?: string;
  metadata?: Prisma.InputJsonValue;
}

export async function createTransfer(data: CreateTransferInput) {
  return prisma.transfer.create({
    data: {
      senderId: data.senderId,
      recipientType: data.recipientType,
      recipientUserId: data.recipientUserId,
      recipientName: data.recipientName,
      recipientBank: data.recipientBank,
      recipientAccount: data.recipientAccount,
      amount: data.amount,
      fee: data.fee ?? 0,
      reference: data.reference,
      description: data.description,
      metadata: data.metadata,
    },
  });
}

export async function updateTransferStatus(id: string, status: string, metadata?: Prisma.InputJsonValue) {
  return prisma.transfer.update({
    where: { id },
    data: {
      status,
      ...(status === "completed" ? { completedAt: new Date() } : {}),
      ...(metadata ? { metadata } : {}),
    },
  });
}

export async function findTransferByReference(reference: string) {
  return prisma.transfer.findUnique({ where: { reference } });
}

export async function findTransferById(id: string) {
  return prisma.transfer.findUnique({ where: { id } });
}

export async function getUserTransfers(userId: string, opts?: { limit?: number; offset?: number }) {
  const limit = opts?.limit ?? 50;
  const offset = opts?.offset ?? 0;
  const [items, total] = await Promise.all([
    prisma.transfer.findMany({
      where: { senderId: userId },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.transfer.count({ where: { senderId: userId } }),
  ]);
  return { items, total };
}
