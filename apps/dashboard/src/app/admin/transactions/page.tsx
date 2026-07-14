"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { config } from "@thrift/config";
import { Card, FadeIn, FadeInUp } from "@thrift/ui";
import { formatNaira, formatDate } from "@thrift/utils";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/PageHeader";
import Pagination from "@/components/Pagination";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const LIMIT = 20;

interface Txn {
  id: string;
  type: string;
  amount: number;
  status: string;
  reference?: string;
  description?: string;
  createdAt: string;
  user?: { id: string; name: string; email: string };
}

export default function AdminTransactionsPage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const isAdmin = user?.role === "admin" || user?.role === "superadmin";

  const [items, setItems] = useState<Txn[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [stats, setStats] = useState<{ totalCount: number; byType: { type: string; total: number; count: number }[] }>({ totalCount: 0, byType: [] });

  useEffect(() => {
    if (!authLoading && user && !isAdmin) router.replace("/");
  }, [authLoading, user, isAdmin, router]);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchAll = useCallback(async () => {
    if (!token || !isAdmin) { setLoading(false); return; }
    setLoading(true);
    try {
      const sp = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
      if (typeFilter !== "all") sp.set("type", typeFilter);
      if (statusFilter !== "all") sp.set("status", statusFilter);
      if (debounced) sp.set("search", debounced);
      const [list, st] = await Promise.all([
        fetch(`${API_URL}/api/admin/transactions?${sp}`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
        fetch(`${API_URL}/api/admin/transactions/stats`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
      ]);
      if (list.success) {
        setItems(list.data.items || []);
        setTotalPages(list.data.totalPages || 1);
        setTotal(list.data.total || 0);
      }
      if (st.success) setStats(st.data);
    } catch {}
    setLoading(false);
  }, [token, isAdmin, page, typeFilter, statusFilter, debounced]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  if (authLoading || !isAdmin) return null;

  const statuses = ["all", "pending", "completed", "failed"];
  const types = ["all", "deposit", "withdrawal", "transfer", "referral_bonus", "contribution", "loan_disbursement", "loan_repayment"];

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "clamp(1rem, 3vw, 2rem)" }}>
      <PageHeader badgeLabel="Admin" heading="Transaction" accentText="Ledger" description="Monitor all platform money movement, deposits, withdrawals, and loan flows." />

      <FadeInUp delay={100}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "0.75rem", marginBottom: "1.5rem" }}>
          <StatCard label="Total Txns" value={stats.totalCount.toLocaleString()} />
          {stats.byType.map((t) => (
            <StatCard key={t.type} label={t.type.replace("_", " ")} value={formatNaira(t.total)} sub={`${t.count} txns`} />
          ))}
        </div>
      </FadeInUp>

      <FadeInUp delay={200}>
        <Card padding="1.5rem">
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1rem" }}>
            <input
              placeholder="Search reference, email, name..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              style={{ flex: 1, minWidth: "200px", padding: "0.5rem 0.75rem", borderRadius: "0.5rem", border: "1px solid #E5E7EB", fontSize: "12px" }}
            />
            <FilterSelect value={typeFilter} onChange={(v) => { setTypeFilter(v); setPage(1); }} options={types} />
            <FilterSelect value={statusFilter} onChange={(v) => { setStatusFilter(v); setPage(1); }} options={statuses} />
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "3rem", color: "#999", fontSize: "13px" }}>Loading transactions...</div>
          ) : items.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2rem", color: "#999", fontSize: "13px" }}>No transactions found.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", fontSize: "12px", borderCollapse: "collapse", minWidth: "820px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #F0F0F0", color: "#999", textTransform: "uppercase", letterSpacing: "0.1em", fontSize: "9px", fontFamily: "'JetBrains Mono', monospace" }}>
                    <th style={{ paddingBottom: "0.75rem", textAlign: "left", fontWeight: 600 }}>User</th>
                    <th style={{ paddingBottom: "0.75rem", textAlign: "left", fontWeight: 600 }}>Type</th>
                    <th style={{ paddingBottom: "0.75rem", textAlign: "right", fontWeight: 600 }}>Amount</th>
                    <th style={{ paddingBottom: "0.75rem", textAlign: "left", fontWeight: 600 }}>Status</th>
                    <th style={{ paddingBottom: "0.75rem", textAlign: "left", fontWeight: 600 }}>Date</th>
                    <th style={{ paddingBottom: "0.75rem", textAlign: "left", fontWeight: 600 }}>Reference</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((t) => (
                    <tr key={t.id} style={{ borderBottom: "1px solid #F5F5F5" }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#F9FAFB"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}>
                      <td style={{ padding: "0.75rem 0" }}>
                        <span style={{ fontWeight: 600, color: "#2D2D2D", display: "block" }}>{t.user?.name || "—"}</span>
                        <span style={{ fontSize: "11px", color: "#999" }}>{t.user?.email}</span>
                      </td>
                      <td style={{ padding: "0.75rem 0", color: "#717171", textTransform: "capitalize" }}>{t.type.replace(/_/g, " ")}</td>
                      <td style={{ padding: "0.75rem 0", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: "#2D2D2D" }}>{formatNaira(t.amount)}</td>
                      <td style={{ padding: "0.75rem 0" }}><StatusBadge status={t.status} /></td>
                      <td style={{ padding: "0.75rem 0", color: "#717171" }}>{formatDate(new Date(t.createdAt))}</td>
                      <td style={{ padding: "0.75rem 0", color: "#999", fontFamily: "'JetBrains Mono', monospace", fontSize: "10px" }}>{t.reference || "—"}</td>
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

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div style={{ backgroundColor: "#fff", border: "1px solid #F0F0F0", borderRadius: "0.75rem", padding: "1rem" }}>
      <div style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.08em", color: "#999", fontFamily: "'JetBrains Mono', monospace" }}>{label}</div>
      <div style={{ fontSize: "16px", fontWeight: 700, color: "#2D2D2D", marginTop: "0.25rem" }}>{value}</div>
      {sub && <div style={{ fontSize: "10px", color: "#999", marginTop: "0.125rem" }}>{sub}</div>}
    </div>
  );
}

function FilterSelect({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}
      style={{ padding: "0.5rem 0.75rem", borderRadius: "0.5rem", border: "1px solid #E5E7EB", fontSize: "12px", backgroundColor: "#fff", textTransform: "capitalize" }}>
      {options.map((o) => <option key={o} value={o} style={{ textTransform: "capitalize" }}>{o}</option>)}
    </select>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string; border: string }> = {
    completed: { bg: "#ECFDF5", color: "#059669", border: "#A7F3D0" },
    pending: { bg: "#FFFBEB", color: "#D97706", border: "#FDE68A" },
    failed: { bg: "#FEF2F2", color: "#DC2626", border: "#FECACA" },
  };
  const s = map[status] || { bg: "#F3F4F6", color: "#4B5563", border: "#E5E7EB" };
  return <span style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase", fontFamily: "'JetBrains Mono', monospace", padding: "0.125rem 0.5rem", borderRadius: "0.375rem", backgroundColor: s.bg, color: s.color, border: `1px solid ${s.border}` }}>{status}</span>;
}
