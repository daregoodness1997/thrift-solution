import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

/* ─────────────────────────────────────────────
   1. ADMIN / STAFF USERS
   ───────────────────────────────────────────── */

function generateAccountNumber(): string {
  return "GFW" + String(Math.floor(1000000000 + Math.random() * 9000000000));
}

function generateReferralCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

async function seedUsers() {
  console.log("\n▸ Seeding users...");

  const users = [
    {
      name: "Super Admin",
      email: "admin@gfw.com",
      password: "Admin@123456",
      role: "superadmin",
      accountTier: "premium",
    },
    {
      name: "Admin User",
      email: "manager@gfw.com",
      password: "Admin@123456",
      role: "admin",
      accountTier: "premium",
    },
    {
      name: "Support Agent",
      email: "support@gfw.com",
      password: "Support@123456",
      role: "support",
      accountTier: "basic",
    },
    {
      name: "Finance Officer",
      email: "finance@gfw.com",
      password: "Finance@123456",
      role: "finance",
      accountTier: "basic",
    },
    {
      name: "Moderator",
      email: "moderator@gfw.com",
      password: "Moderator@123456",
      role: "moderator",
      accountTier: "basic",
    },
    {
      name: "Demo Member",
      email: "member@gfw.com",
      password: "Member@123456",
      role: "member",
      accountTier: "basic",
    },
  ];

  for (const u of users) {
    const existing = await prisma.user.findUnique({
      where: { email: u.email },
    });
    if (existing) {
      const hash = await bcrypt.hash(u.password, 10);
      await prisma.user.update({
        where: { id: existing.id },
        data: { passwordHash: hash },
      });
      console.log(`  Reset password: ${u.email} (${u.role})`);
      continue;
    }
    const hash = await bcrypt.hash(u.password, 10);
    await prisma.user.create({
      data: {
        name: u.name,
        email: u.email,
        passwordHash: hash,
        role: u.role,
        accountNumber: generateAccountNumber(),
        accountTier: u.accountTier,
        referralCode: generateReferralCode(),
        emailVerified: true,
      },
    });
    console.log(`  Created: ${u.name} (${u.email}) – ${u.role}`);
  }
}

/* ─────────────────────────────────────────────
   2. NAVIGATION ITEMS
   ───────────────────────────────────────────── */

interface NavItem {
  label: string;
  href: string;
  icon: string;
  section?: string;
  badge?: string;
  sortOrder: number;
}

const ALL_NAV_ITEMS: NavItem[] = [
  // Member
  {
    label: "Overview",
    href: "/",
    icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1",
    sortOrder: 0,
  },
  {
    label: "Transactions",
    href: "/transactions",
    icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z",
    sortOrder: 1,
  },
  {
    label: "Donate",
    href: "/donate",
    icon: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z",
    sortOrder: 2,
  },
  {
    label: "My Circles",
    href: "/my-circles",
    icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
    sortOrder: 3,
  },
  {
    label: "Marketplace",
    href: "/marketplace",
    icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
    badge: "Premium",
    sortOrder: 5,
  },
  {
    label: "Jobs",
    href: "/jobs",
    icon: "M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
    badge: "Premium",
    sortOrder: 6,
  },
  {
    label: "My Donations",
    href: "/donations",
    icon: "M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7",
    section: "Member Portal",
    sortOrder: 7,
  },
  {
    label: "My Clearance",
    href: "/my-clearance",
    icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
    section: "Member Portal",
    sortOrder: 8,
  },
  {
    label: "Referrals",
    href: "/referrals",
    icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
    section: "Member Portal",
    sortOrder: 9,
  },
  {
    label: "KYC Verification",
    href: "/kyc",
    icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
    section: "Member Portal",
    sortOrder: 10,
  },
  {
    label: "Loans",
    href: "/loans",
    icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    badge: "Premium",
    section: "Member Portal",
    sortOrder: 11,
  },
  {
    label: "Circle Savings",
    href: "/circles",
    icon: "M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7",
    section: "Member Portal",
    sortOrder: 12,
  },
  {
    label: "WhatsApp Groups",
    href: "/whatsapp-groups",
    icon: "M17.498 14.382c-.301-.15-1.767-.967-2.04-1.08-.273-.114-.473-.165-.673.165-.197.325-.767.997-.94 1.2-.175.208-.347.23-.644.08-.297-.15-1.261-.485-2.403-1.546-.888-.828-1.484-1.854-1.66-2.149-.173-.3-.019-.465.13-.615.13-.13.3-.345.45-.523.146-.181.194-.301.297-.5.1-.194.05-.372-.025-.527-.075-.15-.672-1.62-.922-2.206-.24-.584-.487-.51-.672-.51-.172-.015-.371-.015-.571-.015-.2 0-.523.074-.797.375-.273.3-1.045 1.02-1.045 2.475s1.07 2.865 1.219 3.075c.149.21 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.767-.721 2.016-1.426.247-.705.247-1.305.173-1.426-.074-.121-.274-.198-.575-.347z M12.05 21.785h-.001a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982 1.003-3.628-.235-.374A9.86 9.86 0 012.16 12c0-5.44 4.418-9.858 9.85-9.858 5.44 0 9.857 4.418 9.857 9.858 0 2.665-1.05 5.117-2.95 6.959l-.35.35.003.002-5.858 5.636z",
    section: "Community",
    sortOrder: 13,
  },
  {
    label: "Support Tickets",
    href: "/support",
    icon: "M18.364 5.636a9 9 0 11-12.728 0M12 3v9m0 0l3-3m-3 3l-3-3",
    section: "Member Portal",
    sortOrder: 19,
  },
  {
    label: "Profile",
    href: "/profile",
    icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
    sortOrder: 17,
  },
  {
    label: "Settings",
    href: "/settings",
    icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31 2.37-2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
    sortOrder: 18,
  },

  // Admin – Administration
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
    label: "Prayer Management",
    href: "/admin/prayer-requests",
    icon: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z",
    section: "Administration",
    sortOrder: 26,
  },

  // Admin – Oversight
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

  // Admin – Moderation
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

  // Admin – Management
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

  // Admin – Content
  {
    label: "Impact Spotlight",
    href: "/admin/impact-spotlight",
    icon: "M13 10V3L4 14h7v7l9-11h-7z",
    section: "Content",
    sortOrder: 60,
  },

  // Admin – Support
  {
    label: "Ticket Inbox",
    href: "/admin/support",
    icon: "M18.364 5.636a9 9 0 11-12.728 0M12 3v9m0 0l3-3m-3 3l-3-3",
    section: "Support",
    badge: "Support",
    sortOrder: 70,
  },
  {
    label: "Ticket Categories",
    href: "/admin/support/categories",
    icon: "M7 7h.01M7 11h.01M7 15h.01M11 7h6M11 11h6M11 15h6",
    section: "Support",
    sortOrder: 71,
  },
];

const ROLE_ASSIGNMENTS: Record<string, string[]> = {
  member: [
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
    "/support",
    "/profile",
    "/settings",
  ],
  support: [
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
  ],
  finance: [
    "/admin/transactions",
    "/admin/virtual-accounts",
    "/admin/loans",
    "/admin/referrals",
    "/admin/donations",
    "/profile",
    "/settings",
  ],
  moderator: [
    "/admin/marketplace",
    "/admin/jobs",
    "/admin/donations",
    "/admin/users",
    "/profile",
    "/settings",
  ],
  admin: [
    "/admin",
    "/admin/users",
    "/admin/loans",
    "/admin/audit-logs",
    "/admin/config",
    "/admin/prayer-requests",
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
  ],
  superadmin: [
    "/admin",
    "/admin/users",
    "/admin/loans",
    "/admin/audit-logs",
    "/admin/config",
    "/admin/prayer-requests",
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
  ],
};

async function seedNavigation() {
  console.log("\n▸ Seeding navigation items...");

  for (const item of ALL_NAV_ITEMS) {
    const existing = await prisma.navigationItem.findUnique({
      where: { href: item.href },
    });
    if (existing) {
      await prisma.navigationItem.update({
        where: { href: item.href },
        data: item,
      });
    } else {
      await prisma.navigationItem.create({ data: item });
    }
  }
  console.log(`  Upserted ${ALL_NAV_ITEMS.length} navigation items`);
}

async function seedRoleNavigation() {
  console.log("\n▸ Seeding role navigation...");

  for (const [role, hrefs] of Object.entries(ROLE_ASSIGNMENTS)) {
    await prisma.roleNavigation.deleteMany({ where: { role } });
    let assigned = 0;
    for (let i = 0; i < hrefs.length; i++) {
      const navItem = await prisma.navigationItem.findUnique({
        where: { href: hrefs[i] },
      });
      if (!navItem) {
        console.log(`  ⚠ Missing nav item: ${hrefs[i]} for role ${role}`);
        continue;
      }
      await prisma.roleNavigation.create({
        data: { role, navigationItemId: navItem.id, sortOrder: i },
      });
      assigned++;
    }
    console.log(`  ${role}: ${assigned} items`);
  }
}

/* ─────────────────────────────────────────────
   3. CIRCLES
   ───────────────────────────────────────────── */

async function seedCircles() {
  console.log("\n▸ Seeding circles...");

  const circles = [
    {
      name: "Bronze Circle",
      description: "Entry-level savings circle",
      cycleType: "deposit",
      amount: 5000,
      durationMonths: 6,
      interestRateAnnual: 8,
      maxAccountsPerUser: 2,
      autoPayout: false,
      payoutMode: "auto",
      blockPayoutOnDefault: true,
      status: "active",
    },
    {
      name: "Silver Circle",
      description: "Mid-tier savings circle",
      cycleType: "deposit",
      amount: 10000,
      durationMonths: 12,
      interestRateAnnual: 10,
      maxAccountsPerUser: 2,
      autoPayout: false,
      payoutMode: "auto",
      blockPayoutOnDefault: true,
      status: "active",
    },
    {
      name: "Gold Circle",
      description: "Premium savings circle",
      cycleType: "deposit",
      amount: 25000,
      durationMonths: 12,
      interestRateAnnual: 12,
      maxAccountsPerUser: 1,
      autoPayout: false,
      payoutMode: "auto",
      blockPayoutOnDefault: true,
      status: "active",
    },
    {
      name: "Platinum Circle",
      description: "Elite savings circle",
      cycleType: "deposit",
      amount: 50000,
      durationMonths: 12,
      interestRateAnnual: 15,
      maxAccountsPerUser: 1,
      autoPayout: false,
      payoutMode: "auto",
      blockPayoutOnDefault: true,
      status: "active",
    },
  ];

  for (const c of circles) {
    const existing = await prisma.circle.findFirst({ where: { name: c.name } });
    if (existing) {
      console.log(`  Circle exists: ${c.name}`);
      continue;
    }
    await prisma.circle.create({ data: c });
    console.log(`  Created: ${c.name}`);
  }
}

/* ─────────────────────────────────────────────
   4. IMPACT SPOTLIGHT
   ───────────────────────────────────────────── */

async function seedImpactSpotlight() {
  console.log("\n▸ Seeding impact spotlight...");

  const narratives = [
    {
      name: "Amina Diallo",
      age: 22,
      country: "Kenya",
      countryCode: "🇰🇪",
      role: "Solar Mesh Engineer & AI Instructor",
      cohort: "Nairobi Innovation Cohort #14",
      avatarUrl:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400",
      coverImageUrl:
        "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=1000",
      headlineQuote:
        "I studied for my national exams by kerosene lamps. Today, my solar code powers Wi-Fi for 1,400 households.",
      impactMetric: "1,420",
      impactLabel: "Households Connected to Solar Mesh",
      longFormNarrative: [
        "Growing up in Kibera, Nairobi, electricity was an expensive luxury and internet access was virtually nonexistent. Amina spent her high school years studying under fumes of kerosene lamps, determined to break through systemic barriers.",
        "In 2024, when GFW opened its solar-powered Innovation Hub nearby, Amina was among the first applicants. Receiving a refurbished laptop, a micro-grant stipend, and satellite internet access, she immersed herself in Python programming and hardware engineering.",
        "Determined to solve local power outages, Amina designed an open-source solar mesh node built from recycled battery cells. Today, she leads a team of 40 female fellows who maintain 14 community mesh routers across her neighborhood.",
      ],
      sortOrder: 1,
      isActive: true,
      gallery: [
        {
          url: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=600",
          caption:
            "Amina setting up a rooftop solar mesh transmitter in Kibera.",
          tag: "Hardware Setup",
          sortOrder: 1,
        },
        {
          url: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=600",
          caption: "Mentoring younger scholars in Python at the Nairobi Hub.",
          tag: "Peer Teaching",
          sortOrder: 2,
        },
        {
          url: "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&q=80&w=600",
          caption:
            "Graduation day celebrating certified AI & Solar credentials.",
          tag: "Certification",
          sortOrder: 3,
        },
      ],
      timeline: [
        {
          year: "2023",
          title: "Zero Grid Access",
          description:
            "Studied for exams under kerosene light with no personal computing device.",
          tag: "Initial State",
          status: "completed",
          sortOrder: 1,
        },
        {
          year: "2024",
          title: "GFW Fellowship",
          description:
            "Received laptop, $150 stipend, and enrolled in 12-week intensive AI & solar track.",
          tag: "Growth Stage",
          status: "completed",
          sortOrder: 2,
        },
        {
          year: "2025",
          title: "Mesh Node Prototype",
          description:
            "Built and tested low-cost solar router powering 14 street blocks with free web access.",
          tag: "Innovation",
          status: "completed",
          sortOrder: 3,
        },
        {
          year: "2026",
          title: "Community Director",
          description:
            "Appointed Lead Technical Fellow at Nairobi Hub, training 40+ female engineers.",
          tag: "Leadership",
          status: "current",
          sortOrder: 4,
        },
      ],
    },
    {
      name: "Carlos Ruiz",
      age: 26,
      country: "Colombia",
      countryCode: "🇨🇴",
      role: "AgriTech Founder & Coffee Farmer",
      cohort: "LATAM Innovation Cohort #08",
      avatarUrl:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400",
      coverImageUrl:
        "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&q=80&w=1000",
      headlineQuote:
        "By pairing traditional farming wisdom with offline edge AI models, we cut crop loss by 35%.",
      impactMetric: "$85,000+",
      impactLabel: "Saved for 120 Coffee Farmers",
      longFormNarrative: [
        "In the lush mountain valleys outside Medellín, Carlos watched his family's coffee plantation struggle with devastating coffee leaf rust disease year after year. Without agronomist access, diagnosis was often too late.",
        "Through GFW's LATAM Innovation Cohort, Carlos learned how to build offline computer vision models that run on low-cost microcontrollers without needing cellular signal.",
        "He developed a mobile app that diagnoses plant rust within seconds. Carlos scaled this solution into an agricultural cooperative that now supports over 120 smallholder coffee farming families.",
      ],
      sortOrder: 2,
      isActive: true,
      gallery: [
        {
          url: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&q=80&w=600",
          caption:
            "Inspecting coffee plants with edge computer vision scanning.",
          tag: "Field AI Test",
          sortOrder: 1,
        },
        {
          url: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&q=80&w=600",
          caption:
            "Demonstrating the mobile app to local coffee cooperative members.",
          tag: "Community Workshop",
          sortOrder: 2,
        },
        {
          url: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=600",
          caption: "Writing micro-controller code for low-power leaf sensors.",
          tag: "Embedded Dev",
          sortOrder: 3,
        },
      ],
      timeline: [
        {
          year: "2023",
          title: "Crop Loss Crisis",
          description:
            "Lost 35% of coffee harvest due to undetected leaf fungus outbreak.",
          tag: "Background",
          status: "completed",
          sortOrder: 1,
        },
        {
          year: "2024",
          title: "Computer Vision Cohort",
          description:
            "Joined GFW AgriTech module; trained TensorFlow Lite model for leaf diagnosis.",
          tag: "Education",
          status: "completed",
          sortOrder: 2,
        },
        {
          year: "2025",
          title: "Pilot Deployment",
          description:
            "Tested app across 40 local farms, reducing diagnosis time from 5 days to 3 seconds.",
          tag: "Validation",
          status: "completed",
          sortOrder: 3,
        },
        {
          year: "2026",
          title: "Cooperative Founder",
          description:
            "Established valley-wide tech cooperative exporting sustainably verified coffee.",
          tag: "Scale",
          status: "current",
          sortOrder: 4,
        },
      ],
    },
    {
      name: "Farah Al-Husseini",
      age: 24,
      country: "Jordan",
      countryCode: "🇯🇴",
      role: "Senior Cloud Developer & Advocate",
      cohort: "Amman Refugee Tech Initiative #05",
      avatarUrl:
        "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400",
      coverImageUrl:
        "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=1000",
      headlineQuote:
        "When displacement took my home, code became my portable superpower that no border could revoke.",
      impactMetric: "100%",
      impactLabel: "Family Tuition & Remote Career Security",
      longFormNarrative: [
        "Displaced from her hometown, Farah arrived in Amman with limited financial resources and no way to continue her traditional university degree.",
        "She discovered GFW's Refugee Tech Accelerator, which provided 1-on-1 mentorship with Silicon Valley engineers, remote hardware kits, and intensive full-stack JavaScript training.",
        "Within 8 months, Farah passed her technical interviews and landed a remote cloud developer position with a global tech firm. Today, she uses her earnings to fund university tuition for her younger siblings while mentoring new fellows.",
      ],
      sortOrder: 3,
      isActive: true,
      gallery: [
        {
          url: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=600",
          caption: "Pair programming with a global mentor at the Amman Hub.",
          tag: "Mentorship",
          sortOrder: 1,
        },
        {
          url: "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&q=80&w=600",
          caption:
            "Presenting her final cloud architecture project to partners.",
          tag: "Project Demo",
          sortOrder: 2,
        },
        {
          url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=600",
          caption: "Working remotely for a European software engineering team.",
          tag: "Remote Career",
          sortOrder: 3,
        },
      ],
      timeline: [
        {
          year: "2022",
          title: "Displacement",
          description:
            "Forced to halt formal education due to regional turmoil.",
          tag: "Challenge",
          status: "completed",
          sortOrder: 1,
        },
        {
          year: "2023",
          title: "Cloud Fellowship",
          description:
            "Enrolled in full-stack engineering intensive with full Wi-Fi stipend support.",
          tag: "Training",
          status: "completed",
          sortOrder: 2,
        },
        {
          year: "2024",
          title: "First Remote Job",
          description:
            "Hired as Junior Developer for international software consultancy.",
          tag: "Milestone",
          status: "completed",
          sortOrder: 3,
        },
        {
          year: "2026",
          title: "Senior Developer & Mentor",
          description:
            "Promoted to Senior Engineer; sponsors tuition for 2 younger brothers.",
          tag: "Impact",
          status: "current",
          sortOrder: 4,
        },
      ],
    },
    {
      name: "Priya Sharma",
      age: 21,
      country: "India",
      countryCode: "🇮🇳",
      role: "Solar Grid AI Architect",
      cohort: "South Asia Digital Access #12",
      avatarUrl:
        "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&q=80&w=400",
      coverImageUrl:
        "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1000",
      headlineQuote:
        "We designed smart load-balancing algorithms that prevent rolling blackouts in rural clinics.",
      impactMetric: "28",
      impactLabel: "Rural Health Clinics Powered 24/7",
      longFormNarrative: [
        "In rural Bihar, frequent power grid failures threatened refrigerated vaccines and emergency medical equipment in regional health centers.",
        "Priya joined GFW's IoT & Clean Energy fellowship, where she focused on predictive battery optimization using machine learning algorithms.",
        "Her automated load-balancing system now ensures 28 primary healthcare centers maintain uninterrupted power for essential medical cold chains.",
      ],
      sortOrder: 4,
      isActive: true,
      gallery: [
        {
          url: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=600",
          caption:
            "Installing smart power monitors in rural Bihar health clinic.",
          tag: "Solar IoT",
          sortOrder: 1,
        },
        {
          url: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=600",
          caption: "Analyzing battery telemetry data on local solar dashboard.",
          tag: "Data Telemetry",
          sortOrder: 2,
        },
      ],
      timeline: [
        {
          year: "2023",
          title: "Power Grid Outages",
          description:
            "Rural health centers lost power 6+ hours daily, endangering vaccine storage.",
          tag: "Problem",
          status: "completed",
          sortOrder: 1,
        },
        {
          year: "2024",
          title: "Clean Tech Fellowship",
          description:
            "Received micro-grant for battery management microcontroller hardware.",
          tag: "Fellowship",
          status: "completed",
          sortOrder: 2,
        },
        {
          year: "2025",
          title: "Pilot Deployment",
          description:
            "Deployed predictive solar load balancer across 8 regional clinics.",
          tag: "Deploy",
          status: "completed",
          sortOrder: 3,
        },
        {
          year: "2026",
          title: "Regional Expansion",
          description:
            "Scaled system to 28 clinics, safeguarding critical medical supplies.",
          tag: "Scale",
          status: "current",
          sortOrder: 4,
        },
      ],
    },
  ];

  for (const n of narratives) {
    const existing = await prisma.impactNarrative.findFirst({
      where: { name: n.name },
    });
    if (existing) {
      console.log(`  Narrative exists: ${n.name}`);
      continue;
    }
    const { gallery, timeline, ...narrativeData } = n;
    await prisma.impactNarrative.create({
      data: {
        ...narrativeData,
        gallery: { create: gallery },
        timeline: { create: timeline },
      },
    });
    console.log(`  Created: ${n.name}`);
  }
}

/* ─────────────────────────────────────────────
   MAIN
   ───────────────────────────────────────────── */

async function main() {
  console.log("═══════════════════════════════════════════");
  console.log("  GFW Database Seed");
  console.log("═══════════════════════════════════════════");

  await seedUsers();
  await seedNavigation();
  await seedRoleNavigation();
  await seedCircles();
  await seedImpactSpotlight();

  console.log("\n═══════════════════════════════════════════");
  console.log("  Seed complete ✓");
  console.log("═══════════════════════════════════════════");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
