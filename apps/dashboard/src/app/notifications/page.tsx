"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card } from "@thrift/ui";
import type { Notification, NotificationPreferences } from "@thrift/types";
import { useAuth } from "@/lib/auth-context";
import { Bell, CheckCheck, Settings, Trash2 } from "lucide-react";
import {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  fetchNotificationPreferences,
  updateNotificationPreferences,
} from "@/lib/notifications";

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
      <div className={`relative h-[22px] w-10 cursor-pointer rounded-[11px] border-0 transition-colors ${on ? "bg-blue-600" : "bg-slate-200 dark:bg-slate-700"}`}>
        <div className="absolute top-0.5 h-[18px] w-[18px] rounded-full bg-white shadow transition-[left]" style={{ left: on ? "20px" : "2px" }} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1000px] px-[clamp(1rem,3vw,2rem)] pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1">
              <Bell className="w-3.5 h-3.5 text-blue-500" />
              <span>Activity</span>
            </span>
          </div>
          <h3 className="font-display font-bold text-xl sm:text-2xl text-slate-900 dark:text-white mt-1">Notifications</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">You have {count} unread {count === 1 ? "notification" : "notifications"}.</p>
        </div>
        {count > 0 && (
          <button onClick={handleMarkAll} className="btn-primary py-3 px-5 text-xs bg-blue-600 hover:bg-blue-700 text-white shrink-0 self-start md:self-auto shadow-md">
            <CheckCheck className="w-3.5 h-3.5 inline mr-1" /> Mark all as read
          </button>
        )}
      </div>

      <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)] items-start gap-6">
        <div>
          <div className="mb-4 flex gap-2">
            {(["all", "unread"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`cursor-pointer rounded-full border px-4 py-1.5 text-[11px] font-semibold transition-all ${filter === f ? "border-blue-600 bg-blue-600 text-white dark:border-blue-500 dark:bg-blue-500" : "border-slate-200 bg-white text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"}`}
              >
                {f === "all" ? "All" : "Unread"}
              </button>
            ))}
          </div>

          <Card padding="0.5rem" className="min-h-[200px] rounded-3xl">
            {loading ? (
              <div className="p-12 text-center text-[13px] text-slate-400 dark:text-slate-500">Loading notifications…</div>
            ) : items.length === 0 ? (
              <div className="px-4 py-12 text-center">
                <div className="mb-2 text-[#D1D5DB]">
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="mx-auto">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                </div>
                <p className="m-0 text-[13px] text-slate-400 dark:text-slate-500">
                  {filter === "unread" ? "No unread notifications." : "You have no notifications yet."}
                </p>
              </div>
            ) : (
              <div>
                {items.map((n) => {
                  const href = notificationHref(n);
                  const unread = n.status === "unread";
                  const Row = (
                    <div className="flex gap-3 border-b border-slate-100 p-4 transition-colors dark:border-slate-800" style={{ cursor: unread ? "pointer" : "default", backgroundColor: unread ? "rgba(37,99,235,0.03)" : undefined }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = unread ? "rgba(37,99,235,0.06)" : "rgb(248 250 252)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = unread ? "rgba(37,99,235,0.03)" : ""; }}
                    >
                      {unread && (
                        <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-blue-600" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="text-[13px] text-slate-900 dark:text-white" style={{ fontWeight: unread ? 600 : 500 }}>{n.title}</span>
                          <span className="flex-shrink-0 text-[10px] text-[#B0B0B0]">{timeAgo(n.createdAt)}</span>
                        </div>
                        <p className="mt-1.5 text-xs font-light leading-[1.45] text-slate-500 dark:text-slate-400">{n.body}</p>
                      </div>
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(n.id); }}
                        title="Delete"
                        className="flex-shrink-0 cursor-pointer self-start border-0 bg-none p-1 text-[#C9C9C9] hover:text-red-600"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                      </button>
                    </div>
                  );
                  return href && unread ? (
                    <Link key={n.id} href={href} className="block no-underline" onClick={() => handleRead(n)}>
                      {Row}
                    </Link>
                  ) : (
                    <div key={n.id} onClick={() => handleRead(n)}>{Row}</div>
                  );
                })}
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 p-4">
                <button
                  disabled={page <= 1}
                  onClick={() => loadList(page - 1)}
                  className="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-[11px] font-semibold dark:border-slate-700 dark:bg-slate-800" style={{ cursor: page <= 1 ? "default" : "pointer", color: page <= 1 ? "#CCC" : "#717171" }}
                >
                  Previous
                </button>
                <span className="text-[11px] text-slate-400 dark:text-slate-500">Page {page} of {totalPages}</span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => loadList(page + 1)}
                  className="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-[11px] font-semibold dark:border-slate-700 dark:bg-slate-800" style={{ cursor: page >= totalPages ? "default" : "pointer", color: page >= totalPages ? "#CCC" : "#717171" }}
                >
                  Next
                </button>
              </div>
            )}
          </Card>
        </div>

        <Card padding="1.5rem" className="rounded-3xl">
            <div className="flex items-center gap-2 mb-4">
              <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 w-fit">
                <Settings className="w-3.5 h-3.5 text-blue-500" />
                <span>Preferences</span>
              </span>
            </div>
          {prefs ? (
            <div className="flex flex-col gap-1">
              {([
                { key: "inApp" as const, label: "In-App", desc: "See notifications in your dashboard." },
                { key: "email" as const, label: "Email", desc: "Receive notifications by email." },
                { key: "sms" as const, label: "SMS", desc: "Receive critical alerts by text." },
              ]).map((row) => (
                <div key={row.key} className="flex items-center justify-between border-b border-slate-100 py-3 dark:border-slate-800">
                  <div className="pr-4">
                    <span className="block text-xs font-medium text-slate-900 dark:text-white">{row.label}</span>
                    <span className="text-[11px] font-light text-slate-500 dark:text-slate-400">{row.desc}</span>
                  </div>
                  <button onClick={() => handlePrefToggle(row.key, !prefs[row.key])} aria-label={`Toggle ${row.label}`} className="cursor-pointer border-0 bg-none p-0">
                    <Toggle on={prefs[row.key]} />
                  </button>
                </div>
              ))}
              {prefsSaved && <span className="mt-2 text-[11px] font-semibold text-emerald-600">Preferences saved!</span>}
            </div>
          ) : (
            <div className="p-4 text-center text-xs text-slate-400 dark:text-slate-500">Loading preferences…</div>
          )}
        </Card>
      </div>
    </div>
  );
}
