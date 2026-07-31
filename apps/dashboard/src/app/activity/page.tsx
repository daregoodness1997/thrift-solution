"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, FadeInUp } from "@thrift/ui";
import { formatDate } from "@thrift/utils";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/PageHeader";
import Pagination from "@/components/Pagination";
import { SimpleTable, SimpleColumn } from "@/components/SimpleTable";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const LIMIT = 20;

interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  metadata: string | Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
}

const ENTITIES = ["", "wallet", "loan", "kyc", "marketplace", "jobs", "transfers", "circles", "support", "auth", "user", "donations"];

function parseMetadata(meta: string | Record<string, unknown> | null): Record<string, unknown> | null {
  if (!meta) return null;
  if (typeof meta !== "string") return meta;
  try {
    return JSON.parse(meta);
  } catch {
    return null;
  }
}

function ActivityDetails({ log }: { log: AuditLog }) {
  const meta = parseMetadata(log.metadata);
  const statusCode = meta?.statusCode as number | undefined;
  const method = meta?.method as string | undefined;
  const changes = meta?.changes as unknown;

  const ok = statusCode === undefined || statusCode < 400;
  const statusColor = ok ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" : "bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400";

  const changeText =
    changes === null || changes === undefined
      ? ""
      : typeof changes === "string"
        ? changes
        : JSON.stringify(changes);

  return (
    <div className="min-w-[200px] space-y-1">
      <div className="flex items-center gap-1.5">
        {method && (
          <span className="rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 font-mono text-[9px] font-bold text-slate-500 dark:text-slate-400">{method}</span>
        )}
        {statusCode !== undefined && (
          <span className={`rounded px-1.5 py-0.5 font-mono text-[9px] font-bold ${statusColor}`}>{statusCode}</span>
        )}
        {log.ipAddress && <span className="font-mono text-[9px] text-slate-400">{log.ipAddress}</span>}
      </div>
      {changeText ? (
        <div className="line-clamp-3 whitespace-pre-wrap break-all font-mono text-[10px] leading-relaxed text-slate-500 dark:text-slate-400">
          {changeText}
        </div>
      ) : (
        <div className="text-[10px] italic text-slate-400 dark:text-slate-500">—</div>
      )}
    </div>
  );
}

export default function ActivityPage() {
  const { token } = useAuth();

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [entity, setEntity] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const fetchLogs = useCallback(async () => {
    if (!token) { setLoading(false); return; }
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
      if (entity) params.set("entity", entity);
      if (search) params.set("search", search);
      if (from) params.set("from", from);
      if (to) params.set("to", `${to}T23:59:59.999`);
      const res = await fetch(`${API_URL}/api/user/audit-logs?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) {
        setLogs(data.data.items || []);
        setTotalPages(data.data.totalPages || 1);
        setTotal(data.data.total || 0);
      }
    } catch {}
    setLoading(false);
  }, [token, page, entity, search, from, to]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const applySearch = () => {
    setSearch(searchInput.trim());
    setPage(1);
  };

  const logColumns: SimpleColumn<AuditLog>[] = [
    {
      key: "createdAt",
      header: "When",
      width: "160px",
      render: (log) => <span className="whitespace-nowrap text-slate-500 dark:text-slate-400">{formatDate(new Date(log.createdAt))}</span>,
    },
    {
      key: "action",
      header: "Action",
      width: "190px",
      render: (log) => (
        <span className="rounded-md bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 font-mono text-[9px] font-bold text-blue-600 dark:text-blue-400">{log.action}</span>
      ),
    },
    {
      key: "entity",
      header: "Entity",
      width: "120px",
      render: (log) => (
        <span className="text-slate-500 dark:text-slate-400">
          {log.entity}
          {log.entityId && <span className="block font-mono text-[10px] text-slate-400">{log.entityId.slice(0, 8)}</span>}
        </span>
      ),
    },
    {
      key: "metadata",
      header: "Details",
      render: (log) => <ActivityDetails log={log} />,
    },
  ];

  return (
    <div className="mx-auto max-w-[1280px] p-[clamp(1rem,3vw,2rem)]">
      <PageHeader badgeLabel="Member" heading="My Activity" description="A record of everything you've done on the platform, including changes you made and actions taken on your account." />

      <FadeInUp delay={200}>
        <Card padding="1.5rem">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <div className="flex w-fit flex-wrap gap-1 rounded-lg bg-slate-100 dark:bg-slate-800 p-1">
              {ENTITIES.map((e) => (
                <button key={e || "all"} onClick={() => { setEntity(e); setPage(1); }}
                  className="cursor-pointer rounded-md px-3 py-1.5 text-[11px] font-semibold capitalize transition-colors"
                  style={{
                    backgroundColor: entity === e ? "#ffffff" : "transparent",
                    color: entity === e ? "#2563EB" : "#717171",
                    boxShadow: entity === e ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                  }}>
                  {e || "all"}
                </button>
              ))}
            </div>

            <div className="ml-auto flex flex-wrap items-center gap-2">
              <input
                type="date"
                value={from}
                onChange={(e) => { setFrom(e.target.value); setPage(1); }}
                className="rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-[11px] text-slate-600 dark:text-slate-300"
              />
              <span className="text-[11px] text-slate-400">to</span>
              <input
                type="date"
                value={to}
                onChange={(e) => { setTo(e.target.value); setPage(1); }}
                className="rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-[11px] text-slate-600 dark:text-slate-300"
              />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") applySearch(); }}
                placeholder="Search action, entity..."
                className="w-52 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-[11px] text-slate-600 dark:text-slate-300"
              />
              <button onClick={applySearch}
                className="cursor-pointer rounded-md bg-blue-600 px-3 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-blue-700">
                Search
              </button>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-[13px] text-slate-500 dark:text-slate-400">Loading activity...</div>
          ) : logs.length === 0 ? (
            <div className="p-8 text-center text-[13px] text-slate-500 dark:text-slate-400">No activity found.</div>
          ) : (
            <SimpleTable columns={logColumns} data={logs} minWidth="900px" />
          )}
          <Pagination page={page} totalPages={totalPages} total={total} limit={LIMIT} onPageChange={setPage} loading={loading} />
        </Card>
      </FadeInUp>
    </div>
  );
}
