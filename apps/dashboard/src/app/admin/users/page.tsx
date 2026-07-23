"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, Button, FadeIn, FadeInUp } from "@thrift/ui";
import { useAuth } from "@/lib/auth-context";
import { Users, Wallet, TrendingUp, Activity, AlertTriangle, Coins, CreditCard, Eye, X } from "lucide-react";
import { formatNaira } from "@thrift/utils";
import Pagination from "@/components/Pagination";
import { SimpleTable, SimpleColumn } from "@/components/SimpleTable";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const LIMIT = 20;
const ROLES = ["member", "support", "finance", "moderator", "admin", "superadmin"];
const TIERS = ["basic", "premium", "platinum"];

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  accountNumber: string;
  accountTier: string;
  referralCode: string;
  deletedAt: string | null;
  createdAt: string;
}

type DetailTab = "overview" | "transactions" | "circles" | "interests" | "defaults" | "donations";

export default function AdminUsersPage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const isAdmin = user?.role === "admin" || user?.role === "superadmin";

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"active" | "suspended">("active");
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [form, setForm] = useState({ name: "", role: "member", accountTier: "basic" });
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [viewingUser, setViewingUser] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailTab, setDetailTab] = useState<DetailTab>("overview");

  useEffect(() => {
    if (!authLoading && user && !isAdmin) router.replace("/");
  }, [authLoading, user, isAdmin, router]);

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const fetchUsers = useCallback(async () => {
    if (!token || !isAdmin) { setLoading(false); return; }
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT), status: statusFilter });
      if (search.trim()) params.set("search", search.trim());
      const res = await fetch(`${API_URL}/api/admin/users?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) {
        setUsers(data.data.items || []);
        setTotalPages(data.data.totalPages || 1);
        setTotal(data.data.total || 0);
      }
    } catch {}
    setLoading(false);
  }, [token, isAdmin, page, statusFilter, search]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const openEdit = (u: AdminUser) => {
    setEditing(u);
    setForm({ name: u.name, role: u.role, accountTier: u.accountTier });
  };

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/users/${editing.id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        showMessage("success", "User updated");
        setEditing(null);
        fetchUsers();
      } else {
        showMessage("error", data.error || "Failed to update user");
      }
    } catch {
      showMessage("error", "Failed to update user");
    }
    setSaving(false);
  };

  const handleToggleSuspend = async (u: AdminUser) => {
    setBusyId(u.id);
    try {
      const action = u.deletedAt ? "reactivate" : "suspend";
      const res = await fetch(`${API_URL}/api/admin/users/${u.id}/${action}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        showMessage("success", u.deletedAt ? "User reactivated" : "User suspended");
        fetchUsers();
      } else {
        showMessage("error", data.error || "Action failed");
      }
    } catch {
      showMessage("error", "Action failed");
    }
    setBusyId(null);
  };

  const openViewDetail = async (u: AdminUser) => {
    if (!token) return;
    setViewingUser(null);
    setDetailTab("overview");
    setLoadingDetail(true);
    try {
      const [compRes, overviewRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/users/${u.id}/comprehensive`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/api/admin/users/${u.id}/dashboard-overview`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      const compData = await compRes.json();
      const overviewData = await overviewRes.json();
      if (compData.success) {
        setViewingUser({
          ...compData.data,
          overview: overviewData.success ? overviewData.data : null,
        });
      } else {
        showMessage("error", compData.error || "Failed to load user details");
      }
    } catch {
      showMessage("error", "Failed to load user details");
    }
    setLoadingDetail(false);
  };

  const closeViewDetail = () => {
    setViewingUser(null);
    setDetailTab("overview");
  };

  const detailTabIcon = (tab: DetailTab) => {
    switch (tab) {
      case "overview": return <Users className="w-4 h-4" />;
      case "transactions": return <Activity className="w-4 h-4" />;
      case "circles": return <Coins className="w-4 h-4" />;
      case "interests": return <TrendingUp className="w-4 h-4" />;
      case "defaults": return <AlertTriangle className="w-4 h-4" />;
      case "donations": return <CreditCard className="w-4 h-4" />;
    }
  };

  if (authLoading) return null;
  if (!isAdmin) return null;

  const columns: SimpleColumn<AdminUser>[] = [
    {
      key: "name",
      header: "User",
      render: (u) => (
        <>
          <span className="block font-semibold text-slate-900 dark:text-white">{u.name}</span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">{u.email}</span>
        </>
      ),
    },
    {
      key: "accountNumber",
      header: "Account",
      mono: true,
      render: (u) => u.accountNumber,
    },
    {
      key: "role",
      header: "Role",
      render: (u) => (
        <span className="rounded-md bg-blue-600/10 px-2 py-0.5 font-mono text-[9px] font-bold uppercase text-blue-600 dark:bg-blue-500/15 dark:text-blue-400">
          {u.role}
        </span>
      ),
    },
    {
      key: "accountTier",
      header: "Tier",
      render: (u) => (
        <span className="capitalize text-slate-500 dark:text-slate-400">{u.accountTier}</span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (u) => (
        <div className="flex justify-end gap-1.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              openViewDetail(u);
            }}
            className="cursor-pointer rounded-md border border-violet-600/20 bg-violet-600/5 px-2 py-1 text-[10px] font-semibold text-violet-600 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-400"
          >
            <Eye className="w-3 h-3 inline mr-0.5" />
            View
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              openEdit(u);
            }}
            className="cursor-pointer rounded-md border border-blue-600/20 bg-blue-600/5 px-2 py-1 text-[10px] font-semibold text-blue-600 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400"
          >
            Edit
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleToggleSuspend(u);
            }}
            disabled={busyId === u.id}
            className={`cursor-pointer rounded-md px-2 py-1 text-[10px] font-semibold ${u.deletedAt ? "border border-emerald-300 bg-emerald-50 text-emerald-600 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-400" : "border border-red-300 bg-red-50 text-red-600 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400"} ${busyId === u.id ? "opacity-50" : ""}`}
          >
            {busyId === u.id ? "..." : u.deletedAt ? "Reactivate" : "Suspend"}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-[1280px] p-[clamp(1rem,3vw,2rem)]">
      <div className="mb-8 pt-2 pb-6 border-b border-slate-200/80 dark:border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/80 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-amber-500" />
              <span>Admin</span>
            </span>
          </div>
          <h3 className="font-display font-bold text-xl sm:text-2xl text-slate-900 dark:text-white mt-1">User <span className="bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 bg-clip-text font-display font-bold text-transparent">Management</span></h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Search, view, edit roles, and manage member accounts.</p>
        </div>
      </div>

      {message && (
        <FadeIn>
          <div className={`mb-6 rounded-2xl border px-4 py-3 text-[13px] font-medium ${message.type === "success" ? "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50" : "bg-red-50 text-red-600 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50"}`}>
            {message.text}
          </div>
        </FadeIn>
      )}

      <FadeInUp delay={200}>
        <Card padding="1.5rem" className="rounded-3xl">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search name, email, account no."
              className="min-w-[260px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
            <div className="flex gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
              {(["active", "suspended"] as const).map((f) => (
                <button key={f} onClick={() => { setStatusFilter(f); setPage(1); }}
                  className={`cursor-pointer rounded-md px-3 py-1.5 text-[11px] font-semibold capitalize transition-colors ${statusFilter === f ? "bg-white text-blue-600 shadow-sm dark:bg-slate-700 dark:text-blue-400" : "text-slate-500 dark:text-slate-400"}`}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-[13px] text-slate-500 dark:text-slate-400">Loading users...</div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-[13px] text-slate-500 dark:text-slate-400">No users found.</div>
          ) : (
            <SimpleTable
              columns={columns}
              data={users}
              minWidth="820px"
            />
          )}
          <Pagination page={page} totalPages={totalPages} total={total} limit={LIMIT} onPageChange={setPage} loading={loading} />
        </Card>
      </FadeInUp>

      {editing && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 p-4" onClick={() => setEditing(null)}>
          <div className="w-full max-w-[440px] rounded-3xl bg-white p-8 shadow-[0_20px_60px_rgba(0,0,0,0.15)] dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
            <span className="inline-block rounded-full bg-blue-600/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:bg-blue-500/15 dark:text-blue-400">Edit User</span>
            <h3 className="mb-1 mt-3 text-base font-semibold text-slate-900 dark:text-white">{editing.email}</h3>
            <p className="mb-6 text-[12px] text-slate-500 dark:text-slate-400">{editing.accountNumber}</p>

            <div className="flex flex-col gap-4">
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold text-slate-900 dark:text-white">Name</label>
                <input type="text" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className={inputClass} />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold text-slate-900 dark:text-white">Role</label>
                <select value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))} className={inputClass}>
                  {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold text-slate-900 dark:text-white">Account Tier</label>
                <select value={form.accountTier} onChange={(e) => setForm((p) => ({ ...p, accountTier: e.target.value }))} className={inputClass}>
                  {TIERS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button className="btn-secondary" onClick={() => setEditing(null)}>Cancel</button>
              <button onClick={handleSave} disabled={saving}
                className={`btn-primary flex-1 ${saving ? "opacity-50" : ""}`}>
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {viewingUser && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-4" onClick={closeViewDetail}>
          <div className="w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 z-10 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600/10 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{viewingUser.name}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{viewingUser.email} · {viewingUser.accountNumber}</p>
                  </div>
                </div>
                <button onClick={closeViewDetail} className="cursor-pointer rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 flex gap-1 overflow-x-auto border-b border-slate-200 dark:border-slate-700">
                {(["overview", "transactions", "circles", "interests", "defaults", "donations"] as DetailTab[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setDetailTab(tab)}
                    className={`flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 text-[12px] font-semibold capitalize transition-colors ${detailTab === tab
                      ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                      : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
                    }`}
                  >
                    {detailTabIcon(tab)}
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-6">
              {loadingDetail ? (
                <div className="p-12 text-center text-[13px] text-slate-500 dark:text-slate-400">Loading user details...</div>
              ) : detailTab === "overview" ? (
                <div>
                  <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card padding="1rem">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Main Wallet</span>
                      <span className="mt-1 block font-mono text-xl font-bold text-slate-900 dark:text-white">{formatNaira(viewingUser.overview?.stats?.wallets?.mainWalletBalance ?? viewingUser.walletBalance ?? 0)}</span>
                    </Card>
                    <Card padding="1rem">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Circle Wallet</span>
                      <span className="mt-1 block font-mono text-xl font-bold text-blue-600">{formatNaira(viewingUser.overview?.stats?.wallets?.circleWalletBalance ?? 0)}</span>
                    </Card>
                    <Card padding="1rem">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Saved</span>
                      <span className="mt-1 block font-mono text-xl font-bold text-violet-600">{formatNaira(viewingUser.overview?.stats?.savings?.totalSaved ?? 0)}</span>
                    </Card>
                    <Card padding="1rem">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Interest Earned</span>
                      <span className="mt-1 block font-mono text-xl font-bold text-emerald-600">{formatNaira(viewingUser.overview?.stats?.savings?.totalInterest ?? 0)}</span>
                    </Card>
                  </div>
                  <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card padding="1rem">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Circle Accounts</span>
                      <span className="mt-1 block font-mono text-xl font-bold text-slate-900 dark:text-white">{viewingUser.overview?.stats?.circleAccounts?.total ?? viewingUser.circleAccounts?.length ?? 0}</span>
                    </Card>
                    <Card padding="1rem">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Transactions</span>
                      <span className="mt-1 block font-mono text-xl font-bold text-blue-600">{viewingUser.overview?.stats?.transactions?.total ?? viewingUser.transactions?.length ?? 0}</span>
                    </Card>
                    <Card padding="1rem">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Outstanding Defaults</span>
                      <span className="mt-1 block font-mono text-xl font-bold text-amber-600">{viewingUser.overview?.stats?.defaults?.outstanding ?? viewingUser.defaults?.length ?? 0}</span>
                    </Card>
                    <Card padding="1rem">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Referrals</span>
                      <span className="mt-1 block font-mono text-xl font-bold text-emerald-600">{viewingUser.userReferrals?.length ?? 0}</span>
                    </Card>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Profile</h4>
                      <div className="space-y-2 rounded-xl border border-slate-200 dark:border-slate-700 p-4 text-[13px]">
                        <Row label="Name" value={viewingUser.name} />
                        <Row label="Email" value={viewingUser.email} />
                        <Row label="Role" value={viewingUser.role} />
                        <Row label="Account Number" value={viewingUser.accountNumber} />
                        <Row label="Account Tier" value={viewingUser.accountTier} />
                        <Row label="Referral Code" value={viewingUser.referralCode || "—"} />
                        <Row label="Phone" value={viewingUser.phone || "—"} />
                        <Row label="Joined" value={new Date(viewingUser.createdAt).toLocaleDateString()} />
                      </div>
                    </div>
                    <div>
                      <h4 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Verification & Bank</h4>
                      <div className="space-y-2 rounded-xl border border-slate-200 dark:border-slate-700 p-4 text-[13px]">
                        <Row label="Email Verified" value={viewingUser.emailVerified ? "Yes" : "No"} />
                        <Row label="Phone Verified" value={viewingUser.phoneVerified ? "Yes" : "No"} />
                        <Row label="2FA Enabled" value={viewingUser.twoFactorEnabled ? "Yes" : "No"} />
                        <Row label="KYC Status" value={viewingUser.kyc?.status || "Not submitted"} />
                        <Row label="BVN" value={viewingUser.bvn ? "Provided" : "Not provided"} />
                        <Row label="NIN" value={viewingUser.nin ? "Provided" : "Not provided"} />
                        <Row label="Bank Name" value={viewingUser.bankName || "—"} />
                        <Row label="Bank Account" value={viewingUser.bankAccountNumber || "—"} />
                      </div>
                    </div>
                  </div>
                </div>
              ) : detailTab === "transactions" ? (
                <div>
                  <h4 className="mb-4 text-sm font-semibold text-slate-900 dark:text-white">Transaction History</h4>
                  {viewingUser.transactions && viewingUser.transactions.length > 0 ? (
                    <SimpleTable
                      columns={[
                        { key: "type", header: "Type", render: (t: any) => <span className="font-mono text-[11px]">{t.type}</span> },
                        { key: "amount", header: "Amount", align: "right", mono: true, render: (t: any) => <span className="font-semibold">{formatNaira(t.amount)}</span> },
                        { key: "status", header: "Status", render: (t: any) => (
                          <span className={`rounded-md px-2 py-0.5 font-mono text-[9px] font-bold uppercase border ${
                            t.status === "completed" ? "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50" :
                            t.status === "pending" ? "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50" :
                            "bg-red-50 text-red-600 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50"
                          }`}>{t.status}</span>
                        )},
                        { key: "createdAt", header: "Date", render: (t: any) => <span className="text-slate-500 dark:text-slate-400">{new Date(t.createdAt).toLocaleDateString()}</span> },
                      ]}
                      data={viewingUser.transactions}
                      minWidth="600px"
                    />
                  ) : (
                    <div className="p-8 text-center text-[13px] text-slate-500 dark:text-slate-400">No transactions found.</div>
                  )}
                </div>
              ) : detailTab === "circles" ? (
                <div>
                  <h4 className="mb-4 text-sm font-semibold text-slate-900 dark:text-white">Circle Memberships</h4>
                  {viewingUser.circleAccounts && viewingUser.circleAccounts.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {viewingUser.circleAccounts.map((a: any) => (
                        <Card key={a.id} padding="1.25rem">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <span className="block text-sm font-semibold text-slate-900 dark:text-white">{a.circleName}</span>
                              <span className="text-[11px] text-slate-500 dark:text-slate-400 capitalize">{a.circleType}</span>
                            </div>
                            <span className={`rounded-md px-2 py-0.5 font-mono text-[9px] font-bold uppercase border ${
                              a.status === "active" ? "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50" :
                              a.status === "matured" ? "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/50" :
                              "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                            }`}>{a.status}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-[12px]">
                            <div><span className="text-slate-500 dark:text-slate-400">Principal</span><br /><span className="font-semibold text-slate-900 dark:text-white">{formatNaira(a.principalAmount)}</span></div>
                            <div><span className="text-slate-500 dark:text-slate-400">Interest</span><br /><span className="font-semibold text-slate-900 dark:text-white">{formatNaira(a.interestEarned)}</span></div>
                            <div><span className="text-slate-500 dark:text-slate-400">Contributed</span><br /><span className="font-semibold text-slate-900 dark:text-white">{a.weeksContributed} wks</span></div>
                            <div><span className="text-slate-500 dark:text-slate-400">Defaults</span><br /><span className="font-semibold text-slate-900 dark:text-white">{a.weeksDefaulted}</span></div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-[13px] text-slate-500 dark:text-slate-400">No circle accounts found.</div>
                  )}
                </div>
              ) : detailTab === "interests" ? (
                <div>
                  <h4 className="mb-4 text-sm font-semibold text-slate-900 dark:text-white">Interest Earned</h4>
                  {viewingUser.circleAccounts && viewingUser.circleAccounts.some((a: any) => a.interestEarned > 0) ? (
                    <div className="space-y-3">
                      {viewingUser.circleAccounts.filter((a: any) => a.interestEarned > 0).map((a: any) => (
                        <Card key={a.id} padding="1rem">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="block text-sm font-semibold text-slate-900 dark:text-white">{a.circleName}</span>
                              <span className="text-[11px] text-slate-500 dark:text-slate-400">Maturity: {new Date(a.maturityDate).toLocaleDateString()}</span>
                            </div>
                            <div className="text-right">
                              <span className="block font-mono text-lg font-bold text-emerald-600">{formatNaira(a.interestEarned)}</span>
                              <span className="text-[11px] text-slate-500 dark:text-slate-400">from {formatNaira(a.principalAmount)}</span>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-[13px] text-slate-500 dark:text-slate-400">No interest earned yet.</div>
                  )}
                </div>
              ) : detailTab === "defaults" ? (
                <div>
                  <h4 className="mb-4 text-sm font-semibold text-slate-900 dark:text-white">Outstanding Defaults</h4>
                  {viewingUser.defaults && viewingUser.defaults.length > 0 ? (
                    <SimpleTable
                      columns={[
                        { key: "circleAccount", header: "Circle", render: (d: any) => <span className="font-medium">{d.circleAccount?.circleName || "—"}</span> },
                        { key: "weekNumber", header: "Week", mono: true, render: (d: any) => <span>W{d.weekNumber}</span> },
                        { key: "amountDue", header: "Amount Due", align: "right", mono: true, render: (d: any) => <span className="font-semibold">{formatNaira(d.amountDue)}</span> },
                        { key: "clearanceAmount", header: "Clearance", align: "right", mono: true, render: (d: any) => <span className="font-semibold text-emerald-600">{formatNaira(d.clearanceAmount)}</span> },
                        { key: "status", header: "Status", render: (d: any) => (
                          <span className={`rounded-md px-2 py-0.5 font-mono text-[9px] font-bold uppercase border ${
                            d.status === "outstanding" ? "bg-red-50 text-red-600 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50" :
                            "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50"
                          }`}>{d.status}</span>
                        )},
                      ]}
                      data={viewingUser.defaults}
                      minWidth="600px"
                    />
                  ) : (
                    <div className="p-8 text-center text-[13px] text-slate-500 dark:text-slate-400">No defaults found.</div>
                  )}
                </div>
              ) : detailTab === "donations" ? (
                <div>
                  <h4 className="mb-4 text-sm font-semibold text-slate-900 dark:text-white">Donations</h4>
                  {viewingUser.donations && viewingUser.donations.length > 0 ? (
                    <SimpleTable
                      columns={[
                        { key: "createdAt", header: "Date", render: (d: any) => <span className="text-slate-500 dark:text-slate-400">{new Date(d.createdAt).toLocaleDateString()}</span> },
                        { key: "itemName", header: "Item", render: (d: any) => <span className="font-medium">{d.itemName || "—"}</span> },
                        { key: "amount", header: "Amount", align: "right", mono: true, render: (d: any) => <span className="font-semibold">{formatNaira(d.amount)}</span> },
                        { key: "status", header: "Status", render: (d: any) => (
                          <span className={`rounded-md px-2 py-0.5 font-mono text-[9px] font-bold uppercase border ${
                            d.status === "completed" ? "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50" :
                            d.status === "pending" ? "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50" :
                            "bg-red-50 text-red-600 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50"
                          }`}>{d.status}</span>
                        )},
                      ]}
                      data={viewingUser.donations}
                      minWidth="600px"
                    />
                  ) : (
                    <div className="p-8 text-center text-[13px] text-slate-500 dark:text-slate-400">No donations found.</div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      <span className="font-medium text-slate-900 dark:text-white">{value}</span>
    </div>
  );
}

const inputClass = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white";
