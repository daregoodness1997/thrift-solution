import { prisma } from "./prisma";

export async function createRefreshToken(userId: string, token: string, expiresAt: Date) {
  return prisma.refreshToken.create({
    data: { userId, token, expiresAt },
  });
}

export async function findRefreshToken(token: string) {
  return prisma.refreshToken.findUnique({
    where: { token },
  });
}

export async function deleteRefreshToken(token: string) {
  return prisma.refreshToken.deleteMany({
    where: { token },
  });
}

export async function deleteUserRefreshTokens(userId: string) {
  return prisma.refreshToken.deleteMany({
    where: { userId },
  });
}

export async function deleteExpiredRefreshTokens() {
  return prisma.refreshToken.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
}
