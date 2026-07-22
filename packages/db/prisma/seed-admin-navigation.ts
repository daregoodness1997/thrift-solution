import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ADMIN_NAV = [
  {
    label: "Admin Overview",
    href: "/admin",
    icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1",
    section: "Administration",
    sortOrder: 20,
  },
  {
    label: "User Management",
    href: "/admin/users",
    icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
    section: "Administration",
    sortOrder: 21,
  },
  {
    label: "Loan Requests",
    href: "/admin/loans",
    icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    section: "Administration",
    sortOrder: 22,
  },
  {
    label: "Audit Log",
    href: "/admin/audit-logs",
    icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    section: "Administration",
    sortOrder: 23,
  },
  {
    label: "Configuration",
    href: "/admin/config",
    icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
    section: "Administration",
    sortOrder: 24,
  },
  {
    label: "Insight Management",
    href: "/admin/insights",
    icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
    section: "Administration",
    sortOrder: 25,
  },
  {
    label: "Prayer Management",
    href: "/admin/prayers",
    icon: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z",
    section: "Administration",
    sortOrder: 26,
  },
  {
    label: "Transactions",
    href: "/admin/transactions",
    icon: "M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4",
    section: "Oversight",
    sortOrder: 30,
  },
  {
    label: "Referrals",
    href: "/admin/referrals",
    icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
    section: "Oversight",
    sortOrder: 31,
  },
  {
    label: "Virtual Accounts",
    href: "/admin/virtual-accounts",
    icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v9a2 2 0 002 2z",
    section: "Oversight",
    sortOrder: 32,
  },
  {
    label: "Marketplace",
    href: "/admin/marketplace",
    icon: "M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z",
    section: "Moderation",
    sortOrder: 40,
  },
  {
    label: "Jobs",
    href: "/admin/jobs",
    icon: "M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
    section: "Moderation",
    sortOrder: 41,
  },
  {
    label: "Donations",
    href: "/admin/donations",
    icon: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z",
    section: "Moderation",
    sortOrder: 42,
  },
  {
    label: "Circle Management",
    href: "/circle-management",
    icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
    section: "Management",
    sortOrder: 50,
  },
  {
    label: "Defaults",
    href: "/default-management",
    icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
    section: "Management",
    sortOrder: 51,
  },
  {
    label: "Clearance",
    href: "/clearance-management",
    icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
    section: "Management",
    sortOrder: 52,
  },
  {
    label: "KYC Reviews",
    href: "/kyc/admin",
    icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
    section: "Management",
    sortOrder: 53,
  },
  {
    label: "Impact Spotlight",
    href: "/admin/impact-spotlight",
    icon: "M13 10V3L4 14h7v7l9-11h-7z",
    section: "Content",
    sortOrder: 60,
  },
  {
    label: "Ticket Inbox",
    href: "/admin/support",
    icon: "M18.364 5.636a9 9 0 11-12.728 0M12 3v9m0 0l3-3m-3 3l-3-3",
    section: "Support",
    sortOrder: 70,
    badge: "Support",
  },
  {
    label: "Ticket Categories",
    href: "/admin/support/categories",
    icon: "M7 7h.01M7 11h.01M7 15h.01M11 7h6M11 11h6M11 15h6",
    section: "Support",
    sortOrder: 71,
  },
];

const ADMIN_ROLES = ["admin", "superadmin"];

async function main() {
  for (const item of ADMIN_NAV) {
    const existing = await prisma.navigationItem.findUnique({ where: { href: item.href } });
    const navItem = existing
      ? await prisma.navigationItem.update({ where: { href: item.href }, data: item })
      : await prisma.navigationItem.create({ data: item });

    for (const role of ADMIN_ROLES) {
      const assigned = await prisma.roleNavigation.findUnique({
        where: { role_navigationItemId: { role, navigationItemId: navItem.id } },
      });
      if (!assigned) {
        await prisma.roleNavigation.create({
          data: { role, navigationItemId: navItem.id, sortOrder: item.sortOrder },
        });
      }
    }
    console.log(`Ensured admin nav item: ${item.label}`);
  }

  console.log("Admin navigation seed complete!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
