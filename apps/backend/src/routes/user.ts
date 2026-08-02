import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import { getUserProfile, updateUserProfile, getUserGroups, setUserBankDetails, setUserNextOfKin, findUserByBankAccountNumber, getDefaultsSummary, getUpcomingClearance, getUserNinName, namesMatch, getAuditLogsForUser } from "@thrift/db";
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
    const ninName = await getUserNinName(req.user!.userId);
    res.json({
      success: true,
      data: {
        bankName: updated.bankName,
        bankCode: updated.bankCode,
        bankAccountNumber: updated.bankAccountNumber,
        bankAccountName: updated.bankAccountName,
        bankAccountStatus: updated.bankAccountStatus,
        bankAccountRejectionReason: updated.bankAccountRejectionReason,
        ninName,
        nameMatchesNin: ninName ? namesMatch(updated.bankAccountName, ninName) : null,
      },
    });
  } catch (err) {
    console.error("Update bank details error:", err);
    res.status(500).json({ success: false, error: "Failed to update bank details" });
  }
});

userRouter.put("/next-of-kin", authMiddleware, async (req, res) => {
  try {
    const { name, phone, email, relationship } = req.body;
    const updated = await setUserNextOfKin(req.user!.userId, { name, phone, email, relationship });
    res.json({
      success: true,
      data: {
        nextOfKin: {
          name: updated.nextOfKinName,
          phone: updated.nextOfKinPhone,
          email: updated.nextOfKinEmail,
          relationship: updated.nextOfKinRelationship,
        },
      },
    });
  } catch (err) {
    console.error("Update next of kin error:", err);
    res.status(500).json({ success: false, error: "Failed to update next of kin" });
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

    const thriftUser = await findUserByBankAccountNumber(resolution.accountNumber, req.user!.userId);

    const ninName = await getUserNinName(req.user!.userId);
    const nameMatchesNin = ninName ? namesMatch(resolution.accountName, ninName) : null;

    res.json({
      success: true,
      data: {
        accountNumber: resolution.accountNumber,
        accountName: resolution.accountName,
        bankName: resolution.bankName,
        bankCode: resolution.bankCode,
        ninName,
        nameMatchesNin,
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

userRouter.get("/audit-logs", authMiddleware, async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const entity = (req.query.entity as string) || undefined;
    const action = (req.query.action as string) || undefined;
    const search = (req.query.search as string) || undefined;
    const from = (req.query.from as string) || undefined;
    const to = (req.query.to as string) || undefined;

    const result = await getAuditLogsForUser(req.user!.userId, { page, limit, entity, action, search, from, to });
    const items = result.items.map((log) => {
      let metadata: unknown = log.metadata;
      if (typeof log.metadata === "string" && log.metadata.length > 0) {
        try {
          metadata = JSON.parse(log.metadata);
        } catch {
          metadata = log.metadata;
        }
      }
      return { ...log, metadata };
    });
    res.json({ success: true, data: { ...result, items } });
  } catch (err) {
    console.error("Get user audit logs error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch activity log" });
  }
});

userRouter.get("/overview", authMiddleware, async (req, res) => {
  try {
    const userId = req.user!.userId;

    const [defaultsSummary, upcomingClearance] = await Promise.all([
      getDefaultsSummary(userId),
      getUpcomingClearance(userId),
    ]);

    res.json({
      success: true,
      data: {
        defaults: defaultsSummary,
        upcomingClearance,
      },
    });
  } catch (err) {
    console.error("Get overview error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch overview" });
  }
});
