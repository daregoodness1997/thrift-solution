import nodeCrypto from "node:crypto";
import { prisma } from "./prisma";
import { createNotification } from "./notifications";

const WALLET_FUNDING_TYPES = [
  "wallet_funding",
  "funding",
  "referral_earning",
  "circle_withdrawal",
  "circle_interest",
  "payout",
];

/**
 * Find the original funding transaction for a given reference. Wallet funding
 * from Flutterwave virtual accounts is recorded with the `txRef` we generated
 * (`va_flw_<id>`); card/web checkout funding uses the donation/transaction
 * reference. We search both the transaction reference and the donation
 * payment reference so either style of reversal can be matched.
 */
export async function findFundingTransactionByReference(reference: string) {
  const byTxnRef = await prisma.transaction.findUnique({ where: { reference } });
  if (byTxnRef) return byTxnRef;

  const donation = await prisma.donation.findFirst({
    where: { paymentReference: reference },
    include: { transactions: true },
  });
  if (donation?.transactions?.length) {
    return donation.transactions.find((t) => t.type === "wallet_funding") || donation.transactions[0];
  }
  return null;
}

/** Circle accounts opened using a specific wallet-funding reference. */
export async function findCircleAccountsByFundingRef(fundedByTxnRef: string) {
  return prisma.circleAccount.findMany({
    where: { fundedByTxnRef, status: { in: ["active", "matured"] } },
    include: { circle: { select: { id: true, name: true } } },
  });
}

/**
 * Reverse a wallet-funding transaction. Creates a balancing negative
 * transaction so the derived wallet balance automatically corrects, and
 * marks the original as reversed (idempotent — safe to call twice).
 *
 * Returns the reversal transaction, or null if there was nothing to reverse
 * (already reversed, or not a credit type).
 */
export async function reverseWalletCredit(originalReference: string, reason: string) {
  return prisma.$transaction(async (tx) => {
    const original = await tx.transaction.findUnique({ where: { reference: originalReference } });
    if (!original) return null;
    if (original.reversalOf) return null; // already reversed
    if (!WALLET_FUNDING_TYPES.includes(original.type)) return null;
    if (original.status !== "completed") {
      // Mark non-completed funding as reversed so it never settles.
      await tx.transaction.update({
        where: { id: original.id },
        data: { status: "reversed", reversedAt: new Date() },
      });
      return null;
    }

    const reversalRef = `REV-${originalReference}`;
    const existing = await tx.transaction.findUnique({ where: { reference: reversalRef } });
    if (existing) return existing;

    const reversal = await tx.transaction.create({
      data: {
        userId: original.userId,
        type: "wallet_funding_reversal",
        amount: original.amount,
        reference: reversalRef,
        status: "completed",
        description: `Reversal of ${original.type} (${originalReference}): ${reason}`,
        reversalOf: originalReference,
        reversedAt: new Date(),
      },
    });

    await tx.transaction.update({
      where: { id: original.id },
      data: { status: "reversed", reversedAt: new Date() },
    });

    return reversal;
  });
}

/**
 * Unwind a circle account that was funded by a payment which was later
 * reversed. The account is marked `reversed` and its principal + processing
 * fee transactions are reversed so the user's balance is restored. Idempotent.
 */
export async function reverseCircleAccount(circleAccountId: string, reason: string) {
  return prisma.$transaction(async (tx) => {
    const account = await tx.circleAccount.findUnique({ where: { id: circleAccountId } });
    if (!account) return null;
    if (account.status === "reversed") return account;
    if (account.status !== "active" && account.status !== "matured") return account;

    const linked = await tx.transaction.findMany({
      where: {
        userId: account.userId,
        type: { in: ["circle_deposit", "circle_contribution", "circle_processing_fee"] },
        description: { contains: account.id },
        status: "completed",
      },
    });

    for (const t of linked) {
      const revRef = `REV-${t.reference}`;
      const existing = await tx.transaction.findUnique({ where: { reference: revRef } });
      if (existing) continue;
      await tx.transaction.create({
        data: {
          userId: t.userId,
          type: "circle_reversal",
          amount: t.amount,
          reference: revRef,
          status: "completed",
          description: `Reversal of ${t.type} for circle account ${account.id}: ${reason}`,
          reversalOf: t.reference,
          reversedAt: new Date(),
        },
      });
    }

    const updated = await tx.circleAccount.update({
      where: { id: account.id },
      data: {
        status: "reversed",
        weeksContributed: 0,
        interestEarned: 0,
        reversedAt: new Date(),
      },
    });

    await createNotification(account.userId, {
      type: "circle_reversed",
      title: "Circle subscription reversed",
      body: `Your subscription to "${account.circleId}" was reversed because the linked payment was reversed (${reason}).`,
      data: { circleAccountId: account.id, reason },
    }).catch(() => {});

    return updated;
  });
}

/** Reverse a donation/transaction record by reference (card/web checkout). */
export async function reverseDonationOrTransaction(reference: string, reason: string) {
  const donation = await prisma.donation.findFirst({ where: { paymentReference: reference } });
  if (donation && donation.status === "completed") {
    await prisma.donation.update({ where: { id: donation.id }, data: { status: "reversed" } });
  }

  const transaction = await prisma.transaction.findUnique({ where: { reference } });
  if (transaction && transaction.status === "completed") {
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: { status: "reversed", reversedAt: new Date() },
    });
  }
  return { donationId: donation?.id ?? null };
}

/**
 * Top-level reversal: given a funding reference (tx_ref / virtual-account
 * deposit ref), reverse the wallet credit and unwind any circle accounts that
 * were paid for with it. Idempotent and safe to call from webhooks or the
 * reconciliation job.
 */
export async function processPaymentReversal(reference: string, reason: string) {
  const original = await findFundingTransactionByReference(reference);
  const fundingRef = original?.reference ?? reference;

  const reversal = await reverseWalletCredit(fundingRef, reason);

  let reversedAccounts = 0;
  if (original) {
    const accounts = await findCircleAccountsByFundingRef(fundingRef);
    for (const acc of accounts) {
      await reverseCircleAccount(acc.id, reason);
      reversedAccounts += 1;
    }
  }

  await reverseDonationOrTransaction(reference, reason);

  return { fundingRef, walletReversed: !!reversal, reversedAccounts };
}
