import { prisma, softDelete } from "./prisma";

export type NotificationChannel = "in_app" | "email" | "sms";
export type NotificationStatus = "unread" | "read";

export interface NotificationPreferences {
  id: string;
  userId: string;
  inApp: boolean;
  email: boolean;
  sms: boolean;
}

async function serializePref(pref: {
  id: string;
  userId: string;
  inApp: boolean;
  email: boolean;
  sms: boolean;
}): Promise<NotificationPreferences> {
  return {
    id: pref.id,
    userId: pref.userId,
    inApp: pref.inApp,
    email: pref.email,
    sms: pref.sms,
  };
}

export async function ensureNotificationPreference(userId: string): Promise<NotificationPreferences> {
  const existing = await prisma.notificationPreference.findUnique({ where: { userId } });
  if (existing) return serializePref(existing);

  const created = await prisma.notificationPreference.create({ data: { userId } });
  return serializePref(created);
}

export async function getNotificationPreferences(userId: string): Promise<NotificationPreferences> {
  return ensureNotificationPreference(userId);
}

export async function updateNotificationPreferences(
  userId: string,
  prefs: { inApp?: boolean; email?: boolean; sms?: boolean },
): Promise<NotificationPreferences> {
  await ensureNotificationPreference(userId);
  const updated = await prisma.notificationPreference.update({
    where: { userId },
    data: {
      ...(prefs.inApp !== undefined ? { inApp: prefs.inApp } : {}),
      ...(prefs.email !== undefined ? { email: prefs.email } : {}),
      ...(prefs.sms !== undefined ? { sms: prefs.sms } : {}),
    },
  });
  return serializePref(updated);
}

export interface CreateNotificationInput {
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  channel?: NotificationChannel;
}

export interface NotificationRecord {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  channel: NotificationChannel;
  status: NotificationStatus;
  readAt: Date | null;
  createdAt: Date;
}

function serializeNotification(n: {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  data: string | null;
  channel: string;
  status: string;
  readAt: Date | null;
  createdAt: Date;
}): NotificationRecord {
  return {
    id: n.id,
    userId: n.userId,
    type: n.type,
    title: n.title,
    body: n.body,
    data: n.data ? (JSON.parse(n.data) as Record<string, unknown>) : null,
    channel: n.channel as NotificationChannel,
    status: n.status as NotificationStatus,
    readAt: n.readAt,
    createdAt: n.createdAt,
  };
}

export async function createNotification(userId: string, input: CreateNotificationInput): Promise<NotificationRecord> {
  const created = await prisma.notification.create({
    data: {
      userId,
      type: input.type,
      title: input.title,
      body: input.body,
      data: input.data ? JSON.stringify(input.data) : null,
      channel: input.channel ?? "in_app",
      status: "unread",
    },
  });
  return serializeNotification(created);
}

export interface ListNotificationsOptions {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
  type?: string;
}

export async function listNotifications(userId: string, opts?: ListNotificationsOptions) {
  const page = opts?.page ?? 1;
  const limit = opts?.limit ?? 20;

  const where: Record<string, unknown> = { userId, deletedAt: null };
  if (opts?.unreadOnly) where.status = "unread";
  if (opts?.type) where.type = opts.type;

  const [items, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.notification.count({ where }),
  ]);

  return {
    items: items.map(serializeNotification),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getUnreadCount(userId: string): Promise<number> {
  return prisma.notification.count({ where: { userId, status: "unread", deletedAt: null } });
}

export async function markNotificationRead(id: string, userId: string): Promise<NotificationRecord | null> {
  const existing = await prisma.notification.findFirst({ where: { id, userId, deletedAt: null } });
  if (!existing) return null;

  const updated = await prisma.notification.update({
    where: { id },
    data: { status: "read", readAt: new Date() },
  });
  return serializeNotification(updated);
}

export async function markAllNotificationsRead(userId: string): Promise<number> {
  const result = await prisma.notification.updateMany({
    where: { userId, status: "unread", deletedAt: null },
    data: { status: "read", readAt: new Date() },
  });
  return result.count;
}

export async function deleteNotification(id: string, userId: string): Promise<boolean> {
  const existing = await prisma.notification.findFirst({ where: { id, userId, deletedAt: null } });
  if (!existing) return false;

  await softDelete("notification", id);
  return true;
}
