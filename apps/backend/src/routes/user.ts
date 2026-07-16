import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import { getUserProfile, updateUserProfile, getUserGroups, setUserBankDetails } from "@thrift/db";

export const userRouter = Router();

userRouter.get("/profile", authMiddleware, async (req, res) => {
  try {
    const profile = await getUserProfile(req.user!.userId);
    if (!profile) {
      res.status(404).json({ success: false, error: "User not found" });
      return;
    }
    res.json({ success: true, data: profile });
  } catch (err) {
    console.error("Get profile error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch profile" });
  }
});

userRouter.put("/profile", authMiddleware, async (req, res) => {
  try {
    const { name, email } = req.body;
    const updated = await updateUserProfile(req.user!.userId, { name, email });
    res.json({ success: true, data: { id: updated.id, name: updated.name, email: updated.email } });
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({ success: false, error: "Failed to update profile" });
  }
});

userRouter.put("/bank-details", authMiddleware, async (req, res) => {
  try {
    const { bankName, bankCode, bankAccountNumber, bankAccountName } = req.body;
    const updated = await setUserBankDetails(req.user!.userId, {
      bankName,
      bankCode,
      bankAccountNumber,
      bankAccountName,
    });
    res.json({
      success: true,
      data: {
        bankName: updated.bankName,
        bankCode: updated.bankCode,
        bankAccountNumber: updated.bankAccountNumber,
        bankAccountName: updated.bankAccountName,
      },
    });
  } catch (err) {
    console.error("Update bank details error:", err);
    res.status(500).json({ success: false, error: "Failed to update bank details" });
  }
});

userRouter.get("/groups", authMiddleware, async (req, res) => {
  try {
    const groups = await getUserGroups(req.user!.userId);
    res.json({ success: true, data: groups });
  } catch (err) {
    console.error("Get user groups error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch groups" });
  }
});
