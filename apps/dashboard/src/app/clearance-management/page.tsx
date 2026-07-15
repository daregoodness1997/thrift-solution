"use client";

import { useState, useEffect, useCallback } from "react";
import { config, BrandConfig } from "@thrift/config";
import { Card, Button, ColorfulBadge, FadeIn, FadeInUp, StaggerChildren } from "@thrift/ui";
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

interface PayoutRequest {
  id: string;
  circleAccountId: string;
  userId: string;
  amount: number;
  status: string;
  note?: string;
  reviewedAt?: string;
  createdAt: string;
  user: { id: string; name: string; email: string };
  circleAccount: {
    principalAmount: number;
    interestEarned: number;
    status: string;
    circle: { id: string; name: string; amount: number; durationMonths: number; interestRateAnnual: number };
  };
}

const statusStyles: Record<string, { bg: string; color: string; border: string }> = {
  cleared: { bg: "#ECFDF5", color: "#059669", border: "#A7F3D0" },
  approved: { bg: "#ECFDF5", color: "#059669", border: "#A7F3D0" },
  partial: { bg: "#FFFBEB", color: "#D97706", border: "#FDE68A" },
  pending: { bg: "#F3F4F6", color: "#6B7280", border: "#E5E7EB" },
  declined: { bg: "#FEF2F2", color: "#DC2626", border: "#FECACA" },
};

export default function ClearanceManagementPage() {
  const { token } = useAuth();
  const [cfg] = useState<BrandConfig>(config);
  const [activeTab, setActiveTab] = useState<"group" | "circle">("group");

  const [clearances, setClearances] = useState<ClearanceItem[]>([]);
  const [filter, setFilter] = useState<"all" | "cleared" | "partial" | "pending">("all");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [clearStats, setClearStats] = useState({ totalCleared: 0, totalPending: 0 });
  const LIMIT = 20;

  const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>([]);
  const [prFilter, setPrFilter] = useState<"all" | "pending" | "approved" | "declined">("all");
  const [prPage, setPrPage] = useState(1);
  const [prTotalPages, setPrTotalPages] = useState(1);
  const [prTotal, setPrTotal] = useState(0);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [declineNote, setDeclineNote] = useState("");
  const [declineTarget, setDeclineTarget] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

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

  const fetchPayoutRequests = useCallback(async () => {
    if (!token) return;
    try {
      const statusParam = prFilter === "all" ? "" : `&status=${prFilter}`;
      const res = await fetch(`${API_URL}/api/circles/admin/payout-requests?page=${prPage}&limit=${LIMIT}${statusParam}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setPayoutRequests(data.data.items || []);
        setPrTotalPages(data.data.totalPages || 1);
        setPrTotal(data.data.total || 0);
      }
    } catch {}
  }, [token, prPage, prFilter, API_URL]);

  useEffect(() => { fetchClearances(); }, [fetchClearances]);
  useEffect(() => { fetchPaginatedList(); }, [fetchPaginatedList]);
  useEffect(() => { fetchPayoutRequests(); }, [fetchPayoutRequests]);

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

  const handleApprovePayout = async (id: string) => {
    setProcessingId(id);
    try {
      const res = await fetch(`${API_URL}/api/circles/admin/payout-requests/${id}/approve`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        showMessage("success", "Payout approved and credited to wallet");
        fetchPayoutRequests();
      } else {
        showMessage("error", data.error || "Failed to approve payout");
      }
    } catch {
      showMessage("error", "Failed to approve payout");
    }
    setProcessingId(null);
  };

  const handleDeclinePayout = async (id: string) => {
    setProcessingId(id);
    try {
      const res = await fetch(`${API_URL}/api/circles/admin/payout-requests/${id}/decline`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ note: declineNote || undefined }),
      });
      const data = await res.json();
      if (data.success) {
        showMessage("success", "Payout request declined");
        setDeclineTarget(null);
        setDeclineNote("");
        fetchPayoutRequests();
      } else {
        showMessage("error", data.error || "Failed to decline payout");
      }
    } catch {
      showMessage("error", "Failed to decline payout");
    }
    setProcessingId(null);
  };

  const pendingPRCount = payoutRequests.filter((r) => r.status === "pending").length;

  if (loading) {
    return (
      <div className="mx-auto max-w-[1280px] p-[clamp(1rem,3vw,2rem)]">
        <div className="p-16 text-center text-[13px] text-gray-500">Loading clearances...</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1280px] p-[clamp(1rem,3vw,2rem)]">
      <PageHeader
        badgeLabel="Circle Operations"
        heading="Clearance"
        accentText="Management"
        description="Verify and approve payout clearances for circle members."
      />

      {message && (
        <FadeIn>
          <div className={`mb-6 rounded-xl border px-4 py-3 text-[13px] font-medium ${message.type === "success" ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-red-50 text-red-600 border-red-200"}`}>
            {message.text}
          </div>
        </FadeIn>
      )}

      <div className="mb-6 flex gap-2">
        <button onClick={() => setActiveTab("group")}
          className="cursor-pointer rounded-full border-[1.5px] px-5 py-2 text-[12px] font-semibold transition-all duration-150"
          style={{ backgroundColor: activeTab === "group" ? cfg.colors.primary : "#ffffff", color: activeTab === "group" ? "#ffffff" : "#717171", borderColor: activeTab === "group" ? cfg.colors.primary : "#EAEAEA" }}>
          Group Clearances
        </button>
        <button onClick={() => setActiveTab("circle")}
          className="cursor-pointer rounded-full border-[1.5px] px-5 py-2 text-[12px] font-semibold transition-all duration-150"
          style={{ backgroundColor: activeTab === "circle" ? cfg.colors.primary : "#ffffff", color: activeTab === "circle" ? "#ffffff" : "#717171", borderColor: activeTab === "circle" ? cfg.colors.primary : "#EAEAEA" }}>
          Circle Payouts {pendingPRCount > 0 && <span className="ml-1 rounded-full bg-red-600 px-1.5 text-[10px] text-white">{pendingPRCount}</span>}
        </button>
      </div>

      {activeTab === "group" && (
        <>
          <StaggerChildren staggerDelay={100} className="mb-8 grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
            <Card padding="1.25rem">
              <span className="block text-[9px] font-bold uppercase tracking-[0.1em] text-gray-500">Total Clearances</span>
              <span className="mt-1 block font-mono text-2xl font-bold text-brand-dark">{totalItems}</span>
            </Card>
            <Card padding="1.25rem">
              <span className="block text-[9px] font-bold uppercase tracking-[0.1em] text-gray-500">Cleared Amount</span>
              <span className="mt-1 block font-mono text-2xl font-bold text-emerald-600">{formatNaira(clearStats.totalCleared)}</span>
            </Card>
            <Card padding="1.25rem">
              <span className="block text-[9px] font-bold uppercase tracking-[0.1em] text-gray-500">Pending Payout</span>
              <span className="mt-1 block font-mono text-2xl font-bold text-amber-600">{formatNaira(clearStats.totalPending)}</span>
            </Card>
          </StaggerChildren>

          <FadeInUp delay={300}>
            <Card padding="1.5rem" className="mb-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <ColorfulBadge label="Clearance Records" color={cfg.colors.primary} />
                <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
                  {(["all", "cleared", "partial", "pending"] as const).map((f) => (
                    <button key={f} onClick={() => { setFilter(f); setPage(1); }}
                      className="cursor-pointer rounded-md px-3 py-1.5 text-[11px] font-semibold capitalize"
                      style={{ backgroundColor: filter === f ? "#ffffff" : "transparent", color: filter === f ? cfg.colors.primary : "#717171", boxShadow: filter === f ? "0 1px 3px rgba(0,0,0,0.08)" : "none" }}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {(listLoading && paginatedItems.length === 0) ? (
                <div className="p-8 text-center text-[13px] text-gray-500">Loading...</div>
              ) : paginatedItems.length === 0 ? (
                <div className="p-8 text-center text-[13px] text-gray-500">No clearance records found.</div>
              ) : (
                <div className="overflow-x-auto [-webkit-overflow-scrolling:touch]">
                  <table className="w-full border-collapse text-[12px] min-w-[650px]">
                    <thead>
                      <tr className="border-b border-gray-100 font-mono text-[9px] uppercase tracking-[0.1em] text-gray-500">
                        <th className="pb-3 text-left font-semibold">Member</th>
                        <th className="pb-3 text-left font-semibold">Circle</th>
                        <th className="pb-3 text-right font-semibold">Cycle</th>
                        <th className="pb-3 text-right font-semibold">Payout</th>
                        <th className="pb-3 text-right font-semibold">Progress</th>
                        <th className="pb-3 text-right font-semibold">Status</th>
                        <th className="pb-3 text-right font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedItems.map((c) => {
                        const st = statusStyles[c.status] || statusStyles.pending;
                        const progress = c.payoutAmount > 0 ? Math.round((c.contributed / c.payoutAmount) * 100) : 0;
                        const initials = c.userName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
                        return (
                          <tr key={c.id} className="border-b border-gray-100 transition-colors hover:bg-gray-50">
                            <td className="py-3">
                              <div className="flex items-center gap-2">
                                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold" style={{ backgroundColor: `${cfg.colors.primary}15`, color: cfg.colors.primary }}>{initials}</div>
                                <div>
                                  <span className="block font-medium text-brand-dark">{c.userName}</span>
                                  {c.clearedDate && <span className="text-[9px] text-gray-500">Cleared {new Date(c.clearedDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>}
                                </div>
                              </div>
                            </td>
                            <td className="py-3">
                              <span className="rounded-md px-2 py-0.5 font-mono text-[9px] font-bold uppercase" style={{ backgroundColor: `${cfg.colors.primary}12`, color: cfg.colors.primary, border: `1px solid ${cfg.colors.primary}20` }}>{c.groupName}</span>
                            </td>
                            <td className="py-3 text-right font-mono font-semibold text-brand-dark">#{c.cycleNumber}</td>
                            <td className="py-3 text-right font-mono font-semibold text-brand-dark">{formatNaira(c.payoutAmount)}</td>
                            <td className="py-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <div className="h-1 w-[60px] overflow-hidden rounded-full bg-gray-100">
                                  <div className="h-full rounded-full" style={{ backgroundColor: progress === 100 ? "#059669" : cfg.colors.primary, width: `${progress}%`, transition: "width 0.5s ease" }} />
                                </div>
                                <span className="font-mono text-[10px] text-gray-500">{progress}%</span>
                              </div>
                            </td>
                            <td className="py-3 text-right">
                              <span className="rounded-md px-2 py-0.5 font-bold uppercase" style={{ backgroundColor: st.bg, color: st.color, border: `1px solid ${st.border}` }}>{c.status}</span>
                            </td>
                            <td className="py-3 text-right">
                              {c.status !== "cleared" && (
                                <button onClick={() => approveClearance(c.id)}
                                  className="cursor-pointer rounded-md px-2 py-1 text-[10px] font-semibold"
                                  style={{ border: `1px solid ${cfg.colors.primary}30`, backgroundColor: `${cfg.colors.primary}08`, color: cfg.colors.primary }}>
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
        </>
      )}

      {activeTab === "circle" && (
        <>
          <StaggerChildren staggerDelay={100} className="mb-8 grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
            <Card padding="1.25rem">
              <span className="block text-[9px] font-bold uppercase tracking-[0.1em] text-gray-500">Pending Requests</span>
              <span className="mt-1 block font-mono text-2xl font-bold text-amber-600">{payoutRequests.filter((r) => r.status === "pending").length}</span>
            </Card>
            <Card padding="1.25rem">
              <span className="block text-[9px] font-bold uppercase tracking-[0.1em] text-gray-500">Approved Total</span>
              <span className="mt-1 block font-mono text-2xl font-bold text-emerald-600">
                {formatNaira(payoutRequests.filter((r) => r.status === "approved").reduce((sum, r) => sum + r.amount, 0))}
              </span>
            </Card>
            <Card padding="1.25rem">
              <span className="block text-[9px] font-bold uppercase tracking-[0.1em] text-gray-500">Total Requests</span>
              <span className="mt-1 block font-mono text-2xl font-bold text-brand-dark">{prTotal}</span>
            </Card>
          </StaggerChildren>

          <FadeInUp delay={300}>
            <Card padding="1.5rem">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <ColorfulBadge label="Circle Payout Requests" color={cfg.colors.primary} />
                <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
                  {(["all", "pending", "approved", "declined"] as const).map((f) => (
                    <button key={f} onClick={() => { setPrFilter(f); setPrPage(1); }}
                      className="cursor-pointer rounded-md px-3 py-1.5 text-[11px] font-semibold capitalize"
                      style={{ backgroundColor: prFilter === f ? "#ffffff" : "transparent", color: prFilter === f ? cfg.colors.primary : "#717171", boxShadow: prFilter === f ? "0 1px 3px rgba(0,0,0,0.08)" : "none" }}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {payoutRequests.length === 0 ? (
                <div className="p-8 text-center text-[13px] text-gray-500">No circle payout requests found.</div>
              ) : (
                <div className="overflow-x-auto [-webkit-overflow-scrolling:touch]">
                  <table className="w-full border-collapse text-[12px] min-w-[750px]">
                    <thead>
                      <tr className="border-b border-gray-100 font-mono text-[9px] uppercase tracking-[0.1em] text-gray-500">
                        <th className="pb-3 text-left font-semibold">Member</th>
                        <th className="pb-3 text-left font-semibold">Circle</th>
                        <th className="pb-3 text-right font-semibold">Principal</th>
                        <th className="pb-3 text-right font-semibold">Interest</th>
                        <th className="pb-3 text-right font-semibold">Payout</th>
                        <th className="pb-3 text-right font-semibold">Requested</th>
                        <th className="pb-3 text-right font-semibold">Status</th>
                        <th className="pb-3 text-right font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payoutRequests.map((r) => {
                        const st = statusStyles[r.status] || statusStyles.pending;
                        const initials = r.user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
                        return (
                          <tr key={r.id} className="border-b border-gray-100 transition-colors hover:bg-gray-50">
                            <td className="py-3">
                              <div className="flex items-center gap-2">
                                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold" style={{ backgroundColor: `${cfg.colors.primary}15`, color: cfg.colors.primary }}>{initials}</div>
                                <span className="font-medium text-brand-dark">{r.user.name}</span>
                              </div>
                            </td>
                            <td className="py-3">
                              <span className="rounded-md px-2 py-0.5 font-mono text-[9px] font-bold uppercase" style={{ backgroundColor: `${cfg.colors.primary}12`, color: cfg.colors.primary, border: `1px solid ${cfg.colors.primary}20` }}>{r.circleAccount.circle.name}</span>
                            </td>
                            <td className="py-3 text-right font-mono font-semibold text-brand-dark">{formatNaira(r.circleAccount.principalAmount)}</td>
                            <td className="py-3 text-right font-mono font-semibold text-emerald-600">{formatNaira(r.circleAccount.interestEarned)}</td>
                            <td className="py-3 text-right font-mono font-bold" style={{ color: cfg.colors.primary }}>{formatNaira(r.amount)}</td>
                            <td className="py-3 text-right font-mono text-gray-500">
                              {new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            </td>
                            <td className="py-3 text-right">
                              <span className="rounded-md px-2 py-0.5 font-bold uppercase" style={{ backgroundColor: st.bg, color: st.color, border: `1px solid ${st.border}` }}>{r.status}</span>
                            </td>
                            <td className="py-3 text-right">
                              {r.status === "pending" && (
                                <div className="flex justify-end gap-1.5">
                                  <button onClick={() => handleApprovePayout(r.id)} disabled={processingId === r.id}
                                    className="cursor-pointer rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-600"
                                    style={{ opacity: processingId === r.id ? 0.5 : 1 }}>
                                    {processingId === r.id ? "..." : "Approve"}
                                  </button>
                                  <button onClick={() => setDeclineTarget(r.id)} disabled={processingId === r.id}
                                    className="cursor-pointer rounded-md border border-red-200 bg-red-50 px-2 py-1 text-[10px] font-semibold text-red-600">
                                    Decline
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              <Pagination page={prPage} totalPages={prTotalPages} total={prTotal} limit={LIMIT} onPageChange={setPrPage} />
            </Card>
          </FadeInUp>
        </>
      )}

      <FadeInUp delay={400}>
        <Card padding="1.5rem">
          <div className="mb-4">
            <ColorfulBadge label="Clearance Process" color={cfg.colors.accent} />
            <h2 className="mt-2 text-[1.125rem] font-medium text-brand-dark">How Clearance Works</h2>
          </div>
          <div className="flex flex-col gap-0">
            {[
              { step: 1, title: "Cycle Completion", desc: "All members complete their contributions for the current cycle.", color: cfg.colors.primary },
              { step: 2, title: "Payout Eligibility", desc: "The designated recipient is verified for clearance eligibility.", color: "#8A7D73" },
              { step: 3, title: "Clearance Approval", desc: "Circle leader or admin reviews and approves the payout.", color: "#3D4D40" },
              { step: 4, title: "Funds Disbursed", desc: "Wallet balance is credited and payout is recorded.", color: "#059669" },
            ].map((item, i) => (
              <div key={item.step} className="flex gap-4 py-4" style={{ borderBottom: i < 3 ? "1px solid #F0F0F0" : "none" }}>
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full font-mono text-[12px] font-bold" style={{ backgroundColor: `${item.color}15`, color: item.color }}>{item.step}</div>
                <div>
                  <span className="block text-[12px] font-semibold text-brand-dark">{item.title}</span>
                  <span className="text-[11px] font-light text-gray-500">{item.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </FadeInUp>

      {declineTarget && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 p-4" onClick={() => { setDeclineTarget(null); setDeclineNote(""); }}>
          <div className="w-full max-w-[400px] rounded-2xl bg-white p-8 shadow-[0_20px_60px_rgba(0,0,0,0.15)]" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-2 text-base font-semibold text-brand-dark">Decline Payout Request</h3>
            <p className="mb-4 text-[12px] text-gray-500">Optionally provide a reason for declining.</p>
            <textarea value={declineNote} onChange={(e) => setDeclineNote(e.target.value)} placeholder="Reason (optional)"
              rows={3}
              className="mb-4 w-full resize-y rounded-lg border border-gray-200 px-3 py-2 text-[13px] outline-none" />
            <div className="flex gap-3">
              <button onClick={() => { setDeclineTarget(null); setDeclineNote(""); }}
                className="flex-1 cursor-pointer rounded-lg border border-gray-200 bg-white px-2.5 py-2.5 text-[13px] font-medium">Cancel</button>
              <button onClick={() => handleDeclinePayout(declineTarget)} disabled={processingId === declineTarget}
                className="flex-1 cursor-pointer rounded-lg bg-red-600 px-2.5 py-2.5 text-[13px] font-semibold text-white"
                style={{ opacity: processingId === declineTarget ? 0.5 : 1 }}>
                {processingId === declineTarget ? "Declining..." : "Decline"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
