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
  earlyWithdrawCircleAccount,
  matureCircleAccount,
  runWeeklyInterestJob,
  getWalletBalance,
  findUserById,
} from "@thrift/db";

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
    const accounts = await getCircleAccountsByUser(req.user!.userId);
    const balance = await getWalletBalance(req.user!.userId);
    res.json({ success: true, data: { accounts, walletBalance: balance } });
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

circlesRouter.post("/:id/open", authMiddleware, async (req, res) => {
  try {
    const count = Math.max(1, Math.min(Number(req.body?.count) || 1, 10));
    const accounts = [];
    let lastError: Error | null = null;

    for (let i = 0; i < count; i++) {
      try {
        const account = await openCircleAccount(req.params.id, req.user!.userId);
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
    const { name, description, amount, durationMonths, interestRateAnnual, maxAccountsPerUser } = req.body;

    if (!name || !amount || !durationMonths || !interestRateAnnual) {
      res.status(400).json({ success: false, error: "name, amount, durationMonths, and interestRateAnnual are required" });
      return;
    }

    const circle = await createCircle({
      name,
      description,
      amount: Number(amount),
      durationMonths: Number(durationMonths),
      interestRateAnnual: Number(interestRateAnnual),
      maxAccountsPerUser: maxAccountsPerUser ? Number(maxAccountsPerUser) : undefined,
    });

    res.status(201).json({ success: true, data: circle });
  } catch (err) {
    console.error("Create circle error:", err);
    res.status(500).json({ success: false, error: "Failed to create circle" });
  }
});

circlesRouter.put("/:id", adminMiddleware, async (req, res) => {
  try {
    const { name, description, amount, durationMonths, interestRateAnnual, maxAccountsPerUser, status } = req.body;

    const circle = await updateCircle(req.params.id, {
      name,
      description,
      amount: amount ? Number(amount) : undefined,
      durationMonths: durationMonths ? Number(durationMonths) : undefined,
      interestRateAnnual: interestRateAnnual ? Number(interestRateAnnual) : undefined,
      maxAccountsPerUser: maxAccountsPerUser ? Number(maxAccountsPerUser) : undefined,
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
