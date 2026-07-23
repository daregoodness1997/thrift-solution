"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, Button, FadeIn, FadeInUp } from "@thrift/ui";
import { useAuth } from "@/lib/auth-context";
import { Users } from "lucide-react";
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
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Search, edit roles, and manage member accounts.</p>
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
              minWidth="760px"
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
    </div>
  );
}

const inputClass = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white";
