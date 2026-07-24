/**
 * Repair script for the reconciliation bug where VAs were credited with
 * transactions that didn't belong to them (because client-side filtering was
 * missing in checkVirtualAccountTransfers).
 *
 * What this does for each Flutterwave transaction:
 *   1. Looks up the VA that actually received the payment (by account_number)
 *   2. Finds any credit with ref `va_flw_<id>` going to a different user
 *   3. Reverses that incorrect credit
 *   4. Credits the correct VA owner (if not already done)
 *
 * Usage:
 *   pnpm tsx src/scripts/repair-miscredited-va-transfers.ts --hours 48
 *   pnpm tsx src/scripts/repair-miscredited-va-transfers.ts --hours 48 --dry-run
 */
import {
  prisma,
  creditWallet,
  processPaymentReversal,
  getVirtualAccountByAccountNumber,
} from "@thrift/db";

const FLW_SECRET = process.env.FLUTTERWAVE_SECRET_KEY || "";
const FLW_BASE = "https://api.flutterwave.com/v3";

interface FlwTx {
  id: number;
  amount: number;
  account_number: string | null;
  tx_ref: string | null;
  status: string;
  created_at: string;
  meta?: { account_number?: string };
  narration?: string;
}

async function fetchFlutterwaveTransactions(
  sinceHours: number,
): Promise<FlwTx[]> {
  const fromDate = new Date(Date.now() - sinceHours * 60 * 60 * 1000);
  const fromStr = fromDate.toISOString().split("T")[0];

  const response = await fetch(`${FLW_BASE}/transactions?from=${fromStr}`, {
    headers: { Authorization: `Bearer ${FLW_SECRET}` },
  });
  const data: any = await response.json();
  if (data.status !== "success") {
    throw new Error(data.message || "Flutterwave API error");
  }
  return data.data || [];
}

function extractAccountNumber(tx: FlwTx): string | null {
  return tx.account_number || tx.meta?.account_number || null;
}

async function main() {
  const args = process.argv.slice(2);
  const hoursIdx = args.indexOf("--hours");
  const sinceHours = hoursIdx !== -1 ? Number(args[hoursIdx + 1]) : 48;
  const dryRun = args.includes("--dry-run");

  console.log(`[Repair] Starting (dryRun=${dryRun}, sinceHours=${sinceHours})`);

  const transactions = await fetchFlutterwaveTransactions(sinceHours);
  console.log(
    `[Repair] Fetched ${transactions.length} transactions from Flutterwave`,
  );

  let fixed = 0;
  let skipped = 0;
  let errors = 0;

  for (const tx of transactions) {
    const ref = `va_flw_${tx.id}`;
    const accountNumber = extractAccountNumber(tx);

    if (!accountNumber) {
      console.log(`  Skipping tx ${tx.id}: no account_number in response`);
      skipped++;
      continue;
    }

    if (tx.status !== "successful") {
      skipped++;
      continue;
    }

    // Find the VA that actually owns this account number
    const va = await getVirtualAccountByAccountNumber(accountNumber);
    if (!va) {
      console.log(
        `  Skipping tx ${tx.id}: no VA found for account ${accountNumber}`,
      );
      skipped++;
      continue;
    }

    // Find any existing credit for this transaction
    const existingCredit = await prisma.transaction.findUnique({
      where: { reference: ref },
    });

    if (!existingCredit) {
      // No credit exists at all — credit the correct user
      console.log(
        `  tx ${tx.id}: missing credit for user ${va.userId} (VA ${accountNumber})`,
      );
      if (!dryRun) {
        try {
          await creditWallet(
            va.userId,
            tx.amount,
            "wallet_funding",
            `Wallet funding via flutterwave VA ${accountNumber} (repair)`,
            ref,
          );
          console.log(`    → Credited ${tx.amount} to ${va.userId}`);
          fixed++;
        } catch (err: any) {
          if (err?.code === "P2002") {
            console.log(`    → Already exists (race condition). Skipping.`);
          } else {
            console.error(`    → Error crediting:`, err);
            errors++;
          }
        }
      } else {
        console.log(`    → Would credit ${tx.amount} to ${va.userId}`);
        fixed++;
      }
      continue;
    }

    // Credit exists — check if it went to the right user
    if (existingCredit.userId === va.userId) {
      // Correctly credited — nothing to do
      skipped++;
      continue;
    }

    // WRONG user got the credit — reverse it and credit the right user
    console.log(
      `  tx ${tx.id}: MISCREDITED — went to user ${existingCredit.userId}, should go to ${va.userId} (VA ${accountNumber})`,
    );

    if (!dryRun) {
      try {
        // Reverse the incorrect credit
        await processPaymentReversal(
          ref,
          `Repair: incorrectly credited to ${existingCredit.userId}, should be ${va.userId}`,
        );

        // Credit the correct user
        await creditWallet(
          va.userId,
          tx.amount,
          "wallet_funding",
          `Wallet funding via flutterwave VA ${accountNumber} (repair)`,
          ref,
        );

        console.log(
          `    → Reversed from ${existingCredit.userId}, credited to ${va.userId}`,
        );
        fixed++;
      } catch (err) {
        console.error(`    → Error repairing:`, err);
        errors++;
      }
    } else {
      console.log(
        `    → Would reverse from ${existingCredit.userId}, credit to ${va.userId}`,
      );
      fixed++;
    }
  }

  console.log(
    `\n[Repair] Done. Fixed: ${fixed}, Skipped: ${skipped}, Errors: ${errors}`,
  );
}

main().catch((err) => {
  console.error("[Repair] Fatal error:", err);
  process.exit(1);
});
