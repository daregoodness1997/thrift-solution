"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@thrift/ui";
import { formatNaira } from "@thrift/utils";
import { SimpleTable } from "@/components/SimpleTable";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/PageHeader";
import {
  Users,
  Wallet,
  TrendingUp,
  Activity,
  AlertTriangle,
  Coins,
  CreditCard,
  ArrowLeft,
  Eye,
  Download,
  BarChart3,
  CheckCircle,
  Clock,
  ShieldCheck,
  Flame,
  Zap,
  Star,
  CircleDot,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

type Tab =
  | "analytics"
  | "accounts"
  | "defaults"
  | "clearance"
  | "payouts"
  | "interest"
  | "transactions";

function exportCSV(data: Record<string, any>[], filename: string) {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(","),
    ...data.map((row) =>
      headers
        .map((h) => {
          const val = row[h];
          const str = val == null ? "" : String(val);
          return str.includes(",") || str.includes('"') || str.includes("\n")
            ? `"${str.replace(/"/g, '""')}"`
            : str;
        })
        .join(","),
    ),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function StatCard({
  label,
  value,
  icon,
  gradient,
  textColor,
}: {
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  gradient: string;
  textColor: string;
}) {
  return (
    <div className={`relative overflow-hidden rounded-2xl ${gradient} p-5 shadow-sm`}>
      <div className="absolute -right-3 -top-3 opacity-10">{icon}</div>
      <span className="block text-[10px] font-bold uppercase tracking-wider text-white/70">
        {label}
      </span>
      <span className={`mt-1 block font-mono text-2xl font-extrabold ${textColor}`}>
        {value}
      </span>
    </div>
  );
}

export default function AdminCircleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, token, loading: authLoading } = useAuth();
  const isAdmin = user?.role === "admin" || user?.role === "superadmin";

  const [circle, setCircle] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [defaults, setDefaults] = useState<any[]>([]);
  const [clearances, setClearances] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [interestLogs, setInterestLogs] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("analytics");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const circleId = params.id as string;

  useEffect(() => {
    if (!authLoading && user && !isAdmin) router.replace("/");
  }, [authLoading, user, isAdmin, router]);

  const fetchData = useCallback(async () => {
    if (!token || !circleId || !isAdmin) {
      setLoading(false);
      return;
    }
    try {
      const [circleRes, analyticsRes] = await Promise.all([
        fetch(`${API_URL}/api/circles/${circleId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/api/circles/${circleId}/analytics`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      const circleData = await circleRes.json();
      const analyticsData = await analyticsRes.json();
      if (circleData.success) setCircle(circleData.data);
      if (analyticsData.success) {
        setAnalytics(analyticsData.data);
        const allDefaults = analyticsData.data.recentAccounts?.flatMap((a: any) => a.defaults || []) || [];
        setDefaults(allDefaults.filter((d: any) => d.status === "outstanding"));
        setClearances(allDefaults.filter((d: any) => d.status === "cleared"));
        setInterestLogs(analyticsData.data.interestLogs || []);
      }
    } catch {}
    setLoading(false);
  }, [token, circleId, isAdmin]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!token || !circleId || !isAdmin) return;
    fetch(`${API_URL}/api/circles/${circleId}/accounts-list?page=${page}&limit=20`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setAccounts(data.data.items || []);
          setTotalPages(data.data.totalPages || 1);
          setTotal(data.data.total || 0);
        }
      })
      .catch(() => {});
  }, [token, circleId, isAdmin, page]);

  useEffect(() => {
    if (!token || !circleId || !isAdmin) return;
    fetch(`${API_URL}/api/circles/${circleId}/payout-requests`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setPayouts(data.data.items || []);
      })
      .catch(() => {});
  }, [token, circleId, isAdmin]);

  useEffect(() => {
    if (!analytics) return;
    const txns: any[] = [];
    analytics.recentAccounts?.forEach((a: any) => {
      if (a.user?.transactions) {
        a.user.transactions.forEach((t: any) =>
          txns.push({ ...t, userName: a.user.name }),
        );
      }
    });
    setTransactions(txns);
  }, [analytics]);

  const tabs: { id: Tab; label: string; icon: React.ReactNode; color: string }[] = [
    { id: "analytics", label: "Analytics", icon: <BarChart3 className="w-4 h-4" />, color: "bg-indigo-600 text-white" },
    { id: "accounts", label: "Accounts", icon: <Users className="w-4 h-4" />, color: "bg-blue-600 text-white" },
    { id: "defaults", label: "Defaults", icon: <AlertTriangle className="w-4 h-4" />, color: "bg-red-600 text-white" },
    { id: "clearance", label: "Clearance", icon: <ShieldCheck className="w-4 h-4" />, color: "bg-emerald-600 text-white" },
    { id: "payouts", label: "Payouts", icon: <CreditCard className="w-4 h-4" />, color: "bg-amber-600 text-white" },
    { id: "interest", label: "Interest", icon: <TrendingUp className="w-4 h-4" />, color: "bg-violet-600 text-white" },
    { id: "transactions", label: "Transactions", icon: <Activity className="w-4 h-4" />, color: "bg-cyan-600 text-white" },
  ];

  const handleExport = () => {
    const ts = new Date().toISOString().slice(0, 10);
    switch (activeTab) {
      case "accounts":
        exportCSV(
          accounts.map((a) => ({
            User: a.user?.name,
            Email: a.user?.email,
            Status: a.status,
            Principal: a.principalAmount,
            Interest: a.interestEarned,
            WeeksContributed: a.weeksContributed,
            Joined: a.createdAt,
          })),
          `circle-accounts-${circleId}-${ts}.csv`,
        );
        break;
      case "defaults":
        exportCSV(
          defaults.map((d: any) => ({
            AccountId: d.circleAccountId,
            Week: d.weekNumber,
            Amount: d.amount,
            Status: d.status,
            Date: d.createdAt,
          })),
          `circle-defaults-${circleId}-${ts}.csv`,
        );
        break;
      case "clearance":
        exportCSV(
          clearances.map((d: any) => ({
            AccountId: d.circleAccountId,
            Week: d.weekNumber,
            Amount: d.amount,
            ClearanceAmount: d.clearanceAmount,
            Status: d.status,
            Date: d.createdAt,
          })),
          `circle-clearances-${circleId}-${ts}.csv`,
        );
        break;
      case "payouts":
        exportCSV(
          payouts.map((p: any) => ({
            User: p.user?.name,
            Amount: p.amount,
            Status: p.status,
            Date: p.createdAt,
          })),
          `circle-payouts-${circleId}-${ts}.csv`,
        );
        break;
      case "interest":
        exportCSV(
          interestLogs.map((l: any) => ({
            AccountId: l.circleAccountId,
            Amount: l.amount,
            Rate: l.annualRate,
            Date: l.calculatedAt,
          })),
          `circle-interest-${circleId}-${ts}.csv`,
        );
        break;
      case "transactions":
        exportCSV(
          transactions.map((t: any) => ({
            Type: t.type,
            Amount: t.amount,
            Status: t.status,
            User: t.userName,
            Date: t.createdAt,
          })),
          `circle-transactions-${circleId}-${ts}.csv`,
        );
        break;
      case "analytics":
        if (analytics) {
          exportCSV([{
            Subscribed: analytics.stats?.subscribed,
            NearMaturity: analytics.stats?.nearMaturity,
            Matured: analytics.stats?.matured,
            TotalPrincipal: analytics.stats?.totalPrincipal,
            TotalInterest: analytics.stats?.totalInterest,
            TotalMaturityValue: analytics.stats?.totalMaturityValue,
            DefaultRate: analytics.stats?.defaultRate,
          }], `circle-analytics-${circleId}-${ts}.csv`);
        }
        break;
    }
  };

  if (loading || authLoading) {
    return (
      <div className="mx-auto max-w-[1280px] p-[clamp(1rem,3vw,2rem)]">
        <div className="p-16 text-center text-[13px] text-slate-500 dark:text-slate-400">
          Loading circle details...
        </div>
      </div>
    );
  }

  if (!circle) {
    return (
      <div className="mx-auto max-w-[1280px] p-[clamp(1rem,3vw,2rem)]">
        <div className="p-16 text-center text-[13px] text-red-500">
          Circle not found
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1280px] p-[clamp(1rem,3vw,2rem)]">
      <PageHeader
        badgeLabel="Admin"
        heading="Circle"
        accentText="Details"
        description={`${circle.name} — ${circle.status}`}
        right={
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[12px] font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </button>
        }
      />

      {analytics && (
        <div className="mb-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Subscribed"
            value={analytics.stats?.subscribed ?? 0}
            icon={<Users className="w-24 h-24" />}
            gradient="bg-gradient-to-br from-blue-500 to-blue-700"
            textColor="text-white"
          />
          <StatCard
            label="Total Principal"
            value={formatNaira(analytics.stats?.totalPrincipal ?? 0)}
            icon={<Wallet className="w-24 h-24" />}
            gradient="bg-gradient-to-br from-emerald-500 to-teal-700"
            textColor="text-white"
          />
          <StatCard
            label="Total Interest"
            value={formatNaira(analytics.stats?.totalInterest ?? 0)}
            icon={<TrendingUp className="w-24 h-24" />}
            gradient="bg-gradient-to-br from-violet-500 to-purple-700"
            textColor="text-white"
          />
          <StatCard
            label="Maturity Value"
            value={formatNaira(analytics.stats?.totalMaturityValue ?? 0)}
            icon={<Coins className="w-24 h-24" />}
            gradient="bg-gradient-to-br from-amber-500 to-orange-600"
            textColor="text-white"
          />
        </div>
      )}

      {analytics && (
        <div className="mb-8 grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-center dark:border-emerald-900/50 dark:bg-emerald-950/30">
            <CheckCircle className="mx-auto mb-1 h-5 w-5 text-emerald-500" />
            <span className="block font-mono text-lg font-bold text-emerald-700 dark:text-emerald-400">
              {analytics.stats?.matured ?? 0}
            </span>
            <span className="text-[10px] font-semibold uppercase text-emerald-600/70 dark:text-emerald-400/70">Matured</span>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-center dark:border-amber-900/50 dark:bg-amber-950/30">
            <Clock className="mx-auto mb-1 h-5 w-5 text-amber-500" />
            <span className="block font-mono text-lg font-bold text-amber-700 dark:text-amber-400">
              {analytics.stats?.nearMaturity ?? 0}
            </span>
            <span className="text-[10px] font-semibold uppercase text-amber-600/70 dark:text-amber-400/70">Near Maturity</span>
          </div>
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-center dark:border-red-900/50 dark:bg-red-950/30">
            <Flame className="mx-auto mb-1 h-5 w-5 text-red-500" />
            <span className="block font-mono text-lg font-bold text-red-700 dark:text-red-400">
              {analytics.stats?.outstandingDefaults ?? 0}
            </span>
            <span className="text-[10px] font-semibold uppercase text-red-600/70 dark:text-red-400/70">Outstanding</span>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-center dark:border-emerald-900/50 dark:bg-emerald-950/30">
            <ShieldCheck className="mx-auto mb-1 h-5 w-5 text-emerald-500" />
            <span className="block font-mono text-lg font-bold text-emerald-700 dark:text-emerald-400">
              {analytics.stats?.clearedDefaults ?? 0}
            </span>
            <span className="text-[10px] font-semibold uppercase text-emerald-600/70 dark:text-emerald-400/70">Cleared</span>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center dark:border-slate-700 dark:bg-slate-800">
            <Zap className="mx-auto mb-1 h-5 w-5 text-slate-500" />
            <span className="block font-mono text-lg font-bold text-slate-700 dark:text-slate-300">
              {analytics.stats?.defaultRate ?? 0}%
            </span>
            <span className="text-[10px] font-semibold uppercase text-slate-500/70 dark:text-slate-400/70">Default Rate</span>
          </div>
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-1 rounded-2xl bg-slate-100 dark:bg-slate-800 p-1.5 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-[12px] font-semibold transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? `${tab.color} shadow-lg shadow-black/10 scale-[1.02]`
                  : "text-slate-500 hover:text-slate-700 hover:bg-white dark:hover:text-slate-300 dark:hover:bg-slate-700"
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.id === "defaults" && defaults.length > 0 && (
                <span className="ml-1 rounded-full bg-white/20 px-1.5 py-0.5 text-[9px] font-bold">
                  {defaults.length}
                </span>
              )}
              {tab.id === "clearance" && clearances.length > 0 && (
                <span className="ml-1 rounded-full bg-white/20 px-1.5 py-0.5 text-[9px] font-bold">
                  {clearances.length}
                </span>
              )}
            </button>
          ))}
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-2.5 text-[12px] font-semibold text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {activeTab === "analytics" && analytics && (
        <div>
          <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card padding="1rem">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Avg Principal</span>
              <span className="mt-1 block font-mono text-xl font-bold text-blue-600">{formatNaira(analytics.stats?.avgPrincipal ?? 0)}</span>
            </Card>
            <Card padding="1rem">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Avg Interest</span>
              <span className="mt-1 block font-mono text-xl font-bold text-violet-600">{formatNaira(analytics.stats?.avgInterest ?? 0)}</span>
            </Card>
            <Card padding="1rem">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Contributions</span>
              <span className="mt-1 block font-mono text-xl font-bold text-emerald-600">{analytics.stats?.totalContributions ?? 0}</span>
            </Card>
            <Card padding="1rem">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Early Withdrawn</span>
              <span className="mt-1 block font-mono text-xl font-bold text-red-600">{analytics.stats?.earlyWithdrawn ?? 0}</span>
            </Card>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
              <h4 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                <Star className="h-4 w-4 text-amber-500" /> Status Distribution
              </h4>
              <div className="space-y-3">
                {analytics.statusDistribution?.map((s: any) => {
                  const max = Math.max(...analytics.statusDistribution.map((x: any) => x.count));
                  const pct = max > 0 ? (s.count / max) * 100 : 0;
                  return (
                    <div key={s.status}>
                      <div className="mb-1 flex items-center justify-between text-[12px]">
                        <span className="font-medium text-slate-600 dark:text-slate-400 capitalize">{s.status}</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">{s.count}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
              <h4 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                <CircleDot className="h-4 w-4 text-blue-500" /> Monthly Growth
              </h4>
              <div className="space-y-3">
                {analytics.monthlyGrowth?.slice(-6).map((m: any) => {
                  const max = Math.max(...analytics.monthlyGrowth.map((x: any) => x.count));
                  const pct = max > 0 ? (m.count / max) * 100 : 0;
                  return (
                    <div key={m.month}>
                      <div className="mb-1 flex items-center justify-between text-[12px]">
                        <span className="font-medium text-slate-600 dark:text-slate-400">{m.month}</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">{m.count} accounts</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "accounts" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
          <h3 className="mb-4 text-sm font-bold text-slate-900 dark:text-white">Accounts ({total})</h3>
          <SimpleTable
            columns={[
              {
                key: "user.name",
                header: "User",
                render: (a: any) => (
                  <div>
                    <div className="font-medium text-slate-900 dark:text-white">{a.user?.name || "—"}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">{a.user?.email}</div>
                  </div>
                ),
              },
              {
                key: "status",
                header: "Status",
                render: (a: any) => (
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${
                    a.status === "active" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                    a.status === "matured" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                    a.status === "early_withdrawn" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                    "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                  }`}>{a.status}</span>
                ),
              },
              {
                key: "principalAmount",
                header: "Principal",
                align: "right",
                mono: true,
                render: (a: any) => <span className="font-semibold text-slate-900 dark:text-white">{formatNaira(a.principalAmount || 0)}</span>,
              },
              {
                key: "interestEarned",
                header: "Interest",
                align: "right",
                mono: true,
                render: (a: any) => <span className="font-semibold text-emerald-600 dark:text-emerald-400">{formatNaira(a.interestEarned || 0)}</span>,
              },
              {
                key: "weeksContributed",
                header: "Weeks",
                align: "center",
                render: (a: any) => (
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 font-mono text-[10px] font-bold text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                    {a.weeksContributed || 0}
                  </span>
                ),
              },
              {
                key: "createdAt",
                header: "Joined",
                render: (a: any) => <span className="text-slate-500 dark:text-slate-400">{new Date(a.createdAt).toLocaleDateString()}</span>,
              },
              {
                key: "actions",
                header: "",
                align: "right",
                render: (a: any) => (
                  <button
                    onClick={() => router.push(`/admin/users/${a.userId}`)}
                    className="cursor-pointer rounded-full bg-violet-100 px-3 py-1 text-[10px] font-bold text-violet-700 hover:bg-violet-200 dark:bg-violet-900/30 dark:text-violet-400 dark:hover:bg-violet-900/50 transition-colors"
                  >
                    <Eye className="w-3 h-3 inline mr-0.5" /> View
                  </button>
                ),
              },
            ]}
            data={accounts}
            emptyText="No accounts in this circle"
          />
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Page {page} of {totalPages}</span>
              <div className="flex gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                  className="rounded-lg bg-slate-100 px-3 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-200 disabled:opacity-50 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">
                  Previous
                </button>
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="rounded-lg bg-slate-100 px-3 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-200 disabled:opacity-50 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "defaults" && (
        <div className="rounded-2xl border border-red-200 bg-red-50/50 p-5 dark:border-red-900/30 dark:bg-red-950/10">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-red-700 dark:text-red-400">
            <Flame className="h-4 w-4" /> Outstanding Defaults ({defaults.length})
          </h3>
          <SimpleTable
            columns={[
              { key: "circleAccountId", header: "Account", mono: true, render: (d: any) => <span className="text-[11px]">{d.circleAccountId?.substring(0, 8)}...</span> },
              { key: "weekNumber", header: "Week", mono: true, render: (d: any) => <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700 dark:bg-red-900/30 dark:text-red-400">W{d.weekNumber}</span> },
              { key: "amount", header: "Amount", align: "right", mono: true, render: (d: any) => <span className="font-bold text-red-600 dark:text-red-400">{formatNaira(d.amount || 0)}</span> },
              { key: "clearanceAmount", header: "Clearance", align: "right", mono: true, render: (d: any) => <span className="font-bold text-amber-600 dark:text-amber-400">{formatNaira(d.clearanceAmount || 0)}</span> },
              { key: "createdAt", header: "Date", render: (d: any) => <span className="text-slate-500 dark:text-slate-400">{new Date(d.createdAt).toLocaleDateString()}</span> },
            ]}
            data={defaults}
            emptyText="No outstanding defaults"
          />
        </div>
      )}

      {activeTab === "clearance" && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 dark:border-emerald-900/30 dark:bg-emerald-950/10">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-emerald-700 dark:text-emerald-400">
            <ShieldCheck className="h-4 w-4" /> Cleared Defaults ({clearances.length})
          </h3>
          <SimpleTable
            columns={[
              { key: "circleAccountId", header: "Account", mono: true, render: (d: any) => <span className="text-[11px]">{d.circleAccountId?.substring(0, 8)}...</span> },
              { key: "weekNumber", header: "Week", mono: true, render: (d: any) => <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">W{d.weekNumber}</span> },
              { key: "amount", header: "Amount", align: "right", mono: true, render: (d: any) => <span className="font-bold text-slate-900 dark:text-white">{formatNaira(d.amount || 0)}</span> },
              { key: "clearanceAmount", header: "Paid", align: "right", mono: true, render: (d: any) => <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatNaira(d.clearanceAmount || 0)}</span> },
              { key: "status", header: "Status", render: (d: any) => (
                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold uppercase text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                  {d.status}
                </span>
              )},
              { key: "createdAt", header: "Date", render: (d: any) => <span className="text-slate-500 dark:text-slate-400">{new Date(d.createdAt).toLocaleDateString()}</span> },
            ]}
            data={clearances}
            emptyText="No cleared defaults"
          />
        </div>
      )}

      {activeTab === "payouts" && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5 dark:border-amber-900/30 dark:bg-amber-950/10">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-amber-700 dark:text-amber-400">
            <CreditCard className="h-4 w-4" /> Payout Requests ({payouts.length})
          </h3>
          <SimpleTable
            columns={[
              { key: "user.name", header: "User", render: (p: any) => <span className="font-medium">{p.user?.name || "—"}</span> },
              { key: "amount", header: "Amount", align: "right", mono: true, render: (p: any) => <span className="font-bold text-slate-900 dark:text-white">{formatNaira(p.amount || 0)}</span> },
              { key: "status", header: "Status", render: (p: any) => (
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${
                  p.status === "approved" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                  p.status === "pending" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                  p.status === "disbursed" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                  "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                }`}>{p.status}</span>
              )},
              { key: "createdAt", header: "Date", render: (p: any) => <span className="text-slate-500 dark:text-slate-400">{new Date(p.createdAt).toLocaleDateString()}</span> },
            ]}
            data={payouts}
            emptyText="No payout requests"
          />
        </div>
      )}

      {activeTab === "interest" && (
        <div className="rounded-2xl border border-violet-200 bg-violet-50/50 p-5 dark:border-violet-900/30 dark:bg-violet-950/10">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-violet-700 dark:text-violet-400">
            <TrendingUp className="h-4 w-4" /> Interest Logs ({interestLogs.length})
          </h3>
          <SimpleTable
            columns={[
              { key: "circleAccountId", header: "Account", mono: true, render: (l: any) => <span className="text-[11px]">{l.circleAccountId?.substring(0, 8)}...</span> },
              { key: "amount", header: "Amount", align: "right", mono: true, render: (l: any) => <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatNaira(l.amount || 0)}</span> },
              { key: "annualRate", header: "Rate", mono: true, render: (l: any) => (
                <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">{l.annualRate}%</span>
              )},
              { key: "calculatedAt", header: "Date", render: (l: any) => <span className="text-slate-500 dark:text-slate-400">{new Date(l.calculatedAt).toLocaleDateString()}</span> },
            ]}
            data={interestLogs}
            emptyText="No interest logs"
          />
        </div>
      )}

      {activeTab === "transactions" && (
        <div className="rounded-2xl border border-cyan-200 bg-cyan-50/50 p-5 dark:border-cyan-900/30 dark:bg-cyan-950/10">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-cyan-700 dark:text-cyan-400">
            <Activity className="h-4 w-4" /> Transactions ({transactions.length})
          </h3>
          <SimpleTable
            columns={[
              { key: "userName", header: "User", render: (t: any) => <span className="font-medium">{t.userName || "—"}</span> },
              { key: "type", header: "Type", render: (t: any) => (
                <span className="rounded-full bg-cyan-100 px-2 py-0.5 font-mono text-[10px] font-bold text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400">{t.type}</span>
              )},
              { key: "amount", header: "Amount", align: "right", mono: true, render: (t: any) => <span className="font-bold text-slate-900 dark:text-white">{formatNaira(t.amount || 0)}</span> },
              { key: "status", header: "Status", render: (t: any) => (
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${
                  t.status === "completed" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                  t.status === "pending" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                  "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                }`}>{t.status}</span>
              )},
              { key: "createdAt", header: "Date", render: (t: any) => <span className="text-slate-500 dark:text-slate-400">{new Date(t.createdAt).toLocaleDateString()}</span> },
            ]}
            data={transactions}
            emptyText="No transactions found"
          />
        </div>
      )}
    </div>
  );
}
