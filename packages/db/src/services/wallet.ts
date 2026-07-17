import nodeCrypto from "node:crypto";
import { prisma } from "./prisma";

const CREDIT_TYPES = ["funding", "wallet_funding", "payout", "circle_withdrawal", "circle_interest", "referral_earning"];
const DEBIT_TYPES = ["contribution", "circle_deposit", "circle_contribution", "circle_default_clearance", "circle_processing_fee"];

// Locked funds: principal still committed to an active (not yet matured/withdrawn) circle account.
const COMMITTED_STATUSES = ["active"];

// Matured funds: principal + interest earned that has matured but not yet been
// disbursed/withdrawn to the wallet.
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
  const total = (credits._sum.amount || 0) - (debits._sum.amount || 0);

  // Funds locked in active circles. These contributions are already reflected
  // as debits in `total` (circle_deposit / circle_contribution transactions),
  // so they must NOT be subtracted again here — doing so double-counts the
  // locked money and wrongly drives available balance to 0.
  const committedResult = await prisma.circleAccount.aggregate({
    where: { userId, status: { in: COMMITTED_STATUSES } },
    _sum: { principalAmount: true },
  });
  const committed = committedResult._sum.principalAmount || 0;

  // Matured balances: principal + interest earned that has reached maturity but
  // not yet been withdrawn/disbursed. `totalWithdrawn` tracks any partial
  // payouts already released, so we net that out.
  const maturedAccounts = await prisma.circleAccount.findMany({
    where: { userId, status: { in: MATURED_STATUSES } },
    select: { principalAmount: true, interestEarned: true, totalWithdrawn: true },
  });
  const matured = maturedAccounts.reduce(
    (sum, a) => sum + Math.max(0, a.principalAmount + a.interestEarned - a.totalWithdrawn),
    0,
  );

  const available = Math.max(0, total);
  // Total balance is the user's money overall: spendable now plus funds locked
  // in active circles. The locked principal is already accounted for as a debit
  // in `total`, so we add it back to present the true combined balance.
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
