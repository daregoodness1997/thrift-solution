"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { config, BrandConfig } from "@thrift/config";
import type { Notification } from "@thrift/types";
import {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
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

export function NotificationBell({ cfg = fallback }: { cfg?: BrandConfig }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const loadCount = useCallback(async () => {
    try {
      setCount(await fetchUnreadCount());
    } catch {}
  }, []);

  const loadList = useCallback(
    async (pageNum: number, append = false) => {
      try {
        setLoading(true);
        const res = await fetchNotifications({ page: pageNum, limit: 8 });
        setItems((prev) => (append ? [...prev, ...res.items] : res.items));
        setHasMore(res.page < res.totalPages);
        setPage(res.page);
      } catch {
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    loadCount();
    const interval = setInterval(loadCount, 60000);
    return () => clearInterval(interval);
  }, [loadCount]);

  useEffect(() => {
    if (open) loadList(1);
  }, [open, loadList]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const handleOpen = async () => {
    const next = !open;
    setOpen(next);
    if (next) {
      await loadCount();
    }
  };

  const handleItemClick = async (n: Notification) => {
    if (n.status === "unread") {
      try {
        const updated = await markNotificationRead(n.id);
        setItems((prev) => prev.map((x) => (x.id === n.id ? updated : x)));
        setCount((c) => Math.max(0, c - 1));
      } catch {}
    }
    const href = notificationHref(n);
    setOpen(false);
    if (href) router.push(href);
  };

  const handleMarkAll = async () => {
    try {
      await markAllNotificationsRead();
      setItems((prev) => prev.map((x) => ({ ...x, status: "read", readAt: new Date().toISOString() })));
      setCount(0);
    } catch {}
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await deleteNotification(id);
      const removed = items.find((x) => x.id === id);
      setItems((prev) => prev.filter((x) => x.id !== id));
      if (removed?.status === "unread") setCount((c) => Math.max(0, c - 1));
    } catch {}
  };

  const loadMore = () => {
    if (!loading && hasMore) loadList(page + 1, true);
  };

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <button
        onClick={handleOpen}
        aria-label="Notifications"
        title="Notifications"
        style={{
          position: "relative",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "0.5rem",
          color: open ? cfg.colors.primary : "#717171",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "0.5rem",
          transition: "all 0.2s ease",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = cfg.colors.primary; e.currentTarget.style.backgroundColor = "#F5F7F5"; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = open ? cfg.colors.primary : "#717171"; e.currentTarget.style.backgroundColor = "transparent"; }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {count > 0 && (
          <span
            style={{
              position: "absolute",
              top: "2px",
              right: "2px",
              minWidth: "16px",
              height: "16px",
              padding: "0 4px",
              borderRadius: "9999px",
              backgroundColor: "#DC2626",
              color: "#fff",
              fontSize: "9px",
              fontWeight: 700,
              lineHeight: "16px",
              textAlign: "center",
              border: "2px solid #fff",
            }}
          >
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 0.5rem)",
            right: 0,
            width: "360px",
            maxWidth: "calc(100vw - 2rem)",
            backgroundColor: "#ffffff",
            borderRadius: "1rem",
            boxShadow: "0 16px 48px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04)",
            zIndex: 50,
            overflow: "hidden",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.875rem 1rem", borderBottom: "1px solid #F0F0F0" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#2D2D2D", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Notifications
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              {count > 0 && (
                <button onClick={handleMarkAll} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "11px", fontWeight: 600, color: cfg.colors.primary }}>
                  Mark all read
                </button>
              )}
              <Link href="/notifications" onClick={() => setOpen(false)} style={{ fontSize: "11px", fontWeight: 600, color: "#717171", textDecoration: "none" }}>
                View all
              </Link>
            </div>
          </div>

          <div style={{ maxHeight: "380px", overflowY: "auto" }}>
            {loading && items.length === 0 ? (
              <div style={{ padding: "2rem", textAlign: "center", fontSize: "12px", color: "#999" }}>Loading…</div>
            ) : items.length === 0 ? (
              <div style={{ padding: "2.5rem 1rem", textAlign: "center" }}>
                <div style={{ color: "#D1D5DB", marginBottom: "0.5rem" }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto" }}>
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                </div>
                <p style={{ fontSize: "12px", color: "#999", margin: 0 }}>You're all caught up.</p>
              </div>
            ) : (
              items.map((n) => {
                const href = notificationHref(n);
                const unread = n.status === "unread";
                return (
                  <div
                    key={n.id}
                    onClick={() => handleItemClick(n)}
                    style={{
                      display: "flex",
                      gap: "0.625rem",
                      padding: "0.75rem 1rem",
                      cursor: "pointer",
                      borderBottom: "1px solid #F6F6F6",
                      backgroundColor: unread ? `${cfg.colors.primary}08` : "#ffffff",
                      transition: "background 0.15s ease",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = unread ? `${cfg.colors.primary}12` : "#FAFAFA"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = unread ? `${cfg.colors.primary}08` : "#ffffff"; }}
                  >
                    {unread && (
                      <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: cfg.colors.primary, flexShrink: 0, marginTop: "5px" }} />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "0.5rem" }}>
                        <span style={{ fontSize: "12px", fontWeight: unread ? 600 : 500, color: "#2D2D2D" }}>{n.title}</span>
                        <span style={{ fontSize: "10px", color: "#B0B0B0", flexShrink: 0 }}>{timeAgo(n.createdAt)}</span>
                      </div>
                      <p style={{ fontSize: "11px", color: "#717171", fontWeight: 300, margin: "0.25rem 0 0", lineHeight: 1.4 }}>{n.body}</p>
                    </div>
                    <button
                      onClick={(e) => handleDelete(e, n.id)}
                      title="Dismiss"
                      style={{ background: "none", border: "none", cursor: "pointer", color: "#C9C9C9", padding: "0.125rem", alignSelf: "flex-start", flexShrink: 0 }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = "#DC2626"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = "#C9C9C9"; }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                    </button>
                  </div>
                );
              })
            )}

            {hasMore && (
              <button
                onClick={loadMore}
                disabled={loading}
                style={{ width: "100%", padding: "0.75rem", background: "none", border: "none", borderTop: "1px solid #F0F0F0", cursor: "pointer", fontSize: "11px", fontWeight: 600, color: cfg.colors.primary }}
              >
                {loading ? "Loading…" : "Load more"}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
