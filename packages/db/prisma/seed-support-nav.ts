import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SUPPORT_NAV_ITEMS = [
  {
    label: "Support Tickets",
    href: "/support",
    icon: "M18.364 5.636a9 9 0 11-12.728 0M12 3v9m0 0l3-3m-3 3l-3-3",
    section: "Member Portal",
    sortOrder: 19,
  },
  {
    label: "Ticket Inbox",
    href: "/admin/support",
    icon: "M18.364 5.636a9 9 0 11-12.728 0M12 3v9m0 0l3-3m-3 3l-3-3",
    section: "Support",
    sortOrder: 19,
    badge: "Support",
  },
  {
    label: "Ticket Categories",
    href: "/admin/support/categories",
    icon: "M7 7h.01M7 11h.01M7 15h.01M11 7h6M11 11h6M11 15h6",
    section: "Support",
    sortOrder: 20,
  },
];

async function main() {
  const createdItems: Record<string, string> = {};

  for (const item of SUPPORT_NAV_ITEMS) {
    const existing = await prisma.navigationItem.findUnique({ where: { href: item.href } });
    if (existing) {
      createdItems[item.href] = existing.id;
      console.log(`Support nav item already exists: ${item.label}`);
      continue;
    }
    const created = await prisma.navigationItem.create({ data: item });
    createdItems[item.href] = created.id;
    console.log(`Created support nav item: ${item.label}`);
  }

  const ROLE_ASSIGNMENTS: Record<string, string[]> = {
    member: ["/support"],
    support: ["/admin/support", "/admin/support/categories"],
    admin: ["/admin/support", "/admin/support/categories"],
    superadmin: ["/admin/support", "/admin/support/categories"],
    finance: ["/admin/support"],
    moderator: ["/admin/support"],
  };

  for (const [role, hrefs] of Object.entries(ROLE_ASSIGNMENTS)) {
    for (let i = 0; i < hrefs.length; i++) {
      const href = hrefs[i];
      const navItemId = createdItems[href];
      if (!navItemId) continue;

      const existing = await prisma.roleNavigation.findUnique({
        where: { role_navigationItemId: { role, navigationItemId: navItemId } },
      });
      if (existing) continue;

      await prisma.roleNavigation.create({
        data: { role, navigationItemId: navItemId, sortOrder: 100 + i },
      });
    }
    console.log(`Assigned support nav items to role: ${role}`);
  }

  console.log("Support navigation seed complete!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
