import { Router } from "express";
import crypto from "crypto";
import { authMiddleware } from "../middleware/auth";
import { upload, uploadFile } from "../utils/upload";
import { getPaymentProvider, getAvailableProviders } from "../services/payments";
import {
  createDonation,
  findDonationById,
  findDonationByReference,
  updateDonationStatus,
  getUserDonations,
  getDonationStats,
  createTransaction,
  findUserById,
  findGroupById,
  findTransactionByReference,
  updateTransactionStatus,
  getPendingDonations,
  updateDonationPaymentUrl,
} from "@thrift/db";

export const donationsRouter = Router();

const API_URL = process.env.API_URL || "http://localhost:4000";
const DASHBOARD_URL = process.env.DASHBOARD_URL || "http://localhost:3001";
const WEBSITE_URL = process.env.WEBSITE_URL || "http://localhost:3000";

// Public donation endpoint (no auth required - for website visitors)
donationsRouter.post("/public", async (req, res) => {
  try {
    const { amount, provider, notes, email, name, callbackUrl } = req.body;

    if (!amount || amount <= 0) {
      res.status(400).json({ success: false, error: "A valid amount is required" });
      return;
    }

    if (!provider) {
      res.status(400).json({ success: false, error: "Payment provider is required" });
      return;
    }

    if (!email) {
      res.status(400).json({ success: false, error: "Email is required" });
      return;
    }

    const paymentProvider = getPaymentProvider(provider);
    const reference = `DON-PUB-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
    const redirectCallback = callbackUrl || `${WEBSITE_URL}/donate/callback?provider=${provider}`;

    const { prisma } = await import("@thrift/db");
    const donation = await prisma.donation.create({
      data: {
        type: "monetary",
        amount: parseFloat(amount),
        currency: "NGN",
        paymentProvider: provider,
        paymentReference: reference,
        notes: notes || undefined,
        donorEmail: email,
        donorName: name || undefined,
        status: "pending",
      },
    });

    const paymentResult = await paymentProvider.initializePayment({
      amount: parseFloat(amount),
      email,
      reference,
      callbackUrl: redirectCallback,
      metadata: { donationId: donation.id, email, name },
    });

    await prisma.donation.update({
      where: { id: donation.id },
      data: { paymentUrl: paymentResult.authorizationUrl },
    });

    res.status(201).json({
      success: true,
      data: {
        donation: { id: donation.id, reference, amount: parseFloat(amount), provider },
        authorizationUrl: paymentResult.authorizationUrl,
      },
    });
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error("Create public donation error:", error.message);
    if (error.cause) console.error("  Cause:", error.cause);
    res.status(500).json({ success: false, error: error.message || "Failed to create donation" });
  }
});

// Public verify endpoint for website callback
donationsRouter.get("/public/verify/:reference", async (req, res) => {
  try {
    const { reference } = req.params;
    const provider = (req.query.provider as string) || "paystack";

    const paymentProvider = getPaymentProvider(provider);
    const verification = await paymentProvider.verifyPayment(reference);

    const { prisma } = await import("@thrift/db");
    const donation = await prisma.donation.findFirst({
      where: { paymentReference: reference },
    });

    if (donation && verification.status === "completed") {
      await prisma.donation.update({
        where: { id: donation.id },
        data: { status: "completed" },
      });
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
    console.error("Verify public payment error:", err);
    res.status(500).json({ success: false, error: "Payment verification failed" });
  }
});

// Create a monetary donation (initiates payment)
donationsRouter.post("/", authMiddleware, async (req, res) => {
  try {
    const { amount, provider, groupId, notes } = req.body;
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

    if (groupId) {
      const group = await findGroupById(groupId);
      if (!group) {
        res.status(404).json({ success: false, error: "Group not found" });
        return;
      }
    }

    const reference = `DON-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
    const callbackUrl = `${DASHBOARD_URL}/donate/callback?provider=${provider}`;

    const donation = await createDonation({
      userId,
      type: "monetary",
      amount: parseFloat(amount),
      currency: "NGN",
      paymentProvider: provider,
      paymentReference: reference,
      groupId: groupId || undefined,
      notes: notes || undefined,
    });

    await createTransaction({
      userId,
      type: "donation",
      amount: parseFloat(amount),
      groupId: groupId || undefined,
      donationId: donation.id,
      reference,
      description: `Donation via ${provider}`,
    });

    const paymentResult = await paymentProvider.initializePayment({
      amount: parseFloat(amount),
      email: user.email,
      reference,
      callbackUrl,
      metadata: { donationId: donation.id, userId, groupId },
    });

    const { prisma } = await import("@thrift/db");
    await prisma.donation.update({
      where: { id: donation.id },
      data: { paymentUrl: paymentResult.authorizationUrl },
    });

    res.status(201).json({
      success: true,
      data: {
        donation: { id: donation.id, reference, amount: parseFloat(amount), provider },
        authorizationUrl: paymentResult.authorizationUrl,
      },
    });
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error("Create donation error:", error.message);
    if (error.cause) console.error("  Cause:", error.cause);
    res.status(500).json({ success: false, error: error.message || "Failed to create donation" });
  }
});

// Create an item donation (no payment needed)
donationsRouter.post("/item", authMiddleware, upload.single('itemImage'), async (req, res) => {
  try {
    const { itemName, itemDescription, itemCategory, itemCondition, notes } = req.body;
    const userId = req.user!.userId;

    if (!itemName) {
      res.status(400).json({ success: false, error: "Item name is required" });
      return;
    }

    let itemImage: string | undefined;

    if (req.file) {
      const result = await uploadFile(req.file, 'donations');
      itemImage = result.url;
    }

    const donation = await createDonation({
      userId,
      type: "item",
      itemName,
      itemDescription: itemDescription || undefined,
      itemImage,
      itemCategory: itemCategory || undefined,
      itemCondition: itemCondition || undefined,
      notes: notes || undefined,
    });

    const { prisma } = await import("@thrift/db");
    await prisma.donation.update({
      where: { id: donation.id },
      data: { status: "completed" },
    });

    res.status(201).json({
      success: true,
      data: { donation },
    });
  } catch (err) {
    console.error("Create item donation error:", err);
    res.status(500).json({ success: false, error: "Failed to create item donation" });
  }
});

// Get user's donation history
donationsRouter.get("/", authMiddleware, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const limit = parseInt(req.query.limit as string) || 20;
    const page = parseInt(req.query.page as string) || 1;
    const type = req.query.type as string | undefined;
    const offset = (page - 1) * limit;

    const [result, stats] = await Promise.all([
      getUserDonations(userId, { limit, offset, type }),
      getDonationStats(userId),
    ]);

    const totalPages = Math.ceil(result.total / limit);

    res.json({
      success: true,
      data: {
        donations: result.items,
        stats,
        total: result.total,
        page,
        limit,
        totalPages,
      },
    });
  } catch (err) {
    console.error("Get donations error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch donations" });
  }
});

// Get donation stats
donationsRouter.get("/stats", authMiddleware, async (req, res) => {
  try {
    const stats = await getDonationStats(req.user!.userId);
    res.json({ success: true, data: stats });
  } catch (err) {
    console.error("Get donation stats error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch stats" });
  }
});

// Get available payment providers
donationsRouter.get("/providers", (_req, res) => {
  res.json({ success: true, data: getAvailableProviders() });
});

// Get single donation
donationsRouter.get("/:id", authMiddleware, async (req, res) => {
  try {
    const donation = await findDonationById(req.params.id);
    if (!donation || donation.userId !== req.user!.userId) {
      res.status(404).json({ success: false, error: "Donation not found" });
      return;
    }

    res.json({ success: true, data: donation });
  } catch (err) {
    console.error("Get donation error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch donation" });
  }
});

// Verify payment callback
donationsRouter.get("/verify/:reference", authMiddleware, async (req, res) => {
  try {
    const { reference } = req.params;
    const provider = (req.query.provider as string) || "paystack";

    const paymentProvider = getPaymentProvider(provider);
    const verification = await paymentProvider.verifyPayment(reference);

    const donation = await findDonationByReference(reference);
    if (donation) {
      await updateDonationStatus(donation.id, verification.status);
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
    console.error("Verify payment error:", err);
    res.status(500).json({ success: false, error: "Payment verification failed" });
  }
});

// Get pending donations for current user
donationsRouter.get("/pending", authMiddleware, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const pendingDonations = await getPendingDonations(userId);

    res.json({
      success: true,
      data: pendingDonations.map((d) => ({
        id: d.id,
        reference: d.paymentReference,
        amount: d.amount,
        type: d.type,
        status: d.status,
        paymentUrl: d.paymentUrl,
        paymentProvider: d.paymentProvider,
        createdAt: d.createdAt,
      })),
    });
  } catch (err) {
    console.error("Get pending donations error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch pending donations" });
  }
});

// Resume a pending donation (returns the payment URL)
donationsRouter.post("/:id/resume", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const donation = await findDonationById(id);
    if (!donation || donation.userId !== userId) {
      res.status(404).json({ success: false, error: "Donation not found" });
      return;
    }

    if (donation.status !== "pending") {
      res.status(400).json({
        success: false,
        error: `Cannot resume donation with status: ${donation.status}`,
      });
      return;
    }

    if (!donation.paymentUrl) {
      res.status(400).json({
        success: false,
        error: "No payment URL available for this donation",
      });
      return;
    }

    res.json({
      success: true,
      data: {
        donationId: donation.id,
        reference: donation.paymentReference,
        amount: donation.amount,
        paymentUrl: donation.paymentUrl,
        paymentProvider: donation.paymentProvider,
      },
    });
  } catch (err) {
    console.error("Resume donation error:", err);
    res.status(500).json({ success: false, error: "Failed to resume donation" });
  }
});

// Webhook endpoints for payment providers
donationsRouter.post("/webhook/paystack", async (req, res) => {
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
      // Update donation if exists
      const donation = await findDonationByReference(data.reference);
      if (donation) {
        await updateDonationStatus(donation.id, "completed");
      }
      
      // Update wallet funding transaction if exists
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

// NOTE: Flutterwave donation webhooks are handled by the centralized
// webhook at /api/webhooks/flutterwave (flutterwave-webhook.ts). That handler
// covers charge.completed, reversals, and transfers — removing the need for a
// separate endpoint here.

donationsRouter.post("/webhook/nomba", async (req, res) => {
  try {
    const { eventType, data } = req.body;
    if (eventType === "PAYMENT_SUCCESS") {
      // Update donation if exists
      const donation = await findDonationByReference(data.orderId);
      if (donation) {
        await updateDonationStatus(donation.id, "completed");
      }
      
      // Update wallet funding transaction if exists
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
