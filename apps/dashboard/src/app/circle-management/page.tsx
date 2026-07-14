"use client";

import { useState, useEffect, useCallback } from "react";
import { config, BrandConfig } from "@thrift/config";
import { Card, Button, ColorfulBadge, FadeIn, FadeInUp, StaggerChildren } from "@thrift/ui";
import { formatNaira } from "@thrift/utils";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/PageHeader";
import Pagination from "@/components/Pagination";

const fallback = config;

interface Circle {
  id: string;
  name: string;
  description?: string;
  amount: number;
  durationMonths: number;
  interestRateAnnual: number;
  maxAccountsPerUser: number;
  autoPayout: boolean;
  status: string;
  _count?: { accounts: number };
}

interface CircleFormData {
  name: string;
  description: string;
  amount: string;
  durationMonths: string;
  interestRateAnnual: string;
  maxAccountsPerUser: string;
  autoPayout: boolean;
}

const emptyForm: CircleFormData = {
  name: "",
  description: "",
  amount: "",
  durationMonths: "",
  interestRateAnnual: "",
  maxAccountsPerUser: "10",
  autoPayout: false,
};

function formatDuration(months: number) {
  if (months < 12) return `${months}mo`;
  const y = Math.floor(months / 12);
  const m = months % 12;
  return m > 0 ? `${y}y ${m}mo` : `${y}y`;
}

export default function CircleManagementPage() {
  const { token } = useAuth();
  const [cfg] = useState<BrandConfig>(fallback);
  const [circles, setCircles] = useState<Circle[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editingCircle, setEditingCircle] = useState<Circle | null>(null);
  const [form, setForm] = useState<CircleFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [runningJob, setRunningJob] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const LIMIT = 20;
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  const stats = {
    total: circles.length,
    active: circles.filter((c) => c.status === "active").length,
    inactive: circles.filter((c) => c.status === "inactive").length,
    totalAccounts: circles.reduce((sum, c) => sum + (c._count?.accounts || 0), 0),
  };

  const fetchCircles = useCallback(async () => {
    if (!token) { setLoading(false); return; }
    try {
      const statusParam = filter !== "all" ? `&status=${filter}` : "";
      const res = await fetch(`${API_URL}/api/circles?page=${page}&limit=${LIMIT}${statusParam}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setCircles(data.data.items || []);
        setTotalPages(data.data.totalPages || 1);
        setTotal(data.data.total || 0);
      }
    } catch {}
    setLoading(false);
  }, [token, API_URL, page, filter]);

  useEffect(() => { fetchCircles(); }, [fetchCircles]);

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const openCreateModal = () => {
    setEditingCircle(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEditModal = (circle: Circle) => {
    setEditingCircle(circle);
    setForm({
      name: circle.name,
      description: circle.description || "",
      amount: String(circle.amount),
      durationMonths: String(circle.durationMonths),
      interestRateAnnual: String(circle.interestRateAnnual),
      maxAccountsPerUser: String(circle.maxAccountsPerUser),
      autoPayout: circle.autoPayout,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.amount || !form.durationMonths || !form.interestRateAnnual) {
      showMessage("error", "Name, amount, duration, and interest rate are required");
      return;
    }
    setSaving(true);
    try {
      const body = {
        name: form.name,
        description: form.description || undefined,
        amount: Number(form.amount),
        durationMonths: Number(form.durationMonths),
        interestRateAnnual: Number(form.interestRateAnnual),
        maxAccountsPerUser: Number(form.maxAccountsPerUser) || 10,
        autoPayout: form.autoPayout,
      };

      const url = editingCircle ? `${API_URL}/api/circles/${editingCircle.id}` : `${API_URL}/api/circles`;
      const method = editingCircle ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        showMessage("success", editingCircle ? "Circle updated successfully" : "Circle created successfully");
        setShowModal(false);
        fetchCircles();
      } else {
        showMessage("error", data.error || "Failed to save circle");
      }
    } catch {
      showMessage("error", "Failed to save circle");
    }
    setSaving(false);
  };

  const handleToggleStatus = async (circle: Circle) => {
    setTogglingId(circle.id);
    try {
      const newStatus = circle.status === "active" ? "inactive" : "active";
      const res = await fetch(`${API_URL}/api/circles/${circle.id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        showMessage("success", `Circle ${newStatus === "active" ? "activated" : "deactivated"}`);
        fetchCircles();
      } else {
        showMessage("error", data.error || "Failed to update status");
      }
    } catch {
      showMessage("error", "Failed to update circle status");
    }
    setTogglingId(null);
  };

  const handleRunInterestJob = async () => {
    setRunningJob(true);
    try {
      const res = await fetch(`${API_URL}/api/circles/admin/run-interest-job`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        const r = data.data;
        showMessage("success", `Interest job completed: ${r.processed} processed, ${r.errors} errors, ${r.total} total`);
      } else {
        showMessage("error", data.error || "Failed to run interest job");
      }
    } catch {
      showMessage("error", "Failed to run interest job");
    }
    setRunningJob(false);
  };

  const handleFilterChange = (f: typeof filter) => {
    setFilter(f);
    setPage(1);
  };

  if (loading) {
    return (
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "clamp(1rem, 3vw, 2rem)" }}>
        <div style={{ textAlign: "center", padding: "4rem", color: "#999", fontSize: "13px" }}>Loading circles...</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "clamp(1rem, 3vw, 2rem)" }}>
      <PageHeader
        badgeLabel="Admin"
        heading="Circle"
        accentText="Management"
        description="Create, configure, and manage circle savings products."
        right={
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <Button variant="secondary" size="sm" disabled={runningJob} onClick={handleRunInterestJob}>
              {runningJob ? "Running..." : "Run Interest Job"}
            </Button>
            <Button variant="primary" size="sm" onClick={openCreateModal}>
              + New Circle
            </Button>
          </div>
        }
      />

      {message && (
        <FadeIn>
          <div style={{ padding: "0.75rem 1rem", borderRadius: "0.75rem", marginBottom: "1.5rem", fontSize: "13px", fontWeight: 500, backgroundColor: message.type === "success" ? "#ECFDF5" : "#FEF2F2", color: message.type === "success" ? "#059669" : "#DC2626", border: `1px solid ${message.type === "success" ? "#A7F3D0" : "#FECACA"}` }}>
            {message.text}
          </div>
        </FadeIn>
      )}

      <StaggerChildren staggerDelay={100} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        <Card padding="1.25rem">
          <span style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#999", fontWeight: 700, display: "block" }}>Total Circles</span>
          <span style={{ fontSize: "1.5rem", fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: "#1A1A1A", display: "block", marginTop: "0.25rem" }}>{stats.total}</span>
        </Card>
        <Card padding="1.25rem">
          <span style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#999", fontWeight: 700, display: "block" }}>Active</span>
          <span style={{ fontSize: "1.5rem", fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: "#059669", display: "block", marginTop: "0.25rem" }}>{stats.active}</span>
        </Card>
        <Card padding="1.25rem">
          <span style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#999", fontWeight: 700, display: "block" }}>Inactive</span>
          <span style={{ fontSize: "1.5rem", fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: "#D97706", display: "block", marginTop: "0.25rem" }}>{stats.inactive}</span>
        </Card>
        <Card padding="1.25rem">
          <span style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#999", fontWeight: 700, display: "block" }}>Total Accounts</span>
          <span style={{ fontSize: "1.5rem", fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: "#1A1A1A", display: "block", marginTop: "0.25rem" }}>{stats.totalAccounts}</span>
        </Card>
      </StaggerChildren>

      <FadeInUp delay={300}>
        <Card padding="1.5rem">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.75rem" }}>
            <ColorfulBadge label="Circles" color={cfg.colors.primary} />
            <div style={{ display: "flex", gap: "0.25rem", backgroundColor: "#F5F7F5", borderRadius: "0.5rem", padding: "0.25rem" }}>
              {(["all", "active", "inactive"] as const).map((f) => (
                <button key={f} onClick={() => handleFilterChange(f)}
                  style={{ padding: "0.375rem 0.75rem", borderRadius: "0.375rem", fontSize: "11px", fontWeight: 600, border: "none", cursor: "pointer", transition: "all 0.2s ease", textTransform: "capitalize",
                    backgroundColor: filter === f ? "#ffffff" : "transparent", color: filter === f ? cfg.colors.primary : "#717171",
                    boxShadow: filter === f ? "0 1px 3px rgba(0,0,0,0.08)" : "none" }}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          {circles.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2rem", color: "#999", fontSize: "13px" }}>
              No circles found. Click "+ New Circle" to create one.
            </div>
          ) : (
            <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
              <table style={{ width: "100%", fontSize: "12px", borderCollapse: "collapse", minWidth: "800px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #F0F0F0", color: "#999", textTransform: "uppercase", letterSpacing: "0.1em", fontSize: "9px", fontFamily: "'JetBrains Mono', monospace" }}>
                    <th style={{ paddingBottom: "0.75rem", textAlign: "left", fontWeight: 600 }}>Name</th>
                    <th style={{ paddingBottom: "0.75rem", textAlign: "right", fontWeight: 600 }}>Amount</th>
                    <th style={{ paddingBottom: "0.75rem", textAlign: "left", fontWeight: 600 }}>Duration</th>
                    <th style={{ paddingBottom: "0.75rem", textAlign: "left", fontWeight: 600 }}>Interest Rate</th>
                    <th style={{ paddingBottom: "0.75rem", textAlign: "left", fontWeight: 600 }}>Payout</th>
                    <th style={{ paddingBottom: "0.75rem", textAlign: "left", fontWeight: 600 }}>Max Accounts</th>
                    <th style={{ paddingBottom: "0.75rem", textAlign: "left", fontWeight: 600 }}>Accounts</th>
                    <th style={{ paddingBottom: "0.75rem", textAlign: "right", fontWeight: 600 }}>Status</th>
                    <th style={{ paddingBottom: "0.75rem", textAlign: "right", fontWeight: 600 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {circles.map((circle) => (
                    <tr key={circle.id} style={{ borderBottom: "1px solid #F5F5F5", transition: "background-color 0.2s ease" }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#F9FAFB"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}>
                      <td style={{ padding: "0.75rem 0" }}>
                        <div>
                          <span style={{ fontWeight: 600, color: "#2D2D2D", display: "block" }}>{circle.name}</span>
                          {circle.description && <span style={{ fontSize: "11px", color: "#999" }}>{circle.description}</span>}
                        </div>
                      </td>
                      <td style={{ padding: "0.75rem 0", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: "#2D2D2D" }}>{formatNaira(circle.amount)}</td>
                      <td style={{ padding: "0.75rem 0", fontWeight: 500, color: "#2D2D2D" }}>{formatDuration(circle.durationMonths)}</td>
                      <td style={{ padding: "0.75rem 0", fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: cfg.colors.primary }}>{circle.interestRateAnnual}%</td>
                      <td style={{ padding: "0.75rem 0" }}>
                        <span style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase", fontFamily: "'JetBrains Mono', monospace",
                          padding: "0.125rem 0.5rem", borderRadius: "0.375rem",
                          backgroundColor: circle.autoPayout ? "#ECFDF5" : "#FEF2F2",
                          color: circle.autoPayout ? "#059669" : "#DC2626",
                          border: `1px solid ${circle.autoPayout ? "#A7F3D0" : "#FECACA"}` }}>
                          {circle.autoPayout ? "Auto" : "Clearance"}
                        </span>
                      </td>
                      <td style={{ padding: "0.75rem 0", fontFamily: "'JetBrains Mono', monospace", color: "#717171" }}>{circle.maxAccountsPerUser}</td>
                      <td style={{ padding: "0.75rem 0", fontFamily: "'JetBrains Mono', monospace", color: "#717171" }}>{circle._count?.accounts || 0}</td>
                      <td style={{ padding: "0.75rem 0", textAlign: "right" }}>
                        <span style={{
                          fontSize: "9px", fontWeight: 700, textTransform: "uppercase", fontFamily: "'JetBrains Mono', monospace",
                          padding: "0.125rem 0.5rem", borderRadius: "0.375rem",
                          backgroundColor: circle.status === "active" ? "#ECFDF5" : "#FFFBEB",
                          color: circle.status === "active" ? "#059669" : "#D97706",
                          border: `1px solid ${circle.status === "active" ? "#A7F3D0" : "#FDE68A"}`,
                        }}>{circle.status}</span>
                      </td>
                      <td style={{ padding: "0.75rem 0", textAlign: "right" }}>
                        <div style={{ display: "flex", gap: "0.375rem", justifyContent: "flex-end" }}>
                          <button onClick={() => openEditModal(circle)}
                            style={{ padding: "0.25rem 0.5rem", borderRadius: "0.375rem", fontSize: "10px", fontWeight: 600, border: `1px solid ${cfg.colors.primary}30`, backgroundColor: `${cfg.colors.primary}08`, color: cfg.colors.primary, cursor: "pointer", transition: "all 0.2s ease" }}>
                            Edit
                          </button>
                          <button onClick={() => handleToggleStatus(circle)} disabled={togglingId === circle.id}
                            style={{ padding: "0.25rem 0.5rem", borderRadius: "0.375rem", fontSize: "10px", fontWeight: 600, border: `1px solid ${circle.status === "active" ? "#FDE68A" : "#A7F3D0"}`, backgroundColor: circle.status === "active" ? "#FFFBEB" : "#ECFDF5", color: circle.status === "active" ? "#D97706" : "#059669", cursor: "pointer", transition: "all 0.2s ease", opacity: togglingId === circle.id ? 0.5 : 1 }}>
                            {togglingId === circle.id ? "..." : circle.status === "active" ? "Deactivate" : "Activate"}
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

      {showModal && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "1rem" }} onClick={() => setShowModal(false)}>
          <div style={{ backgroundColor: "#fff", borderRadius: "1rem", padding: "2rem", maxWidth: "480px", width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.15)", maxHeight: "90vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#1A1A1A", marginBottom: "0.25rem" }}>
              {editingCircle ? "Edit Circle" : "Create New Circle"}
            </h3>
            <p style={{ fontSize: "12px", color: "#717171", marginBottom: "1.5rem" }}>
              {editingCircle ? "Update circle configuration below." : "Configure a new circle savings product."}
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ fontSize: "11px", fontWeight: 600, color: "#2D2D2D", display: "block", marginBottom: "0.375rem" }}>Name *</label>
                <input type="text" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Gold Circle"
                  style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: "0.5rem", border: "1px solid #E5E7EB", fontSize: "13px", outline: "none", boxSizing: "border-box" }} />
              </div>

              <div>
                <label style={{ fontSize: "11px", fontWeight: 600, color: "#2D2D2D", display: "block", marginBottom: "0.375rem" }}>Description</label>
                <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Optional description"
                  rows={2}
                  style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: "0.5rem", border: "1px solid #E5E7EB", fontSize: "13px", outline: "none", resize: "vertical", boxSizing: "border-box" }} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 600, color: "#2D2D2D", display: "block", marginBottom: "0.375rem" }}>Deposit Amount *</label>
                  <input type="number" value={form.amount} onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
                    placeholder="e.g. 25000"
                    style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: "0.5rem", border: "1px solid #E5E7EB", fontSize: "13px", fontFamily: "'JetBrains Mono', monospace", outline: "none", boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 600, color: "#2D2D2D", display: "block", marginBottom: "0.375rem" }}>Duration (months) *</label>
                  <input type="number" value={form.durationMonths} onChange={(e) => setForm((p) => ({ ...p, durationMonths: e.target.value }))}
                    placeholder="e.g. 12"
                    style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: "0.5rem", border: "1px solid #E5E7EB", fontSize: "13px", fontFamily: "'JetBrains Mono', monospace", outline: "none", boxSizing: "border-box" }} />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 600, color: "#2D2D2D", display: "block", marginBottom: "0.375rem" }}>Interest Rate (% p.a.) *</label>
                  <input type="number" step="0.1" value={form.interestRateAnnual} onChange={(e) => setForm((p) => ({ ...p, interestRateAnnual: e.target.value }))}
                    placeholder="e.g. 10"
                    style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: "0.5rem", border: "1px solid #E5E7EB", fontSize: "13px", fontFamily: "'JetBrains Mono', monospace", outline: "none", boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 600, color: "#2D2D2D", display: "block", marginBottom: "0.375rem" }}>Max Accounts/User</label>
                  <input type="number" value={form.maxAccountsPerUser} onChange={(e) => setForm((p) => ({ ...p, maxAccountsPerUser: e.target.value }))}
                    placeholder="10"
                    style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: "0.5rem", border: "1px solid #E5E7EB", fontSize: "13px", fontFamily: "'JetBrains Mono', monospace", outline: "none", boxSizing: "border-box" }} />
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.75rem 1rem", backgroundColor: "#F9FAFB", borderRadius: "0.5rem" }}>
                <div>
                  <span style={{ fontSize: "12px", fontWeight: 600, color: "#2D2D2D", display: "block" }}>Auto Payout</span>
                  <span style={{ fontSize: "11px", color: "#717171" }}>{form.autoPayout ? "Members can claim maturity instantly" : "Maturity payouts require admin clearance"}</span>
                </div>
                <button type="button" onClick={() => setForm((p) => ({ ...p, autoPayout: !p.autoPayout }))}
                  style={{ width: "44px", height: "24px", borderRadius: "12px", border: "none", cursor: "pointer", position: "relative", transition: "background-color 0.2s ease",
                    backgroundColor: form.autoPayout ? "#059669" : "#D1D5DB" }}>
                  <span style={{ position: "absolute", top: "2px", left: form.autoPayout ? "22px" : "2px", width: "20px", height: "20px", borderRadius: "50%", backgroundColor: "#fff", transition: "left 0.2s ease", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }} />
                </button>
              </div>

              {form.amount && form.interestRateAnnual && form.durationMonths && (
                <div style={{ backgroundColor: "#F9FAFB", borderRadius: "0.75rem", padding: "0.75rem 1rem", fontSize: "12px" }}>
                  <div style={{ fontWeight: 600, color: "#2D2D2D", marginBottom: "0.375rem" }}>Preview</div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                    <span style={{ color: "#717171" }}>Deposit</span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>{formatNaira(Number(form.amount))}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                    <span style={{ color: "#717171" }}>Duration</span>
                    <span style={{ fontWeight: 500 }}>{formatDuration(Number(form.durationMonths))}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                    <span style={{ color: "#717171" }}>Annual Rate</span>
                    <span style={{ fontWeight: 500 }}>{form.interestRateAnnual}%</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#717171" }}>Est. Maturity Value</span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: "#059669" }}>
                      {formatNaira(Number(form.amount) * (1 + (Number(form.interestRateAnnual) / 100) * (Number(form.durationMonths) / 12)))}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem" }}>
              <button onClick={() => setShowModal(false)}
                style={{ flex: 1, padding: "0.625rem", borderRadius: "0.5rem", border: "1px solid #E5E7EB", backgroundColor: "#fff", fontSize: "13px", fontWeight: 500, cursor: "pointer" }}>
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                style={{ flex: 1, padding: "0.625rem", borderRadius: "0.5rem", border: "none", backgroundColor: cfg.colors.primary, color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer", opacity: saving ? 0.5 : 1 }}>
                {saving ? "Saving..." : editingCircle ? "Update Circle" : "Create Circle"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
