"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
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
    <div ref={wrapRef} className="relative">
      <button
        onClick={handleOpen}
        aria-label="Notifications"
        title="Notifications"
        className="relative bg-none border-none cursor-pointer p-2 flex items-center justify-center rounded-lg transition-all duration-200"
        style={{ color: open ? cfg.colors.primary : "#717171" }}
        onMouseEnter={(e) => { e.currentTarget.style.color = cfg.colors.primary; e.currentTarget.style.backgroundColor = "#F5F7F5"; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = open ? cfg.colors.primary : "#717171"; e.currentTarget.style.backgroundColor = "transparent"; }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {count > 0 && (
          <span
            className="absolute top-0.5 right-0.5 min-w-4 h-4 px-1 rounded-full bg-red-600 text-white text-[9px] font-bold leading-4 text-center border-2 border-white"
          >
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>

      {open && typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed right-3 top-3 w-[360px] max-w-[calc(100vw-1.5rem)] bg-white rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.12),0_0_0_1px_rgba(0,0,0,0.04)] z-[100] overflow-hidden"
          >
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100">
            <span className="text-xs font-bold text-brand-dark uppercase tracking-[0.08em]">
              Notifications
            </span>
            <div className="flex items-center gap-2">
              {count > 0 && (
                <button onClick={handleMarkAll} className="bg-none border-none cursor-pointer text-[11px] font-semibold" style={{ color: cfg.colors.primary }}>
                  Mark all read
                </button>
              )}
              <Link href="/notifications" onClick={() => setOpen(false)} className="text-[11px] font-semibold text-gray-500 no-underline">
                View all
              </Link>
            </div>
          </div>

          <div className="max-h-[380px] overflow-y-auto">
            {loading && items.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-400">Loading…</div>
            ) : items.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <div className="text-[#D1D5DB] mb-2">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="mx-auto">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                </div>
                <p className="text-xs text-gray-400">You're all caught up.</p>
              </div>
            ) : (
              items.map((n) => {
                const href = notificationHref(n);
                const unread = n.status === "unread";
                return (
                  <div
                    key={n.id}
                    onClick={() => handleItemClick(n)}
                    className="flex gap-2.5 px-4 py-3 cursor-pointer border-b border-[#F6F6F6] transition-colors duration-150"
                    style={{ backgroundColor: unread ? `${cfg.colors.primary}08` : "#ffffff" }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = unread ? `${cfg.colors.primary}12` : "#FAFAFA"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = unread ? `${cfg.colors.primary}08` : "#ffffff"; }}
                  >
                    {unread && (
                      <span className="w-2 h-2 rounded-full flex-none mt-[5px]" style={{ backgroundColor: cfg.colors.primary }} />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline gap-2">
                        <span className="text-xs text-brand-dark" style={{ fontWeight: unread ? 600 : 500 }}>{n.title}</span>
                        <span className="text-[10px] text-[#B0B0B0] flex-none">{timeAgo(n.createdAt)}</span>
                      </div>
                      <p className="text-[11px] text-gray-500 font-light mt-1 leading-[1.4]">{n.body}</p>
                    </div>
                    <button
                      onClick={(e) => handleDelete(e, n.id)}
                      title="Dismiss"
                      className="bg-none border-none cursor-pointer text-[#C9C9C9] p-0.5 self-start flex-none"
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
                className="w-full py-3 bg-none border-none border-t border-gray-100 cursor-pointer text-[11px] font-semibold"
                style={{ color: cfg.colors.primary }}
              >
                {loading ? "Loading…" : "Load more"}
              </button>
            )}
          </div>
        </div>
          ,
          document.body,
        )}
    </div>
  );
}
