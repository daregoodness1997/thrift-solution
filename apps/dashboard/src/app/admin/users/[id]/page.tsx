"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

type DetailTab =
  | "overview"
  | "transactions"
  | "circles"
  | "interests"
  | "defaults"
  | "donations";

export default function AdminUserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, token, loading: authLoading } = useAuth();
  const isAdmin = user?.role === "admin" || user?.role === "superadmin";

  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<DetailTab>("overview");

  const userId = params.id as string;

  useEffect(() => {
    if (!authLoading && user && !isAdmin) router.replace("/");
  }, [authLoading, user, isAdmin, router]);

  useEffect(() => {
    if (!token || !userId || !isAdmin) {
      setLoading(false);
      return;
    }
    Promise.all([
      fetch(`${API_URL}/api/admin/users/${userId}/comprehensive`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json()),
      fetch(`${API_URL}/api/admin/users/${userId}/dashboard-overview`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json()),
    ])
      .then(([compData, overviewData]) => {
        if (compData.success) {
          setUserData({
            ...compData.data,
            overview: overviewData.success ? overviewData.data : null,
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token, userId, isAdmin]);

  const tabs: { id: DetailTab; label: string; icon: React.ReactNode }[] = [
    { id: "overview", label: "Overview", icon: <Users className="w-4 h-4" /> },
    { id: "transactions", label: "Transactions", icon: <Activity className="w-4 h-4" /> },
    { id: "circles", label: "Circles", icon: <Coins className="w-4 h-4" /> },
    { id: "interests", label: "Interests", icon: <TrendingUp className="w-4 h-4" /> },
    { id: "defaults", label: "Defaults", icon: <AlertTriangle className="w-4 h-4" /> },
    { id: "donations", label: "Donations", icon: <CreditCard className="w-4 h-4" /> },
  ];

  if (loading || authLoading) {
    return (
      <div className="mx-auto max-w-[1280px] p-[clamp(1rem,3vw,2rem)]">
        <div className="p-16 text-center text-[13px] text-slate-500 dark:text-slate-400">
          Loading user details...
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="mx-auto max-w-[1280px] p-[clamp(1rem,3vw,2rem)]">
        <div className="p-16 text-center text-[13px] text-red-500">
          User not found
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1280px] p-[clamp(1rem,3vw,2rem)]">
      <PageHeader
        badgeLabel="Admin"
        heading="User"
        accentText="Details"
        description={`${userData.name} — ${userData.email}`}
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

      <div className="mb-6 flex gap-1 rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-[12px] font-medium transition-colors ${
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

      {activeTab === "overview" && (
        <div>
          <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card padding="1rem">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Main Wallet
              </span>
              <span className="mt-1 block font-mono text-xl font-bold text-slate-900 dark:text-white">
                {formatNaira(userData.overview?.stats?.wallets?.mainWalletBalance ?? userData.walletBalance ?? 0)}
              </span>
            </Card>
            <Card padding="1rem">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Circle Wallet
              </span>
              <span className="mt-1 block font-mono text-xl font-bold text-blue-600">
                {formatNaira(userData.overview?.stats?.wallets?.circleWalletBalance ?? 0)}
              </span>
            </Card>
            <Card padding="1rem">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Total Saved
              </span>
              <span className="mt-1 block font-mono text-xl font-bold text-violet-600">
                {formatNaira(userData.overview?.stats?.savings?.totalSaved ?? 0)}
              </span>
            </Card>
            <Card padding="1rem">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Interest Earned
              </span>
              <span className="mt-1 block font-mono text-xl font-bold text-emerald-600">
                {formatNaira(userData.overview?.stats?.savings?.totalInterest ?? 0)}
              </span>
            </Card>
          </div>
          <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card padding="1rem">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Circle Accounts
              </span>
              <span className="mt-1 block font-mono text-xl font-bold text-slate-900 dark:text-white">
                {userData.overview?.stats?.circleAccounts?.total ?? userData.circleAccounts?.length ?? 0}
              </span>
            </Card>
            <Card padding="1rem">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Transactions
              </span>
              <span className="mt-1 block font-mono text-xl font-bold text-blue-600">
                {userData.overview?.stats?.transactions?.total ?? userData.transactions?.length ?? 0}
              </span>
            </Card>
            <Card padding="1rem">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Outstanding Defaults
              </span>
              <span className="mt-1 block font-mono text-xl font-bold text-amber-600">
                {userData.overview?.stats?.defaults?.outstanding ?? userData.defaults?.length ?? 0}
              </span>
            </Card>
            <Card padding="1rem">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Referrals
              </span>
              <span className="mt-1 block font-mono text-xl font-bold text-emerald-600">
                {userData.userReferrals?.length ?? 0}
              </span>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">
                Profile
              </h4>
              <div className="space-y-2 rounded-xl border border-slate-200 dark:border-slate-700 p-4 text-[13px]">
                <Row label="Name" value={userData.name} />
                <Row label="Email" value={userData.email} />
                <Row label="Role" value={userData.role} />
                <Row label="Account Number" value={userData.accountNumber} />
                <Row label="Account Tier" value={userData.accountTier} />
                <Row label="Referral Code" value={userData.referralCode || "—"} />
                <Row label="Phone" value={userData.phone || "—" } />
                <Row label="Joined" value={new Date(userData.createdAt).toLocaleDateString()} />
              </div>
            </div>
            <div>
              <h4 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">
                Verification & Bank
              </h4>
              <div className="space-y-2 rounded-xl border border-slate-200 dark:border-slate-700 p-4 text-[13px]">
                <Row label="Email Verified" value={userData.emailVerified ? "Yes" : "No"} />
                <Row label="Phone Verified" value={userData.phoneVerified ? "Yes" : "No"} />
                <Row label="2FA Enabled" value={userData.twoFactorEnabled ? "Yes" : "No"} />
                <Row label="KYC Status" value={userData.kyc?.status || "Not submitted"} />
                <Row label="BVN" value={userData.bvn ? "Provided" : "Not provided"} />
                <Row label="NIN" value={userData.nin ? "Provided" : "Not provided"} />
                <Row label="Bank Name" value={userData.bankName || "—" } />
                <Row label="Bank Account" value={userData.bankAccountNumber || "—" } />
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "transactions" && (
        <div>
          <h4 className="mb-4 text-sm font-semibold text-slate-900 dark:text-white">
            Transaction History
          </h4>
          {userData.transactions && userData.transactions.length > 0 ? (
            <SimpleTable
              columns={[
                { key: "type", header: "Type", render: (t: any) => <span className="font-mono text-[11px]">{t.type}</span> },
                { key: "amount", header: "Amount", align: "right", mono: true, render: (t: any) => <span className="font-semibold">{formatNaira(t.amount)}</span> },
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
                { key: "createdAt", header: "Date", render: (t: any) => <span className="text-slate-500 dark:text-slate-400">{new Date(t.createdAt).toLocaleDateString()}</span> },
              ]}
              data={userData.transactions}
              emptyMessage="No transactions found"
            />
          ) : (
            <p className="text-[13px] text-slate-500 dark:text-slate-400">No transactions found.</p>
          )}
        </div>
      )}

      {activeTab === "circles" && (
        <div>
          <h4 className="mb-4 text-sm font-semibold text-slate-900 dark:text-white">
            Circle Memberships
          </h4>
          {userData.circleAccounts && userData.circleAccounts.length > 0 ? (
            <SimpleTable
              columns={[
                { key: "circle.name", header: "Circle", render: (ca: any) => <span className="font-medium">{ca.circle?.name || "—"}</span> },
                { key: "status", header: "Status", render: (ca: any) => (
                  <span className={`rounded-md px-2 py-0.5 font-mono text-[9px] font-bold uppercase border ${
                    ca.status === "active"
                      ? "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50"
                      : "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                  }`}>
                    {ca.status}
                  </span>
                )},
                { key: "principalAmount", header: "Principal", align: "right", mono: true, render: (ca: any) => formatNaira(ca.principalAmount || 0) },
                { key: "interestEarned", header: "Interest", align: "right", mono: true, render: (ca: any) => <span className="text-emerald-600 dark:text-emerald-400">{formatNaira(ca.interestEarned || 0)}</span> },
                { key: "createdAt", header: "Joined", render: (ca: any) => <span className="text-slate-500 dark:text-slate-400">{new Date(ca.createdAt).toLocaleDateString()}</span> },
              ]}
              data={userData.circleAccounts}
              emptyMessage="No circle memberships"
            />
          ) : (
            <p className="text-[13px] text-slate-500 dark:text-slate-400">No circle memberships found.</p>
          )}
        </div>
      )}

      {activeTab === "interests" && (
        <div>
          <h4 className="mb-4 text-sm font-semibold text-slate-900 dark:text-white">
            Interest Logs
          </h4>
          {userData.circleAccounts?.some((ca: any) => ca.interestLogs?.length > 0) ? (
            <SimpleTable
              columns={[
                { key: "circleAccount.circle.name", header: "Circle", render: (log: any) => <span className="font-medium">{log.circleAccount?.circle?.name || "—"}</span> },
                { key: "amount", header: "Amount", align: "right", mono: true, render: (log: any) => <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{formatNaira(log.amount || 0)}</span> },
                { key: "calculatedAt", header: "Date", render: (log: any) => <span className="text-slate-500 dark:text-slate-400">{new Date(log.calculatedAt).toLocaleDateString()}</span> },
              ]}
              data={userData.circleAccounts.flatMap((ca: any) => ca.interestLogs || [])}
              emptyMessage="No interest logs"
            />
          ) : (
            <p className="text-[13px] text-slate-500 dark:text-slate-400">No interest logs found.</p>
          )}
        </div>
      )}

      {activeTab === "defaults" && (
        <div>
          <h4 className="mb-4 text-sm font-semibold text-slate-900 dark:text-white">
            Defaults
          </h4>
          {userData.defaults && userData.defaults.length > 0 ? (
            <SimpleTable
              columns={[
                { key: "weekNumber", header: "Week", render: (d: any) => <span className="font-mono text-[11px]">Week {d.weekNumber}</span> },
                { key: "amount", header: "Amount", align: "right", mono: true, render: (d: any) => <span className="font-semibold">{formatNaira(d.amount || 0)}</span> },
                { key: "status", header: "Status", render: (d: any) => (
                  <span className={`rounded-md px-2 py-0.5 font-mono text-[9px] font-bold uppercase border ${
                    d.status === "outstanding"
                      ? "bg-red-50 text-red-600 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50"
                      : "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50"
                  }`}>
                    {d.status}
                  </span>
                )},
                { key: "circleAccount.circle.name", header: "Circle", render: (d: any) => <span className="font-medium">{d.circleAccount?.circle?.name || "—"}</span> },
                { key: "createdAt", header: "Date", render: (d: any) => <span className="text-slate-500 dark:text-slate-400">{new Date(d.createdAt).toLocaleDateString()}</span> },
              ]}
              data={userData.defaults}
              emptyMessage="No defaults"
            />
          ) : (
            <p className="text-[13px] text-slate-500 dark:text-slate-400">No defaults found.</p>
          )}
        </div>
      )}

      {activeTab === "donations" && (
        <div>
          <h4 className="mb-4 text-sm font-semibold text-slate-900 dark:text-white">
            Donations
          </h4>
          {userData.donations && userData.donations.length > 0 ? (
            <SimpleTable
              columns={[
                { key: "type", header: "Type", render: (d: any) => <span className="font-mono text-[11px]">{d.type}</span> },
                { key: "amount", header: "Amount", align: "right", mono: true, render: (d: any) => <span className="font-semibold">{formatNaira(d.amount || 0)}</span> },
                { key: "status", header: "Status", render: (d: any) => (
                  <span className={`rounded-md px-2 py-0.5 font-mono text-[9px] font-bold uppercase border ${
                    d.status === "completed"
                      ? "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50"
                      : "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50"
                  }`}>
                    {d.status}
                  </span>
                )},
                { key: "createdAt", header: "Date", render: (d: any) => <span className="text-slate-500 dark:text-slate-400">{new Date(d.createdAt).toLocaleDateString()}</span> },
              ]}
              data={userData.donations}
              emptyMessage="No donations"
            />
          ) : (
            <p className="text-[13px] text-slate-500 dark:text-slate-400">No donations found.</p>
          )}
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      <span className="font-medium text-slate-900 dark:text-white">{value || "—"}</span>
    </div>
  );
}
