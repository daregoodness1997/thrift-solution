import { getUsersWithoutVirtualAccounts, createVirtualAccount, hasVirtualAccountForProvider } from "@thrift/db";
import { getPaymentProvider } from "../services/payments";
import { randomBytes } from "crypto";

const DEFAULT_PROVIDER = process.env.DEFAULT_VIRTUAL_ACCOUNT_PROVIDER || "flutterwave";

function generateReference(prefix: string): string {
  return `${prefix}_${Date.now()}_${randomBytes(8).toString("hex")}`;
}

export async function virtualAccountGenerationJob() {
  console.log("[Virtual Account Job] Starting daily virtual account generation...");
  const startTime = Date.now();
  let processed = 0;
  let created = 0;
  let skipped = 0;
  let errors = 0;

  try {
    const users = await getUsersWithoutVirtualAccounts();
    console.log(`[Virtual Account Job] Found ${users.length} users without virtual accounts`);

    const provider = getPaymentProvider(DEFAULT_PROVIDER);
    if (!provider?.createVirtualAccount) {
      console.error(`[Virtual Account Job] Provider ${DEFAULT_PROVIDER} does not support virtual account creation`);
      return { processed: 0, created: 0, skipped: 0, errors: 0, total: 0 };
    }

    for (const user of users) {
      processed++;
      try {
        const hasAccount = await hasVirtualAccountForProvider(user.id, DEFAULT_PROVIDER);
        if (hasAccount) {
          skipped++;
          continue;
        }

        if (!user.bvn) {
          console.log(`[Virtual Account Job] Skipping user ${user.id} - no BVN on file`);
          skipped++;
          continue;
        }

        const reference = generateReference("va_auto");

        const result = await provider.createVirtualAccount({
          email: user.email,
          firstName: user.name?.split(" ")[0] || "",
          lastName: user.name?.split(" ").slice(1).join(" ") || "",
          bvn: user.bvn,
          reference,
          narration: "Thrift Solution Virtual Account",
        });

        await createVirtualAccount({
          userId: user.id,
          provider: DEFAULT_PROVIDER,
          accountNumber: result.accountNumber,
          bankName: result.bankName,
          bankCode: result.bankCode,
          reference: result.reference,
          providerRef: result.providerRef,
          isPermanent: true,
          bvn: user.bvn,
        });

        created++;
        console.log(`[Virtual Account Job] Created account for user ${user.id}: ${result.accountNumber} (${result.bankName})`);

        // Rate limit: 500ms between API calls
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (err) {
        errors++;
        console.error(`[Virtual Account Job] Error creating account for user ${user.id}:`, err);
      }
    }

    const elapsed = Date.now() - startTime;
    console.log(
      `[Virtual Account Job] Completed in ${elapsed}ms. Processed: ${processed}, Created: ${created}, Skipped: ${skipped}, Errors: ${errors}`
    );

    return { processed, created, skipped, errors, total: users.length };
  } catch (err) {
    console.error("[Virtual Account Job] Fatal error:", err);
    throw err;
  }
}
