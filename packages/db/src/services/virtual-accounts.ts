import { PrismaClient, VirtualAccount } from "@prisma/client";

const prisma = new PrismaClient();

export interface CreateVirtualAccountParams {
  userId: string;
  provider: string;
  accountNumber: string;
  bankName: string;
  bankCode?: string;
  currency?: string;
  reference: string;
  providerRef?: string;
  isPermanent?: boolean;
  bvn?: string;
  nin?: string;
  accountName?: string;
}

export async function createVirtualAccount(
  params: CreateVirtualAccountParams
): Promise<VirtualAccount> {
  return prisma.virtualAccount.create({
    data: {
      userId: params.userId,
      provider: params.provider,
      accountNumber: params.accountNumber,
      bankName: params.bankName,
      bankCode: params.bankCode,
      currency: params.currency || "NGN",
      reference: params.reference,
      providerRef: params.providerRef,
      isPermanent: params.isPermanent ?? true,
      bvn: params.bvn,
      nin: params.nin,
      accountName: params.accountName,
      status: "active",
    },
  });
}

export async function getVirtualAccountsByUser(
  userId: string
): Promise<VirtualAccount[]> {
  return prisma.virtualAccount.findMany({
    where: {
      userId,
      deletedAt: null,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getVirtualAccountById(
  id: string
): Promise<VirtualAccount | null> {
  return prisma.virtualAccount.findUnique({
    where: { id },
  });
}

export async function getVirtualAccountByAccountNumber(
  accountNumber: string
): Promise<VirtualAccount | null> {
  return prisma.virtualAccount.findFirst({
    where: {
      accountNumber,
      deletedAt: null,
    },
  });
}

export async function getVirtualAccountByReference(
  reference: string
): Promise<VirtualAccount | null> {
  return prisma.virtualAccount.findFirst({
    where: {
      reference,
      deletedAt: null,
    },
  });
}

export async function updateVirtualAccountStatus(
  id: string,
  status: string
): Promise<VirtualAccount> {
  return prisma.virtualAccount.update({
    where: { id },
    data: { status },
  });
}

export async function updateVirtualAccountLastTransfer(
  id: string
): Promise<VirtualAccount> {
  return prisma.virtualAccount.update({
    where: { id },
    data: { lastTransferAt: new Date() },
  });
}

export async function deleteVirtualAccount(id: string): Promise<VirtualAccount> {
  return prisma.virtualAccount.update({
    where: { id },
    data: { deletedAt: new Date },
  });
}

export async function getUsersWithoutVirtualAccounts(): Promise<{ id: string; email: string; name: string; bvn: string | null; nin: string | null; verifiedName: string | null }[]> {
  return prisma.$queryRaw`
    SELECT u.id, u.email, u.name, k.bvn, k.nin, k.verified_name AS "verifiedName"
    FROM users u
    INNER JOIN kyc k ON k.user_id = u.id AND k.status IN ('verified', 'approved') AND k.deleted_at IS NULL
    LEFT JOIN virtual_accounts va ON va.user_id = u.id AND va.deleted_at IS NULL
    WHERE va.id IS NULL
    AND u.deleted_at IS NULL
    AND k.bvn IS NOT NULL
    AND k.bvn <> ''
    AND k.nin IS NOT NULL
    AND k.nin <> ''
    LIMIT 50
  `;
}

export async function hasVirtualAccountForProvider(
  userId: string,
  provider: string
): Promise<boolean> {
  const count = await prisma.virtualAccount.count({
    where: {
      userId,
      provider,
      deletedAt: null,
    },
  });
  return count > 0;
}

/**
 * Returns true if the user already has any active virtual account.
 * Used to enforce the one-virtual-account-per-user (1:1) rule globally,
 * regardless of payment provider.
 */
export async function hasVirtualAccount(userId: string): Promise<boolean> {
  const count = await prisma.virtualAccount.count({
    where: {
      userId,
      deletedAt: null,
    },
  });
  return count > 0;
}
