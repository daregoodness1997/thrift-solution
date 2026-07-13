"use client";

import { useState, useEffect, useCallback } from "react";
import { config, BrandConfig } from "@thrift/config";
import { Card, Button, ColorfulBadge, FadeIn, FadeInUp, StaggerChildren, StatCard } from "@thrift/ui";
import { formatNaira } from "@thrift/utils";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/PageHeader";
import { Skeleton, SkeletonCard } from "@/components/Skeleton";
import { CircleCalculator } from "@/components/CircleCalculator";
import Pagination from "@/components/Pagination";

const fallback = config;

interface Circle {
  id: string;
  name: string;
  description?: string;
  amount: number;
  durationMonths: number;
  interestRateAnnual: number;
  maxAccountsPerUser: number;
  status: string;
  _count?: { accounts: number };
}

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

const ACCOUNT_STATUS_COLORS: Record<string, string> = {
  active: "#10B981",
  matured: "#F59E0B",
  withdrawn: "#6B7280",
  early_withdrawn: "#DC2626",
};

function formatDuration(months: number) {
  if (months < 12) return `${months}mo`;
  const y = Math.floor(months / 12);
  const m = months % 12;
  return m > 0 ? `${y}y ${m}mo` : `${y}y`;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function daysUntil(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export default function CirclesPage() {
  const { token } = useAuth();
  const [cfg, setCfg] = useState<BrandConfig>(fallback);
  const [circles, setCircles] = useState<Circle[]>([]);
  const [myAccounts, setMyAccounts] = useState<CircleAccount[]>([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"calculator" | "accounts">("calculator");
  const [expandedAccount, setExpandedAccount] = useState<string | null>(null);
  const [openingCircle, setOpeningCircle] = useState<string | null>(null);
  const [withdrawing, setWithdrawing] = useState<string | null>(null);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [openModalCircle, setOpenModalCircle] = useState<Circle | null>(null);
  const [accountCount, setAccountCount] = useState(1);
  const [page, setPage] = useState(1);
  const LIMIT = 20;
  const [accountsData, setAccountsData] = useState<{ total: number; totalPages: number }>({ total: 0, totalPages: 1 });

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  useEffect(() => { fetch(`${API_URL}/api/config`).then((r) => r.json()).then((d) => { if (d && d.name) setCfg((p) => ({ ...p, ...d })); }).catch(() => {}); }, [API_URL]);

  const fetchData = useCallback(async () => {
    if (!token) { setLoading(false); return; }
    try {
      const [circlesRes, accountsRes] = await Promise.all([
        fetch(`${API_URL}/api/circles/active`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/api/circles/accounts/my?page=${page}&limit=${LIMIT}`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const circlesJson = await circlesRes.json();
      const accountsJson = await accountsRes.json();
      if (circlesJson.success) setCircles(circlesJson.data);
      if (accountsJson.success) {
        setMyAccounts(accountsJson.data.items);
        setAccountsData({ total: accountsJson.data.total, totalPages: accountsJson.data.totalPages });
      }
    } catch {}
    setLoading(false);
  }, [token, API_URL, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleOpenAccount = async (circleId: string, count: number = 1) => {
    setOpeningCircle(circleId);
    try {
      const res = await fetch(`${API_URL}/api/circles/${circleId}/open`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ count }),
      });
      const data = await res.json();
      if (data.success) {
        const opened = data.data.opened || 1;
        showMessage("success", `Opened ${opened} circle account${opened > 1 ? "s" : ""} successfully!`);
        setWalletBalance(data.data.walletBalance);
        fetchData();
      } else {
        showMessage("error", data.error || "Failed to open account");
      }
    } catch {
      showMessage("error", "Failed to open circle account");
    }
    setOpeningCircle(null);
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

  const activeAccounts = myAccounts.filter((a) => a.status === "active");
  const maturedAccounts = myAccounts.filter((a) => a.status === "matured");
  const totalInvested = myAccounts.reduce((sum, a) => sum + a.principalAmount, 0);
  const totalInterest = myAccounts.reduce((sum, a) => sum + a.interestEarned, 0);

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "clamp(1rem, 3vw, 2rem)" }}>
      <PageHeader badgeLabel="Savings" heading="Circle" accentText="Accounts" description="Fixed-term savings with weekly interest. Earn more by locking your funds."
        right={<span style={{ fontSize: "12px", color: "#717171" }}>Wallet: <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: cfg.colors.primary }}>{formatNaira(walletBalance)}</span></span>} />

      {message && (
        <FadeIn>
          <div style={{ padding: "0.75rem 1rem", borderRadius: "0.75rem", marginBottom: "1.5rem", fontSize: "13px", fontWeight: 500, backgroundColor: message.type === "success" ? "#ECFDF5" : "#FEF2F2", color: message.type === "success" ? "#059669" : "#DC2626", border: `1px solid ${message.type === "success" ? "#A7F3D0" : "#FECACA"}` }}>
            {message.text}
          </div>
        </FadeIn>
      )}

      <StaggerChildren staggerDelay={100} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.5rem", marginBottom: "2rem" }}>
        <StatCard label="Total Invested" value={formatNaira(totalInvested)} change={`${myAccounts.length} account${myAccounts.length !== 1 ? "s" : ""}`} positive variant="default" />
        <StatCard label="Interest Earned" value={formatNaira(totalInterest)} change={activeAccounts.length > 0 ? `${activeAccounts.length} earning` : "No active accounts"} positive variant="warm" />
        <StatCard label="Active Accounts" value={String(activeAccounts.length)} change={maturedAccounts.length > 0 ? `${maturedAccounts.length} matured` : "None matured"} positive variant="default" />
      </StaggerChildren>

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
        <button onClick={() => setActiveTab("calculator")}
          style={{ padding: "0.5rem 1.25rem", borderRadius: "9999px", fontSize: "12px", fontWeight: 600, border: "1.5px solid", cursor: "pointer", transition: "all 0.15s ease", backgroundColor: activeTab === "calculator" ? cfg.colors.primary : "#ffffff", color: activeTab === "calculator" ? "#ffffff" : "#717171", borderColor: activeTab === "calculator" ? cfg.colors.primary : "#EAEAEA" }}>
          Calculator
        </button>
        <button onClick={() => setActiveTab("accounts")}
          style={{ padding: "0.5rem 1.25rem", borderRadius: "9999px", fontSize: "12px", fontWeight: 600, border: "1.5px solid", cursor: "pointer", transition: "all 0.15s ease", backgroundColor: activeTab === "accounts" ? cfg.colors.primary : "#ffffff", color: activeTab === "accounts" ? "#ffffff" : "#717171", borderColor: activeTab === "accounts" ? cfg.colors.primary : "#EAEAEA" }}>
          My Accounts ({myAccounts.length})
        </button>
      </div>

      {activeTab === "calculator" && (
        <>
          <FadeInUp delay={200} style={{ marginBottom: "2rem" }}>
            <CircleCalculator circleAmount={circles[0]?.amount || 10000} annualRate={circles[0]?.interestRateAnnual || 10} />
          </FadeInUp>

          {circles.length > 0 && (
            <FadeInUp delay={300}>
              <Card padding="1.5rem">
                <ColorfulBadge label="Available Circles" color={cfg.colors.primary} />
                <h2 style={{ fontSize: "1.125rem", fontWeight: 500, color: "#1A1A1A", marginTop: "0.5rem", marginBottom: "1rem" }}>Open a Circle Account</h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
                  {circles.map((circle) => {
                    const userAccounts = myAccounts.filter((a) => a.circleId === circle.id && a.status === "active").length;
                    const canOpen = userAccounts < circle.maxAccountsPerUser;
                    return (
                      <div key={circle.id} style={{ padding: "1.25rem", borderRadius: "0.75rem", border: "1px solid #F0F0F0", backgroundColor: "#FAFAFA", transition: "all 0.2s" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                          <div>
                            <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#2D2D2D", marginBottom: "0.25rem" }}>{circle.name}</h3>
                            {circle.description && <p style={{ fontSize: "11px", color: "#999", marginBottom: "0.5rem" }}>{circle.description}</p>}
                          </div>
                          <span style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase", fontFamily: "'JetBrains Mono', monospace", color: "#059669", backgroundColor: "#05966912", padding: "0.125rem 0.5rem", borderRadius: "0.375rem" }}>active</span>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", fontSize: "12px", marginBottom: "1rem" }}>
                          <div><span style={{ color: "#999" }}>Amount</span><br /><span style={{ fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", color: "#2D2D2D" }}>{formatNaira(circle.amount)}</span></div>
                          <div><span style={{ color: "#999" }}>Duration</span><br /><span style={{ fontWeight: 600, color: "#2D2D2D" }}>{formatDuration(circle.durationMonths)}</span></div>
                          <div><span style={{ color: "#999" }}>Interest Rate</span><br /><span style={{ fontWeight: 600, color: "#2D2D2D" }}>{circle.interestRateAnnual}% p.a.</span></div>
                          <div><span style={{ color: "#999" }}>Your Accounts</span><br /><span style={{ fontWeight: 600, color: "#2D2D2D" }}>{userAccounts}/{circle.maxAccountsPerUser}</span></div>
                        </div>
                        <Button variant="primary" size="sm" disabled={!canOpen || openingCircle === circle.id} onClick={() => { setOpenModalCircle(circle); setAccountCount(1); }}>
                          {openingCircle === circle.id ? "Opening..." : canOpen ? "Open Account" : "Max Reached"}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </FadeInUp>
          )}
        </>
      )}

      {activeTab === "accounts" && (
        <>
          {loading ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.5rem" }}>{Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}</div>
          ) : myAccounts.length === 0 ? (
            <FadeInUp delay={200}>
              <Card padding="3rem">
                <div style={{ textAlign: "center" }}>
                  <div style={{ width: "48px", height: "48px", borderRadius: "50%", backgroundColor: "#F0F0F0", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem", fontSize: "20px" }}>&#8358;</div>
                  <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "#2D2D2D", marginBottom: "0.5rem" }}>No circle accounts yet</h3>
                  <p style={{ fontSize: "13px", color: "#717171", marginBottom: "1rem" }}>Open a circle account to start earning weekly interest.</p>
                  <Button variant="primary" size="sm" onClick={() => setActiveTab("calculator")}>Browse Circles</Button>
                </div>
              </Card>
            </FadeInUp>
          ) : (
            <FadeInUp delay={200}>
              <Card padding="1.5rem">
                <ColorfulBadge label="My Accounts" color={cfg.colors.primary} />
                <h2 style={{ fontSize: "1.125rem", fontWeight: 500, color: "#1A1A1A", marginTop: "0.5rem", marginBottom: "1rem" }}>Your Circle Accounts ({myAccounts.length})</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {myAccounts.map((account) => (
                    <div key={account.id} style={{ padding: "1rem", borderRadius: "0.75rem", border: "1px solid #F0F0F0", backgroundColor: expandedAccount === account.id ? "#FAF9F5" : "#ffffff", transition: "all 0.2s" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", flexWrap: "wrap", gap: "0.75rem" }} onClick={() => setExpandedAccount(expandedAccount === account.id ? null : account.id)}>
                        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                          <div style={{ width: "40px", height: "40px", borderRadius: "0.75rem", backgroundColor: "#F0F0F0", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", fontWeight: 700, color: cfg.colors.primary }}>{formatNaira(account.principalAmount).split(" ")[0]}</div>
                          <div>
                            <span style={{ fontSize: "14px", fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", color: "#2D2D2D", display: "block" }}>{account.circle.name}</span>
                            <span style={{ fontSize: "11px", color: "#999" }}>{formatNaira(account.principalAmount)} &middot; {account.circle.interestRateAnnual}% p.a. &middot; {formatDuration(account.circle.durationMonths)}</span>
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          {account.status === "active" && (
                            <span style={{ fontSize: "10px", color: "#666", fontFamily: "'JetBrains Mono', monospace" }}>{daysUntil(account.maturityDate)}d left</span>
                          )}
                          <span style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase", fontFamily: "'JetBrains Mono', monospace", color: ACCOUNT_STATUS_COLORS[account.status], backgroundColor: `${ACCOUNT_STATUS_COLORS[account.status]}12`, padding: "0.125rem 0.5rem", borderRadius: "0.375rem" }}>{account.status.replace("_", " ")}</span>
                        </div>
                      </div>

                      {expandedAccount === account.id && (
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

                          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
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
                  ))}
                </div>
                <Pagination
                  page={page}
                  totalPages={accountsData?.totalPages || 1}
                  total={accountsData?.total || 0}
                  limit={LIMIT}
                  onPageChange={setPage}
                  loading={loading}
                />
              </Card>
            </FadeInUp>
          )}
        </>
      )}

      {openModalCircle && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "1rem" }} onClick={() => setOpenModalCircle(null)}>
          <div style={{ backgroundColor: "#fff", borderRadius: "1rem", padding: "2rem", maxWidth: "400px", width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#1A1A1A", marginBottom: "0.5rem" }}>Open Circle Account</h3>
            <p style={{ fontSize: "13px", color: "#717171", marginBottom: "1.5rem" }}>
              How many <strong>{openModalCircle.name}</strong> accounts would you like to open?
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
              <button
                onClick={() => setAccountCount((c) => Math.max(1, c - 1))}
                style={{ width: "36px", height: "36px", borderRadius: "0.5rem", border: "1px solid #E5E7EB", backgroundColor: "#F9FAFB", fontSize: "16px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              >-</button>
              <input
                type="number"
                min={1}
                max={Math.max(1, openModalCircle.maxAccountsPerUser - (myAccounts.filter((a) => a.circleId === openModalCircle.id && a.status === "active").length))}
                value={accountCount}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  if (!isNaN(v) && v >= 1) setAccountCount(Math.min(v, openModalCircle.maxAccountsPerUser));
                }}
                style={{ width: "60px", height: "36px", textAlign: "center", borderRadius: "0.5rem", border: "1px solid #E5E7EB", fontSize: "14px", fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, outline: "none" }}
              />
              <button
                onClick={() => setAccountCount((c) => Math.min(openModalCircle.maxAccountsPerUser, c + 1))}
                style={{ width: "36px", height: "36px", borderRadius: "0.5rem", border: "1px solid #E5E7EB", backgroundColor: "#F9FAFB", fontSize: "16px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              >+</button>
            </div>
            <div style={{ backgroundColor: "#F9FAFB", borderRadius: "0.75rem", padding: "1rem", marginBottom: "1.5rem", fontSize: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                <span style={{ color: "#717171" }}>Cost per account</span>
                <span style={{ fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>{formatNaira(openModalCircle.amount)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                <span style={{ color: "#717171" }}>Total cost</span>
                <span style={{ fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: cfg.colors.primary }}>{formatNaira(openModalCircle.amount * accountCount)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#717171" }}>Your wallet</span>
                <span style={{ fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", color: walletBalance >= openModalCircle.amount * accountCount ? "#059669" : "#DC2626" }}>{formatNaira(walletBalance)}</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button onClick={() => setOpenModalCircle(null)} style={{ flex: 1, padding: "0.625rem", borderRadius: "0.5rem", border: "1px solid #E5E7EB", backgroundColor: "#fff", fontSize: "13px", fontWeight: 500, cursor: "pointer" }}>Cancel</button>
              <button
                disabled={openingCircle === openModalCircle.id || walletBalance < openModalCircle.amount * accountCount}
                onClick={() => { handleOpenAccount(openModalCircle.id, accountCount); setOpenModalCircle(null); }}
                style={{ flex: 1, padding: "0.625rem", borderRadius: "0.5rem", border: "none", backgroundColor: cfg.colors.primary, color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer", opacity: (openingCircle === openModalCircle.id || walletBalance < openModalCircle.amount * accountCount) ? 0.5 : 1 }}
              >
                {openingCircle === openModalCircle.id ? "Opening..." : `Open ${accountCount > 1 ? `${accountCount} Accounts` : "Account"}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
