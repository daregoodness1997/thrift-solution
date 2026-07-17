"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { config, BrandConfig } from "@thrift/config";
import { Card, Button, ColorfulBadge, FadeIn, FadeInUp, StaggerChildren, StatCard } from "@thrift/ui";
import { formatNaira } from "@thrift/utils";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/PageHeader";
import { Skeleton, SkeletonCard } from "@/components/Skeleton";
import { LoanCalculator } from "@/components/LoanCalculator";
import Pagination from "@/components/Pagination";
import { useRouter } from "next/navigation";

const fallback = config;

interface Loan {
  id: string; amount: number; interestRate: number; termMonths: number; monthlyPayment: number; totalRepayment: number;
  disbursedAmount?: number | null; paidAmount?: number; outstandingBalance?: number; nextDueDate?: string;
  processingFee?: number | null; processingFeeType?: string | null; processingFeeValue?: number | null;
  purpose?: string; status: string; approvedAt?: string; disbursedAt?: string; completedAt?: string; createdAt: string;
}

interface ScheduleItem {
  id: string; installmentNo: number; dueDate: string; principal: number; interest: number; totalDue: number;
  principalPaid: number; interestPaid: number; status: string; paidAt?: string;
}

interface Repayment {
  id: string; amount: number; principal: number; interest: number; method: string; reference: string;
  status: string; note?: string; createdAt: string;
}

const STATUS_COLORS: Record<string, string> = { pending: "#D97706", approved: "#059669", disbursed: "#2563EB", completed: "#059669", rejected: "#DC2626", defaulted: "#DC2626" };
const TERM_PRESETS = [3, 6, 12, 24, 36];

export default function LoansPage() {
  const { token } = useAuth();
  const router = useRouter();
  const [cfg, setCfg] = useState<BrandConfig>(fallback);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState("");
  const [termMonths, setTermMonths] = useState("12");
  const [purpose, setPurpose] = useState("");
  const [feeType, setFeeType] = useState<"fixed" | "percent" | "">("");
  const [feeValue, setFeeValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loanStats, setLoanStats] = useState({ total: 0, completedCount: 0, totalBorrowed: 0 });
  const LIMIT = 20;

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  useEffect(() => { fetch(`${API_URL}/api/config`).then((r) => r.json()).then((d) => { if (d && d.name) setCfg((p) => ({ ...p, ...d })); }).catch(() => {}); }, [API_URL]);

  const fetchLoans = useCallback(async () => {
    if (!token) { setLoading(false); return; }
    try {
      const statusParam = statusFilter !== "all" ? `&status=${statusFilter}` : "";
      const res = await fetch(`${API_URL}/api/loans/my?page=${page}&limit=${LIMIT}${statusParam}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) {
        setLoans(data.data.items);
        setTotalPages(data.data.totalPages || 1);
        setTotal(data.data.total || 0);
        if (data.data.stats) setLoanStats(data.data.stats);
      }
    } catch {}
    setLoading(false);
  }, [token, API_URL, page, LIMIT, statusFilter]);

  useEffect(() => { fetchLoans(); }, [fetchLoans]);
  useEffect(() => { setPage(1); }, [statusFilter]);

  const filteredLoans = loans;
  const activeLoan = loans.find((l) => l.status === "pending" || l.status === "approved" || l.status === "disbursed");

  const handleRequestFromCalculator = (calcAmount: number, calcTerm: number) => {
    setAmount(String(calcAmount));
    setTermMonths(String(calcTerm));
    setPurpose("");
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { setError("Please enter a valid amount"); return; }
    const months = parseInt(termMonths);
    if (!months || months <= 0 || months > 60) { setError("Term must be between 1 and 60 months"); return; }
    if (activeLoan) { setError("You already have an active loan request"); return; }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/loans`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount: amt, termMonths: months, purpose: purpose.trim() || undefined, processingFeeType: feeType || undefined, processingFeeValue: feeValue ? Number(feeValue) : undefined }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Loan request submitted!");
        setSuccess(true);
        setAmount("");
        setTermMonths("12");
        setPurpose("");
        setShowForm(false);
        fetchLoans();
        setTimeout(() => setSuccess(false), 3000);
      } else {
        toast.error(data.error || "Failed to submit loan request");
      }
    } catch {
      toast.error("Failed to submit loan request");
    }
    setSubmitting(false);
  };

  const formatTerm = (months: number) => {
    if (months < 12) return `${months}mo`;
    const y = Math.floor(months / 12);
    const m = months % 12;
    return m > 0 ? `${y}y ${m}mo` : `${y}y`;
  };

  return (
    <div className="mx-auto max-w-[1280px] p-[clamp(1rem,3vw,2rem)]">
      <PageHeader badgeLabel="Financial" heading="Low Interest" accentText="Loans" description="Access community-funded loans at just 5% annual interest rate."
        right={<Button variant="primary" size="sm" onClick={() => setShowForm(!showForm)} disabled={!!activeLoan}>{showForm ? "Cancel" : "+ Request Loan"}</Button>} />

      <StaggerChildren staggerDelay={100} className="mb-8 grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-6">
        <StatCard label="Total Borrowed" value={formatNaira(loanStats.totalBorrowed)} change={`${loans.length} total loan${loans.length !== 1 ? "s" : ""}`} positive variant="default" />
        <StatCard label="Active Loan" value={activeLoan ? formatNaira(activeLoan.amount) : "None"} change={activeLoan ? activeLoan.status : "No active loan"} positive variant="warm" />
        <StatCard label="Completed" value={String(loanStats.completedCount)} change={loanStats.completedCount > 0 ? "Successfully repaid" : "No completed loans yet"} positive variant="default" />
      </StaggerChildren>

      <FadeInUp delay={200} className="mb-8">
        <LoanCalculator onRequestLoan={handleRequestFromCalculator} disabled={!!activeLoan} />
      </FadeInUp>

      {showForm && (
        <FadeInUp>
          <Card padding="2rem" className="mb-6 max-w-[700px]">
            <ColorfulBadge label="Loan Request" color={cfg.colors.primary} />
            <h2 className="mt-2 mb-5 font-display text-lg font-medium tracking-tight text-brand-dark">Request a Loan</h2>

            <form onSubmit={handleApply}>
              <div className="mb-4">
                <label className="mb-1.5 block text-xs font-semibold text-brand-dark">Loan Amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-[13px] text-gray-400">&#8358;</span>
                  <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" step="100" min="100" className="box-border w-full rounded-xl border border-gray-200 py-2.5 pl-8 pr-3 font-mono text-[13px] outline-none" />
                </div>
              </div>

              <div className="mb-4">
                <label className="mb-1.5 block text-xs font-semibold text-brand-dark">Repayment Term</label>
                <div className="mb-2 flex flex-wrap gap-2">
                  {TERM_PRESETS.map((t) => (
                    <button key={t} type="button" onClick={() => setTermMonths(String(t))}
                      className="cursor-pointer rounded-full border px-4 py-2 text-xs font-semibold transition-all"
                      style={{ backgroundColor: termMonths === String(t) ? cfg.colors.primary : "#ffffff", color: termMonths === String(t) ? "#ffffff" : "#717171", borderColor: termMonths === String(t) ? cfg.colors.primary : "#EAEAEA" }}>
                      {formatTerm(t)}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input type="number" value={termMonths} onChange={(e) => setTermMonths(e.target.value)} min="1" max="60" className="box-border w-20 rounded-xl border border-gray-200 px-3 py-2 text-center text-[13px] outline-none" />
                  <span className="text-xs text-gray-400">months</span>
                </div>
              </div>

              <div className="mb-4">
                <label className="mb-1.5 block text-xs font-semibold text-brand-dark">Purpose (optional)</label>
                <textarea value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="e.g. Business expansion, Education, Medical" rows={3} className="box-border w-full resize-y rounded-xl border border-gray-200 px-3 py-2.5 text-[13px] outline-none" />
              </div>

              <div className="mb-4">
                <label className="mb-1.5 block text-xs font-semibold text-brand-dark">Processing Fee (optional)</label>
                <div className="grid grid-cols-2 gap-3">
                  <select value={feeType} onChange={(e) => setFeeType(e.target.value as "fixed" | "percent" | "")} className="box-border w-full rounded-xl border border-gray-200 px-3 py-2.5 text-[13px] outline-none">
                    <option value="">None</option>
                    <option value="fixed">Fixed (&#8358;)</option>
                    <option value="percent">Percent of loan (%)</option>
                  </select>
                  <input type="number" step="0.01" value={feeValue} onChange={(e) => setFeeValue(e.target.value)} disabled={!feeType} placeholder={feeType === "percent" ? "e.g. 2" : "e.g. 1000"} className="box-border w-full rounded-xl border border-gray-200 px-3 py-2.5 font-mono text-[13px] outline-none disabled:bg-gray-100" />
                </div>
              </div>

              {error && <div className="mb-3 text-xs text-red-600">{error}</div>}
              {success && <div className="mb-3 text-xs text-emerald-600">Loan request submitted!</div>}
              <Button type="submit" variant="primary" size="md" disabled={submitting || !!activeLoan}>{submitting ? "Submitting..." : "Request Loan"}</Button>
            </form>
          </Card>
        </FadeInUp>
      )}

      {loading ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-6">{Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}</div>
      ) : total === 0 ? (
        <FadeInUp delay={400}>
          <Card padding="3rem">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-xl">&#8358;</div>
              <h3 className="mb-2 font-display text-base font-semibold tracking-tight text-brand-dark">No loans yet</h3>
              <p className="mb-4 text-[13px] text-gray-500">Access low-interest loans funded by the community.</p>
              <Button variant="primary" size="sm" onClick={() => setShowForm(true)}>Request Your First Loan</Button>
            </div>
          </Card>
        </FadeInUp>
      ) : (
        <FadeInUp delay={400}>
          <Card padding="1.5rem">
            <ColorfulBadge label="Loan History" color={cfg.colors.primary} />
            <div className="mt-2 mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-lg font-medium tracking-tight text-brand-dark">Your Loans ({total})</h2>
              <div className="flex gap-1 rounded-lg bg-[#F5F7F5] p-[0.2rem]">
                {(["all", "pending", "approved", "disbursed", "completed", "rejected"] as const).map((f) => (
                  <button key={f} onClick={() => setStatusFilter(f)}
                    className="cursor-pointer rounded-md border-none px-3 py-1.5 text-[11px] font-semibold capitalize transition-all"
                    style={{ backgroundColor: statusFilter === f ? "#ffffff" : "transparent", color: statusFilter === f ? cfg.colors.primary : "#717171",
                      boxShadow: statusFilter === f ? "0 1px 3px rgba(0,0,0,0.08)" : "none" }}>
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead>
                  <tr className="border-b border-gray-100 text-[11px] uppercase tracking-[0.05em] text-gray-400">
                    <th className="px-3 py-3 font-semibold">Loan</th>
                    <th className="px-3 py-3 font-semibold">Term</th>
                    <th className="px-3 py-3 text-right font-semibold">Monthly</th>
                    <th className="px-3 py-3 text-right font-semibold">Outstanding</th>
                    <th className="px-3 py-3 font-semibold">Next Due</th>
                    <th className="px-3 py-3 font-semibold">Status</th>
                    <th className="px-3 py-3 text-right font-semibold"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLoans.map((loan) => (
                    <tr
                      key={loan.id}
                      onClick={() => router.push(`/loans/${loan.id}`)}
                      className="cursor-pointer border-b border-gray-50 transition-colors hover:bg-gray-50/60"
                    >
                      <td className="px-3 py-3.5">
                        <div className="font-mono text-[13px] font-semibold text-brand-dark">{formatNaira(loan.amount)}</div>
                        <div className="text-[11px] text-gray-400">{loan.interestRate}% APR &middot; {new Date(loan.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</div>
                      </td>
                      <td className="px-3 py-3.5 text-[13px] text-gray-600">{formatTerm(loan.termMonths)}</td>
                      <td className="px-3 py-3.5 text-right font-mono text-[13px] text-brand-dark">{formatNaira(loan.monthlyPayment)}</td>
                      <td className="px-3 py-3.5 text-right font-mono text-[13px] text-gray-700">
                        {loan.status === "disbursed" && loan.outstandingBalance !== undefined ? formatNaira(loan.outstandingBalance) : "—"}
                      </td>
                      <td className="px-3 py-3.5 text-[12px] text-gray-600">
                        {loan.status === "disbursed" && loan.nextDueDate
                          ? new Date(loan.nextDueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                          : "—"}
                      </td>
                      <td className="px-3 py-3.5">
                        <span className="rounded-md px-2 py-0.5 font-mono text-[9px] font-bold uppercase" style={{ color: STATUS_COLORS[loan.status], backgroundColor: `${STATUS_COLORS[loan.status]}12` }}>{loan.status}</span>
                      </td>
                      <td className="px-3 py-3.5 text-right">
                        <span className="text-[12px] font-semibold" style={{ color: cfg.colors.primary }}>View &rarr;</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} totalPages={totalPages} total={total} limit={LIMIT} onPageChange={setPage} loading={loading} />
          </Card>
        </FadeInUp>
      )}
    </div>
  );
}
