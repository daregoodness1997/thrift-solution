import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "admin@globalfreedom.com";
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    if (existing.role !== "admin") {
      await prisma.user.update({ where: { id: existing.id }, data: { role: "admin" } });
      console.log(`Updated ${email} to admin role`);
    } else {
      console.log(`Admin already exists: ${email}`);
    }
    return;
  }

  const hash = await bcrypt.hash("admin123", 10);

  let code = "ADMIN-0001";
  let attempts = 0;
  while (attempts < 10) {
    const dup = await prisma.user.findUnique({ where: { referralCode: code } });
    if (!dup) break;
    code = `ADMIN-${String(++attempts).padStart(4, "0")}`;
  }

  const lastUser = await prisma.user.findFirst({
    orderBy: { createdAt: "desc" },
    select: { accountNumber: true },
  });
  let nextNumber = 1;
  if (lastUser?.accountNumber) {
    const match = lastUser.accountNumber.match(/(\d+)$/);
    if (match) nextNumber = parseInt(match[1], 10) + 1;
  }
  const accountNumber = `THR-${String(nextNumber).padStart(6, "0")}`;

  const user = await prisma.user.create({
    data: {
      email,
      name: "Admin User",
      passwordHash: hash,
      role: "admin",
      accountNumber,
      referralCode: code,
    },
  });

  console.log("Admin created:");
  console.log("  Email:    ", user.email);
  console.log("  Password: admin123");
  console.log("  Role:     ", user.role);
  console.log("  Account:  ", user.accountNumber);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
