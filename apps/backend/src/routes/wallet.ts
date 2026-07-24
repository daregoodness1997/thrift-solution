import { Router, Request as ExpressRequest } from "express";
import crypto from "crypto";
import { authMiddleware } from "../middleware/auth";
import { getPaymentProvider, getAvailableProviders } from "../services/payments";
import {
  createTransaction,
  findUserById,
  findTransactionByReference,
  findTransactionById,
  updateTransactionStatus,
  updateTransactionPaymentUrl,
  getWalletBalance,
  getWalletBreakdown,
  getPendingTransactions,
} from "@thrift/db";

export const walletRouter = Router();

const DASHBOARD_URL = process.env.DASHBOARD_URL || "http://localhost:3001";

function getRawBody(req: ExpressRequest): Buffer | undefined {
  return (req as unknown as { rawBody?: Buffer }).rawBody;
}

// Get available payment providers
walletRouter.get("/providers", (_req, res) => {
  res.json({ success: true, data: getAvailableProviders() });
});

// Get wallet balance
walletRouter.get("/balance", authMiddleware, async (req, res) => {
  try {
    const balance = await getWalletBalance(req.user!.userId);
    res.json({ success: true, data: { balance } });
  } catch (err) {
    console.error("Get wallet balance error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch wallet balance" });
  }
});

// Get wallet balance breakdown (available vs. committed/locked funds)
walletRouter.get("/balance/breakdown", authMiddleware, async (req, res) => {
  try {
    const breakdown = await getWalletBreakdown(req.user!.userId);
    res.json({ success: true, data: breakdown });
  } catch (err) {
    console.error("Get wallet breakdown error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch wallet breakdown" });
  }
});

// Initialize wallet funding with payment provider
walletRouter.post("/fund", authMiddleware, async (req, res) => {
  try {
    const { amount, provider } = req.body;
    const userId = req.user!.userId;

    if (!amount || amount <= 0) {
      res.status(400).json({ success: false, error: "A valid amount is required" });
      return;
    }

    if (!provider) {
      res.status(400).json({ success: false, error: "Payment provider is required" });
      return;
    }

    const paymentProvider = getPaymentProvider(provider);
    const user = await findUserById(userId);
    if (!user) {
      res.status(404).json({ success: false, error: "User not found" });
      return;
    }

    const reference = `FUND-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
    const callbackUrl = `${DASHBOARD_URL}/wallet/callback?provider=${provider}`;

    // Create pending transaction
    const transaction = await createTransaction({
      userId,
      type: "funding",
      amount: parseFloat(amount),
      reference,
      status: "pending",
      description: `Wallet funding via ${provider}`,
    });

    // Initialize payment with provider
    const paymentResult = await paymentProvider.initializePayment({
      amount: parseFloat(amount),
      email: user.email,
      reference,
      callbackUrl,
      metadata: { transactionId: transaction.id, userId, type: "wallet_funding" },
    });

    // Store payment URL on transaction for later resumption
    await updateTransactionPaymentUrl(transaction.id, paymentResult.authorizationUrl, provider);

    res.status(201).json({
      success: true,
      data: {
        transactionId: transaction.id,
        reference,
        amount: parseFloat(amount),
        provider,
        authorizationUrl: paymentResult.authorizationUrl,
      },
    });
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error("Initialize wallet funding error:", error.message);
    if (error.cause) console.error("  Cause:", error.cause);
    res.status(500).json({ success: false, error: error.message || "Failed to initialize payment" });
  }
});

// Verify wallet funding payment
walletRouter.get("/verify/:reference", authMiddleware, async (req, res) => {
  try {
    const { reference } = req.params;
    const provider = (req.query.provider as string) || "paystack";

    const paymentProvider = getPaymentProvider(provider);
    const verification = await paymentProvider.verifyPayment(reference);

    // Find and update the transaction
    const transaction = await findTransactionByReference(reference);
    if (transaction) {
      await updateTransactionStatus(transaction.id, verification.status);
    }

    res.json({
      success: true,
      data: {
        status: verification.status,
        amount: verification.amount,
        reference: verification.reference,
      },
    });
  } catch (err) {
    console.error("Verify wallet payment error:", err);
    res.status(500).json({ success: false, error: "Payment verification failed" });
  }
});

// Webhook endpoints for payment providers
walletRouter.post("/webhook/paystack", async (req, res) => {
  try {
    const hash = crypto
      .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY || "")
      .update(getRawBody(req) || JSON.stringify(req.body))
      .digest("hex");

    if (hash !== req.headers["x-paystack-signature"]) {
      res.status(400).json({ error: "Invalid signature" });
      return;
    }

    const { event, data } = req.body;
    if (event === "charge.success") {
      const transaction = await findTransactionByReference(data.reference);
      if (transaction && transaction.type === "funding") {
        await updateTransactionStatus(transaction.id, "completed");
      }
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("Paystack webhook error:", err);
    res.sendStatus(500);
  }
});

// NOTE: Flutterwave wallet funding webhooks are handled by the centralized
// webhook at /api/webhooks/flutterwave (flutterwave-webhook.ts). That handler
// covers charge.completed, reversals, and transfers — removing the need for a
// separate endpoint here.

walletRouter.post("/webhook/nomba", async (req, res) => {
  try {
    const signature = req.headers["x-nomba-signature"];
    const rawBody = getRawBody(req);
    const apiKey = process.env.NOMBA_API_KEY || "";

    if (!apiKey || !rawBody || typeof signature !== "string" || !signature) {
      res.status(400).json({ error: "Missing signature or API key" });
      return;
    }

    const expected = crypto.createHmac("sha256", apiKey).update(rawBody).digest("hex");
    const a = Buffer.from(expected);
    const b = Buffer.from(signature);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      res.status(400).json({ error: "Invalid signature" });
      return;
    }

    const { eventType, data } = req.body;
    if (eventType === "PAYMENT_SUCCESS") {
      const transaction = await findTransactionByReference(data.orderId);
      if (transaction && transaction.type === "funding") {
        await updateTransactionStatus(transaction.id, "completed");
      }
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("Nomba webhook error:", err);
    res.sendStatus(500);
  }
});

// Get pending transactions for current user
walletRouter.get("/pending", authMiddleware, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const pendingTransactions = await getPendingTransactions(userId);

    res.json({
      success: true,
      data: pendingTransactions.map((tx) => ({
        id: tx.id,
        reference: tx.reference,
        amount: tx.amount,
        type: tx.type,
        status: tx.status,
        paymentUrl: tx.paymentUrl,
        paymentProvider: tx.paymentProvider,
        createdAt: tx.createdAt,
      })),
    });
  } catch (err) {
    console.error("Get pending transactions error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch pending transactions" });
  }
});

// Resume a pending transaction (returns the payment URL)
walletRouter.post("/:id/resume", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const transaction = await findTransactionById(id);
    if (!transaction || transaction.userId !== userId) {
      res.status(404).json({ success: false, error: "Transaction not found" });
      return;
    }

    if (transaction.status !== "pending") {
      res.status(400).json({
        success: false,
        error: `Cannot resume transaction with status: ${transaction.status}`,
      });
      return;
    }

    if (!transaction.paymentUrl) {
      res.status(400).json({
        success: false,
        error: "No payment URL available for this transaction",
      });
      return;
    }

    res.json({
      success: true,
      data: {
        transactionId: transaction.id,
        reference: transaction.reference,
        amount: transaction.amount,
        paymentUrl: transaction.paymentUrl,
        paymentProvider: transaction.paymentProvider,
      },
    });
  } catch (err) {
    console.error("Resume transaction error:", err);
    res.status(500).json({ success: false, error: "Failed to resume transaction" });
  }
});
