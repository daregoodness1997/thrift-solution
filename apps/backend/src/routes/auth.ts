import { Router } from "express";
import bcrypt from "bcryptjs";
import { findUserByEmail, createUser, findUserById, findUserByReferralCode, createReferral, createReferralEarning, createTransaction, getTierForCount, prisma } from "@thrift/db";
import { signToken, authMiddleware } from "../middleware/auth";

export const authRouter = Router();

authRouter.post("/register", async (req, res) => {
  try {
    const { email, name, password, referralCode } = req.body;

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
    const token = signToken({ userId: user.id, email: user.email });

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

    res.status(201).json({
      success: true,
      data: { user: { id: user.id, email: user.email, name: user.name }, token },
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ success: false, error: "Registration failed" });
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

    const token = signToken({ userId: user.id, email: user.email });

    res.json({
      success: true,
      data: { user: { id: user.id, email: user.email, name: user.name }, token },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, error: "Login failed" });
  }
});

authRouter.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await findUserById(req.user!.userId);
    if (!user) {
      res.status(404).json({ success: false, error: "User not found" });
      return;
    }

    res.json({
      success: true,
      data: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  } catch (err) {
    console.error("Me error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch user" });
  }
});
