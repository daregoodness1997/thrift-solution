import { Router, Request, Response } from "express";
import { getPaymentProvider, resolveVirtualAccount } from "../services/payments/index";
import { authMiddleware } from "../middleware/auth";
import { randomBytes } from "crypto";
import {
  createVirtualAccount,
  getVirtualAccountsByUser,
  getVirtualAccountByAccountNumber,
  creditWallet,
  getKycByUserId,
} from "@thrift/db";

const router = Router();

function generateReference(prefix: string): string {
  return `${prefix}_${Date.now()}_${randomBytes(8).toString("hex")}`;
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
    const userId = (req as any).userId;

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
    if (!kyc || !["approved", "verified"].includes(kyc.status) || !kyc.idNumber) {
      res.status(403).json({
        error: "KYC verification with a valid BVN is required before a virtual account can be created. Please complete KYC first.",
        code: "KYC_REQUIRED",
      });
      return;
    }

    const bvn = kyc.idNumber;
    const reference = generateReference("va");

    const result = await paymentProvider.createVirtualAccount({
      email,
      firstName,
      lastName,
      phone,
      bvn,
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
    const userId = (req as any).userId;
    const accounts = await getVirtualAccountsByUser(userId);

    res.json({
      virtualAccounts: accounts.map((va) => ({
        id: va.id,
        accountNumber: va.accountNumber,
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

router.post("/webhook/flutterwave", async (req: Request, res: Response) => {
  res.status(200).json({ received: true });

  setImmediate(async () => {
    try {
      const event = req.body;

      if (event.event === "charge.completed" && event.data) {
        const data = event.data;
        const accountNumber = data.account?.account_number || data.meta?.account_number;

        if (accountNumber) {
          const virtualAccount = await getVirtualAccountByAccountNumber(accountNumber);
          if (virtualAccount) {
            const amount = data.amount;
            const description = `Wallet funding via Flutterwave virtual account ${accountNumber}`;

            await creditWallet(virtualAccount.userId, amount, "wallet_funding", description);
          }
        }
      }
    } catch (err) {
      console.error("Flutterwave webhook processing error:", err);
    }
  });
});

router.post("/webhook/paystack", async (req: Request, res: Response) => {
  res.status(200).json({ received: true });

  setImmediate(async () => {
    try {
      const event = req.body;

      if (event.event === "dedicated_account.assign" || event.event === "charge.success") {
        const data = event.data;
        const accountNumber = data.account_number;

        if (accountNumber) {
          const virtualAccount = await getVirtualAccountByAccountNumber(accountNumber);
          if (virtualAccount) {
            const amount = data.amount / 100;
            const description = `Wallet funding via Paystack virtual account ${accountNumber}`;

            await creditWallet(virtualAccount.userId, amount, "wallet_funding", description);
          }
        }
      }
    } catch (err) {
      console.error("Paystack webhook processing error:", err);
    }
  });
});

router.post("/webhook/nomba", async (req: Request, res: Response) => {
  res.status(200).json({ received: true });

  setImmediate(async () => {
    try {
      const event = req.body;

      if (event.event === "TRANSFER" || event.event === "payment.success") {
        const data = event.data;
        const accountNumber = data.destinationAccountNumber || data.accountNumber;

        if (accountNumber) {
          const virtualAccount = await getVirtualAccountByAccountNumber(accountNumber);
          if (virtualAccount) {
            const amount = data.amount;
            const description = `Wallet funding via Nomba virtual account ${accountNumber}`;

            await creditWallet(virtualAccount.userId, amount, "wallet_funding", description);
          }
        }
      }
    } catch (err) {
      console.error("Nomba webhook processing error:", err);
    }
  });
});

export { router as virtualAccountsRouter };
