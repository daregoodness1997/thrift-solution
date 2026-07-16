import crypto from "crypto";
import type { Request, Response, Router } from "express";
import {
  findDonationByReference,
  updateDonationStatus,
  findTransactionByReference,
  updateTransactionStatus,
  getVirtualAccountByAccountNumber,
  creditWallet,
  updateVirtualAccountLastTransfer,
} from "@thrift/db";

// --- Signature verification -------------------------------------------------
//
// Flutterwave supports two webhook authentication schemes depending on how the
// dashboard is configured:
//
//   1. "Webhook Secret Hash" (recommended): the secret you paste into the
//      dashboard's webhook settings is sent back verbatim in the
//      `verif-hash` request header. We compare it directly.
//
//   2. HMAC-SHA256 body signature: the raw request body is signed with your
//      Flutterwave SECRET KEY (not the webhook hash). Some integrations send
//      this in a custom header (commonly `x-flutterwave-signature`).
//
// We accept both so the handler works regardless of dashboard configuration.

const SECRET_KEY = () => process.env.FLUTTERWAVE_SECRET_KEY || "";
const WEBHOOK_SECRET = () => process.env.FLUTTERWAVE_WEBHOOK_SECRET || SECRET_KEY();

export function verifyFlutterwaveSignature(rawBody: Buffer | undefined, headerValue: unknown): boolean {
  if (typeof headerValue !== "string" || headerValue.length === 0) return false;

  const webhookSecret = WEBHOOK_SECRET();
  if (webhookSecret && headerValue === webhookSecret) return true;

  if (rawBody && rawBody.length > 0) {
    const secretKey = SECRET_KEY();
    if (secretKey) {
      const expected = crypto.createHmac("sha256", secretKey).update(rawBody).digest("hex");
      const a = Buffer.from(expected);
      const b = Buffer.from(headerValue);
      if (a.length === b.length && crypto.timingSafeEqual(a, b)) return true;
    }
  }

  return false;
}

function getRawBody(req: Request): Buffer | undefined {
  return (req as unknown as { rawBody?: Buffer }).rawBody;
}

// --- Event handling ---------------------------------------------------------

/**
 * Handle a `charge.completed` event. Covers both card/web checkout payments
 * (donations and generic wallet funding) and virtual-account deposits, which
 * Flutterwave also reports via this event.
 */
async function handleChargeCompleted(data: Record<string, any>): Promise<void> {
  if (data.status !== "successful") return;

  const reference = data.tx_ref as string | undefined;
  if (reference) {
    const donation = await findDonationByReference(reference);
    if (donation) {
      await updateDonationStatus(donation.id, "completed");
    }

    const transaction = await findTransactionByReference(reference);
    if (transaction) {
      await updateTransactionStatus(transaction.id, "completed");
    }
  }

  // Virtual account deposits arrive with an `account` object.
  const accountNumber =
    data.account?.account_number || data.account_number || data.meta?.account_number;
  if (accountNumber) {
    const virtualAccount = await getVirtualAccountByAccountNumber(accountNumber);
    if (virtualAccount) {
      const amount = Number(data.amount);
      const txRef = `va_flw_${data.id}`;
      const description = `Wallet funding via Flutterwave virtual account ${accountNumber}`;
      await creditWallet(virtualAccount.userId, amount, "wallet_funding", description, txRef);
      await updateVirtualAccountLastTransfer(virtualAccount.id);
    }
  }
}

/** Handle a `transfer` lifecycle event (payout settlements to bank accounts). */
async function handleTransfer(data: Record<string, any>): Promise<void> {
  const reference = data.reference as string | undefined;
  if (!reference) return;

  const success = ["SUCCESSFUL", "successful", "completed"].includes(data.status);
  const failed = ["FAILED", "failed", "rejected"].includes(data.status);

  const transaction = await findTransactionByReference(reference);
  if (transaction) {
    if (success) await updateTransactionStatus(transaction.id, "completed");
    if (failed) await updateTransactionStatus(transaction.id, "failed");
  }
}

type FlutterwaveEvent = {
  event?: string;
  data?: Record<string, any>;
};

/**
 * Core webhook handler. Returns true when the request was processed (or safely
 * ignored as a non-relevant event), false when signature verification failed.
 */
export async function processFlutterwaveWebhook(req: Request): Promise<boolean> {
  const signature =
    req.headers["verif-hash"] ?? req.headers["x-flutterwave-signature"] ?? req.headers["authorization"];

  if (!verifyFlutterwaveSignature(getRawBody(req), signature)) {
    return false;
  }

  const payload = req.body as FlutterwaveEvent;
  const event = payload.event;
  const data = payload.data || (req.body as Record<string, any>);

  switch (event) {
    case "charge.completed":
      await handleChargeCompleted(data);
      break;
    case "transfer":
    case "transfer.completed":
      await handleTransfer(data);
      break;
    default:
      // Unknown or non-actionable event; acknowledge silently.
      break;
  }

  return true;
}

// --- Express router ---------------------------------------------------------

export function registerFlutterwaveWebhook(router: Router, path = "/webhook/flutterwave"): void {
  router.post(path, async (req: Request, res: Response) => {
    // Always acknowledge quickly so Flutterwave does not retry.
    res.status(200).json({ received: true });

    try {
      const ok = await processFlutterwaveWebhook(req);
      if (!ok) {
        console.error("Flutterwave webhook: signature verification failed");
      }
    } catch (err) {
      console.error("Flutterwave webhook processing error:", err);
    }
  });
}
