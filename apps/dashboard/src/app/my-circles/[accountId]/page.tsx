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
      <div style={{ maxWidth: "1024px", margin: "0 auto", padding: "clamp(1rem, 3vw, 2rem)" }}>
        <div style={{ display: "grid", gap: "1.5rem" }}>{Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}</div>
      </div>
    );
  }

  if (!account) {
    return (
      <div style={{ maxWidth: "1024px", margin: "0 auto", padding: "clamp(1rem, 3vw, 2rem)" }}>
        <Card padding="3rem">
          <div style={{ textAlign: "center" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "#2D2D2D", marginBottom: "0.5rem" }}>Account not found</h3>
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
    <div
      style={{
        maxWidth: "1024px",
        margin: "0 auto",
        padding: "clamp(1rem, 3vw, 2rem)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          marginBottom: "1.5rem",
        }}
      >
        <button
          onClick={() => router.push("/my-circles")}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "0.25rem",
            display: "flex",
            alignItems: "center",
            color: "#999",
          }}
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
          style={{
            padding: "0.75rem 1rem",
            borderRadius: "0.75rem",
            marginBottom: "1.5rem",
            fontSize: "13px",
            fontWeight: 500,
            backgroundColor: message.type === "success" ? "#ECFDF5" : "#FEF2F2",
            color: message.type === "success" ? "#059669" : "#DC2626",
            border: `1px solid ${message.type === "success" ? "#A7F3D0" : "#FECACA"}`,
          }}
        >
          {message.text}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "1.5rem",
          marginBottom: "2rem",
        }}
      >
        <Card padding="1.25rem">
          <span
            style={{
              fontSize: "11px",
              color: "#999",
              display: "block",
              marginBottom: "0.25rem",
            }}
          >
            Principal
          </span>
          <span
            style={{
              fontSize: "1.25rem",
              fontWeight: 700,
              fontFamily: "'JetBrains Mono', monospace",
              color: cfg.colors.primary,
            }}
          >
            {formatNaira(account.principalAmount)}
          </span>
        </Card>
        <Card padding="1.25rem">
          <span
            style={{
              fontSize: "11px",
              color: "#999",
              display: "block",
              marginBottom: "0.25rem",
            }}
          >
            Interest Earned
          </span>
          <span
            style={{
              fontSize: "1.25rem",
              fontWeight: 700,
              fontFamily: "'JetBrains Mono', monospace",
              color: "#10B981",
            }}
          >
            {formatNaira(account.interestEarned)}
          </span>
        </Card>
        <Card padding="1.25rem">
          <span
            style={{
              fontSize: "11px",
              color: "#999",
              display: "block",
              marginBottom: "0.25rem",
            }}
          >
            Maturity Value
          </span>
          <span
            style={{
              fontSize: "1.25rem",
              fontWeight: 700,
              fontFamily: "'JetBrains Mono', monospace",
              color: "#2D2D2D",
            }}
          >
            {formatNaira(account.principalAmount + account.interestEarned)}
          </span>
        </Card>
        <Card padding="1.25rem">
          <span
            style={{
              fontSize: "11px",
              color: "#999",
              display: "block",
              marginBottom: "0.25rem",
            }}
          >
            Interest Rate
          </span>
          <span
            style={{
              fontSize: "1.25rem",
              fontWeight: 700,
              fontFamily: "'JetBrains Mono', monospace",
              color: "#F59E0B",
            }}
          >
            {account.circle.interestRateAnnual}% p.a.
          </span>
        </Card>
      </div>

      <Card padding="1.5rem" style={{ marginBottom: "2rem" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1rem",
            flexWrap: "wrap",
            gap: "0.75rem",
          }}
        >
          <div>
            <span
              style={{
                fontSize: "10px",
                fontWeight: 700,
                textTransform: "uppercase",
                color: statusStyle.color,
                backgroundColor: statusStyle.bg,
                padding: "0.25rem 0.75rem",
                borderRadius: "9999px",
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {account.status.replace("_", " ")}
            </span>
            <h2
              style={{
                fontSize: "1rem",
                fontWeight: 600,
                color: "#2D2D2D",
                marginTop: "0.5rem",
              }}
            >
              {account.circle.name}
            </h2>
            <span style={{ fontSize: "12px", color: "#999" }}>
              {formatNaira(account.circle.amount)} &middot;{" "}
              {formatDuration(account.circle.durationMonths)}
            </span>
          </div>
          <div style={{ textAlign: "right", fontSize: "12px", color: "#666" }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              Started {formatDate(account.startDate)}
            </div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              Matures {formatDate(account.maturityDate)} ({days}d left)
            </div>
          </div>
        </div>

        <div style={{ marginBottom: "1.5rem" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "10px",
              color: "#999",
              marginBottom: "0.375rem",
            }}
          >
            <span>Maturity Progress</span>
            <span>{progress}%</span>
          </div>
          <div
            style={{
              height: "6px",
              borderRadius: "3px",
              backgroundColor: "#F0F0F0",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: "100%",
                backgroundColor: cfg.colors.primary,
                transition: "width 0.5s ease",
                borderRadius: "3px",
              }}
            />
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: "1rem",
            fontSize: "12px",
            padding: "1rem",
            backgroundColor: "#FAFAFA",
            borderRadius: "0.75rem",
          }}
        >
          <div>
            <span
              style={{
                color: "#999",
                display: "block",
                marginBottom: "0.25rem",
              }}
            >
              Deposit Amount
            </span>
            <span
              style={{
                fontWeight: 600,
                fontFamily: "'JetBrains Mono', monospace",
                color: "#2D2D2D",
              }}
            >
              {formatNaira(account.circle.amount)}
            </span>
          </div>
          <div>
            <span
              style={{
                color: "#999",
                display: "block",
                marginBottom: "0.25rem",
              }}
            >
              Total Withdrawn
            </span>
            <span
              style={{
                fontWeight: 600,
                fontFamily: "'JetBrains Mono', monospace",
                color: account.totalWithdrawn > 0 ? "#DC2626" : "#2D2D2D",
              }}
            >
              {formatNaira(account.totalWithdrawn)}
            </span>
          </div>
          <div>
            <span
              style={{
                color: "#999",
                display: "block",
                marginBottom: "0.25rem",
              }}
            >
              Weekly Interest
            </span>
            <span
              style={{
                fontWeight: 600,
                fontFamily: "'JetBrains Mono', monospace",
                color: "#10B981",
              }}
            >
              {formatNaira(
                (account.principalAmount *
                  (account.circle.interestRateAnnual / 100)) /
                  52,
              )}
            </span>
          </div>
          {account.lastInterestCalculation && (
            <div>
              <span
                style={{
                  color: "#999",
                  display: "block",
                  marginBottom: "0.25rem",
                }}
              >
                Last Interest Calc
              </span>
              <span style={{ fontWeight: 500, color: "#2D2D2D" }}>
                {formatDate(account.lastInterestCalculation)}
              </span>
            </div>
          )}
        </div>

        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            flexWrap: "wrap",
            marginTop: "1.5rem",
          }}
        >
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

      <div style={{ display: "flex", gap: "0.375rem", marginBottom: "1rem" }}>
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
            style={{
              padding: "0.5rem 1.25rem",
              borderRadius: "9999px",
              fontSize: "12px",
              fontWeight: 600,
              border: "1.5px solid",
              cursor: "pointer",
              transition: "all 0.15s ease",
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
            <h3
              style={{
                fontSize: "14px",
                fontWeight: 600,
                color: "#2D2D2D",
                marginBottom: "1rem",
              }}
            >
              Weekly Interest Breakdown
            </h3>
            {breakdown.length === 0 ? (
              <div
                style={{
                  padding: "2rem",
                  textAlign: "center",
                  color: "#999",
                  fontSize: "13px",
                }}
              >
                No breakdown available
              </div>
            ) : (
              <div
                style={{
                  maxHeight: "480px",
                  overflowY: "auto",
                  borderRadius: "0.5rem",
                  border: "1px solid #F0F0F0",
                }}
              >
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: "11px",
                  }}
                >
                  <thead style={{ position: "sticky", top: 0, zIndex: 1 }}>
                    <tr style={{ backgroundColor: "#FAFAFA" }}>
                      <th
                        style={{
                          padding: "0.625rem 0.75rem",
                          textAlign: "center",
                          fontWeight: 600,
                          color: "#999",
                          borderBottom: "1px solid #F0F0F0",
                          fontSize: "9px",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                        }}
                      >
                        Week
                      </th>
                      <th
                        style={{
                          padding: "0.625rem 0.75rem",
                          textAlign: "left",
                          fontWeight: 600,
                          color: "#999",
                          borderBottom: "1px solid #F0F0F0",
                          fontSize: "9px",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                        }}
                      >
                        Date
                      </th>
                      <th
                        style={{
                          padding: "0.625rem 0.75rem",
                          textAlign: "right",
                          fontWeight: 600,
                          color: "#999",
                          borderBottom: "1px solid #F0F0F0",
                          fontSize: "9px",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                        }}
                      >
                        Principal
                      </th>
                      <th
                        style={{
                          padding: "0.625rem 0.75rem",
                          textAlign: "right",
                          fontWeight: 600,
                          color: "#999",
                          borderBottom: "1px solid #F0F0F0",
                          fontSize: "9px",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                        }}
                      >
                        This Week
                      </th>
                      <th
                        style={{
                          padding: "0.625rem 0.75rem",
                          textAlign: "right",
                          fontWeight: 600,
                          color: "#999",
                          borderBottom: "1px solid #F0F0F0",
                          fontSize: "9px",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                        }}
                      >
                        Cumulative
                      </th>
                      <th
                        style={{
                          padding: "0.625rem 0.75rem",
                          textAlign: "right",
                          fontWeight: 600,
                          color: "#999",
                          borderBottom: "1px solid #F0F0F0",
                          fontSize: "9px",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                        }}
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
                          style={{
                            backgroundColor: isCurrent
                              ? "#ECFDF5"
                              : idx % 2 === 0
                                ? "#ffffff"
                                : "#FAFAFA",
                            opacity: isPast ? 1 : 0.6,
                          }}
                        >
                          <td
                            style={{
                              padding: "0.5rem 0.75rem",
                              textAlign: "center",
                              fontFamily: "'JetBrains Mono', monospace",
                              fontWeight: isCurrent ? 700 : 400,
                              color: isCurrent ? cfg.colors.primary : "#666",
                            }}
                          >
                            #{week.week}
                          </td>
                          <td
                            style={{
                              padding: "0.5rem 0.75rem",
                              fontFamily: "'JetBrains Mono', monospace",
                              color: "#666",
                            }}
                          >
                            {formatDate(week.date)}
                          </td>
                          <td
                            style={{
                              padding: "0.5rem 0.75rem",
                              textAlign: "right",
                              fontFamily: "'JetBrains Mono', monospace",
                              color: "#666",
                            }}
                          >
                            {formatNaira(week.principal)}
                          </td>
                          <td
                            style={{
                              padding: "0.5rem 0.75rem",
                              textAlign: "right",
                              fontFamily: "'JetBrains Mono', monospace",
                              fontWeight: 500,
                              color: "#10B981",
                            }}
                          >
                            +{formatNaira(week.interestThisWeek)}
                          </td>
                          <td
                            style={{
                              padding: "0.5rem 0.75rem",
                              textAlign: "right",
                              fontFamily: "'JetBrains Mono', monospace",
                              color: "#2D2D2D",
                            }}
                          >
                            {formatNaira(week.cumulativeInterest)}
                          </td>
                          <td
                            style={{
                              padding: "0.5rem 0.75rem",
                              textAlign: "right",
                              fontFamily: "'JetBrains Mono', monospace",
                              fontWeight: 600,
                              color: cfg.colors.primary,
                            }}
                          >
                            {formatNaira(week.totalValue)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            <div
              style={{
                marginTop: "1rem",
                padding: "0.75rem 1rem",
                backgroundColor: "#FFFBEB",
                borderRadius: "0.5rem",
                fontSize: "11px",
                color: "#92400E",
              }}
            >
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
            <h3
              style={{
                fontSize: "14px",
                fontWeight: 600,
                color: "#2D2D2D",
                marginBottom: "1rem",
              }}
            >
              Interest Calculation History
            </h3>
            {account.interestLogs.length === 0 ? (
              <div
                style={{
                  padding: "2rem",
                  textAlign: "center",
                  color: "#999",
                  fontSize: "13px",
                }}
              >
                No interest calculations recorded yet
              </div>
            ) : (
              <div
                style={{
                  maxHeight: "400px",
                  overflowY: "auto",
                  borderRadius: "0.5rem",
                  border: "1px solid #F0F0F0",
                }}
              >
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: "11px",
                  }}
                >
                  <thead style={{ position: "sticky", top: 0, zIndex: 1 }}>
                    <tr style={{ backgroundColor: "#FAFAFA" }}>
                      <th
                        style={{
                          padding: "0.625rem 0.75rem",
                          textAlign: "left",
                          fontWeight: 600,
                          color: "#999",
                          borderBottom: "1px solid #F0F0F0",
                          fontSize: "9px",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                        }}
                      >
                        Date
                      </th>
                      <th
                        style={{
                          padding: "0.625rem 0.75rem",
                          textAlign: "right",
                          fontWeight: 600,
                          color: "#999",
                          borderBottom: "1px solid #F0F0F0",
                          fontSize: "9px",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                        }}
                      >
                        Principal
                      </th>
                      <th
                        style={{
                          padding: "0.625rem 0.75rem",
                          textAlign: "right",
                          fontWeight: 600,
                          color: "#999",
                          borderBottom: "1px solid #F0F0F0",
                          fontSize: "9px",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                        }}
                      >
                        Interest
                      </th>
                      <th
                        style={{
                          padding: "0.625rem 0.75rem",
                          textAlign: "right",
                          fontWeight: 600,
                          color: "#999",
                          borderBottom: "1px solid #F0F0F0",
                          fontSize: "9px",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                        }}
                      >
                        Rate
                      </th>
                      <th
                        style={{
                          padding: "0.625rem 0.75rem",
                          textAlign: "right",
                          fontWeight: 600,
                          color: "#999",
                          borderBottom: "1px solid #F0F0F0",
                          fontSize: "9px",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                        }}
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
                          style={{
                            backgroundColor:
                              idx % 2 === 0 ? "#ffffff" : "#FAFAFA",
                          }}
                        >
                          <td
                            style={{
                              padding: "0.5rem 0.75rem",
                              fontFamily: "'JetBrains Mono', monospace",
                              color: "#666",
                            }}
                          >
                            {formatDate(log.calculatedAt)}
                          </td>
                          <td
                            style={{
                              padding: "0.5rem 0.75rem",
                              textAlign: "right",
                              fontFamily: "'JetBrains Mono', monospace",
                              color: "#666",
                            }}
                          >
                            {formatNaira(log.principalAtCalculation)}
                          </td>
                          <td
                            style={{
                              padding: "0.5rem 0.75rem",
                              textAlign: "right",
                              fontFamily: "'JetBrains Mono', monospace",
                              fontWeight: 500,
                              color: "#10B981",
                            }}
                          >
                            +{formatNaira(log.amount)}
                          </td>
                          <td
                            style={{
                              padding: "0.5rem 0.75rem",
                              textAlign: "right",
                              fontFamily: "'JetBrains Mono', monospace",
                              color: "#F59E0B",
                            }}
                          >
                            {log.annualRate}%
                          </td>
                          <td
                            style={{
                              padding: "0.5rem 0.75rem",
                              textAlign: "right",
                              fontFamily: "'JetBrains Mono', monospace",
                              color: "#2D2D2D",
                            }}
                          >
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
            <h3
              style={{
                fontSize: "14px",
                fontWeight: 600,
                color: "#2D2D2D",
                marginBottom: "1rem",
              }}
            >
              Transaction History
            </h3>
            {transactions.length === 0 ? (
              <div
                style={{
                  padding: "2rem",
                  textAlign: "center",
                  color: "#999",
                  fontSize: "13px",
                }}
              >
                No transactions yet
              </div>
            ) : (
              <div
                style={{
                  maxHeight: "400px",
                  overflowY: "auto",
                  borderRadius: "0.5rem",
                  border: "1px solid #F0F0F0",
                }}
              >
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: "11px",
                  }}
                >
                  <thead style={{ position: "sticky", top: 0, zIndex: 1 }}>
                    <tr style={{ backgroundColor: "#FAFAFA" }}>
                      <th
                        style={{
                          padding: "0.625rem 0.75rem",
                          textAlign: "left",
                          fontWeight: 600,
                          color: "#999",
                          borderBottom: "1px solid #F0F0F0",
                          fontSize: "9px",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                        }}
                      >
                        Date
                      </th>
                      <th
                        style={{
                          padding: "0.625rem 0.75rem",
                          textAlign: "left",
                          fontWeight: 600,
                          color: "#999",
                          borderBottom: "1px solid #F0F0F0",
                          fontSize: "9px",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                        }}
                      >
                        Type
                      </th>
                      <th
                        style={{
                          padding: "0.625rem 0.75rem",
                          textAlign: "right",
                          fontWeight: 600,
                          color: "#999",
                          borderBottom: "1px solid #F0F0F0",
                          fontSize: "9px",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                        }}
                      >
                        Amount
                      </th>
                      <th
                        style={{
                          padding: "0.625rem 0.75rem",
                          textAlign: "right",
                          fontWeight: 600,
                          color: "#999",
                          borderBottom: "1px solid #F0F0F0",
                          fontSize: "9px",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                        }}
                      >
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx, idx) => (
                      <tr
                        key={tx.id}
                        style={{
                          backgroundColor:
                            idx % 2 === 0 ? "#ffffff" : "#FAFAFA",
                        }}
                      >
                        <td
                          style={{
                            padding: "0.5rem 0.75rem",
                            fontFamily: "'JetBrains Mono', monospace",
                            color: "#666",
                          }}
                        >
                          {formatDateTime(tx.createdAt)}
                        </td>
                        <td style={{ padding: "0.5rem 0.75rem" }}>
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
                          style={{
                            padding: "0.5rem 0.75rem",
                            textAlign: "right",
                            fontFamily: "'JetBrains Mono', monospace",
                            fontWeight: 600,
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
                        <td
                          style={{
                            padding: "0.5rem 0.75rem",
                            textAlign: "right",
                          }}
                        >
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
