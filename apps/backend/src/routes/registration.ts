import { Router } from "express";
import bcrypt from "bcryptjs";
import {
  findUserByEmail,
  createUser,
  findUserByReferralCode,
  createReferral,
  createReferralEarning,
  createTransaction,
  getTierForCount,
  setEmailVerified,
  setRegistrationProgress,
  prisma,
  updateTransactionPaymentUrl,
} from "@thrift/db";
import { signToken, authMiddleware } from "../middleware/auth";
import { issueOtp, verifyOtp } from "../services/auth/otp";
import { getPaymentProvider } from "../services/payments";
import { runAutomatedKyc } from "../services/kyc-automation";

export const registrationRouter = Router();

const REGISTRATION_FEE = parseInt(
  process.env.REGISTRATION_FEE_NGN || "4200",
  10,
);
const REGISTRATION_PROVIDER =
  process.env.REGISTRATION_PAYMENT_PROVIDER || "flutterwave";
const DASHBOARD_URL = process.env.DASHBOARD_URL || "http://localhost:3001";

function publicUser(user: {
  id: string;
  email: string;
  name: string;
  accountNumber: string;
  accountTier: string;
  role: string;
  emailVerified: boolean;
  registrationStep: number;
  registrationFeePaid: boolean;
}) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    accountNumber: user.accountNumber,
    accountTier: user.accountTier,
    role: user.role,
    emailVerified: user.emailVerified,
    registrationStep: user.registrationStep,
    registrationFeePaid: user.registrationFeePaid,
  };
}

// ── Step 1: Basic details ────────────────────────────────────────────────
registrationRouter.post("/basic", async (req, res) => {
  try {
    const {
      email,
      name,
      password,
      phone,
      referralCode: rawReferralCode,
    } = req.body;
    const referralCode =
      typeof rawReferralCode === "string"
        ? rawReferralCode.trim()
        : rawReferralCode;

    if (!email || !name || !password) {
      res.status(400).json({
        success: false,
        error: "Email, name, and password are required",
      });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({
        success: false,
        error: "Password must be at least 6 characters",
      });
      return;
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      res
        .status(409)
        .json({ success: false, error: "Email already registered" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await createUser({ email, name, passwordHash });
    if (phone) {
      await prisma.user.update({ where: { id: user.id }, data: { phone } });
    }

    if (referralCode) {
      const referrer = await findUserByReferralCode(referralCode);
      if (referrer && referrer.id !== user.id) {
        const referral = await createReferral(referrer.id, user.id);
        const completedCount = await prisma.referral.count({
          where: { referrerId: referrer.id, status: "completed" },
        });
        const tier = getTierForCount(completedCount);

        await createReferralEarning({
          referralId: referral.id,
          referrerId: referrer.id,
          tier: tier.name,
          amount: tier.amount,
          status: "credited",
        });

        const earnRef = `REF-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        await createTransaction({
          userId: referrer.id,
          type: "referral_earning",
          amount: tier.amount,
          reference: earnRef,
          description: `Referral reward for referring ${name}`,
        });

        await prisma.user.update({
          where: { id: user.id },
          data: { referredBy: referrer.id },
        });
      }
    }

    await issueOtp({
      userId: user.id,
      type: "email_verification",
      channel: "email",
      destination: user.email,
      title: "Verify your email",
      actionLabel: "verify your email address",
    });

    res.status(201).json({
      success: true,
      data: {
        userId: user.id,
        emailVerified: false,
        message: "Verification code sent to your email",
      },
    });
  } catch (err) {
    console.error("Registration basic error:", err);
    res.status(500).json({ success: false, error: "Registration failed" });
  }
});

// ── Step 1 (cont.): Email verification ───────────────────────────────────
registrationRouter.post("/verify-email", async (req, res) => {
  try {
    const { userId, email, code } = req.body;
    if ((!userId && !email) || !code) {
      res
        .status(400)
        .json({ success: false, error: "User and code are required" });
      return;
    }

    const user = userId
      ? await prisma.user.findUnique({ where: { id: userId } })
      : await findUserByEmail(email);

    if (!user) {
      res.status(404).json({ success: false, error: "User not found" });
      return;
    }

    const ok = await verifyOtp(user.id, "email_verification", code);
    if (!ok) {
      res
        .status(400)
        .json({ success: false, error: "Invalid or expired code" });
      return;
    }

    await setEmailVerified(user.id);

    const token = signToken({ userId: user.id, email: user.email });
    res.json({
      success: true,
      data: { user: publicUser(user), token, emailVerified: true },
    });
  } catch (err) {
    console.error("Registration verify email error:", err);
    res
      .status(500)
      .json({ success: false, error: "Email verification failed" });
  }
});

// ── Progress status ───────────────────────────────────────────────────────
registrationRouter.get("/status", authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        registrationStep: true,
        registrationFeePaid: true,
        emailVerified: true,
        bvn: true,
        nin: true,
      },
    });
    const kyc = await prisma.kyc.findUnique({
      where: { userId: req.user!.userId },
      select: { status: true },
    });

    res.json({
      success: true,
      data: {
        registrationStep: user?.registrationStep ?? 1,
        registrationFeePaid: user?.registrationFeePaid ?? false,
        emailVerified: user?.emailVerified ?? false,
        hasBvn: !!user?.bvn,
        hasNin: !!user?.nin,
        kycStatus: kyc?.status ?? "none",
      },
    });
  } catch (err) {
    console.error("Registration status error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch status" });
  }
});

// ── Step 2: Initialize registration payment (₦4,200) ────────────────────
registrationRouter.post(
  "/payment/initialize",
  authMiddleware,
  async (req, res) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.userId },
      });
      if (!user) {
        res.status(404).json({ success: false, error: "User not found" });
        return;
      }
      if (user.registrationFeePaid) {
        res
          .status(409)
          .json({ success: false, error: "Registration fee already paid" });
        return;
      }

      const amount = REGISTRATION_FEE;
      const reference = `REG-${user.id}-${Date.now()}`;

      await createTransaction({
        userId: user.id,
        type: "registration_fee",
        amount,
        reference,
        description: "Registration fee",
      });

      const provider = getPaymentProvider(REGISTRATION_PROVIDER);
      const result = await provider.initializePayment({
        amount,
        email: user.email,
        reference,
        metadata: { type: "registration_fee", userId: user.id },
        callbackUrl: `${DASHBOARD_URL}/register?reference=${encodeURIComponent(reference)}`,
      });

      // Store payment URL on transaction for later resumption
      const transaction = await prisma.transaction.findUnique({
        where: { reference },
      });
      if (transaction) {
        await updateTransactionPaymentUrl(
          transaction.id,
          result.authorizationUrl,
          REGISTRATION_PROVIDER,
        );
      }

      await setRegistrationProgress(user.id, { step: 2 });

      res.json({
        success: true,
        data: { authorizationUrl: result.authorizationUrl, reference, amount },
      });
    } catch (err) {
      console.error("Registration payment init error:", err);
      res
        .status(500)
        .json({ success: false, error: "Failed to initialize payment" });
    }
  },
);

// ── Step 2 (cont.): Verify registration payment ──────────────────────────
registrationRouter.post("/payment/verify", authMiddleware, async (req, res) => {
  try {
    const { reference } = req.body;
    if (!reference) {
      res.status(400).json({ success: false, error: "Reference is required" });
      return;
    }

    const transaction = await prisma.transaction.findUnique({
      where: { reference },
    });
    if (!transaction || transaction.userId !== req.user!.userId) {
      res.status(404).json({ success: false, error: "Transaction not found" });
      return;
    }
    if (transaction.status === "completed") {
      await setRegistrationProgress(req.user!.userId, {
        step: 3,
        feePaid: true,
      });
      res.json({ success: true, data: { status: "completed", feePaid: true } });
      return;
    }

    const provider = getPaymentProvider(REGISTRATION_PROVIDER);
    const verification = await provider.verifyPayment(reference);

    if (verification.status === "completed") {
      await prisma.transaction.update({
        where: { reference },
        data: { status: "completed" },
      });
      await setRegistrationProgress(req.user!.userId, {
        step: 3,
        feePaid: true,
      });

      res.json({ success: true, data: { status: "completed", feePaid: true } });
    } else {
      res.status(400).json({ success: false, error: "Payment not completed" });
    }
  } catch (err) {
    console.error("Registration payment verify error:", err);
    res.status(500).json({ success: false, error: "Failed to verify payment" });
  }
});

// ── Step 3: KYC (BVN + NIN) → auto-verify → virtual account ───────────
registrationRouter.post("/kyc", authMiddleware, async (req, res) => {
  try {
    const { bvn, nin } = req.body;

    if (!bvn || !nin) {
      res
        .status(400)
        .json({ success: false, error: "Both BVN and NIN are required" });
      return;
    }
    if (!/^\d{11}$/.test(bvn.replace(/\D/g, ""))) {
      res.status(400).json({ success: false, error: "BVN must be 11 digits" });
      return;
    }
    if (!/^\d{11}$/.test(nin.replace(/\D/g, ""))) {
      res.status(400).json({ success: false, error: "NIN must be 11 digits" });
      return;
    }

    const result = await runAutomatedKyc({
      userId: req.user!.userId,
      bvn,
      nin,
    });

    res.status(201).json({ success: true, data: result });
  } catch (err: any) {
    console.error("Registration KYC error:", err);
    res.status(400).json({
      success: false,
      error: err.message || "KYC verification failed",
    });
  }
});
