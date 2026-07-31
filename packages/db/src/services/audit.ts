import { prisma } from "./prisma";

export async function createAuditLog(data: {
  actorId?: string | null;
  actorEmail?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  metadata?: unknown;
  ipAddress?: string | null;
}) {
  return prisma.auditLog.create({
    data: {
      actorId: data.actorId ?? null,
      actorEmail: data.actorEmail ?? null,
      action: data.action,
      entity: data.entity,
      entityId: data.entityId ?? null,
      metadata: data.metadata !== undefined ? JSON.stringify(data.metadata) : null,
      ipAddress: data.ipAddress ?? null,
    },
  });
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function computeChanges(
  before: unknown,
  after: unknown,
): Record<string, { from: unknown; to: unknown }> {
  const changes: Record<string, { from: unknown; to: unknown }> = {};

  const walk = (prefix: string, oldValue: unknown, newValue: unknown) => {
    if (Object.is(oldValue, newValue)) return;

    const bothPlain = isPlainObject(oldValue) && isPlainObject(newValue);
    if (bothPlain) {
      const keys = new Set([...Object.keys(oldValue), ...Object.keys(newValue)]);
      for (const key of keys) {
        const path = prefix ? `${prefix}.${key}` : key;
        walk(path, oldValue[key], newValue[key]);
      }
      return;
    }

    if (Array.isArray(oldValue) && Array.isArray(newValue) && JSON.stringify(oldValue) === JSON.stringify(newValue)) {
      return;
    }

    changes[prefix] = { from: oldValue, to: newValue };
  };

  walk("", before, after);
  return changes;
}

interface AuditQuery {
  page?: number;
  limit?: number;
  entity?: string;
  action?: string;
  actorId?: string;
  search?: string;
  from?: string;
  to?: string;
}

function buildAuditFilters(params: Omit<AuditQuery, "page" | "limit">) {
  const { entity, action, actorId, search, from, to } = params;
  const filters: Record<string, unknown>[] = [];
  if (entity) filters.push({ entity });
  if (action) filters.push({ action });
  if (actorId) filters.push({ actorId });
  if (search) {
    filters.push({
      OR: [
        { actorEmail: { contains: search, mode: "insensitive" } },
        { action: { contains: search, mode: "insensitive" } },
        { entity: { contains: search, mode: "insensitive" } },
        { entityId: { contains: search, mode: "insensitive" } },
        { metadata: { contains: search, mode: "insensitive" } },
        { actor: { is: { name: { contains: search, mode: "insensitive" } } } },
      ],
    });
  }
  if (from || to) {
    const createdAt: { gte?: Date; lte?: Date } = {};
    if (from) createdAt.gte = new Date(from);
    if (to) createdAt.lte = new Date(to);
    filters.push({ createdAt });
  }
  return filters;
}

async function queryAuditLogs(where: Record<string, unknown>, page: number, limit: number) {
  const [items, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: { actor: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.auditLog.count({ where }),
  ]);
  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getAuditLogs(params: AuditQuery) {
  const { page = 1, limit = 20 } = params;
  const filters = buildAuditFilters(params);
  const where = filters.length === 1 ? filters[0] : { AND: filters };
  return queryAuditLogs(where, page, limit);
}

export async function getAuditLogsForUser(userId: string, params: AuditQuery) {
  const { page = 1, limit = 20 } = params;
  const filters = buildAuditFilters(params);
  const scope: Record<string, unknown> = {
    OR: [{ actorId: userId }, { entity: "user", entityId: userId }],
  };
  const where = filters.length > 0 ? { AND: [scope, ...filters] } : scope;
  return queryAuditLogs(where, page, limit);
}
