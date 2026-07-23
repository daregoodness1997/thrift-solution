"use client";

import { useState, useEffect, useCallback } from "react";
import confetti from "canvas-confetti";
import { config, BrandConfig } from "@thrift/config";
import { Card, Button, FadeIn, FadeInUp, StaggerChildren, StatCard } from "@thrift/ui";
import { formatNaira } from "@thrift/utils";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/PageHeader";
import { Skeleton, SkeletonCard } from "@/components/Skeleton";
import { CircleCalculator } from "@/components/CircleCalculator";
import Pagination from "@/components/Pagination";
import {
  PiggyBank,
  Wallet,
  TrendingUp,
  CheckCircle2,
  X,
  ArrowRight,
  Calendar,
  Clock,
  Layers,
  ShieldCheck,
  Percent,
  Users,
  Gift,
} from "lucide-react";

const fallback = config;

interface Circle {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
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
  addons?: { id: string; name: string; description?: string; imageUrl?: string; estimatedCost: number }[];
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

const CARD_THEMES = [
  { gradient: "from-rose-500 to-pink-500", bg: "bg-rose-50", darkBg: "dark:bg-rose-950/30", border: "border-rose-300 dark:border-rose-800", text: "text-rose-600", accent: "#F43F5E", hoverShadow: "hover:shadow-rose-200/60 dark:hover:shadow-rose-900/30", badgeBg: "bg-rose-100 dark:bg-rose-950/60", badgeText: "text-rose-700 dark:text-rose-300", statBg: "bg-rose-50/80 dark:bg-rose-950/20", statBorder: "border-l-rose-400" },
  { gradient: "from-violet-500 to-purple-500", bg: "bg-violet-50", darkBg: "dark:bg-violet-950/30", border: "border-violet-300 dark:border-violet-800", text: "text-violet-600", accent: "#8B5CF6", hoverShadow: "hover:shadow-violet-200/60 dark:hover:shadow-violet-900/30", badgeBg: "bg-violet-100 dark:bg-violet-950/60", badgeText: "text-violet-700 dark:text-violet-300", statBg: "bg-violet-50/80 dark:bg-violet-950/20", statBorder: "border-l-violet-400" },
  { gradient: "from-emerald-500 to-teal-500", bg: "bg-emerald-50", darkBg: "dark:bg-emerald-950/30", border: "border-emerald-300 dark:border-emerald-800", text: "text-emerald-600", accent: "#10B981", hoverShadow: "hover:shadow-emerald-200/60 dark:hover:shadow-emerald-900/30", badgeBg: "bg-emerald-100 dark:bg-emerald-950/60", badgeText: "text-emerald-700 dark:text-emerald-300", statBg: "bg-emerald-50/80 dark:bg-emerald-950/20", statBorder: "border-l-emerald-400" },
  { gradient: "from-amber-500 to-orange-500", bg: "bg-amber-50", darkBg: "dark:bg-amber-950/30", border: "border-amber-300 dark:border-amber-800", text: "text-amber-600", accent: "#F59E0B", hoverShadow: "hover:shadow-amber-200/60 dark:hover:shadow-amber-900/30", badgeBg: "bg-amber-100 dark:bg-amber-950/60", badgeText: "text-amber-700 dark:text-amber-300", statBg: "bg-amber-50/80 dark:bg-amber-950/20", statBorder: "border-l-amber-400" },
];

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
  const [toast, setToast] = useState<string | null>(null);
  const [openModalCircle, setOpenModalCircle] = useState<Circle | null>(null);
  const [viewBenefitsCircle, setViewBenefitsCircle] = useState<Circle | null>(null);
  const [accountCount, setAccountCount] = useState(1);
  const [page, setPage] = useState(1);
  const LIMIT = 20;
  const [accountsData, setAccountsData] = useState<{ total: number; totalPages: number }>({ total: 0, totalPages: 1 });
  const [circlesStats, setCirclesStats] = useState({ activeCount: 0, maturedCount: 0, totalInvested: 0, totalInterest: 0 });

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

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
        confetti({ particleCount: 110, spread: 85, origin: { y: 0.6 } });
        triggerToast(`Opened ${opened} circle account${opened > 1 ? "s" : ""} successfully!`);
        setWalletBalance(data.data.walletBalance);
        setOpenModalCircle(null);
        fetchData();
      } else {
        triggerToast(data.error || "Failed to open account");
      }
    } catch {
      triggerToast("Failed to open circle account");
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
        triggerToast("Early withdrawal completed. Principal returned to wallet.");
        setWalletBalance(data.data.walletBalance);
        fetchData();
      } else {
        triggerToast(data.error || "Failed to withdraw");
      }
    } catch {
      triggerToast("Failed to withdraw from circle account");
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
          triggerToast("Payout request submitted. Waiting for admin approval.");
        } else {
          confetti({ particleCount: 110, spread: 85, origin: { y: 0.6 } });
          triggerToast("Maturity payout credited to wallet!");
          setWalletBalance(data.data.walletBalance);
        }
        fetchData();
      } else {
        triggerToast(data.error || "Failed to claim maturity");
      }
    } catch {
      triggerToast("Failed to claim matured account");
    }
    setClaiming(null);
  };

  const activeAccounts = myAccounts.filter((a) => a.status === "active");
  const maturedAccounts = myAccounts.filter((a) => a.status === "matured");

  return (
    <div className="mx-auto max-w-[1280px] p-[clamp(1rem,3vw,2rem)] space-y-8">
      <PageHeader badgeLabel="Savings" heading="Circle" accentText="Accounts" description="Fixed-term savings with weekly interest. Earn more by locking your funds."
        right={<span className="text-[12px] text-slate-500 dark:text-slate-400">Wallet: <span className="font-mono font-semibold" style={{ color: "#2563EB" }}>{formatNaira(walletBalance)}</span></span>} />

      {/* Color-coded Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Invested" value={formatNaira(circlesStats.totalInvested)} change={`${myAccounts.length} account${myAccounts.length !== 1 ? "s" : ""}`} icon={<PiggyBank className="w-4 h-4" />} color="rose" />
        <StatCard label="Interest Earned" value={formatNaira(circlesStats.totalInterest)} change={activeAccounts.length > 0 ? `${activeAccounts.length} earning` : "No active accounts"} icon={<TrendingUp className="w-4 h-4" />} color="emerald" />
        <StatCard label="Active Accounts" value={String(circlesStats.activeCount)} change={maturedAccounts.length > 0 ? `${circlesStats.maturedCount} matured` : "None matured"} icon={<Layers className="w-4 h-4" />} color="blue" />
        <StatCard label="Wallet Balance" value={formatNaira(walletBalance)} change="Available funds" icon={<Wallet className="w-4 h-4" />} color="amber" />
      </div>

      {/* Tab Buttons */}
      <div className="flex gap-2">
        <button onClick={() => setActiveTab("calculator")}
          className={`px-5 py-3 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 border ${
            activeTab === "calculator" ? 'bg-rose-600 border-rose-600 text-white shadow-md' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-rose-400'
          }`}>
          <PiggyBank className="w-3.5 h-3.5" />
          Calculator
        </button>
        <button onClick={() => setActiveTab("accounts")}
          className={`px-5 py-3 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 border ${
            activeTab === "accounts" ? 'bg-rose-600 border-rose-600 text-white shadow-md' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-rose-400'
          }`}>
          <Layers className="w-3.5 h-3.5" />
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
              <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-6">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1">
                    <PiggyBank className="w-3.5 h-3.5 text-rose-500" />
                    <span>Available Circles</span>
                  </span>
                </div>
                <h3 className="font-display font-bold text-xl sm:text-2xl text-slate-900 dark:text-white mt-1">Open a Circle Account</h3>
                <div className="mt-6 grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-6">
                  {circles.map((circle, idx) => {
                    const theme = CARD_THEMES[idx % CARD_THEMES.length];
                    const userAccounts = myAccounts.filter((a) => a.circleId === circle.id && a.status === "active").length;
                    const maxPerUser = circle.maxAccountsPerUser > 0 ? circle.maxAccountsPerUser : Infinity;
                    const canOpen = userAccounts < maxPerUser;
                    return (
                      <div key={circle.id} className={`rounded-2xl border-l-4 ${theme.border} border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-800/80 overflow-hidden transition-all duration-300 hover:shadow-xl ${theme.hoverShadow} hover:-translate-y-1`}>
                        {/* Colorful Banner */}
                        <div className="relative h-36 w-full overflow-hidden">
                          {circle.imageUrl ? (
                            <>
                              <img src={circle.imageUrl} alt={circle.name} className="h-full w-full object-cover" />
                              <div className={`absolute inset-0 bg-gradient-to-t ${theme.gradient} opacity-40`} />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                            </>
                          ) : (
                            <div className={`h-full w-full bg-gradient-to-br ${theme.gradient} relative`}>
                              <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 200 200">
                                <circle cx="100" cy="100" r="80" fill="none" stroke="white" strokeWidth="2" />
                                <circle cx="100" cy="100" r="55" fill="none" stroke="white" strokeWidth="1.5" />
                                <circle cx="100" cy="100" r="30" fill="none" stroke="white" strokeWidth="1" />
                                <circle cx="100" cy="100" r="10" fill="white" opacity="0.3" />
                              </svg>
                            </div>
                          )}
                          {/* Interest Rate Badge */}
                          <div className="absolute top-3 right-3 px-3 py-1.5 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm shadow-lg">
                            <span className={`text-[13px] font-mono font-bold ${theme.text}`}>{circle.interestRateAnnual}%</span>
                            <span className="text-[9px] text-slate-500 block leading-none">p.a.</span>
                          </div>
                          {/* Cycle Type Badge */}
                          <div className="absolute top-3 left-3">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider ${theme.badgeBg} ${theme.badgeText} backdrop-blur-sm`}>
                              {circle.cycleType === "weekly_contribution" ? <Clock className="w-3 h-3" /> : <Layers className="w-3 h-3" />}
                              {circle.cycleType === "weekly_contribution" ? "Weekly" : "Deposit"}
                            </span>
                          </div>
                          {/* Circle Name overlay */}
                          <div className="absolute bottom-3 left-4 right-4">
                            <h3 className="text-[16px] font-bold text-white drop-shadow-md">{circle.name}</h3>
                            {circle.description && <p className="text-[11px] text-white/80 drop-shadow line-clamp-1">{circle.description}</p>}
                          </div>
                        </div>

                        {/* Card Body */}
                        <div className="p-4">
                          {/* Stat Pills */}
                          <div className="mb-3 grid grid-cols-2 gap-2">
                            <div className={`flex items-center gap-2 rounded-xl border-l-2 ${theme.statBorder} ${theme.statBg} px-3 py-2`}>
                              <div className={`w-7 h-7 rounded-lg ${theme.badgeBg} flex items-center justify-center`}>
                                {circle.cycleType === "weekly_contribution" ? (
                                  <Clock className={`w-3.5 h-3.5 ${theme.text}`} />
                                ) : (
                                  <Wallet className={`w-3.5 h-3.5 ${theme.text}`} />
                                )}
                              </div>
                              <div>
                                <span className="block text-[9px] text-slate-400 uppercase tracking-wider font-medium leading-none mb-0.5">
                                  {circle.cycleType === "weekly_contribution" ? "Weekly" : "Amount"}
                                </span>
                                <span className="font-mono text-[12px] font-bold text-slate-900 dark:text-white leading-none">
                                  {circle.cycleType === "weekly_contribution" ? formatNaira(circle.weeklyAmount || 0) : formatNaira(circle.amount)}
                                </span>
                              </div>
                            </div>
                            <div className={`flex items-center gap-2 rounded-xl border-l-2 ${theme.statBorder} ${theme.statBg} px-3 py-2`}>
                              <div className={`w-7 h-7 rounded-lg ${theme.badgeBg} flex items-center justify-center`}>
                                <Calendar className={`w-3.5 h-3.5 ${theme.text}`} />
                              </div>
                              <div>
                                <span className="block text-[9px] text-slate-400 uppercase tracking-wider font-medium leading-none mb-0.5">Duration</span>
                                <span className="text-[12px] font-bold text-slate-900 dark:text-white leading-none">{formatDuration(circle.durationMonths)}</span>
                              </div>
                            </div>
                            {circle.cycleType === "weekly_contribution" && circle.totalWeeks && (
                              <div className={`flex items-center gap-2 rounded-xl border-l-2 ${theme.statBorder} ${theme.statBg} px-3 py-2`}>
                                <div className={`w-7 h-7 rounded-lg ${theme.badgeBg} flex items-center justify-center`}>
                                  <Layers className={`w-3.5 h-3.5 ${theme.text}`} />
                                </div>
                                <div>
                                  <span className="block text-[9px] text-slate-400 uppercase tracking-wider font-medium leading-none mb-0.5">Total Weeks</span>
                                  <span className="text-[12px] font-bold text-slate-900 dark:text-white leading-none">{circle.totalWeeks}</span>
                                </div>
                              </div>
                            )}
                            <div className={`flex items-center gap-2 rounded-xl border-l-2 ${theme.statBorder} ${theme.statBg} px-3 py-2`}>
                              <div className={`w-7 h-7 rounded-lg ${theme.badgeBg} flex items-center justify-center`}>
                                <Percent className={`w-3.5 h-3.5 ${theme.text}`} />
                              </div>
                              <div>
                                <span className="block text-[9px] text-slate-400 uppercase tracking-wider font-medium leading-none mb-0.5">Your Accts</span>
                                <span className="text-[12px] font-bold text-slate-900 dark:text-white leading-none">
                                  {userAccounts}{circle.maxAccountsPerUser > 0 ? `/${circle.maxAccountsPerUser}` : ""}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Subscribers + Interest Summary */}
                          <div className="mb-4 flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <Users className="w-3 h-3 text-slate-400" />
                              <span className="text-[11px] text-slate-400">{circle._count?.accounts || 0} subscribers</span>
                            </div>
                            <span className={`text-[11px] font-mono font-bold ${theme.text}`}>
                              {circle.cycleType === "weekly_contribution" ? `${formatNaira(circle.weeklyAmount || 0)} × ${circle.totalWeeks || 0}w` : formatNaira(circle.amount)}
                            </span>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-2">
                            <Button variant="secondary" size="sm" className="btn-secondary flex-1" onClick={() => setViewBenefitsCircle(circle)}>
                              View Benefits
                            </Button>
                            <Button variant="primary" size="sm" className={`btn-primary flex-1 py-2.5 px-4 text-xs bg-gradient-to-r ${theme.gradient} hover:opacity-90 text-white border-0`} disabled={!canOpen || openingCircle === circle.id} onClick={() => { setOpenModalCircle(circle); setAccountCount(1); }}>
                              {openingCircle === circle.id ? "Opening..." : canOpen ? "Open Account" : "Max Reached"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
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
              <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-12">
                <div className="text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 dark:bg-rose-950/40">
                    <PiggyBank className="w-7 h-7 text-rose-500" />
                  </div>
                  <h3 className="mb-2 font-display text-lg font-bold text-slate-900 dark:text-white">No circle accounts yet</h3>
                  <p className="mb-4 text-[13px] text-slate-500 dark:text-slate-400">Open a circle account to start earning weekly interest.</p>
                  <Button variant="primary" size="sm" className="btn-primary py-2.5 px-4 text-xs bg-rose-600 hover:bg-rose-700" onClick={() => setActiveTab("calculator")}>Browse Circles</Button>
                </div>
              </div>
            </FadeInUp>
          ) : (
            <FadeInUp delay={200}>
              <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-6">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-rose-500" />
                    <span>My Accounts</span>
                  </span>
                </div>
                <h3 className="font-display font-bold text-xl sm:text-2xl text-slate-900 dark:text-white mt-1">Your Circle Accounts ({myAccounts.length})</h3>
                <div className="mt-6 flex flex-col gap-3">
                  {myAccounts.map((account) => (
                    <div key={account.id} className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-4 transition-all duration-200" style={{ backgroundColor: expandedAccount === account.id ? "#FFF7ED" : "#ffffff" }}>
                      <div className="flex flex-wrap items-center justify-between gap-3 cursor-pointer" onClick={() => setExpandedAccount(expandedAccount === account.id ? null : account.id)}>
                        <div className="flex items-center gap-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl font-mono text-[11px] font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-600">{formatNaira(account.principalAmount).split(" ")[0]}</div>
                          <div>
                            <span className="block font-mono text-[14px] font-semibold text-slate-900 dark:text-white">{account.circle.name}</span>
                            <span className="text-[11px] text-slate-400">{formatNaira(account.principalAmount)} &middot; {account.circle.interestRateAnnual}% p.a. &middot; {formatDuration(account.circle.durationMonths)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {account.status === "active" && (
                            <span className="font-mono text-[10px] text-slate-500">{daysUntil(account.maturityDate)}d left</span>
                          )}
                          <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider"
                            style={{ color: ACCOUNT_STATUS_COLORS[account.status], backgroundColor: `${ACCOUNT_STATUS_COLORS[account.status]}15` }}>
                            {account.status.replace("_", " ")}
                          </span>
                        </div>
                      </div>

                      {expandedAccount === account.id && (
                        <div className="mt-4 border-t border-slate-200/80 dark:border-slate-800/80 pt-4">
                          {/* Progress Bar */}
                          {account.circle.cycleType === "weekly_contribution" && account.circle.totalWeeks && (
                            <div className="mb-4">
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Weeks Progress</span>
                                <span className="font-mono text-[11px] font-bold text-rose-600">{account.weeksContributed ?? 0}/{account.circle.totalWeeks}</span>
                              </div>
                              <div className="h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                <div className="h-full rounded-full bg-gradient-to-r from-rose-500 to-amber-500 transition-[width] duration-1000"
                                  style={{ width: `${Math.min(100, ((account.weeksContributed ?? 0) / account.circle.totalWeeks) * 100)}%` }} />
                              </div>
                            </div>
                          )}
                          <div className="mb-4 grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-4 text-[12px]">
                            <div><span className="mb-1 block text-slate-400">Principal</span><span className="font-mono font-semibold text-rose-600">{formatNaira(account.principalAmount)}</span></div>
                            <div><span className="mb-1 block text-slate-400">Interest Earned</span><span className="font-mono font-semibold text-emerald-500">{formatNaira(account.interestEarned)}</span></div>
                            <div><span className="mb-1 block text-slate-400">Maturity Payout</span><span className="font-mono font-semibold text-slate-900 dark:text-white">{formatNaira(account.principalAmount + account.interestEarned)}</span></div>
                            <div><span className="mb-1 block text-slate-400">Start Date</span><span className="font-medium text-slate-900 dark:text-white">{formatDate(account.startDate)}</span></div>
                            <div><span className="mb-1 block text-slate-400">Maturity Date</span><span className="font-medium text-slate-900 dark:text-white">{formatDate(account.maturityDate)}</span></div>
                            {account.lastInterestCalculation && (
                              <div><span className="mb-1 block text-slate-400">Last Interest</span><span className="font-medium text-slate-900 dark:text-white">{formatDate(account.lastInterestCalculation)}</span></div>
                            )}
                            {account.circle.cycleType === "weekly_contribution" && (
                              <>
                                <div><span className="mb-1 block text-slate-400">Weeks Paid</span><span className="font-mono font-semibold text-emerald-600">{account.weeksContributed ?? 0}/{account.circle.totalWeeks ?? 0}</span></div>
                                <div><span className="mb-1 block text-slate-400">Weeks Defaulted</span><span className="font-mono font-semibold" style={{ color: (account.weeksDefaulted ?? 0) > 0 ? "#DC2626" : "#6B7280" }}>{account.weeksDefaulted ?? 0}</span></div>
                              </>
                            )}
                          </div>
                           {account.circle.cycleType === "weekly_contribution" && (account.weeksDefaulted ?? 0) > 0 && (
                             <div className="mb-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 px-4 py-3 text-[11px] text-red-700 dark:text-red-300">
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
                                       <Button variant="primary" size="sm" className="btn-primary py-2.5 px-4 text-xs bg-rose-600 hover:bg-rose-700" disabled={claiming === account.id || daysUntil(account.maturityDate) > 0 || hasOutstandingDefaults} onClick={() => handleClaim(account.id)}>
                                         {claiming === account.id ? "Processing..." : daysUntil(account.maturityDate) > 0 ? `Matures in ${daysUntil(account.maturityDate)}d` : hasOutstandingDefaults ? "Clear Defaults First" : isAutoPayout(account.circle) ? "Claim Maturity" : "Request Payout"}
                                       </Button>
                                       <Button variant="secondary" size="sm" className="btn-secondary" disabled={withdrawing === account.id} onClick={() => handleWithdraw(account.id)}>
                                         {withdrawing === account.id ? "Withdrawing..." : "Early Withdraw (Forfeit Interest)"}
                                       </Button>
                                     </>
                                   )}
                                   {account.status === "matured" && (
                                     <Button variant="primary" size="sm" className="btn-primary py-2.5 px-4 text-xs bg-rose-600 hover:bg-rose-700" disabled={claiming === account.id || hasOutstandingDefaults} onClick={() => handleClaim(account.id)}>
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
              </div>
            </FadeInUp>
          )}
        </>
      )}

      {/* Open Account Modal */}
      {openModalCircle && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/75 backdrop-blur-md p-4" onClick={() => setOpenModalCircle(null)}>
          <div className="w-full max-w-[400px] cursor-default rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setOpenModalCircle(null)} className="absolute top-5 right-5 p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer">
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-rose-500 text-white flex items-center justify-center shrink-0">
                <PiggyBank className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider font-mono">OPEN ACCOUNT</span>
                <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white">{openModalCircle.name}</h3>
              </div>
            </div>
            <p className="mb-4 text-[13px] text-slate-500 dark:text-slate-400">
              How many <strong>{openModalCircle.name}</strong> accounts would you like to open?
            </p>
            <div className="mb-4 flex items-center gap-3">
              <button
                onClick={() => setAccountCount((c) => Math.max(1, c - 1))}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-[16px] font-semibold cursor-pointer"
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
                className="h-9 w-[60px] rounded-lg border border-slate-200 dark:border-slate-700 text-center font-mono text-[14px] font-semibold outline-none"
              />
              <button
                onClick={() => {
                  const cap = openModalCircle.maxAccountsPerUser > 0
                    ? openModalCircle.maxAccountsPerUser - (myAccounts.filter((a) => a.circleId === openModalCircle.id && a.status === "active").length)
                    : Infinity;
                  setAccountCount((c) => Math.min(cap, c + 1));
                }}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-[16px] font-semibold cursor-pointer"
              >+</button>
            </div>
            <div className="mb-6 rounded-2xl bg-slate-50 dark:bg-slate-800/60 p-4 text-[12px]">
              {openModalCircle.cycleType === "weekly_contribution" && (
                <div className="mb-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 px-3 py-2 text-[11px] text-blue-700 dark:text-blue-300">
                  Weekly cycle: only the first {formatNaira(openModalCircle.weeklyAmount || 0)} is debited now. Subsequent weeks auto-debit from your wallet.
                </div>
              )}
              <div className="mb-2 flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">{openModalCircle.cycleType === "weekly_contribution" ? "First debit / account" : "Cost per account"}</span>
                <span className="font-mono font-semibold">{formatNaira(circleOpenCost(openModalCircle))}</span>
              </div>
              <div className="mb-2 flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Total charged now</span>
                <span className="font-mono font-bold text-rose-600">{formatNaira(circleOpenCost(openModalCircle) * accountCount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Your wallet</span>
                <span className="font-mono font-semibold" style={{ color: walletBalance >= circleOpenCost(openModalCircle) * accountCount ? "#059669" : "#DC2626" }}>{formatNaira(walletBalance)}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setOpenModalCircle(null)} className="flex-1 btn-secondary py-2.5 text-xs justify-center cursor-pointer">Cancel</button>
              <button
                disabled={openingCircle === openModalCircle.id || walletBalance < circleOpenCost(openModalCircle) * accountCount}
                onClick={() => { handleOpenAccount(openModalCircle.id, accountCount); }}
                className="flex-1 btn-primary py-2.5 text-xs justify-center cursor-pointer bg-rose-600 hover:bg-rose-700 text-white"
                style={{ opacity: (openingCircle === openModalCircle.id || walletBalance < circleOpenCost(openModalCircle) * accountCount) ? 0.5 : 1 }}
              >
                {openingCircle === openModalCircle.id ? "Opening..." : `Open ${accountCount > 1 ? `${accountCount} Accounts` : "Account"}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Benefits Modal */}
      {viewBenefitsCircle && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/75 backdrop-blur-md p-4" onClick={() => setViewBenefitsCircle(null)}>
          <div className="w-full max-w-[560px] cursor-default rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setViewBenefitsCircle(null)} className="absolute top-5 right-5 p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer">
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-500 text-white flex items-center justify-center shrink-0">
                <Gift className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider font-mono">CIRCLE DETAILS</span>
                <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white">{viewBenefitsCircle.name}</h3>
              </div>
            </div>

            {viewBenefitsCircle.description && <p className="mb-4 text-[12px] text-slate-500 dark:text-slate-400">{viewBenefitsCircle.description}</p>}

            {viewBenefitsCircle.imageUrl && (
              <div className="mb-4 h-40 w-full overflow-hidden rounded-2xl">
                <img src={viewBenefitsCircle.imageUrl} alt={viewBenefitsCircle.name} className="h-full w-full object-cover" />
              </div>
            )}

            <div className="mb-6 rounded-2xl bg-slate-50 dark:bg-slate-800/60 p-4 text-[12px]">
              <h4 className="mb-3 text-[13px] font-semibold text-slate-900 dark:text-white">Circle Details</h4>
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-slate-500 dark:text-slate-400">Type</span><br /><span className="font-semibold text-slate-900 dark:text-white">{viewBenefitsCircle.cycleType === "weekly_contribution" ? "Weekly Contribution" : "Fixed Deposit"}</span></div>
                <div><span className="text-slate-500 dark:text-slate-400">{viewBenefitsCircle.cycleType === "weekly_contribution" ? "Weekly Amount" : "Deposit Amount"}</span><br /><span className="font-mono font-semibold text-slate-900 dark:text-white">{formatNaira(viewBenefitsCircle.cycleType === "weekly_contribution" ? (viewBenefitsCircle.weeklyAmount || 0) : viewBenefitsCircle.amount)}</span></div>
                <div><span className="text-slate-500 dark:text-slate-400">Duration</span><br /><span className="font-semibold text-slate-900 dark:text-white">{formatDuration(viewBenefitsCircle.durationMonths)}</span></div>
                <div><span className="text-slate-500 dark:text-slate-400">Interest Rate</span><br /><span className="font-semibold text-rose-600">{viewBenefitsCircle.interestRateAnnual}% p.a.</span></div>
                <div><span className="text-slate-500 dark:text-slate-400">Max Accounts</span><br /><span className="font-semibold text-slate-900 dark:text-white">{viewBenefitsCircle.maxAccountsPerUser > 0 ? viewBenefitsCircle.maxAccountsPerUser : "Unlimited"}</span></div>
                <div><span className="text-slate-500 dark:text-slate-400">Total Subscribers</span><br /><span className="font-semibold text-slate-900 dark:text-white">{viewBenefitsCircle._count?.accounts || 0}</span></div>
                {viewBenefitsCircle.cycleType === "weekly_contribution" && (
                  <div><span className="text-slate-500 dark:text-slate-400">Total Weeks</span><br /><span className="font-semibold text-slate-900 dark:text-white">{viewBenefitsCircle.totalWeeks || 0}</span></div>
                )}
                <div><span className="text-slate-500 dark:text-slate-400">Status</span><br />
                  <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-mono font-bold uppercase tracking-wider">
                    {viewBenefitsCircle.status}
                  </span>
                </div>
              </div>
            </div>

            {(() => {
              const principal = viewBenefitsCircle.cycleType === "weekly_contribution" ? (viewBenefitsCircle.weeklyAmount || 0) : viewBenefitsCircle.amount;
              const annualRate = viewBenefitsCircle.interestRateAnnual;
              const durationMonths = viewBenefitsCircle.durationMonths;
              const totalWeeks = Math.round((durationMonths / 12) * 52);
              const weeklyInterest = Math.round((principal * (annualRate / 100) / 52) * 100) / 100;
              const totalInterest = Math.round(weeklyInterest * totalWeeks * 100) / 100;
              const maturityPayout = principal + totalInterest;

              return (
                <div className="mb-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 p-4 text-[12px]">
                  <h4 className="mb-3 text-[13px] font-semibold text-emerald-800 dark:text-emerald-300">Interest Breakdown (per account)</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div><span className="text-emerald-600 dark:text-emerald-400">Principal</span><br /><span className="font-mono font-semibold text-emerald-700 dark:text-emerald-300">{formatNaira(principal)}</span></div>
                    <div><span className="text-emerald-600 dark:text-emerald-400">Weekly Interest</span><br /><span className="font-mono font-semibold text-emerald-700 dark:text-emerald-300">{formatNaira(weeklyInterest)}</span></div>
                    <div><span className="text-emerald-600 dark:text-emerald-400">Total Interest ({totalWeeks} weeks)</span><br /><span className="font-mono font-semibold text-emerald-700 dark:text-emerald-300">{formatNaira(totalInterest)}</span></div>
                    <div><span className="text-emerald-600 dark:text-emerald-400">Maturity Payout</span><br /><span className="font-mono font-bold text-emerald-800 dark:text-emerald-200">{formatNaira(maturityPayout)}</span></div>
                  </div>
                </div>
              );
            })()}

            {viewBenefitsCircle.addons && viewBenefitsCircle.addons.length > 0 && (
              <div className="mb-6 rounded-2xl bg-slate-50 dark:bg-slate-800/60 p-4 text-[12px]">
                <h4 className="mb-3 text-[13px] font-semibold text-slate-900 dark:text-white">Add-ons</h4>
                <div className="flex flex-col gap-2">
                  {viewBenefitsCircle.addons.map((addon) => (
                    <div key={addon.id} className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 p-3">
                      {addon.imageUrl && (
                        <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg">
                          <img src={addon.imageUrl} alt={addon.name} className="h-full w-full object-cover" />
                        </div>
                      )}
                      <div className="flex-1">
                        <span className="font-semibold text-slate-900 dark:text-white">{addon.name}</span>
                        {addon.description && <p className="text-[11px] text-slate-500 dark:text-slate-400">{addon.description}</p>}
                      </div>
                      <span className="font-mono font-semibold text-rose-600">{formatNaira(addon.estimatedCost)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setViewBenefitsCircle(null)} className="flex-1 btn-secondary py-2.5 text-xs justify-center cursor-pointer">Close</button>
              <button
                onClick={() => {
                  setViewBenefitsCircle(null);
                  setOpenModalCircle(viewBenefitsCircle);
                  setAccountCount(1);
                }}
                className="flex-1 btn-primary py-2.5 text-xs justify-center cursor-pointer bg-rose-600 hover:bg-rose-700 text-white"
              >
                Open Account
              </button>
            </div>
          </div>
        </div>
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
