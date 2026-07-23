"use client";

import { useState, useEffect, useCallback } from "react";
import confetti from "canvas-confetti";
import { config, BrandConfig } from "@thrift/config";
import { Card, Button, FadeIn, FadeInUp, StaggerChildren, StatCard } from "@thrift/ui";
import { formatNaira } from "@thrift/utils";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/PageHeader";
import { Skeleton, SkeletonCard } from "@/components/Skeleton";
import { LoanCalculator } from "@/components/LoanCalculator";
import Pagination from "@/components/Pagination";
import { SimpleTable, SimpleColumn } from "@/components/SimpleTable";
import { useRouter } from "next/navigation";
import {
  DollarSign,
  Wallet,
  TrendingUp,
  CheckCircle2,
  X,
  ArrowRight,
  Calendar,
  Clock,
  ShieldCheck,
  FileText,
  AlertCircle,
  CreditCard,
} from "lucide-react";

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
  const [toast, setToast] = useState<string | null>(null);
  const LIMIT = 20;

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

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

  const loanColumns: SimpleColumn<Loan>[] = [
    {
      key: "amount",
      header: "Loan",
      render: (loan) => (
        <div>
          <div className="font-mono text-[13px] font-semibold text-slate-900 dark:text-white">{formatNaira(loan.amount)}</div>
          <div className="text-[11px] text-slate-400">{loan.interestRate}% APR &middot; {new Date(loan.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</div>
        </div>
      ),
    },
    {
      key: "termMonths",
      header: "Term",
      render: (loan) => <span className="text-[13px] text-slate-600 dark:text-slate-300">{formatTerm(loan.termMonths)}</span>,
    },
    {
      key: "monthlyPayment",
      header: "Monthly",
      align: "right",
      mono: true,
      render: (loan) => <span className="text-[13px] text-slate-900 dark:text-white">{formatNaira(loan.monthlyPayment)}</span>,
    },
    {
      key: "outstandingBalance",
      header: "Outstanding",
      align: "right",
      mono: true,
      render: (loan) => (
        <span className="text-[13px] text-slate-700 dark:text-slate-300">
          {loan.status === "disbursed" && loan.outstandingBalance !== undefined ? formatNaira(loan.outstandingBalance) : "—"}
        </span>
      ),
    },
    {
      key: "nextDueDate",
      header: "Next Due",
      render: (loan) => (
        <span className="text-[12px] text-slate-600 dark:text-slate-300">
          {loan.status === "disbursed" && loan.nextDueDate
            ? new Date(loan.nextDueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
            : "—"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (loan) => (
        <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider"
          style={{ color: STATUS_COLORS[loan.status], backgroundColor: `${STATUS_COLORS[loan.status]}15` }}>
          {loan.status}
        </span>
      ),
    },
    {
      key: "view",
      header: "",
      align: "right",
      render: () => <span className="text-[12px] font-semibold text-teal-600 dark:text-teal-400">View &rarr;</span>,
    },
  ];

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
        confetti({ particleCount: 110, spread: 85, origin: { y: 0.6 } });
        triggerToast("Loan request submitted!");
        setSuccess(true);
        setAmount("");
        setTermMonths("12");
        setPurpose("");
        setShowForm(false);
        fetchLoans();
        setTimeout(() => setSuccess(false), 3000);
      } else {
        triggerToast(data.error || "Failed to submit loan request");
      }
    } catch {
      triggerToast("Failed to submit loan request");
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
    <div className="mx-auto max-w-[1280px] p-[clamp(1rem,3vw,2rem)] space-y-8">
      <PageHeader badgeLabel="Financial" heading="Low Interest" accentText="Loans" description="Access community-funded loans at just 5% annual interest rate."
        right={<button onClick={() => setShowForm(!showForm)} disabled={!!activeLoan} className="btn-primary py-2.5 px-4 text-xs bg-teal-600 hover:bg-teal-700">{showForm ? "Cancel" : "+ Request Loan"}</button>} />

      {/* Color-coded Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Borrowed" value={formatNaira(loanStats.totalBorrowed)} change={`${loans.length} total loan${loans.length !== 1 ? "s" : ""}`} icon={<DollarSign className="w-4 h-4" />} color="teal" />
        <StatCard label="Active Loan" value={activeLoan ? formatNaira(activeLoan.amount) : "None"} change={activeLoan ? activeLoan.status : "No active loan"} icon={<Wallet className="w-4 h-4" />} color="blue" />
        <StatCard label="Completed" value={String(loanStats.completedCount)} change={loanStats.completedCount > 0 ? "Successfully repaid" : "No completed loans yet"} icon={<CheckCircle2 className="w-4 h-4" />} color="emerald" />
        <StatCard label="Interest Rate" value="5%" change="Annual percentage rate" icon={<TrendingUp className="w-4 h-4" />} color="amber" />
      </div>

      <FadeInUp delay={200} className="mb-8">
        <LoanCalculator onRequestLoan={handleRequestFromCalculator} disabled={!!activeLoan} />
      </FadeInUp>

      {showForm && (
        <FadeInUp>
          <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-6 mb-6 max-w-[700px]">
            <div className="flex items-center gap-2 mb-1">
              <span className="px-3 py-1 rounded-full bg-teal-100 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-teal-500" />
                <span>Loan Request</span>
              </span>
            </div>
            <h3 className="font-display font-bold text-xl sm:text-2xl text-slate-900 dark:text-white mt-1 mb-6">Request a Loan</h3>

            <form onSubmit={handleApply}>
              <div className="mb-4">
                <label className="mb-1.5 block text-xs font-semibold text-slate-900 dark:text-white">Loan Amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-[13px] text-slate-400">&#8358;</span>
                  <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" step="100" min="100" className="box-border w-full rounded-xl border border-slate-200/80 bg-white py-2.5 pl-8 pr-3 font-mono text-[13px] text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 dark:border-slate-800/80 dark:bg-slate-900 dark:text-white" />
                </div>
              </div>

              <div className="mb-4">
                <label className="mb-1.5 block text-xs font-semibold text-slate-900 dark:text-white">Repayment Term</label>
                <div className="mb-2 flex flex-wrap gap-2">
                  {TERM_PRESETS.map((t) => (
                    <button key={t} type="button" onClick={() => setTermMonths(String(t))}
                      className={`cursor-pointer px-5 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 border ${
                        termMonths === String(t) ? 'bg-teal-600 border-teal-600 text-white shadow-md' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-teal-400'
                      }`}>
                      {formatTerm(t)}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input type="number" value={termMonths} onChange={(e) => setTermMonths(e.target.value)} min="1" max="60" className="box-border w-20 rounded-xl border border-slate-200/80 bg-white px-3 py-2 text-center text-[13px] text-slate-900 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 dark:border-slate-800/80 dark:bg-slate-900 dark:text-white" />
                  <span className="text-xs text-slate-500 dark:text-slate-400">months</span>
                </div>
              </div>

              <div className="mb-4">
                <label className="mb-1.5 block text-xs font-semibold text-slate-900 dark:text-white">Purpose (optional)</label>
                <textarea value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="e.g. Business expansion, Education, Medical" rows={3} className="box-border w-full resize-y rounded-xl border border-slate-200/80 bg-white px-3 py-2.5 text-[13px] text-slate-900 outline-none placeholder:text-slate-400 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 dark:border-slate-800/80 dark:bg-slate-900 dark:text-white" />
              </div>

              <div className="mb-4">
                <label className="mb-1.5 block text-xs font-semibold text-slate-900 dark:text-white">Processing Fee (optional)</label>
                <div className="grid grid-cols-2 gap-3">
                  <select value={feeType} onChange={(e) => setFeeType(e.target.value as "fixed" | "percent" | "")} className="box-border w-full rounded-xl border border-slate-200/80 bg-white px-3 py-2.5 text-[13px] text-slate-900 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 dark:border-slate-800/80 dark:bg-slate-900 dark:text-white">
                    <option value="">None</option>
                    <option value="fixed">Fixed (&#8358;)</option>
                    <option value="percent">Percent of loan (%)</option>
                  </select>
                  <input type="number" step="0.01" value={feeValue} onChange={(e) => setFeeValue(e.target.value)} disabled={!feeType} placeholder={feeType === "percent" ? "e.g. 2" : "e.g. 1000"} className="box-border w-full rounded-xl border border-slate-200/80 bg-white px-3 py-2.5 font-mono text-[13px] text-slate-900 outline-none placeholder:text-slate-400 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 disabled:bg-slate-100 dark:border-slate-800/80 dark:bg-slate-900 dark:text-white dark:disabled:bg-slate-800" />
                </div>
              </div>

              {error && <div className="mb-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 px-4 py-3 text-xs text-red-600 dark:text-red-300 flex items-center gap-2"><AlertCircle className="w-4 h-4" />{error}</div>}
              {success && <div className="mb-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 px-4 py-3 text-xs text-emerald-600 dark:text-emerald-300 flex items-center gap-2"><CheckCircle2 className="w-4 h-4" />Loan request submitted!</div>}
              <Button type="submit" variant="primary" size="md" className="btn-primary py-2.5 px-4 text-xs bg-teal-600 hover:bg-teal-700" disabled={submitting || !!activeLoan}>{submitting ? "Submitting..." : "Request Loan"}</Button>
            </form>
          </div>
        </FadeInUp>
      )}

      {loading ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-6">{Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}</div>
      ) : total === 0 ? (
        <FadeInUp delay={400}>
          <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-12">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 dark:bg-teal-950/40">
                <DollarSign className="w-7 h-7 text-teal-500" />
              </div>
              <h3 className="mb-2 font-display text-lg font-bold text-slate-900 dark:text-white">No loans yet</h3>
              <p className="mb-4 text-[13px] text-slate-500 dark:text-slate-400">Access low-interest loans funded by the community.</p>
              <Button variant="primary" size="sm" className="btn-primary py-2.5 px-4 text-xs bg-teal-600 hover:bg-teal-700" onClick={() => setShowForm(true)}>Request Your First Loan</Button>
            </div>
          </div>
        </FadeInUp>
      ) : (
        <FadeInUp delay={400}>
          <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-6">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-teal-100 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-teal-500" />
                <span>Loan History</span>
              </span>
            </div>
            <div className="mt-1 mb-6 flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-display font-bold text-xl sm:text-2xl text-slate-900 dark:text-white">Your Loans ({total})</h3>
              <div className="flex gap-1">
                {(["all", "pending", "approved", "disbursed", "completed", "rejected"] as const).map((f) => (
                  <button key={f} onClick={() => setStatusFilter(f)}
                    className={`px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 border ${
                      statusFilter === f ? 'bg-teal-600 border-teal-600 text-white shadow-md' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-teal-400'
                    }`}>
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <SimpleTable columns={loanColumns} data={filteredLoans} onRowClick={(loan) => router.push(`/loans/${loan.id}`)} />
            <Pagination page={page} totalPages={totalPages} total={total} limit={LIMIT} onPageChange={setPage} loading={loading} />
          </div>
        </FadeInUp>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed top-24 right-6 z-50 bg-emerald-600 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-emerald-400 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-100" />
          <div className="text-xs font-semibold"><div>{toast}</div><div className="text-[10px] text-emerald-200">Financial Ledger Updated</div></div>
        </div>
      )}
    </div>
  );
}
