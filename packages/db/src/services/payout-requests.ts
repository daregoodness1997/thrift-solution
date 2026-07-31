import nodeCrypto from "node:crypto";
import { prisma } from "./prisma";
import { toNum } from "./decimal";
import { getWalletBalance } from "./wallet";

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

/**
 * Create a wallet payout request. The user must have an admin-approved payout
 * bank account and enough available wallet balance. Only one in-flight request
 * (pending or approved) is allowed at a time.
 */
export async function createWalletPayoutRequest(
  userId: string,
  amount: number,
  note?: string,
) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found");

  if (!user.bankAccountNumber || !user.bankCode) {
    throw new Error("Please save a bank account in your profile before requesting a payout");
  }
  if (user.bankAccountStatus !== "approved") {
    throw new Error("Your payout bank account must be approved by an admin before requesting a payout");
  }

  const value = round2(Number(amount));
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error("Amount must be greater than 0");
  }

  const balance = await getWalletBalance(userId);
  if (value > balance) {
    throw new Error(`Insufficient wallet balance (available: ${balance.toLocaleString()})`);
  }

  const inFlight = await prisma.walletPayoutRequest.findFirst({
    where: { userId, status: { in: ["pending", "approved"] } },
  });
  if (inFlight) {
    throw new Error("You already have a payout request being processed");
  }

  return prisma.walletPayoutRequest.create({
    data: { userId, amount: value, note: note?.trim() || undefined },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
}

export async function getWalletPayoutRequestsByUser(
  userId: string,
  params: { page?: number; limit?: number; status?: string },
) {
  const { page = 1, limit = 20, status } = params;
  const where: Record<string, unknown> = { userId };
  if (status) where.status = status;

  const [items, total] = await Promise.all([
    prisma.walletPayoutRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.walletPayoutRequest.count({ where }),
  ]);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getAllWalletPayoutRequests(params: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}) {
  const { page = 1, limit = 20, status, search } = params;
  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { user: { name: { contains: search, mode: "insensitive" } } },
      { user: { email: { contains: search, mode: "insensitive" } } },
      { user: { accountNumber: { contains: search, mode: "insensitive" } } },
      { disbursementRef: { contains: search, mode: "insensitive" } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.walletPayoutRequest.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            accountNumber: true,
            bankName: true,
            bankCode: true,
            bankAccountNumber: true,
            bankAccountName: true,
            bankAccountStatus: true,
          },
        },
        reviewedBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.walletPayoutRequest.count({ where }),
  ]);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function approveWalletPayoutRequest(
  requestId: string,
  adminId: string,
  note?: string,
) {
  const request = await prisma.walletPayoutRequest.findUnique({
    where: { id: requestId },
    include: { user: true },
  });
  if (!request) throw new Error("Payout request not found");
  if (request.status !== "pending") throw new Error("Only pending payout requests can be approved");

  if (request.user.bankAccountStatus !== "approved") {
    throw new Error("User's payout bank account must be approved before disbursement");
  }

  return prisma.walletPayoutRequest.update({
    where: { id: requestId },
    data: {
      status: "approved",
      reviewedById: adminId,
      reviewedAt: new Date(),
      reviewedNote: note?.trim() || undefined,
    },
  });
}

export async function rejectWalletPayoutRequest(
  requestId: string,
  adminId: string,
  note?: string,
) {
  const request = await prisma.walletPayoutRequest.findUnique({ where: { id: requestId } });
  if (!request) throw new Error("Payout request not found");
  if (request.status !== "pending") throw new Error("Only pending payout requests can be rejected");

  return prisma.walletPayoutRequest.update({
    where: { id: requestId },
    data: {
      status: "rejected",
      reviewedById: adminId,
      reviewedAt: new Date(),
      reviewedNote: note?.trim() || undefined,
    },
  });
}

export async function cancelWalletPayoutRequest(requestId: string, userId: string) {
  const request = await prisma.walletPayoutRequest.findUnique({ where: { id: requestId } });
  if (!request) throw new Error("Payout request not found");
  if (request.userId !== userId) throw new Error("Not your payout request");
  if (request.status !== "pending") throw new Error("Only pending payout requests can be cancelled");

  return prisma.walletPayoutRequest.update({
    where: { id: requestId },
    data: { status: "cancelled" },
  });
}

interface DisbursementResult {
  status: string;
  providerRef?: string;
}

async function assertDisbursable(request: {
  status: string;
  disbursementStatus: string;
  user: {
    bankAccountNumber: string | null;
    bankCode: string | null;
    bankAccountStatus: string | null;
  };
}) {
  if (request.status === "disbursing") throw new Error("A disbursement for this request is already in progress");
  if (request.status !== "approved") throw new Error("Request must be approved before disbursement");
  if (request.disbursementStatus === "completed") throw new Error("Request is already disbursed");

  if (!request.user.bankAccountNumber || !request.user.bankCode) {
    throw new Error("User has no saved bank account number and bank code for transfer");
  }
  if (request.user.bankAccountStatus !== "approved") {
    throw new Error("User's payout bank account must be approved by an admin before disbursement");
  }
}

/**
 * Initiate a disbursement of an approved payout request via a payment provider.
 * The wallet is debited (completed) at disbursement time; if the provider later
 * reports the transfer as failed, `reconcileWalletPayoutDisbursementByRef` will
 * reverse the debit and return the request to `approved` for a retry.
 */
export async function disburseWalletPayoutRequestViaFlutterwave(
  requestId: string,
  adminId: string,
  transfer: (params: {
    accountNumber: string;
    bankCode: string;
    amount: number;
    reference: string;
  }) => Promise<DisbursementResult>,
) {
  const request = await prisma.walletPayoutRequest.findUnique({
    where: { id: requestId },
    include: { user: true },
  });
  if (!request) throw new Error("Payout request not found");

  await assertDisbursable(request);

  const amount = round2(toNum(request.amount));
  const balance = await getWalletBalance(request.userId);
  if (amount > balance) {
    throw new Error(`Insufficient wallet balance to disburse (available: ${balance.toLocaleString()})`);
  }

  const reference = `WALLETDIS-${Date.now().toString(36)}-${nodeCrypto.randomBytes(6).toString("hex")}`;

  let result: DisbursementResult;
  try {
    result = await transfer({
      accountNumber: request.user.bankAccountNumber!,
      bankCode: request.user.bankCode!,
      amount,
      reference,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Transfer failed";
    await prisma.walletPayoutRequest.update({
      where: { id: requestId },
      data: {
        disbursementMethod: "flutterwave",
        disbursementStatus: "failed",
        disbursementRef: reference,
        disbursementNote: message,
        disbursedById: adminId,
      },
    });
    throw new Error(`Disbursement failed: ${message}`);
  }

  const accepted = result.status === "completed" || result.status === "pending";
  const txnStatus = result.status === "completed" ? "completed" : result.status === "pending" ? "completed" : "failed";

  return prisma.$transaction(async (tx) => {
    await tx.transaction.create({
      data: {
        userId: request.userId,
        type: "wallet_payout",
        amount,
        reference,
        status: accepted ? "completed" : "failed",
        description: `Wallet payout to ${request.user.bankAccountName || "your bank account"} (${request.user.bankAccountNumber})`,
      },
    });

    return tx.walletPayoutRequest.update({
      where: { id: requestId },
      data: {
        status: accepted ? (result.status === "completed" ? "disbursed" : "disbursing") : "disbursement_failed",
        disbursementMethod: "flutterwave",
        disbursementStatus: accepted ? "pending" : "failed",
        disbursementRef: result.providerRef || reference,
        disbursementNote: accepted ? undefined : `Provider returned status "${result.status}"`,
        disbursedById: adminId,
        disbursedAt: new Date(),
      },
    });
  });
}

/**
 * Record a disbursement that was completed out-of-band (e.g. an admin made the
 * bank transfer manually). Debits the wallet and marks the request disbursed.
 */
export async function markWalletPayoutRequestDisbursed(
  requestId: string,
  adminId: string,
  data: { proofUrl?: string; note?: string; reference?: string },
) {
  const request = await prisma.walletPayoutRequest.findUnique({
    where: { id: requestId },
    include: { user: true },
  });
  if (!request) throw new Error("Payout request not found");
  if (request.status !== "approved") throw new Error("Request must be approved before it can be marked disbursed");
  if (request.disbursementStatus === "completed") throw new Error("Request is already disbursed");
  if (!data.proofUrl && !data.reference) {
    throw new Error("Provide a proof URL or a transfer reference");
  }

  const amount = round2(toNum(request.amount));
  const balance = await getWalletBalance(request.userId);
  if (amount > balance) {
    throw new Error(`Insufficient wallet balance to disburse (available: ${balance.toLocaleString()})`);
  }

  const reference =
    data.reference || `WALLETDIS-${Date.now().toString(36)}-${nodeCrypto.randomBytes(6).toString("hex")}`;

  return prisma.$transaction(async (tx) => {
    await tx.transaction.create({
      data: {
        userId: request.userId,
        type: "wallet_payout",
        amount,
        reference,
        status: "completed",
        description: `Wallet payout to ${request.user.bankAccountName || "your bank account"} (${request.user.bankAccountNumber})`,
      },
    });

    return tx.walletPayoutRequest.update({
      where: { id: requestId },
      data: {
        status: "disbursed",
        disbursementMethod: "manual",
        disbursementStatus: "completed",
        disbursementRef: reference,
        disbursementProofUrl: data.proofUrl || undefined,
        disbursementNote: data.note || undefined,
        disbursedById: adminId,
        disbursedAt: new Date(),
      },
    });
  });
}

/**
 * Reconcile a wallet payout transfer from a provider `transfer` webhook.
 * Matches the request by its stored `disbursementRef`, updates the disbursement
 * status and, on failure, reverses the wallet debit so funds return to the user
 * and the request goes back to `approved` for a retry.
 */
export async function reconcileWalletPayoutDisbursementByRef(
  reference: string,
  status: "completed" | "failed",
): Promise<boolean> {
  const request = await prisma.walletPayoutRequest.findFirst({
    where: { disbursementRef: reference, disbursementMethod: "flutterwave" },
  });
  if (!request) return false;
  if (request.disbursementStatus === status) return true;

  return prisma.$transaction(async (tx) => {
    await tx.walletPayoutRequest.update({
      where: { id: request.id },
      data: {
        disbursementStatus: status,
        status: status === "completed" ? "disbursed" : "approved",
        disbursedAt: status === "completed" ? new Date() : null,
        disbursementNote:
          status === "failed" ? "Transfer failed; funds returned to wallet." : undefined,
      },
    });
    await tx.transaction.updateMany({
      where: { userId: request.userId, type: "wallet_payout", reference, status: { not: status } },
      data: { status },
    });
    return true;
  });
}
