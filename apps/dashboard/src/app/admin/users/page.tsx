"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { config } from "@thrift/config";
import { Card, Button, ColorfulBadge, FadeIn, FadeInUp } from "@thrift/ui";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/PageHeader";
import Pagination from "@/components/Pagination";

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

  return (
    <div className="mx-auto max-w-[1280px] p-[clamp(1rem,3vw,2rem)]">
      <PageHeader badgeLabel="Admin" heading="User" accentText="Management" description="Search, edit roles, and manage member accounts." />

      {message && (
        <FadeIn>
          <div className={`mb-6 rounded-xl border px-4 py-3 text-[13px] font-medium ${message.type === "success" ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-red-50 text-red-600 border-red-200"}`}>
            {message.text}
          </div>
        </FadeIn>
      )}

      <FadeInUp delay={200}>
        <Card padding="1.5rem">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search name, email, account no."
              className="min-w-[260px] rounded-lg border border-gray-200 px-3 py-2 text-[13px] outline-none"
            />
            <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
              {(["active", "suspended"] as const).map((f) => (
                <button key={f} onClick={() => { setStatusFilter(f); setPage(1); }}
                  className="cursor-pointer rounded-md px-3 py-1.5 text-[11px] font-semibold capitalize"
                  style={{ backgroundColor: statusFilter === f ? "#ffffff" : "transparent", color: statusFilter === f ? config.colors.primary : "#717171", boxShadow: statusFilter === f ? "0 1px 3px rgba(0,0,0,0.08)" : "none" }}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-[13px] text-gray-500">Loading users...</div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-[13px] text-gray-500">No users found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[12px] min-w-[760px]">
                <thead>
                  <tr className="border-b border-gray-100 font-mono text-[9px] uppercase tracking-[0.1em] text-gray-500">
                    <th className="pb-3 text-left font-semibold">User</th>
                    <th className="pb-3 text-left font-semibold">Account</th>
                    <th className="pb-3 text-left font-semibold">Role</th>
                    <th className="pb-3 text-left font-semibold">Tier</th>
                    <th className="pb-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3">
                        <span className="block font-semibold text-brand-dark">{u.name}</span>
                        <span className="text-[11px] text-gray-500">{u.email}</span>
                      </td>
                      <td className="py-3 font-mono text-gray-500">{u.accountNumber}</td>
                      <td className="py-3">
                        <span className="rounded-md px-2 py-0.5 font-mono text-[9px] font-bold uppercase" style={{ backgroundColor: `${config.colors.primary}12`, color: config.colors.primary }}>{u.role}</span>
                      </td>
                      <td className="py-3 capitalize text-gray-500">{u.accountTier}</td>
                      <td className="py-3 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button onClick={() => openEdit(u)}
                            className="cursor-pointer rounded-md px-2 py-1 text-[10px] font-semibold"
                            style={{ border: `1px solid ${config.colors.primary}30`, backgroundColor: `${config.colors.primary}08`, color: config.colors.primary }}>
                            Edit
                          </button>
                          <button onClick={() => handleToggleSuspend(u)} disabled={busyId === u.id}
                            className="cursor-pointer rounded-md px-2 py-1 text-[10px] font-semibold"
                            style={{ border: `1px solid ${u.deletedAt ? "#A7F3D0" : "#FECACA"}`, backgroundColor: u.deletedAt ? "#ECFDF5" : "#FEF2F2", color: u.deletedAt ? "#059669" : "#DC2626", opacity: busyId === u.id ? 0.5 : 1 }}>
                            {busyId === u.id ? "..." : u.deletedAt ? "Reactivate" : "Suspend"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Pagination page={page} totalPages={totalPages} total={total} limit={LIMIT} onPageChange={setPage} loading={loading} />
        </Card>
      </FadeInUp>

      {editing && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 p-4" onClick={() => setEditing(null)}>
          <div className="w-full max-w-[440px] rounded-2xl bg-white p-8 shadow-[0_20px_60px_rgba(0,0,0,0.15)]" onClick={(e) => e.stopPropagation()}>
            <ColorfulBadge label="Edit User" color={config.colors.primary} />
            <h3 className="mb-1 mt-3 text-base font-semibold text-brand-dark">{editing.email}</h3>
            <p className="mb-6 text-[12px] text-gray-500">{editing.accountNumber}</p>

            <div className="flex flex-col gap-4">
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold text-brand-dark">Name</label>
                <input type="text" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className={inputClass} />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold text-brand-dark">Role</label>
                <select value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))} className={inputClass}>
                  {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold text-brand-dark">Account Tier</label>
                <select value={form.accountTier} onChange={(e) => setForm((p) => ({ ...p, accountTier: e.target.value }))} className={inputClass}>
                  {TIERS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <Button variant="secondary" size="sm" onClick={() => setEditing(null)}>Cancel</Button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 cursor-pointer rounded-lg px-2.5 py-2.5 text-[13px] font-semibold text-white"
                style={{ backgroundColor: config.colors.primary, opacity: saving ? 0.5 : 1 }}>
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const inputClass = "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-[13px] outline-none";
