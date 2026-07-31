import nodeCrypto from "node:crypto";
import { prisma } from "./prisma";
import { encryptField } from "../encryption";

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

export async function findUserByPhone(phone: string) {
  return prisma.user.findFirst({ where: { phone } });
}

export async function findUserById(id: string) {
  return prisma.user.findUnique({ where: { id } });
}

export async function findUserByBankAccountNumber(bankAccountNumber: string) {
  return prisma.user.findFirst({
    where: { bankAccountNumber, deletedAt: null },
    select: {
      id: true,
      name: true,
      accountNumber: true,
      email: true,
    },
  });
}

async function generateAccountNumber(): Promise<string> {
  const lastUser = await prisma.user.findFirst({
    orderBy: { createdAt: "desc" },
    select: { accountNumber: true },
  });

  let nextNumber = 1;
  if (lastUser?.accountNumber) {
    const match = lastUser.accountNumber.match(/(\d+)$/);
    if (match) {
      nextNumber = parseInt(match[1], 10) + 1;
    }
  }

  return `THR-${String(nextNumber).padStart(6, "0")}`;
}

function generateCode(name: string): string {
  const clean = name.replace(/[^A-Z]/gi, "").toUpperCase().slice(0, 6);
  const suffix = nodeCrypto.randomBytes(2).toString("hex").toUpperCase();
  return `${clean}-${suffix}`;
}

export async function createUser(data: { email: string; name: string; passwordHash: string }) {
  let code = generateCode(data.name);
  let attempts = 0;
  while (attempts < 10) {
    const existing = await prisma.user.findUnique({ where: { referralCode: code } });
    if (!existing) break;
    code = generateCode(data.name);
    attempts++;
  }

  let accountNumber = await generateAccountNumber();
  let accAttempts = 0;
  while (accAttempts < 10) {
    const existing = await prisma.user.findUnique({ where: { accountNumber } });
    if (!existing) break;
    accountNumber = await generateAccountNumber();
    accAttempts++;
  }

  return prisma.user.create({ data: { ...data, referralCode: code, accountNumber, accountTier: "basic" } });
}

export async function setEmailVerified(userId: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { emailVerified: true, emailVerifiedAt: new Date(), email2faEnabled: true, twoFactorEnabled: true },
  });
}

export async function setPhoneVerified(userId: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { phoneVerified: true, phoneVerifiedAt: new Date() },
  });
}

export async function setTotpSecret(userId: string, secret: string) {
  return prisma.user.update({ where: { id: userId }, data: { totpSecret: secret } });
}

export async function setTwoFactorEnabled(userId: string, enabled: boolean) {
  return prisma.user.update({ where: { id: userId }, data: { twoFactorEnabled: enabled } });
}

export async function setEmail2faEnabled(userId: string, enabled: boolean) {
  return prisma.user.update({ where: { id: userId }, data: { email2faEnabled: enabled } });
}

export async function updatePasswordHash(userId: string, passwordHash: string) {
  return prisma.user.update({ where: { id: userId }, data: { passwordHash } });
}

export async function setUserIdentity(userId: string, data: { bvn?: string; nin?: string }) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      ...(data.bvn !== undefined ? { bvn: encryptField(data.bvn) } : {}),
      ...(data.nin !== undefined ? { nin: encryptField(data.nin) } : {}),
    },
  });
}

export async function setUserBankDetails(
  userId: string,
  data: { bankName?: string; bankCode?: string; bankAccountNumber?: string; bankAccountName?: string },
) {
  const existing = await prisma.user.findUnique({ where: { id: userId } });
  if (!existing) throw new Error("User not found");

  const patch: Record<string, unknown> = {};
  if (data.bankName !== undefined) patch.bankName = data.bankName;
  if (data.bankCode !== undefined) patch.bankCode = data.bankCode;
  if (data.bankAccountNumber !== undefined) patch.bankAccountNumber = data.bankAccountNumber;
  if (data.bankAccountName !== undefined) patch.bankAccountName = data.bankAccountName;

  const changed =
    (patch.bankName !== undefined && patch.bankName !== existing.bankName) ||
    (patch.bankCode !== undefined && patch.bankCode !== existing.bankCode) ||
    (patch.bankAccountNumber !== undefined && patch.bankAccountNumber !== existing.bankAccountNumber) ||
    (patch.bankAccountName !== undefined && patch.bankAccountName !== existing.bankAccountName);

  if (changed) {
    patch.bankAccountStatus = "pending";
    patch.bankAccountRejectionReason = null;
    patch.bankAccountReviewedById = null;
    patch.bankAccountReviewedAt = null;
  }

  return prisma.user.update({ where: { id: userId }, data: patch });
}

export async function setUserNextOfKin(
  userId: string,
  data: { name?: string; phone?: string; email?: string; relationship?: string },
) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      ...(data.name !== undefined ? { nextOfKinName: data.name } : {}),
      ...(data.phone !== undefined ? { nextOfKinPhone: data.phone } : {}),
      ...(data.email !== undefined ? { nextOfKinEmail: data.email } : {}),
      ...(data.relationship !== undefined ? { nextOfKinRelationship: data.relationship } : {}),
    },
  });
}

export async function listPayoutAccounts(params: {
  page?: number;
  limit?: number;
  status?: "pending" | "approved" | "rejected";
  search?: string;
}) {
  const { page = 1, limit = 20, status, search } = params;
  const where: Record<string, unknown> = { bankAccountNumber: { not: null }, deletedAt: null };
  if (status) where.bankAccountStatus = status;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { bankAccountNumber: { contains: search, mode: "insensitive" } },
      { bankAccountName: { contains: search, mode: "insensitive" } },
      { bankName: { contains: search, mode: "insensitive" } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
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
        bankAccountRejectionReason: true,
        bankAccountReviewedById: true,
        bankAccountReviewedAt: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function approvePayoutAccount(userId: string, adminId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found");
  if (!user.bankAccountNumber) throw new Error("User has no payout account to approve");

  return prisma.user.update({
    where: { id: userId },
    data: {
      bankAccountStatus: "approved",
      bankAccountRejectionReason: null,
      bankAccountReviewedById: adminId,
      bankAccountReviewedAt: new Date(),
    },
    select: {
      id: true,
      name: true,
      email: true,
      bankName: true,
      bankCode: true,
      bankAccountNumber: true,
      bankAccountName: true,
      bankAccountStatus: true,
    },
  });
}

export async function rejectPayoutAccount(userId: string, adminId: string, reason?: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found");
  if (!user.bankAccountNumber) throw new Error("User has no payout account to reject");

  return prisma.user.update({
    where: { id: userId },
    data: {
      bankAccountStatus: "rejected",
      bankAccountRejectionReason: reason ?? "Rejected by admin",
      bankAccountReviewedById: adminId,
      bankAccountReviewedAt: new Date(),
    },
    select: {
      id: true,
      name: true,
      email: true,
      bankName: true,
      bankCode: true,
      bankAccountNumber: true,
      bankAccountName: true,
      bankAccountStatus: true,
      bankAccountRejectionReason: true,
    },
  });
}

export async function setTransactionPin(userId: string, pinHash: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { transactionPinHash: pinHash },
  });
}

export async function findUserByAccountNumber(accountNumber: string) {
  return prisma.user.findFirst({
    where: { accountNumber, deletedAt: null },
    select: { id: true, name: true, accountNumber: true, email: true },
  });
}

export async function setRegistrationProgress(
  userId: string,
  data: { step?: number; feePaid?: boolean; completedAt?: Date | null }
) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      ...(data.step !== undefined ? { registrationStep: data.step } : {}),
      ...(data.feePaid !== undefined ? { registrationFeePaid: data.feePaid } : {}),
      ...(data.completedAt !== undefined ? { registrationCompletedAt: data.completedAt } : {}),
    },
  });
}

/** Extract the verified name recorded on the user's NIN from the stored CreditChek data. */
export async function getUserNinName(userId: string): Promise<string | null> {
  const kyc = await prisma.kyc.findUnique({ where: { userId } });
  const verificationData = kyc?.verificationData as
    | { nin?: { firstName?: string; lastName?: string; fullName?: string } }
    | null
    | undefined;
  const nin = verificationData?.nin;
  const name = [nin?.firstName, nin?.lastName].filter(Boolean).join(" ").trim() || nin?.fullName || null;
  return name?.trim() || null;
}

/** Lenient name comparison: ignores case, punctuation and extra whitespace. */
export function namesMatch(a?: string | null, b?: string | null): boolean {
  const normalize = (s?: string | null) => (s || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  const na = normalize(a);
  const nb = normalize(b);
  if (!na || !nb) return false;
  return na === nb || na.includes(nb) || nb.includes(na);
}
