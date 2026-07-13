import { prisma } from "./prisma";

export async function getNavigationForRole(role: string) {
  const roleNavigations = await prisma.roleNavigation.findMany({
    where: { role },
    orderBy: { sortOrder: "asc" },
  });

  const navItemIds = roleNavigations.map((rn) => rn.navigationItemId);
  const navItems = await prisma.navigationItem.findMany({
    where: { id: { in: navItemIds }, isActive: true },
    orderBy: { sortOrder: "asc" },
  });
  const navItemMap = new Map(navItems.map((item) => [item.id, item]));

  const orderedItems = roleNavigations
    .map((rn) => navItemMap.get(rn.navigationItemId))
    .filter(Boolean);

  const sections: Record<string, { label: string; href: string; icon: string; badge?: string }[]> = {};

  for (const navItem of orderedItems) {
    if (!navItem) continue;

    const section = navItem.section || "";
    if (!sections[section]) {
      sections[section] = [];
    }

    const item: { label: string; href: string; icon: string; badge?: string } = {
      label: navItem.label,
      href: navItem.href,
      icon: navItem.icon,
    };
    if (navItem.badge) {
      item.badge = navItem.badge;
    }
    sections[section].push(item);
  }

  return Object.entries(sections).map(([title, items]) => ({
    title,
    items,
  }));
}

export async function getAllNavigationItems() {
  return prisma.navigationItem.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
}

export async function createNavigationItem(data: {
  label: string;
  href: string;
  icon: string;
  section?: string;
  sortOrder?: number;
}) {
  return prisma.navigationItem.create({ data });
}

export async function updateNavigationItem(id: string, data: {
  label?: string;
  href?: string;
  icon?: string;
  section?: string;
  sortOrder?: number;
  isActive?: boolean;
}) {
  return prisma.navigationItem.update({ where: { id }, data });
}

export async function deleteNavigationItem(id: string) {
  return prisma.navigationItem.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}

export async function assignNavigationToRole(role: string, navigationItemId: string, sortOrder?: number) {
  return prisma.roleNavigation.upsert({
    where: { role_navigationItemId: { role, navigationItemId } },
    create: { role, navigationItemId, sortOrder: sortOrder ?? 0 },
    update: { sortOrder: sortOrder ?? 0 },
  });
}

export async function removeNavigationFromRole(role: string, navigationItemId: string) {
  return prisma.roleNavigation.deleteMany({
    where: { role, navigationItemId },
  });
}

export async function getRoles() {
  const roles = await prisma.roleNavigation.findMany({
    select: { role: true },
    distinct: ["role"],
  });
  return roles.map((r) => r.role);
}
