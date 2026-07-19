import { generateSecret, generateURI, verifySync, type VerifyResult } from "otplib";

const ISSUER = "GFW";

export function generateTotpSecret(): string {
  return generateSecret();
}

export function getTotpUri(secret: string, email: string): string {
  return generateURI({ issuer: ISSUER, label: email, secret });
}

export function verifyTotp(secret: string, token: string): boolean {
  try {
    const result = verifySync({ token: token.replace(/\s/g, ""), secret }) as VerifyResult;
    return typeof result === "boolean" ? result : Boolean((result as { valid?: boolean }).valid);
  } catch {
    return false;
  }
}
