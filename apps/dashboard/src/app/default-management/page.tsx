"use client";

import { useState, useEffect, useCallback } from "react";
import { config, BrandConfig } from "@thrift/config";
import { Card, Button, ColorfulBadge, FadeInUp, StaggerChildren } from "@thrift/ui";
import { formatNaira } from "@thrift/utils";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/PageHeader";

const fallback = config;

interface DefaultItem {
  id: string;
  userId: string;
  userName: string;
  groupName: string;
  amount: number;
  dueDate: string;
  status: string;
  daysOverdue: number;
}

const statusStyles: Record<string, { bg: string; color: string; border: string }> = {
  overdue: { bg: "#FEF2F2", color: "#DC2626", border: "#FECACA" },
  pending: { bg: "#FFFBEB", color: "#D97706", border: "#FDE68A" },
  resolved: { bg: "#ECFDF5", color: "#059669", border: "#A7F3D0" },
};

export default function DefaultManagementPage() {
  const { token } = useAuth();
  const [cfg] = useState<BrandConfig>(config);
  const [defaults, setDefaults] = useState<DefaultItem[]>([]);
  const [filter, setFilter] = useState<"all" | "overdue" | "pending" | "resolved">("all");
  const [showReminder, setShowReminder] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  const fetchDefaults = useCallback(async () => {
    if (!token) { setLoading(false); return; }
    try {
      const res = await fetch(`${API_URL}/api/defaults`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setDefaults(data.data || []);
    } catch {}
    setLoading(false);
  }, [token, API_URL]);

  useEffect(() => { fetchDefaults(); }, [fetchDefaults]);

  const filtered = filter === "all" ? defaults : defaults.filter((d) => d.status === filter);
  const totalOverdue = defaults.filter((d) => d.status === "overdue").reduce((sum, d) => sum + d.amount, 0);
  const totalPending = defaults.filter((d) => d.status === "pending").reduce((sum, d) => sum + d.amount, 0);

  const sendReminder = (id: string) => {
    setShowReminder(id);
    setTimeout(() => setShowReminder(null), 2000);
  };

  const markResolved = async (id: string) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/defaults/${id}/resolve`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setDefaults((prev) => prev.map((d) => d.id === id ? { ...d, status: "resolved", daysOverdue: 0 } : d));
      }
    } catch {}
  };

  if (loading) {
    return (
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "clamp(1rem, 3vw, 2rem)" }}>
        <div style={{ textAlign: "center", padding: "4rem", color: "#999", fontSize: "13px" }}>Loading defaults...</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "clamp(1rem, 3vw, 2rem)" }}>
      <PageHeader
        badgeLabel="Member Management"
        heading="Default"
        accentText="Management"
        description="Track and manage missed contributions across your circles."
      />

      <StaggerChildren staggerDelay={100} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        <Card padding="1.25rem">
          <span style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#999", fontWeight: 700, display: "block" }}>Total Defaults</span>
          <span style={{ fontSize: "1.5rem", fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: "#1A1A1A", display: "block", marginTop: "0.25rem" }}>{defaults.length}</span>
        </Card>
        <Card padding="1.25rem">
          <span style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#999", fontWeight: 700, display: "block" }}>Overdue Amount</span>
          <span style={{ fontSize: "1.5rem", fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: "#DC2626", display: "block", marginTop: "0.25rem" }}>{formatNaira(totalOverdue)}</span>
        </Card>
        <Card padding="1.25rem">
          <span style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#999", fontWeight: 700, display: "block" }}>Pending Amount</span>
          <span style={{ fontSize: "1.5rem", fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: "#D97706", display: "block", marginTop: "0.25rem" }}>{formatNaira(totalPending)}</span>
        </Card>
      </StaggerChildren>

      <FadeInUp delay={300}>
        <Card padding="1.5rem" style={{ marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <ColorfulBadge label="Defaulters" color={cfg.colors.primary} />
            <div style={{ display: "flex", gap: "0.25rem", backgroundColor: "#F5F7F5", borderRadius: "0.5rem", padding: "0.25rem" }}>
              {(["all", "overdue", "pending", "resolved"] as const).map((f) => (
                <button key={f} onClick={() => setFilter(f)}
                  style={{ padding: "0.375rem 0.75rem", borderRadius: "0.375rem", fontSize: "11px", fontWeight: 600, border: "none", cursor: "pointer", transition: "all 0.2s ease", textTransform: "capitalize",
                    backgroundColor: filter === f ? "#ffffff" : "transparent", color: filter === f ? cfg.colors.primary : "#717171",
                    boxShadow: filter === f ? "0 1px 3px rgba(0,0,0,0.08)" : "none" }}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2rem", color: "#999", fontSize: "13px" }}>
              No default records found.
            </div>
          ) : (
            <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
              <table style={{ width: "100%", fontSize: "12px", borderCollapse: "collapse", minWidth: "600px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #F0F0F0", color: "#999", textTransform: "uppercase", letterSpacing: "0.1em", fontSize: "9px", fontFamily: "'JetBrains Mono', monospace" }}>
                    <th style={{ paddingBottom: "0.75rem", textAlign: "left", fontWeight: 600 }}>Member</th>
                    <th style={{ paddingBottom: "0.75rem", textAlign: "left", fontWeight: 600 }}>Circle</th>
                    <th style={{ paddingBottom: "0.75rem", textAlign: "right", fontWeight: 600 }}>Amount</th>
                    <th style={{ paddingBottom: "0.75rem", textAlign: "left", fontWeight: 600 }}>Due Date</th>
                    <th style={{ paddingBottom: "0.75rem", textAlign: "right", fontWeight: 600 }}>Status</th>
                    <th style={{ paddingBottom: "0.75rem", textAlign: "right", fontWeight: 600 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((d) => {
                    const st = statusStyles[d.status] || statusStyles.pending;
                    const initials = d.userName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
                    return (
                      <tr key={d.id} style={{ borderBottom: "1px solid #F5F5F5", transition: "background-color 0.2s ease" }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#F9FAFB"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}>
                        <td style={{ padding: "0.75rem 0" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <div style={{ width: "28px", height: "28px", borderRadius: "50%", backgroundColor: `${cfg.colors.primary}15`, color: cfg.colors.primary, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 700, flexShrink: 0 }}>
                              {initials}
                            </div>
                            <span style={{ fontWeight: 500, color: "#2D2D2D" }}>{d.userName}</span>
                          </div>
                        </td>
                        <td style={{ padding: "0.75rem 0" }}>
                          <span style={{ padding: "0.125rem 0.5rem", borderRadius: "0.375rem", fontSize: "9px", fontWeight: 700, textTransform: "uppercase", fontFamily: "'JetBrains Mono', monospace", backgroundColor: `${cfg.colors.primary}12`, color: cfg.colors.primary, border: `1px solid ${cfg.colors.primary}20` }}>{d.groupName}</span>
                        </td>
                        <td style={{ padding: "0.75rem 0", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: "#2D2D2D" }}>{formatNaira(d.amount)}</td>
                        <td style={{ padding: "0.75rem 0", fontFamily: "'JetBrains Mono', monospace", color: "#717171" }}>
                          {new Date(d.dueDate).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                          {d.daysOverdue > 0 && <span style={{ fontSize: "9px", color: "#DC2626", marginLeft: "0.375rem" }}>({d.daysOverdue}d late)</span>}
                        </td>
                        <td style={{ padding: "0.75rem 0", textAlign: "right" }}>
                          <span style={{ fontSize: "9px", fontWeight: 700, padding: "0.125rem 0.5rem", borderRadius: "0.375rem", backgroundColor: st.bg, color: st.color, border: `1px solid ${st.border}`, textTransform: "capitalize" }}>{d.status}</span>
                        </td>
                        <td style={{ padding: "0.75rem 0", textAlign: "right" }}>
                          <div style={{ display: "flex", gap: "0.375rem", justifyContent: "flex-end" }}>
                            {d.status !== "resolved" && (
                              <>
                                <button onClick={() => sendReminder(d.id)}
                                  style={{ padding: "0.25rem 0.5rem", borderRadius: "0.375rem", fontSize: "10px", fontWeight: 600, border: `1px solid ${cfg.colors.primary}30`, backgroundColor: showReminder === d.id ? "#ECFDF5" : `${cfg.colors.primary}08`, color: cfg.colors.primary, cursor: "pointer", transition: "all 0.2s ease" }}>
                                  {showReminder === d.id ? "Sent!" : "Remind"}
                                </button>
                                <button onClick={() => markResolved(d.id)}
                                  style={{ padding: "0.25rem 0.5rem", borderRadius: "0.375rem", fontSize: "10px", fontWeight: 600, border: "1px solid #A7F3D0", backgroundColor: "#ECFDF5", color: "#059669", cursor: "pointer", transition: "all 0.2s ease" }}>
                                  Resolve
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </FadeInUp>

      <FadeInUp delay={400}>
        <Card padding="1.5rem">
          <div style={{ marginBottom: "1rem" }}>
            <ColorfulBadge label="Policy" color={cfg.colors.accent} />
            <h2 style={{ fontSize: "1.125rem", fontWeight: 500, color: "#1A1A1A", marginTop: "0.5rem" }}>Default Policy Settings</h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 0", borderBottom: "1px solid #F0F0F0" }}>
              <div>
                <span style={{ fontSize: "12px", fontWeight: 500, color: "#2D2D2D", display: "block" }}>Grace Period</span>
                <span style={{ fontSize: "11px", color: "#717171", fontWeight: 300 }}>Days after due date before marking as default</span>
              </div>
              <span style={{ fontSize: "12px", fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: cfg.colors.primary }}>3 days</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 0", borderBottom: "1px solid #F0F0F0" }}>
              <div>
                <span style={{ fontSize: "12px", fontWeight: 500, color: "#2D2D2D", display: "block" }}>Auto-reminders</span>
                <span style={{ fontSize: "11px", color: "#717171", fontWeight: 300 }}>Send automatic reminders to defaulting members</span>
              </div>
              <span style={{ fontSize: "12px", fontWeight: 600, color: "#059669" }}>Enabled</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 0" }}>
              <div>
                <span style={{ fontSize: "12px", fontWeight: 500, color: "#2D2D2D", display: "block" }}>Maximum Defaults</span>
                <span style={{ fontSize: "11px", color: "#717171", fontWeight: 300 }}>Consecutive defaults before member review</span>
              </div>
              <span style={{ fontSize: "12px", fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: cfg.colors.primary }}>2</span>
            </div>
          </div>
        </Card>
      </FadeInUp>
    </div>
  );
}
