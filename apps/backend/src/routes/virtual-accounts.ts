import { Router, Request, Response } from "express";
import crypto from "crypto";
import { getPaymentProvider, resolveVirtualAccount } from "../services/payments/index";
import { authMiddleware } from "../middleware/auth";
import {
  createVirtualAccount,
  getVirtualAccountsByUser,
  getVirtualAccountByAccountNumber,
  updateVirtualAccountLastTransfer,
  creditWallet,
  getKycByUserId,
  hasVirtualAccount,
  isKycVerifiedForVirtualAccount,
  getAllVirtualAccounts,
} from "@thrift/db";

const router = Router();

function generateReference(prefix: string): string {
  return `${prefix}_${Date.now()}_${crypto.randomBytes(8).toString("hex")}`;
}

function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: string }).code === "P2002"
  );
}

function verifyHmac(rawBody: Buffer | undefined, secret: string, signature: unknown, algorithm: "sha256" | "sha512"): boolean {
  if (!rawBody || typeof signature !== "string" || !secret) return false;
  const expected = crypto.createHmac(algorithm, secret).update(rawBody).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function getRawBody(req: Request): Buffer | undefined {
  return (req as unknown as { rawBody?: Buffer }).rawBody;
}

router.get("/providers", (_req: Request, res: Response) => {
  const providers = [
    {
      id: "flutterwave",
      name: "Flutterwave",
      description: "Instant virtual account with Flutterwave MFB",
      accountType: "Static Virtual Account",
    },
    {
      id: "paystack",
      name: "Paystack",
      description: "Dedicated virtual account with Wema Bank",
      accountType: "Dedicated Virtual Account",
    },
    {
      id: "nomba",
      name: "Nomba",
      description: "Virtual account with Nomba Microfinance Bank",
      accountType: "Virtual Account",
    },
  ];
  res.json({ providers });
});

router.post("/create", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { provider, firstName, lastName, email, phone } = req.body;
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    if (!provider) {
      res.status(400).json({ error: "Payment provider is required" });
      return;
    }

    const paymentProvider = getPaymentProvider(provider);
    if (!paymentProvider) {
      res.status(400).json({ error: `Unsupported payment provider: ${provider}` });
      return;
    }

    if (!paymentProvider.createVirtualAccount) {
      res.status(400).json({ error: `${provider} does not support virtual account creation` });
      return;
    }

    const kyc = await getKycByUserId(userId);
    if (!kyc || !isKycVerifiedForVirtualAccount(kyc)) {
      res.status(403).json({
        error:
          "KYC verification with both a valid BVN and NIN is required before a virtual account can be created. Please complete KYC first.",
        code: "KYC_REQUIRED",
      });
      return;
    }

    // Enforce one-virtual-account-per-user (1:1).
    if (await hasVirtualAccount(userId)) {
      const existing = await getVirtualAccountsByUser(userId);
      res.status(409).json({
        success: false,
        error: "A virtual account already exists for this user.",
        code: "VIRTUAL_ACCOUNT_EXISTS",
        virtualAccount: existing[0]
          ? {
              id: existing[0].id,
              accountNumber: existing[0].accountNumber,
              bankName: existing[0].bankName,
              bankCode: existing[0].bankCode,
              provider: existing[0].provider,
              reference: existing[0].reference,
              status: existing[0].status,
            }
          : undefined,
      });
      return;
    }

    const bvn = kyc.bvn!;
    const nin = kyc.nin!;
    const reference = generateReference("va");

    // Use the KYC-verified legal name for the account, not the user's
    // self-entered name.
    const verifiedName = kyc.verifiedName || "";
    const nameParts = verifiedName.trim().split(/\s+/);
    const vaFirstName = nameParts[0] || firstName || "";
    const vaLastName = nameParts.slice(1).join(" ") || lastName || "";

    const result = await paymentProvider.createVirtualAccount({
      email,
      firstName: vaFirstName,
      lastName: vaLastName,
      phone,
      bvn,
      nin,
      reference,
      narration: "Thrift Solution Virtual Account",
    });
    const resolved = resolveVirtualAccount(result, userId);

    const virtualAccount = await createVirtualAccount({
      userId,
      provider,
      accountNumber: resolved.accountNumber,
      bankName: resolved.bankName,
      bankCode: resolved.bankCode,
      reference: result.reference,
      providerRef: result.providerRef,
      isPermanent: true,
      bvn,
      nin,
      accountName: verifiedName || undefined,
    });

    res.status(201).json({
      success: true,
      virtualAccount: {
        id: virtualAccount.id,
        accountNumber: virtualAccount.accountNumber,
        bankName: virtualAccount.bankName,
        bankCode: virtualAccount.bankCode,
        provider: virtualAccount.provider,
        reference: virtualAccount.reference,
        status: virtualAccount.status,
      },
    });
  } catch (err) {
    console.error("Virtual account creation error:", err);
    const message = err instanceof Error ? err.message : "Failed to create virtual account";
    res.status(500).json({ error: message });
  }
});

router.get("/", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const accounts = await getVirtualAccountsByUser(userId);

    res.json({
      virtualAccounts: accounts.map((va) => ({
        id: va.id,
        accountNumber: va.accountNumber,
        accountName: va.accountName,
        bankName: va.bankName,
        bankCode: va.bankCode,
        provider: va.provider,
        reference: va.reference,
        status: va.status,
        createdAt: va.createdAt,
        lastTransferAt: va.lastTransferAt,
      })),
    });
  } catch (err) {
    console.error("Get virtual accounts error:", err);
    res.status(500).json({ error: "Failed to fetch virtual accounts" });
  }
});

// NOTE: Flutterwave virtual account webhooks are handled by the centralized
// webhook at /api/webhooks/flutterwave (flutterwave-webhook.ts). That handler
// covers charge.completed, reversals, and transfers — removing the need for a
// separate endpoint here.

router.post("/webhook/paystack", async (req: Request, res: Response) => {
  res.status(200).json({ received: true });

  setImmediate(async () => {
    try {
      const signature = req.headers["x-paystack-signature"];
      if (!verifyHmac(getRawBody(req), process.env.PAYSTACK_SECRET_KEY || "", signature, "sha512")) {
        console.error("Paystack virtual account webhook: invalid signature");
        return;
      }

      const event = req.body;
      if (event.event !== "charge.success" || !event.data) return;
      const data = event.data;
      if (data.status !== "success") return;

      const accountNumber = data.account_number;
      if (!accountNumber) return;

      const virtualAccount = await getVirtualAccountByAccountNumber(accountNumber);
      if (!virtualAccount) return;

      const amount = Number(data.amount) / 100;
      const reference = `va_ps_${data.reference}`;
      const description = `Wallet funding via Paystack virtual account ${accountNumber}`;

      await creditWallet(virtualAccount.userId, amount, "wallet_funding", description, reference);
      await updateVirtualAccountLastTransfer(virtualAccount.id);
    } catch (err) {
      if (isUniqueViolation(err)) return;
      console.error("Paystack virtual account webhook processing error:", err);
    }
  });
});

router.post("/webhook/nomba", async (req: Request, res: Response) => {
  res.status(200).json({ received: true });

  setImmediate(async () => {
    try {
      const signature = req.headers["x-nomba-signature"];
      if (!verifyHmac(getRawBody(req), process.env.NOMBA_API_KEY || "", signature, "sha256")) {
        console.error("Nomba virtual account webhook: invalid signature");
        return;
      }

      const event = req.body;
      if (event.eventType !== "PAYMENT_SUCCESS" && event.event !== "TRANSFER" && event.event !== "payment.success") {
        return;
      }
      const data = event.data || event;

      const accountNumber = data.destinationAccountNumber || data.accountNumber || data.account_number;
      if (!accountNumber) return;

      const virtualAccount = await getVirtualAccountByAccountNumber(accountNumber);
      if (!virtualAccount) return;

      const amount = Number(data.amount);
      const reference = `va_nm_${data.id || data.orderId || data.transactionId}`;
      const description = `Wallet funding via Nomba virtual account ${accountNumber}`;

      await creditWallet(virtualAccount.userId, amount, "wallet_funding", description, reference);
      await updateVirtualAccountLastTransfer(virtualAccount.id);
    } catch (err) {
      if (isUniqueViolation(err)) return;
      console.error("Nomba virtual account webhook processing error:", err);
    }
  });
});

router.post("/reconcile", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const { virtualAccountId, sinceHours = 24 } = req.body;
    if (!virtualAccountId) {
      res.status(400).json({ error: "Virtual account ID is required" });
      return;
    }

    const accounts = await getVirtualAccountsByUser(userId);
    const virtualAccount = accounts.find((va) => va.id === virtualAccountId);
    if (!virtualAccount) {
      res.status(404).json({ error: "Virtual account not found" });
      return;
    }

    const paymentProvider = getPaymentProvider(virtualAccount.provider);
    if (!paymentProvider || !paymentProvider.checkVirtualAccountTransfers) {
      res.status(400).json({ error: `${virtualAccount.provider} does not support transfer checking` });
      return;
    }

    const recentTransfers = await paymentProvider.checkVirtualAccountTransfers(
      virtualAccount.accountNumber,
      sinceHours
    );

    let creditedCount = 0;
    const results: Array<{ reference: string; amount: number; status: string }> = [];

    for (const transfer of recentTransfers) {
      const reference = transfer.reference;
      const description = `Wallet funding via ${virtualAccount.provider} virtual account ${virtualAccount.accountNumber} (manual reconciliation)`;

      try {
        await creditWallet(virtualAccount.userId, transfer.amount, "wallet_funding", description, reference);
        await updateVirtualAccountLastTransfer(virtualAccount.id);
        creditedCount++;
        results.push({ reference, amount: transfer.amount, status: "credited" });
      } catch (err) {
        if (isUniqueViolation(err)) {
          results.push({ reference, amount: transfer.amount, status: "already_processed" });
        } else {
          results.push({ reference, amount: transfer.amount, status: "error" });
          console.error("Error crediting wallet for transfer:", transfer.reference, err);
        }
      }
    }

    res.json({
      success: true,
      data: {
        virtualAccountId: virtualAccount.id,
        accountNumber: virtualAccount.accountNumber,
        transfersFound: recentTransfers.length,
        transfersCredited: creditedCount,
        results,
      },
    });
  } catch (err) {
    console.error("Virtual account reconciliation error:", err);
    const message = err instanceof Error ? err.message : "Failed to reconcile payments";
    res.status(500).json({ error: message });
  }
});

router.post("/reconcile-all", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const isAdmin = req.user?.role === "admin" || req.user?.role === "superadmin";

    if (!userId) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const { sinceHours = 24 } = req.body;

    let accounts: any[];
    if (isAdmin) {
      const allAccounts = await getAllVirtualAccounts({ page: 1, limit: 10000, status: "active" });
      accounts = allAccounts.items || [];
    } else {
      accounts = await getVirtualAccountsByUser(userId);
    }

    let totalFound = 0;
    let totalCredited = 0;
    const userResults: Array<{ userId: string; accountNumber: string; found: number; credited: number }> = [];

    for (const va of accounts) {
      const paymentProvider = getPaymentProvider(va.provider);
      if (!paymentProvider || !paymentProvider.checkVirtualAccountTransfers) {
        continue;
      }

      try {
        const recentTransfers = await paymentProvider.checkVirtualAccountTransfers(
          va.accountNumber,
          sinceHours
        );

        let creditedCount = 0;
        for (const transfer of recentTransfers) {
          const reference = transfer.reference;
          const description = `Wallet funding via ${va.provider} virtual account ${va.accountNumber} (manual reconciliation)`;

          try {
            await creditWallet(va.userId, transfer.amount, "wallet_funding", description, reference);
            await updateVirtualAccountLastTransfer(va.id);
            creditedCount++;
          } catch (err) {
            if (!isUniqueViolation(err)) {
              console.error("Error crediting wallet for transfer:", transfer.reference, err);
            }
          }
        }

        totalFound += recentTransfers.length;
        totalCredited += creditedCount;
        userResults.push({
          userId: va.userId,
          accountNumber: va.accountNumber,
          found: recentTransfers.length,
          credited: creditedCount,
        });
      } catch (err) {
        console.error(`Error reconciling account ${va.accountNumber}:`, err);
      }
    }

    res.json({
      success: true,
      data: {
        accountsProcessed: accounts.length,
        totalTransfersFound: totalFound,
        totalTransfersCredited: totalCredited,
        results: userResults,
      },
    });
  } catch (err) {
    console.error("Virtual account reconciliation error:", err);
    const message = err instanceof Error ? err.message : "Failed to reconcile payments";
    res.status(500).json({ error: message });
  }
});

export { router as virtualAccountsRouter };
