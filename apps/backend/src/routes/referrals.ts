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
    const referrals = await getUserReferrals(req.user!.userId);
    res.json({ success: true, data: referrals });
  } catch (err) {
    console.error("Get referrals error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch referrals" });
  }
});

// List user's referral earnings
referralsRouter.get("/earnings", authMiddleware, async (req, res) => {
  try {
    const earnings = await getUserReferralEarnings(req.user!.userId);
    res.json({ success: true, data: earnings });
  } catch (err) {
    console.error("Get referral earnings error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch referral earnings" });
  }
});
