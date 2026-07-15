"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { config, BrandConfig } from "@thrift/config";
import { Card, Button } from "@thrift/ui";
import type { Notification, NotificationPreferences } from "@thrift/types";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/PageHeader";
import {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  fetchNotificationPreferences,
  updateNotificationPreferences,
} from "@/lib/notifications";

const fallback = config;

function timeAgo(date: string): string {
  const d = new Date(date).getTime();
  const diff = Date.now() - d;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
}

function notificationHref(n: Notification): string | null {
  const data = n.data as Record<string, unknown> | null;
  if (!data) return null;
  if (data.href) return String(data.href);
  if (data.transactionId) return `/transactions/${data.transactionId}`;
  if (data.circleId) return `/my-circles/${data.circleId}`;
  if (data.loanId) return `/loans`;
  if (data.listingId) return `/marketplace/${data.listingId}`;
  if (data.jobId) return `/jobs/${data.jobId}`;
  return null;
}

export default function NotificationsPage() {
  const { user, token } = useAuth();
  const [items, setItems] = useState<Notification[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const [prefsSaved, setPrefsSaved] = useState(false);

  const [cfg] = useState<BrandConfig>(fallback);

  const loadCount = useCallback(async () => {
    try {
      setCount(await fetchUnreadCount());
    } catch {}
  }, []);

  const loadList = useCallback(
    async (pageNum: number) => {
      try {
        setLoading(true);
        const res = await fetchNotifications({ page: pageNum, limit: 15, unreadOnly: filter === "unread" });
        setItems(res.items);
        setTotalPages(res.totalPages);
        setPage(res.page);
      } catch {
      } finally {
        setLoading(false);
      }
    },
    [filter],
  );

  useEffect(() => {
    if (!token) return;
    loadList(1);
    loadCount();
    fetchNotificationPreferences()
      .then(setPrefs)
      .catch(() => {});
  }, [token, loadList, loadCount]);

  useEffect(() => {
    loadList(1);
  }, [filter, loadList]);

  const handleRead = async (n: Notification) => {
    if (n.status === "unread") {
      try {
        const updated = await markNotificationRead(n.id);
        setItems((prev) => prev.map((x) => (x.id === n.id ? updated : x)));
        setCount((c) => Math.max(0, c - 1));
      } catch {}
    }
  };

  const handleMarkAll = async () => {
    try {
      await markAllNotificationsRead();
      setItems((prev) => prev.map((x) => ({ ...x, status: "read", readAt: new Date().toISOString() })));
      setCount(0);
    } catch {}
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteNotification(id);
      const removed = items.find((x) => x.id === id);
      setItems((prev) => prev.filter((x) => x.id !== id));
      if (removed?.status === "unread") setCount((c) => Math.max(0, c - 1));
    } catch {}
  };

  const handlePrefToggle = async (key: "inApp" | "email" | "sms", value: boolean) => {
    if (!prefs) return;
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    setPrefsSaved(false);
    try {
      const updated = await updateNotificationPreferences({ [key]: value });
      setPrefs(updated);
      setPrefsSaved(true);
      setTimeout(() => setPrefsSaved(false), 2000);
    } catch {
      setPrefs(prefs);
    }
  };

  function Toggle({ on }: { on: boolean }) {
    return (
      <div style={{ width: "40px", height: "22px", borderRadius: "11px", border: "none", backgroundColor: on ? cfg.colors.primary : "#E5E7EB", cursor: "pointer", position: "relative", transition: "background 0.2s" }}>
        <div style={{ width: "18px", height: "18px", borderRadius: "50%", backgroundColor: "#ffffff", position: "absolute", top: "2px", left: on ? "20px" : "2px", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "0 clamp(1rem, 3vw, 2rem) 3rem" }}>
      <PageHeader
        badgeLabel="Activity"
        heading="Notifications"
        description={`You have ${count} unread ${count === 1 ? "notification" : "notifications"}.`}
        right={
          count > 0 ? (
            <Button onClick={handleMarkAll} style={{ fontSize: "12px" }}>Mark all as read</Button>
          ) : undefined
        }
      />

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1fr)", gap: "1.5rem", alignItems: "start" }}>
        <div>
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
            {(["all", "unread"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: "0.4rem 1rem",
                  borderRadius: "9999px",
                  fontSize: "11px",
                  fontWeight: 600,
                  cursor: "pointer",
                  border: "1px solid",
                  borderColor: filter === f ? cfg.colors.primary : "#EAEAEA",
                  backgroundColor: filter === f ? cfg.colors.primary : "#ffffff",
                  color: filter === f ? "#ffffff" : "#717171",
                  transition: "all 0.2s ease",
                }}
              >
                {f === "all" ? "All" : "Unread"}
              </button>
            ))}
          </div>

          <Card padding="0.5rem" style={{ minHeight: "200px" }}>
            {loading ? (
              <div style={{ padding: "3rem", textAlign: "center", fontSize: "13px", color: "#999" }}>Loading notifications…</div>
            ) : items.length === 0 ? (
              <div style={{ padding: "3rem 1rem", textAlign: "center" }}>
                <div style={{ color: "#D1D5DB", marginBottom: "0.5rem" }}>
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto" }}>
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                </div>
                <p style={{ fontSize: "13px", color: "#999", margin: 0 }}>
                  {filter === "unread" ? "No unread notifications." : "You have no notifications yet."}
                </p>
              </div>
            ) : (
              <div>
                {items.map((n) => {
                  const href = notificationHref(n);
                  const unread = n.status === "unread";
                  const Row = (
                    <div
                      style={{
                        display: "flex",
                        gap: "0.75rem",
                        padding: "1rem",
                        cursor: unread ? "pointer" : "default",
                        borderBottom: "1px solid #F4F4F4",
                        backgroundColor: unread ? `${cfg.colors.primary}08` : "#ffffff",
                        transition: "background 0.15s ease",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = unread ? `${cfg.colors.primary}12` : "#FAFAFA"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = unread ? `${cfg.colors.primary}08` : "#ffffff"; }}
                    >
                      {unread && (
                        <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: cfg.colors.primary, flexShrink: 0, marginTop: "6px" }} />
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "0.5rem" }}>
                          <span style={{ fontSize: "13px", fontWeight: unread ? 600 : 500, color: "#2D2D2D" }}>{n.title}</span>
                          <span style={{ fontSize: "10px", color: "#B0B0B0", flexShrink: 0 }}>{timeAgo(n.createdAt)}</span>
                        </div>
                        <p style={{ fontSize: "12px", color: "#717171", fontWeight: 300, margin: "0.35rem 0 0", lineHeight: 1.45 }}>{n.body}</p>
                      </div>
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(n.id); }}
                        title="Delete"
                        style={{ background: "none", border: "none", cursor: "pointer", color: "#C9C9C9", padding: "0.25rem", alignSelf: "flex-start", flexShrink: 0 }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = "#DC2626"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = "#C9C9C9"; }}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                      </button>
                    </div>
                  );
                  return href && unread ? (
                    <Link key={n.id} href={href} style={{ textDecoration: "none", display: "block" }} onClick={() => handleRead(n)}>
                      {Row}
                    </Link>
                  ) : (
                    <div key={n.id} onClick={() => handleRead(n)}>{Row}</div>
                  );
                })}
              </div>
            )}

            {totalPages > 1 && (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "0.75rem", padding: "1rem" }}>
                <button
                  disabled={page <= 1}
                  onClick={() => loadList(page - 1)}
                  style={{ padding: "0.4rem 1rem", borderRadius: "9999px", fontSize: "11px", fontWeight: 600, cursor: page <= 1 ? "default" : "pointer", border: "1px solid #EAEAEA", backgroundColor: "#fff", color: page <= 1 ? "#CCC" : "#717171" }}
                >
                  Previous
                </button>
                <span style={{ fontSize: "11px", color: "#999" }}>Page {page} of {totalPages}</span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => loadList(page + 1)}
                  style={{ padding: "0.4rem 1rem", borderRadius: "9999px", fontSize: "11px", fontWeight: 600, cursor: page >= totalPages ? "default" : "pointer", border: "1px solid #EAEAEA", backgroundColor: "#fff", color: page >= totalPages ? "#CCC" : "#717171" }}
                >
                  Next
                </button>
              </div>
            )}
          </Card>
        </div>

        <Card padding="1.5rem">
          <h3 style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#999", fontWeight: 700, marginBottom: "1rem" }}>Notification Preferences</h3>
          {prefs ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              {([
                { key: "inApp" as const, label: "In-App", desc: "See notifications in your dashboard." },
                { key: "email" as const, label: "Email", desc: "Receive notifications by email." },
                { key: "sms" as const, label: "SMS", desc: "Receive critical alerts by text." },
              ]).map((row) => (
                <div key={row.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 0", borderBottom: "1px solid #F0F0F0" }}>
                  <div style={{ paddingRight: "1rem" }}>
                    <span style={{ fontSize: "12px", fontWeight: 500, color: "#2D2D2D", display: "block" }}>{row.label}</span>
                    <span style={{ fontSize: "11px", color: "#717171", fontWeight: 300 }}>{row.desc}</span>
                  </div>
                  <button onClick={() => handlePrefToggle(row.key, !prefs[row.key])} aria-label={`Toggle ${row.label}`} style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}>
                    <Toggle on={prefs[row.key]} />
                  </button>
                </div>
              ))}
              {prefsSaved && <span style={{ fontSize: "11px", color: "#059669", fontWeight: 600, marginTop: "0.5rem" }}>Preferences saved!</span>}
            </div>
          ) : (
            <div style={{ padding: "1rem", textAlign: "center", fontSize: "12px", color: "#999" }}>Loading preferences…</div>
          )}
        </Card>
      </div>
    </div>
  );
}
