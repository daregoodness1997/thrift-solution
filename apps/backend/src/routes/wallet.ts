import { Router } from "express";
import crypto from "crypto";
import { authMiddleware } from "../middleware/auth";
import { getPaymentProvider, getAvailableProviders } from "../services/payments";
import {
  createTransaction,
  findUserById,
  findTransactionByReference,
  updateTransactionStatus,
  getWalletBalance,
} from "@thrift/db";

export const walletRouter = Router();

const DASHBOARD_URL = process.env.DASHBOARD_URL || "http://localhost:3001";

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
      .update(JSON.stringify(req.body))
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

walletRouter.post("/webhook/flutterwave", async (req, res) => {
  try {
    const hash = crypto
      .createHmac("sha256", process.env.FLUTTERWAVE_SECRET_KEY || "")
      .update(JSON.stringify(req.body))
      .digest("hex");

    if (hash !== req.headers["verif-hash"]) {
      res.status(400).json({ error: "Invalid signature" });
      return;
    }

    const { event, data } = req.body;
    if (event === "charge.completed" && data.status === "successful") {
      const transaction = await findTransactionByReference(data.tx_ref);
      if (transaction && transaction.type === "funding") {
        await updateTransactionStatus(transaction.id, "completed");
      }
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("Flutterwave webhook error:", err);
    res.sendStatus(500);
  }
});

walletRouter.post("/webhook/nomba", async (req, res) => {
  try {
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
