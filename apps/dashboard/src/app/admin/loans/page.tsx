"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { config } from "@thrift/config";
import { Card, FadeIn, FadeInUp } from "@thrift/ui";
import { formatNaira } from "@thrift/utils";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/PageHeader";
import Pagination from "@/components/Pagination";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const LIMIT = 20;

interface Loan {
  id: string;
  amount: number;
  interestRate: number;
  termMonths: number;
  monthlyPayment: number;
  totalRepayment: number;
  purpose?: string;
  status: string;
  createdAt: string;
  borrower?: { id: string; name: string; email: string };
}

const STATUS_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  pending: { bg: "#FFFBEB", color: "#D97706", border: "#FDE68A" },
  approved: { bg: "#EFF6FF", color: "#2563EB", border: "#BFDBFE" },
  disbursed: { bg: "#ECFDF5", color: "#059669", border: "#A7F3D0" },
  completed: { bg: "#F3F4F6", color: "#4B5563", border: "#E5E7EB" },
  rejected: { bg: "#FEF2F2", color: "#DC2626", border: "#FECACA" },
};

export default function AdminLoansPage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const isAdmin = user?.role === "admin" || user?.role === "superadmin";

  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (!authLoading && user && !isAdmin) router.replace("/");
  }, [authLoading, user, isAdmin, router]);

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const fetchLoans = useCallback(async () => {
    if (!token || !isAdmin) { setLoading(false); return; }
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
      if (filter !== "all") params.set("status", filter);
      const res = await fetch(`${API_URL}/api/loans?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) {
        setLoans(data.data.items || []);
        setTotalPages(data.data.totalPages || 1);
        setTotal(data.data.total || 0);
      }
    } catch {}
    setLoading(false);
  }, [token, isAdmin, page, filter]);

  useEffect(() => { fetchLoans(); }, [fetchLoans]);

  const act = async (loan: Loan, action: "approve" | "reject" | "disburse" | "complete") => {
    setBusyId(loan.id);
    try {
      const res = await fetch(`${API_URL}/api/loans/${loan.id}/${action}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        showMessage("success", `Loan ${action}d`);
        fetchLoans();
      } else {
        showMessage("error", data.error || "Action failed");
      }
    } catch {
      showMessage("error", "Action failed");
    }
    setBusyId(null);
  };

  if (authLoading || !isAdmin) return null;

  const filters = ["all", "pending", "approved", "disbursed", "completed", "rejected"];

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "clamp(1rem, 3vw, 2rem)" }}>
      <PageHeader badgeLabel="Admin" heading="Loan" accentText="Requests" description="Review, approve, and disburse member loan requests." />

      {message && (
        <FadeIn>
          <div style={{ padding: "0.75rem 1rem", borderRadius: "0.75rem", marginBottom: "1.5rem", fontSize: "13px", fontWeight: 500, backgroundColor: message.type === "success" ? "#ECFDF5" : "#FEF2F2", color: message.type === "success" ? "#059669" : "#DC2626", border: `1px solid ${message.type === "success" ? "#A7F3D0" : "#FECACA"}` }}>
            {message.text}
          </div>
        </FadeIn>
      )}

      <FadeInUp delay={200}>
        <Card padding="1.5rem">
          <div style={{ display: "flex", gap: "0.25rem", backgroundColor: "#F5F7F5", borderRadius: "0.5rem", padding: "0.25rem", marginBottom: "1rem", width: "fit-content", flexWrap: "wrap" }}>
            {filters.map((f) => (
              <button key={f} onClick={() => { setFilter(f); setPage(1); }}
                style={{ padding: "0.375rem 0.75rem", borderRadius: "0.375rem", fontSize: "11px", fontWeight: 600, border: "none", cursor: "pointer", textTransform: "capitalize",
                  backgroundColor: filter === f ? "#ffffff" : "transparent", color: filter === f ? config.colors.primary : "#717171",
                  boxShadow: filter === f ? "0 1px 3px rgba(0,0,0,0.08)" : "none" }}>
                {f}
              </button>
            ))}
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "3rem", color: "#999", fontSize: "13px" }}>Loading loans...</div>
          ) : loans.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2rem", color: "#999", fontSize: "13px" }}>No loans found.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", fontSize: "12px", borderCollapse: "collapse", minWidth: "820px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #F0F0F0", color: "#999", textTransform: "uppercase", letterSpacing: "0.1em", fontSize: "9px", fontFamily: "'JetBrains Mono', monospace" }}>
                    <th style={{ paddingBottom: "0.75rem", textAlign: "left", fontWeight: 600 }}>Borrower</th>
                    <th style={{ paddingBottom: "0.75rem", textAlign: "right", fontWeight: 600 }}>Amount</th>
                    <th style={{ paddingBottom: "0.75rem", textAlign: "left", fontWeight: 600 }}>Term</th>
                    <th style={{ paddingBottom: "0.75rem", textAlign: "right", fontWeight: 600 }}>Repayment</th>
                    <th style={{ paddingBottom: "0.75rem", textAlign: "left", fontWeight: 600 }}>Status</th>
                    <th style={{ paddingBottom: "0.75rem", textAlign: "right", fontWeight: 600 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loans.map((loan) => {
                    const sc = STATUS_COLORS[loan.status] || STATUS_COLORS.completed;
                    return (
                      <tr key={loan.id} style={{ borderBottom: "1px solid #F5F5F5" }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#F9FAFB"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}>
                        <td style={{ padding: "0.75rem 0" }}>
                          <span style={{ fontWeight: 600, color: "#2D2D2D", display: "block" }}>{loan.borrower?.name || "—"}</span>
                          <span style={{ fontSize: "11px", color: "#999" }}>{loan.borrower?.email}</span>
                        </td>
                        <td style={{ padding: "0.75rem 0", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: "#2D2D2D" }}>{formatNaira(loan.amount)}</td>
                        <td style={{ padding: "0.75rem 0", color: "#717171" }}>{loan.termMonths}mo @ {loan.interestRate}%</td>
                        <td style={{ padding: "0.75rem 0", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", color: "#717171" }}>{formatNaira(loan.totalRepayment)}</td>
                        <td style={{ padding: "0.75rem 0" }}>
                          <span style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase", fontFamily: "'JetBrains Mono', monospace", padding: "0.125rem 0.5rem", borderRadius: "0.375rem", backgroundColor: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>{loan.status}</span>
                        </td>
                        <td style={{ padding: "0.75rem 0", textAlign: "right" }}>
                          <div style={{ display: "flex", gap: "0.375rem", justifyContent: "flex-end" }}>
                            {loan.status === "pending" && (
                              <>
                                <ActionBtn label="Approve" color="#059669" onClick={() => act(loan, "approve")} disabled={busyId === loan.id} />
                                <ActionBtn label="Reject" color="#DC2626" onClick={() => act(loan, "reject")} disabled={busyId === loan.id} />
                              </>
                            )}
                            {loan.status === "approved" && <ActionBtn label="Disburse" color="#2563EB" onClick={() => act(loan, "disburse")} disabled={busyId === loan.id} />}
                            {loan.status === "disbursed" && <ActionBtn label="Complete" color="#4B5563" onClick={() => act(loan, "complete")} disabled={busyId === loan.id} />}
                            {(loan.status === "completed" || loan.status === "rejected") && <span style={{ fontSize: "10px", color: "#B0B0B0" }}>—</span>}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
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

function ActionBtn({ label, color, onClick, disabled }: { label: string; color: string; onClick: () => void; disabled: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ padding: "0.25rem 0.5rem", borderRadius: "0.375rem", fontSize: "10px", fontWeight: 600, border: `1px solid ${color}40`, backgroundColor: `${color}0F`, color, cursor: "pointer", opacity: disabled ? 0.5 : 1 }}>
      {disabled ? "..." : label}
    </button>
  );
}
