"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { config } from "@thrift/config";
import { Card, FadeInUp } from "@thrift/ui";
import { formatDate } from "@thrift/utils";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/PageHeader";
import Pagination from "@/components/Pagination";

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

  return (
    <div className="mx-auto max-w-[1280px] p-[clamp(1rem,3vw,2rem)]">
      <PageHeader badgeLabel="Admin" heading="Audit" accentText="Log" description="System-wide record of administrative actions." />

      <FadeInUp delay={200}>
        <Card padding="1.5rem">
          <div className="mb-4 flex w-fit flex-wrap gap-1 rounded-lg bg-gray-100 p-1">
            {entities.map((e) => (
              <button key={e || "all"} onClick={() => { setEntity(e); setPage(1); }}
                className="cursor-pointer rounded-md px-3 py-1.5 text-[11px] font-semibold capitalize"
                style={{ backgroundColor: entity === e ? "#ffffff" : "transparent", color: entity === e ? config.colors.primary : "#717171", boxShadow: entity === e ? "0 1px 3px rgba(0,0,0,0.08)" : "none" }}>
                {e || "all"}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="p-12 text-center text-[13px] text-gray-500">Loading logs...</div>
          ) : logs.length === 0 ? (
            <div className="p-8 text-center text-[13px] text-gray-500">No audit logs found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[12px] min-w-[760px]">
                <thead>
                  <tr className="border-b border-gray-100 font-mono text-[9px] uppercase tracking-[0.1em] text-gray-500">
                    <th className="pb-3 text-left font-semibold">When</th>
                    <th className="pb-3 text-left font-semibold">Actor</th>
                    <th className="pb-3 text-left font-semibold">Action</th>
                    <th className="pb-3 text-left font-semibold">Entity</th>
                    <th className="pb-3 text-left font-semibold">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b border-gray-100">
                      <td className="whitespace-nowrap py-3 text-gray-500">{formatDate(new Date(log.createdAt))}</td>
                      <td className="py-3 text-brand-dark">{log.actor?.email || log.actorEmail || "—"}</td>
                      <td className="py-3">
                        <span className="rounded-md px-2 py-0.5 font-mono text-[9px] font-bold" style={{ backgroundColor: `${config.colors.primary}12`, color: config.colors.primary }}>{log.action}</span>
                      </td>
                      <td className="py-3 text-gray-500">
                        {log.entity}
                        {log.entityId && <span className="block font-mono text-[10px] text-[#B0B0B0]">{log.entityId.slice(0, 8)}</span>}
                      </td>
                      <td className="max-w-[260px] truncate py-3 font-mono text-[11px] text-gray-500">{log.metadata || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Pagination page={page} totalPages={totalPages} total={total} limit={LIMIT} onPageChange={setPage} loading={loading} />
        </Card>
      </FadeInUp>
    </div>
  );
}
