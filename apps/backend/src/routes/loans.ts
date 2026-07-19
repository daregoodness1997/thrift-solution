import { Router, Request } from "express";
import crypto from "crypto";
import { authMiddleware, requireAdmin } from "../middleware/auth";
import { getPaymentProvider } from "../services/payments";
import {
  createLoan,
  getLoanById,
  getLoansByBorrower,
  getAllLoans,
  updateLoan,
  calculateLoanTerms,
  disburseLoan,
  disburseLoanViaFlutterwave,
  getLoanSchedule,
  getLoanRepayments,
  recordLoanRepayment,
  recordLoanRepaymentByReference,
  findLoanRepaymentByReference,
  liquidateLoan,
  adminSettleLoan,
  createAuditLog,
  findUserById,
  createTransaction,
} from "@thrift/db";

export const loansRouter = Router();

const DASHBOARD_URL = process.env.DASHBOARD_URL || "http://localhost:3001";

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
    const { amount, termMonths, purpose, processingFeeType, processingFeeValue } = req.body;

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
      processingFeeType: processingFeeType === "fixed" || processingFeeType === "percent" ? processingFeeType : undefined,
      processingFeeValue: processingFeeValue != null && processingFeeValue !== "" ? Number(processingFeeValue) : undefined,
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

loansRouter.get("/:id/schedule", authMiddleware, async (req, res) => {
  try {
    const schedule = await getLoanSchedule(req.params.id);
    const repayments = await getLoanRepayments(req.params.id);
    res.json({ success: true, data: { schedule, repayments } });
  } catch (err) {
    console.error("Get loan schedule error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch loan schedule" });
  }
});

loansRouter.post("/:id/repay", authMiddleware, async (req, res) => {
  try {
    const loan = await getLoanById(req.params.id);
    if (!loan) {
      res.status(404).json({ success: false, error: "Loan not found" });
      return;
    }
    if (loan.borrowerId !== req.user!.userId && req.user!.role !== "admin" && req.user!.role !== "superadmin") {
      res.status(403).json({ success: false, error: "You are not authorized to repay this loan" });
      return;
    }
    if (loan.status !== "disbursed" && loan.status !== "completed") {
      res.status(400).json({ success: false, error: "This loan is not active for repayment" });
      return;
    }

    const amount = Number(req.body.amount);
    if (!amount || amount <= 0) {
      res.status(400).json({ success: false, error: "A valid repayment amount is required" });
      return;
    }
    if (loan.outstandingBalance > 0 && amount > loan.outstandingBalance + 1) {
      res.status(400).json({
        success: false,
        error: `Repayment cannot exceed the outstanding balance of ${loan.outstandingBalance.toFixed(2)}`,
      });
      return;
    }

    const repayment = await recordLoanRepayment({
      loanId: req.params.id,
      borrowerId: req.user!.userId,
      amount,
      method: req.body.method || "wallet",
      note: req.body.note,
    });

    await createAuditLog({ ...actor(req), action: "loan.repay", entity: "loan", entityId: loan.id, metadata: { amount } });
    res.status(201).json({ success: true, data: repayment });
  } catch (err) {
    console.error("Repay loan error:", err);
    const message = err instanceof Error ? err.message : "Failed to record repayment";
    res.status(400).json({ success: false, error: message });
  }
});

// Initiate a Flutterwave-hosted payment for a loan. Caller may pay a single
// schedule installment (`installmentNo`) or the full outstanding balance
// (`full=true`). Returns an authorizationUrl to redirect the user to.
loansRouter.post("/:id/pay", authMiddleware, async (req, res) => {
  try {
    const loan = await getLoanById(req.params.id);
    if (!loan) {
      res.status(404).json({ success: false, error: "Loan not found" });
      return;
    }
    if (loan.borrowerId !== req.user!.userId && req.user!.role !== "admin" && req.user!.role !== "superadmin") {
      res.status(403).json({ success: false, error: "You are not authorized to pay this loan" });
      return;
    }
    if (loan.status !== "disbursed" && loan.status !== "completed") {
      res.status(400).json({ success: false, error: "This loan is not active for repayment" });
      return;
    }

    const provider = (req.body.provider as string) || "flutterwave";
    const payFull = req.body.full === true || req.body.full === "true";
    const installmentNo = req.body.installmentNo ? Number(req.body.installmentNo) : undefined;

    let amount: number;
    let metaNote: string;

    if (payFull) {
      amount = Math.round((loan.outstandingBalance ?? 0) * 100) / 100;
      metaNote = "Full loan balance";
      if (amount <= 0) {
        res.status(400).json({ success: false, error: "Loan is already fully repaid" });
        return;
      }
    } else if (installmentNo) {
      const item = loan.schedule.find((s) => s.installmentNo === installmentNo);
      if (!item) {
        res.status(404).json({ success: false, error: "Schedule installment not found" });
        return;
      }
      if (item.status === "paid") {
        res.status(400).json({ success: false, error: "This installment is already paid" });
        return;
      }
      const remaining = Math.round((item.principal + item.interest - item.principalPaid - item.interestPaid) * 100) / 100;
      amount = remaining;
      metaNote = `Installment #${installmentNo}`;
    } else {
      res.status(400).json({ success: false, error: "Specify either `full: true` or an `installmentNo`" });
      return;
    }

    const paymentProvider = getPaymentProvider(provider);
    const user = await findUserById(req.user!.userId);
    if (!user) {
      res.status(404).json({ success: false, error: "User not found" });
      return;
    }

    const reference = `LOANPAY-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
    const callbackUrl = `${DASHBOARD_URL}/loans/callback?provider=${provider}`;

    await createTransaction({
      userId: req.user!.userId,
      type: "loan_repayment",
      amount,
      loanId: loan.id,
      reference,
      metadata: { scope: payFull ? "full" : "installment", installmentNo: installmentNo ?? null },
      description: `Loan repayment via ${provider} (${metaNote})`,
    });

    const paymentResult = await paymentProvider.initializePayment({
      amount,
      email: user.email,
      reference,
      callbackUrl,
      metadata: {
        loanId: loan.id,
        borrowerId: req.user!.userId,
        provider,
        scope: payFull ? "full" : "installment",
        installmentNo: installmentNo ?? null,
      },
    });

    res.status(201).json({
      success: true,
      data: { authorizationUrl: paymentResult.authorizationUrl, reference, amount },
    });
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error("Initiate loan payment error:", error.message);
    res.status(500).json({ success: false, error: error.message || "Failed to initiate loan payment" });
  }
});

// Verify a Flutterwave (or other provider) loan payment callback. Records the
// repayment against the schedule and updates loan balances.
loansRouter.get("/pay/verify/:reference", authMiddleware, async (req, res) => {
  try {
    const { reference } = req.params;
    const provider = (req.query.provider as string) || "flutterwave";

    const existing = await findLoanRepaymentByReference(reference);
    if (existing) {
      res.json({ success: true, data: { status: "completed", reference, alreadyRecorded: true } });
      return;
    }

    const paymentProvider = getPaymentProvider(provider);
    const verification = await paymentProvider.verifyPayment(reference);

    if (verification.status !== "completed") {
      res.json({ success: true, data: { status: verification.status, reference, amount: verification.amount } });
      return;
    }

    const { prisma } = await import("@thrift/db");
    const txn = await prisma.transaction.findUnique({ where: { reference } });
    if (!txn || !txn.loanId) {
      res.status(404).json({ success: false, error: "Loan payment transaction not found" });
      return;
    }

    const repayment = await recordLoanRepaymentByReference({
      reference,
      loanId: txn.loanId,
      borrowerId: txn.userId,
      amount: verification.amount || txn.amount,
      provider,
      installmentNo: (txn.metadata as { installmentNo?: number } | null)?.installmentNo,
    });

    await createAuditLog({
      ...actor(req),
      action: "loan.repay",
      entity: "loan",
      entityId: txn.loanId,
      metadata: { amount: verification.amount || txn.amount, provider, reference },
    });

    res.json({ success: true, data: { status: "completed", reference, amount: verification.amount, repayment } });
  } catch (err) {
    console.error("Verify loan payment error:", err);
    res.status(500).json({ success: false, error: "Payment verification failed" });
  }
});

// Liquidate (pay off) the full outstanding balance of a loan via Flutterwave.
loansRouter.post("/:id/liquidate", authMiddleware, async (req, res) => {
  try {
    const loan = await getLoanById(req.params.id);
    if (!loan) {
      res.status(404).json({ success: false, error: "Loan not found" });
      return;
    }
    if (loan.borrowerId !== req.user!.userId && req.user!.role !== "admin" && req.user!.role !== "superadmin") {
      res.status(403).json({ success: false, error: "You are not authorized to liquidate this loan" });
      return;
    }
    if (loan.status !== "disbursed" && loan.status !== "completed") {
      res.status(400).json({ success: false, error: "This loan is not active for repayment" });
      return;
    }

    const provider = (req.body.provider as string) || "flutterwave";
    const paymentProvider = getPaymentProvider(provider);
    const user = await findUserById(req.user!.userId);
    if (!user) {
      res.status(404).json({ success: false, error: "User not found" });
      return;
    }

    const amount = Math.round((loan.outstandingBalance ?? 0) * 100) / 100;
    if (amount <= 0) {
      res.status(400).json({ success: false, error: "Loan is already fully repaid" });
      return;
    }

    const reference = `LOANLIQ-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
    const callbackUrl = `${DASHBOARD_URL}/loans/callback?provider=${provider}`;

    await createTransaction({
      userId: req.user!.userId,
      type: "loan_repayment",
      amount,
      loanId: loan.id,
      reference,
      description: `Loan liquidation via ${provider}`,
    });

    const paymentResult = await paymentProvider.initializePayment({
      amount,
      email: user.email,
      reference,
      callbackUrl,
      metadata: { loanId: loan.id, borrowerId: req.user!.userId, provider, scope: "liquidation" },
    });

    res.status(201).json({
      success: true,
      data: { authorizationUrl: paymentResult.authorizationUrl, reference, amount },
    });
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error("Liquidate loan error:", error.message);
    res.status(500).json({ success: false, error: error.message || "Failed to liquidate loan" });
  }
});

// Admin force-settle / write-off a loan without requiring payment.
loansRouter.put("/:id/settle", requireAdmin, async (req, res) => {
  try {
    const loan = await getLoanById(req.params.id);
    if (!loan) {
      res.status(404).json({ success: false, error: "Loan not found" });
      return;
    }
    if (loan.status !== "disbursed") {
      res.status(400).json({ success: false, error: "Only disbursed loans can be settled" });
      return;
    }

    const updated = await adminSettleLoan(req.params.id, req.body.note);
    await createAuditLog({
      ...actor(req),
      action: "loan.settle",
      entity: "loan",
      entityId: loan.id,
      metadata: { note: req.body.note },
    });
    res.json({ success: true, data: updated });
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error("Settle loan error:", error.message);
    res.status(400).json({ success: false, error: error.message || "Failed to settle loan" });
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

    const disbursedAmount = req.body.amount ? Number(req.body.amount) : undefined;
    const updated = await disburseLoan(req.params.id, disbursedAmount, {
      method: "manual",
      disbursedById: req.user?.userId,
    });

    await createAuditLog({ ...actor(req), action: "loan.disburse", entity: "loan", entityId: loan.id, metadata: { amount: loan.amount } });
    res.json({ success: true, data: updated });
  } catch (err) {
    console.error("Disburse loan error:", err);
    res.status(500).json({ success: false, error: "Failed to disburse loan" });
  }
});

loansRouter.put("/:id/disburse/flutterwave", requireAdmin, async (req, res) => {
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

    const provider = getPaymentProvider("flutterwave");
    if (!provider.initiateTransfer) {
      res.status(400).json({ success: false, error: "Flutterwave transfers are not available" });
      return;
    }

    const disbursedAmount = req.body.amount ? Number(req.body.amount) : undefined;
    const updated = await disburseLoanViaFlutterwave(
      req.params.id,
      req.user!.userId,
      (params) => provider.initiateTransfer!({ ...params, narration: "Thrift Solution loan disbursement" }),
      disbursedAmount,
    );

    await createAuditLog({ ...actor(req), action: "loan.disburse.flutterwave", entity: "loan", entityId: loan.id, metadata: { amount: updated.disbursedAmount, ref: updated.disbursementRef } });
    res.json({ success: true, data: updated });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to disburse loan";
    console.error("Disburse loan via Flutterwave error:", err);
    res.status(400).json({ success: false, error: message });
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
