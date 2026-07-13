"use client";

import { useState, useEffect, useCallback } from "react";
import { config, BrandConfig } from "@thrift/config";
import { Card, Button, ColorfulBadge, FadeIn, FadeInUp, StaggerChildren, StatCard } from "@thrift/ui";
import { formatNaira } from "@thrift/utils";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/PageHeader";
import { Skeleton, SkeletonCard } from "@/components/Skeleton";

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
};

const ACCOUNT_STATUS_BG: Record<string, string> = {
  active: "#ECFDF5",
  matured: "#FFFBEB",
  withdrawn: "#F3F4F6",
  early_withdrawn: "#FEF2F2",
};

type StatusFilter = "all" | "active" | "matured" | "withdrawn";

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
    default: return "#717171";
  }
}

function getTransactionTypeLabel(type: string) {
  return type.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
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
        showMessage("success", "Maturity payout credited to wallet!");
        setWalletBalance(data.data.walletBalance);
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

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "clamp(1rem, 3vw, 2rem)" }}>
      <PageHeader badgeLabel="Savings" heading="My" accentText="Circles" description="Detailed view of all your circle savings accounts, interest earnings, and transaction history."
        right={<span style={{ fontSize: "12px", color: "#717171" }}>Wallet: <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: cfg.colors.primary }}>{formatNaira(walletBalance)}</span></span>} />

      {message && (
        <FadeIn>
          <div style={{ padding: "0.75rem 1rem", borderRadius: "0.75rem", marginBottom: "1.5rem", fontSize: "13px", fontWeight: 500, backgroundColor: message.type === "success" ? "#ECFDF5" : "#FEF2F2", color: message.type === "success" ? "#059669" : "#DC2626", border: `1px solid ${message.type === "success" ? "#A7F3D0" : "#FECACA"}` }}>
            {message.text}
          </div>
        </FadeIn>
      )}

      <StaggerChildren staggerDelay={100} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.5rem", marginBottom: "2rem" }}>
        <StatCard label="Total Invested" value={formatNaira(stats.totalInvested)} change={`${stats.total} account${stats.total !== 1 ? "s" : ""}`} positive variant="default" />
        <StatCard label="Interest Earned" value={formatNaira(stats.totalInterest)} change={stats.activeCount > 0 ? `${stats.activeCount} earning` : "No active accounts"} positive variant="warm" />
        <StatCard label="Maturity Value" value={formatNaira(stats.totalMaturityValue)} change={`${stats.activeCount + stats.maturedCount} pending`} positive variant="default" />
        <StatCard label="Active Accounts" value={String(stats.activeCount)} change={stats.maturedCount > 0 ? `${stats.maturedCount} matured` : "None matured"} positive variant="warm" />
      </StaggerChildren>

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        {(["all", "active", "matured", "withdrawn"] as StatusFilter[]).map((filter) => {
          const count = filter === "all" ? stats.total : myAccounts.filter((a) => a.status === filter).length;
          return (
            <button key={filter} onClick={() => setStatusFilter(filter)}
              style={{ padding: "0.5rem 1.25rem", borderRadius: "9999px", fontSize: "12px", fontWeight: 600, border: "1.5px solid", cursor: "pointer", transition: "all 0.15s ease", backgroundColor: statusFilter === filter ? cfg.colors.primary : "#ffffff", color: statusFilter === filter ? "#ffffff" : "#717171", borderColor: statusFilter === filter ? cfg.colors.primary : "#EAEAEA" }}>
              {filter.charAt(0).toUpperCase() + filter.slice(1)} ({count})
            </button>
          );
        })}
      </div>

      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.5rem" }}>{Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}</div>
      ) : filteredAccounts.length === 0 ? (
        <FadeInUp delay={200}>
          <Card padding="3rem">
            <div style={{ textAlign: "center" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "50%", backgroundColor: "#F0F0F0", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem", fontSize: "20px" }}>&#8358;</div>
              <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "#2D2D2D", marginBottom: "0.5rem" }}>
                {statusFilter === "all" ? "No circle accounts yet" : `No ${statusFilter} accounts`}
              </h3>
              <p style={{ fontSize: "13px", color: "#717171", marginBottom: "1rem" }}>
                {statusFilter === "all" ? "Open a circle account to start earning weekly interest." : "Try a different filter."}
              </p>
              {statusFilter === "all" && <Button variant="primary" size="sm" onClick={() => window.location.href = "/circles"}>Browse Circles</Button>}
            </div>
          </Card>
        </FadeInUp>
      ) : (
        <FadeInUp delay={200}>
          <Card padding="1.5rem">
            <ColorfulBadge label="My Accounts" color={cfg.colors.primary} />
            <h2 style={{ fontSize: "1.125rem", fontWeight: 500, color: "#1A1A1A", marginTop: "0.5rem", marginBottom: "1rem" }}>
              Circle Accounts ({filteredAccounts.length})
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {filteredAccounts.map((account) => {
                const progress = getMaturityProgress(account.startDate, account.maturityDate);
                const days = daysUntil(account.maturityDate);
                const isExpanded = expandedAccount === account.id;

                return (
                  <div key={account.id} style={{ padding: "1rem", borderRadius: "0.75rem", border: "1px solid #F0F0F0", backgroundColor: isExpanded ? "#FAF9F5" : "#ffffff", transition: "all 0.2s" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", flexWrap: "wrap", gap: "0.75rem" }} onClick={() => setExpandedAccount(isExpanded ? null : account.id)}>
                      <div style={{ display: "flex", alignItems: "center", gap: "1rem", flex: 1, minWidth: 0 }}>
                        <div style={{ width: "44px", height: "44px", borderRadius: "0.75rem", backgroundColor: ACCOUNT_STATUS_BG[account.status], display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", fontWeight: 700, color: ACCOUNT_STATUS_COLORS[account.status], flexShrink: 0 }}>
                          {formatNaira(account.principalAmount).split(" ")[0]}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.125rem" }}>
                            <span style={{ fontSize: "14px", fontWeight: 600, color: "#2D2D2D", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{account.circle.name}</span>
                            <span style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase", fontFamily: "'JetBrains Mono', monospace", color: ACCOUNT_STATUS_COLORS[account.status], backgroundColor: `${ACCOUNT_STATUS_COLORS[account.status]}12`, padding: "0.125rem 0.5rem", borderRadius: "0.375rem", flexShrink: 0 }}>{account.status.replace("_", " ")}</span>
                          </div>
                          <span style={{ fontSize: "11px", color: "#999" }}>{formatNaira(account.principalAmount)} &middot; {account.circle.interestRateAnnual}% p.a. &middot; {formatDuration(account.circle.durationMonths)}</span>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        {account.status === "active" && (
                          <span style={{ fontSize: "11px", color: "#666", fontFamily: "'JetBrains Mono', monospace" }}>{days}d left</span>
                        )}
                        <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); window.location.href = `/my-circles/${account.id}`; }}>
                          View Details
                        </Button>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={isExpanded ? cfg.colors.primary : "#999"} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ transition: "transform 0.2s", transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)", flexShrink: 0 }}>
                          <path d="M6 9l6 6 6-6" />
                        </svg>
                      </div>
                    </div>

                    {account.status === "active" && (
                      <div style={{ marginTop: "0.75rem" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#999", marginBottom: "0.375rem" }}>
                          <span>Maturity Progress</span>
                          <span>{progress}%</span>
                        </div>
                        <div style={{ height: "4px", borderRadius: "2px", backgroundColor: "#F0F0F0", overflow: "hidden" }}>
                          <div style={{ width: `${progress}%`, height: "100%", backgroundColor: cfg.colors.primary, transition: "width 0.5s ease", borderRadius: "2px" }} />
                        </div>
                      </div>
                    )}

                    {isExpanded && (
                      <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid #F0F0F0" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "1rem", fontSize: "12px", marginBottom: "1rem" }}>
                          <div><span style={{ color: "#999", display: "block", marginBottom: "0.25rem" }}>Principal</span><span style={{ fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", color: cfg.colors.primary }}>{formatNaira(account.principalAmount)}</span></div>
                          <div><span style={{ color: "#999", display: "block", marginBottom: "0.25rem" }}>Interest Earned</span><span style={{ fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", color: "#10B981" }}>{formatNaira(account.interestEarned)}</span></div>
                          <div><span style={{ color: "#999", display: "block", marginBottom: "0.25rem" }}>Maturity Payout</span><span style={{ fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", color: "#2D2D2D" }}>{formatNaira(account.principalAmount + account.interestEarned)}</span></div>
                          <div><span style={{ color: "#999", display: "block", marginBottom: "0.25rem" }}>Start Date</span><span style={{ fontWeight: 500, color: "#2D2D2D" }}>{formatDate(account.startDate)}</span></div>
                          <div><span style={{ color: "#999", display: "block", marginBottom: "0.25rem" }}>Maturity Date</span><span style={{ fontWeight: 500, color: "#2D2D2D" }}>{formatDate(account.maturityDate)}</span></div>
                          {account.lastInterestCalculation && (
                            <div><span style={{ color: "#999", display: "block", marginBottom: "0.25rem" }}>Last Interest</span><span style={{ fontWeight: 500, color: "#2D2D2D" }}>{formatDate(account.lastInterestCalculation)}</span></div>
                          )}
                        </div>

                        <div style={{ display: "flex", gap: "0.375rem", marginBottom: "1rem" }}>
                          <button onClick={() => setAccountSubTab("interest")}
                            style={{ padding: "0.375rem 1rem", borderRadius: "9999px", fontSize: "11px", fontWeight: 600, border: "1.5px solid", cursor: "pointer", transition: "all 0.15s ease", backgroundColor: accountSubTab === "interest" ? cfg.colors.primary : "#ffffff", color: accountSubTab === "interest" ? "#ffffff" : "#717171", borderColor: accountSubTab === "interest" ? cfg.colors.primary : "#EAEAEA" }}>
                            Interest Logs
                          </button>
                          <button onClick={() => setAccountSubTab("transactions")}
                            style={{ padding: "0.375rem 1rem", borderRadius: "9999px", fontSize: "11px", fontWeight: 600, border: "1.5px solid", cursor: "pointer", transition: "all 0.15s ease", backgroundColor: accountSubTab === "transactions" ? cfg.colors.primary : "#ffffff", color: accountSubTab === "transactions" ? "#ffffff" : "#717171", borderColor: accountSubTab === "transactions" ? cfg.colors.primary : "#EAEAEA" }}>
                            Transactions
                          </button>
                        </div>

                        {loadingDetails ? (
                          <div style={{ padding: "1.5rem", textAlign: "center", color: "#999", fontSize: "12px" }}>Loading details...</div>
                        ) : accountSubTab === "interest" ? (
                          <div style={{ maxHeight: "280px", overflowY: "auto", borderRadius: "0.5rem", border: "1px solid #F0F0F0" }}>
                            {interestLogs.length === 0 ? (
                              <div style={{ padding: "1.5rem", textAlign: "center", color: "#999", fontSize: "12px" }}>No interest calculations yet</div>
                            ) : (
                              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
                                <thead style={{ position: "sticky", top: 0, zIndex: 1 }}>
                                  <tr style={{ backgroundColor: "#FAFAFA" }}>
                                    <th style={{ padding: "0.625rem 0.75rem", textAlign: "left", fontWeight: 600, color: "#999", borderBottom: "1px solid #F0F0F0", fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Date</th>
                                    <th style={{ padding: "0.625rem 0.75rem", textAlign: "right", fontWeight: 600, color: "#999", borderBottom: "1px solid #F0F0F0", fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Principal</th>
                                    <th style={{ padding: "0.625rem 0.75rem", textAlign: "right", fontWeight: 600, color: "#999", borderBottom: "1px solid #F0F0F0", fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Interest</th>
                                    <th style={{ padding: "0.625rem 0.75rem", textAlign: "right", fontWeight: 600, color: "#999", borderBottom: "1px solid #F0F0F0", fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Cumulative</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {interestLogs.reduce((acc, log) => {
                                    const prevCum = acc.length > 0 ? acc[acc.length - 1].cumulative : 0;
                                    acc.push({ ...log, cumulative: prevCum + log.amount });
                                    return acc;
                                  }, [] as (InterestLog & { cumulative: number })[]).map((log, idx) => (
                                    <tr key={log.id} style={{ backgroundColor: idx % 2 === 0 ? "#ffffff" : "#FAFAFA" }}>
                                      <td style={{ padding: "0.5rem 0.75rem", fontFamily: "'JetBrains Mono', monospace", color: "#666" }}>{formatDate(log.calculatedAt)}</td>
                                      <td style={{ padding: "0.5rem 0.75rem", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", color: "#666" }}>{formatNaira(log.principalAtCalculation)}</td>
                                      <td style={{ padding: "0.5rem 0.75rem", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontWeight: 500, color: "#10B981" }}>+{formatNaira(log.amount)}</td>
                                      <td style={{ padding: "0.5rem 0.75rem", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", color: "#2D2D2D" }}>{formatNaira(log.cumulative)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                          </div>
                        ) : (
                          <div style={{ maxHeight: "280px", overflowY: "auto", borderRadius: "0.5rem", border: "1px solid #F0F0F0" }}>
                            {accountTransactions.length === 0 ? (
                              <div style={{ padding: "1.5rem", textAlign: "center", color: "#999", fontSize: "12px" }}>No transactions yet</div>
                            ) : (
                              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
                                <thead style={{ position: "sticky", top: 0, zIndex: 1 }}>
                                  <tr style={{ backgroundColor: "#FAFAFA" }}>
                                    <th style={{ padding: "0.625rem 0.75rem", textAlign: "left", fontWeight: 600, color: "#999", borderBottom: "1px solid #F0F0F0", fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Date</th>
                                    <th style={{ padding: "0.625rem 0.75rem", textAlign: "left", fontWeight: 600, color: "#999", borderBottom: "1px solid #F0F0F0", fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Type</th>
                                    <th style={{ padding: "0.625rem 0.75rem", textAlign: "right", fontWeight: 600, color: "#999", borderBottom: "1px solid #F0F0F0", fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Amount</th>
                                    <th style={{ padding: "0.625rem 0.75rem", textAlign: "left", fontWeight: 600, color: "#999", borderBottom: "1px solid #F0F0F0", fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Status</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {accountTransactions.map((tx, idx) => {
                                    const color = getTransactionTypeColor(tx.type);
                                    return (
                                      <tr key={tx.id} style={{ backgroundColor: idx % 2 === 0 ? "#ffffff" : "#FAFAFA" }}>
                                        <td style={{ padding: "0.5rem 0.75rem", fontFamily: "'JetBrains Mono', monospace", color: "#666" }}>{formatDateTime(tx.createdAt)}</td>
                                        <td style={{ padding: "0.5rem 0.75rem" }}>
                                          <span style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase", fontFamily: "'JetBrains Mono', monospace", color, backgroundColor: `${color}12`, padding: "0.125rem 0.5rem", borderRadius: "0.375rem" }}>
                                            {getTransactionTypeLabel(tx.type)}
                                          </span>
                                        </td>
                                        <td style={{ padding: "0.5rem 0.75rem", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: tx.type === "circle_withdrawal" ? "#DC2626" : tx.type === "circle_interest" ? "#10B981" : cfg.colors.primary }}>
                                          {tx.type === "circle_withdrawal" ? "-" : "+"}{formatNaira(tx.amount)}
                                        </td>
                                        <td style={{ padding: "0.5rem 0.75rem" }}>
                                          <span style={{ fontSize: "9px", fontWeight: 600, textTransform: "uppercase", color: tx.status === "completed" ? "#059669" : "#D97706", backgroundColor: tx.status === "completed" ? "#ECFDF5" : "#FFFBEB", padding: "0.125rem 0.5rem", borderRadius: "0.375rem" }}>
                                            {tx.status}
                                          </span>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            )}
                          </div>
                        )}

                        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "1rem" }}>
                          {account.status === "active" && (
                            <>
                              <Button variant="primary" size="sm" disabled={claiming === account.id || daysUntil(account.maturityDate) > 0} onClick={() => handleClaim(account.id)}>
                                {claiming === account.id ? "Claiming..." : daysUntil(account.maturityDate) > 0 ? `Matures in ${daysUntil(account.maturityDate)}d` : "Claim Maturity"}
                              </Button>
                              <Button variant="secondary" size="sm" disabled={withdrawing === account.id} onClick={() => handleWithdraw(account.id)}>
                                {withdrawing === account.id ? "Withdrawing..." : "Early Withdraw (Forfeit Interest)"}
                              </Button>
                            </>
                          )}
                          {account.status === "matured" && (
                            <Button variant="primary" size="sm" disabled={claiming === account.id} onClick={() => handleClaim(account.id)}>
                              {claiming === account.id ? "Claiming..." : "Claim Maturity Payout"}
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        </FadeInUp>
      )}
    </div>
  );
}
