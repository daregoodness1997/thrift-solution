"use client";

import { useState, useEffect, useCallback } from "react";
import { config, BrandConfig } from "@thrift/config";
import { Card, Button, ColorfulBadge, FadeInUp, StaggerChildren } from "@thrift/ui";
import { formatNaira } from "@thrift/utils";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/PageHeader";
import Pagination from "@/components/Pagination";

const fallback = config;

interface ClearanceItem {
  id: string;
  userId: string;
  userName: string;
  groupName: string;
  cycleNumber: number;
  payoutAmount: number;
  contributed: number;
  status: string;
  clearedDate?: string;
}

const statusStyles: Record<string, { bg: string; color: string; border: string }> = {
  cleared: { bg: "#ECFDF5", color: "#059669", border: "#A7F3D0" },
  partial: { bg: "#FFFBEB", color: "#D97706", border: "#FDE68A" },
  pending: { bg: "#F3F4F6", color: "#6B7280", border: "#E5E7EB" },
};

export default function ClearanceManagementPage() {
  const { token } = useAuth();
  const [cfg] = useState<BrandConfig>(config);
  const [clearances, setClearances] = useState<ClearanceItem[]>([]);
  const [filter, setFilter] = useState<"all" | "cleared" | "partial" | "pending">("all");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [clearStats, setClearStats] = useState({ totalCleared: 0, totalPending: 0 });
  const LIMIT = 20;

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  const fetchClearances = useCallback(async () => {
    if (!token) { setLoading(false); return; }
    try {
      const res = await fetch(`${API_URL}/api/clearances`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setClearances(data.data.clearances || []);
      if (data.data.stats) setClearStats(data.data.stats);
    } catch {}
    setLoading(false);
  }, [token, API_URL]);

  const [paginatedItems, setPaginatedItems] = useState<ClearanceItem[]>([]);
  const [listLoading, setListLoading] = useState(false);

  const fetchPaginatedList = useCallback(async () => {
    if (!token) return;
    setListLoading(true);
    try {
      const statusParam = filter === "all" ? "" : `&status=${filter}`;
      const res = await fetch(`${API_URL}/api/clearances/list?page=${page}&limit=${LIMIT}${statusParam}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) {
        setPaginatedItems(data.data.items || []);
        setTotalPages(data.data.totalPages || 1);
        setTotalItems(data.data.total || 0);
      }
    } catch {}
    setListLoading(false);
  }, [token, page, filter, API_URL]);

  useEffect(() => { fetchClearances(); }, [fetchClearances]);
  useEffect(() => { fetchPaginatedList(); }, [fetchPaginatedList]);

  const filtered = clearances;

  const approveClearance = async (id: string) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/clearances/${id}/approve`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setClearances((prev) => prev.map((c) => c.id === id ? { ...c, status: "cleared", clearedDate: new Date().toISOString() } : c));
      }
    } catch {}
  };

  if (loading) {
    return (
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "clamp(1rem, 3vw, 2rem)" }}>
        <div style={{ textAlign: "center", padding: "4rem", color: "#999", fontSize: "13px" }}>Loading clearances...</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "clamp(1rem, 3vw, 2rem)" }}>
      <PageHeader
        badgeLabel="Circle Operations"
        heading="Clearance"
        accentText="Management"
        description="Verify and approve payout clearances for circle members."
      />

      <StaggerChildren staggerDelay={100} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        <Card padding="1.25rem">
          <span style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#999", fontWeight: 700, display: "block" }}>Total Clearances</span>
          <span style={{ fontSize: "1.5rem", fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: "#1A1A1A", display: "block", marginTop: "0.25rem" }}>{totalItems}</span>
        </Card>
        <Card padding="1.25rem">
          <span style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#999", fontWeight: 700, display: "block" }}>Cleared Amount</span>
          <span style={{ fontSize: "1.5rem", fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: "#059669", display: "block", marginTop: "0.25rem" }}>{formatNaira(clearStats.totalCleared)}</span>
        </Card>
        <Card padding="1.25rem">
          <span style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#999", fontWeight: 700, display: "block" }}>Pending Payout</span>
          <span style={{ fontSize: "1.5rem", fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: "#D97706", display: "block", marginTop: "0.25rem" }}>{formatNaira(clearStats.totalPending)}</span>
        </Card>
      </StaggerChildren>

      <FadeInUp delay={300}>
        <Card padding="1.5rem" style={{ marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
            <ColorfulBadge label="Clearance Records" color={cfg.colors.primary} />
            <div style={{ display: "flex", gap: "0.25rem", backgroundColor: "#F5F7F5", borderRadius: "0.5rem", padding: "0.25rem" }}>
              {(["all", "cleared", "partial", "pending"] as const).map((f) => (
                <button key={f} onClick={() => { setFilter(f); setPage(1); }}
                  style={{ padding: "0.375rem 0.75rem", borderRadius: "0.375rem", fontSize: "11px", fontWeight: 600, border: "none", cursor: "pointer", transition: "all 0.2s ease", textTransform: "capitalize",
                    backgroundColor: filter === f ? "#ffffff" : "transparent", color: filter === f ? cfg.colors.primary : "#717171",
                    boxShadow: filter === f ? "0 1px 3px rgba(0,0,0,0.08)" : "none" }}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          {(listLoading && paginatedItems.length === 0) ? (
            <div style={{ textAlign: "center", padding: "2rem", color: "#999", fontSize: "13px" }}>Loading...</div>
          ) : paginatedItems.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2rem", color: "#999", fontSize: "13px" }}>
              No clearance records found.
            </div>
          ) : (
            <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
              <table style={{ width: "100%", fontSize: "12px", borderCollapse: "collapse", minWidth: "650px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #F0F0F0", color: "#999", textTransform: "uppercase", letterSpacing: "0.1em", fontSize: "9px", fontFamily: "'JetBrains Mono', monospace" }}>
                    <th style={{ paddingBottom: "0.75rem", textAlign: "left", fontWeight: 600 }}>Member</th>
                    <th style={{ paddingBottom: "0.75rem", textAlign: "left", fontWeight: 600 }}>Circle</th>
                    <th style={{ paddingBottom: "0.75rem", textAlign: "right", fontWeight: 600 }}>Cycle</th>
                    <th style={{ paddingBottom: "0.75rem", textAlign: "right", fontWeight: 600 }}>Payout</th>
                    <th style={{ paddingBottom: "0.75rem", textAlign: "right", fontWeight: 600 }}>Progress</th>
                    <th style={{ paddingBottom: "0.75rem", textAlign: "right", fontWeight: 600 }}>Status</th>
                    <th style={{ paddingBottom: "0.75rem", textAlign: "right", fontWeight: 600 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedItems.map((c) => {
                    const st = statusStyles[c.status] || statusStyles.pending;
                    const progress = c.payoutAmount > 0 ? Math.round((c.contributed / c.payoutAmount) * 100) : 0;
                    const initials = c.userName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
                    return (
                      <tr key={c.id} style={{ borderBottom: "1px solid #F5F5F5", transition: "background-color 0.2s ease" }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#F9FAFB"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}>
                        <td style={{ padding: "0.75rem 0" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <div style={{ width: "28px", height: "28px", borderRadius: "50%", backgroundColor: `${cfg.colors.primary}15`, color: cfg.colors.primary, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 700, flexShrink: 0 }}>
                              {initials}
                            </div>
                            <div>
                              <span style={{ fontWeight: 500, color: "#2D2D2D", display: "block" }}>{c.userName}</span>
                              {c.clearedDate && <span style={{ fontSize: "9px", color: "#717171" }}>Cleared {new Date(c.clearedDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>}
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: "0.75rem 0" }}>
                          <span style={{ padding: "0.125rem 0.5rem", borderRadius: "0.375rem", fontSize: "9px", fontWeight: 700, textTransform: "uppercase", fontFamily: "'JetBrains Mono', monospace", backgroundColor: `${cfg.colors.primary}12`, color: cfg.colors.primary, border: `1px solid ${cfg.colors.primary}20` }}>{c.groupName}</span>
                        </td>
                        <td style={{ padding: "0.75rem 0", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: "#2D2D2D" }}>#{c.cycleNumber}</td>
                        <td style={{ padding: "0.75rem 0", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: "#2D2D2D" }}>{formatNaira(c.payoutAmount)}</td>
                        <td style={{ padding: "0.75rem 0", textAlign: "right" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", justifyContent: "flex-end" }}>
                            <div style={{ width: "60px", height: "4px", backgroundColor: "#F0F0F0", borderRadius: "9999px", overflow: "hidden" }}>
                              <div style={{ height: "100%", backgroundColor: progress === 100 ? "#059669" : cfg.colors.primary, borderRadius: "9999px", width: `${progress}%`, transition: "width 0.5s ease" }} />
                            </div>
                            <span style={{ fontSize: "10px", fontFamily: "'JetBrains Mono', monospace", color: "#717171" }}>{progress}%</span>
                          </div>
                        </td>
                        <td style={{ padding: "0.75rem 0", textAlign: "right" }}>
                          <span style={{ fontSize: "9px", fontWeight: 700, padding: "0.125rem 0.5rem", borderRadius: "0.375rem", backgroundColor: st.bg, color: st.color, border: `1px solid ${st.border}`, textTransform: "capitalize" }}>{c.status}</span>
                        </td>
                        <td style={{ padding: "0.75rem 0", textAlign: "right" }}>
                          {c.status !== "cleared" && (
                            <button onClick={() => approveClearance(c.id)}
                              style={{ padding: "0.25rem 0.5rem", borderRadius: "0.375rem", fontSize: "10px", fontWeight: 600, border: `1px solid ${cfg.colors.primary}30`, backgroundColor: `${cfg.colors.primary}08`, color: cfg.colors.primary, cursor: "pointer", transition: "all 0.2s ease" }}>
                              Approve
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <Pagination page={page} totalPages={totalPages} total={totalItems} limit={LIMIT} onPageChange={setPage} loading={listLoading} />
        </Card>
      </FadeInUp>

      <FadeInUp delay={400}>
        <Card padding="1.5rem">
          <div style={{ marginBottom: "1rem" }}>
            <ColorfulBadge label="Clearance Process" color={cfg.colors.accent} />
            <h2 style={{ fontSize: "1.125rem", fontWeight: 500, color: "#1A1A1A", marginTop: "0.5rem" }}>How Clearance Works</h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
            {[
              { step: 1, title: "Cycle Completion", desc: "All members complete their contributions for the current cycle.", color: cfg.colors.primary },
              { step: 2, title: "Payout Eligibility", desc: "The designated recipient is verified for clearance eligibility.", color: "#8A7D73" },
              { step: 3, title: "Clearance Approval", desc: "Circle leader or admin reviews and approves the payout.", color: "#3D4D40" },
              { step: 4, title: "Funds Disbursed", desc: "Wallet balance is credited and payout is recorded.", color: "#059669" },
            ].map((item, i) => (
              <div key={item.step} style={{ display: "flex", gap: "1rem", padding: "1rem 0", borderBottom: i < 3 ? "1px solid #F0F0F0" : "none" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "50%", backgroundColor: `${item.color}15`, color: item.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", flexShrink: 0 }}>
                  {item.step}
                </div>
                <div>
                  <span style={{ fontSize: "12px", fontWeight: 600, color: "#2D2D2D", display: "block" }}>{item.title}</span>
                  <span style={{ fontSize: "11px", color: "#717171", fontWeight: 300 }}>{item.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </FadeInUp>
    </div>
  );
}
