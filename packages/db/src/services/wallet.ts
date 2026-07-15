import nodeCrypto from "node:crypto";
import { prisma } from "./prisma";

const CREDIT_TYPES = ["funding", "wallet_funding", "payout", "circle_withdrawal", "circle_interest", "referral_earning"];
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

export async function creditWallet(
  userId: string,
  amount: number,
  type: string,
  description: string,
  reference?: string,
) {
  const txnReference =
    reference || `${type.toUpperCase()}-${Date.now()}-${nodeCrypto.randomBytes(4).toString("hex")}`;
  return prisma.transaction.create({
    data: { userId, type, amount, reference: txnReference, status: "completed", description },
  });
}
