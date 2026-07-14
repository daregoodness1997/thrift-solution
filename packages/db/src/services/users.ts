import nodeCrypto from "node:crypto";
import { prisma } from "./prisma";

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

export async function findUserById(id: string) {
  return prisma.user.findUnique({ where: { id } });
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
    data: { emailVerified: true, emailVerifiedAt: new Date() },
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

export async function updatePasswordHash(userId: string, passwordHash: string) {
  return prisma.user.update({ where: { id: userId }, data: { passwordHash } });
}
