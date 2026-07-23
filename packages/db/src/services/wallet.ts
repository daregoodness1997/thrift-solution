import nodeCrypto from "node:crypto";
import { prisma } from "./prisma";
import { toNum } from "./decimal";

const CREDIT_TYPES = ["funding", "wallet_funding", "payout", "circle_withdrawal", "circle_interest", "referral_earning"];
const DEBIT_TYPES = ["contribution", "circle_deposit", "circle_contribution", "circle_default_clearance", "circle_processing_fee"];

const COMMITTED_STATUSES = ["active"];
const MATURED_STATUSES = ["matured"];

export interface WalletBreakdown {
  total: number;
  available: number;
  committed: number;
  matured: number;
}

export async function getWalletBalance(userId: string): Promise<number> {
  const { available } = await getWalletBreakdown(userId);
  return available;
}

export async function getWalletBreakdown(userId: string): Promise<WalletBreakdown> {
  const credits = await prisma.transaction.aggregate({
    where: { userId, status: "completed", type: { in: CREDIT_TYPES } },
    _sum: { amount: true },
  });
  const debits = await prisma.transaction.aggregate({
    where: { userId, status: "completed", type: { in: DEBIT_TYPES } },
    _sum: { amount: true },
  });
  const total = toNum(credits._sum.amount) - toNum(debits._sum.amount);

  const committedResult = await prisma.circleAccount.aggregate({
    where: { userId, status: { in: COMMITTED_STATUSES } },
    _sum: { principalAmount: true },
  });
  const committed = toNum(committedResult._sum.principalAmount);

  const maturedAccounts = await prisma.circleAccount.findMany({
    where: { userId, status: { in: MATURED_STATUSES } },
    select: { principalAmount: true, interestEarned: true, totalWithdrawn: true },
  });
  const matured = maturedAccounts.reduce(
    (sum, a) => sum + Math.max(0, toNum(a.principalAmount) + toNum(a.interestEarned) - toNum(a.totalWithdrawn)),
    0,
  );

  const available = Math.max(0, total);
  const combinedTotal = available + committed + matured;
  return { total: combinedTotal, available, committed, matured };
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
