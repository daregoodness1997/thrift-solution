import { prisma } from "./prisma";

export type VerificationType =
  | "email_verification"
  | "phone_verification"
  | "password_reset"
  | "two_factor";

export type VerificationChannel = "email" | "sms";

export interface CreateVerificationTokenInput {
  userId: string;
  type: VerificationType;
  channel: VerificationChannel;
  destination?: string;
  code: string;
  expiresAt: Date;
}

export async function createVerificationToken(input: CreateVerificationTokenInput) {
  return prisma.verificationToken.create({
    data: {
      userId: input.userId,
      type: input.type,
      channel: input.channel,
      destination: input.destination,
      code: input.code,
      expiresAt: input.expiresAt,
    },
  });
}

export async function findValidVerificationToken(
  userId: string,
  type: VerificationType,
  code: string,
) {
  return prisma.verificationToken.findFirst({
    where: {
      userId,
      type,
      code,
      consumedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function consumeVerificationToken(id: string) {
  return prisma.verificationToken.update({
    where: { id },
    data: { consumedAt: new Date() },
  });
}

export async function deleteVerificationTokens(userId: string, type: VerificationType) {
  return prisma.verificationToken.deleteMany({ where: { userId, type } });
}
