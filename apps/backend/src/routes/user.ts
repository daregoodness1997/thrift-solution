import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import { getUserProfile, updateUserProfile, getUserGroups, setUserBankDetails, findUserByBankAccountNumber } from "@thrift/db";
import { resolveAccountNumber } from "../services/payments";

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

// Resolve bank + account holder details from a supplied account number, just
// like bank apps do (account name enquiry). Also detects if the account belongs
// to another Thrift Solution user so transfers can be flagged in-app.
userRouter.post("/resolve-account", authMiddleware, async (req, res) => {
  try {
    const { accountNumber, bankCode } = req.body;

    if (!accountNumber || !/^\d{6,15}$/.test(String(accountNumber).trim())) {
      res.status(400).json({ success: false, error: "A valid account number is required" });
      return;
    }
    if (!bankCode || !/^\d{2,6}$/.test(String(bankCode).trim())) {
      res.status(400).json({ success: false, error: "A valid bank code is required" });
      return;
    }

    let resolution;
    try {
      resolution = await resolveAccountNumber({
        accountNumber: String(accountNumber).trim(),
        bankCode: String(bankCode).trim(),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not resolve account";
      res.status(502).json({ success: false, error: message });
      return;
    }

    const thriftUser = await findUserByBankAccountNumber(resolution.accountNumber);

    res.json({
      success: true,
      data: {
        accountNumber: resolution.accountNumber,
        accountName: resolution.accountName,
        bankName: resolution.bankName,
        bankCode: resolution.bankCode,
        isThriftUser: Boolean(thriftUser),
        thriftUser: thriftUser
          ? {
              name: thriftUser.name,
              accountNumber: thriftUser.accountNumber,
            }
          : null,
      },
    });
  } catch (err) {
    console.error("Resolve account error:", err);
    res.status(500).json({ success: false, error: "Failed to resolve account" });
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
