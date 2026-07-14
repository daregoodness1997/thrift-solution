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

interface Earning {
  id: string;
  amount: number;
  status: string;
  level: number;
  createdAt: string;
  referrer?: { id: string; name: string; email: string };
  referredUser?: { id: string; name: string; email: string };
}

export default function AdminReferralsPage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const isAdmin = user?.role === "admin" || user?.role === "superadmin";

  const [items, setItems] = useState<Earning[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState("all");
  const [pending, setPending] = useState<{ count: number; amount: number }>({ count: 0, amount: 0 });
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (!authLoading && user && !isAdmin) router.replace("/");
  }, [authLoading, user, isAdmin, router]);

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const fetchAll = useCallback(async () => {
    if (!token || !isAdmin) { setLoading(false); return; }
    setLoading(true);
    try {
      const sp = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
      if (statusFilter !== "all") sp.set("status", statusFilter);
      const res = await fetch(`${API_URL}/api/admin/referrals?${sp}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) {
        setItems(data.data.items || []);
        setTotalPages(data.data.totalPages || 1);
        setTotal(data.data.total || 0);
        setPending(data.data.pending || { count: 0, amount: 0 });
      }
    } catch {}
    setLoading(false);
  }, [token, isAdmin, page, statusFilter]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const pay = async (e: Earning) => {
    setBusyId(e.id);
    try {
      const res = await fetch(`${API_URL}/api/admin/referrals/${e.id}/pay`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) showMessage("success", `Paid ${formatNaira(e.amount)} to ${e.referrer?.name || "referrer"}`);
      else showMessage("error", data.error || "Failed");
      fetchAll();
    } catch {
      showMessage("error", "Failed");
    }
    setBusyId(null);
  };

  if (authLoading || !isAdmin) return null;

  const statuses = ["all", "pending", "credited", "cancelled"];

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "clamp(1rem, 3vw, 2rem)" }}>
      <PageHeader badgeLabel="Admin" heading="Referral" accentText="Earnings" description="Review referral bonuses and pay out pending earnings to members." />

      {message && (
        <FadeIn>
          <div style={{ padding: "0.75rem 1rem", borderRadius: "0.75rem", marginBottom: "1.5rem", fontSize: "13px", fontWeight: 500, backgroundColor: message.type === "success" ? "#ECFDF5" : "#FEF2F2", color: message.type === "success" ? "#059669" : "#DC2626", border: `1px solid ${message.type === "success" ? "#A7F3D0" : "#FECACA"}` }}>
            {message.text}
          </div>
        </FadeIn>
      )}

      <FadeInUp delay={100}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.75rem", marginBottom: "1.5rem" }}>
          <div style={{ backgroundColor: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: "0.75rem", padding: "1rem" }}>
            <div style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.08em", color: "#D97706", fontFamily: "'JetBrains Mono', monospace" }}>Pending Payout</div>
            <div style={{ fontSize: "16px", fontWeight: 700, color: "#D97706", marginTop: "0.25rem" }}>{formatNaira(pending.amount)}</div>
            <div style={{ fontSize: "10px", color: "#999", marginTop: "0.125rem" }}>{pending.count} earnings</div>
          </div>
        </div>
      </FadeInUp>

      <FadeInUp delay={200}>
        <Card padding="1.5rem">
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1rem" }}>
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              style={{ padding: "0.5rem 0.75rem", borderRadius: "0.5rem", border: "1px solid #E5E7EB", fontSize: "12px", backgroundColor: "#fff", textTransform: "capitalize" }}>
              {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "3rem", color: "#999", fontSize: "13px" }}>Loading earnings...</div>
          ) : items.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2rem", color: "#999", fontSize: "13px" }}>No referral earnings found.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", fontSize: "12px", borderCollapse: "collapse", minWidth: "820px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #F0F0F0", color: "#999", textTransform: "uppercase", letterSpacing: "0.1em", fontSize: "9px", fontFamily: "'JetBrains Mono', monospace" }}>
                    <th style={{ paddingBottom: "0.75rem", textAlign: "left", fontWeight: 600 }}>Referrer</th>
                    <th style={{ paddingBottom: "0.75rem", textAlign: "left", fontWeight: 600 }}>Referred</th>
                    <th style={{ paddingBottom: "0.75rem", textAlign: "right", fontWeight: 600 }}>Amount</th>
                    <th style={{ paddingBottom: "0.75rem", textAlign: "left", fontWeight: 600 }}>Level</th>
                    <th style={{ paddingBottom: "0.75rem", textAlign: "left", fontWeight: 600 }}>Status</th>
                    <th style={{ paddingBottom: "0.75rem", textAlign: "left", fontWeight: 600 }}>Date</th>
                    <th style={{ paddingBottom: "0.75rem", textAlign: "right", fontWeight: 600 }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((e) => (
                    <tr key={e.id} style={{ borderBottom: "1px solid #F5F5F5" }}
                      onMouseEnter={(ev) => { ev.currentTarget.style.backgroundColor = "#F9FAFB"; }}
                      onMouseLeave={(ev) => { ev.currentTarget.style.backgroundColor = "transparent"; }}>
                      <td style={{ padding: "0.75rem 0" }}>
                        <span style={{ fontWeight: 600, color: "#2D2D2D", display: "block" }}>{e.referrer?.name || "—"}</span>
                        <span style={{ fontSize: "11px", color: "#999" }}>{e.referrer?.email}</span>
                      </td>
                      <td style={{ padding: "0.75rem 0" }}>
                        <span style={{ color: "#717171", display: "block" }}>{e.referredUser?.name || "—"}</span>
                        <span style={{ fontSize: "11px", color: "#999" }}>{e.referredUser?.email}</span>
                      </td>
                      <td style={{ padding: "0.75rem 0", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: "#2D2D2D" }}>{formatNaira(e.amount)}</td>
                      <td style={{ padding: "0.75rem 0", color: "#717171" }}>L{e.level}</td>
                      <td style={{ padding: "0.75rem 0" }}><StatusBadge status={e.status} /></td>
                      <td style={{ padding: "0.75rem 0", color: "#717171" }}>{formatDate(new Date(e.createdAt))}</td>
                      <td style={{ padding: "0.75rem 0", textAlign: "right" }}>
                        {e.status === "pending" ? (
                          <button onClick={() => pay(e)} disabled={busyId === e.id}
                            style={{ padding: "0.25rem 0.5rem", borderRadius: "0.375rem", fontSize: "10px", fontWeight: 600, border: "1px solid #05966940", backgroundColor: "#0596690F", color: "#059669", cursor: "pointer", opacity: busyId === e.id ? 0.5 : 1 }}>
                            {busyId === e.id ? "..." : "Pay"}
                          </button>
                        ) : <span style={{ fontSize: "10px", color: "#B0B0B0" }}>—</span>}
                      </td>
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

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string; border: string }> = {
    credited: { bg: "#ECFDF5", color: "#059669", border: "#A7F3D0" },
    pending: { bg: "#FFFBEB", color: "#D97706", border: "#FDE68A" },
    cancelled: { bg: "#FEF2F2", color: "#DC2626", border: "#FECACA" },
  };
  const s = map[status] || { bg: "#F3F4F6", color: "#4B5563", border: "#E5E7EB" };
  return <span style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase", fontFamily: "'JetBrains Mono', monospace", padding: "0.125rem 0.5rem", borderRadius: "0.375rem", backgroundColor: s.bg, color: s.color, border: `1px solid ${s.border}` }}>{status}</span>;
}
