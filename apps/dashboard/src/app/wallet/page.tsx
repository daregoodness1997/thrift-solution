"use client";

import { useState, useEffect, useCallback } from "react";
import { config, BrandConfig } from "@thrift/config";
import { formatNaira } from "@thrift/utils";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/PageHeader";
import { PaymentModal } from "@/components/PaymentModal";
import Pagination from "@/components/Pagination";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import {
  Wallet,
  Plus,
  ArrowRight,
  CreditCard,
  CheckCircle2,
  PiggyBank,
  TrendingUp,
  Lock,
  Clock,
  PieChart,
} from "lucide-react";

const fallback = config;

interface WalletBreakdown {
  total: number;
  available: number;
  committed: number;
  matured: number;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description?: string;
  status: string;
  createdAt: string;
  reference: string;
}

const CREDIT_TYPES = [
  "funding",
  "payout",
  "circle_withdrawal",
  "circle_interest",
  "referral_earning",
  "wallet_funding",
];

const QUICK_AMOUNTS = [5000, 10000, 25000, 50000];

export default function WalletPage() {
  const { token } = useAuth();
  const router = useRouter();
  const [cfg, setCfg] = useState<BrandConfig>(fallback);
  const [breakdown, setBreakdown] = useState<WalletBreakdown>({ total: 0, available: 0, committed: 0, matured: 0 });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [fundOpen, setFundOpen] = useState(false);
  const [fundAmount, setFundAmount] = useState(5000);
  const [txPage, setTxPage] = useState(1);
  const [txTotal, setTxTotal] = useState(0);
  const [txTotalPages, setTxTotalPages] = useState(1);
  const [toast, setToast] = useState<string | null>(null);
  const TX_LIMIT = 8;

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    fetch(`${API_URL}/api/config`)
      .then((r) => r.json())
      .then((data) => { if (data?.name) setCfg((p) => ({ ...p, ...data })); })
      .catch(() => {});
  }, [API_URL]);

  const loadWallet = useCallback(async () => {
    if (!token) { setLoading(false); return; }
    setLoading(true);
    try {
      const bdRes = await fetch(`${API_URL}/api/wallet/balance/breakdown`, { headers: { Authorization: `Bearer ${token}` } });
      const bd = await bdRes.json();
      if (bd.success) setBreakdown(bd.data);
    } catch {}
    setLoading(false);
  }, [token, API_URL]);

  const loadTransactions = useCallback(async () => {
    if (!token) return;
    try {
      const txRes = await fetch(`${API_URL}/api/transactions?page=${txPage}&limit=${TX_LIMIT}`, { headers: { Authorization: `Bearer ${token}` } });
      const tx = await txRes.json();
      if (tx.success) {
        setTransactions(tx.data.items || []);
        setTxTotal(tx.data.total || 0);
        setTxTotalPages(tx.data.totalPages || 1);
      }
    } catch {}
  }, [token, API_URL, txPage]);

  useEffect(() => { loadWallet(); }, [loadWallet]);
  useEffect(() => { loadTransactions(); }, [loadTransactions]);

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "wallet_funding": return "Wallet Funding";
      case "circle_withdrawal": return "Circle Payout";
      case "circle_payout": return "Circle Payout";
      case "loan_payout": return "Loan Disbursement";
      case "circle_interest": return "Circle Interest";
      case "circle_processing_fee": return "Processing Fee";
      case "circle_deposit": return "Circle Deposit";
      case "circle_contribution": return "Circle Contribution";
      case "referral_earning": return "Referral Earning";
      case "payout": return "Payout";
      case "funding": return "Funding";
      case "contribution": return "Contribution";
      default: return type.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    }
  };

  const isCredit = (t: Transaction) => CREDIT_TYPES.includes(t.type);

  const lockedPct = breakdown.total > 0
    ? Math.min(100, Math.round((breakdown.committed / breakdown.total) * 100))
    : 0;

  const handleFundSuccess = () => {
    confetti({ particleCount: 110, spread: 85, origin: { y: 0.6 } });
    triggerToast("Wallet funded successfully!");
    loadWallet();
    loadTransactions();
  };

  return (
    <div className="mx-auto max-w-[1280px] p-[clamp(1rem,3vw,2rem)] space-y-6">
      <PageHeader
        badgeLabel="Your Money"
        heading="Wallet"
        accentText="Overview"
        description="Track your spendable balance, funds locked in active circles, and recent activity."
        right={
          <button
            onClick={() => setFundOpen(true)}
            className="btn-primary rounded-full px-5 py-2.5 text-[12px] font-semibold"
          >
            <Plus className="w-4 h-4" /> Fund Wallet
          </button>
        }
      />

      {/* Hero Balance Card - LearnerDashboardView gradient style */}
      <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Wallet className="w-64 h-64 text-blue-400" />
        </div>
        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200/80 dark:border-blue-800/80 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1">
              <Wallet className="w-3.5 h-3.5" />
              <span>Available Balance</span>
            </span>
          </div>
          <div className="font-mono text-[clamp(2.25rem,6vw,3.25rem)] font-extrabold leading-none text-white">
            {loading ? (
              <span className="inline-block h-10 w-56 animate-pulse rounded-md bg-white/30 align-middle" />
            ) : (
              formatNaira(breakdown.available)
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Spendable & withdrawable now
          </p>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-800/80">
            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                <Lock className="w-3 h-3" /> Locked
              </div>
              <div className="font-display font-bold text-xl text-white mt-1">{formatNaira(breakdown.committed)}</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                <Clock className="w-3 h-3" /> Matured
              </div>
              <div className="font-display font-bold text-xl text-emerald-400 mt-1">{formatNaira(breakdown.matured)}</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> Total
              </div>
              <div className="font-display font-bold text-xl text-blue-400 mt-1">{formatNaira(breakdown.total)}</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                <PieChart className="w-3 h-3" /> Allocation
              </div>
              <div className="font-display font-bold text-xl text-amber-400 mt-1">{100 - lockedPct}% Free</div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={() => setFundOpen(true)}
              className="flex items-center gap-2 rounded-full bg-white/95 px-5 py-2.5 text-[12px] font-semibold text-slate-900 transition-all duration-200 hover:bg-white"
            >
              <Plus className="w-4 h-4" />
              Fund Wallet
            </button>
            <a
              href="/transactions"
              className="flex items-center gap-2 rounded-full border border-white/40 bg-white/10 px-5 py-2.5 text-[12px] font-semibold text-white transition-all duration-200 hover:bg-white/20"
            >
              <CreditCard className="w-4 h-4" />
              View Activity
            </a>
          </div>
        </div>
      </div>

      {/* Quick fund chips */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Quick fund</span>
        {QUICK_AMOUNTS.map((amt) => (
          <button
            key={amt}
            onClick={() => { setFundAmount(amt); setFundOpen(true); }}
            className="rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-1.5 text-[12px] font-semibold text-slate-900 dark:text-white transition-all duration-200 hover:border-blue-500 hover:text-blue-600"
          >
            {formatNaira(amt)}
          </button>
        ))}
      </div>

      {/* Color-coded Breakdown Cards - LearnerDashboardView style */}
      <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="p-5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/50 space-y-1">
          <div className="text-[10px] font-bold uppercase text-blue-700 dark:text-blue-400 tracking-wider flex items-center gap-1">
            <Wallet className="w-3.5 h-3.5" /><span>Available</span>
          </div>
          <div className="font-display font-bold text-2xl text-slate-900 dark:text-white">{formatNaira(breakdown.available)}</div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Spendable & withdrawable now</div>
        </div>

        <div className="p-5 rounded-2xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/50 space-y-1">
          <div className="text-[10px] font-bold uppercase text-rose-700 dark:text-rose-400 tracking-wider flex items-center gap-1">
            <Lock className="w-3.5 h-3.5" /><span>Locked in Circles</span>
          </div>
          <div className="font-display font-bold text-2xl text-slate-900 dark:text-white">{formatNaira(breakdown.committed)}</div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Released at maturity</div>
        </div>

        <div className="p-5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/50 space-y-1">
          <div className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-400 tracking-wider flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /><span>Matured</span>
          </div>
          <div className="font-display font-bold text-2xl text-slate-900 dark:text-white">{formatNaira(breakdown.matured)}</div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Pending disbursement</div>
        </div>

        <div className="p-5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/50 space-y-1">
          <div className="text-[10px] font-bold uppercase text-amber-700 dark:text-amber-400 tracking-wider flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /><span>Total Balance</span>
          </div>
          <div className="font-display font-bold text-2xl text-slate-900 dark:text-white">{formatNaira(breakdown.total)}</div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Available + locked funds</div>
        </div>
      </div>

      {/* Allocation Bar */}
      <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-6">
        <div className="mb-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-800/80 text-[10px] font-mono font-bold uppercase tracking-wider">
            <PieChart className="w-3 h-3" /> Funds Allocation
          </span>
        </div>
        <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div
            className="h-full rounded-full bg-blue-600 transition-all duration-500"
            style={{ width: `${100 - lockedPct}%` }}
          />
          <div
            className="h-full rounded-full bg-amber-500 transition-all duration-500"
            style={{ width: `${lockedPct}%` }}
          />
        </div>
        <div className="mt-3 flex items-center justify-between text-[11px]">
          <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
            <span className="h-2 w-2 rounded-full bg-blue-600" /> Available {100 - lockedPct}%
          </span>
          <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
            <span className="h-2 w-2 rounded-full bg-amber-500" /> Locked {lockedPct}%
          </span>
        </div>
      </div>

      {/* Recent activity */}
      <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-6">
        <div className="mb-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-slate-700/80 text-[10px] font-mono font-bold uppercase tracking-wider">
              Recent Activity
            </span>
            <h2 className="mt-2 text-lg font-bold text-slate-900 dark:text-white">Transaction History</h2>
          </div>
          <a href="/transactions" className="text-[12px] font-semibold text-blue-600 flex items-center gap-1">
            View all <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600">
              <CreditCard className="w-6 h-6" />
            </div>
            <p className="text-[13px] text-slate-500 dark:text-slate-400">
              No transactions yet. Fund your wallet to get started.
            </p>
            <button
              onClick={() => setFundOpen(true)}
              className="btn-primary rounded-full px-4 py-2 text-[12px] font-semibold"
            >
              Fund Wallet
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-200/80 dark:divide-slate-800/80">
            {transactions.map((t) => {
              const credit = isCredit(t);
              return (
                <div
                  key={t.id}
                  onClick={() => router.push(`/transactions/${t.id}`)}
                  className="flex cursor-pointer items-center justify-between py-3 transition-colors hover:bg-slate-50/60 dark:hover:bg-slate-800/40"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-full text-[15px] font-bold"
                      style={{ backgroundColor: credit ? "#ECFDF5" : "#FEF2F2", color: credit ? "#059669" : "#DC2626" }}
                    >
                      {credit ? "+" : "\u2212"}
                    </div>
                    <div>
                      <div className="text-[13px] font-semibold text-slate-900 dark:text-white">
                        {getTypeLabel(t.type)}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {new Date(t.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        {t.description ? ` \u00b7 ${t.description}` : ""}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className="font-mono text-[13px] font-semibold"
                      style={{ color: credit ? "#059669" : "#DC2626" }}
                    >
                      {credit ? "+" : "\u2212"}{formatNaira(t.amount)}
                    </div>
                    <span className={`rounded-lg px-2 py-0.5 text-[9px] font-bold ${t.status === "completed" ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400" : t.status === "pending" ? "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}`}>
                      {t.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && transactions.length > 0 && (
          <Pagination
            page={txPage}
            totalPages={txTotalPages}
            total={txTotal}
            limit={TX_LIMIT}
            onPageChange={setTxPage}
          />
        )}
      </div>

      <PaymentModal
        isOpen={fundOpen}
        onClose={() => setFundOpen(false)}
        amount={fundAmount}
        onSuccess={handleFundSuccess}
      />

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
