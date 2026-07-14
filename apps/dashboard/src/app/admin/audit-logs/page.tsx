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
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "clamp(1rem, 3vw, 2rem)" }}>
      <PageHeader badgeLabel="Admin" heading="Audit" accentText="Log" description="System-wide record of administrative actions." />

      <FadeInUp delay={200}>
        <Card padding="1.5rem">
          <div style={{ display: "flex", gap: "0.25rem", backgroundColor: "#F5F7F5", borderRadius: "0.5rem", padding: "0.25rem", marginBottom: "1rem", width: "fit-content", flexWrap: "wrap" }}>
            {entities.map((e) => (
              <button key={e || "all"} onClick={() => { setEntity(e); setPage(1); }}
                style={{ padding: "0.375rem 0.75rem", borderRadius: "0.375rem", fontSize: "11px", fontWeight: 600, border: "none", cursor: "pointer", textTransform: "capitalize",
                  backgroundColor: entity === e ? "#ffffff" : "transparent", color: entity === e ? config.colors.primary : "#717171",
                  boxShadow: entity === e ? "0 1px 3px rgba(0,0,0,0.08)" : "none" }}>
                {e || "all"}
              </button>
            ))}
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "3rem", color: "#999", fontSize: "13px" }}>Loading logs...</div>
          ) : logs.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2rem", color: "#999", fontSize: "13px" }}>No audit logs found.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", fontSize: "12px", borderCollapse: "collapse", minWidth: "760px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #F0F0F0", color: "#999", textTransform: "uppercase", letterSpacing: "0.1em", fontSize: "9px", fontFamily: "'JetBrains Mono', monospace" }}>
                    <th style={{ paddingBottom: "0.75rem", textAlign: "left", fontWeight: 600 }}>When</th>
                    <th style={{ paddingBottom: "0.75rem", textAlign: "left", fontWeight: 600 }}>Actor</th>
                    <th style={{ paddingBottom: "0.75rem", textAlign: "left", fontWeight: 600 }}>Action</th>
                    <th style={{ paddingBottom: "0.75rem", textAlign: "left", fontWeight: 600 }}>Entity</th>
                    <th style={{ paddingBottom: "0.75rem", textAlign: "left", fontWeight: 600 }}>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} style={{ borderBottom: "1px solid #F5F5F5" }}>
                      <td style={{ padding: "0.75rem 0", color: "#717171", whiteSpace: "nowrap" }}>{formatDate(new Date(log.createdAt))}</td>
                      <td style={{ padding: "0.75rem 0", color: "#2D2D2D" }}>{log.actor?.email || log.actorEmail || "—"}</td>
                      <td style={{ padding: "0.75rem 0" }}>
                        <span style={{ fontSize: "9px", fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", padding: "0.125rem 0.5rem", borderRadius: "0.375rem", backgroundColor: `${config.colors.primary}12`, color: config.colors.primary }}>{log.action}</span>
                      </td>
                      <td style={{ padding: "0.75rem 0", color: "#717171" }}>
                        {log.entity}
                        {log.entityId && <span style={{ fontSize: "10px", color: "#B0B0B0", fontFamily: "'JetBrains Mono', monospace", display: "block" }}>{log.entityId.slice(0, 8)}</span>}
                      </td>
                      <td style={{ padding: "0.75rem 0", color: "#999", fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", maxWidth: "260px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{log.metadata || "—"}</td>
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
