"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { config, BrandConfig } from "@thrift/config";
import { Card, Button, FadeInUp } from "@thrift/ui";
import { formatNaira } from "@thrift/utils";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/PageHeader";
import { SkeletonCard } from "@/components/Skeleton";
import { SimpleTable, SimpleColumn } from "@/components/SimpleTable";

const fallback = config;

interface CircleAccount {
  id: string;
  circleId: string;
  principalAmount: number;
  interestEarned: number;
  totalWithdrawn: number;
  status: string;
  startDate: string;
  maturityDate: string;
  lastInterestCalculation?: string;
  circle: { id: string; name: string; amount: number; durationMonths: number; interestRateAnnual: number };
  interestLogs: InterestLog[];
}

interface InterestLog {
  id: string;
  amount: number;
  principalAtCalculation: number;
  annualRate: number;
  calculatedAt: string;
}

interface InterestWeek {
  week: number;
  date: string;
  daysFromStart: number;
  interestThisWeek: number;
  cumulativeInterest: number;
  totalValue: number;
  annualRate: number;
  principal: number;
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

interface CircleDefault {
  id: string;
  weekNumber: number;
  amountDue: number;
  clearanceAmount: number;
  status: string;
  clearedAt?: string;
  createdAt: string;
}

const STATUS_STYLES: Record<string, { color: string; bg: string }> = {
  active: { color: "#10B981", bg: "#ECFDF5" },
  matured: { color: "#F59E0B", bg: "#FFFBEB" },
  withdrawn: { color: "#6B7280", bg: "#F3F4F6" },
  early_withdrawn: { color: "#DC2626", bg: "#FEF2F2" },
  reversed: { color: "#DC2626", bg: "#FEF2F2" },
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatDateTime(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function formatDuration(months: number) {
  if (months < 12) return `${months}mo`;
  const y = Math.floor(months / 12);
  const m = months % 12;
  return m > 0 ? `${y}y ${m}mo` : `${y}y`;
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
    default: return "#717171";
  }
}

function getTransactionTypeLabel(type: string) {
  return type.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

export default function AccountDetailPage() {
  const params = useParams();
  const router = useRouter();
  const accountId = params.accountId as string;
  const { token } = useAuth();
  const [cfg, setCfg] = useState<BrandConfig>(fallback);
  const [account, setAccount] = useState<CircleAccount | null>(null);
  const [breakdown, setBreakdown] = useState<InterestWeek[]>([]);
  const [transactions, setTransactions] = useState<CircleTransaction[]>([]);
  const [defaults, setDefaults] = useState<CircleDefault[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"breakdown" | "logs" | "transactions" | "defaults">("breakdown");
  const [withdrawing, setWithdrawing] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  useEffect(() => {
    fetch(`${API_URL}/api/config`).then((r) => r.json()).then((d) => { if (d && d.name) setCfg((p) => ({ ...p, ...d })); }).catch(() => {});
  }, [API_URL]);

  const fetchData = useCallback(async () => {
    if (!token || !accountId) return;
    setLoading(true);
    try {
      const [acctRes, breakdownRes, txRes, defaultsRes] = await Promise.all([
        fetch(`${API_URL}/api/circles/accounts/${accountId}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/api/circles/accounts/${accountId}/interest-breakdown`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/api/circles/accounts/${accountId}/transactions`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/api/circles/accounts/${accountId}/defaults`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const acctData = await acctRes.json();
      const breakdownData = await breakdownRes.json();
      const txData = await txRes.json();
      const defaultsData = await defaultsRes.json();
      if (acctData.success) setAccount(acctData.data);
      if (breakdownData.success) setBreakdown(breakdownData.data);
      if (txData.success) setTransactions(txData.data);
      if (defaultsData.success) setDefaults(defaultsData.data);
    } catch {}
    setLoading(false);
  }, [token, accountId, API_URL]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleWithdraw = async () => {
    setWithdrawing(true);
    try {
      const res = await fetch(`${API_URL}/api/circles/accounts/${accountId}/withdraw`, {
        method: "POST", headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        showMessage("success", "Early withdrawal completed. Principal returned to wallet.");
        fetchData();
      } else {
        showMessage("error", data.error || "Failed to withdraw");
      }
    } catch { showMessage("error", "Failed to withdraw"); }
    setWithdrawing(false);
  };

  const handleClaim = async () => {
    setClaiming(true);
    try {
      const res = await fetch(`${API_URL}/api/circles/accounts/${accountId}/mature`, {
        method: "POST", headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        showMessage("success", "Maturity payout credited to wallet!");
        fetchData();
      } else {
        showMessage("error", data.error || "Failed to claim maturity");
      }
    } catch { showMessage("error", "Failed to claim"); }
    setClaiming(false);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-[1024px] p-[clamp(1rem,3vw,2rem)]">
        <div className="grid gap-6">{Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}</div>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="mx-auto max-w-[1024px] p-[clamp(1rem,3vw,2rem)]">
        <Card padding="3rem">
          <div className="text-center">
            <h3 className="mb-2 text-[1rem] font-semibold text-slate-900 dark:text-white">Account not found</h3>
            <Button variant="primary" size="sm" onClick={() => router.push("/my-circles")}>Back to My Circles</Button>
          </div>
        </Card>
      </div>
    );
  }

  const progress = getMaturityProgress(account.startDate, account.maturityDate);
  const days = daysUntil(account.maturityDate);
  const statusStyle = STATUS_STYLES[account.status] || STATUS_STYLES.active;
  const weeksSinceStart = Math.max(1, Math.floor((Date.now() - new Date(account.startDate).getTime()) / (7 * 24 * 60 * 60 * 1000)));
  const realizedBreakdown = breakdown.slice(0, weeksSinceStart).map((w, i) => ({
    ...w,
    interestThisWeek: i < weeksSinceStart - 1 ? w.interestThisWeek : account.interestEarned - breakdown.slice(0, weeksSinceStart - 1).reduce((s, x) => s + x.interestThisWeek, 0),
    cumulativeInterest: account.interestEarned,
    totalValue: account.principalAmount + account.interestEarned,
  }));

  return (
    <div className="mx-auto max-w-[1024px] p-[clamp(1rem,3vw,2rem)]">
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => router.push("/my-circles")}
          className="flex items-center border-0 bg-none p-1 cursor-pointer text-slate-400"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      <PageHeader
        badgeLabel="Circle Account"
        heading={account.circle.name}
        accentText=""
        description="Full account details, interest breakdown, and history."
      />

      {message && (
        <div
          className="mb-6 rounded-2xl px-4 py-3 text-[13px] font-medium"
          style={{
            backgroundColor: message.type === "success" ? "#ECFDF5" : "#FEF2F2",
            color: message.type === "success" ? "#059669" : "#DC2626",
            border: `1px solid ${message.type === "success" ? "#A7F3D0" : "#FECACA"}`,
          }}
        >
          {message.text}
        </div>
      )}

      <div
        className="mb-8 grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-6"
      >
        <Card padding="1.5rem">
          <span
            className="mb-1 block text-[11px] text-slate-400 dark:text-slate-500"
          >
            Principal
          </span>
          <span
            className="font-mono text-[1.25rem] font-bold text-blue-600"
          >
            {formatNaira(account.principalAmount)}
          </span>
        </Card>
        <Card padding="1.5rem">
          <span
            className="mb-1 block text-[11px] text-slate-400 dark:text-slate-500"
          >
            Interest Earned
          </span>
          <span
            className="font-mono text-[1.25rem] font-bold text-emerald-500"
          >
            {formatNaira(account.interestEarned)}
          </span>
        </Card>
        <Card padding="1.5rem">
          <span
            className="mb-1 block text-[11px] text-slate-400 dark:text-slate-500"
          >
            Maturity Value
          </span>
          <span
            className="font-mono text-[1.25rem] font-bold text-slate-900 dark:text-white"
          >
            {formatNaira(account.principalAmount + account.interestEarned)}
          </span>
        </Card>
        <Card padding="1.5rem">
          <span
            className="mb-1 block text-[11px] text-slate-400 dark:text-slate-500"
          >
            Interest Rate
          </span>
          <span
            className="font-mono text-[1.25rem] font-bold text-amber-500"
          >
            {account.circle.interestRateAnnual}% p.a.
          </span>
        </Card>
      </div>

      <Card padding="1.5rem" className="mb-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <span
              className="rounded-full px-3 py-1 text-[10px] font-bold uppercase font-mono"
              style={{ color: statusStyle.color, backgroundColor: statusStyle.bg }}
            >
              {account.status.replace("_", " ")}
            </span>
            <h2
              className="mt-2 text-[1rem] font-semibold text-slate-900 dark:text-white"
            >
              {account.circle.name}
            </h2>
            <span className="text-[12px] text-slate-400 dark:text-slate-500">
              {formatNaira(account.circle.amount)} &middot;{" "}
              {formatDuration(account.circle.durationMonths)}
            </span>
          </div>
          <div className="text-right text-[12px] text-[#666] dark:text-slate-400">
            <div className="font-mono">
              Started {formatDate(account.startDate)}
            </div>
            <div className="font-mono">
              Matures {formatDate(account.maturityDate)} ({days}d left)
            </div>
          </div>
        </div>

        <div className="mb-6">
          <div className="mb-1.5 flex justify-between text-[10px] text-slate-400 dark:text-slate-500">
            <span>Maturity Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-[3px] bg-slate-100 dark:bg-slate-800">
            <div
              className="h-full rounded-[3px] bg-blue-600"
              style={{ width: `${progress}%`, transition: "width 0.5s ease" }}
            />
          </div>
        </div>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 p-4 text-[12px]">
          <div>
            <span className="mb-1 block text-slate-400 dark:text-slate-500">
              Deposit Amount
            </span>
            <span className="font-mono font-semibold text-slate-900 dark:text-white">
              {formatNaira(account.circle.amount)}
            </span>
          </div>
          <div>
            <span className="mb-1 block text-slate-400 dark:text-slate-500">
              Total Withdrawn
            </span>
            <span className="font-mono font-semibold" style={{ color: account.totalWithdrawn > 0 ? "#DC2626" : "#2D2D2D" }}>
              {formatNaira(account.totalWithdrawn)}
            </span>
          </div>
          <div>
            <span className="mb-1 block text-slate-400 dark:text-slate-500">
              Weekly Interest
            </span>
            <span className="font-mono font-semibold text-emerald-500">
              {formatNaira(
                (account.principalAmount *
                  (account.circle.interestRateAnnual / 100)) /
                  52,
              )}
            </span>
          </div>
          {account.lastInterestCalculation && (
            <div>
              <span className="mb-1 block text-slate-400 dark:text-slate-500">
                Last Interest Calc
              </span>
              <span className="font-medium text-slate-900 dark:text-white">
                {formatDate(account.lastInterestCalculation)}
              </span>
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {account.status === "reversed" && (
            <div className="w-full rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20 px-3 py-2 text-[12px] font-medium text-red-700 dark:text-red-400">
              This subscription was reversed because the linked payment was reversed or refunded. Any funds debited for it have been returned to your wallet.
            </div>
          )}
          {account.status === "active" && (
            <>
              <Button
                variant="primary"
                size="sm"
                disabled={claiming || days > 0}
                onClick={handleClaim}
              >
                {claiming
                  ? "Claiming..."
                  : days > 0
                    ? `Matures in ${days}d`
                    : "Claim Maturity"}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={withdrawing}
                onClick={handleWithdraw}
              >
                {withdrawing
                  ? "Withdrawing..."
                  : "Early Withdraw (Forfeit Interest)"}
              </Button>
            </>
          )}
          {account.status === "matured" && (
            <Button
              variant="primary"
              size="sm"
              disabled={claiming}
              onClick={handleClaim}
            >
              {claiming ? "Claiming..." : "Claim Maturity Payout"}
            </Button>
          )}
        </div>
      </Card>

      <div className="mb-4 flex gap-1.5">
        {(
          [
            ["breakdown", "Interest Breakdown"],
            ["logs", "Interest Logs"],
            ["transactions", "Transactions"],
            ["defaults", "Defaults"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className="cursor-pointer rounded-full border-[1.5px] px-5 py-2 text-[12px] font-semibold transition-all duration-150"
            style={{
              backgroundColor:
                activeTab === key ? "#2563EB" : "#ffffff",
              color: activeTab === key ? "#ffffff" : "#717171",
              borderColor: activeTab === key ? "#2563EB" : "#EAEAEA",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === "breakdown" && (
        <FadeInUp>
          <Card padding="1.5rem">
            <h3 className="mb-4 text-[14px] font-semibold text-slate-900 dark:text-white">
              Weekly Interest Breakdown
            </h3>
            {breakdown.length === 0 ? (
              <div className="p-8 text-center text-[13px] text-slate-400 dark:text-slate-500">
                No breakdown available
              </div>
            ) : (
              <div className="max-h-[480px] overflow-y-auto rounded-lg border border-slate-200/80 dark:border-slate-800/80">
                <SimpleTable
                  columns={[
                    { key: "week", header: "Week", align: "center", render: (week, idx) => {
                      const isCurrent = idx === weeksSinceStart - 1;
                      return <span className="font-mono" style={{ fontWeight: isCurrent ? 700 : 400, color: isCurrent ? "#2563EB" : "#666" }}>#{week.week}</span>;
                    }},
                    { key: "date", header: "Date", render: (week) => <span className="font-mono text-[#666] dark:text-slate-400">{formatDate(week.date)}</span> },
                    { key: "principal", header: "Principal", align: "right", render: (week) => <span className="font-mono text-[#666] dark:text-slate-400">{formatNaira(week.principal)}</span> },
                    { key: "interestThisWeek", header: "This Week", align: "right", render: (week) => <span className="font-mono font-medium text-emerald-500">+{formatNaira(week.interestThisWeek)}</span> },
                    { key: "cumulativeInterest", header: "Cumulative", align: "right", render: (week) => <span className="font-mono text-slate-900 dark:text-white">{formatNaira(week.cumulativeInterest)}</span> },
                    { key: "totalValue", header: "Total Value", align: "right", render: (week) => <span className="font-mono font-semibold text-blue-600">{formatNaira(week.totalValue)}</span> },
                  ]}
                  data={breakdown}
                  emptyMessage="No breakdown available"
                />
              </div>
            )}
            <div className="mt-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 p-3 text-[11px] text-[#92400E] dark:text-amber-400">
              <strong>Note:</strong> Projected interest is calculated at{" "}
              <strong>{account.circle.interestRateAnnual}% p.a.</strong> simple
              interest on the principal of{" "}
              <strong>{formatNaira(account.principalAmount)}</strong>. Actual
              accrued interest may differ based on calculation timing. Interest
              is computed weekly on Sundays.
            </div>
          </Card>
        </FadeInUp>
      )}

      {activeTab === "logs" && (
        <FadeInUp>
          <Card padding="1.5rem">
            <h3 className="mb-4 text-[14px] font-semibold text-slate-900 dark:text-white">
              Interest Calculation History
            </h3>
            {account.interestLogs.length === 0 ? (
              <div className="p-8 text-center text-[13px] text-slate-400 dark:text-slate-500">
                No interest calculations recorded yet
              </div>
            ) : (
                <div className="max-h-[400px] overflow-y-auto rounded-lg border border-slate-200/80 dark:border-slate-800/80">
                  {(() => {
                    const cumData = account.interestLogs
                      .reduce((acc, log) => {
                        const prevCum = acc.length > 0 ? acc[acc.length - 1].cumulative : 0;
                        acc.push({ ...log, cumulative: prevCum + log.amount });
                        return acc;
                      }, [] as (InterestLog & { cumulative: number })[])
                      .reverse();
                    return (
                      <SimpleTable
                        columns={[
                          { key: "date", header: "Date", render: (log) => <span className="font-mono text-[#666] dark:text-slate-400">{formatDate(log.calculatedAt)}</span> },
                          { key: "principal", header: "Principal", align: "right", render: (log) => <span className="font-mono text-[#666] dark:text-slate-400">{formatNaira(log.principalAtCalculation)}</span> },
                          { key: "amount", header: "This Week", align: "right", render: (log) => <span className="font-mono font-medium text-emerald-500">+{formatNaira(log.amount)}</span> },
                          { key: "rate", header: "Rate", align: "right", render: (log) => <span className="font-mono text-amber-500">{log.annualRate}%</span> },
                          { key: "cumulative", header: "Cumulative", align: "right", render: (log) => <span className="font-mono text-slate-900 dark:text-white">{formatNaira(log.cumulative)}</span> },
                        ]}
                        data={cumData}
                        emptyMessage="No interest calculations recorded yet"
                      />
                    );
                  })()}
                </div>
            )}
          </Card>
        </FadeInUp>
      )}

      {activeTab === "transactions" && (
        <FadeInUp>
          <Card padding="1.5rem">
            <h3 className="mb-4 text-[14px] font-semibold text-slate-900 dark:text-white">
              Transaction History
            </h3>
            {transactions.length === 0 ? (
              <div className="p-8 text-center text-[13px] text-slate-400 dark:text-slate-500">
                No transactions yet
              </div>
            ) : (
              <div className="max-h-[400px] overflow-y-auto rounded-lg border border-slate-200/80 dark:border-slate-800/80">
                <SimpleTable
                  columns={[
                    { key: "date", header: "Date", render: (tx) => <span className="font-mono text-[#666] dark:text-slate-400">{formatDateTime(tx.createdAt)}</span> },
                    { key: "type", header: "Type", render: (tx) => (
                      <span className="rounded-[0.375rem] px-2 py-0.5 text-[9px] font-bold uppercase font-mono" style={{ color: getTransactionTypeColor(tx.type), backgroundColor: `${getTransactionTypeColor(tx.type)}12` }}>
                        {getTransactionTypeLabel(tx.type)}
                      </span>
                    )},
                    { key: "amount", header: "Amount", align: "right", render: (tx) => (
                      <span className="font-mono font-semibold" style={{ color: tx.type === "circle_withdrawal" ? "#DC2626" : tx.type === "circle_interest" ? "#10B981" : "#2563EB" }}>
                        {tx.type === "circle_withdrawal" ? "-" : "+"}{formatNaira(tx.amount)}
                      </span>
                    )},
                    { key: "status", header: "Status", align: "right", render: (tx) => (
                      <span className="rounded-[0.375rem] px-2 py-0.5 text-[9px] font-semibold uppercase" style={{ color: tx.status === "completed" ? "#059669" : "#D97706", backgroundColor: tx.status === "completed" ? "#ECFDF5" : "#FFFBEB" }}>
                        {tx.status}
                      </span>
                    )},
                  ]}
                  data={transactions}
                  emptyMessage="No transactions yet"
                />
              </div>
            )}
          </Card>
        </FadeInUp>
      )}

      {activeTab === "defaults" && (
        <FadeInUp>
          <Card padding="1.5rem">
            <h3 className="mb-4 text-[14px] font-semibold text-slate-900 dark:text-white">
              Defaults (Missed Contributions)
            </h3>
            {defaults.length === 0 ? (
              <div className="p-8 text-center text-[13px] text-slate-400 dark:text-slate-500">
                No defaults recorded for this account
              </div>
            ) : (
              <div className="max-h-[480px] overflow-y-auto rounded-lg border border-slate-200/80 dark:border-slate-800/80">
                <SimpleTable
                  columns={[
                    { key: "weekNumber", header: "Week", align: "center", render: (d) => <span className="font-mono">#{d.weekNumber}</span> },
                    { key: "amountDue", header: "Amount Due", align: "right", render: (d) => <span className="font-mono text-[#666] dark:text-slate-400">{formatNaira(d.amountDue)}</span> },
                    { key: "clearanceAmount", header: "Clearance", align: "right", render: (d) => <span className="font-mono font-semibold text-red-600">{formatNaira(d.clearanceAmount)}</span> },
                    { key: "status", header: "Status", align: "center", render: (d) => (
                      <span className="rounded-[0.375rem] px-2 py-0.5 text-[9px] font-bold uppercase" style={{ color: d.status === "outstanding" ? "#DC2626" : "#059669", backgroundColor: d.status === "outstanding" ? "#FEF2F2" : "#ECFDF5" }}>
                        {d.status}
                      </span>
                    )},
                    { key: "clearedAt", header: "Cleared", render: (d) => d.clearedAt ? <span className="font-mono text-[11px] text-[#666] dark:text-slate-400">{formatDate(d.clearedAt)}</span> : <span className="text-[11px] text-slate-300">—</span> },
                  ]}
                  data={defaults}
                  emptyMessage="No defaults recorded"
                />
              </div>
            )}
            {defaults.some((d) => d.status === "outstanding") && (
              <div className="mt-4 rounded-lg bg-red-50 dark:bg-red-900/20 p-3 text-[11px] text-red-700 dark:text-red-400">
                <strong>Note:</strong> Outstanding defaults must be cleared from the{" "}
                <a href="/my-defaults" className="underline font-semibold">My Defaults</a>{" "}
                page to keep your account eligible for payout.
              </div>
            )}
          </Card>
        </FadeInUp>
      )}
    </div>
  );
}
