import { getAllVirtualAccounts, creditWallet, updateVirtualAccountLastTransfer, processPaymentReversal } from "@thrift/db";
import { getPaymentProvider } from "../services/payments";

/**
 * Reconciliation safety net for virtual-account deposits. Flutterwave webhooks
 * are best-effort, so this job re-checks recent transactions on every active
 * virtual account and credits any that were missed. Also handles any reversed
 * transactions detected during the check.
 */
export async function virtualAccountDepositReconciliation() {
  console.log("[VA Deposit Reconciliation] Starting...");
  const sinceHours = 24;

  const allAccounts = await getAllVirtualAccounts({ page: 1, limit: 10000, status: "active" });
  const accounts = allAccounts.items || [];

  let totalFound = 0;
  let totalCredited = 0;
  let totalReversed = 0;
  const results: Array<{ userId: string; accountNumber: string; provider: string; found: number; credited: number; reversed: number }> = [];

  for (const va of accounts) {
    const paymentProvider = getPaymentProvider(va.provider);
    if (!paymentProvider?.checkVirtualAccountTransfers) continue;

    try {
      const recentTransfers = await paymentProvider.checkVirtualAccountTransfers(va.accountNumber, sinceHours);
      let creditedCount = 0;
      let reversedCount = 0;
      for (const transfer of recentTransfers) {
        const reference = transfer.reference;

        if (transfer.status === "reversed") {
          try {
            const result = await processPaymentReversal(
              reference,
              `Reversal detected during VA deposit reconciliation for ${va.accountNumber}`,
            );
            if (result.walletReversed || result.reversedAccounts > 0) {
              reversedCount++;
            }
          } catch (err) {
            console.error(`[VA Deposit Reconciliation] Reversal error for ${reference}:`, err);
          }
          continue;
        }

        if (transfer.status !== "completed") continue;

        try {
          await creditWallet(va.userId, transfer.amount, "wallet_funding", `Wallet funding via ${va.provider} VA ${va.accountNumber} (reconciliation)`, reference);
          await updateVirtualAccountLastTransfer(va.id);
          creditedCount++;
        } catch (err) {
          const isDuplicate = typeof err === "object" && err !== null && "code" in err && (err as { code?: string }).code === "P2002";
          if (!isDuplicate) console.error(`[VA Deposit Reconciliation] Credit error for ${va.accountNumber}:`, err);
        }
      }
      totalFound += recentTransfers.length;
      totalCredited += creditedCount;
      totalReversed += reversedCount;
      results.push({ userId: va.userId, accountNumber: va.accountNumber, provider: va.provider, found: recentTransfers.length, credited: creditedCount, reversed: reversedCount });
    } catch (err) {
      console.error(`[VA Deposit Reconciliation] Error for ${va.accountNumber}:`, err);
    }
  }

  console.log(`[VA Deposit Reconciliation] Done. Accounts: ${accounts.length}, Found: ${totalFound}, Credited: ${totalCredited}, Reversed: ${totalReversed}`);
  return { accountsProcessed: accounts.length, totalTransfersFound: totalFound, totalTransfersCredited: totalCredited, totalTransfersReversed: totalReversed, results };
}
