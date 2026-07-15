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
      <div className="mx-auto max-w-[1280px] p-[clamp(1rem,3vw,2rem)]">
        <div className="p-16 text-center text-[13px] text-gray-500">Loading circles...</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1280px] p-[clamp(1rem,3vw,2rem)]">
      <PageHeader
        badgeLabel="Admin"
        heading="Circle"
        accentText="Management"
        description="Create, configure, and manage circle savings products."
        right={
          <div className="flex gap-2">
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
          <div className={`mb-6 rounded-xl border px-4 py-3 text-[13px] font-medium ${message.type === "success" ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-red-50 text-red-600 border-red-200"}`}>
            {message.text}
          </div>
        </FadeIn>
      )}

      <StaggerChildren staggerDelay={100} className="mb-8 grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4">
        <Card padding="1.25rem">
          <span className="block text-[9px] font-bold uppercase tracking-[0.1em] text-gray-500">Total Circles</span>
          <span className="mt-1 block font-mono text-2xl font-bold text-brand-dark">{stats.total}</span>
        </Card>
        <Card padding="1.25rem">
          <span className="block text-[9px] font-bold uppercase tracking-[0.1em] text-gray-500">Active</span>
          <span className="mt-1 block font-mono text-2xl font-bold text-emerald-600">{stats.active}</span>
        </Card>
        <Card padding="1.25rem">
          <span className="block text-[9px] font-bold uppercase tracking-[0.1em] text-gray-500">Inactive</span>
          <span className="mt-1 block font-mono text-2xl font-bold text-amber-600">{stats.inactive}</span>
        </Card>
        <Card padding="1.25rem">
          <span className="block text-[9px] font-bold uppercase tracking-[0.1em] text-gray-500">Total Accounts</span>
          <span className="mt-1 block font-mono text-2xl font-bold text-brand-dark">{stats.totalAccounts}</span>
        </Card>
      </StaggerChildren>

      <FadeInUp delay={300}>
        <Card padding="1.5rem">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <ColorfulBadge label="Circles" color={cfg.colors.primary} />
            <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
              {(["all", "active", "inactive"] as const).map((f) => (
                <button key={f} onClick={() => handleFilterChange(f)}
                  className="cursor-pointer rounded-md px-3 py-1.5 text-[11px] font-semibold capitalize"
                  style={{ backgroundColor: filter === f ? "#ffffff" : "transparent", color: filter === f ? cfg.colors.primary : "#717171", boxShadow: filter === f ? "0 1px 3px rgba(0,0,0,0.08)" : "none" }}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          {circles.length === 0 ? (
            <div className="p-8 text-center text-[13px] text-gray-500">
              No circles found. Click "+ New Circle" to create one.
            </div>
          ) : (
            <div className="overflow-x-auto [-webkit-overflow-scrolling:touch]">
              <table className="w-full border-collapse text-[12px] min-w-[800px]">
                <thead>
                  <tr className="border-b border-gray-100 font-mono text-[9px] uppercase tracking-[0.1em] text-gray-500">
                    <th className="pb-3 text-left font-semibold">Name</th>
                    <th className="pb-3 text-right font-semibold">Amount</th>
                    <th className="pb-3 text-left font-semibold">Duration</th>
                    <th className="pb-3 text-left font-semibold">Interest Rate</th>
                    <th className="pb-3 text-left font-semibold">Payout</th>
                    <th className="pb-3 text-left font-semibold">Max Accounts</th>
                    <th className="pb-3 text-left font-semibold">Accounts</th>
                    <th className="pb-3 text-right font-semibold">Status</th>
                    <th className="pb-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {circles.map((circle) => (
                    <tr key={circle.id} className="border-b border-gray-100 transition-colors hover:bg-gray-50">
                      <td className="py-3">
                        <div>
                          <span className="block font-semibold text-brand-dark">{circle.name}</span>
                          {circle.description && <span className="text-[11px] text-gray-500">{circle.description}</span>}
                        </div>
                      </td>
                      <td className="py-3 text-right font-mono font-semibold text-brand-dark">{formatNaira(circle.amount)}</td>
                      <td className="py-3 font-medium text-brand-dark">{formatDuration(circle.durationMonths)}</td>
                      <td className="py-3 font-mono font-semibold" style={{ color: cfg.colors.primary }}>{circle.interestRateAnnual}%</td>
                      <td className="py-3">
                        <span className="rounded-md px-2 py-0.5 font-mono text-[9px] font-bold uppercase"
                          style={{ backgroundColor: circle.autoPayout ? "#ECFDF5" : "#FEF2F2", color: circle.autoPayout ? "#059669" : "#DC2626", border: `1px solid ${circle.autoPayout ? "#A7F3D0" : "#FECACA"}` }}>
                          {circle.autoPayout ? "Auto" : "Clearance"}
                        </span>
                      </td>
                      <td className="py-3 font-mono text-gray-500">{circle.maxAccountsPerUser}</td>
                      <td className="py-3 font-mono text-gray-500">{circle._count?.accounts || 0}</td>
                      <td className="py-3 text-right">
                        <span className="rounded-md px-2 py-0.5 font-mono text-[9px] font-bold uppercase"
                          style={{ backgroundColor: circle.status === "active" ? "#ECFDF5" : "#FFFBEB", color: circle.status === "active" ? "#059669" : "#D97706", border: `1px solid ${circle.status === "active" ? "#A7F3D0" : "#FDE68A"}` }}>
                          {circle.status}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button onClick={() => openEditModal(circle)}
                            className="cursor-pointer rounded-md px-2 py-1 text-[10px] font-semibold"
                            style={{ border: `1px solid ${cfg.colors.primary}30`, backgroundColor: `${cfg.colors.primary}08`, color: cfg.colors.primary }}>
                            Edit
                          </button>
                          <button onClick={() => handleToggleStatus(circle)} disabled={togglingId === circle.id}
                            className="cursor-pointer rounded-md px-2 py-1 text-[10px] font-semibold"
                            style={{ border: `1px solid ${circle.status === "active" ? "#FDE68A" : "#A7F3D0"}`, backgroundColor: circle.status === "active" ? "#FFFBEB" : "#ECFDF5", color: circle.status === "active" ? "#D97706" : "#059669", opacity: togglingId === circle.id ? 0.5 : 1 }}>
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
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 p-4" onClick={() => setShowModal(false)}>
          <div className="max-h-[90vh] w-full max-w-[480px] overflow-y-auto rounded-2xl bg-white p-8 shadow-[0_20px_60px_rgba(0,0,0,0.15)]" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-1 text-base font-semibold text-brand-dark">
              {editingCircle ? "Edit Circle" : "Create New Circle"}
            </h3>
            <p className="mb-6 text-[12px] text-gray-500">
              {editingCircle ? "Update circle configuration below." : "Configure a new circle savings product."}
            </p>

            <div className="flex flex-col gap-4">
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold text-brand-dark">Name *</label>
                <input type="text" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Gold Circle"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] outline-none" />
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-semibold text-brand-dark">Description</label>
                <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Optional description"
                  rows={2}
                  className="w-full resize-y rounded-lg border border-gray-200 px-3 py-2 text-[13px] outline-none" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold text-brand-dark">Deposit Amount *</label>
                  <input type="number" value={form.amount} onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
                    placeholder="e.g. 25000"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 font-mono text-[13px] outline-none" />
                </div>
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold text-brand-dark">Duration (months) *</label>
                  <input type="number" value={form.durationMonths} onChange={(e) => setForm((p) => ({ ...p, durationMonths: e.target.value }))}
                    placeholder="e.g. 12"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 font-mono text-[13px] outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold text-brand-dark">Interest Rate (% p.a.) *</label>
                  <input type="number" step="0.1" value={form.interestRateAnnual} onChange={(e) => setForm((p) => ({ ...p, interestRateAnnual: e.target.value }))}
                    placeholder="e.g. 10"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 font-mono text-[13px] outline-none" />
                </div>
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold text-brand-dark">Max Accounts/User</label>
                  <input type="number" value={form.maxAccountsPerUser} onChange={(e) => setForm((p) => ({ ...p, maxAccountsPerUser: e.target.value }))}
                    placeholder="10"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 font-mono text-[13px] outline-none" />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4">
                <div>
                  <span className="block text-[12px] font-semibold text-brand-dark">Auto Payout</span>
                  <span className="text-[11px] text-gray-500">{form.autoPayout ? "Members can claim maturity instantly" : "Maturity payouts require admin clearance"}</span>
                </div>
                <button type="button" onClick={() => setForm((p) => ({ ...p, autoPayout: !p.autoPayout }))}
                  style={{ width: "44px", height: "24px", borderRadius: "12px", border: "none", cursor: "pointer", position: "relative", backgroundColor: form.autoPayout ? "#059669" : "#D1D5DB" }}>
                  <span style={{ position: "absolute", top: "2px", left: form.autoPayout ? "22px" : "2px", width: "20px", height: "20px", borderRadius: "50%", backgroundColor: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }} />
                </button>
              </div>

              {form.amount && form.interestRateAnnual && form.durationMonths && (
                <div className="rounded-xl bg-gray-50 p-4 text-[12px]">
                  <div className="mb-1.5 font-semibold text-brand-dark">Preview</div>
                  <div className="mb-1 flex justify-between">
                    <span className="text-gray-500">Deposit</span>
                    <span className="font-mono font-semibold">{formatNaira(Number(form.amount))}</span>
                  </div>
                  <div className="mb-1 flex justify-between">
                    <span className="text-gray-500">Duration</span>
                    <span className="font-medium">{formatDuration(Number(form.durationMonths))}</span>
                  </div>
                  <div className="mb-1 flex justify-between">
                    <span className="text-gray-500">Annual Rate</span>
                    <span className="font-medium">{form.interestRateAnnual}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Est. Maturity Value</span>
                    <span className="font-mono font-bold text-emerald-600">
                      {formatNaira(Number(form.amount) * (1 + (Number(form.interestRateAnnual) / 100) * (Number(form.durationMonths) / 12)))}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex gap-3">
              <button onClick={() => setShowModal(false)}
                className="flex-1 cursor-pointer rounded-lg border border-gray-200 bg-white px-2.5 py-2.5 text-[13px] font-medium">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 cursor-pointer rounded-lg px-2.5 py-2.5 text-[13px] font-semibold text-white"
                style={{ backgroundColor: cfg.colors.primary, opacity: saving ? 0.5 : 1 }}>
                {saving ? "Saving..." : editingCircle ? "Update Circle" : "Create Circle"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
