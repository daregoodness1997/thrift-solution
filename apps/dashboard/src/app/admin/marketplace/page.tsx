"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, FadeInUp } from "@thrift/ui";
import { formatNaira, formatDate } from "@thrift/utils";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/PageHeader";
import Pagination from "@/components/Pagination";
import { StatusBadge, FilterSelect, ActionMessage, useFlashMessage } from "@/components/AdminShared";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const LIMIT = 20;

interface Listing {
  id: string;
  title: string;
  price: number;
  currency?: string;
  category: string;
  status: string;
  createdAt: string;
  seller?: { id: string; name: string; email: string };
  _count?: { offers: number };
}

export default function AdminMarketplacePage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const isAdmin = user?.role === "admin" || user?.role === "superadmin";
  const { message, show } = useFlashMessage();

  const [items, setItems] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

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
      if (debounced) sp.set("search", debounced);
      const res = await fetch(`${API_URL}/api/admin/marketplace?${sp}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) {
        setItems(data.data.items || []);
        setTotalPages(data.data.totalPages || 1);
        setTotal(data.data.total || 0);
      }
    } catch {}
    setLoading(false);
  }, [token, isAdmin, page, statusFilter, debounced]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const setStatus = async (l: Listing, status: "active" | "removed" | "sold") => {
    setBusyId(l.id);
    try {
      const res = await fetch(`${API_URL}/api/admin/marketplace/${l.id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) { show("success", `Listing marked ${status}`); fetchAll(); }
      else show("error", data.error || "Failed");
    } catch { show("error", "Failed"); }
    setBusyId(null);
  };

  const remove = async (l: Listing) => {
    setBusyId(l.id);
    try {
      const res = await fetch(`${API_URL}/api/admin/marketplace/${l.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) { show("success", "Listing removed"); fetchAll(); }
      else show("error", data.error || "Failed");
    } catch { show("error", "Failed"); }
    setBusyId(null);
  };

  if (authLoading || !isAdmin) return null;

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "clamp(1rem, 3vw, 2rem)" }}>
      <PageHeader badgeLabel="Admin" heading="Marketplace" accentText="Moderation" description="Approve, reject, or remove member marketplace listings." />

      <ActionMessage message={message} />

      <FadeInUp delay={200}>
        <Card padding="1.5rem">
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1rem" }}>
            <input
              placeholder="Search title, description..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              style={{ flex: 1, minWidth: "200px", padding: "0.5rem 0.75rem", borderRadius: "0.5rem", border: "1px solid #E5E7EB", fontSize: "12px" }}
            />
            <FilterSelect value={statusFilter} onChange={(v) => { setStatusFilter(v); setPage(1); }} options={["all", "active", "removed", "sold", "pending"]} />
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "3rem", color: "#999", fontSize: "13px" }}>Loading listings...</div>
          ) : items.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2rem", color: "#999", fontSize: "13px" }}>No listings found.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", fontSize: "12px", borderCollapse: "collapse", minWidth: "820px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #F0F0F0", color: "#999", textTransform: "uppercase", letterSpacing: "0.1em", fontSize: "9px", fontFamily: "'JetBrains Mono', monospace" }}>
                    <th style={{ paddingBottom: "0.75rem", textAlign: "left", fontWeight: 600 }}>Title</th>
                    <th style={{ paddingBottom: "0.75rem", textAlign: "right", fontWeight: 600 }}>Price</th>
                    <th style={{ paddingBottom: "0.75rem", textAlign: "left", fontWeight: 600 }}>Seller</th>
                    <th style={{ paddingBottom: "0.75rem", textAlign: "left", fontWeight: 600 }}>Status</th>
                    <th style={{ paddingBottom: "0.75rem", textAlign: "left", fontWeight: 600 }}>Date</th>
                    <th style={{ paddingBottom: "0.75rem", textAlign: "right", fontWeight: 600 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((l) => (
                    <tr key={l.id} style={{ borderBottom: "1px solid #F5F5F5" }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#F9FAFB"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}>
                      <td style={{ padding: "0.75rem 0" }}>
                        <span style={{ fontWeight: 600, color: "#2D2D2D", display: "block" }}>{l.title}</span>
                        <span style={{ fontSize: "11px", color: "#999" }}>{l.category} · {l._count?.offers ?? 0} offers</span>
                      </td>
                      <td style={{ padding: "0.75rem 0", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: "#2D2D2D" }}>{formatNaira(l.price)}</td>
                      <td style={{ padding: "0.75rem 0" }}>
                        <span style={{ color: "#717171", display: "block" }}>{l.seller?.name || "—"}</span>
                        <span style={{ fontSize: "11px", color: "#999" }}>{l.seller?.email}</span>
                      </td>
                      <td style={{ padding: "0.75rem 0" }}><StatusBadge status={l.status} /></td>
                      <td style={{ padding: "0.75rem 0", color: "#717171" }}>{formatDate(new Date(l.createdAt))}</td>
                      <td style={{ padding: "0.75rem 0", textAlign: "right" }}>
                        <div style={{ display: "flex", gap: "0.375rem", justifyContent: "flex-end" }}>
                          {l.status !== "active" && <button onClick={() => setStatus(l, "active")} disabled={busyId === l.id} style={btn("#059669")}>Approve</button>}
                          {l.status !== "removed" && <button onClick={() => setStatus(l, "removed")} disabled={busyId === l.id} style={btn("#D97706")}>Hide</button>}
                          {l.status !== "sold" && <button onClick={() => setStatus(l, "sold")} disabled={busyId === l.id} style={btn("#2563EB")}>Sold</button>}
                          <button onClick={() => remove(l)} disabled={busyId === l.id} style={btn("#DC2626")}>Delete</button>
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
  return { padding: "0.25rem 0.5rem", borderRadius: "0.375rem", fontSize: "10px", fontWeight: 600, border: `1px solid ${color}40`, backgroundColor: `${color}0F`, color, cursor: "pointer", opacity: 1 };
}
