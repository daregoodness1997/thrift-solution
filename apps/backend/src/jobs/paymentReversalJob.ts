import { prisma, findFundingTransactionByReference, processPaymentReversal } from "@thrift/db";
import { getPaymentProvider } from "../services/payments";

const REVERSAL_WINDOW_HOURS = Number(process.env.REVERSAL_RECON_WINDOW_HOURS || 72);

/**
 * Reconciliation safety net for payment reversals. Webhooks are best-effort,
 * so this job re-checks recent completed wallet-funding transactions against
 * the payment provider and reverses them if the provider now reports a
 * reversed/refunded state.
 *
 * This only covers funding that maps to a provider-verifiable reference
 * (card/web checkout via `verify_by_reference`). Virtual-account deposit
 * reversals are handled by the webhook; this job complements it.
 */
export async function paymentReversalReconciliationJob() {
  console.log("[Reversal Reconciliation] Starting...");
  const since = new Date(Date.now() - REVERSAL_WINDOW_HOURS * 60 * 60 * 1000);

  const candidates = await prisma.transaction.findMany({
    where: {
      type: { in: ["wallet_funding", "funding"] },
      status: "completed",
      createdAt: { gte: since },
    },
    select: { id: true, reference: true, userId: true, amount: true, createdAt: true },
  });

  console.log(`[Reversal Reconciliation] Checking ${candidates.length} funding transactions`);

  let reversed = 0;
  let errors = 0;

  for (const txn of candidates) {
    // Skip refs that aren't real Flutterwave transactions.
    // Virtual-account deposits use "va_flw_" prefix and aren't verifiable by tx_ref here.
    // Seed/test transactions ("SEED-") were created locally and have no Flutterwave record.
    if (txn.reference.startsWith("va_flw_") || txn.reference.startsWith("SEED-")) continue;

    try {
      const provider = getPaymentProvider("flutterwave");
      if (!provider?.verifyPayment) continue;

      const verification = await provider.verifyPayment(txn.reference);
      const reversedStatus =
        verification.status === "failed" ||
        ["reversed", "refunded", "chargeback"].includes(verification.status);

      if (reversedStatus) {
        await processPaymentReversal(txn.reference, `reconciliation: provider reports ${verification.status}`);
        reversed++;
        console.warn(`[Reversal Reconciliation] Reversed ${txn.reference} (${verification.status})`);
      }
    } catch (err) {
      errors++;
      console.error(`[Reversal Reconciliation] Error verifying ${txn.reference}:`, err);
    }
  }

  console.log(`[Reversal Reconciliation] Done. Reversed: ${reversed}, Errors: ${errors}`);
  return { checked: candidates.length, reversed, errors };
}
