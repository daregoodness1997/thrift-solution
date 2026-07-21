import type {
  Notification,
  NotificationListResponse,
  NotificationPreferences,
} from "@thrift/types";
import { fetchDeduped, invalidateCache } from "./fetch-cache";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

async function authedFetch<T>(path: string, init?: RequestInit, ttlMs = 30_000): Promise<T> {
  const token = localStorage.getItem("token");
  const data = await fetchDeduped(`${API_URL}/api/notifications${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers || {}),
    },
  }, ttlMs);
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
  const data = await authedFetch<{ count: number }>("/unread-count", undefined, 60_000);
  return data.count;
}

export async function markNotificationRead(id: string): Promise<Notification> {
  const result = await authedFetch<Notification>(`/${id}/read`, { method: "POST" });
  invalidateCache("/unread-count");
  invalidateCache("/api/notifications");
  return result;
}

export async function markAllNotificationsRead(): Promise<number> {
  const data = await authedFetch<{ count: number }>("/read-all", { method: "POST" });
  invalidateCache("/unread-count");
  invalidateCache("/api/notifications");
  return data.count;
}

export async function deleteNotification(id: string): Promise<void> {
  const result = await authedFetch<{ deleted: boolean }>(`/${id}`, { method: "DELETE" });
  invalidateCache("/unread-count");
  invalidateCache("/api/notifications");
  return result;
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
