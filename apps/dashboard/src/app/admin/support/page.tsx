"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, Button, StatCard } from "@thrift/ui";
import { useAuth } from "@/lib/auth-context";
import { Headphones } from "lucide-react";
import {
  TICKET_STATUS_CONFIG,
  TICKET_PRIORITY_CONFIG,
  type Ticket,
  type TicketListResponse,
  type TicketStats,
} from "@thrift/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const LIMIT = 15;

export default function AdminSupportPage() {
  const { user, token } = useAuth();
  const router = useRouter();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<TicketStats | null>(null);

  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const fetchTickets = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(LIMIT),
      });
      if (statusFilter) params.set("status", statusFilter);
      if (priorityFilter) params.set("priority", priorityFilter);
      if (assigneeFilter) params.set("assigneeId", assigneeFilter);
      if (search.trim()) params.set("search", search.trim());
      const res = await fetch(`${API_URL}/api/support?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        const payload = data.data as TicketListResponse;
        setTickets(payload.items || []);
        setTotal(payload.total || 0);
        setTotalPages(payload.totalPages || 1);
      }
    } catch {}
    setLoading(false);
  }, [token, page, statusFilter, priorityFilter, assigneeFilter, search]);

  const fetchStats = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/support/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setStats(data.data);
    } catch {}
  }, [token]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const runSearch = () => {
    setPage(1);
    setSearch(searchInput);
  };

  return (
    <div className="mx-auto max-w-[1280px] p-[clamp(1rem,3vw,2rem)]">
      <div className="mb-8 pt-2 pb-6 border-b border-slate-200/80 dark:border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/80 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1">
              <Headphones className="w-3.5 h-3.5 text-blue-500" />
              <span>Support</span>
            </span>
          </div>
          <h3 className="font-display font-bold text-xl sm:text-2xl text-slate-900 dark:text-white mt-1">Ticket <span className="bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 bg-clip-text font-display font-bold text-transparent">Inbox</span></h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Manage and respond to member support tickets.</p>
        </div>
      </div>

      <div className="mx-auto max-w-[1280px] p-[clamp(1rem,3vw,2rem)]">
        <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard label="Open" value={String(stats?.open ?? 0)} />
          <StatCard
            label="In Progress"
            value={String(stats?.inProgress ?? 0)}
          />
          <StatCard label="Unassigned" value={String(stats?.unassigned ?? 0)} />
          <StatCard label="Urgent" value={String(stats?.urgent ?? 0)} />
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <FilterChip
            active={statusFilter === ""}
            onClick={() => {
              setPage(1);
              setStatusFilter("");
            }}
          >
            All
          </FilterChip>
          {Object.entries(TICKET_STATUS_CONFIG).map(([key, cfg]) => (
            <FilterChip
              key={key}
              active={statusFilter === key}
              onClick={() => {
                setPage(1);
                setStatusFilter(key);
              }}
            >
              {cfg.label}
            </FilterChip>
          ))}
        </div>

        <div className="mb-4 flex flex-wrap gap-3">
          <select
            value={priorityFilter}
            onChange={(e) => {
              setPage(1);
              setPriorityFilter(e.target.value);
            }}
            className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-xs text-slate-900 dark:text-white outline-none focus:border-blue-600"
          >
            <option value="">All priorities</option>
            {Object.entries(TICKET_PRIORITY_CONFIG).map(([k, c]) => (
              <option key={k} value={k}>
                {c.label}
              </option>
            ))}
          </select>
          <select
            value={assigneeFilter}
            onChange={(e) => {
              setPage(1);
              setAssigneeFilter(e.target.value);
            }}
            className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-xs text-slate-900 dark:text-white outline-none focus:border-blue-600"
          >
            <option value="">Anyone</option>
            <option value="unassigned">Unassigned</option>
            <option value={user?.id ?? ""}>Assigned to me</option>
          </select>
          <div className="flex flex-1 gap-2">
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && runSearch()}
              placeholder="Search tickets..."
              className="min-w-0 flex-1 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-xs text-slate-900 dark:text-white outline-none focus:border-blue-600"
            />
            <button className="btn-secondary" onClick={runSearch}>
              Search
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-16 animate-pulse rounded-3xl bg-slate-100 dark:bg-slate-800"
              />
            ))}
          </div>
        ) : tickets.length === 0 ? (
          <Card className="p-10 text-center rounded-3xl">
            <p className="text-sm text-slate-400">
              No tickets match your filters.
            </p>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {tickets.map((t) => (
              <button
                key={t.id}
                onClick={() => router.push(`/admin/support/${t.id}`)}
                className="w-full rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-4 text-left transition-all hover:translate-x-1 hover:border-blue-600/30 hover:shadow-sm"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {t.subject}
                  </span>
                  <ColorfulBadgeInline
                    label={TICKET_STATUS_CONFIG[t.status].label}
                    color={TICKET_STATUS_CONFIG[t.status].color}
                  />
                  <ColorfulBadgeInline
                    label={TICKET_PRIORITY_CONFIG[t.priority].label}
                    color={TICKET_PRIORITY_CONFIG[t.priority].color}
                  />
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                  <span>#{t.id.slice(0, 8)}</span>
                  <span>{t.userName}</span>
                  {t.categoryName && <span>· {t.categoryName}</span>}
                  <span>· {t.messageCount} msg</span>
                  <span>
                    ·{" "}
                    {t.assigneeName ? `Agent: ${t.assigneeName}` : "Unassigned"}
                  </span>
                  <span>· {new Date(t.updatedAt).toLocaleDateString()}</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              className="btn-secondary"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Prev
            </button>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Page {page} of {totalPages} · {total} total
            </span>
            <button
              className="btn-secondary"
              disabled={page === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-[11px] font-semibold transition-all ${
        active
          ? "bg-blue-600 text-white"
          : "bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-blue-600/5"
      }`}
    >
      {children}
    </button>
  );
}

function ColorfulBadgeInline({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="rounded-full px-2 py-0.5 text-[10px] font-semibold border"
      style={{
        backgroundColor: `${color}15`,
        color,
        borderColor: `${color}30`,
      }}
    >
      {label}
    </span>
  );
}
