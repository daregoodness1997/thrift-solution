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
