import { Router, Request, Response, NextFunction } from "express";
import { authMiddleware } from "../middleware/auth";
import {
  getActiveCircles,
  getCircleById,
  getAllCircles,
  createCircle,
  updateCircle,
  openCircleAccount,
  getCircleAccountById,
  getCircleAccountsByUser,
  getCircleAccountTransactions,
  getCircleAccountInterestBreakdown,
  earlyWithdrawCircleAccount,
  matureCircleAccount,
  runWeeklyInterestJob,
  getWalletBalance,
  findUserById,
  getCirclePayoutRequests,
  getCirclePayoutRequestsByUser,
  approveCirclePayoutRequest,
  declineCirclePayoutRequest,
  clearCirclePayoutRequest,
  disburseCirclePayoutRequestViaFlutterwave,
  markCirclePayoutRequestDisbursed,
  runWeeklyContributionJob,
  getDefaultsByAccount,
  getDefaultsByUser,
  clearCircleDefault,
  getCircleAnalytics,
} from "@thrift/db";
import { prisma } from "@thrift/db";
import { getPaymentProvider } from "../services/payments";

export const circlesRouter = Router();

function adminMiddleware(req: Request, res: Response, next: NextFunction) {
  authMiddleware(req, res, async () => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: "Authentication required" });
        return;
      }
      const user = await findUserById(req.user.userId);
      if (!user || user.role !== "admin") {
        res.status(403).json({ success: false, error: "Admin access required" });
        return;
      }
      next();
    } catch {
      res.status(500).json({ success: false, error: "Authorization check failed" });
    }
  });
}

circlesRouter.get("/", authMiddleware, async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const status = req.query.status as string | undefined;

    const result = await getAllCircles({ page, limit, status });
    res.json({ success: true, data: result });
  } catch (err) {
    console.error("Get circles error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch circles" });
  }
});

circlesRouter.get("/active", authMiddleware, async (_req, res) => {
  try {
    const circles = await getActiveCircles();
    res.json({ success: true, data: circles });
  } catch (err) {
    console.error("Get active circles error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch active circles" });
  }
});

circlesRouter.get("/accounts/my", authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string | undefined;
    const result = await getCircleAccountsByUser(req.user!.userId, { page, limit, status });
    const balance = await getWalletBalance(req.user!.userId);
    res.json({ success: true, data: { ...result, walletBalance: balance } });
  } catch (err) {
    console.error("Get my circle accounts error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch your circle accounts" });
  }
});

circlesRouter.get("/accounts/:id", authMiddleware, async (req, res) => {
  try {
    const account = await getCircleAccountById(req.params.id);
    if (!account) {
      res.status(404).json({ success: false, error: "Circle account not found" });
      return;
    }
    if (account.userId !== req.user!.userId) {
      res.status(403).json({ success: false, error: "Not your account" });
      return;
    }
    res.json({ success: true, data: account });
  } catch (err) {
    console.error("Get circle account error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch circle account" });
  }
});

circlesRouter.get("/accounts/:id/transactions", authMiddleware, async (req, res) => {
  try {
    const transactions = await getCircleAccountTransactions(req.params.id, req.user!.userId);
    res.json({ success: true, data: transactions });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch circle account transactions";
    console.error("Get circle account transactions error:", err);
    res.status(400).json({ success: false, error: message });
  }
});

circlesRouter.get("/accounts/:id/interest-logs", authMiddleware, async (req, res) => {
  try {
    const account = await getCircleAccountById(req.params.id);
    if (!account) {
      res.status(404).json({ success: false, error: "Circle account not found" });
      return;
    }
    if (account.userId !== req.user!.userId) {
      res.status(403).json({ success: false, error: "Not your account" });
      return;
    }
    res.json({ success: true, data: account.interestLogs || [] });
  } catch (err) {
    console.error("Get circle account interest logs error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch interest logs" });
  }
});

circlesRouter.get("/accounts/:id/interest-breakdown", authMiddleware, async (req, res) => {
  try {
    const account = await getCircleAccountById(req.params.id);
    if (!account) {
      res.status(404).json({ success: false, error: "Circle account not found" });
      return;
    }
    if (account.userId !== req.user!.userId) {
      res.status(403).json({ success: false, error: "Not your account" });
      return;
    }
    const breakdown = await getCircleAccountInterestBreakdown(req.params.id);
    res.json({ success: true, data: breakdown });
  } catch (err) {
    console.error("Get circle account interest breakdown error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch interest breakdown" });
  }
});

circlesRouter.get("/:id", authMiddleware, async (req, res) => {
  try {
    const circle = await getCircleById(req.params.id);
    if (!circle) {
      res.status(404).json({ success: false, error: "Circle not found" });
      return;
    }
    res.json({ success: true, data: circle });
  } catch (err) {
    console.error("Get circle error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch circle" });
  }
});

circlesRouter.get("/:id/analytics", adminMiddleware, async (req, res) => {
  try {
    const analytics = await getCircleAnalytics(req.params.id);
    if (!analytics.circle) {
      res.status(404).json({ success: false, error: "Circle not found" });
      return;
    }
    res.json({ success: true, data: analytics });
  } catch (err) {
    console.error("Get circle analytics error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch circle analytics" });
  }
});

circlesRouter.post("/:id/open", authMiddleware, async (req, res) => {
  try {
    const circle = await getCircleById(req.params.id);
    if (!circle) {
      res.status(404).json({ success: false, error: "Circle not found" });
      return;
    }
    const maxPerUser = circle.maxAccountsPerUser > 0 ? circle.maxAccountsPerUser : Infinity;
    const count = Math.max(1, Math.min(Number(req.body?.count) || 1, maxPerUser));

    // Link the subscription to the wallet funding that paid for it so a later
    // payment reversal can unwind the subscription automatically. Prefer an
    // explicit reference from the client; otherwise fall back to the user's
    // most recent completed wallet-funding transaction.
    let fundedByTxnRef: string | undefined = req.body?.fundedByTxnRef;
    if (!fundedByTxnRef) {
      const lastFunding = await prisma.transaction.findFirst({
        where: {
          userId: req.user!.userId,
          type: { in: ["wallet_funding", "funding"] },
          status: "completed",
        },
        orderBy: { createdAt: "desc" },
        select: { reference: true },
      });
      fundedByTxnRef = lastFunding?.reference;
    }

    const accounts = [];
    let lastError: Error | null = null;

    for (let i = 0; i < count; i++) {
      try {
        const account = await openCircleAccount(req.params.id, req.user!.userId, fundedByTxnRef);
        accounts.push(account);
      } catch (err) {
        lastError = err instanceof Error ? err : new Error("Failed to open circle account");
        break;
      }
    }

    const balance = await getWalletBalance(req.user!.userId);

    if (accounts.length === 0) {
      res.status(400).json({ success: false, error: lastError?.message || "Failed to open circle account" });
      return;
    }

    res.status(201).json({
      success: true,
      data: { accounts, opened: accounts.length, requested: count, walletBalance: balance },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to open circle account";
    console.error("Open circle account error:", err);
    res.status(400).json({ success: false, error: message });
  }
});

circlesRouter.post("/accounts/:id/withdraw", authMiddleware, async (req, res) => {
  try {
    const account = await earlyWithdrawCircleAccount(req.params.id, req.user!.userId);
    const balance = await getWalletBalance(req.user!.userId);
    res.json({ success: true, data: { account, walletBalance: balance } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to withdraw from circle account";
    console.error("Early withdraw error:", err);
    res.status(400).json({ success: false, error: message });
  }
});

circlesRouter.post("/accounts/:id/mature", authMiddleware, async (req, res) => {
  try {
    const account = await matureCircleAccount(req.params.id, req.user!.userId);
    const balance = await getWalletBalance(req.user!.userId);
    res.json({ success: true, data: { account, walletBalance: balance } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to claim matured account";
    console.error("Mature account error:", err);
    res.status(400).json({ success: false, error: message });
  }
});

circlesRouter.post("/", adminMiddleware, async (req, res) => {
  try {
    const {
      name, description, cycleType, amount, weeklyAmount, totalWeeks,
      durationMonths, interestRateAnnual, maxAccountsPerUser, maxSubscribers, autoPayout, payoutMode, blockPayoutOnDefault,
      processingFeeType, processingFeeValue,
    } = req.body;

    const resolvedType = cycleType === "weekly_contribution" ? "weekly_contribution" : "deposit";

    if (!name || !durationMonths || !interestRateAnnual) {
      res.status(400).json({ success: false, error: "name, durationMonths, and interestRateAnnual are required" });
      return;
    }
    if (resolvedType === "deposit" && !amount) {
      res.status(400).json({ success: false, error: "amount is required for deposit cycles" });
      return;
    }
    if (resolvedType === "weekly_contribution" && (!weeklyAmount || !totalWeeks)) {
      res.status(400).json({ success: false, error: "weeklyAmount and totalWeeks are required for weekly_contribution cycles" });
      return;
    }

    const circle = await createCircle({
      name,
      description,
      cycleType: resolvedType,
      amount: Number(amount) || 0,
      weeklyAmount: weeklyAmount ? Number(weeklyAmount) : undefined,
      totalWeeks: totalWeeks ? Number(totalWeeks) : undefined,
      durationMonths: Number(durationMonths),
      interestRateAnnual: Number(interestRateAnnual),
      maxAccountsPerUser: maxAccountsPerUser ? Number(maxAccountsPerUser) : undefined,
      maxSubscribers: maxSubscribers != null && maxSubscribers !== "" ? Number(maxSubscribers) : undefined,
      autoPayout: autoPayout === true || autoPayout === "true",
      payoutMode: payoutMode === "clearance" || payoutMode === "auto" ? payoutMode : undefined,
      blockPayoutOnDefault: blockPayoutOnDefault !== undefined ? (blockPayoutOnDefault === true || blockPayoutOnDefault === "true") : undefined,
      processingFeeType: processingFeeType === "fixed" || processingFeeType === "percent" ? processingFeeType : undefined,
      processingFeeValue: processingFeeValue != null && processingFeeValue !== "" ? Number(processingFeeValue) : undefined,
    });

    res.status(201).json({ success: true, data: circle });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create circle";
    console.error("Create circle error:", err);
    res.status(400).json({ success: false, error: message });
  }
});

circlesRouter.put("/:id", adminMiddleware, async (req, res) => {
  try {
    const {
      name, description, cycleType, amount, weeklyAmount, totalWeeks,
      durationMonths, interestRateAnnual, maxAccountsPerUser, maxSubscribers, autoPayout, payoutMode, blockPayoutOnDefault, status,
      processingFeeType, processingFeeValue,
    } = req.body;

    const circle = await updateCircle(req.params.id, {
      name,
      description,
      cycleType: cycleType ? (cycleType === "weekly_contribution" ? "weekly_contribution" : "deposit") : undefined,
      amount: amount ? Number(amount) : undefined,
      weeklyAmount: weeklyAmount ? Number(weeklyAmount) : undefined,
      totalWeeks: totalWeeks ? Number(totalWeeks) : undefined,
      durationMonths: durationMonths ? Number(durationMonths) : undefined,
      interestRateAnnual: interestRateAnnual ? Number(interestRateAnnual) : undefined,
      maxAccountsPerUser: maxAccountsPerUser ? Number(maxAccountsPerUser) : undefined,
      maxSubscribers: maxSubscribers != null && maxSubscribers !== "" ? Number(maxSubscribers) : undefined,
      autoPayout: autoPayout !== undefined ? (autoPayout === true || autoPayout === "true") : undefined,
      payoutMode: payoutMode === "clearance" || payoutMode === "auto" ? payoutMode : undefined,
      blockPayoutOnDefault: blockPayoutOnDefault !== undefined ? (blockPayoutOnDefault === true || blockPayoutOnDefault === "true") : undefined,
      processingFeeType: processingFeeType === "fixed" || processingFeeType === "percent" ? processingFeeType : (processingFeeType === null ? null : undefined),
      processingFeeValue: processingFeeValue != null && processingFeeValue !== "" ? Number(processingFeeValue) : (processingFeeValue === null ? null : undefined),
      status,
    });

    res.json({ success: true, data: circle });
  } catch (err) {
    console.error("Update circle error:", err);
    res.status(500).json({ success: false, error: "Failed to update circle" });
  }
});

circlesRouter.post("/admin/run-interest-job", adminMiddleware, async (_req, res) => {
  try {
    const result = await runWeeklyInterestJob();
    res.json({ success: true, data: result });
  } catch (err) {
    console.error("Run interest job error:", err);
    res.status(500).json({ success: false, error: "Failed to run interest job" });
  }
});

circlesRouter.post("/admin/run-contribution-job", adminMiddleware, async (_req, res) => {
  try {
    const result = await runWeeklyContributionJob();
    res.json({ success: true, data: result });
  } catch (err) {
    console.error("Run contribution job error:", err);
    res.status(500).json({ success: false, error: "Failed to run contribution job" });
  }
});

circlesRouter.post("/admin/run-reversal-reconciliation", adminMiddleware, async (_req, res) => {
  try {
    const { paymentReversalReconciliationJob } = await import("../jobs/paymentReversalJob");
    const result = await paymentReversalReconciliationJob();
    res.json({ success: true, data: result });
  } catch (err) {
    console.error("Run reversal reconciliation error:", err);
    res.status(500).json({ success: false, error: "Failed to run reversal reconciliation" });
  }
});

circlesRouter.get("/defaults/my", authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string | undefined;
    const result = await getDefaultsByUser(req.user!.userId, { page, limit, status });
    res.json({ success: true, data: result });
  } catch (err) {
    console.error("Get my circle defaults error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch circle defaults" });
  }
});

circlesRouter.get("/accounts/:id/defaults", authMiddleware, async (req, res) => {
  try {
    const defaults = await getDefaultsByAccount(req.params.id, req.user!.userId);
    res.json({ success: true, data: defaults });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch defaults";
    console.error("Get account defaults error:", err);
    res.status(400).json({ success: false, error: message });
  }
});

circlesRouter.post("/defaults/:id/clear", authMiddleware, async (req, res) => {
  try {
    const account = await clearCircleDefault(req.params.id, req.user!.userId);
    const balance = await getWalletBalance(req.user!.userId);
    res.json({ success: true, data: { account, walletBalance: balance } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to clear default";
    console.error("Clear circle default error:", err);
    res.status(400).json({ success: false, error: message });
  }
});

circlesRouter.get("/payout-requests/my", authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string | undefined;
    const result = await getCirclePayoutRequestsByUser(req.user!.userId, { page, limit, status });
    res.json({ success: true, data: result });
  } catch (err) {
    console.error("Get my payout requests error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch payout requests" });
  }
});

circlesRouter.get("/admin/payout-requests", adminMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string | undefined;
    const result = await getCirclePayoutRequests({ page, limit, status });
    res.json({ success: true, data: result });
  } catch (err) {
    console.error("Get payout requests error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch payout requests" });
  }
});

circlesRouter.post("/admin/payout-requests/:id/approve", adminMiddleware, async (req, res) => {
  try {
    const request = await approveCirclePayoutRequest(req.params.id, req.user!.userId);
    res.json({ success: true, data: request });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to approve payout request";
    console.error("Approve payout request error:", err);
    res.status(400).json({ success: false, error: message });
  }
});

circlesRouter.post("/admin/payout-requests/:id/decline", adminMiddleware, async (req, res) => {
  try {
    const { note } = req.body;
    const request = await declineCirclePayoutRequest(req.params.id, req.user!.userId, note);
    res.json({ success: true, data: request });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to decline payout request";
    console.error("Decline payout request error:", err);
    res.status(400).json({ success: false, error: message });
  }
});

circlesRouter.post("/admin/payout-requests/:id/clear", adminMiddleware, async (req, res) => {
  try {
    const { note } = req.body;
    const request = await clearCirclePayoutRequest(req.params.id, req.user!.userId, note);
    res.json({ success: true, data: request });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to clear payout request";
    console.error("Clear payout request error:", err);
    res.status(400).json({ success: false, error: message });
  }
});

circlesRouter.post("/admin/payout-requests/:id/disburse", adminMiddleware, async (req, res) => {
  try {
    const provider = getPaymentProvider("flutterwave");
    if (!provider.initiateTransfer) {
      res.status(400).json({ success: false, error: "Flutterwave transfers are not available" });
      return;
    }
    const request = await disburseCirclePayoutRequestViaFlutterwave(
      req.params.id,
      req.user!.userId,
      (params) => provider.initiateTransfer!(params),
    );
    res.json({ success: true, data: request });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to disburse payout request";
    console.error("Disburse payout request error:", err);
    res.status(400).json({ success: false, error: message });
  }
});

circlesRouter.post("/admin/payout-requests/:id/mark-disbursed", adminMiddleware, async (req, res) => {
  try {
    const { proofUrl, note, reference } = req.body;
    const request = await markCirclePayoutRequestDisbursed(req.params.id, req.user!.userId, {
      proofUrl,
      note,
      reference,
    });
    res.json({ success: true, data: request });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to mark payout request as disbursed";
    console.error("Mark disbursed error:", err);
    res.status(400).json({ success: false, error: message });
  }
});
