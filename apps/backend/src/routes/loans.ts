import { Router, Request } from "express";
import { authMiddleware, requireAdmin } from "../middleware/auth";
import {
  createLoan,
  getLoanById,
  getLoansByBorrower,
  getAllLoans,
  updateLoan,
  calculateLoanTerms,
  createAuditLog,
} from "@thrift/db";

export const loansRouter = Router();

function actor(req: Request) {
  return {
    actorId: req.user?.userId ?? null,
    actorEmail: req.user?.email ?? null,
    ipAddress: (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || null,
  };
}

loansRouter.get("/", requireAdmin, async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const status = req.query.status as string | undefined;

    const result = await getAllLoans({ page, limit, status });
    res.json({ success: true, data: result });
  } catch (err) {
    console.error("Get loans error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch loans" });
  }
});

loansRouter.get("/my", authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string | undefined;
    const result = await getLoansByBorrower(req.user!.userId, { page, limit, status });
    res.json({ success: true, data: result });
  } catch (err) {
    console.error("Get my loans error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch your loans" });
  }
});

loansRouter.get("/calculate", authMiddleware, async (req, res) => {
  try {
    const amount = Number(req.query.amount) || 0;
    const termMonths = Number(req.query.termMonths) || 12;

    if (amount <= 0) {
      res.status(400).json({ success: false, error: "Amount must be greater than 0" });
      return;
    }

    const terms = calculateLoanTerms(amount, termMonths);
    res.json({ success: true, data: terms });
  } catch (err) {
    console.error("Calculate loan error:", err);
    res.status(500).json({ success: false, error: "Failed to calculate loan terms" });
  }
});

loansRouter.post("/", authMiddleware, async (req, res) => {
  try {
    const { amount, termMonths, purpose } = req.body;

    if (!amount || Number(amount) <= 0) {
      res.status(400).json({ success: false, error: "A valid loan amount is required" });
      return;
    }
    if (!termMonths || Number(termMonths) <= 0 || Number(termMonths) > 60) {
      res.status(400).json({ success: false, error: "Term must be between 1 and 60 months" });
      return;
    }

    const terms = calculateLoanTerms(Number(amount), Number(termMonths));

    const loan = await createLoan({
      borrowerId: req.user!.userId,
      amount: Number(amount),
      interestRate: terms.interestRate,
      termMonths: Number(termMonths),
      monthlyPayment: terms.monthlyPayment,
      totalRepayment: terms.totalRepayment,
      purpose,
    });

    res.status(201).json({ success: true, data: loan });
  } catch (err) {
    console.error("Create loan error:", err);
    res.status(500).json({ success: false, error: "Failed to create loan request" });
  }
});

loansRouter.get("/:id", authMiddleware, async (req, res) => {
  try {
    const loan = await getLoanById(req.params.id);
    if (!loan) {
      res.status(404).json({ success: false, error: "Loan not found" });
      return;
    }
    res.json({ success: true, data: loan });
  } catch (err) {
    console.error("Get loan error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch loan" });
  }
});

loansRouter.put("/:id/approve", requireAdmin, async (req, res) => {
  try {
    const loan = await getLoanById(req.params.id);
    if (!loan) {
      res.status(404).json({ success: false, error: "Loan not found" });
      return;
    }
    if (loan.status !== "pending") {
      res.status(400).json({ success: false, error: "Only pending loans can be approved" });
      return;
    }

    const updated = await updateLoan(req.params.id, {
      status: "approved",
      approvedAt: new Date(),
    });

    await createAuditLog({ ...actor(req), action: "loan.approve", entity: "loan", entityId: loan.id, metadata: { amount: loan.amount } });
    res.json({ success: true, data: updated });
  } catch (err) {
    console.error("Approve loan error:", err);
    res.status(500).json({ success: false, error: "Failed to approve loan" });
  }
});

loansRouter.put("/:id/disburse", requireAdmin, async (req, res) => {
  try {
    const loan = await getLoanById(req.params.id);
    if (!loan) {
      res.status(404).json({ success: false, error: "Loan not found" });
      return;
    }
    if (loan.status !== "approved") {
      res.status(400).json({ success: false, error: "Only approved loans can be disbursed" });
      return;
    }

    const updated = await updateLoan(req.params.id, {
      status: "disbursed",
      disbursedAt: new Date(),
    });

    await createAuditLog({ ...actor(req), action: "loan.disburse", entity: "loan", entityId: loan.id, metadata: { amount: loan.amount } });
    res.json({ success: true, data: updated });
  } catch (err) {
    console.error("Disburse loan error:", err);
    res.status(500).json({ success: false, error: "Failed to disburse loan" });
  }
});

loansRouter.put("/:id/complete", requireAdmin, async (req, res) => {
  try {
    const loan = await getLoanById(req.params.id);
    if (!loan) {
      res.status(404).json({ success: false, error: "Loan not found" });
      return;
    }
    if (loan.status !== "disbursed") {
      res.status(400).json({ success: false, error: "Only disbursed loans can be completed" });
      return;
    }

    const updated = await updateLoan(req.params.id, {
      status: "completed",
      completedAt: new Date(),
    });

    await createAuditLog({ ...actor(req), action: "loan.complete", entity: "loan", entityId: loan.id });
    res.json({ success: true, data: updated });
  } catch (err) {
    console.error("Complete loan error:", err);
    res.status(500).json({ success: false, error: "Failed to complete loan" });
  }
});

loansRouter.put("/:id/reject", requireAdmin, async (req, res) => {
  try {
    const loan = await getLoanById(req.params.id);
    if (!loan) {
      res.status(404).json({ success: false, error: "Loan not found" });
      return;
    }
    if (loan.status !== "pending") {
      res.status(400).json({ success: false, error: "Only pending loans can be rejected" });
      return;
    }

    const updated = await updateLoan(req.params.id, { status: "rejected" });
    await createAuditLog({ ...actor(req), action: "loan.reject", entity: "loan", entityId: loan.id });
    res.json({ success: true, data: updated });
  } catch (err) {
    console.error("Reject loan error:", err);
    res.status(500).json({ success: false, error: "Failed to reject loan" });
  }
});
