import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { encryptField } from "../src/encryption";

const prisma = new PrismaClient();

const PREFIX = "enc:";

function isEncrypted(value: string | null | undefined): boolean {
  return !!value && value.startsWith(PREFIX);
}

async function main() {
  if (!process.env.ENCRYPTION_KEY) {
    throw new Error("ENCRYPTION_KEY is not set in packages/db/.env");
  }

  console.log("Encrypting PII (BVN/NIN) at rest...");

  // ── users.bvn / users.nin ────────────────────────────────────────────
  const users = await prisma.user.findMany({
    select: { id: true, bvn: true, nin: true },
  });
  const usersWithPii = users.filter((u) => u.bvn || u.nin);
  let userUpdates = 0;
  for (const u of usersWithPii) {
    const bvn = isEncrypted(u.bvn) ? undefined : encryptField(u.bvn);
    const nin = isEncrypted(u.nin) ? undefined : encryptField(u.nin);
    if (!bvn && !nin) continue;
    await prisma.user.update({ where: { id: u.id }, data: { ...(bvn ? { bvn } : {}), ...(nin ? { nin } : {}) } });
    userUpdates++;
  }
  console.log(`users: ${userUpdates}/${usersWithPii.length} updated`);

  // ── kyc.bvn / kyc.nin / kyc.id_number ─────────────────────────────────
  const kycs = await prisma.kyc.findMany({
    select: { id: true, bvn: true, nin: true, idNumber: true, verificationData: true, creditReport: true },
  });
  const kycsWithPii = kycs.filter((k) => k.bvn || k.nin || k.idNumber);
  let kycUpdates = 0;
  for (const k of kycsWithPii) {
    const data: Record<string, unknown> = {};
    if (!isEncrypted(k.bvn)) data.bvn = encryptField(k.bvn);
    if (!isEncrypted(k.nin)) data.nin = encryptField(k.nin);
    if (!isEncrypted(k.idNumber)) data.idNumber = encryptField(k.idNumber);

    if (k.verificationData && typeof k.verificationData === "object") {
      const vd = k.verificationData as Record<string, any>;
      const bvn = vd.bvn;
      const nin = vd.nin;
      if (bvn && typeof bvn === "object" && !isEncrypted(bvn.bvn)) {
        data.verificationData = { ...vd, bvn: { ...bvn, bvn: encryptField(bvn.bvn) } };
      }
      if (nin && typeof nin === "object" && !isEncrypted(nin.nin)) {
        data.verificationData = { ...(data.verificationData ?? vd), nin: { ...nin, nin: encryptField(nin.nin) } };
      }
    }

    if (k.creditReport && typeof k.creditReport === "object") {
      const cr = k.creditReport as Record<string, any>;
      if (typeof cr.bvn === "string" && !isEncrypted(cr.bvn)) {
        data.creditReport = { ...cr, bvn: encryptField(cr.bvn) };
      }
      if (cr.raw && typeof cr.raw === "object" && typeof cr.raw.bvn === "string" && !isEncrypted(cr.raw.bvn)) {
        data.creditReport = { ...(data.creditReport ?? cr), raw: { ...cr.raw, bvn: encryptField(cr.raw.bvn) } };
      }
    }

    if (Object.keys(data).length === 0) continue;
    await prisma.kyc.update({ where: { id: k.id }, data });
    kycUpdates++;
  }
  console.log(`kyc: ${kycUpdates}/${kycs.length} updated`);

  // ── virtual_accounts.bvn / virtual_accounts.nin ───────────────────────
  const vas = await prisma.virtualAccount.findMany({
    select: { id: true, bvn: true, nin: true },
  });
  const vasWithPii = vas.filter((v) => v.bvn || v.nin);
  let vaUpdates = 0;
  for (const v of vasWithPii) {
    const bvn = isEncrypted(v.bvn) ? undefined : encryptField(v.bvn);
    const nin = isEncrypted(v.nin) ? undefined : encryptField(v.nin);
    if (!bvn && !nin) continue;
    await prisma.virtualAccount.update({ where: { id: v.id }, data: { ...(bvn ? { bvn } : {}), ...(nin ? { nin } : {}) } });
    vaUpdates++;
  }
  console.log(`virtual_accounts: ${vaUpdates}/${vasWithPii.length} updated`);

  console.log("Done.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
