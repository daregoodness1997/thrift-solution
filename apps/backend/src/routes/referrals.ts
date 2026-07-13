import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import {
  generateReferralCode,
  getUserReferrals,
  getUserReferralEarnings,
  getReferralStats,
} from "@thrift/db";

export const referralsRouter = Router();

// Get or generate user's referral code
referralsRouter.get("/code", authMiddleware, async (req, res) => {
  try {
    const code = await generateReferralCode(req.user!.userId);
    res.json({ success: true, data: { code } });
  } catch (err) {
    console.error("Get referral code error:", err);
    res.status(500).json({ success: false, error: "Failed to get referral code" });
  }
});

// Get referral stats
referralsRouter.get("/stats", authMiddleware, async (req, res) => {
  try {
    const stats = await getReferralStats(req.user!.userId);
    res.json({ success: true, data: stats });
  } catch (err) {
    console.error("Get referral stats error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch referral stats" });
  }
});

// List user's referrals
referralsRouter.get("/", authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await getUserReferrals(req.user!.userId, { page, limit });
    res.json({ success: true, data: result });
  } catch (err) {
    console.error("Get referrals error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch referrals" });
  }
});

// List user's referral earnings
referralsRouter.get("/earnings", authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await getUserReferralEarnings(req.user!.userId, { page, limit });
    res.json({ success: true, data: result });
  } catch (err) {
    console.error("Get referral earnings error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch referral earnings" });
  }
});
