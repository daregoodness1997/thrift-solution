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
  cycleType: string;
  amount: number;
  weeklyAmount?: number | null;
  totalWeeks?: number | null;
  durationMonths: number;
  interestRateAnnual: number;
  maxAccountsPerUser: number;
  payoutMode?: string;
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
  weeksContributed?: number;
  weeksDefaulted?: number;
  startDate: string;
  maturityDate: string;
  lastInterestCalculation?: string;
  circle: { id: string; name: string; cycleType?: string; amount: number; weeklyAmount?: number | null; totalWeeks?: number | null; durationMonths: number; interestRateAnnual: number; autoPayout?: boolean; payoutMode?: string; blockPayoutOnDefault?: boolean; defaultPenaltyType?: string | null; defaultPenaltyValue?: number | null };
}

function circleOpenCost(c: { cycleType?: string; amount: number; weeklyAmount?: number | null }) {
  return c.cycleType === "weekly_contribution" ? (c.weeklyAmount || 0) : c.amount;
}

function isAutoPayout(c: { autoPayout?: boolean; payoutMode?: string }) {
  if (c.payoutMode) return c.payoutMode === "auto";
  return !!c.autoPayout;
}

function computeClearanceAmount(weeklyAmount: number, penaltyType?: string | null, penaltyValue?: number | null) {
  const pt = penaltyType || "percent";
  const pv = penaltyValue != null ? penaltyValue : 100;
  if (pt === "percent") {
    return Math.round(weeklyAmount * (1 + pv / 100) * 100) / 100;
  }
  return Math.round((weeklyAmount + pv) * 100) / 100;
}

function formatClearanceLabel(penaltyType?: string | null, penaltyValue?: number | null) {
  const pt = penaltyType || "percent";
  const pv = penaltyValue != null ? penaltyValue : 100;
  if (pt === "percent") return `${100 + pv}%`;
  return `+${formatNaira(pv)}`;
}

const ACCOUNT_STATUS_COLORS: Record<string, string> = {
  active: "#10B981",
  matured: "#F59E0B",
  withdrawn: "#6B7280",
  early_withdrawn: "#DC2626",
  reversed: "#DC2626",
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
  const [circlesStats, setCirclesStats] = useState({ activeCount: 0, maturedCount: 0, totalInvested: 0, totalInterest: 0 });

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
        if (accountsJson.data.stats) setCirclesStats(accountsJson.data.stats);
      }
      try {
        const walletRes = await fetch(`${API_URL}/api/wallet/balance`, { headers: { Authorization: `Bearer ${token}` } });
        const walletJson = await walletRes.json();
        if (walletJson.success) setWalletBalance(walletJson.data.balance);
      } catch {}
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
        setOpenModalCircle(null);
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

  const activeAccounts = myAccounts.filter((a) => a.status === "active");
  const maturedAccounts = myAccounts.filter((a) => a.status === "matured");

  return (
    <div className="mx-auto max-w-[1280px] p-[clamp(1rem,3vw,2rem)]">
      <PageHeader badgeLabel="Savings" heading="Circle" accentText="Accounts" description="Fixed-term savings with weekly interest. Earn more by locking your funds."
        right={<span className="text-[12px] text-gray-500">Wallet: <span className="font-mono font-semibold" style={{ color: cfg.colors.primary }}>{formatNaira(walletBalance)}</span></span>} />

      {message && (
        <FadeIn>
          <div className="mb-6 rounded-xl px-4 py-3 text-[13px] font-medium" style={{ backgroundColor: message.type === "success" ? "#ECFDF5" : "#FEF2F2", color: message.type === "success" ? "#059669" : "#DC2626", border: `1px solid ${message.type === "success" ? "#A7F3D0" : "#FECACA"}` }}>
            {message.text}
          </div>
        </FadeIn>
      )}

      <StaggerChildren staggerDelay={100} className="mb-8 grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-6">
        <StatCard label="Total Invested" value={formatNaira(circlesStats.totalInvested)} change={`${myAccounts.length} account${myAccounts.length !== 1 ? "s" : ""}`} positive variant="default" />
        <StatCard label="Interest Earned" value={formatNaira(circlesStats.totalInterest)} change={activeAccounts.length > 0 ? `${activeAccounts.length} earning` : "No active accounts"} positive variant="warm" />
        <StatCard label="Active Accounts" value={String(circlesStats.activeCount)} change={maturedAccounts.length > 0 ? `${circlesStats.maturedCount} matured` : "None matured"} positive variant="default" />
      </StaggerChildren>

      <div className="mb-6 flex gap-2">
        <button onClick={() => setActiveTab("calculator")}
          className="cursor-pointer rounded-full border-[1.5px] px-5 py-2 text-[12px] font-semibold transition-all duration-150"
          style={{ backgroundColor: activeTab === "calculator" ? cfg.colors.primary : "#ffffff", color: activeTab === "calculator" ? "#ffffff" : "#717171", borderColor: activeTab === "calculator" ? cfg.colors.primary : "#EAEAEA" }}>
          Calculator
        </button>
        <button onClick={() => setActiveTab("accounts")}
          className="cursor-pointer rounded-full border-[1.5px] px-5 py-2 text-[12px] font-semibold transition-all duration-150"
          style={{ backgroundColor: activeTab === "accounts" ? cfg.colors.primary : "#ffffff", color: activeTab === "accounts" ? "#ffffff" : "#717171", borderColor: activeTab === "accounts" ? cfg.colors.primary : "#EAEAEA" }}>
          My Accounts ({myAccounts.length})
        </button>
      </div>

      {activeTab === "calculator" && (
        <>
          <FadeInUp delay={200} className="mb-8">
            <CircleCalculator circleAmount={circles[0]?.amount || 10000} annualRate={circles[0]?.interestRateAnnual || 10} circles={circles.map((c) => ({ id: c.id, name: c.name, amount: c.amount, durationMonths: c.durationMonths, interestRateAnnual: c.interestRateAnnual }))} onSelectConfig={(amount, _duration, accounts, circleId) => {
              const target = circles.find((c) => c.id === circleId) || circles.find((c) => c.amount === amount) || circles[0];
              if (target) {
                const maxPer = target.maxAccountsPerUser > 0 ? target.maxAccountsPerUser : accounts;
                setAccountCount(Math.max(1, Math.min(accounts, maxPer)));
                setOpenModalCircle(target);
              }
            }} />
          </FadeInUp>

          {circles.length > 0 && (
            <FadeInUp delay={300}>
              <Card padding="1.5rem">
                <ColorfulBadge label="Available Circles" color={cfg.colors.primary} />
                <h2 className="mt-2 mb-4 text-[1.125rem] font-medium text-brand-dark">Open a Circle Account</h2>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
                  {circles.map((circle) => {
                    const userAccounts = myAccounts.filter((a) => a.circleId === circle.id && a.status === "active").length;
                    const maxPerUser = circle.maxAccountsPerUser > 0 ? circle.maxAccountsPerUser : Infinity;
                    const canOpen = userAccounts < maxPerUser;
                    return (
                      <div key={circle.id} className="rounded-xl border border-gray-100 bg-gray-50 p-5 transition-all duration-200">
                        <div className="mb-3 flex items-start justify-between">
                          <div>
                            <h3 className="mb-1 text-[14px] font-semibold text-brand-dark">{circle.name}</h3>
                            {circle.description && <p className="mb-2 text-[11px] text-gray-400">{circle.description}</p>}
                          </div>
                          <span className="rounded-[0.375rem] px-2 py-0.5 text-[9px] font-bold uppercase font-mono"
                            style={{ backgroundColor: circle.cycleType === "weekly_contribution" ? "#EFF6FF" : "#F5F3FF", color: circle.cycleType === "weekly_contribution" ? "#2563EB" : "#7C3AED" }}>
                            {circle.cycleType === "weekly_contribution" ? "Weekly" : "Deposit"}
                          </span>
                        </div>
                        <div className="mb-4 grid grid-cols-2 gap-2 text-[12px]">
                          {circle.cycleType === "weekly_contribution" ? (
                            <div><span className="text-gray-400">Weekly</span><br /><span className="font-mono font-semibold text-brand-dark">{formatNaira(circle.weeklyAmount || 0)} × {circle.totalWeeks || 0}</span></div>
                          ) : (
                            <div><span className="text-gray-400">Amount</span><br /><span className="font-mono font-semibold text-brand-dark">{formatNaira(circle.amount)}</span></div>
                          )}
                          <div><span className="text-gray-400">Duration</span><br /><span className="font-semibold text-brand-dark">{formatDuration(circle.durationMonths)}</span></div>
                          <div><span className="text-gray-400">Interest Rate</span><br /><span className="font-semibold text-brand-dark">{circle.interestRateAnnual}% p.a.</span></div>
                          <div><span className="text-gray-400">Your Accounts</span><br /><span className="font-semibold text-brand-dark">{userAccounts}{circle.maxAccountsPerUser > 0 ? `/${circle.maxAccountsPerUser}` : ""}</span></div>
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
            <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-6">{Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}</div>
          ) : myAccounts.length === 0 ? (
            <FadeInUp delay={200}>
              <Card padding="3rem">
                <div className="text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-[20px]">&#8358;</div>
                  <h3 className="mb-2 text-[1rem] font-semibold text-brand-dark">No circle accounts yet</h3>
                  <p className="mb-4 text-[13px] text-gray-500">Open a circle account to start earning weekly interest.</p>
                  <Button variant="primary" size="sm" onClick={() => setActiveTab("calculator")}>Browse Circles</Button>
                </div>
              </Card>
            </FadeInUp>
          ) : (
            <FadeInUp delay={200}>
              <Card padding="1.5rem">
                <ColorfulBadge label="My Accounts" color={cfg.colors.primary} />
                <h2 className="mt-2 mb-4 text-[1.125rem] font-medium text-brand-dark">Your Circle Accounts ({myAccounts.length})</h2>
                <div className="flex flex-col gap-3">
                  {myAccounts.map((account) => (
                    <div key={account.id} className="rounded-xl border border-gray-100 p-4 transition-all duration-200" style={{ backgroundColor: expandedAccount === account.id ? "#FAF9F5" : "#ffffff" }}>
                      <div className="flex flex-wrap items-center justify-between gap-3" onClick={() => setExpandedAccount(expandedAccount === account.id ? null : account.id)}>
                        <div className="flex items-center gap-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl font-mono text-[11px] font-bold bg-gray-100" style={{ color: cfg.colors.primary }}>{formatNaira(account.principalAmount).split(" ")[0]}</div>
                          <div>
                            <span className="block font-mono text-[14px] font-semibold text-brand-dark">{account.circle.name}</span>
                            <span className="text-[11px] text-gray-400">{formatNaira(account.principalAmount)} &middot; {account.circle.interestRateAnnual}% p.a. &middot; {formatDuration(account.circle.durationMonths)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {account.status === "active" && (
                            <span className="font-mono text-[10px] text-[#666]">{daysUntil(account.maturityDate)}d left</span>
                          )}
                          <span className="rounded-[0.375rem] px-2 py-0.5 text-[9px] font-bold uppercase font-mono" style={{ color: ACCOUNT_STATUS_COLORS[account.status], backgroundColor: `${ACCOUNT_STATUS_COLORS[account.status]}12` }}>{account.status.replace("_", " ")}</span>
                        </div>
                      </div>

                      {expandedAccount === account.id && (
                        <div className="mt-4 border-t border-gray-100 pt-4">
                          <div className="mb-4 grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-4 text-[12px]">
                            <div><span className="mb-1 block text-gray-400">Principal</span><span className="font-mono font-semibold" style={{ color: cfg.colors.primary }}>{formatNaira(account.principalAmount)}</span></div>
                            <div><span className="mb-1 block text-gray-400">Interest Earned</span><span className="font-mono font-semibold text-emerald-500">{formatNaira(account.interestEarned)}</span></div>
                            <div><span className="mb-1 block text-gray-400">Maturity Payout</span><span className="font-mono font-semibold text-brand-dark">{formatNaira(account.principalAmount + account.interestEarned)}</span></div>
                            <div><span className="mb-1 block text-gray-400">Start Date</span><span className="font-medium text-brand-dark">{formatDate(account.startDate)}</span></div>
                            <div><span className="mb-1 block text-gray-400">Maturity Date</span><span className="font-medium text-brand-dark">{formatDate(account.maturityDate)}</span></div>
                            {account.lastInterestCalculation && (
                              <div><span className="mb-1 block text-gray-400">Last Interest</span><span className="font-medium text-brand-dark">{formatDate(account.lastInterestCalculation)}</span></div>
                            )}
                            {account.circle.cycleType === "weekly_contribution" && (
                              <>
                                <div><span className="mb-1 block text-gray-400">Weeks Paid</span><span className="font-mono font-semibold text-emerald-600">{account.weeksContributed ?? 0}/{account.circle.totalWeeks ?? 0}</span></div>
                                <div><span className="mb-1 block text-gray-400">Weeks Defaulted</span><span className="font-mono font-semibold" style={{ color: (account.weeksDefaulted ?? 0) > 0 ? "#DC2626" : "#6B7280" }}>{account.weeksDefaulted ?? 0}</span></div>
                              </>
                            )}
                          </div>
                           {account.circle.cycleType === "weekly_contribution" && (account.weeksDefaulted ?? 0) > 0 && (
                             <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-[11px] text-red-700">
                               You have {account.weeksDefaulted} missed contribution(s). Resolve them on the <a href="/my-defaults" className="font-semibold underline">My Defaults</a> page ({formatClearanceLabel(account.circle.defaultPenaltyType, account.circle.defaultPenaltyValue)} clearance applies).
                             </div>
                           )}

                           <div className="flex flex-wrap gap-2">
                             {(() => {
                               const hasOutstandingDefaults = (account.weeksDefaulted ?? 0) > 0 && account.circle.blockPayoutOnDefault !== false;
                               return (
                                 <>
                                   {account.status === "active" && (
                                     <>
                                       <Button variant="primary" size="sm" disabled={claiming === account.id || daysUntil(account.maturityDate) > 0 || hasOutstandingDefaults} onClick={() => handleClaim(account.id)}>
                                         {claiming === account.id ? "Processing..." : daysUntil(account.maturityDate) > 0 ? `Matures in ${daysUntil(account.maturityDate)}d` : hasOutstandingDefaults ? "Clear Defaults First" : isAutoPayout(account.circle) ? "Claim Maturity" : "Request Payout"}
                                       </Button>
                                       <Button variant="secondary" size="sm" disabled={withdrawing === account.id} onClick={() => handleWithdraw(account.id)}>
                                         {withdrawing === account.id ? "Withdrawing..." : "Early Withdraw (Forfeit Interest)"}
                                       </Button>
                                     </>
                                   )}
                                   {account.status === "matured" && (
                                     <Button variant="primary" size="sm" disabled={claiming === account.id || hasOutstandingDefaults} onClick={() => handleClaim(account.id)}>
                                       {claiming === account.id ? "Processing..." : hasOutstandingDefaults ? "Clear Defaults First" : isAutoPayout(account.circle) ? "Claim Maturity Payout" : "Request Payout"}
                                     </Button>
                                   )}
                                 </>
                               );
                             })()}
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
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 p-4" onClick={() => setOpenModalCircle(null)}>
          <div className="w-full max-w-[400px] cursor-default rounded-2xl bg-white p-8 shadow-[0_20px_60px_rgba(0,0,0,0.15)]" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-2 text-[16px] font-semibold text-brand-dark">Open Circle Account</h3>
            <p className="mb-6 text-[13px] text-gray-500">
              How many <strong>{openModalCircle.name}</strong> accounts would you like to open?
            </p>
            <div className="mb-4 flex items-center gap-3">
              <button
                onClick={() => setAccountCount((c) => Math.max(1, c - 1))}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-[16px] font-semibold cursor-pointer"
              >-</button>
              <input
                type="number"
                min={1}
                max={openModalCircle.maxAccountsPerUser > 0 ? Math.max(1, openModalCircle.maxAccountsPerUser - (myAccounts.filter((a) => a.circleId === openModalCircle.id && a.status === "active").length)) : undefined}
                value={accountCount}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  const cap = openModalCircle.maxAccountsPerUser > 0
                    ? openModalCircle.maxAccountsPerUser - (myAccounts.filter((a) => a.circleId === openModalCircle.id && a.status === "active").length)
                    : Infinity;
                  if (!isNaN(v) && v >= 1) setAccountCount(Math.min(v, cap));
                }}
                className="h-9 w-[60px] rounded-lg border border-gray-200 text-center font-mono text-[14px] font-semibold outline-none"
              />
              <button
                onClick={() => {
                  const cap = openModalCircle.maxAccountsPerUser > 0
                    ? openModalCircle.maxAccountsPerUser - (myAccounts.filter((a) => a.circleId === openModalCircle.id && a.status === "active").length)
                    : Infinity;
                  setAccountCount((c) => Math.min(cap, c + 1));
                }}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-[16px] font-semibold cursor-pointer"
              >+</button>
            </div>
            <div className="mb-6 rounded-xl bg-gray-50 p-4 text-[12px]">
              {openModalCircle.cycleType === "weekly_contribution" && (
                <div className="mb-2 rounded-lg bg-blue-50 px-3 py-2 text-[11px] text-blue-700">
                  Weekly cycle: only the first {formatNaira(openModalCircle.weeklyAmount || 0)} is debited now. Subsequent weeks auto-debit from your wallet.
                </div>
              )}
              <div className="mb-2 flex justify-between">
                <span className="text-gray-500">{openModalCircle.cycleType === "weekly_contribution" ? "First debit / account" : "Cost per account"}</span>
                <span className="font-mono font-semibold">{formatNaira(circleOpenCost(openModalCircle))}</span>
              </div>
              <div className="mb-2 flex justify-between">
                <span className="text-gray-500">Total charged now</span>
                <span className="font-mono font-bold" style={{ color: cfg.colors.primary }}>{formatNaira(circleOpenCost(openModalCircle) * accountCount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Your wallet</span>
                <span className="font-mono font-semibold" style={{ color: walletBalance >= circleOpenCost(openModalCircle) * accountCount ? "#059669" : "#DC2626" }}>{formatNaira(walletBalance)}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setOpenModalCircle(null)} className="flex-1 cursor-pointer rounded-lg border border-gray-200 bg-white px-2.5 py-2.5 text-[13px] font-medium">Cancel</button>
              <button
                disabled={openingCircle === openModalCircle.id || walletBalance < circleOpenCost(openModalCircle) * accountCount}
                onClick={() => { handleOpenAccount(openModalCircle.id, accountCount); }}
                className="flex-1 cursor-pointer rounded-lg border-0 px-2.5 py-2.5 text-[13px] font-semibold text-white"
                style={{ backgroundColor: cfg.colors.primary, opacity: (openingCircle === openModalCircle.id || walletBalance < circleOpenCost(openModalCircle) * accountCount) ? 0.5 : 1 }}
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
