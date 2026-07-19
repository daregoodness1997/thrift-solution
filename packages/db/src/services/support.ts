import { prisma, softDelete } from "./prisma";

export type TicketStatus = "open" | "in_progress" | "waiting_customer" | "resolved" | "closed";
export type TicketPriority = "low" | "normal" | "high" | "urgent";

export const TICKET_STATUS_CONFIG: Record<TicketStatus, { label: string }> = {
  open: { label: "Open" },
  in_progress: { label: "In Progress" },
  waiting_customer: { label: "Waiting on Customer" },
  resolved: { label: "Resolved" },
  closed: { label: "Closed" },
};

export const TICKET_PRIORITY_CONFIG: Record<TicketPriority, { label: string }> = {
  low: { label: "Low" },
  normal: { label: "Normal" },
  high: { label: "High" },
  urgent: { label: "Urgent" },
};

export const SUPPORT_ROLES = ["support", "admin", "superadmin", "moderator", "finance"];

export interface TicketCategoryRecord {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  isActive: boolean;
  position: number;
}

export interface TicketSummary {
  id: string;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  categoryId: string | null;
  categoryName: string | null;
  userId: string;
  userName: string;
  userEmail: string;
  assigneeId: string | null;
  assigneeName: string | null;
  messageCount: number;
  createdAt: Date;
  updatedAt: Date;
  closedAt: Date | null;
}

export interface TicketDetail extends TicketSummary {
  description: string;
  messages: TicketMessageRecord[];
}

export interface TicketMessageRecord {
  id: string;
  ticketId: string;
  userId: string;
  userName: string;
  body: string;
  isInternal: boolean;
  createdAt: Date;
  updatedAt: Date;
}

function serializeCategory(c: {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  isActive: boolean;
  position: number;
}): TicketCategoryRecord {
  return {
    id: c.id,
    name: c.name,
    description: c.description,
    slug: c.slug,
    isActive: c.isActive,
    position: c.position,
  };
}

export async function listTicketCategories(): Promise<TicketCategoryRecord[]> {
  const rows = await prisma.ticketCategory.findMany({
    where: { isActive: true },
    orderBy: { position: "asc" },
  });
  return rows.map(serializeCategory);
}

export async function getAllTicketCategories(): Promise<TicketCategoryRecord[]> {
  const rows = await prisma.ticketCategory.findMany({
    orderBy: [{ isActive: "desc" }, { position: "asc" }],
  });
  return rows.map(serializeCategory);
}

export async function createTicketCategory(input: {
  name: string;
  description?: string;
  slug: string;
  position?: number;
}): Promise<TicketCategoryRecord> {
  const created = await prisma.ticketCategory.create({
    data: {
      name: input.name,
      description: input.description ?? null,
      slug: input.slug,
      position: input.position ?? 0,
    },
  });
  return serializeCategory(created);
}

export async function updateTicketCategory(
  id: string,
  input: { name?: string; description?: string; slug?: string; isActive?: boolean; position?: number },
): Promise<TicketCategoryRecord | null> {
  const existing = await prisma.ticketCategory.findUnique({ where: { id } });
  if (!existing) return null;
  const updated = await prisma.ticketCategory.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.slug !== undefined ? { slug: input.slug } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      ...(input.position !== undefined ? { position: input.position } : {}),
    },
  });
  return serializeCategory(updated);
}

export async function deleteTicketCategory(id: string): Promise<boolean> {
  const existing = await prisma.ticketCategory.findUnique({ where: { id } });
  if (!existing) return false;
  await prisma.ticketCategory.delete({ where: { id } });
  return true;
}

export interface CreateTicketInput {
  subject: string;
  description: string;
  priority?: TicketPriority;
  categoryId?: string;
}

export async function createTicket(userId: string, input: CreateTicketInput): Promise<TicketDetail> {
  const created = await prisma.ticket.create({
    data: {
      userId,
      subject: input.subject,
      description: input.description,
      priority: input.priority ?? "normal",
      categoryId: input.categoryId ?? null,
    },
    include: {
      category: true,
      user: { select: { id: true, name: true, email: true } },
      assignee: { select: { id: true, name: true } },
      messages: {
        where: { deletedAt: null },
        orderBy: { createdAt: "asc" },
        include: { user: { select: { id: true, name: true } } },
      },
      _count: { select: { messages: true } },
    },
  });

  return serializeTicket(created);
}

export interface ListTicketsOptions {
  page?: number;
  limit?: number;
  status?: TicketStatus;
  priority?: TicketPriority;
  categoryId?: string;
  assigneeId?: string;
  userId?: string;
  search?: string;
}

export async function listTickets(opts: ListTicketsOptions = {}) {
  const page = opts.page ?? 1;
  const limit = opts.limit ?? 20;

  const where: Record<string, unknown> = { deletedAt: null };
  if (opts.status) where.status = opts.status;
  if (opts.priority) where.priority = opts.priority;
  if (opts.categoryId) where.categoryId = opts.categoryId;
  if (opts.assigneeId) where.assigneeId = opts.assigneeId;
  if (opts.userId) where.userId = opts.userId;
  if (opts.search) {
    where.OR = [
      { subject: { contains: opts.search, mode: "insensitive" } },
      { description: { contains: opts.search, mode: "insensitive" } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.ticket.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        category: { select: { id: true, name: true } },
        user: { select: { id: true, name: true, email: true } },
        assignee: { select: { id: true, name: true } },
        _count: { select: { messages: true } },
      },
    }),
    prisma.ticket.count({ where }),
  ]);

  return {
    items: items.map((t) => serializeTicketSummary(t)),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getTicketById(id: string): Promise<TicketDetail | null> {
  const ticket = await prisma.ticket.findFirst({
    where: { id, deletedAt: null },
    include: {
      category: true,
      user: { select: { id: true, name: true, email: true } },
      assignee: { select: { id: true, name: true } },
      messages: {
        where: { deletedAt: null },
        orderBy: { createdAt: "asc" },
        include: { user: { select: { id: true, name: true } } },
      },
      _count: { select: { messages: true } },
    },
  });
  if (!ticket) return null;
  return serializeTicket(ticket);
}

export interface UpdateTicketInput {
  subject?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  categoryId?: string;
  assigneeId?: string;
}

export async function updateTicket(id: string, input: UpdateTicketInput): Promise<TicketDetail | null> {
  const existing = await prisma.ticket.findFirst({ where: { id, deletedAt: null } });
  if (!existing) return null;

  const data: Record<string, unknown> = {};
  if (input.subject !== undefined) data.subject = input.subject;
  if (input.status !== undefined) data.status = input.status;
  if (input.priority !== undefined) data.priority = input.priority;
  if (input.categoryId !== undefined) data.categoryId = input.categoryId;
  if (input.assigneeId !== undefined) data.assigneeId = input.assigneeId === "" ? null : input.assigneeId;
  if (input.status === "closed" && !existing.closedAt) data.closedAt = new Date();
  if (input.status && input.status !== "closed") data.closedAt = null;

  const updated = await prisma.ticket.update({
    where: { id },
    data,
    include: {
      category: true,
      user: { select: { id: true, name: true, email: true } },
      assignee: { select: { id: true, name: true } },
      messages: {
        where: { deletedAt: null },
        orderBy: { createdAt: "asc" },
        include: { user: { select: { id: true, name: true } } },
      },
      _count: { select: { messages: true } },
    },
  });

  return serializeTicket(updated);
}

export async function assignTicket(id: string, assigneeId: string | null): Promise<TicketDetail | null> {
  const existing = await prisma.ticket.findFirst({ where: { id, deletedAt: null } });
  if (!existing) return null;
  const updated = await prisma.ticket.update({
    where: { id },
    data: { assigneeId },
    include: {
      category: true,
      user: { select: { id: true, name: true, email: true } },
      assignee: { select: { id: true, name: true } },
      messages: {
        where: { deletedAt: null },
        orderBy: { createdAt: "asc" },
        include: { user: { select: { id: true, name: true } } },
      },
      _count: { select: { messages: true } },
    },
  });
  return serializeTicket(updated);
}

export async function deleteTicket(id: string): Promise<boolean> {
  const existing = await prisma.ticket.findFirst({ where: { id, deletedAt: null } });
  if (!existing) return false;
  await softDelete("ticket", id);
  return true;
}

export interface AddTicketMessageInput {
  body: string;
  isInternal?: boolean;
}

export async function addTicketMessage(
  ticketId: string,
  userId: string,
  input: AddTicketMessageInput,
): Promise<TicketMessageRecord | null> {
  const ticket = await prisma.ticket.findFirst({ where: { id: ticketId, deletedAt: null } });
  if (!ticket) return null;

  const created = await prisma.ticketMessage.create({
    data: {
      ticketId,
      userId,
      body: input.body,
      isInternal: input.isInternal ?? false,
    },
    include: { user: { select: { id: true, name: true } } },
  });

  await prisma.ticket.update({
    where: { id: ticketId },
    data: { updatedAt: new Date() },
  });

  return serializeTicketMessage(created);
}

export async function softDeleteTicketMessage(id: string): Promise<boolean> {
  const existing = await prisma.ticketMessage.findFirst({ where: { id, deletedAt: null } });
  if (!existing) return false;
  await softDelete("ticketMessage", id);
  return true;
}

export interface TicketStats {
  total: number;
  open: number;
  inProgress: number;
  waitingCustomer: number;
  resolved: number;
  closed: number;
  unassigned: number;
  urgent: number;
  byCategory: { categoryId: string | null; categoryName: string | null; count: number }[];
}

export async function getTicketStats(): Promise<TicketStats> {
  const [total, byStatus, unassigned, urgent, byCategory] = await Promise.all([
    prisma.ticket.count({ where: { deletedAt: null } }),
    prisma.ticket.groupBy({
      by: ["status"],
      where: { deletedAt: null },
      _count: { _all: true },
    }),
    prisma.ticket.count({ where: { deletedAt: null, assigneeId: null, status: { in: ["open", "in_progress", "waiting_customer"] } } }),
    prisma.ticket.count({ where: { deletedAt: null, priority: "urgent", status: { in: ["open", "in_progress", "waiting_customer"] } } }),
    prisma.ticket.groupBy({
      by: ["categoryId"],
      where: { deletedAt: null },
      _count: { _all: true },
    }),
  ]);

  const statusMap: Record<string, number> = {};
  for (const row of byStatus) statusMap[row.status] = row._count._all;

  const categoryRows = await prisma.ticketCategory.findMany({
    where: { id: { in: byCategory.map((c) => c.categoryId).filter(Boolean) as string[] } },
    select: { id: true, name: true },
  });
  const categoryNameMap = new Map(categoryRows.map((c) => [c.id, c.name]));

  return {
    total,
    open: statusMap.open ?? 0,
    inProgress: statusMap.in_progress ?? 0,
    waitingCustomer: statusMap.waiting_customer ?? 0,
    resolved: statusMap.resolved ?? 0,
    closed: statusMap.closed ?? 0,
    unassigned,
    urgent,
    byCategory: byCategory.map((c) => ({
      categoryId: c.categoryId,
      categoryName: c.categoryId ? (categoryNameMap.get(c.categoryId) ?? null) : null,
      count: c._count._all,
    })),
  };
}

type TicketWithRelations = {
  id: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  categoryId: string | null;
  category: { id: string; name: string } | null;
  userId: string;
  user: { id: string; name: string; email: string };
  assigneeId: string | null;
  assignee: { id: string; name: string } | null;
  closedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  messages?: {
    id: string;
    ticketId: string;
    userId: string;
    body: string;
    isInternal: boolean;
    createdAt: Date;
    updatedAt: Date;
    user: { id: string; name: string };
  }[];
  _count: { messages: number };
};

function serializeTicket(t: TicketWithRelations): TicketDetail {
  return {
    ...serializeTicketSummary(t),
    description: t.description,
    messages: (t.messages ?? []).map(serializeTicketMessage),
  };
}

function serializeTicketSummary(t: TicketWithRelations): TicketSummary {
  return {
    id: t.id,
    subject: t.subject,
    status: t.status as TicketStatus,
    priority: t.priority as TicketPriority,
    categoryId: t.categoryId,
    categoryName: t.category?.name ?? null,
    userId: t.userId,
    userName: t.user.name,
    userEmail: t.user.email,
    assigneeId: t.assigneeId,
    assigneeName: t.assignee?.name ?? null,
    messageCount: t._count.messages,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
    closedAt: t.closedAt,
  };
}

function serializeTicketMessage(m: {
  id: string;
  ticketId: string;
  userId: string;
  body: string;
  isInternal: boolean;
  createdAt: Date;
  updatedAt: Date;
  user: { id: string; name: string };
}): TicketMessageRecord {
  return {
    id: m.id,
    ticketId: m.ticketId,
    userId: m.userId,
    userName: m.user.name,
    body: m.body,
    isInternal: m.isInternal,
    createdAt: m.createdAt,
    updatedAt: m.updatedAt,
  };
}
