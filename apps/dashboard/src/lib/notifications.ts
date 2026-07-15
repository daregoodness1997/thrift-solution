import type {
  Notification,
  NotificationListResponse,
  NotificationPreferences,
} from "@thrift/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

async function authedFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_URL}/api/notifications${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers || {}),
    },
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || "Request failed");
  return data.data as T;
}

export interface ListNotificationsParams {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
  type?: string;
}

export async function fetchNotifications(
  params: ListNotificationsParams = {},
): Promise<NotificationListResponse> {
  const search = new URLSearchParams();
  if (params.page) search.set("page", String(params.page));
  if (params.limit) search.set("limit", String(params.limit));
  if (params.unreadOnly) search.set("unreadOnly", "true");
  if (params.type) search.set("type", params.type);
  const qs = search.toString();
  return authedFetch<NotificationListResponse>(qs ? `/?${qs}` : "/");
}

export async function fetchUnreadCount(): Promise<number> {
  const data = await authedFetch<{ count: number }>("/unread-count");
  return data.count;
}

export async function markNotificationRead(id: string): Promise<Notification> {
  return authedFetch<Notification>(`/${id}/read`, { method: "POST" });
}

export async function markAllNotificationsRead(): Promise<number> {
  const data = await authedFetch<{ count: number }>("/read-all", { method: "POST" });
  return data.count;
}

export async function deleteNotification(id: string): Promise<void> {
  await authedFetch<{ deleted: boolean }>(`/${id}`, { method: "DELETE" });
}

export async function fetchNotificationPreferences(): Promise<NotificationPreferences> {
  return authedFetch<NotificationPreferences>("/preferences");
}

export async function updateNotificationPreferences(
  prefs: { inApp?: boolean; email?: boolean; sms?: boolean },
): Promise<NotificationPreferences> {
  return authedFetch<NotificationPreferences>("/preferences", {
    method: "PUT",
    body: JSON.stringify(prefs),
  });
}
