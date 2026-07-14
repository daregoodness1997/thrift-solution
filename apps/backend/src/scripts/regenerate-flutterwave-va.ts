import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { flutterwaveProvider } from "../services/payments/flutterwave";
import { resolveVirtualAccount } from "../services/payments";

const prisma = new PrismaClient();

const DRY_RUN = process.argv.includes("--dry-run");

interface MemberRow {
  id: string;
  email: string;
  name: string;
  bvn: string | null;
  nin: string | null;
  phone: string | null;
}

async function getMembers(): Promise<MemberRow[]> {
  return prisma.$queryRaw<MemberRow[]>`
    SELECT u.id, u.email, u.name, u.phone AS phone,
           CASE WHEN k.id_type = 'bvn' THEN k.id_number END AS bvn,
           CASE WHEN k.id_type = 'nin' THEN k.id_number END AS nin
    FROM users u
    LEFT JOIN kyc k
      ON k.user_id = u.id
      AND k.status IN ('verified', 'approved')
      AND k.deleted_at IS NULL
    WHERE u.deleted_at IS NULL AND u.role = 'member'
    ORDER BY u.created_at ASC
  `;
}

async function main() {
  if (!process.env.FLUTTERWAVE_SECRET_KEY) {
    throw new Error("FLUTTERWAVE_SECRET_KEY is not set. Add your live secret key to apps/backend/.env first.");
  }
  if (!process.env.FLUTTERWAVE_SECRET_KEY.startsWith("FLWSECK-")) {
    console.warn("[WARN] FLUTTERWAVE_SECRET_KEY does not look like a LIVE key (expected prefix FLWSECK-).");
  }

  const members = await getMembers();
  console.log(`Found ${members.length} member(s).${DRY_RUN ? " (dry run)" : ""}`);

  let created = 0;
  let skipped = 0;
  const errors: { email: string; error: string }[] = [];

  for (const u of members) {
    try {
      const nameParts = (u.name || "").trim().split(/\s+/);
      const firstName = nameParts[0] || u.email.split("@")[0];
      const lastName = nameParts.slice(1).join(" ") || "User";
      const reference = `va_${u.id}_flutterwave_${Date.now()}`;

      if (DRY_RUN) {
        console.log(`[dry-run] would regenerate FLW VA for ${u.email} (bvn=${u.bvn ? "yes" : "no"})`);
        skipped++;
        continue;
      }

      const result = await flutterwaveProvider.createVirtualAccount!({
        email: u.email,
        firstName,
        lastName,
        phone: u.phone || undefined,
        bvn: u.bvn || undefined,
        nin: u.nin || undefined,
        reference,
        narration: "Thrift Solution Virtual Account",
      });
      const resolved = resolveVirtualAccount(result, u.id);

      await prisma.$transaction([
        prisma.virtualAccount.updateMany({
          where: { userId: u.id, provider: "flutterwave", deletedAt: null },
          data: { deletedAt: new Date() },
        }),
        prisma.virtualAccount.create({
          data: {
            userId: u.id,
            provider: "flutterwave",
            accountNumber: resolved.accountNumber,
            bankName: resolved.bankName,
            bankCode: resolved.bankCode,
            currency: "NGN",
            reference: result.reference,
            providerRef: result.providerRef,
            isPermanent: true,
            bvn: u.bvn || undefined,
            nin: u.nin || undefined,
            status: "active",
          },
        }),
      ]);

      console.log(`OK   ${u.email} -> ${resolved.accountNumber} (${resolved.bankName})`);
      created++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`FAIL ${u.email}: ${msg}`);
      errors.push({ email: u.email, error: msg });
      skipped++;
    }
  }

  console.log(`\nDone. created=${created} skipped=${skipped} errors=${errors.length}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
