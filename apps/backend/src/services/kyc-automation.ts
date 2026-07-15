// ============================================================================
// KYC AUTOMATION
// ============================================================================
// Drives the automated KYC flow used by the 3-step registration:
//   1. Verify BVN + NIN via CreditChek
//   2. Pull a credit report (advanced) for the user record
//   3. Auto-approve the KYC submission (no manual review)
//   4. (Caller) creates the user's virtual account synchronously
// ============================================================================

import { prisma } from "@thrift/db";
import {
  getKycByUserId,
  createVirtualAccount,
  hasVirtualAccount,
  setUserIdentity,
  setRegistrationProgress,
} from "@thrift/db";
import { creditChek, normaliseCreditReport } from "./creditchek";
import { getPaymentProvider, resolveVirtualAccount } from "./payments";
import { randomBytes } from "crypto";

const REGISTRATION_VA_PROVIDER =
  process.env.DEFAULT_VIRTUAL_ACCOUNT_PROVIDER || "flutterwave";

export interface AutomatedKycInput {
  userId: string;
  bvn: string;
  nin: string;
}

export interface AutomatedKycResult {
  kycId: string;
  status: string;
  creditScore?: number;
  virtualAccount?: {
    accountNumber: string;
    bankName: string;
    bankCode?: string;
  };
}

function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

/**
 * Verify BVN + NIN, persist a verified KYC record, and create the user's
 * virtual account via the configured payment provider.
 */
export async function runAutomatedKyc({
  userId,
  bvn,
  nin,
}: AutomatedKycInput): Promise<AutomatedKycResult> {
  const sanitisedBvn = bvn.replace(/\D/g, "");
  const sanitisedNin = nin.replace(/\D/g, "");

  // ── 1. Identity verification via CreditChek ───────────────────────────
  const [bvnRes, ninRes] = await Promise.all([
    creditChek.verifyBVN(sanitisedBvn),
    creditChek.verifyNIN(sanitisedNin),
  ]);

  if (!bvnRes.status || !bvnRes.data) {
    throw new Error(bvnRes.message || "BVN verification failed");
  }
  if (!ninRes.status || !ninRes.data) {
    throw new Error(ninRes.message || "NIN verification failed");
  }

  // ── 2. Credit report (best-effort) ────────────────────────────────
  let creditReport: any = null;
  try {
    const cr = await creditChek.getCreditReportAdvanced(sanitisedBvn);
    if (cr.status) creditReport = normaliseCreditReport(cr.data, "advanced");
  } catch (err) {
    console.warn("[KYC] Credit report fetch failed:", err);
  }

  // ── 3. Persist identity + auto-approve KYC ─────────────────────────
  await setUserIdentity(userId, { bvn: sanitisedBvn, nin: sanitisedNin });
  await setRegistrationProgress(userId, { step: 4, completedAt: new Date() });

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found");

  const verificationData: any = {
    bvn: bvnRes.data,
    nin: ninRes.data,
  };

  // Prefer the BVN-verified legal name, falling back to NIN, then the
  // user's self-entered name. This is the name used for the virtual account.
  const verifiedName =
    [bvnRes.data?.firstName, bvnRes.data?.lastName].filter(Boolean).join(" ").trim() ||
    bvnRes.data?.fullName ||
    [ninRes.data?.firstName, ninRes.data?.lastName].filter(Boolean).join(" ").trim() ||
    ninRes.data?.fullName ||
    user.name ||
    "";

  const existing = await getKycByUserId(userId);

  const kyc = await prisma.kyc.upsert({
    where: { userId },
    create: {
      userId,
      level: 1,
      idType: "bvn",
      idNumber: sanitisedBvn,
      bvn: sanitisedBvn,
      nin: sanitisedNin,
      verifiedName,
      creditReport,
      verificationData,
      status: "verified",
      verifiedAt: new Date(),
      submittedAt: new Date(),
    },
    update: {
      level: 1,
      idType: "bvn",
      idNumber: sanitisedBvn,
      bvn: sanitisedBvn,
      nin: sanitisedNin,
      verifiedName,
      creditReport,
      verificationData,
      status: "verified",
      rejectionReason: null,
      reviewedBy: null,
      verifiedAt: new Date(),
      submittedAt: new Date(),
    },
  });

  await prisma.kycAuditLog.create({
    data: {
      kycId: kyc.id,
      action: "auto_verified_creditchek",
      oldStatus: existing?.status ?? null,
      newStatus: "verified",
      notes: "Auto-verified via CreditChek (BVN + NIN)",
      performedBy: userId,
    },
  });

  // Upgrade tier to silver on KYC verification.
  await prisma.user.update({
    where: { id: userId },
    data: { accountTier: "silver" },
  });

  // ── 4. Virtual account (synchronous) ───────────────────────────────
  let virtualAccount: AutomatedKycResult["virtualAccount"];
  try {
    const provider = getPaymentProvider(REGISTRATION_VA_PROVIDER);

    if (provider?.createVirtualAccount && !(await hasVirtualAccount(userId))) {
      const reference = `va_reg_${Date.now()}_${randomBytes(6).toString("hex")}`;
      const { firstName, lastName } = splitName(verifiedName || user.name || user.email);

      const result = await provider.createVirtualAccount({
        email: user.email,
        firstName,
        lastName,
        bvn: sanitisedBvn,
        nin: sanitisedNin,
        reference,
        narration: "Thrift Solution Virtual Account",
      });

      const resolved = resolveVirtualAccount(result, user.email);

      const created = await createVirtualAccount({
        userId,
        provider: REGISTRATION_VA_PROVIDER,
        accountNumber: resolved.accountNumber,
        bankName: resolved.bankName,
        bankCode: resolved.bankCode,
        reference: result.reference,
        providerRef: result.providerRef,
        isPermanent: true,
        bvn: sanitisedBvn,
        nin: sanitisedNin,
        accountName: verifiedName || undefined,
      });

      virtualAccount = {
        accountNumber: created.accountNumber,
        bankName: created.bankName,
        bankCode: created.bankCode ?? undefined,
      };
    }
  } catch (err) {
    // Virtual account creation is non-fatal – the nightly job will retry.
    console.error("[KYC] Virtual account creation failed:", err);
  }

  return {
    kycId: kyc.id,
    status: kyc.status,
    creditScore: (creditReport?.computedScore as number | undefined) ?? undefined,
    virtualAccount,
  };
}
