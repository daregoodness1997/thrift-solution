import { getAllVirtualAccounts, creditWallet, updateVirtualAccountLastTransfer } from "@thrift/db";
import { getPaymentProvider } from "../services/payments";

/**
 * Reconciliation safety net for virtual-account deposits. Flutterwave webhooks
 * are best-effort, so this job re-checks recent transactions on every active
 * virtual account and credits any that were missed.
 */
export async function virtualAccountDepositReconciliation() {
  console.log("[VA Deposit Reconciliation] Starting...");
  const sinceHours = 24;

  const allAccounts = await getAllVirtualAccounts({ page: 1, limit: 10000, status: "active" });
  const accounts = allAccounts.items || [];

  let totalFound = 0;
  let totalCredited = 0;
  const results: Array<{ userId: string; accountNumber: string; provider: string; found: number; credited: number }> = [];

  for (const va of accounts) {
    const paymentProvider = getPaymentProvider(va.provider);
    if (!paymentProvider?.checkVirtualAccountTransfers) continue;

    try {
      const recentTransfers = await paymentProvider.checkVirtualAccountTransfers(va.accountNumber, sinceHours);
      let creditedCount = 0;
      for (const transfer of recentTransfers) {
        try {
          await creditWallet(va.userId, transfer.amount, "wallet_funding", `Wallet funding via ${va.provider} VA ${va.accountNumber} (reconciliation)`, transfer.reference);
          await updateVirtualAccountLastTransfer(va.id);
          creditedCount++;
        } catch (err) {
          const isDuplicate = typeof err === "object" && err !== null && "code" in err && (err as { code?: string }).code === "P2002";
          if (!isDuplicate) console.error(`[VA Deposit Reconciliation] Credit error for ${va.accountNumber}:`, err);
        }
      }
      totalFound += recentTransfers.length;
      totalCredited += creditedCount;
      results.push({ userId: va.userId, accountNumber: va.accountNumber, provider: va.provider, found: recentTransfers.length, credited: creditedCount });
    } catch (err) {
      console.error(`[VA Deposit Reconciliation] Error for ${va.accountNumber}:`, err);
    }
  }

  console.log(`[VA Deposit Reconciliation] Done. Accounts processed: ${accounts.length}, Transfers found: ${totalFound}, Credited: ${totalCredited}`);
  return { accountsProcessed: accounts.length, totalTransfersFound: totalFound, totalTransfersCredited: totalCredited, results };
}
