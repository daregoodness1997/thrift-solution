import { prisma } from "../src/services/prisma";
import bcrypt from "bcryptjs";

function generateAccountNumber(): string {
  return "GFW" + String(Math.floor(1000000000 + Math.random() * 9000000000));
}

function generateReferralCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

async function seedAdminUsers() {
  console.log("Seeding admin users...");

  const admins = [
    { name: "Super Admin", email: "admin@gfw.com", password: "Admin@123456", role: "superadmin", accountTier: "premium" },
    { name: "Admin User", email: "manager@gfw.com", password: "Admin@123456", role: "admin", accountTier: "premium" },
    { name: "Support Agent", email: "support@gfw.com", password: "Support@123456", role: "support", accountTier: "basic" },
    { name: "Finance Officer", email: "finance@gfw.com", password: "Finance@123456", role: "finance", accountTier: "basic" },
    { name: "Moderator", email: "moderator@gfw.com", password: "Moderator@123456", role: "moderator", accountTier: "basic" },
    { name: "Demo Member", email: "member@gfw.com", password: "Member@123456", role: "member", accountTier: "basic" },
  ];

  for (const a of admins) {
    const existing = await prisma.user.findUnique({ where: { email: a.email } });
    if (existing) {
      const passwordHash = await bcrypt.hash(a.password, 10);
      await prisma.user.update({ where: { id: existing.id }, data: { passwordHash } });
      console.log(`  Reset password for: ${a.email} (${a.role})`);
      continue;
    }

    const passwordHash = await bcrypt.hash(a.password, 10);
    const accountNumber = generateAccountNumber();
    const referralCode = generateReferralCode();

    await prisma.user.create({
      data: {
        name: a.name,
        email: a.email,
        passwordHash,
        role: a.role,
        accountNumber,
        accountTier: a.accountTier,
        referralCode,
        emailVerified: true,
        phoneVerified: false,
      },
    });

    console.log(`  Created: ${a.name} (${a.email}) - ${a.role}`);
  }

  console.log("Admin users seeding complete!");
}

seedAdminUsers()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
