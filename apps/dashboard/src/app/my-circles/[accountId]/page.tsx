"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { config, BrandConfig } from "@thrift/config";
import { Card, Button, FadeInUp } from "@thrift/ui";
import { formatNaira } from "@thrift/utils";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/PageHeader";
import { SkeletonCard } from "@/components/Skeleton";

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
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"breakdown" | "logs" | "transactions">("breakdown");
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
      const [acctRes, breakdownRes, txRes] = await Promise.all([
        fetch(`${API_URL}/api/circles/accounts/${accountId}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/api/circles/accounts/${accountId}/interest-breakdown`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/api/circles/accounts/${accountId}/transactions`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const acctData = await acctRes.json();
      const breakdownData = await breakdownRes.json();
      const txData = await txRes.json();
      if (acctData.success) setAccount(acctData.data);
      if (breakdownData.success) setBreakdown(breakdownData.data);
      if (txData.success) setTransactions(txData.data);
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
            <h3 className="mb-2 text-[1rem] font-semibold text-brand-dark">Account not found</h3>
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
          className="flex items-center border-0 bg-none p-1 cursor-pointer text-gray-400"
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
          className="mb-6 rounded-xl px-4 py-3 text-[13px] font-medium"
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
        <Card padding="1.25rem">
          <span
            className="mb-1 block text-[11px] text-gray-400"
          >
            Principal
          </span>
          <span
            className="font-mono text-[1.25rem] font-bold"
            style={{ color: cfg.colors.primary }}
          >
            {formatNaira(account.principalAmount)}
          </span>
        </Card>
        <Card padding="1.25rem">
          <span
            className="mb-1 block text-[11px] text-gray-400"
          >
            Interest Earned
          </span>
          <span
            className="font-mono text-[1.25rem] font-bold text-emerald-500"
          >
            {formatNaira(account.interestEarned)}
          </span>
        </Card>
        <Card padding="1.25rem">
          <span
            className="mb-1 block text-[11px] text-gray-400"
          >
            Maturity Value
          </span>
          <span
            className="font-mono text-[1.25rem] font-bold text-brand-dark"
          >
            {formatNaira(account.principalAmount + account.interestEarned)}
          </span>
        </Card>
        <Card padding="1.25rem">
          <span
            className="mb-1 block text-[11px] text-gray-400"
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
              className="mt-2 text-[1rem] font-semibold text-brand-dark"
            >
              {account.circle.name}
            </h2>
            <span className="text-[12px] text-gray-400">
              {formatNaira(account.circle.amount)} &middot;{" "}
              {formatDuration(account.circle.durationMonths)}
            </span>
          </div>
          <div className="text-right text-[12px] text-[#666]">
            <div className="font-mono">
              Started {formatDate(account.startDate)}
            </div>
            <div className="font-mono">
              Matures {formatDate(account.maturityDate)} ({days}d left)
            </div>
          </div>
        </div>

        <div className="mb-6">
          <div className="mb-1.5 flex justify-between text-[10px] text-gray-400">
            <span>Maturity Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-[3px] bg-gray-100">
            <div
              className="h-full rounded-[3px]"
              style={{ width: `${progress}%`, backgroundColor: cfg.colors.primary, transition: "width 0.5s ease" }}
            />
          </div>
        </div>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-4 rounded-xl bg-gray-50 p-4 text-[12px]">
          <div>
            <span className="mb-1 block text-gray-400">
              Deposit Amount
            </span>
            <span className="font-mono font-semibold text-brand-dark">
              {formatNaira(account.circle.amount)}
            </span>
          </div>
          <div>
            <span className="mb-1 block text-gray-400">
              Total Withdrawn
            </span>
            <span className="font-mono font-semibold" style={{ color: account.totalWithdrawn > 0 ? "#DC2626" : "#2D2D2D" }}>
              {formatNaira(account.totalWithdrawn)}
            </span>
          </div>
          <div>
            <span className="mb-1 block text-gray-400">
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
              <span className="mb-1 block text-gray-400">
                Last Interest Calc
              </span>
              <span className="font-medium text-brand-dark">
                {formatDate(account.lastInterestCalculation)}
              </span>
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {account.status === "reversed" && (
            <div className="w-full rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12px] font-medium text-red-700">
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
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className="cursor-pointer rounded-full border-[1.5px] px-5 py-2 text-[12px] font-semibold transition-all duration-150"
            style={{
              backgroundColor:
                activeTab === key ? cfg.colors.primary : "#ffffff",
              color: activeTab === key ? "#ffffff" : "#717171",
              borderColor: activeTab === key ? cfg.colors.primary : "#EAEAEA",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === "breakdown" && (
        <FadeInUp>
          <Card padding="1.5rem">
            <h3 className="mb-4 text-[14px] font-semibold text-brand-dark">
              Weekly Interest Breakdown
            </h3>
            {breakdown.length === 0 ? (
              <div className="p-8 text-center text-[13px] text-gray-400">
                No breakdown available
              </div>
            ) : (
              <div className="max-h-[480px] overflow-y-auto rounded-lg border border-gray-100">
                <table className="w-full border-collapse text-[11px]">
                  <thead className="sticky top-0 z-[1]">
                    <tr className="bg-gray-50">
                      <th
                        className="px-3 py-2.5 text-center text-[9px] font-semibold uppercase tracking-[0.05em] text-gray-400"
                      >
                        Week
                      </th>
                      <th
                        className="px-3 py-2.5 text-left text-[9px] font-semibold uppercase tracking-[0.05em] text-gray-400"
                      >
                        Date
                      </th>
                      <th
                        className="px-3 py-2.5 text-right text-[9px] font-semibold uppercase tracking-[0.05em] text-gray-400"
                      >
                        Principal
                      </th>
                      <th
                        className="px-3 py-2.5 text-right text-[9px] font-semibold uppercase tracking-[0.05em] text-gray-400"
                      >
                        This Week
                      </th>
                      <th
                        className="px-3 py-2.5 text-right text-[9px] font-semibold uppercase tracking-[0.05em] text-gray-400"
                      >
                        Cumulative
                      </th>
                      <th
                        className="px-3 py-2.5 text-right text-[9px] font-semibold uppercase tracking-[0.05em] text-gray-400"
                      >
                        Total Value
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {breakdown.map((week, idx) => {
                      const weekDate = new Date(week.date);
                      const isPast = weekDate <= new Date();
                      const isCurrent = idx === weeksSinceStart - 1;
                      return (
                        <tr
                          key={week.week}
                          className={isCurrent ? "bg-emerald-50" : idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                          style={{ opacity: isPast ? 1 : 0.6 }}
                        >
                          <td
                            className="px-3 py-2 text-center font-mono"
                            style={{ fontWeight: isCurrent ? 700 : 400, color: isCurrent ? cfg.colors.primary : "#666" }}
                          >
                            #{week.week}
                          </td>
                          <td className="px-3 py-2 font-mono text-[#666]">
                            {formatDate(week.date)}
                          </td>
                          <td className="px-3 py-2 text-right font-mono text-[#666]">
                            {formatNaira(week.principal)}
                          </td>
                          <td className="px-3 py-2 text-right font-mono font-medium text-emerald-500">
                            +{formatNaira(week.interestThisWeek)}
                          </td>
                          <td className="px-3 py-2 text-right font-mono text-brand-dark">
                            {formatNaira(week.cumulativeInterest)}
                          </td>
                          <td className="px-3 py-2 text-right font-mono font-semibold" style={{ color: cfg.colors.primary }}>
                            {formatNaira(week.totalValue)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            <div className="mt-4 rounded-lg bg-amber-50 p-3 text-[11px] text-[#92400E]">
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
            <h3 className="mb-4 text-[14px] font-semibold text-brand-dark">
              Interest Calculation History
            </h3>
            {account.interestLogs.length === 0 ? (
              <div className="p-8 text-center text-[13px] text-gray-400">
                No interest calculations recorded yet
              </div>
            ) : (
                <div className="max-h-[400px] overflow-y-auto rounded-lg border border-gray-100">
                  <table className="w-full border-collapse text-[11px]">
                    <thead className="sticky top-0 z-[1]">
                      <tr className="bg-gray-50">
                        <th
                          className="px-3 py-2.5 text-left text-[9px] font-semibold uppercase tracking-[0.05em] text-gray-400"
                        >
                          Date
                        </th>
                        <th
                          className="px-3 py-2.5 text-right text-[9px] font-semibold uppercase tracking-[0.05em] text-gray-400"
                        >
                          Principal
                        </th>
                        <th
                          className="px-3 py-2.5 text-right text-[9px] font-semibold uppercase tracking-[0.05em] text-gray-400"
                        >
                          This Week
                        </th>
                        <th
                          className="px-3 py-2.5 text-right text-[9px] font-semibold uppercase tracking-[0.05em] text-gray-400"
                        >
                          Rate
                        </th>
                        <th
                          className="px-3 py-2.5 text-right text-[9px] font-semibold uppercase tracking-[0.05em] text-gray-400"
                        >
                          Cumulative
                        </th>
                      </tr>
                    </thead>
                  <tbody>
                    {account.interestLogs
                      .reduce(
                        (acc, log) => {
                          const prevCum =
                            acc.length > 0 ? acc[acc.length - 1].cumulative : 0;
                          acc.push({
                            ...log,
                            cumulative: prevCum + log.amount,
                          });
                          return acc;
                        },
                        [] as (InterestLog & { cumulative: number })[],
                      )
                      .reverse()
                      .map((log, idx) => (
                        <tr
                          key={log.id}
                          className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                        >
                          <td className="px-3 py-2 font-mono text-[#666]">
                            {formatDate(log.calculatedAt)}
                          </td>
                          <td className="px-3 py-2 text-right font-mono text-[#666]">
                            {formatNaira(log.principalAtCalculation)}
                          </td>
                          <td className="px-3 py-2 text-right font-mono font-medium text-emerald-500">
                            +{formatNaira(log.amount)}
                          </td>
                          <td className="px-3 py-2 text-right font-mono text-amber-500">
                            {log.annualRate}%
                          </td>
                          <td className="px-3 py-2 text-right font-mono text-brand-dark">
                            {formatNaira(log.cumulative)}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </FadeInUp>
      )}

      {activeTab === "transactions" && (
        <FadeInUp>
          <Card padding="1.5rem">
            <h3 className="mb-4 text-[14px] font-semibold text-brand-dark">
              Transaction History
            </h3>
            {transactions.length === 0 ? (
              <div className="p-8 text-center text-[13px] text-gray-400">
                No transactions yet
              </div>
            ) : (
              <div className="max-h-[400px] overflow-y-auto rounded-lg border border-gray-100">
                <table className="w-full border-collapse text-[11px]">
                  <thead className="sticky top-0 z-[1]">
                    <tr className="bg-gray-50">
                      <th
                        className="px-3 py-2.5 text-left text-[9px] font-semibold uppercase tracking-[0.05em] text-gray-400"
                      >
                        Date
                      </th>
                      <th
                        className="px-3 py-2.5 text-left text-[9px] font-semibold uppercase tracking-[0.05em] text-gray-400"
                      >
                        Type
                      </th>
                      <th
                        className="px-3 py-2.5 text-right text-[9px] font-semibold uppercase tracking-[0.05em] text-gray-400"
                      >
                        Amount
                      </th>
                      <th
                        className="px-3 py-2.5 text-right text-[9px] font-semibold uppercase tracking-[0.05em] text-gray-400"
                      >
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx, idx) => (
                      <tr
                        key={tx.id}
                        className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                      >
                        <td className="px-3 py-2 font-mono text-[#666]">
                          {formatDateTime(tx.createdAt)}
                        </td>
                        <td className="px-3 py-2">
                          <span
                            style={{
                              fontSize: "9px",
                              fontWeight: 700,
                              textTransform: "uppercase",
                              fontFamily: "'JetBrains Mono', monospace",
                              color: getTransactionTypeColor(tx.type),
                              backgroundColor: `${getTransactionTypeColor(tx.type)}12`,
                              padding: "0.125rem 0.5rem",
                              borderRadius: "0.375rem",
                            }}
                          >
                            {getTransactionTypeLabel(tx.type)}
                          </span>
                        </td>
                        <td
                          className="px-3 py-2 text-right font-mono font-semibold"
                          style={{
                            color:
                              tx.type === "circle_withdrawal"
                                ? "#DC2626"
                                : tx.type === "circle_interest"
                                  ? "#10B981"
                                  : cfg.colors.primary,
                          }}
                        >
                          {tx.type === "circle_withdrawal" ? "-" : "+"}
                          {formatNaira(tx.amount)}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <span
                            style={{
                              fontSize: "9px",
                              fontWeight: 600,
                              textTransform: "uppercase",
                              color:
                                tx.status === "completed"
                                  ? "#059669"
                                  : "#D97706",
                              backgroundColor:
                                tx.status === "completed"
                                  ? "#ECFDF5"
                                  : "#FFFBEB",
                              padding: "0.125rem 0.5rem",
                              borderRadius: "0.375rem",
                            }}
                          >
                            {tx.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </FadeInUp>
      )}
    </div>
  );
}
