import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.roleNavigation.count();
  if (existing > 0) {
    console.log(`Found ${existing} existing role-navigation assignments, skipping seed.`);
    return;
  }

  const roleAssignments: Record<string, string[]> = {
    member: [
      "/",
      "/transactions",
      "/donate",
      "/groups",
      "/chat",
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
    ],
    admin: [
      "/",
      "/transactions",
      "/donate",
      "/groups",
      "/chat",
      "/marketplace",
      "/jobs",
      "/donations",
      "/my-clearance",
      "/referrals",
      "/kyc",
      "/loans",
      "/circles",
      "/whatsapp-groups",
      "/default-management",
      "/clearance-management",
      "/kyc/admin",
      "/profile",
      "/settings",
    ],
  };

  for (const [role, hrefs] of Object.entries(roleAssignments)) {
    for (let i = 0; i < hrefs.length; i++) {
      const href = hrefs[i];
      const navItem = await prisma.navigationItem.findUnique({ where: { href } });
      if (!navItem) {
        console.log(`Navigation item not found for href: ${href}`);
        continue;
      }

      await prisma.roleNavigation.create({
        data: {
          role,
          navigationItemId: navItem.id,
          sortOrder: i,
        },
      });
      console.log(`Assigned ${navItem.label} to role: ${role}`);
    }
  }

  console.log("Role navigation seed complete!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
