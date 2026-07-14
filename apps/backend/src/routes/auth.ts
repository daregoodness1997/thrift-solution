import { Router } from "express";
import bcrypt from "bcryptjs";
import {
  findUserByEmail,
  createUser,
  findUserById,
  findUserByReferralCode,
  createReferral,
  createReferralEarning,
  createTransaction,
  getTierForCount,
  setEmailVerified,
  setPhoneVerified,
  setTotpSecret,
  setTwoFactorEnabled,
  updatePasswordHash,
  deleteVerificationTokens,
  prisma,
} from "@thrift/db";
import { signToken, signChallengeToken, verifyChallengeToken, authMiddleware } from "../middleware/auth";
import { issueOtp, verifyOtp } from "../services/auth/otp";
import { generateTotpSecret, getTotpUri, verifyTotp } from "../services/auth/totp";
import { sendWelcomeEmail, sendPasswordResetEmail } from "../services/auth/emails";

export const authRouter = Router();

const dashboardUrl = () => process.env.DASHBOARD_URL || "http://localhost:3001";

function publicUser(user: {
  id: string;
  email: string;
  name: string;
  accountNumber: string;
  accountTier: string;
  role: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  twoFactorEnabled: boolean;
}) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    accountNumber: user.accountNumber,
    accountTier: user.accountTier,
    role: user.role,
    emailVerified: user.emailVerified,
    phoneVerified: user.phoneVerified,
    twoFactorEnabled: user.twoFactorEnabled,
  };
}

authRouter.post("/register", async (req, res) => {
  try {
    const { email, name, password, phone, referralCode: rawReferralCode } = req.body;
    const referralCode = typeof rawReferralCode === "string" ? rawReferralCode.trim() : rawReferralCode;

    if (!email || !name || !password) {
      res.status(400).json({ success: false, error: "Email, name, and password are required" });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ success: false, error: "Password must be at least 6 characters" });
      return;
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      res.status(409).json({ success: false, error: "Email already registered" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await createUser({ email, name, passwordHash });
    if (phone) {
      await prisma.user.update({ where: { id: user.id }, data: { phone } });
    }

    // Handle referral
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
      data: { userId: user.id, emailVerified: false, message: "Verification code sent to your email" },
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ success: false, error: "Registration failed" });
  }
});

authRouter.post("/verify-email", async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      res.status(400).json({ success: false, error: "Email and code are required" });
      return;
    }

    const user = await findUserByEmail(email);
    if (!user) {
      res.status(404).json({ success: false, error: "User not found" });
      return;
    }

    const ok = await verifyOtp(user.id, "email_verification", code);
    if (!ok) {
      res.status(400).json({ success: false, error: "Invalid or expired code" });
      return;
    }

    await setEmailVerified(user.id);

    try {
      await sendWelcomeEmail(user.email, user.name);
    } catch (err) {
      console.error("Welcome email error:", err);
    }

    const token = signToken({ userId: user.id, email: user.email });
    res.json({
      success: true,
      data: { user: publicUser(user), token, emailVerified: true },
    });
  } catch (err) {
    console.error("Verify email error:", err);
    res.status(500).json({ success: false, error: "Email verification failed" });
  }
});

authRouter.post("/resend-verification", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ success: false, error: "Email is required" });
      return;
    }
    const user = await findUserByEmail(email);
    if (!user || user.emailVerified) {
      res.json({ success: true, data: { message: "If the email exists and is unverified, a code was sent" } });
      return;
    }
    await issueOtp({
      userId: user.id,
      type: "email_verification",
      channel: "email",
      destination: user.email,
      title: "Verify your email",
      actionLabel: "verify your email address",
    });
    res.json({ success: true, data: { message: "Verification code resent" } });
  } catch (err) {
    console.error("Resend verification error:", err);
    res.status(500).json({ success: false, error: "Failed to resend code" });
  }
});

authRouter.post("/request-phone-verification", authMiddleware, async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      res.status(400).json({ success: false, error: "Phone number is required" });
      return;
    }
    await prisma.user.update({ where: { id: req.user!.userId }, data: { phone } });
    await issueOtp({
      userId: req.user!.userId,
      type: "phone_verification",
      channel: "sms",
      destination: phone,
      title: "Verify your phone",
      actionLabel: "verify your phone number",
    });
    res.json({ success: true, data: { message: "SMS verification code sent" } });
  } catch (err) {
    console.error("Request phone verification error:", err);
    res.status(500).json({ success: false, error: "Failed to send SMS code" });
  }
});

authRouter.post("/verify-phone", authMiddleware, async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      res.status(400).json({ success: false, error: "Code is required" });
      return;
    }
    const ok = await verifyOtp(req.user!.userId, "phone_verification", code);
    if (!ok) {
      res.status(400).json({ success: false, error: "Invalid or expired code" });
      return;
    }
    const user = await setPhoneVerified(req.user!.userId);
    res.json({ success: true, data: { phoneVerified: true, user: publicUser(user) } });
  } catch (err) {
    console.error("Verify phone error:", err);
    res.status(500).json({ success: false, error: "Phone verification failed" });
  }
});

authRouter.post("/setup-2fa", authMiddleware, async (req, res) => {
  try {
    const user = await findUserById(req.user!.userId);
    if (!user) {
      res.status(404).json({ success: false, error: "User not found" });
      return;
    }
    const secret = generateTotpSecret();
    await setTotpSecret(user.id, secret);
    const uri = getTotpUri(secret, user.email);
    res.json({ success: true, data: { secret, uri } });
  } catch (err) {
    console.error("Setup 2FA error:", err);
    res.status(500).json({ success: false, error: "Failed to set up 2FA" });
  }
});

authRouter.post("/verify-2fa", authMiddleware, async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      res.status(400).json({ success: false, error: "Code is required" });
      return;
    }
    const user = await findUserById(req.user!.userId);
    if (!user || !user.totpSecret) {
      res.status(400).json({ success: false, error: "2FA is not set up" });
      return;
    }
    if (!verifyTotp(user.totpSecret, code)) {
      res.status(400).json({ success: false, error: "Invalid code" });
      return;
    }
    const updated = await setTwoFactorEnabled(user.id, true);
    res.json({ success: true, data: { twoFactorEnabled: true, user: publicUser(updated) } });
  } catch (err) {
    console.error("Verify 2FA error:", err);
    res.status(500).json({ success: false, error: "Failed to enable 2FA" });
  }
});

authRouter.post("/disable-2fa", authMiddleware, async (req, res) => {
  try {
    const { code } = req.body;
    const user = await findUserById(req.user!.userId);
    if (!user || !user.totpSecret) {
      res.status(400).json({ success: false, error: "2FA is not set up" });
      return;
    }
    if (!code || !verifyTotp(user.totpSecret, code)) {
      res.status(400).json({ success: false, error: "Valid code is required to disable 2FA" });
      return;
    }
    await prisma.user.update({
      where: { id: user.id },
      data: { twoFactorEnabled: false, totpSecret: null },
    });
    res.json({ success: true, data: { twoFactorEnabled: false } });
  } catch (err) {
    console.error("Disable 2FA error:", err);
    res.status(500).json({ success: false, error: "Failed to disable 2FA" });
  }
});

authRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, error: "Email and password are required" });
      return;
    }

    const user = await findUserByEmail(email);
    if (!user) {
      res.status(401).json({ success: false, error: "Invalid email or password" });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ success: false, error: "Invalid email or password" });
      return;
    }

    if (user.twoFactorEnabled && user.totpSecret) {
      const challengeToken = signChallengeToken(user.id);
      res.json({
        success: true,
        data: { twoFactorRequired: true, challengeToken, user: publicUser(user) },
      });
      return;
    }

    const token = signToken({ userId: user.id, email: user.email });
    res.json({ success: true, data: { user: publicUser(user), token } });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, error: "Login failed" });
  }
});

authRouter.post("/2fa/verify", async (req, res) => {
  try {
    const { challengeToken, code } = req.body;
    if (!challengeToken || !code) {
      res.status(400).json({ success: false, error: "Challenge token and code are required" });
      return;
    }

    let payload;
    try {
      payload = verifyChallengeToken(challengeToken);
    } catch {
      res.status(401).json({ success: false, error: "Invalid or expired challenge" });
      return;
    }
    if (!(payload as { twoFactorChallenge?: boolean }).twoFactorChallenge) {
      res.status(401).json({ success: false, error: "Invalid challenge" });
      return;
    }

    const user = await findUserById(payload.userId);
    if (!user || !user.totpSecret) {
      res.status(400).json({ success: false, error: "2FA is not set up" });
      return;
    }
    if (!verifyTotp(user.totpSecret, code)) {
      res.status(401).json({ success: false, error: "Invalid code" });
      return;
    }

    const token = signToken({ userId: user.id, email: user.email });
    res.json({ success: true, data: { user: publicUser(user), token } });
  } catch (err) {
    console.error("2FA verify error:", err);
    res.status(500).json({ success: false, error: "2FA verification failed" });
  }
});

authRouter.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ success: false, error: "Email is required" });
      return;
    }
    const user = await findUserByEmail(email);
    if (user) {
      const code = await issueOtp({
        userId: user.id,
        type: "password_reset",
        channel: "email",
        destination: user.email,
        title: "Password reset code",
        actionLabel: "reset your password",
        ttlMs: 60 * 60 * 1000,
      });
      const link = `${dashboardUrl()}/reset-password?email=${encodeURIComponent(user.email)}&code=${code}`;
      try {
        await sendPasswordResetEmail(user.email, user.name, code, link);
      } catch (err) {
        console.error("Password reset email error:", err);
      }
    }
    res.json({ success: true, data: { message: "If the email exists, a reset link has been sent" } });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ success: false, error: "Failed to process request" });
  }
});

authRouter.post("/reset-password", async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) {
      res.status(400).json({ success: false, error: "Email, code, and new password are required" });
      return;
    }
    if (newPassword.length < 6) {
      res.status(400).json({ success: false, error: "Password must be at least 6 characters" });
      return;
    }

    const user = await findUserByEmail(email);
    if (!user) {
      res.status(404).json({ success: false, error: "User not found" });
      return;
    }

    const ok = await verifyOtp(user.id, "password_reset", code);
    if (!ok) {
      res.status(400).json({ success: false, error: "Invalid or expired code" });
      return;
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await updatePasswordHash(user.id, passwordHash);
    await deleteVerificationTokens(user.id, "password_reset");

    res.json({ success: true, data: { message: "Password reset successful. Please log in." } });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ success: false, error: "Failed to reset password" });
  }
});

authRouter.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await findUserById(req.user!.userId);
    if (!user) {
      res.status(404).json({ success: false, error: "User not found" });
      return;
    }

    const kyc = await prisma.kyc.findUnique({ where: { userId: user.id }, select: { status: true } });

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        accountNumber: user.accountNumber,
        accountTier: user.accountTier,
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified,
        twoFactorEnabled: user.twoFactorEnabled,
        kycStatus: kyc?.status || "none",
      },
    });
  } catch (err) {
    console.error("Me error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch user" });
  }
});
