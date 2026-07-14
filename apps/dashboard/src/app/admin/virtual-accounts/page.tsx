"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, FadeInUp } from "@thrift/ui";
import { formatDate, formatNaira } from "@thrift/utils";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/PageHeader";
import Pagination from "@/components/Pagination";
import { StatusBadge, FilterSelect, ActionMessage, useFlashMessage } from "@/components/AdminShared";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const LIMIT = 20;

interface VAccount {
  id: string;
  provider: string;
  accountNumber: string;
  accountName?: string;
  bankName?: string;
  status: string;
  walletBalance?: number;
  createdAt: string;
  user?: { id: string; name: string; email: string };
}

export default function AdminVirtualAccountsPage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const isAdmin = user?.role === "admin" || user?.role === "superadmin";
  const { message, show } = useFlashMessage();

  const [items, setItems] = useState<VAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState("all");
  const [providerFilter, setProviderFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!authLoading && user && !isAdmin) router.replace("/");
  }, [authLoading, user, isAdmin, router]);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchAll = useCallback(async () => {
    if (!token || !isAdmin) { setLoading(false); return; }
    setLoading(true);
    try {
      const sp = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
      if (statusFilter !== "all") sp.set("status", statusFilter);
      if (providerFilter !== "all") sp.set("provider", providerFilter);
      if (debounced) sp.set("search", debounced);
      const res = await fetch(`${API_URL}/api/admin/virtual-accounts?${sp}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) {
        setItems(data.data.items || []);
        setTotalPages(data.data.totalPages || 1);
        setTotal(data.data.total || 0);
      }
    } catch {}
    setLoading(false);
  }, [token, isAdmin, page, statusFilter, providerFilter, debounced]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const setStatus = async (va: VAccount, status: "active" | "inactive") => {
    setBusyId(va.id);
    try {
      const res = await fetch(`${API_URL}/api/admin/virtual-accounts/${va.id}/status`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) { show("success", `Account ${status}`); fetchAll(); }
      else show("error", data.error || "Failed");
    } catch { show("error", "Failed"); }
    setBusyId(null);
  };

  const generateMissing = async () => {
    setGenerating(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/virtual-accounts/generate`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ provider: "monnify" }),
      });
      const data = await res.json();
      if (data.success) show("success", `Generated ${data.data.created} virtual account(s) for ${data.data.eligible} eligible member(s)`);
      else show("error", data.error || "Failed");
      fetchAll();
    } catch { show("error", "Failed"); }
    setGenerating(false);
  };

  if (authLoading || !isAdmin) return null;

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "clamp(1rem, 3vw, 2rem)" }}>
      <PageHeader badgeLabel="Admin" heading="Virtual" accentText="Accounts" description="Inspect assigned bank accounts used for auto-settlement and monitor their status." />

      <ActionMessage message={message} />

      <FadeInUp delay={200}>
        <Card padding="1.5rem">
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1rem" }}>
            <input
              placeholder="Search account no, email, name..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              style={{ flex: 1, minWidth: "200px", padding: "0.5rem 0.75rem", borderRadius: "0.5rem", border: "1px solid #E5E7EB", fontSize: "12px" }}
            />
            <FilterSelect value={providerFilter} onChange={(v) => { setProviderFilter(v); setPage(1); }} options={["all", "monnify", "flutterwave", "paystack"]} />
            <FilterSelect value={statusFilter} onChange={(v) => { setStatusFilter(v); setPage(1); }} options={["all", "active", "inactive", "pending"]} />
            <button onClick={generateMissing} disabled={generating}
              style={{ padding: "0.5rem 0.75rem", borderRadius: "0.5rem", fontSize: "12px", fontWeight: 600, border: "1px solid #16A34A40", backgroundColor: "#16A34A0F", color: "#16A34A", cursor: "pointer", whiteSpace: "nowrap", opacity: generating ? 0.5 : 1 }}>
              {generating ? "Generating..." : "Generate missing"}
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "3rem", color: "#999", fontSize: "13px" }}>Loading accounts...</div>
          ) : items.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2rem", color: "#999", fontSize: "13px" }}>No virtual accounts found.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", fontSize: "12px", borderCollapse: "collapse", minWidth: "820px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #F0F0F0", color: "#999", textTransform: "uppercase", letterSpacing: "0.1em", fontSize: "9px", fontFamily: "'JetBrains Mono', monospace" }}>
                    <th style={{ paddingBottom: "0.75rem", textAlign: "left", fontWeight: 600 }}>User</th>
                    <th style={{ paddingBottom: "0.75rem", textAlign: "left", fontWeight: 600 }}>Account</th>
                    <th style={{ paddingBottom: "0.75rem", textAlign: "left", fontWeight: 600 }}>Provider</th>
                    <th style={{ paddingBottom: "0.75rem", textAlign: "left", fontWeight: 600 }}>Wallet</th>
                    <th style={{ paddingBottom: "0.75rem", textAlign: "left", fontWeight: 600 }}>Status</th>
                    <th style={{ paddingBottom: "0.75rem", textAlign: "left", fontWeight: 600 }}>Created</th>
                    <th style={{ paddingBottom: "0.75rem", textAlign: "right", fontWeight: 600 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((va) => (
                    <tr key={va.id} style={{ borderBottom: "1px solid #F5F5F5" }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#F9FAFB"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}>
                      <td style={{ padding: "0.75rem 0" }}>
                        <span style={{ fontWeight: 600, color: "#2D2D2D", display: "block" }}>{va.user?.name || "—"}</span>
                        <span style={{ fontSize: "11px", color: "#999" }}>{va.user?.email}</span>
                      </td>
                      <td style={{ padding: "0.75rem 0" }}>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", color: "#2D2D2D", display: "block" }}>{va.accountNumber}</span>
                        <span style={{ fontSize: "11px", color: "#999" }}>{va.bankName || "—"}</span>
                      </td>
                      <td style={{ padding: "0.75rem 0", color: "#717171", textTransform: "capitalize" }}>{va.provider}</td>
                      <td style={{ padding: "0.75rem 0" }}>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: "#2D2D2D" }}>{formatNaira(va.walletBalance || 0)}</span>
                      </td>
                      <td style={{ padding: "0.75rem 0" }}><StatusBadge status={va.status} /></td>
                      <td style={{ padding: "0.75rem 0", color: "#717171" }}>{formatDate(new Date(va.createdAt))}</td>
                      <td style={{ padding: "0.75rem 0", textAlign: "right" }}>
                        <div style={{ display: "flex", gap: "0.375rem", justifyContent: "flex-end" }}>
                          {va.status !== "active" && <button onClick={() => setStatus(va, "active")} disabled={busyId === va.id} style={btn("#059669")}>{busyId === va.id ? "..." : "Activate"}</button>}
                          {va.status !== "inactive" && <button onClick={() => setStatus(va, "inactive")} disabled={busyId === va.id} style={btn("#DC2626")}>{busyId === va.id ? "..." : "Deactivate"}</button>}
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
    </div>
  );
}

function btn(color: string): React.CSSProperties {
  return { padding: "0.25rem 0.5rem", borderRadius: "0.375rem", fontSize: "10px", fontWeight: 600, border: `1px solid ${color}40`, backgroundColor: `${color}0F`, color, cursor: "pointer" };
}
