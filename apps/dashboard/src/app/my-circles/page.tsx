"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { config, BrandConfig } from "@thrift/config";
import { Card, Button, FadeIn, FadeInUp, StaggerChildren, StatCard } from "@thrift/ui";
import { formatNaira } from "@thrift/utils";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/PageHeader";
import { Skeleton, SkeletonCard } from "@/components/Skeleton";
import { SimpleTable, SimpleColumn } from "@/components/SimpleTable";

const fallback = config;

interface CircleAccount {
  id: string;
  circleId: string;
  principalAmount: number;
  interestEarned: number;
  totalWithdrawn: number;
  status: string;
  weeksContributed?: number;
  weeksDefaulted?: number;
  startDate: string;
  maturityDate: string;
  lastInterestCalculation?: string;
  circle: { id: string; name: string; cycleType?: string; amount: number; weeklyAmount?: number | null; totalWeeks?: number | null; durationMonths: number; interestRateAnnual: number; autoPayout?: boolean; payoutMode?: string; blockPayoutOnDefault?: boolean; defaultPenaltyType?: string | null; defaultPenaltyValue?: number | null };
}

function isAutoPayout(c: { autoPayout?: boolean; payoutMode?: string }) {
  if (c.payoutMode) return c.payoutMode === "auto";
  return !!c.autoPayout;
}

function formatClearanceLabel(penaltyType?: string | null, penaltyValue?: number | null) {
  const pt = penaltyType || "percent";
  const pv = penaltyValue != null ? penaltyValue : 100;
  if (pt === "percent") return `${100 + pv}%`;
  return `+₦${pv.toLocaleString()}`;
}

interface InterestLog {
  id: string;
  amount: number;
  principalAtCalculation: number;
  annualRate: number;
  calculatedAt: string;
}

interface CircleTransaction {
  id: string;
  type: string;
  amount: number;
  reference: string;
  status: string;
  description?: string;
  createdAt: string;
}

const ACCOUNT_STATUS_COLORS: Record<string, string> = {
  active: "#10B981",
  matured: "#F59E0B",
  withdrawn: "#6B7280",
  early_withdrawn: "#DC2626",
  reversed: "#DC2626",
};

const ACCOUNT_STATUS_BG: Record<string, string> = {
  active: "#ECFDF5",
  matured: "#FFFBEB",
  withdrawn: "#F3F4F6",
  early_withdrawn: "#FEF2F2",
  reversed: "#FEF2F2",
};

type StatusFilter = "all" | "active" | "matured" | "withdrawn" | "reversed";

function formatDuration(months: number) {
  if (months < 12) return `${months}mo`;
  const y = Math.floor(months / 12);
  const m = months % 12;
  return m > 0 ? `${y}y ${m}mo` : `${y}y`;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatDateTime(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function daysUntil(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function getMaturityProgress(startDate: string, maturityDate: string) {
  const start = new Date(startDate).getTime();
  const end = new Date(maturityDate).getTime();
  const now = Date.now();
  if (now >= end) return 100;
  if (now <= start) return 0;
  return Math.min(100, Math.round(((now - start) / (end - start)) * 100));
}

function getTransactionTypeColor(type: string) {
  switch (type) {
    case "circle_deposit": return "#7C3AED";
    case "circle_interest": return "#D97706";
    case "circle_withdrawal": return "#0891B2";
    case "circle_reversal": return "#DC2626";
    default: return "#717171";
  }
}

function getTransactionTypeLabel(type: string) {
  switch (type) {
    case "circle_reversal": return "Reversal (Payment Reversed)";
    case "circle_deposit": return "Deposit";
    case "circle_interest": return "Interest";
    case "circle_withdrawal": return "Withdrawal";
    default: return type.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  }
}

export default function MyCirclesPage() {
  const { token } = useAuth();
  const [cfg, setCfg] = useState<BrandConfig>(fallback);
  const [myAccounts, setMyAccounts] = useState<CircleAccount[]>([]);
  const [stats, setStats] = useState({ total: 0, activeCount: 0, maturedCount: 0, totalInvested: 0, totalInterest: 0, totalMaturityValue: 0 });
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [expandedAccount, setExpandedAccount] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [accountSubTab, setAccountSubTab] = useState<"interest" | "transactions">("interest");
  const [interestLogs, setInterestLogs] = useState<InterestLog[]>([]);
  const [accountTransactions, setAccountTransactions] = useState<CircleTransaction[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [withdrawing, setWithdrawing] = useState<string | null>(null);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  useEffect(() => { fetch(`${API_URL}/api/config`).then((r) => r.json()).then((d) => { if (d && d.name) setCfg((p) => ({ ...p, ...d })); }).catch(() => {}); }, [API_URL]);

  const fetchData = useCallback(async () => {
    if (!token) { setLoading(false); return; }
    try {
      const res = await fetch(`${API_URL}/api/circles/accounts/my${statusFilter !== "all" ? `?status=${statusFilter}` : ""}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) {
        setMyAccounts(data.data.items || []);
        if (data.data.stats) setStats(data.data.stats);
        setWalletBalance(data.data.walletBalance || 0);
      }
    } catch {}
    setLoading(false);
  }, [token, API_URL, statusFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => { if (token) fetchData(); }, [statusFilter, fetchData, token]);

  const fetchAccountDetails = useCallback(async (accountId: string) => {
    if (!token) return;
    setLoadingDetails(true);
    try {
      const [logsRes, txRes] = await Promise.all([
        fetch(`${API_URL}/api/circles/accounts/${accountId}/interest-logs`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/api/circles/accounts/${accountId}/transactions`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const logsData = await logsRes.json();
      const txData = await txRes.json();
      if (logsData.success) setInterestLogs(logsData.data);
      if (txData.success) setAccountTransactions(txData.data);
    } catch {}
    setLoadingDetails(false);
  }, [token, API_URL]);

  useEffect(() => {
    if (expandedAccount) {
      fetchAccountDetails(expandedAccount);
    } else {
      setInterestLogs([]);
      setAccountTransactions([]);
    }
  }, [expandedAccount, fetchAccountDetails]);

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleWithdraw = async (accountId: string) => {
    setWithdrawing(accountId);
    try {
      const res = await fetch(`${API_URL}/api/circles/accounts/${accountId}/withdraw`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        showMessage("success", "Early withdrawal completed. Principal returned to wallet.");
        setWalletBalance(data.data.walletBalance);
        fetchData();
      } else {
        showMessage("error", data.error || "Failed to withdraw");
      }
    } catch {
      showMessage("error", "Failed to withdraw from circle account");
    }
    setWithdrawing(null);
  };

  const handleClaim = async (accountId: string) => {
    setClaiming(accountId);
    try {
      const res = await fetch(`${API_URL}/api/circles/accounts/${accountId}/mature`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        if (data.data?.type === "payout_request") {
          showMessage("success", "Payout request submitted. Waiting for admin approval.");
        } else {
          showMessage("success", "Maturity payout credited to wallet!");
          setWalletBalance(data.data.walletBalance);
        }
        fetchData();
      } else {
        showMessage("error", data.error || "Failed to claim maturity");
      }
    } catch {
      showMessage("error", "Failed to claim matured account");
    }
    setClaiming(null);
  };

  const filteredAccounts = myAccounts;

  const circleGroups = useMemo(() => {
    const map = new Map<string, { circle: CircleAccount["circle"]; accounts: CircleAccount[] }>();
    for (const account of filteredAccounts) {
      const key = account.circleId;
      if (!map.has(key)) {
        map.set(key, { circle: account.circle, accounts: [] });
      }
      map.get(key)!.accounts.push(account);
    }
    return Array.from(map.entries()).map(([circleId, { circle, accounts }]) => ({
      circleId,
      circle,
      accounts,
      totalInvested: accounts.reduce((s, a) => s + a.principalAmount, 0),
      totalInterest: accounts.reduce((s, a) => s + a.interestEarned, 0),
      activeCount: accounts.filter((a) => a.status === "active").length,
    }));
  }, [filteredAccounts]);

  const toggleGroup = (circleId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(circleId)) next.delete(circleId);
      else next.add(circleId);
      return next;
    });
  };

  const expandAllGroups = () => {
    setExpandedGroups(new Set(circleGroups.map((g) => g.circleId)));
  };

  const collapseAllGroups = () => {
    setExpandedGroups(new Set());
  };

  return (
    <div className="mx-auto max-w-[1280px] p-[clamp(1rem,3vw,2rem)]">
      <PageHeader badgeLabel="Savings" heading="My" accentText="Circles" description="Detailed view of all your circle savings accounts, interest earnings, and transaction history."
        right={<span className="text-[12px] text-slate-500 dark:text-slate-400">Wallet: <span className="font-mono font-semibold text-blue-600">{formatNaira(walletBalance)}</span></span>} />

      {message && (
        <FadeIn>
          <div className="mb-6 rounded-2xl px-4 py-3 text-[13px] font-medium" style={{ backgroundColor: message.type === "success" ? "#ECFDF5" : "#FEF2F2", color: message.type === "success" ? "#059669" : "#DC2626", border: `1px solid ${message.type === "success" ? "#A7F3D0" : "#FECACA"}` }}>
            {message.text}
          </div>
        </FadeIn>
      )}

      <StaggerChildren staggerDelay={100} className="mb-8 grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-6">
        <StatCard label="Total Invested" value={formatNaira(stats.totalInvested)} change={`${stats.total} account${stats.total !== 1 ? "s" : ""}`} positive variant="default" />
        <StatCard label="Interest Earned" value={formatNaira(stats.totalInterest)} change={stats.activeCount > 0 ? `${stats.activeCount} earning` : "No active accounts"} positive variant="warm" />
        <StatCard label="Maturity Value" value={formatNaira(stats.totalMaturityValue)} change={`${stats.activeCount + stats.maturedCount} pending`} positive variant="default" />
        <StatCard label="Active Accounts" value={String(stats.activeCount)} change={stats.maturedCount > 0 ? `${stats.maturedCount} matured` : "None matured"} positive variant="warm" />
      </StaggerChildren>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-2 flex-1">
          {(["all", "active", "matured", "withdrawn", "reversed"] as StatusFilter[]).map((filter) => {
            const count = filter === "all" ? stats.total : myAccounts.filter((a) => a.status === filter).length;
            return (
              <button key={filter} onClick={() => setStatusFilter(filter)}
                className="cursor-pointer rounded-full border-[1.5px] px-5 py-2 text-[12px] font-semibold transition-all duration-150"
                style={{ backgroundColor: statusFilter === filter ? "#2563EB" : "#ffffff", color: statusFilter === filter ? "#ffffff" : "#717171", borderColor: statusFilter === filter ? "#2563EB" : "#EAEAEA" }}>
                {filter.charAt(0).toUpperCase() + filter.slice(1)} ({count})
              </button>
            );
          })}
        </div>
        {circleGroups.length > 1 && (
          <div className="flex gap-1.5">
            <button onClick={expandAllGroups} className="cursor-pointer rounded-full border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400 hover:border-blue-400 hover:text-blue-600 transition-all">
              Expand All
            </button>
            <button onClick={collapseAllGroups} className="cursor-pointer rounded-full border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400 hover:border-blue-400 hover:text-blue-600 transition-all">
              Collapse All
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-6">{Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}</div>
      ) : filteredAccounts.length === 0 ? (
        <FadeInUp delay={200}>
          <Card padding="3rem">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-[20px]">&#8358;</div>
                <h3 className="mb-2 text-[1rem] font-semibold text-slate-900 dark:text-white">
                  {statusFilter === "all" ? "No circle accounts yet" : `No ${statusFilter} accounts`}
                </h3>
                <p className="mb-4 text-[13px] text-slate-500 dark:text-slate-400">
                  {statusFilter === "all" ? "Open a circle account to start earning weekly interest." : "Try a different filter."}
                </p>
              {statusFilter === "all" && <Button variant="primary" size="sm" onClick={() => window.location.href = "/circles"}>Browse Circles</Button>}
            </div>
          </Card>
        </FadeInUp>
      ) : (
        <FadeInUp delay={200}>
          <div className="flex flex-col gap-4">
            {circleGroups.map((group) => {
              const isGroupExpanded = expandedGroups.has(group.circleId);
              return (
                <Card key={group.circleId} padding="0" className="rounded-3xl overflow-hidden">
                  {/* Group Header */}
                  <div
                    className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    onClick={() => toggleGroup(group.circleId)}
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950/50 font-mono text-[12px] font-bold text-blue-600 dark:text-blue-400">
                        {group.accounts.length}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-[15px] font-semibold text-slate-900 dark:text-white">{group.circle.name}</span>
                          {group.circle.cycleType === "weekly_contribution" && (
                            <span className="shrink-0 rounded-[0.375rem] px-2 py-0.5 text-[9px] font-bold uppercase font-mono text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400">Weekly</span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 dark:text-slate-500">
                          {group.accounts.length} account{group.accounts.length !== 1 ? "s" : ""} &middot; {formatNaira(group.totalInvested)} invested &middot; {group.circle.interestRateAnnual}% p.a. &middot; {formatDuration(group.circle.durationMonths)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {group.activeCount > 0 && (
                        <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                          {group.activeCount} active
                        </span>
                      )}
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={isGroupExpanded ? "#2563EB" : "#999"} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="shrink-0 transition-transform duration-200" style={{ transform: isGroupExpanded ? "rotate(180deg)" : "rotate(0deg)" }}>
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </div>
                  </div>

                  {/* Group Summary Bar */}
                  <div className="border-t border-slate-100 dark:border-slate-800 px-5 py-2.5 bg-slate-50/50 dark:bg-slate-800/30 flex gap-6 text-[11px]">
                    <span className="text-slate-400 dark:text-slate-500">Total Invested: <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">{formatNaira(group.totalInvested)}</span></span>
                    <span className="text-slate-400 dark:text-slate-500">Interest Earned: <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">{formatNaira(group.totalInterest)}</span></span>
                    <span className="text-slate-400 dark:text-slate-500">Maturity: <span className="font-mono font-semibold text-slate-900 dark:text-white">{formatNaira(group.totalInvested + group.totalInterest)}</span></span>
                  </div>

                  {/* Accounts List */}
                  {isGroupExpanded && (
                    <div className="border-t border-slate-100 dark:border-slate-800 px-5 py-3 flex flex-col gap-2">
                      {group.accounts.map((account) => {
                        const progress = getMaturityProgress(account.startDate, account.maturityDate);
                        const days = daysUntil(account.maturityDate);
                        const isExpanded = expandedAccount === account.id;

                        return (
                          <div key={account.id} className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-4 transition-all duration-200" style={{ backgroundColor: isExpanded ? "#FAF9F5" : "#ffffff" }}>
                            <div className="flex flex-wrap items-center justify-between gap-3" onClick={() => setExpandedAccount(isExpanded ? null : account.id)}>
                              <div className="flex flex-1 items-center gap-4 min-w-0">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl font-mono text-[11px] font-bold" style={{ backgroundColor: ACCOUNT_STATUS_BG[account.status], color: ACCOUNT_STATUS_COLORS[account.status] }}>
                                  {formatNaira(account.principalAmount).split(" ")[0]}
                                </div>
                                <div className="min-w-0">
                                  <div className="mb-0.5 flex items-center gap-2">
                                    <span className="shrink-0 rounded-[0.375rem] px-2 py-0.5 text-[9px] font-bold uppercase font-mono" style={{ color: ACCOUNT_STATUS_COLORS[account.status], backgroundColor: `${ACCOUNT_STATUS_COLORS[account.status]}12` }}>{account.status.replace("_", " ")}</span>
                                    {(account.weeksDefaulted ?? 0) > 0 && (
                                      <span className="shrink-0 rounded-[0.375rem] px-2 py-0.5 text-[9px] font-bold uppercase font-mono text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400">{account.weeksDefaulted} default</span>
                                    )}
                                  </div>
                                  <span className="text-[11px] text-slate-400 dark:text-slate-500">{formatNaira(account.principalAmount)} &middot; Started {formatDate(account.startDate)}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                {account.status === "active" && (
                                  <span className="font-mono text-[11px] text-[#666] dark:text-slate-400">{days}d left</span>
                                )}
                                <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); window.location.href = `/my-circles/${account.id}`; }}>
                                  View Details
                                </Button>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={isExpanded ? "#2563EB" : "#999"} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="shrink-0" style={{ transition: "transform 0.2s", transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}>
                                  <path d="M6 9l6 6 6-6" />
                                </svg>
                              </div>
                            </div>

                            {account.status === "active" && (
                              <div className="mt-3">
                                <div className="mb-1.5 flex justify-between text-[10px] text-slate-400 dark:text-slate-500">
                                  <span>Maturity Progress</span>
                                  <span>{progress}%</span>
                                </div>
                                <div className="h-1 overflow-hidden rounded-[2px] bg-slate-100 dark:bg-slate-800">
                                  <div className="h-full rounded-[2px] bg-blue-600" style={{ width: `${progress}%`, transition: "width 0.5s ease" }} />
                                </div>
                              </div>
                            )}

                            {isExpanded && (
                              <div className="mt-4 border-t border-slate-200/80 dark:border-slate-800/80 pt-4">
                                <div className="mb-4 grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-4 text-[12px]">
                                  <div><span className="mb-1 block text-slate-400 dark:text-slate-500">Principal</span><span className="font-mono font-semibold text-blue-600">{formatNaira(account.principalAmount)}</span></div>
                                  <div><span className="mb-1 block text-slate-400 dark:text-slate-500">Interest Earned</span><span className="font-mono font-semibold text-emerald-500">{formatNaira(account.interestEarned)}</span></div>
                                  <div><span className="mb-1 block text-slate-400 dark:text-slate-500">Maturity Payout</span><span className="font-mono font-semibold text-slate-900 dark:text-white">{formatNaira(account.principalAmount + account.interestEarned)}</span></div>
                                  <div><span className="mb-1 block text-slate-400 dark:text-slate-500">Start Date</span><span className="font-medium text-slate-900 dark:text-white">{formatDate(account.startDate)}</span></div>
                                  <div><span className="mb-1 block text-slate-400 dark:text-slate-500">Maturity Date</span><span className="font-medium text-slate-900 dark:text-white">{formatDate(account.maturityDate)}</span></div>
                                  {account.lastInterestCalculation && (
                                    <div><span className="mb-1 block text-slate-400 dark:text-slate-500">Last Interest</span><span className="font-medium text-slate-900 dark:text-white">{formatDate(account.lastInterestCalculation)}</span></div>
                                  )}
                                  {account.circle.cycleType === "weekly_contribution" && (
                                    <>
                                      <div><span className="mb-1 block text-slate-400 dark:text-slate-500">Weeks Paid</span><span className="font-mono font-semibold text-emerald-500">{account.weeksContributed ?? 0}/{account.circle.totalWeeks ?? 0}</span></div>
                                      <div><span className="mb-1 block text-slate-400 dark:text-slate-500">Weeks Defaulted</span><span className="font-mono font-semibold" style={{ color: (account.weeksDefaulted ?? 0) > 0 ? "#DC2626" : "#6B7280" }}>{account.weeksDefaulted ?? 0}</span></div>
                                    </>
                                  )}
                                </div>

                                {(account.weeksDefaulted ?? 0) > 0 && (
                                  <div className="mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 px-3 py-2 text-[11px] text-red-700 dark:text-red-400">
                                    You have {account.weeksDefaulted} missed contribution(s). Clear them on the <a href="/my-defaults" className="font-semibold underline">My Defaults</a> page ({formatClearanceLabel(account.circle.defaultPenaltyType, account.circle.defaultPenaltyValue)} clearance applies).
                                  </div>
                                )}

                                <div className="mb-4 flex gap-1.5">
                                <button onClick={() => setAccountSubTab("interest")}
                                  className="cursor-pointer rounded-full border-[1.5px] px-4 py-1.5 text-[11px] font-semibold transition-all duration-150"
                                  style={{ backgroundColor: accountSubTab === "interest" ? "#2563EB" : "#ffffff", color: accountSubTab === "interest" ? "#ffffff" : "#717171", borderColor: accountSubTab === "interest" ? "#2563EB" : "#EAEAEA" }}>
                                  Interest Logs
                                </button>
                                <button onClick={() => setAccountSubTab("transactions")}
                                  className="cursor-pointer rounded-full border-[1.5px] px-4 py-1.5 text-[11px] font-semibold transition-all duration-150"
                                  style={{ backgroundColor: accountSubTab === "transactions" ? "#2563EB" : "#ffffff", color: accountSubTab === "transactions" ? "#ffffff" : "#717171", borderColor: accountSubTab === "transactions" ? "#2563EB" : "#EAEAEA" }}>
                                  Transactions
                                </button>
                              </div>

                              {loadingDetails ? (
                                <div className="p-6 text-center text-[12px] text-slate-400 dark:text-slate-500">Loading details...</div>
                              ) : accountSubTab === "interest" ? (
                                <div className="max-h-[280px] overflow-y-auto rounded-lg border border-slate-200/80 dark:border-slate-800/80">
                                  {(() => {
                                    const cumData = interestLogs.reduce((acc, log) => {
                                      const prevCum = acc.length > 0 ? acc[acc.length - 1].cumulative : 0;
                                      acc.push({ ...log, cumulative: prevCum + log.amount });
                                      return acc;
                                    }, [] as (InterestLog & { cumulative: number })[]);
                                    return (
                                      <SimpleTable
                                        columns={[
                                          { key: "date", header: "Date", render: (log) => <span className="font-mono text-[#666] dark:text-slate-400">{formatDate(log.calculatedAt)}</span> },
                                          { key: "principal", header: "Principal", align: "right", render: (log) => <span className="font-mono text-[#666] dark:text-slate-400">{formatNaira(log.principalAtCalculation)}</span> },
                                          { key: "interest", header: "Interest", align: "right", render: (log) => <span className="font-mono font-medium text-emerald-500">+{formatNaira(log.amount)}</span> },
                                          { key: "cumulative", header: "Cumulative", align: "right", render: (log) => <span className="font-mono text-slate-900 dark:text-white">{formatNaira(log.cumulative)}</span> },
                                        ]}
                                        data={cumData}
                                        emptyMessage="No interest calculations yet"
                                      />
                                    );
                                  })()}
                                </div>
                              ) : (
                                <div className="max-h-[280px] overflow-y-auto rounded-lg border border-slate-200/80 dark:border-slate-800/80">
                                  <SimpleTable
                                    columns={[
                                      { key: "date", header: "Date", render: (tx) => <span className="font-mono text-[#666] dark:text-slate-400">{formatDateTime(tx.createdAt)}</span> },
                                      { key: "type", header: "Type", render: (tx) => {
                                        const color = getTransactionTypeColor(tx.type);
                                        return <span className="rounded-[0.375rem] px-2 py-0.5 text-[9px] font-bold uppercase font-mono" style={{ color, backgroundColor: `${color}12` }}>{getTransactionTypeLabel(tx.type)}</span>;
                                      }},
                                      { key: "amount", header: "Amount", align: "right", render: (tx) => (
                                        <span className="font-mono font-semibold" style={{ color: tx.type === "circle_withdrawal" || tx.type === "circle_reversal" ? "#DC2626" : tx.type === "circle_interest" ? "#10B981" : "#2563EB" }}>
                                          {tx.type === "circle_withdrawal" || tx.type === "circle_reversal" ? "-" : "+"}{formatNaira(tx.amount)}
                                        </span>
                                      )},
                                      { key: "status", header: "Status", render: (tx) => (
                                        <span className="rounded-[0.375rem] px-2 py-0.5 text-[9px] font-semibold uppercase" style={{ color: tx.status === "completed" ? "#059669" : "#D97706", backgroundColor: tx.status === "completed" ? "#ECFDF5" : "#FFFBEB" }}>
                                          {tx.status}
                                        </span>
                                      )},
                                    ]}
                                    data={accountTransactions}
                                    emptyMessage="No transactions yet"
                                  />
                                </div>
                              )}

                              {account.status === "reversed" && (
                                <div className="mb-3 rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20 px-3 py-2 text-[12px] font-medium text-red-700 dark:text-red-400">
                                  This subscription was reversed because the linked payment was reversed or refunded. Any funds debited for it have been returned to your wallet.
                                </div>
                              )}

                              <div className="mt-4 flex flex-wrap gap-2">
                                {account.status === "active" && (
                                  <>
                                    <Button variant="primary" size="sm" disabled={claiming === account.id || daysUntil(account.maturityDate) > 0} onClick={() => handleClaim(account.id)}>
                                      {claiming === account.id ? "Processing..." : daysUntil(account.maturityDate) > 0 ? `Matures in ${daysUntil(account.maturityDate)}d` : isAutoPayout(account.circle) ? "Claim Maturity" : "Request Payout"}
                                    </Button>
                                    <Button variant="secondary" size="sm" disabled={withdrawing === account.id} onClick={() => handleWithdraw(account.id)}>
                                      {withdrawing === account.id ? "Withdrawing..." : "Early Withdraw (Forfeit Interest)"}
                                    </Button>
                                  </>
                                )}
                                {account.status === "matured" && (
                                  <Button variant="primary" size="sm" disabled={claiming === account.id} onClick={() => handleClaim(account.id)}>
                                    {claiming === account.id ? "Processing..." : isAutoPayout(account.circle) ? "Claim Maturity Payout" : "Request Payout"}
                                  </Button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </FadeInUp>
      )}
    </div>
  );
}
