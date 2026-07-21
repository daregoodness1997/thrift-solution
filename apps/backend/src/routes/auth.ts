import { Router } from "express";
import bcrypt from "bcryptjs";
import {
  findUserByEmail,
  findUserByPhone,
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
  setEmail2faEnabled,
  updatePasswordHash,
  deleteVerificationTokens,
  createRefreshToken,
  findRefreshToken,
  deleteRefreshToken,
  deleteUserRefreshTokens,
  prisma,
} from "@thrift/db";
import { signToken, signRefreshToken, verifyRefreshToken, signChallengeToken, verifyChallengeToken, authMiddleware } from "../middleware/auth";
import { issueOtp, verifyOtp } from "../services/auth/otp";
import { generateTotpSecret, getTotpUri, verifyTotp } from "../services/auth/totp";
import { sendWelcomeEmail, sendPasswordResetEmail } from "../services/auth/emails";

export const authRouter = Router();

const dashboardUrl = () => process.env.DASHBOARD_URL || "http://localhost:3001";

const REFRESH_TOKEN_EXPIRY_DAYS = 7;

function normalizePhoneForLogin(phone: string): string {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("00234")) {
    digits = digits.slice(2);
  }
  if (digits.startsWith("0") && digits.length === 11) {
    return "234" + digits.slice(1);
  }
  if (digits.startsWith("234") && digits.length === 12) {
    return digits;
  }
  if (digits.length === 10 && /^[1-9]/.test(digits)) {
    return "234" + digits;
  }
  return digits;
}

async function issueTokenPair(user: { id: string; email: string; role: string }) {
  const token = signToken({ userId: user.id, email: user.email, role: user.role });
  const refreshToken = signRefreshToken(user.id);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);
  await createRefreshToken(user.id, refreshToken, expiresAt);
  return { token, refreshToken };
}

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
  email2faEnabled: boolean;
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
    phoneVerified: user.phoneVerified,
    twoFactorEnabled: user.twoFactorEnabled,
    email2faEnabled: user.email2faEnabled,
    registrationFeePaid: user.registrationFeePaid,
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

    const { token, refreshToken } = await issueTokenPair(user);
    res.json({
      success: true,
      data: { user: publicUser(user), token, refreshToken, emailVerified: true },
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
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { twoFactorEnabled: false, totpSecret: null },
    });
    const hasOther2fa = updated.email2faEnabled;
    if (!hasOther2fa) {
      await setTwoFactorEnabled(user.id, false);
    }
    res.json({ success: true, data: { twoFactorEnabled: hasOther2fa, totpEnabled: false } });
  } catch (err) {
    console.error("Disable 2FA error:", err);
    res.status(500).json({ success: false, error: "Failed to disable 2FA" });
  }
});

authRouter.post("/setup-email-2fa", authMiddleware, async (req, res) => {
  try {
    const user = await findUserById(req.user!.userId);
    if (!user) {
      res.status(404).json({ success: false, error: "User not found" });
      return;
    }
    const code = await issueOtp({
      userId: user.id,
      type: "two_factor",
      channel: "email",
      destination: user.email,
      title: "Your 2FA verification code",
      actionLabel: "verify your email for two-factor authentication",
      ttlMs: 5 * 60 * 1000,
    });
    res.json({
      success: true,
      data: { message: "Verification code sent to your email", email: user.email },
    });
  } catch (err) {
    console.error("Setup email 2FA error:", err);
    res.status(500).json({ success: false, error: "Failed to send verification code" });
  }
});

authRouter.post("/verify-email-2fa", authMiddleware, async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      res.status(400).json({ success: false, error: "Code is required" });
      return;
    }
    const user = await findUserById(req.user!.userId);
    if (!user) {
      res.status(404).json({ success: false, error: "User not found" });
      return;
    }
    const ok = await verifyOtp(user.id, "two_factor", code);
    if (!ok) {
      res.status(400).json({ success: false, error: "Invalid or expired code" });
      return;
    }
    await setEmail2faEnabled(user.id, true);
    await setTwoFactorEnabled(user.id, true);
    res.json({ success: true, data: { email2faEnabled: true, twoFactorEnabled: true } });
  } catch (err) {
    console.error("Verify email 2FA error:", err);
    res.status(500).json({ success: false, error: "Failed to enable email 2FA" });
  }
});

authRouter.post("/disable-email-2fa", authMiddleware, async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      res.status(400).json({ success: false, error: "Code is required to disable email 2FA" });
      return;
    }
    const user = await findUserById(req.user!.userId);
    if (!user) {
      res.status(404).json({ success: false, error: "User not found" });
      return;
    }
    const ok = await verifyOtp(user.id, "two_factor", code);
    if (!ok) {
      res.status(400).json({ success: false, error: "Invalid or expired code" });
      return;
    }
    await setEmail2faEnabled(user.id, false);
    const hasOther2fa = !!user.totpSecret;
    if (!hasOther2fa) {
      await setTwoFactorEnabled(user.id, false);
    }
    res.json({ success: true, data: { email2faEnabled: false, twoFactorEnabled: hasOther2fa } });
  } catch (err) {
    console.error("Disable email 2FA error:", err);
    res.status(500).json({ success: false, error: "Failed to disable email 2FA" });
  }
});

authRouter.post("/send-email-2fa-code", authMiddleware, async (req, res) => {
  try {
    const user = await findUserById(req.user!.userId);
    if (!user) {
      res.status(404).json({ success: false, error: "User not found" });
      return;
    }
    const code = await issueOtp({
      userId: user.id,
      type: "two_factor",
      channel: "email",
      destination: user.email,
      title: "Your 2FA verification code",
      actionLabel: "complete two-factor authentication",
      ttlMs: 5 * 60 * 1000,
    });
    res.json({
      success: true,
      data: { message: "Verification code sent to your email" },
    });
  } catch (err) {
    console.error("Send email 2FA code error:", err);
    res.status(500).json({ success: false, error: "Failed to send verification code" });
  }
});

authRouter.post("/login", async (req, res) => {
  try {
    const { email, phone, password } = req.body;

    if (!password) {
      res.status(400).json({ success: false, error: "Password is required" });
      return;
    }

    let user;
    if (phone) {
      const normalizedPhone = normalizePhoneForLogin(phone);
      user = await findUserByPhone(normalizedPhone);
      if (!user) {
        res.status(401).json({ success: false, error: "Invalid phone number or password" });
        return;
      }
    } else if (email) {
      user = await findUserByEmail(email);
      if (!user) {
        res.status(401).json({ success: false, error: "Invalid email or password" });
        return;
      }
    } else {
      res.status(400).json({ success: false, error: "Email or phone number is required" });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ success: false, error: "Invalid email or password" });
      return;
    }

    if (user.twoFactorEnabled && (user.totpSecret || user.email2faEnabled)) {
      const challengeToken = signChallengeToken(user.id);
      const availableMethods: string[] = [];
      if (user.totpSecret) availableMethods.push("totp");
      if (user.email2faEnabled) availableMethods.push("email");
      res.json({
        success: true,
        data: { twoFactorRequired: true, challengeToken, availableMethods, user: publicUser(user) },
      });
      return;
    }

    const isStaff =
      user.role === "admin" ||
      user.role === "superadmin" ||
      user.role === "support" ||
      user.role === "moderator" ||
      user.role === "finance";

    if (!isStaff && !user.emailVerified) {
      await issueOtp({
        userId: user.id,
        type: "email_verification",
        channel: "email",
        destination: user.email,
        title: "Verify your email",
        actionLabel: "verify your email address",
      });
      res.json({
        success: true,
        data: {
          needsVerification: true,
          emailVerified: false,
          registrationFeePaid: user.registrationFeePaid,
          userId: user.id,
          email: user.email,
          message: "A new verification code has been sent to your email",
        },
      });
      return;
    }

    if (!isStaff && !user.registrationFeePaid) {
      const { token, refreshToken } = await issueTokenPair(user);
      res.json({
        success: true,
        data: {
          needsPayment: true,
          emailVerified: true,
          registrationFeePaid: false,
          userId: user.id,
          email: user.email,
          token,
          refreshToken,
          message: "Please complete your registration fee payment to continue",
          user: publicUser(user),
        },
      });
      return;
    }

    const { token, refreshToken } = await issueTokenPair(user);
    res.json({ success: true, data: { user: publicUser(user), token, refreshToken } });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, error: "Login failed" });
  }
});

authRouter.post("/2fa/verify", async (req, res) => {
  try {
    const { challengeToken, code, method } = req.body;
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
    if (!user) {
      res.status(400).json({ success: false, error: "User not found" });
      return;
    }

    if (method === "email") {
      if (!user.email2faEnabled) {
        res.status(400).json({ success: false, error: "Email 2FA is not enabled" });
        return;
      }
      const ok = await verifyOtp(user.id, "two_factor", code);
      if (!ok) {
        res.status(401).json({ success: false, error: "Invalid or expired code" });
        return;
      }
    } else {
      if (!user.totpSecret) {
        res.status(400).json({ success: false, error: "TOTP 2FA is not set up" });
        return;
      }
      if (!verifyTotp(user.totpSecret, code)) {
        res.status(401).json({ success: false, error: "Invalid code" });
        return;
      }
    }

    const { token, refreshToken } = await issueTokenPair(user);
    res.json({ success: true, data: { user: publicUser(user), token, refreshToken } });
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
        email2faEnabled: user.email2faEnabled,
        kycStatus: kyc?.status || "none",
        registrationFeePaid: user.registrationFeePaid,
      },
    });
  } catch (err) {
    console.error("Me error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch user" });
  }
});

authRouter.post("/refresh", async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      res.status(400).json({ success: false, error: "Refresh token is required" });
      return;
    }

    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      res.status(401).json({ success: false, error: "Invalid or expired refresh token" });
      return;
    }

    if (payload.type !== "refresh") {
      res.status(401).json({ success: false, error: "Invalid token type" });
      return;
    }

    const storedToken = await findRefreshToken(refreshToken);
    if (!storedToken) {
      res.status(401).json({ success: false, error: "Refresh token not found" });
      return;
    }

    if (new Date(storedToken.expiresAt) < new Date()) {
      await deleteRefreshToken(refreshToken);
      res.status(401).json({ success: false, error: "Refresh token expired" });
      return;
    }

    const user = await findUserById(payload.userId);
    if (!user) {
      res.status(401).json({ success: false, error: "User not found" });
      return;
    }

    await deleteRefreshToken(refreshToken);

    const { token, refreshToken: newRefreshToken } = await issueTokenPair(user);

    res.json({ success: true, data: { token, refreshToken: newRefreshToken } });
  } catch (err) {
    console.error("Refresh error:", err);
    res.status(500).json({ success: false, error: "Token refresh failed" });
  }
});

authRouter.post("/logout", authMiddleware, async (req, res) => {
  try {
    await deleteUserRefreshTokens(req.user!.userId);
    res.json({ success: true, data: { message: "Logged out successfully" } });
  } catch (err) {
    console.error("Logout error:", err);
    res.status(500).json({ success: false, error: "Logout failed" });
  }
});
