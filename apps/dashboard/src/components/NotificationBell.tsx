"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Notification } from "@thrift/types";
import {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} from "@/lib/notifications";
import { Bell, X } from "lucide-react";

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

export function NotificationBell() {
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
    if (next) await loadCount();
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
      setItems((prev) => prev.map((x) => ({ ...x, status: "read" as const, readAt: new Date().toISOString() })));
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
        className={`relative p-2 rounded-lg transition-colors ${
          open
            ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60"
            : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
        }`}
      >
        <Bell className="w-5 h-5" />
        {count > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-4 h-4 px-1 rounded-full bg-red-600 text-white text-[9px] font-bold leading-4 text-center border-2 border-white dark:border-slate-900">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>

      {open && typeof document !== "undefined" &&
        createPortal(
          <div className="fixed right-3 top-3 w-[360px] max-w-[calc(100vw-1.5rem)] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl z-[100] overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-200 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-[0.08em]">
                Notifications
              </span>
              <div className="flex items-center gap-2">
                {count > 0 && (
                  <button onClick={handleMarkAll} className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline">
                    Mark all read
                  </button>
                )}
                <Link href="/notifications" onClick={() => setOpen(false)} className="text-[11px] font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                  View all
                </Link>
              </div>
            </div>

            <div className="max-h-[380px] overflow-y-auto">
              {loading && items.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">Loading…</div>
              ) : items.length === 0 ? (
                <div className="px-4 py-10 text-center">
                  <Bell className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-400">You&apos;re all caught up.</p>
                </div>
              ) : (
                items.map((n) => {
                  const href = notificationHref(n);
                  const unread = n.status === "unread";
                  return (
                    <div
                      key={n.id}
                      onClick={() => handleItemClick(n)}
                      className={`flex gap-2.5 px-4 py-3 cursor-pointer border-b border-slate-100 dark:border-slate-800 transition-colors ${
                        unread ? "bg-blue-50/50 dark:bg-blue-950/20" : ""
                      } hover:bg-slate-50 dark:hover:bg-slate-800/60`}
                    >
                      {unread && (
                        <span className="w-2 h-2 rounded-full flex-none mt-[5px] bg-blue-600" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline gap-2">
                          <span className={`text-xs text-slate-900 dark:text-white ${unread ? "font-bold" : "font-medium"}`}>{n.title}</span>
                          <span className="text-[10px] text-slate-400 flex-none">{timeAgo(n.createdAt)}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-[1.4]">{n.body}</p>
                      </div>
                      <button
                        onClick={(e) => handleDelete(e, n.id)}
                        title="Dismiss"
                        className="text-slate-300 dark:text-slate-600 hover:text-red-500 p-0.5 self-start flex-none transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}

              {hasMore && (
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="w-full py-3 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                >
                  {loading ? "Loading…" : "Load more"}
                </button>
              )}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
