import "dotenv/config";
import { PrismaClient } from "@prisma/client";

console.log("[seed-navigation] starting, DATABASE_URL set:", !!process.env.DATABASE_URL);

const prisma = new PrismaClient();

interface NavDef {
  label: string;
  href: string;
  icon: string;
  section: string;
  badge?: string;
}

const MEMBER_NAV: NavDef[] = [
  { label: "Overview", href: "/", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1", section: "" },
  { label: "Transactions", href: "/transactions", icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z", section: "" },
  { label: "Wallet", href: "/wallet", icon: "M3 10h18M3 14h18M5 10v10a1 1 0 001 1h12a1 1 0 001-1V10M7 10V7a5 5 0 0110 0v3", section: "" },
  { label: "Donate", href: "/donate", icon: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z", section: "" },
  { label: "My Circles", href: "/my-circles", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z", section: "" },
  { label: "Marketplace", href: "/marketplace", icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4", section: "", badge: "Premium" },
  { label: "Jobs", href: "/jobs", icon: "M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z", section: "", badge: "Premium" },

  { label: "My Donations", href: "/donations", icon: "M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7", section: "Member Portal" },
  { label: "My Clearance", href: "/my-clearance", icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z", section: "Member Portal" },
  { label: "My Defaults", href: "/my-defaults", icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z", section: "Member Portal" },
  { label: "Referrals", href: "/referrals", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z", section: "Member Portal" },
  { label: "KYC Verification", href: "/kyc", icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z", section: "Member Portal" },
  { label: "Loans", href: "/loans", icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z", section: "Member Portal", badge: "Premium" },
  { label: "Circle Savings", href: "/circles", icon: "M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7", section: "Member Portal" },

  { label: "Support Tickets", href: "/support", icon: "M18.364 5.636a9 9 0 11-12.728 0M12 3v9m0 0l3-3m-3 3l-3-3", section: "Member Portal" },

  { label: "WhatsApp Groups", href: "/whatsapp-groups", icon: "M17.498 14.382c-.301-.15-1.767-.967-2.04-1.08-.273-.114-.473-.165-.673.165-.197.325-.767.997-.94 1.2-.175.208-.347.23-.644.08-.297-.15-1.261-.485-2.403-1.546-.888-.828-1.484-1.854-1.66-2.149-.173-.3-.019-.465.13-.615.13-.13.3-.345.45-.523.146-.181.194-.301.297-.5.1-.194.05-.372-.025-.527-.075-.15-.672-1.62-.922-2.206-.24-.584-.487-.51-.672-.51-.172-.015-.371-.015-.571-.015-.2 0-.523.074-.797.375-.273.3-1.045 1.02-1.045 2.475s1.07 2.865 1.219 3.075c.149.21 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.767-.721 2.016-1.426.247-.705.247-1.305.173-1.426-.074-.121-.274-.198-.575-.347z M12.05 21.785h-.001a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982 1.003-3.628-.235-.374A9.86 9.86 0 012.16 12c0-5.44 4.418-9.858 9.85-9.858 5.44 0 9.857 4.418 9.857 9.858 0 2.665-1.05 5.117-2.95 6.959l-.35.35.003.002-5.858 5.636z", section: "Community" },

  { label: "Profile", href: "/profile", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z", section: "" },
  { label: "Settings", href: "/settings", icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31 2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z", section: "" },
];

const STAFF_NAV: NavDef[] = [
  { label: "Admin Overview", href: "/admin", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1", section: "Administration" },
  { label: "User Management", href: "/admin/users", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z", section: "Administration" },
  { label: "Loan Requests", href: "/admin/loans", icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z", section: "Administration" },
  { label: "Audit Log", href: "/admin/audit-logs", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", section: "Administration" },

  { label: "Transactions", href: "/admin/transactions", icon: "M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4", section: "Oversight" },
  { label: "Referrals", href: "/admin/referrals", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z", section: "Oversight" },
  { label: "Virtual Accounts", href: "/admin/virtual-accounts", icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v9a2 2 0 002 2z", section: "Oversight" },

  { label: "Marketplace", href: "/admin/marketplace", icon: "M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z", section: "Moderation" },
  { label: "Jobs", href: "/admin/jobs", icon: "M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z", section: "Moderation" },
  { label: "Donations", href: "/admin/donations", icon: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z", section: "Moderation" },

  { label: "Configuration", href: "/admin/config", icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31 2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z", section: "Administration" },

  { label: "Ticket Inbox", href: "/admin/support", icon: "M18.364 5.636a9 9 0 11-12.728 0M12 3v9m0 0l3-3m-3 3l-3-3", section: "Support", badge: "Support" },
  { label: "Ticket Categories", href: "/admin/support/categories", icon: "M7 7h.01M7 11h.01M7 15h.01M11 7h6M11 11h6M11 15h6", section: "Support" },
];

const STAFF_ROLES = ["admin", "superadmin", "support", "finance", "moderator"];

async function main() {
  const created = new Map<string, string>();

  async function ensureItem(def: NavDef): Promise<string> {
    const existing = await prisma.navigationItem.findUnique({ where: { href: def.href } });
    if (existing) {
      if (!existing.isActive) {
        await prisma.navigationItem.update({ where: { id: existing.id }, data: { isActive: true } });
      }
      return existing.id;
    }
    const item = await prisma.navigationItem.create({
      data: {
        label: def.label,
        href: def.href,
        icon: def.icon,
        section: def.section,
        badge: def.badge,
        isActive: true,
      },
    });
    return item.id;
  }

  for (const def of MEMBER_NAV) {
    const id = await ensureItem(def);
    created.set(def.href, id);
  }
  for (const def of STAFF_NAV) {
    const id = await ensureItem(def);
    created.set(def.href, id);
  }

  async function assign(role: string, defs: NavDef[]) {
    for (let i = 0; i < defs.length; i++) {
      const def = defs[i];
      const itemId = created.get(def.href);
      if (!itemId) continue;
      await prisma.roleNavigation.upsert({
        where: { role_navigationItemId: { role, navigationItemId: itemId } },
        create: { role, navigationItemId: itemId, sortOrder: i },
        update: { sortOrder: i },
      });
    }
  }

  const memberHrefs = new Set(MEMBER_NAV.map((d) => d.href));
  const memberItemIds = MEMBER_NAV.map((d) => created.get(d.href)).filter(Boolean) as string[];
  await prisma.roleNavigation.deleteMany({
    where: {
      role: "member",
      navigationItemId: { notIn: memberItemIds },
    },
  });

  await assign("member", MEMBER_NAV);
  for (const role of STAFF_ROLES) {
    await assign(role, STAFF_NAV);
  }

  const memberCount = await prisma.roleNavigation.count({ where: { role: "member" } });
  const staffCount = await prisma.roleNavigation.count({ where: { role: { in: STAFF_ROLES } } });
  console.log(`Seeded navigation: member=${memberCount} items, staff=${staffCount} items`);
}

export async function seedNavigation() {
  try {
    await main();
  } catch (err) {
    console.error("[seed-navigation] ERROR:", err);
    throw err;
  } finally {
    await prisma.$disconnect();
  }
}

// Allow running directly: `tsx src/seed-navigation.ts`
if (require.main === module) {
  seedNavigation().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
