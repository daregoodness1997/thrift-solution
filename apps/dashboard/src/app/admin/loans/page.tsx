"use client";

import { useState, useEffect, useCallback, Fragment } from "react";
import { useRouter } from "next/navigation";
import { Card, FadeIn, FadeInUp } from "@thrift/ui";
import { formatNaira } from "@thrift/utils";
import { useAuth } from "@/lib/auth-context";
import { Landmark } from "lucide-react";
import Pagination from "@/components/Pagination";
import { SimpleTable, SimpleColumn } from "@/components/SimpleTable";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const LIMIT = 20;

interface Loan {
  id: string;
  amount: number;
  interestRate: number;
  termMonths: number;
  monthlyPayment: number;
  totalRepayment: number;
  disbursedAmount?: number | null;
  outstandingBalance?: number;
  paidAmount?: number;
  nextDueDate?: string;
  purpose?: string;
  status: string;
  createdAt: string;
  borrower?: { id: string; name: string; email: string };
}

interface ScheduleItem {
  id: string; installmentNo: number; dueDate: string; principal: number; interest: number; totalDue: number;
  principalPaid: number; interestPaid: number; status: string; paidAt?: string;
}

interface Repayment {
  id: string; amount: number; principal: number; interest: number; method: string; reference: string;
  status: string; createdAt: string;
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
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [scheduleCache, setScheduleCache] = useState<Record<string, { schedule: ScheduleItem[]; repayments: Repayment[] }>>({});
  const [repayId, setRepayId] = useState<string | null>(null);
  const [repayAmount, setRepayAmount] = useState("");
  const [repaying, setRepaying] = useState(false);
  const [repayError, setRepayError] = useState("");

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

  const fetchSchedule = useCallback(async (loanId: string) => {
    if (scheduleCache[loanId]) return;
    try {
      const res = await fetch(`${API_URL}/api/loans/${loanId}/schedule`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setScheduleCache((p) => ({ ...p, [loanId]: { schedule: data.data.schedule, repayments: data.data.repayments } }));
    } catch {}
  }, [token, API_URL, scheduleCache]);

  const toggleExpand = (loan: Loan) => {
    if (expandedId === loan.id) { setExpandedId(null); return; }
    setExpandedId(loan.id);
    fetchSchedule(loan.id);
  };

  const openRepay = (loan: Loan) => {
    setRepayId(loan.id);
    setRepayAmount(loan.outstandingBalance ? String(Math.round((loan.outstandingBalance + Number.EPSILON) * 100) / 100) : "");
    setRepayError("");
  };

  const closeRepay = () => { setRepayId(null); setRepayError(""); };

  const submitRepay = async (e: React.FormEvent) => {
    e.preventDefault();
    setRepayError("");
    if (!repayId) return;
    const amt = parseFloat(repayAmount);
    if (!amt || amt <= 0) { setRepayError("Enter a valid amount"); return; }
    setRepaying(true);
    try {
      const res = await fetch(`${API_URL}/api/loans/${repayId}/repay`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount: amt, method: "admin" }),
      });
      const data = await res.json();
      if (data.success) {
        showMessage("success", "Repayment recorded");
        closeRepay();
        setScheduleCache((p) => { const c = { ...p }; delete c[repayId]; return c; });
        fetchLoans();
      } else {
        setRepayError(data.error || "Failed to record repayment");
      }
    } catch {
      setRepayError("Failed to record repayment");
    }
    setRepaying(false);
  };

  const act = async (loan: Loan, action: "approve" | "reject" | "disburse" | "complete" | "settle") => {
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
      <div className="mb-8 pt-2 pb-6 border-b border-slate-200/80 dark:border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1">
              <Landmark className="w-3.5 h-3.5 text-emerald-500" />
              <span>Admin</span>
            </span>
          </div>
          <h3 className="font-display font-bold text-xl sm:text-2xl text-slate-900 dark:text-white mt-1">Loan <span className="bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 bg-clip-text font-display font-bold text-transparent">Requests</span></h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Review, approve, and disburse member loan requests.</p>
        </div>
      </div>

      {message && (
        <FadeIn>
          <div className={`mb-6 rounded-2xl border px-4 py-3 text-[13px] font-medium ${message.type === "success" ? "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50" : "bg-red-50 text-red-600 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50"}`}>
            {message.text}
          </div>
        </FadeIn>
      )}

      <FadeInUp delay={200}>
        <Card padding="1.5rem" className="rounded-3xl">
          <div className="mb-4 flex w-fit flex-wrap gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
            {filters.map((f) => (
              <button key={f} onClick={() => { setFilter(f); setPage(1); }}
                className={`cursor-pointer rounded-md px-3 py-1.5 text-[11px] font-semibold capitalize transition-colors ${filter === f ? "bg-white text-blue-600 shadow-sm dark:bg-slate-700 dark:text-blue-400" : "text-slate-500 dark:text-slate-400"}`}>
                {f}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="p-12 text-center text-[13px] text-slate-500 dark:text-slate-400">Loading loans...</div>
          ) : loans.length === 0 ? (
            <div className="p-8 text-center text-[13px] text-slate-500 dark:text-slate-400">No loans found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[12px] border-collapse" style={{ minWidth: "820px" }}>
                <thead>
                  <tr className="border-b border-slate-200/80 dark:border-slate-800/80 font-mono text-[9px] uppercase tracking-[0.1em] text-slate-400 dark:text-slate-500">
                    <th className="px-4 py-3 text-left font-semibold">Borrower</th>
                    <th className="px-4 py-3 text-right font-semibold">Amount</th>
                    <th className="px-4 py-3 text-left font-semibold">Term</th>
                    <th className="px-4 py-3 text-right font-semibold">Repayment</th>
                    <th className="px-4 py-3 text-right font-semibold">Fee</th>
                    <th className="px-4 py-3 text-left font-semibold">Status</th>
                    <th className="px-4 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loans.map((loan) => {
                    const sc = STATUS_COLORS[loan.status] || STATUS_COLORS.completed;
                    const detail = scheduleCache[loan.id];
                    return (
                      <Fragment key={loan.id}>
                        <tr className="border-b border-slate-100 dark:border-slate-800/50 transition-colors duration-150 hover:bg-slate-50 dark:hover:bg-slate-800/40" onClick={() => toggleExpand(loan)} style={{ cursor: "pointer" }}>
                          <td className="px-4 py-3">
                            <span className="block font-semibold text-slate-900 dark:text-white">{loan.borrower?.name || "—"}</span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">{loan.borrower?.email}</span>
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-semibold text-slate-900 dark:text-white">{formatNaira(loan.amount)}</td>
                          <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{loan.termMonths}mo @ {loan.interestRate}%</td>
                          <td className="px-4 py-3 text-right font-mono text-slate-500 dark:text-slate-400">{formatNaira(loan.totalRepayment)}</td>
                          <td className="px-4 py-3 text-right font-mono font-semibold text-slate-900 dark:text-white">
                            {loan.outstandingBalance !== undefined && loan.status === "disbursed"
                              ? `${formatNaira(loan.outstandingBalance)} owed`
                              : "—"}
                          </td>
                          <td className="px-4 py-3">
                            <span className="rounded-md px-2 py-0.5 font-mono text-[9px] font-bold uppercase" style={{ backgroundColor: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>{loan.status}</span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                              {loan.status === "pending" && (
                                <>
                                  <ActionBtn label="Approve" color="#059669" onClick={() => act(loan, "approve")} disabled={busyId === loan.id} />
                                  <ActionBtn label="Reject" color="#DC2626" onClick={() => act(loan, "reject")} disabled={busyId === loan.id} />
                                </>
                              )}
                              {loan.status === "approved" && <ActionBtn label="Disburse" color="#2563EB" onClick={() => act(loan, "disburse")} disabled={busyId === loan.id} />}
                              {loan.status === "disbursed" && (
                                <>
                                  <ActionBtn label="Repay" color="#D97706" onClick={() => openRepay(loan)} disabled={busyId === loan.id} />
                                  <ActionBtn label="Complete" color="#4B5563" onClick={() => act(loan, "complete")} disabled={busyId === loan.id} />
                                  <ActionBtn label="Settle / Write-off" color="#7C3AED" onClick={() => act(loan, "settle")} disabled={busyId === loan.id} />
                                </>
                              )}
                              {(loan.status === "completed" || loan.status === "rejected") && <span className="text-[10px] text-slate-400">—</span>}
                            </div>
                          </td>
                        </tr>
                        {expandedId === loan.id && detail && (
                          <tr className="border-b border-slate-100 dark:border-slate-800/50 bg-slate-50 dark:bg-slate-800/40">
                            <td colSpan={7} className="px-4 py-3">
                              <div className="text-xs">
                                <div className="mb-2 grid grid-cols-[repeat(auto-fit,minmax(130px,1fr))] gap-3">
                                  <div><span className="block text-slate-400 dark:text-slate-500">Disbursed</span><span className="font-mono font-semibold text-slate-900 dark:text-white">{loan.disbursedAmount ? formatNaira(loan.disbursedAmount) : "—"}</span></div>
                                  <div><span className="block text-slate-400 dark:text-slate-500">Paid</span><span className="font-mono font-semibold text-slate-900 dark:text-white">{loan.paidAmount ? formatNaira(loan.paidAmount) : formatNaira(0)}</span></div>
                                  <div><span className="block text-slate-400 dark:text-slate-500">Outstanding</span><span className="font-mono font-semibold text-slate-900 dark:text-white">{loan.outstandingBalance !== undefined ? formatNaira(loan.outstandingBalance) : "—"}</span></div>
                                  <div><span className="block text-slate-400 dark:text-slate-500">Next Due</span><span className="font-semibold text-slate-900 dark:text-white">{loan.nextDueDate ? new Date(loan.nextDueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}</span></div>
                                </div>
                                <h4 className="mb-1 mt-2 font-semibold text-slate-900 dark:text-white">Payment Schedule</h4>
                                <SimpleTable
                                  columns={[
                                    { key: "installmentNo", header: "#", mono: true, render: (s: ScheduleItem) => s.installmentNo },
                                    { key: "dueDate", header: "Due", render: (s: ScheduleItem) => new Date(s.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) },
                                    { key: "principal", header: "Principal", align: "right", mono: true, render: (s: ScheduleItem) => formatNaira(s.principal) },
                                    { key: "interest", header: "Interest", align: "right", mono: true, render: (s: ScheduleItem) => formatNaira(s.interest) },
                                    { key: "totalDue", header: "Total", align: "right", mono: true, render: (s: ScheduleItem) => formatNaira(s.totalDue) },
                                    { key: "status", header: "Status", render: (s: ScheduleItem) => (
                                      <span className="rounded px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase"
                                        style={{ color: STATUS_COLORS[s.status]?.color || "#717171", backgroundColor: `${STATUS_COLORS[s.status]?.color || "#717171"}12` }}>
                                        {s.status}
                                      </span>
                                    )},
                                  ]}
                                  data={detail.schedule}
                                />
                                {detail.repayments.length > 0 && (
                                  <div className="mt-3">
                                    <h4 className="mb-1 font-semibold text-slate-900 dark:text-white">Repayments</h4>
                                    <div className="flex flex-col gap-1">
                                      {detail.repayments.map((r) => (
                                        <div key={r.id} className="flex flex-wrap items-center justify-between rounded border border-slate-200 px-2 py-1 dark:border-slate-700">
                                          <span className="font-mono font-semibold text-slate-900 dark:text-white">{formatNaira(r.amount)}</span>
                                          <span className="text-slate-400 dark:text-slate-500">{r.method}</span>
                                          <span className="text-slate-500 dark:text-slate-400">{new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <Pagination page={page} totalPages={totalPages} total={total} limit={LIMIT} onPageChange={setPage} loading={loading} />
        </Card>
      </FadeInUp>

      {repayId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={closeRepay}>
          <div className="w-full max-w-[420px] rounded-3xl bg-white p-6 dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-1 font-display text-lg font-semibold tracking-tight text-slate-900 dark:text-white">Record Repayment</h2>
            <p className="mb-4 text-[12px] text-slate-500 dark:text-slate-400">
              Outstanding: {formatNaira(loans.find((l) => l.id === repayId)?.outstandingBalance ?? 0)}
            </p>
            <form onSubmit={submitRepay}>
              <div className="mb-4">
                <label className="mb-1.5 block text-xs font-semibold text-slate-900 dark:text-white">Amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-[13px] text-slate-400">&#8358;</span>
                  <input type="number" value={repayAmount} onChange={(e) => setRepayAmount(e.target.value)} step="100" min="1"
                    className="box-border w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-8 pr-3 font-mono text-[13px] outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                </div>
              </div>
              {repayError && <div className="mb-3 text-xs text-red-600">{repayError}</div>}
              <div className="flex gap-2">
                <button type="button" onClick={closeRepay} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={repaying} className={`btn-primary ${repaying ? "opacity-60" : ""}`}>{repaying ? "Processing..." : "Record"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
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
