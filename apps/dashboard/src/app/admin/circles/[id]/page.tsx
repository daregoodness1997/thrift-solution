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
  Clock,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

type Tab =
  | "analytics"
  | "accounts"
  | "defaults"
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

export default function AdminCircleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, token, loading: authLoading } = useAuth();
  const isAdmin = user?.role === "admin" || user?.role === "superadmin";

  const [circle, setCircle] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [defaults, setDefaults] = useState<any[]>([]);
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
        setDefaults(
          analyticsData.data.recentAccounts?.flatMap(
            (a: any) => a.defaults || [],
          ) || [],
        );
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
    fetch(
      `${API_URL}/api/circles/${circleId}/accounts-list?page=${page}&limit=20`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    )
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

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    {
      id: "analytics",
      label: "Analytics",
      icon: <BarChart3 className="w-4 h-4" />,
    },
    { id: "accounts", label: "Accounts", icon: <Users className="w-4 h-4" /> },
    {
      id: "defaults",
      label: "Defaults",
      icon: <AlertTriangle className="w-4 h-4" />,
    },
    {
      id: "payouts",
      label: "Payouts",
      icon: <CreditCard className="w-4 h-4" />,
    },
    {
      id: "interest",
      label: "Interest",
      icon: <TrendingUp className="w-4 h-4" />,
    },
    {
      id: "transactions",
      label: "Transactions",
      icon: <Activity className="w-4 h-4" />,
    },
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
      case "payouts":
        exportCSV(
          payouts.map((p: any) => ({
            AccountId: p.circleAccountId,
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
          exportCSV(
            [
              {
                Subscribed: analytics.stats?.subscribed,
                NearMaturity: analytics.stats?.nearMaturity,
                Matured: analytics.stats?.matured,
                TotalPrincipal: analytics.stats?.totalPrincipal,
                TotalInterest: analytics.stats?.totalInterest,
                TotalMaturityValue: analytics.stats?.totalMaturityValue,
                AvgPrincipal: analytics.stats?.avgPrincipal,
                AvgInterest: analytics.stats?.avgInterest,
                EarlyWithdrawn: analytics.stats?.earlyWithdrawn,
                Withdrawn: analytics.stats?.withdrawn,
                TotalDefaults: analytics.stats?.totalDefaults,
                OutstandingDefaults: analytics.stats?.outstandingDefaults,
                ClearedDefaults: analytics.stats?.clearedDefaults,
                TotalContributions: analytics.stats?.totalContributions,
                DefaultRate: analytics.stats?.defaultRate,
              },
            ],
            `circle-analytics-${circleId}-${ts}.csv`,
          );
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
        <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card padding="1.25rem">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <span className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase">
                  Subscribed
                </span>
                <span className="text-xl font-bold text-slate-900 dark:text-white">
                  {analytics.stats?.subscribed ?? 0}
                </span>
              </div>
            </div>
          </Card>
          <Card padding="1.25rem">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg">
                <Wallet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <span className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase">
                  Total Principal
                </span>
                <span className="text-xl font-bold text-slate-900 dark:text-white">
                  {formatNaira(analytics.stats?.totalPrincipal ?? 0)}
                </span>
              </div>
            </div>
          </Card>
          <Card padding="1.25rem">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-violet-50 dark:bg-violet-950/30 rounded-lg">
                <TrendingUp className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <span className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase">
                  Total Interest
                </span>
                <span className="text-xl font-bold text-slate-900 dark:text-white">
                  {formatNaira(analytics.stats?.totalInterest ?? 0)}
                </span>
              </div>
            </div>
          </Card>
          <Card padding="1.25rem">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-50 dark:bg-orange-950/30 rounded-lg">
                <Coins className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <span className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase">
                  Maturity Value
                </span>
                <span className="text-xl font-bold text-slate-900 dark:text-white">
                  {formatNaira(analytics.stats?.totalMaturityValue ?? 0)}
                </span>
              </div>
            </div>
          </Card>
        </div>
      )}

      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex gap-1 rounded-xl bg-slate-100 dark:bg-slate-800 p-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-[12px] font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white"
                  : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[12px] font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          <Download className="w-3.5 h-3.5" />
          Export
        </button>
      </div>

      {activeTab === "analytics" && analytics && (
        <div>
          <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card padding="1rem">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Near Maturity
              </span>
              <span className="mt-1 block font-mono text-xl font-bold text-amber-600">
                {analytics.stats?.nearMaturity ?? 0}
              </span>
            </Card>
            <Card padding="1rem">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Matured
              </span>
              <span className="mt-1 block font-mono text-xl font-bold text-emerald-600">
                {analytics.stats?.matured ?? 0}
              </span>
            </Card>
            <Card padding="1rem">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Early Withdrawn
              </span>
              <span className="mt-1 block font-mono text-xl font-bold text-red-600">
                {analytics.stats?.earlyWithdrawn ?? 0}
              </span>
            </Card>
            <Card padding="1rem">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Default Rate
              </span>
              <span className="mt-1 block font-mono text-xl font-bold text-slate-900 dark:text-white">
                {analytics.stats?.defaultRate ?? 0}%
              </span>
            </Card>
          </div>
          <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card padding="1rem">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Avg Principal
              </span>
              <span className="mt-1 block font-mono text-xl font-bold text-slate-900 dark:text-white">
                {formatNaira(analytics.stats?.avgPrincipal ?? 0)}
              </span>
            </Card>
            <Card padding="1rem">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Avg Interest
              </span>
              <span className="mt-1 block font-mono text-xl font-bold text-slate-900 dark:text-white">
                {formatNaira(analytics.stats?.avgInterest ?? 0)}
              </span>
            </Card>
            <Card padding="1rem">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Total Contributions
              </span>
              <span className="mt-1 block font-mono text-xl font-bold text-slate-900 dark:text-white">
                {analytics.stats?.totalContributions ?? 0}
              </span>
            </Card>
            <Card padding="1rem">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Outstanding Defaults
              </span>
              <span className="mt-1 block font-mono text-xl font-bold text-amber-600">
                {analytics.stats?.outstandingDefaults ?? 0}
              </span>
            </Card>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card padding="1.25rem">
              <h4 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">
                Status Distribution
              </h4>
              <div className="space-y-2">
                {analytics.statusDistribution?.map((s: any) => (
                  <div
                    key={s.status}
                    className="flex items-center justify-between text-[12px]"
                  >
                    <span className="text-slate-600 dark:text-slate-400">
                      {s.status}
                    </span>
                    <span className="font-mono font-semibold text-slate-900 dark:text-white">
                      {s.count}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
            <Card padding="1.25rem">
              <h4 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">
                Monthly Growth
              </h4>
              <div className="space-y-2">
                {analytics.monthlyGrowth?.slice(-6).map((m: any) => (
                  <div
                    key={m.month}
                    className="flex items-center justify-between text-[12px]"
                  >
                    <span className="text-slate-600 dark:text-slate-400">
                      {m.month}
                    </span>
                    <span className="font-mono font-semibold text-slate-900 dark:text-white">
                      {m.count} accounts
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {activeTab === "accounts" && (
        <Card padding="1.5rem">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Accounts ({total})
            </h3>
          </div>
          <SimpleTable
            columns={[
              {
                key: "user.name",
                header: "User",
                render: (a: any) => (
                  <div>
                    <div className="font-medium text-slate-900 dark:text-white">
                      {a.user?.name || "—"}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      {a.user?.email}
                    </div>
                  </div>
                ),
              },
              {
                key: "status",
                header: "Status",
                render: (a: any) => (
                  <span
                    className={`rounded-md px-2 py-0.5 font-mono text-[9px] font-bold uppercase border ${
                      a.status === "active"
                        ? "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50"
                        : a.status === "matured"
                          ? "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/50"
                          : "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                    }`}
                  >
                    {a.status}
                  </span>
                ),
              },
              {
                key: "principalAmount",
                header: "Principal",
                align: "right",
                mono: true,
                render: (a: any) => (
                  <span className="font-semibold">
                    {formatNaira(a.principalAmount || 0)}
                  </span>
                ),
              },
              {
                key: "interestEarned",
                header: "Interest",
                align: "right",
                mono: true,
                render: (a: any) => (
                  <span className="text-emerald-600 dark:text-emerald-400">
                    {formatNaira(a.interestEarned || 0)}
                  </span>
                ),
              },
              {
                key: "weeksContributed",
                header: "Weeks",
                align: "center",
                render: (a: any) => (
                  <span className="font-mono text-[11px]">
                    {a.weeksContributed || 0}
                  </span>
                ),
              },
              {
                key: "createdAt",
                header: "Joined",
                render: (a: any) => (
                  <span className="text-slate-500 dark:text-slate-400">
                    {new Date(a.createdAt).toLocaleDateString()}
                  </span>
                ),
              },
              {
                key: "actions",
                header: "",
                align: "right",
                render: (a: any) => (
                  <button
                    onClick={() => router.push(`/admin/users/${a.userId}`)}
                    className="cursor-pointer rounded-md border border-violet-600/20 bg-violet-600/5 px-2 py-1 text-[10px] font-semibold text-violet-600 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-400"
                  >
                    <Eye className="w-3 h-3 inline mr-0.5" />
                    View
                  </button>
                ),
              },
            ]}
            data={accounts}
            emptyText="No accounts in this circle"
          />
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-md border border-slate-200 px-3 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="rounded-md border border-slate-200 px-3 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </Card>
      )}

      {activeTab === "defaults" && (
        <Card padding="1.5rem">
          <h3 className="mb-4 text-sm font-semibold text-slate-900 dark:text-white">
            Defaults ({defaults.length})
          </h3>
          <SimpleTable
            columns={[
              {
                key: "circleAccountId",
                header: "Account",
                mono: true,
                render: (d: any) => (
                  <span className="text-[11px]">
                    {d.circleAccountId?.substring(0, 8)}...
                  </span>
                ),
              },
              {
                key: "weekNumber",
                header: "Week",
                mono: true,
                render: (d: any) => <span>W{d.weekNumber}</span>,
              },
              {
                key: "amount",
                header: "Amount",
                align: "right",
                mono: true,
                render: (d: any) => (
                  <span className="font-semibold">
                    {formatNaira(d.amount || 0)}
                  </span>
                ),
              },
              {
                key: "status",
                header: "Status",
                render: (d: any) => (
                  <span
                    className={`rounded-md px-2 py-0.5 font-mono text-[9px] font-bold uppercase border ${
                      d.status === "outstanding"
                        ? "bg-red-50 text-red-600 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50"
                        : "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50"
                    }`}
                  >
                    {d.status}
                  </span>
                ),
              },
              {
                key: "createdAt",
                header: "Date",
                render: (d: any) => (
                  <span className="text-slate-500 dark:text-slate-400">
                    {new Date(d.createdAt).toLocaleDateString()}
                  </span>
                ),
              },
            ]}
            data={defaults}
            emptyText="No defaults found"
          />
        </Card>
      )}

      {activeTab === "payouts" && (
        <Card padding="1.5rem">
          <h3 className="mb-4 text-sm font-semibold text-slate-900 dark:text-white">
            Payout Requests ({payouts.length})
          </h3>
          <SimpleTable
            columns={[
              {
                key: "circleAccountId",
                header: "Account",
                mono: true,
                render: (p: any) => (
                  <span className="text-[11px]">
                    {p.circleAccountId?.substring(0, 8)}...
                  </span>
                ),
              },
              {
                key: "amount",
                header: "Amount",
                align: "right",
                mono: true,
                render: (p: any) => (
                  <span className="font-semibold">
                    {formatNaira(p.amount || 0)}
                  </span>
                ),
              },
              {
                key: "status",
                header: "Status",
                render: (p: any) => (
                  <span
                    className={`rounded-md px-2 py-0.5 font-mono text-[9px] font-bold uppercase border ${
                      p.status === "approved"
                        ? "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50"
                        : p.status === "pending"
                          ? "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50"
                          : "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                    }`}
                  >
                    {p.status}
                  </span>
                ),
              },
              {
                key: "createdAt",
                header: "Date",
                render: (p: any) => (
                  <span className="text-slate-500 dark:text-slate-400">
                    {new Date(p.createdAt).toLocaleDateString()}
                  </span>
                ),
              },
            ]}
            data={payouts}
            emptyText="No payout requests found"
          />
        </Card>
      )}

      {activeTab === "interest" && (
        <Card padding="1.5rem">
          <h3 className="mb-4 text-sm font-semibold text-slate-900 dark:text-white">
            Interest Logs ({interestLogs.length})
          </h3>
          <SimpleTable
            columns={[
              {
                key: "circleAccountId",
                header: "Account",
                mono: true,
                render: (l: any) => (
                  <span className="text-[11px]">
                    {l.circleAccountId?.substring(0, 8)}...
                  </span>
                ),
              },
              {
                key: "amount",
                header: "Amount",
                align: "right",
                mono: true,
                render: (l: any) => (
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {formatNaira(l.amount || 0)}
                  </span>
                ),
              },
              {
                key: "annualRate",
                header: "Rate",
                mono: true,
                render: (l: any) => (
                  <span className="font-semibold text-blue-600">
                    {l.annualRate}%
                  </span>
                ),
              },
              {
                key: "calculatedAt",
                header: "Date",
                render: (l: any) => (
                  <span className="text-slate-500 dark:text-slate-400">
                    {new Date(l.calculatedAt).toLocaleDateString()}
                  </span>
                ),
              },
            ]}
            data={interestLogs}
            emptyText="No interest logs found"
          />
        </Card>
      )}

      {activeTab === "transactions" && (
        <Card padding="1.5rem">
          <h3 className="mb-4 text-sm font-semibold text-slate-900 dark:text-white">
            Transactions ({transactions.length})
          </h3>
          <SimpleTable
            columns={[
              {
                key: "userName",
                header: "User",
                render: (t: any) => (
                  <span className="font-medium">{t.userName || "—"}</span>
                ),
              },
              {
                key: "type",
                header: "Type",
                render: (t: any) => (
                  <span className="font-mono text-[11px]">{t.type}</span>
                ),
              },
              {
                key: "amount",
                header: "Amount",
                align: "right",
                mono: true,
                render: (t: any) => (
                  <span className="font-semibold">
                    {formatNaira(t.amount || 0)}
                  </span>
                ),
              },
              {
                key: "status",
                header: "Status",
                render: (t: any) => (
                  <span
                    className={`rounded-md px-2 py-0.5 font-mono text-[9px] font-bold uppercase border ${
                      t.status === "completed"
                        ? "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50"
                        : t.status === "pending"
                          ? "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50"
                          : "bg-red-50 text-red-600 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50"
                    }`}
                  >
                    {t.status}
                  </span>
                ),
              },
              {
                key: "createdAt",
                header: "Date",
                render: (t: any) => (
                  <span className="text-slate-500 dark:text-slate-400">
                    {new Date(t.createdAt).toLocaleDateString()}
                  </span>
                ),
              },
            ]}
            data={transactions}
            emptyText="No transactions found"
          />
        </Card>
      )}
    </div>
  );
}
