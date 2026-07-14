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
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "clamp(1rem, 3vw, 2rem)" }}>
      <PageHeader badgeLabel="Admin" heading="User" accentText="Management" description="Search, edit roles, and manage member accounts." />

      {message && (
        <FadeIn>
          <div style={{ padding: "0.75rem 1rem", borderRadius: "0.75rem", marginBottom: "1.5rem", fontSize: "13px", fontWeight: 500, backgroundColor: message.type === "success" ? "#ECFDF5" : "#FEF2F2", color: message.type === "success" ? "#059669" : "#DC2626", border: `1px solid ${message.type === "success" ? "#A7F3D0" : "#FECACA"}` }}>
            {message.text}
          </div>
        </FadeIn>
      )}

      <FadeInUp delay={200}>
        <Card padding="1.5rem">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.75rem" }}>
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search name, email, account no."
              style={{ padding: "0.5rem 0.75rem", borderRadius: "0.5rem", border: "1px solid #E5E7EB", fontSize: "13px", outline: "none", minWidth: "260px" }}
            />
            <div style={{ display: "flex", gap: "0.25rem", backgroundColor: "#F5F7F5", borderRadius: "0.5rem", padding: "0.25rem" }}>
              {(["active", "suspended"] as const).map((f) => (
                <button key={f} onClick={() => { setStatusFilter(f); setPage(1); }}
                  style={{ padding: "0.375rem 0.75rem", borderRadius: "0.375rem", fontSize: "11px", fontWeight: 600, border: "none", cursor: "pointer", textTransform: "capitalize",
                    backgroundColor: statusFilter === f ? "#ffffff" : "transparent", color: statusFilter === f ? config.colors.primary : "#717171",
                    boxShadow: statusFilter === f ? "0 1px 3px rgba(0,0,0,0.08)" : "none" }}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "3rem", color: "#999", fontSize: "13px" }}>Loading users...</div>
          ) : users.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2rem", color: "#999", fontSize: "13px" }}>No users found.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", fontSize: "12px", borderCollapse: "collapse", minWidth: "760px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #F0F0F0", color: "#999", textTransform: "uppercase", letterSpacing: "0.1em", fontSize: "9px", fontFamily: "'JetBrains Mono', monospace" }}>
                    <th style={{ paddingBottom: "0.75rem", textAlign: "left", fontWeight: 600 }}>User</th>
                    <th style={{ paddingBottom: "0.75rem", textAlign: "left", fontWeight: 600 }}>Account</th>
                    <th style={{ paddingBottom: "0.75rem", textAlign: "left", fontWeight: 600 }}>Role</th>
                    <th style={{ paddingBottom: "0.75rem", textAlign: "left", fontWeight: 600 }}>Tier</th>
                    <th style={{ paddingBottom: "0.75rem", textAlign: "right", fontWeight: 600 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} style={{ borderBottom: "1px solid #F5F5F5" }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#F9FAFB"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}>
                      <td style={{ padding: "0.75rem 0" }}>
                        <span style={{ fontWeight: 600, color: "#2D2D2D", display: "block" }}>{u.name}</span>
                        <span style={{ fontSize: "11px", color: "#999" }}>{u.email}</span>
                      </td>
                      <td style={{ padding: "0.75rem 0", fontFamily: "'JetBrains Mono', monospace", color: "#717171" }}>{u.accountNumber}</td>
                      <td style={{ padding: "0.75rem 0" }}>
                        <span style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase", fontFamily: "'JetBrains Mono', monospace", padding: "0.125rem 0.5rem", borderRadius: "0.375rem", backgroundColor: `${config.colors.primary}12`, color: config.colors.primary }}>{u.role}</span>
                      </td>
                      <td style={{ padding: "0.75rem 0", textTransform: "capitalize", color: "#717171" }}>{u.accountTier}</td>
                      <td style={{ padding: "0.75rem 0", textAlign: "right" }}>
                        <div style={{ display: "flex", gap: "0.375rem", justifyContent: "flex-end" }}>
                          <button onClick={() => openEdit(u)}
                            style={{ padding: "0.25rem 0.5rem", borderRadius: "0.375rem", fontSize: "10px", fontWeight: 600, border: `1px solid ${config.colors.primary}30`, backgroundColor: `${config.colors.primary}08`, color: config.colors.primary, cursor: "pointer" }}>
                            Edit
                          </button>
                          <button onClick={() => handleToggleSuspend(u)} disabled={busyId === u.id}
                            style={{ padding: "0.25rem 0.5rem", borderRadius: "0.375rem", fontSize: "10px", fontWeight: 600, border: `1px solid ${u.deletedAt ? "#A7F3D0" : "#FECACA"}`, backgroundColor: u.deletedAt ? "#ECFDF5" : "#FEF2F2", color: u.deletedAt ? "#059669" : "#DC2626", cursor: "pointer", opacity: busyId === u.id ? 0.5 : 1 }}>
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
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "1rem" }} onClick={() => setEditing(null)}>
          <div style={{ backgroundColor: "#fff", borderRadius: "1rem", padding: "2rem", maxWidth: "440px", width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }} onClick={(e) => e.stopPropagation()}>
            <ColorfulBadge label="Edit User" color={config.colors.primary} />
            <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#1A1A1A", margin: "0.75rem 0 0.25rem" }}>{editing.email}</h3>
            <p style={{ fontSize: "12px", color: "#717171", marginBottom: "1.5rem" }}>{editing.accountNumber}</p>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={labelStyle}>Name</label>
                <input type="text" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Role</label>
                <select value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))} style={inputStyle}>
                  {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Account Tier</label>
                <select value={form.accountTier} onChange={(e) => setForm((p) => ({ ...p, accountTier: e.target.value }))} style={inputStyle}>
                  {TIERS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem" }}>
              <Button variant="secondary" size="sm" onClick={() => setEditing(null)}>Cancel</Button>
              <button onClick={handleSave} disabled={saving}
                style={{ flex: 1, padding: "0.625rem", borderRadius: "0.5rem", border: "none", backgroundColor: config.colors.primary, color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer", opacity: saving ? 0.5 : 1 }}>
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const labelStyle: React.CSSProperties = { fontSize: "11px", fontWeight: 600, color: "#2D2D2D", display: "block", marginBottom: "0.375rem" };
const inputStyle: React.CSSProperties = { width: "100%", padding: "0.5rem 0.75rem", borderRadius: "0.5rem", border: "1px solid #E5E7EB", fontSize: "13px", outline: "none", boxSizing: "border-box", backgroundColor: "#fff" };
