"use client";

import { useState, useEffect, useCallback } from "react";
import { config, BrandConfig } from "@thrift/config";
import { Card, FadeIn, ColorfulBadge } from "@thrift/ui";
import { formatNaira } from "@thrift/utils";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/PageHeader";
import { PaymentModal } from "@/components/PaymentModal";
import Pagination from "@/components/Pagination";
import { useRouter } from "next/navigation";

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
  const TX_LIMIT = 8;

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

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

  return (
    <div className="mx-auto max-w-[1280px] p-[clamp(1rem,3vw,2rem)]">
      <PageHeader
        badgeLabel="Your Money"
        heading="Wallet"
        accentText="Overview"
        description="Track your spendable balance, funds locked in active circles, and recent activity."
        right={
          <button
            onClick={() => setFundOpen(true)}
            className="rounded-full px-5 py-2.5 text-[12px] font-semibold border-none text-white cursor-pointer transition-all duration-200 hover:opacity-90"
            style={{ backgroundColor: cfg.colors.primary }}
          >
            + Fund Wallet
          </button>
        }
      />

      {/* Balance hero */}
      <FadeIn>
        <div
          className="relative overflow-hidden rounded-[1.75rem] p-6 text-white sm:p-8"
          style={{ background: `linear-gradient(135deg, ${cfg.colors.primary}, ${cfg.colors.secondary || cfg.colors.primary})` }}
        >
          <div
            className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full opacity-20"
            style={{ background: `radial-gradient(circle, ${cfg.colors.accent}, transparent 70%)` }}
          />
          <div className="relative">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] opacity-80">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M3 10h18M3 14h18M5 10v10a1 1 0 001 1h12a1 1 0 001-1V10M7 10V7a5 5 0 0110 0v3" /></svg>
              Available Balance
            </div>
            <div className="mt-2 font-mono text-[clamp(2.25rem,6vw,3.25rem)] font-extrabold leading-none">
              {loading ? (
                <span className="inline-block h-10 w-56 animate-pulse rounded-md bg-white/30 align-middle" />
              ) : (
                formatNaira(breakdown.available)
              )}
            </div>
            <p className="mt-3 text-[12px] opacity-80">
              Spendable & withdrawable now
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={() => setFundOpen(true)}
                className="flex items-center gap-2 rounded-full bg-white/95 px-5 py-2.5 text-[12px] font-semibold text-brand-dark transition-all duration-200 hover:bg-white"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                Fund Wallet
              </button>
              <a
                href="/transactions"
                className="flex items-center gap-2 rounded-full border border-white/40 bg-white/10 px-5 py-2.5 text-[12px] font-semibold text-white transition-all duration-200 hover:bg-white/20"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                View Activity
              </a>
            </div>
          </div>
        </div>
      </FadeIn>

      {/* Quick fund chips */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Quick fund</span>
        {QUICK_AMOUNTS.map((amt) => (
          <button
            key={amt}
            onClick={() => { setFundAmount(amt); setFundOpen(true); }}
            className="rounded-full border border-gray-200 bg-white px-4 py-1.5 text-[12px] font-semibold text-brand-dark transition-all duration-200 hover:border-brand-primary hover:text-brand-primary"
          >
            {formatNaira(amt)}
          </button>
        ))}
      </div>

      {/* Breakdown cards */}
      <div className="mt-6 grid grid-cols-1 items-stretch gap-4 md:grid-cols-2 lg:grid-cols-4">
        <FadeIn delay={0.05} className="h-full">
          <Card className="!rounded-[1.5rem] !border-0 h-full" padding="2rem">
            <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-400">
              Locked in Circles
            </span>
            <div className="mt-2 font-mono text-[1.5rem] font-bold text-brand-dark">
              {formatNaira(breakdown.committed)}
            </div>
            <p className="mt-3 text-[11px] text-gray-500">
              Principal committed to active circles, released at maturity
            </p>
          </Card>
        </FadeIn>

        <FadeIn delay={0.08} className="h-full">
          <Card className="!rounded-[1.5rem] !border-0 h-full" padding="2rem">
            <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-400">
              Matured (Pending Disbursement)
            </span>
            <div className="mt-2 font-mono text-[1.5rem] font-bold text-brand-dark">
              {formatNaira(breakdown.matured)}
            </div>
            <p className="mt-3 text-[11px] text-gray-500">
              Grown principal + interest awaiting payout to your wallet
            </p>
          </Card>
        </FadeIn>

        <FadeIn delay={0.1} className="h-full">
          <Card className="!rounded-[1.5rem] !border-0 h-full" padding="2rem">
            <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-400">
              Total Balance
            </span>
            <div className="mt-2 font-mono text-[1.5rem] font-bold text-brand-dark">
              {formatNaira(breakdown.total)}
            </div>
            <p className="mt-3 text-[11px] text-gray-500">
              Available + locked funds
            </p>
          </Card>
        </FadeIn>

        <FadeIn delay={0.15} className="h-full">
          <Card className="!rounded-[1.5rem] !border-0 overflow-hidden h-full" padding="2rem">
            <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-400">
              Funds Allocation
            </span>
            <div className="mt-4 flex h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-brand-primary transition-all duration-500"
                style={{ width: `${100 - lockedPct}%` }}
              />
              <div
                className="h-full rounded-full"
                style={{ width: `${lockedPct}%`, backgroundColor: cfg.colors.accent }}
              />
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px]">
              <span className="flex items-center gap-1.5 text-gray-500">
                <span className="h-2 w-2 rounded-full bg-brand-primary" /> Available {100 - lockedPct}%
              </span>
              <span className="flex items-center gap-1.5 text-gray-500">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: cfg.colors.accent }} /> Locked {lockedPct}%
              </span>
            </div>
          </Card>
        </FadeIn>
      </div>

      {/* Recent activity */}
      <div className="mt-6">
        <Card padding="2rem" className="!rounded-[1.5rem]">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-brand-dark">Recent Activity</h2>
            <a href="/transactions" className="text-[12px] font-semibold" style={{ color: cfg.colors.primary }}>
              View all
            </a>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-14 animate-pulse rounded-xl bg-gray-100" />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M3 10h18M3 14h18M5 10v10a1 1 0 001 1h12a1 1 0 001-1V10M7 10V7a5 5 0 0110 0v3" /></svg>
              </div>
              <p className="text-[13px] text-gray-500">
                No transactions yet. Fund your wallet to get started.
              </p>
              <button
                onClick={() => setFundOpen(true)}
                className="rounded-full px-4 py-2 text-[12px] font-semibold text-white"
                style={{ backgroundColor: cfg.colors.primary }}
              >
                Fund Wallet
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {transactions.map((t) => {
                const credit = isCredit(t);
                return (
                  <div
                  key={t.id}
                  onClick={() => router.push(`/transactions/${t.id}`)}
                  className="flex cursor-pointer items-center justify-between py-3 transition-colors hover:bg-gray-50/60"
                >
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-full text-[15px] font-bold"
                        style={{ backgroundColor: credit ? "#ECFDF5" : "#FEF2F2", color: credit ? "#059669" : "#DC2626" }}
                      >
                        {credit ? "+" : "−"}
                      </div>
                      <div>
                        <div className="text-[13px] font-semibold text-brand-dark">
                          {getTypeLabel(t.type)}
                        </div>
                        <div className="text-[11px] text-gray-400">
                          {new Date(t.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          {t.description ? ` · ${t.description}` : ""}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className="font-mono text-[13px] font-semibold"
                        style={{ color: credit ? "#059669" : "#DC2626" }}
                      >
                        {credit ? "+" : "−"}{formatNaira(t.amount)}
                      </div>
                      <div className="text-[10px] capitalize text-gray-400">{t.status}</div>
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
        </Card>
      </div>

      <PaymentModal
        isOpen={fundOpen}
        onClose={() => setFundOpen(false)}
        amount={fundAmount}
        onSuccess={() => { loadWallet(); loadTransactions(); }}
      />
    </div>
  );
}
