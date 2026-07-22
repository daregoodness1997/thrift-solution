import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const CUSTOMER_NAV = [
  "/",
  "/transactions",
  "/donate",
  "/my-circles",
  "/marketplace",
  "/jobs",
  "/donations",
  "/my-clearance",
  "/referrals",
  "/kyc",
  "/loans",
  "/circles",
  "/whatsapp-groups",
  "/profile",
  "/settings",
];

const ADMIN_NAV = [
  "/admin",
  "/admin/users",
  "/admin/loans",
  "/admin/audit-logs",
  "/admin/config",
  "/admin/insights",
  "/admin/prayers",
  "/admin/transactions",
  "/admin/referrals",
  "/admin/virtual-accounts",
  "/admin/marketplace",
  "/admin/jobs",
  "/admin/donations",
  "/circle-management",
  "/default-management",
  "/clearance-management",
  "/kyc/admin",
  "/admin/impact-spotlight",
  "/admin/support",
  "/admin/support/categories",
  "/profile",
  "/settings",
];

const SUPPORT_NAV = [
  "/admin/users",
  "/admin/transactions",
  "/admin/referrals",
  "/admin/audit-logs",
  "/kyc/admin",
  "/circle-management",
  "/clearance-management",
  "/admin/support",
  "/admin/support/categories",
  "/profile",
  "/settings",
];

const FINANCE_NAV = [
  "/admin/transactions",
  "/admin/virtual-accounts",
  "/admin/loans",
  "/admin/referrals",
  "/admin/donations",
  "/profile",
  "/settings",
];

const MODERATOR_NAV = [
  "/admin/marketplace",
  "/admin/jobs",
  "/admin/donations",
  "/admin/users",
  "/profile",
  "/settings",
];

const ROLE_ASSIGNMENTS: Record<string, string[]> = {
  member: CUSTOMER_NAV,
  support: SUPPORT_NAV,
  finance: FINANCE_NAV,
  moderator: MODERATOR_NAV,
  admin: ADMIN_NAV,
  superadmin: ADMIN_NAV,
};

async function main() {
  for (const [role, hrefs] of Object.entries(ROLE_ASSIGNMENTS)) {
    await prisma.roleNavigation.deleteMany({ where: { role } });

    for (let i = 0; i < hrefs.length; i++) {
      const href = hrefs[i];
      const navItem = await prisma.navigationItem.findUnique({ where: { href } });
      if (!navItem) {
        console.log(`Skipping ${href} for role ${role}: navigation item not found`);
        continue;
      }
      await prisma.roleNavigation.create({
        data: { role, navigationItemId: navItem.id, sortOrder: i },
      });
    }
    console.log(`Assigned ${hrefs.length} nav items to role: ${role}`);
  }

  console.log("Role navigation seed complete!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
