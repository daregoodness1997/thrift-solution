"use client";

import { useState, useEffect, useCallback } from "react";
import { config, BrandConfig } from "@thrift/config";
import { Card, Button, ColorfulBadge, FadeIn, FadeInUp, StaggerChildren } from "@thrift/ui";
import { formatNaira } from "@thrift/utils";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import Pagination from "@/components/Pagination";

const fallback = config;

interface Circle {
  id: string;
  name: string;
  description?: string;
  cycleType: string;
  amount: number;
  weeklyAmount?: number | null;
  totalWeeks?: number | null;
  durationMonths: number;
  interestRateAnnual: number;
  maxAccountsPerUser: number;
  maxSubscribers?: number | null;
  autoPayout: boolean;
  payoutMode: string;
  blockPayoutOnDefault: boolean;
  status: string;
  _count?: { accounts: number };
  addons?: Array<{ id: string; name: string; estimatedCost: number }>;
}

function formatDuration(months: number) {
  if (months < 12) return `${months}mo`;
  const y = Math.floor(months / 12);
  const m = months % 12;
  return m > 0 ? `${y}y ${m}mo` : `${y}y`;
}

export default function CircleManagementPage() {
  const { token } = useAuth();
  const router = useRouter();
  const [cfg] = useState<BrandConfig>(fallback);
  const [circles, setCircles] = useState<Circle[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
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

  const openCreate = () => {
    router.push("/circle-management/new");
  };

  const openEdit = (circle: Circle) => {
    router.push(`/circle-management/${circle.id}/edit`);
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
            <Button variant="primary" size="sm" onClick={openCreate}>
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
                    <th className="pb-3 text-left font-semibold">Type</th>
                    <th className="pb-3 text-right font-semibold">Amount</th>
                    <th className="pb-3 text-left font-semibold">Duration</th>
                    <th className="pb-3 text-left font-semibold">Interest Rate</th>
                    <th className="pb-3 text-left font-semibold">Payout</th>
                    <th className="pb-3 text-left font-semibold">Max/User</th>
                    <th className="pb-3 text-left font-semibold">Subscribers</th>
                    <th className="pb-3 text-left font-semibold">Addons</th>
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
                      <td className="py-3">
                        <span className="rounded-md px-2 py-0.5 font-mono text-[9px] font-bold uppercase"
                          style={{ backgroundColor: circle.cycleType === "weekly_contribution" ? "#EFF6FF" : "#F5F3FF", color: circle.cycleType === "weekly_contribution" ? "#2563EB" : "#7C3AED", border: `1px solid ${circle.cycleType === "weekly_contribution" ? "#BFDBFE" : "#DDD6FE"}` }}>
                          {circle.cycleType === "weekly_contribution" ? "Weekly" : "Deposit"}
                        </span>
                      </td>
                      <td className="py-3 text-right font-mono font-semibold text-brand-dark">
                        {circle.cycleType === "weekly_contribution"
                          ? `${formatNaira(circle.weeklyAmount || 0)}/wk × ${circle.totalWeeks || 0}`
                          : formatNaira(circle.amount)}
                      </td>
                      <td className="py-3 font-medium text-brand-dark">{formatDuration(circle.durationMonths)}</td>
                      <td className="py-3 font-mono font-semibold" style={{ color: cfg.colors.primary }}>{circle.interestRateAnnual}%</td>
                      <td className="py-3">
                        {(() => {
                          const isAuto = circle.payoutMode ? circle.payoutMode === "auto" : circle.autoPayout;
                          return (
                            <span className="rounded-md px-2 py-0.5 font-mono text-[9px] font-bold uppercase"
                              style={{ backgroundColor: isAuto ? "#ECFDF5" : "#FEF2F2", color: isAuto ? "#059669" : "#DC2626", border: `1px solid ${isAuto ? "#A7F3D0" : "#FECACA"}` }}>
                              {isAuto ? "Auto" : "Clearance"}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="py-3 font-mono text-gray-500">{circle.maxAccountsPerUser > 0 ? circle.maxAccountsPerUser : "∞"}</td>
                      <td className="py-3 font-mono text-gray-500">
                        {circle._count?.accounts || 0}
                        {circle.maxSubscribers != null && (
                          <span className="text-gray-400"> / {circle.maxSubscribers}</span>
                        )}
                      </td>
                      <td className="py-3">
                        {circle.addons && circle.addons.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {circle.addons.slice(0, 2).map((a) => (
                              <span key={a.id} className="rounded-md px-2 py-0.5 font-mono text-[9px] font-bold"
                                style={{ backgroundColor: "#FEF3C7", color: "#D97706", border: "1px solid #FDE68A" }}>
                                {a.name}
                              </span>
                            ))}
                            {circle.addons.length > 2 && (
                              <span className="rounded-md px-2 py-0.5 font-mono text-[9px] text-gray-500">
                                +{circle.addons.length - 2} more
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] text-gray-400">—</span>
                        )}
                      </td>
                      <td className="py-3 text-right">
                        <span className="rounded-md px-2 py-0.5 font-mono text-[9px] font-bold uppercase"
                          style={{ backgroundColor: circle.status === "active" ? "#ECFDF5" : "#FFFBEB", color: circle.status === "active" ? "#059669" : "#D97706", border: `1px solid ${circle.status === "active" ? "#A7F3D0" : "#FDE68A"}` }}>
                          {circle.status}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button onClick={() => router.push(`/circle-management/${circle.id}`)}
                            className="cursor-pointer rounded-md px-2 py-1 text-[10px] font-semibold"
                            style={{ border: `1px solid #BFDBFE`, backgroundColor: "#EFF6FF", color: "#2563EB" }}>
                            View
                          </button>
                          <button onClick={() => openEdit(circle)}
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
    </div>
  );
}
