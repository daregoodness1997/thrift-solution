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

export async function getAuditLogs(params: {
  page?: number;
  limit?: number;
  entity?: string;
  action?: string;
  actorId?: string;
}) {
  const { page = 1, limit = 20, entity, action, actorId } = params;
  const where: Record<string, unknown> = {};
  if (entity) where.entity = entity;
  if (action) where.action = action;
  if (actorId) where.actorId = actorId;

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
