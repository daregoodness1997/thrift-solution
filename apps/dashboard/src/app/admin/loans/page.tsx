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
    <div className="mx-auto max-w-[1280px] p-[clamp(1rem,3vw,2rem)]">
      <PageHeader badgeLabel="Admin" heading="Loan" accentText="Requests" description="Review, approve, and disburse member loan requests." />

      {message && (
        <FadeIn>
          <div className={`mb-6 rounded-xl border px-4 py-3 text-[13px] font-medium ${message.type === "success" ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-red-50 text-red-600 border-red-200"}`}>
            {message.text}
          </div>
        </FadeIn>
      )}

      <FadeInUp delay={200}>
        <Card padding="1.5rem">
          <div className="mb-4 flex w-fit flex-wrap gap-1 rounded-lg bg-gray-100 p-1">
            {filters.map((f) => (
              <button key={f} onClick={() => { setFilter(f); setPage(1); }}
                className="cursor-pointer rounded-md px-3 py-1.5 text-[11px] font-semibold capitalize"
                style={{ backgroundColor: filter === f ? "#ffffff" : "transparent", color: filter === f ? config.colors.primary : "#717171", boxShadow: filter === f ? "0 1px 3px rgba(0,0,0,0.08)" : "none" }}>
                {f}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="p-12 text-center text-[13px] text-gray-500">Loading loans...</div>
          ) : loans.length === 0 ? (
            <div className="p-8 text-center text-[13px] text-gray-500">No loans found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[12px] min-w-[820px]">
                <thead>
                  <tr className="border-b border-gray-100 font-mono text-[9px] uppercase tracking-[0.1em] text-gray-500">
                    <th className="pb-3 text-left font-semibold">Borrower</th>
                    <th className="pb-3 text-right font-semibold">Amount</th>
                    <th className="pb-3 text-left font-semibold">Term</th>
                    <th className="pb-3 text-right font-semibold">Repayment</th>
                    <th className="pb-3 text-left font-semibold">Status</th>
                    <th className="pb-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loans.map((loan) => {
                    const sc = STATUS_COLORS[loan.status] || STATUS_COLORS.completed;
                    return (
                      <tr key={loan.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3">
                          <span className="block font-semibold text-brand-dark">{loan.borrower?.name || "—"}</span>
                          <span className="text-[11px] text-gray-500">{loan.borrower?.email}</span>
                        </td>
                        <td className="py-3 text-right font-mono font-semibold text-brand-dark">{formatNaira(loan.amount)}</td>
                        <td className="py-3 text-gray-500">{loan.termMonths}mo @ {loan.interestRate}%</td>
                        <td className="py-3 text-right font-mono text-gray-500">{formatNaira(loan.totalRepayment)}</td>
                        <td className="py-3">
                          <span className="rounded-md px-2 py-0.5 font-mono text-[9px] font-bold uppercase" style={{ backgroundColor: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>{loan.status}</span>
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex justify-end gap-1.5">
                            {loan.status === "pending" && (
                              <>
                                <ActionBtn label="Approve" color="#059669" onClick={() => act(loan, "approve")} disabled={busyId === loan.id} />
                                <ActionBtn label="Reject" color="#DC2626" onClick={() => act(loan, "reject")} disabled={busyId === loan.id} />
                              </>
                            )}
                            {loan.status === "approved" && <ActionBtn label="Disburse" color="#2563EB" onClick={() => act(loan, "disburse")} disabled={busyId === loan.id} />}
                            {loan.status === "disbursed" && <ActionBtn label="Complete" color="#4B5563" onClick={() => act(loan, "complete")} disabled={busyId === loan.id} />}
                            {(loan.status === "completed" || loan.status === "rejected") && <span className="text-[10px] text-[#B0B0B0]">—</span>}
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
      className="cursor-pointer rounded-md px-2 py-1 text-[10px] font-semibold"
      style={{ border: `1px solid ${color}40`, backgroundColor: `${color}0F`, color, opacity: disabled ? 0.5 : 1 }}>
      {disabled ? "..." : label}
    </button>
  );
}
