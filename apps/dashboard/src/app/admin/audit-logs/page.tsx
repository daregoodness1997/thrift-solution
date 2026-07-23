"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
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
  actorEmail: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  metadata: string | null;
  ipAddress: string | null;
  createdAt: string;
  actor: { id: string; name: string; email: string } | null;
}

export default function AdminAuditLogsPage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const isAdmin = user?.role === "admin" || user?.role === "superadmin";

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [entity, setEntity] = useState("");

  useEffect(() => {
    if (!authLoading && user && !isAdmin) router.replace("/");
  }, [authLoading, user, isAdmin, router]);

  const fetchLogs = useCallback(async () => {
    if (!token || !isAdmin) { setLoading(false); return; }
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
      if (entity) params.set("entity", entity);
      const res = await fetch(`${API_URL}/api/admin/audit-logs?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) {
        setLogs(data.data.items || []);
        setTotalPages(data.data.totalPages || 1);
        setTotal(data.data.total || 0);
      }
    } catch {}
    setLoading(false);
  }, [token, isAdmin, page, entity]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  if (authLoading || !isAdmin) return null;

  const entities = ["", "user", "loan", "kyc", "circle"];

  const logColumns: SimpleColumn<AuditLog>[] = [
    {
      key: "createdAt",
      header: "When",
      render: (log) => <span className="whitespace-nowrap text-slate-500 dark:text-slate-400">{formatDate(new Date(log.createdAt))}</span>,
    },
    {
      key: "actor",
      header: "Actor",
      render: (log) => <span className="text-slate-900 dark:text-white">{log.actor?.email || log.actorEmail || "—"}</span>,
    },
    {
      key: "action",
      header: "Action",
      render: (log) => (
        <span className="rounded-md bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 font-mono text-[9px] font-bold text-blue-600 dark:text-blue-400">{log.action}</span>
      ),
    },
    {
      key: "entity",
      header: "Entity",
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
      render: (log) => <span className="max-w-[260px] truncate font-mono text-[11px] text-slate-500 dark:text-slate-400">{log.metadata || "—"}</span>,
    },
  ];

  return (
    <div className="mx-auto max-w-[1280px] p-[clamp(1rem,3vw,2rem)]">
      <PageHeader badgeLabel="Admin" heading="Audit" accentText="Log" description="System-wide record of administrative actions." />

      <FadeInUp delay={200}>
        <Card padding="1.5rem">
          <div className="mb-4 flex w-fit flex-wrap gap-1 rounded-lg bg-slate-100 dark:bg-slate-800 p-1">
            {entities.map((e) => (
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

          {loading ? (
            <div className="p-12 text-center text-[13px] text-slate-500 dark:text-slate-400">Loading logs...</div>
          ) : logs.length === 0 ? (
            <div className="p-8 text-center text-[13px] text-slate-500 dark:text-slate-400">No audit logs found.</div>
          ) : (
            <SimpleTable columns={logColumns} data={logs} minWidth="760px" />
          )}
          <Pagination page={page} totalPages={totalPages} total={total} limit={LIMIT} onPageChange={setPage} loading={loading} />
        </Card>
      </FadeInUp>
    </div>
  );
}
