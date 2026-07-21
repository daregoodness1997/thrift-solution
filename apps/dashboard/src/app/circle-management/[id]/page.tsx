"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { config, BrandConfig } from "@thrift/config";
import { Card, Button, FadeInUp, StaggerChildren } from "@thrift/ui";
import { formatNaira } from "@thrift/utils";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/PageHeader";
import { SkeletonCard } from "@/components/Skeleton";
import Pagination from "@/components/Pagination";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const fallback = config;

const COLORS = ["#10b981", "#f59e0b", "#3b82f6", "#ef4444", "#8b5cf6", "#ec4899"];

interface CircleAnalytics {
  circle: {
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
    maxSubscribers?: number | null;
    autoPayout: boolean;
    payoutMode: string;
    blockPayoutOnDefault: boolean;
    status: string;
    _count?: { accounts: number };
    addons?: Array<{ id: string; name: string; estimatedCost: number }>;
  };
  stats: {
    subscribed: number;
    nearMaturity: number;
    matured: number;
    payoutPending: number;
    awaitingClearance: number;
    payoutCompleted: number;
    totalPrincipal: number;
    totalInterest: number;
    totalMaturityValue: number;
    avgPrincipal: number;
    avgInterest: number;
    earlyWithdrawn: number;
    withdrawn: number;
    totalDefaults: number;
    outstandingDefaults: number;
    clearedDefaults: number;
    totalContributions: number;
    defaultRate: number;
  };
  monthlyGrowth: Array<{ month: string; count: number; principal: number }>;
  statusDistribution: Array<{ status: string; count: number; label: string }>;
  recentAccounts: Array<{
    id: string;
    userId: string;
    principalAmount: number;
    interestEarned: number;
    status: string;
    startDate: string;
    maturityDate: string;
    user: { name: string; email: string };
  }>;
  interestLogs: Array<{ calculatedAt: string; _sum: { amount: number }; _count: number }>;
}

interface CircleAccount {
  id: string;
  userId: string;
  principalAmount: number;
  interestEarned: number;
  status: string;
  weeksContributed: number;
  weeksDefaulted: number;
  startDate: string;
  maturityDate: string;
  createdAt: string;
  user: { name: string; email: string };
}

interface InterestBreakdown {
  logs: Array<{
    id: string;
    amount: number;
    principalAtCalculation: number;
    annualRate: number;
    calculatedAt: string;
    circleAccount: {
      user: { name: string; email: string };
    };
  }>;
  totalInterest: number;
  totalLogs: number;
  avgInterestPerLog: number;
  dailyInterest: Array<{ date: string; amount: number }>;
}

function formatDuration(months: number) {
  if (months < 12) return `${months}mo`;
  const y = Math.floor(months / 12);
  const m = months % 12;
  return m > 0 ? `${y}y ${m}mo` : `${y}y`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-NG", { year: "numeric", month: "short", day: "numeric" });
}

export default function AdminCircleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const circleId = params.id as string;
  const { token } = useAuth();
  const [cfg, setCfg] = useState<BrandConfig>(fallback);
  const [analytics, setAnalytics] = useState<CircleAnalytics | null>(null);
  const [interestData, setInterestData] = useState<InterestBreakdown | null>(null);
  const [accounts, setAccounts] = useState<CircleAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "accounts" | "interest" | "payouts">("overview");
  const [accPage, setAccPage] = useState(1);
  const [accTotalPages, setAccTotalPages] = useState(1);
  const [accTotal, setAccTotal] = useState(0);
  const [accFilter, setAccFilter] = useState<string>("all");

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  const LIMIT = 15;

  useEffect(() => {
    fetch(`${API_URL}/api/config`).then((r) => r.json()).then((d) => { if (d && d.name) setCfg((p) => ({ ...p, ...d })); }).catch(() => {});
  }, [API_URL]);

  const fetchAnalytics = useCallback(async () => {
    if (!token || !circleId) return;
    try {
      const res = await fetch(`${API_URL}/api/circles/${circleId}/analytics`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setAnalytics(data.data);
    } catch {}
  }, [token, circleId, API_URL]);

  const fetchInterest = useCallback(async () => {
    if (!token || !circleId || activeTab !== "interest") return;
    try {
      const res = await fetch(`${API_URL}/api/circles/${circleId}/interest-breakdown`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setInterestData(data.data);
    } catch {}
  }, [token, circleId, API_URL, activeTab]);

  const fetchAccounts = useCallback(async () => {
    if (!token || !circleId || activeTab !== "accounts") return;
    setLoading(true);
    try {
      const statusParam = accFilter !== "all" ? `&status=${accFilter}` : "";
      const res = await fetch(`${API_URL}/api/circles/${circleId}/accounts-list?page=${accPage}&limit=${LIMIT}${statusParam}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setAccounts(data.data.items || []);
        setAccTotalPages(data.data.totalPages || 1);
        setAccTotal(data.data.total || 0);
      }
    } catch {}
    setLoading(false);
  }, [token, circleId, API_URL, accPage, accFilter, activeTab]);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);
  useEffect(() => { fetchInterest(); }, [fetchInterest]);
  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

  if (loading && !analytics) {
    return (
      <div className="mx-auto max-w-[1280px] p-[clamp(1rem,3vw,2rem)]">
        <div className="grid gap-6">{Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}</div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="mx-auto max-w-[1280px] p-[clamp(1rem,3vw,2rem)]">
        <Card padding="3rem">
          <div className="text-center">
            <h3 className="mb-2 text-[1rem] font-semibold text-brand-dark">Circle not found</h3>
            <Button variant="primary" size="sm" onClick={() => router.push("/circle-management")}>Back to Circle Management</Button>
          </div>
        </Card>
      </div>
    );
  }

  const { circle, stats, monthlyGrowth, statusDistribution, recentAccounts, interestLogs } = analytics;

  return (
    <div className="mx-auto max-w-[1280px] p-[clamp(1rem,3vw,2rem)]">
      <div className="mb-6 flex items-center gap-3">
        <button onClick={() => router.push("/circle-management")} className="flex items-center border-0 bg-none p-1 cursor-pointer text-gray-400">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      <PageHeader
        badgeLabel="Admin"
        heading={circle.name}
        accentText="Analytics"
        description="Circle performance metrics, subscriber analytics, and interest tracking."
        right={
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => router.push(`/circle-management/${circle.id}/edit`)}>
              Edit Circle
            </Button>
          </div>
        }
      />

      <div className="mb-4 flex gap-1.5">
        {([
          ["overview", "Overview"],
          ["accounts", "Accounts"],
          ["interest", "Interest"],
          ["payouts", "Payouts"],
        ] as const).map(([key, label]) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className="cursor-pointer rounded-full border-[1.5px] px-5 py-2 text-[12px] font-semibold transition-all duration-150"
            style={{ backgroundColor: activeTab === key ? cfg.colors.primary : "#ffffff", color: activeTab === key ? "#ffffff" : "#717171", borderColor: activeTab === key ? cfg.colors.primary : "#EAEAEA" }}>
            {label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <>
          <StaggerChildren staggerDelay={80} className="mb-8 grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-4">
            <Card padding="1.25rem">
              <span className="block text-[9px] font-bold uppercase tracking-[0.1em] text-gray-500">Active</span>
              <span className="mt-1 block font-mono text-2xl font-bold text-emerald-600">{stats.subscribed}</span>
            </Card>
            <Card padding="1.25rem">
              <span className="block text-[9px] font-bold uppercase tracking-[0.1em] text-gray-500">Matured</span>
              <span className="mt-1 block font-mono text-2xl font-bold text-amber-600">{stats.matured}</span>
            </Card>
            <Card padding="1.25rem">
              <span className="block text-[9px] font-bold uppercase tracking-[0.1em] text-gray-500">Withdrawn</span>
              <span className="mt-1 block font-mono text-2xl font-bold text-blue-600">{stats.withdrawn}</span>
            </Card>
            <Card padding="1.25rem">
              <span className="block text-[9px] font-bold uppercase tracking-[0.1em] text-gray-500">Early Exit</span>
              <span className="mt-1 block font-mono text-2xl font-bold text-red-600">{stats.earlyWithdrawn}</span>
            </Card>
            <Card padding="1.25rem">
              <span className="block text-[9px] font-bold uppercase tracking-[0.1em] text-gray-500">Near Maturity</span>
              <span className="mt-1 block font-mono text-2xl font-bold text-orange-600">{stats.nearMaturity}</span>
            </Card>
            <Card padding="1.25rem">
              <span className="block text-[9px] font-bold uppercase tracking-[0.1em] text-gray-500">Default Rate</span>
              <span className="mt-1 block font-mono text-2xl font-bold text-red-500">{stats.defaultRate}%</span>
            </Card>
          </StaggerChildren>

          <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <FadeInUp delay={100}>
              <Card padding="1.5rem">
                <span className="mb-4 block text-[9px] font-bold uppercase tracking-[0.1em] text-gray-500">Account Growth (6 Months)</span>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={monthlyGrowth}>
                    <defs>
                      <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={cfg.colors.primary} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={cfg.colors.primary} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v: unknown) => typeof v === "number" ? formatNaira(v) : String(v)} />
                    <Area type="monotone" dataKey="count" stroke={cfg.colors.primary} fillOpacity={1} fill="url(#colorCount)" />
                  </AreaChart>
                </ResponsiveContainer>
              </Card>
            </FadeInUp>

            <FadeInUp delay={200}>
              <Card padding="1.5rem">
                <span className="mb-4 block text-[9px] font-bold uppercase tracking-[0.1em] text-gray-500">Principal Growth (6 Months)</span>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={monthlyGrowth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `N${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v: unknown) => typeof v === "number" ? formatNaira(v) : String(v)} />
                    <Bar dataKey="principal" fill={cfg.colors.primary} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </FadeInUp>

            <FadeInUp delay={300}>
              <Card padding="1.5rem">
                <span className="mb-4 block text-[9px] font-bold uppercase tracking-[0.1em] text-gray-500">Account Status Distribution</span>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={statusDistribution.filter((d) => d.count > 0)} cx="50%" cy="50%" labelLine={false} label={(props: any) => `${props.payload.label}: ${props.payload.count}`} outerRadius={80} fill="#8884d8" dataKey="count">
                      {statusDistribution.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </FadeInUp>

            <FadeInUp delay={400}>
              <Card padding="1.5rem">
                <span className="mb-4 block text-[9px] font-bold uppercase tracking-[0.1em] text-gray-500">Financial Summary</span>
                <div className="space-y-4">
                  <div className="flex justify-between border-b border-gray-100 pb-2">
                    <span className="text-[12px] text-gray-500">Total Principal</span>
                    <span className="font-mono font-semibold" style={{ color: cfg.colors.primary }}>{formatNaira(stats.totalPrincipal)}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-100 pb-2">
                    <span className="text-[12px] text-gray-500">Total Interest</span>
                    <span className="font-mono font-semibold text-emerald-600">{formatNaira(stats.totalInterest)}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-100 pb-2">
                    <span className="text-[12px] text-gray-500">Total Maturity Value</span>
                    <span className="font-mono font-bold text-brand-dark">{formatNaira(stats.totalMaturityValue)}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-100 pb-2">
                    <span className="text-[12px] text-gray-500">Avg Principal / Account</span>
                    <span className="font-mono font-semibold text-brand-dark">{formatNaira(stats.avgPrincipal)}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-100 pb-2">
                    <span className="text-[12px] text-gray-500">Avg Interest / Account</span>
                    <span className="font-mono font-semibold text-emerald-600">{formatNaira(stats.avgInterest)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[12px] text-gray-500">Total Contributions</span>
                    <span className="font-mono font-semibold text-brand-dark">{stats.totalContributions}</span>
                  </div>
                </div>
              </Card>
            </FadeInUp>
          </div>

          <FadeInUp delay={500}>
            <Card padding="1.5rem" className="mb-8">
              <div className="mb-4 flex items-center justify-between">
                <span className="block text-[9px] font-bold uppercase tracking-[0.1em] text-gray-500">Recent Accounts</span>
                <button onClick={() => setActiveTab("accounts")} className="cursor-pointer text-[11px] font-semibold" style={{ color: cfg.colors.primary }}>View All →</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-[12px]">
                  <thead>
                    <tr className="border-b border-gray-100 font-mono text-[9px] uppercase tracking-[0.1em] text-gray-500">
                      <th className="pb-3 text-left font-semibold">Member</th>
                      <th className="pb-3 text-right font-semibold">Principal</th>
                      <th className="pb-3 text-right font-semibold">Interest</th>
                      <th className="pb-3 text-left font-semibold">Status</th>
                      <th className="pb-3 text-left font-semibold">Maturity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentAccounts.slice(0, 5).map((acc) => (
                      <tr key={acc.id} className="border-b border-gray-100">
                        <td className="py-3">
                          <div>
                            <span className="block font-semibold text-brand-dark">{acc.user.name}</span>
                            <span className="text-[10px] text-gray-400">{acc.user.email}</span>
                          </div>
                        </td>
                        <td className="py-3 text-right font-mono font-semibold">{formatNaira(acc.principalAmount)}</td>
                        <td className="py-3 text-right font-mono text-emerald-600">{formatNaira(acc.interestEarned)}</td>
                        <td className="py-3">
                          <span className="rounded-md px-2 py-0.5 font-mono text-[9px] font-bold uppercase"
                            style={{ backgroundColor: acc.status === "active" ? "#ECFDF5" : acc.status === "matured" ? "#FEF3C7" : "#F3F4F6", color: acc.status === "active" ? "#059669" : acc.status === "matured" ? "#D97706" : "#6B7280" }}>
                            {acc.status}
                          </span>
                        </td>
                        <td className="py-3 text-[11px] text-gray-500">{formatDate(acc.maturityDate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </FadeInUp>

          {circle.addons && circle.addons.length > 0 && (
            <FadeInUp delay={600}>
              <Card padding="1.5rem">
                <span className="mb-4 block text-[9px] font-bold uppercase tracking-[0.1em] text-gray-500">Maturity Rewards (Addons)</span>
                <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
                  {circle.addons.map((addon) => (
                    <div key={addon.id} className="rounded-lg border border-gray-100 p-4">
                      <span className="block text-[12px] font-semibold text-brand-dark">{addon.name}</span>
                      <span className="text-[11px] text-gray-500">Est. Cost: {formatNaira(addon.estimatedCost)}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </FadeInUp>
          )}
        </>
      )}

      {activeTab === "accounts" && (
        <FadeInUp>
          <Card padding="1.5rem">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-[14px] font-semibold text-brand-dark">All Circle Accounts ({accTotal})</h3>
              <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
                {(["all", "active", "matured", "withdrawn", "early_withdrawn"] as const).map((f) => (
                  <button key={f} onClick={() => { setAccFilter(f); setAccPage(1); }}
                    className="cursor-pointer rounded-md px-3 py-1.5 text-[11px] font-semibold capitalize"
                    style={{ backgroundColor: accFilter === f ? "#ffffff" : "transparent", color: accFilter === f ? cfg.colors.primary : "#717171", boxShadow: accFilter === f ? "0 1px 3px rgba(0,0,0,0.08)" : "none" }}>
                    {f === "all" ? "All" : f === "early_withdrawn" ? "Early Exit" : f}
                  </button>
                ))}
              </div>
            </div>

            {accounts.length === 0 ? (
              <div className="p-8 text-center text-[13px] text-gray-500">No accounts found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-[12px] min-w-[700px]">
                  <thead>
                    <tr className="border-b border-gray-100 font-mono text-[9px] uppercase tracking-[0.1em] text-gray-500">
                      <th className="pb-3 text-left font-semibold">Member</th>
                      <th className="pb-3 text-right font-semibold">Principal</th>
                      <th className="pb-3 text-right font-semibold">Interest</th>
                      <th className="pb-3 text-left font-semibold">Status</th>
                      <th className="pb-3 text-left font-semibold">Weeks Contributed</th>
                      <th className="pb-3 text-left font-semibold">Weeks Defaulted</th>
                      <th className="pb-3 text-left font-semibold">Start Date</th>
                      <th className="pb-3 text-left font-semibold">Maturity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accounts.map((acc) => (
                      <tr key={acc.id} className="border-b border-gray-100 transition-colors hover:bg-gray-50">
                        <td className="py-3">
                          <div>
                            <span className="block font-semibold text-brand-dark">{acc.user.name}</span>
                            <span className="text-[10px] text-gray-400">{acc.user.email}</span>
                          </div>
                        </td>
                        <td className="py-3 text-right font-mono font-semibold">{formatNaira(acc.principalAmount)}</td>
                        <td className="py-3 text-right font-mono text-emerald-600">{formatNaira(acc.interestEarned)}</td>
                        <td className="py-3">
                          <span className="rounded-md px-2 py-0.5 font-mono text-[9px] font-bold uppercase"
                            style={{ backgroundColor: acc.status === "active" ? "#ECFDF5" : acc.status === "matured" ? "#FEF3C7" : acc.status === "withdrawn" ? "#EFF6FF" : "#FEF2F2", color: acc.status === "active" ? "#059669" : acc.status === "matured" ? "#D97706" : acc.status === "withdrawn" ? "#2563EB" : "#DC2626" }}>
                            {acc.status === "early_withdrawn" ? "Early Exit" : acc.status}
                          </span>
                        </td>
                        <td className="py-3 font-mono">{acc.weeksContributed}</td>
                        <td className="py-3 font-mono text-red-500">{acc.weeksDefaulted}</td>
                        <td className="py-3 text-[11px] text-gray-500">{formatDate(acc.startDate)}</td>
                        <td className="py-3 text-[11px] text-gray-500">{formatDate(acc.maturityDate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <Pagination page={accPage} totalPages={accTotalPages} total={accTotal} limit={LIMIT} onPageChange={setAccPage} loading={loading} />
          </Card>
        </FadeInUp>
      )}

      {activeTab === "interest" && (
        <>
          <StaggerChildren staggerDelay={80} className="mb-8 grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
            <Card padding="1.25rem">
              <span className="block text-[9px] font-bold uppercase tracking-[0.1em] text-gray-500">Total Interest Paid</span>
              <span className="mt-1 block font-mono text-2xl font-bold text-emerald-600">{interestData ? formatNaira(interestData.totalInterest) : "—"}</span>
            </Card>
            <Card padding="1.25rem">
              <span className="block text-[9px] font-bold uppercase tracking-[0.1em] text-gray-500">Total Interest Logs</span>
              <span className="mt-1 block font-mono text-2xl font-bold text-brand-dark">{interestData ? interestData.totalLogs : "—"}</span>
            </Card>
            <Card padding="1.25rem">
              <span className="block text-[9px] font-bold uppercase tracking-[0.1em] text-gray-500">Avg Interest Per Log</span>
              <span className="mt-1 block font-mono text-2xl font-bold text-emerald-500">{interestData ? formatNaira(interestData.avgInterestPerLog) : "—"}</span>
            </Card>
          </StaggerChildren>

          {interestData && interestData.dailyInterest.length > 0 && (
            <FadeInUp delay={100}>
              <Card padding="1.5rem" className="mb-8">
                <span className="mb-4 block text-[9px] font-bold uppercase tracking-[0.1em] text-gray-500">Daily Interest (Last 30 Days)</span>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={interestData.dailyInterest}>
                    <defs>
                      <linearGradient id="colorInterest" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `N${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v: unknown) => typeof v === "number" ? formatNaira(v) : String(v)} />
                    <Area type="monotone" dataKey="amount" stroke="#10b981" fillOpacity={1} fill="url(#colorInterest)" />
                  </AreaChart>
                </ResponsiveContainer>
              </Card>
            </FadeInUp>
          )}

          <FadeInUp delay={200}>
            <Card padding="1.5rem">
              <span className="mb-4 block text-[9px] font-bold uppercase tracking-[0.1em] text-gray-500">Recent Interest Logs</span>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-[12px]">
                  <thead>
                    <tr className="border-b border-gray-100 font-mono text-[9px] uppercase tracking-[0.1em] text-gray-500">
                      <th className="pb-3 text-left font-semibold">Member</th>
                      <th className="pb-3 text-right font-semibold">Amount</th>
                      <th className="pb-3 text-right font-semibold">Principal</th>
                      <th className="pb-3 text-right font-semibold">Rate</th>
                      <th className="pb-3 text-left font-semibold">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {interestData ? (interestData.logs.slice(0, 20).map((log) => (
                      <tr key={log.id} className="border-b border-gray-100">
                        <td className="py-3">
                          <span className="block font-semibold text-brand-dark">{log.circleAccount.user.name}</span>
                          <span className="text-[10px] text-gray-400">{log.circleAccount.user.email}</span>
                        </td>
                        <td className="py-3 text-right font-mono font-semibold text-emerald-600">{formatNaira(log.amount)}</td>
                        <td className="py-3 text-right font-mono">{formatNaira(log.principalAtCalculation)}</td>
                        <td className="py-3 text-right font-mono">{log.annualRate}%</td>
                        <td className="py-3 text-[11px] text-gray-500">{formatDate(log.calculatedAt)}</td>
                      </tr>
                    ))) : (
                      <tr><td colSpan={5} className="py-8 text-center text-gray-500">Loading...</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </FadeInUp>
        </>
      )}

      {activeTab === "payouts" && (
        <>
          <StaggerChildren staggerDelay={80} className="mb-8 grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
            <Card padding="1.25rem">
              <span className="block text-[9px] font-bold uppercase tracking-[0.1em] text-gray-500">Pending Approval</span>
              <span className="mt-1 block font-mono text-2xl font-bold text-blue-600">{stats.payoutPending}</span>
            </Card>
            <Card padding="1.25rem">
              <span className="block text-[9px] font-bold uppercase tracking-[0.1em] text-gray-500">Awaiting Clearance</span>
              <span className="mt-1 block font-mono text-2xl font-bold text-orange-600">{stats.awaitingClearance}</span>
            </Card>
            <Card padding="1.25rem">
              <span className="block text-[9px] font-bold uppercase tracking-[0.1em] text-gray-500">Completed/Disbursed</span>
              <span className="mt-1 block font-mono text-2xl font-bold text-purple-600">{stats.payoutCompleted}</span>
            </Card>
          </StaggerChildren>

          <FadeInUp delay={100}>
            <Card padding="1.5rem">
              <span className="mb-4 block text-[9px] font-bold uppercase tracking-[0.1em] text-gray-500">Default Summary</span>
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <span className="mb-1 block text-[11px] text-gray-400">Total Defaults</span>
                  <span className="font-mono text-2xl font-bold text-brand-dark">{stats.totalDefaults}</span>
                </div>
                <div>
                  <span className="mb-1 block text-[11px] text-gray-400">Outstanding</span>
                  <span className="font-mono text-2xl font-bold text-red-500">{stats.outstandingDefaults}</span>
                </div>
                <div>
                  <span className="mb-1 block text-[11px] text-gray-400">Cleared</span>
                  <span className="font-mono text-2xl font-bold text-emerald-600">{stats.clearedDefaults}</span>
                </div>
              </div>
            </Card>
          </FadeInUp>
        </>
      )}
    </div>
  );
}
