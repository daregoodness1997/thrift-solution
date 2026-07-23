"use client";

import { useState, useEffect, useCallback } from "react";
import { config, BrandConfig } from "@thrift/config";
import { Card, Button, FadeIn, FadeInUp, StaggerChildren } from "@thrift/ui";
import { formatNaira } from "@thrift/utils";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/PageHeader";
import Pagination from "@/components/Pagination";
import { SimpleTable, SimpleColumn } from "@/components/SimpleTable";

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
  clearanceNote?: string;
  disbursementStatus?: string;
  disbursementRef?: string;
  disbursementProofUrl?: string;
  disbursedAt?: string;
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
  cleared: { bg: "#EFF6FF", color: "#2563EB", border: "#BFDBFE" },
  approved: { bg: "#ECFDF5", color: "#059669", border: "#A7F3D0" },
  disbursed: { bg: "#ECFDF5", color: "#059669", border: "#A7F3D0" },
  disbursement_failed: { bg: "#FEF2F2", color: "#DC2626", border: "#FECACA" },
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
  const [prFilter, setPrFilter] = useState<"all" | "pending" | "cleared" | "disbursed" | "declined">("all");
  const [prPage, setPrPage] = useState(1);
  const [prTotalPages, setPrTotalPages] = useState(1);
  const [prTotal, setPrTotal] = useState(0);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [declineNote, setDeclineNote] = useState("");
  const [declineTarget, setDeclineTarget] = useState<string | null>(null);
  const [disburseTarget, setDisburseTarget] = useState<PayoutRequest | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofUploading, setProofUploading] = useState(false);
  const [manualRef, setManualRef] = useState("");
  const [manualNote, setManualNote] = useState("");
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

  const handleClearPayout = async (id: string) => {
    setProcessingId(id);
    try {
      const res = await fetch(`${API_URL}/api/circles/admin/payout-requests/${id}/clear`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.success) {
        showMessage("success", "Payout request cleared. Ready for disbursement.");
        fetchPayoutRequests();
      } else {
        showMessage("error", data.error || "Failed to clear payout");
      }
    } catch {
      showMessage("error", "Failed to clear payout");
    }
    setProcessingId(null);
  };

  const handleDisburseFlutterwave = async (id: string) => {
    setProcessingId(id);
    try {
      const res = await fetch(`${API_URL}/api/circles/admin/payout-requests/${id}/disburse`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        showMessage("success", "Flutterwave transfer initiated");
        setDisburseTarget(null);
        fetchPayoutRequests();
      } else {
        showMessage("error", data.error || "Failed to disburse via Flutterwave");
      }
    } catch {
      showMessage("error", "Failed to disburse via Flutterwave");
    }
    setProcessingId(null);
  };

  const handleMarkDisbursed = async (id: string) => {
    if (!proofFile && !manualRef.trim()) {
      showMessage("error", "Provide a proof of payment or a reference");
      return;
    }
    setProcessingId(id);
    try {
      let proofUrl: string | undefined;
      if (proofFile) {
        setProofUploading(true);
        const fd = new FormData();
        fd.append("file", proofFile);
        fd.append("folder", "circle-disbursements");
        const upRes = await fetch(`${API_URL}/api/upload`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        });
        const upData = await upRes.json();
        setProofUploading(false);
        if (!upRes.ok || !upData.url) {
          showMessage("error", upData.error || "Failed to upload proof");
          setProcessingId(null);
          return;
        }
        proofUrl = upData.url;
      }
      const res = await fetch(`${API_URL}/api/circles/admin/payout-requests/${id}/mark-disbursed`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ proofUrl, reference: manualRef || undefined, note: manualNote || undefined }),
      });
      const data = await res.json();
      if (data.success) {
        showMessage("success", "Payout marked as disbursed");
        setDisburseTarget(null);
        setProofFile(null);
        setManualRef("");
        setManualNote("");
        fetchPayoutRequests();
      } else {
        showMessage("error", data.error || "Failed to mark disbursed");
      }
    } catch {
      setProofUploading(false);
      showMessage("error", "Failed to mark disbursed");
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

  const clearanceColumns: SimpleColumn<ClearanceItem>[] = [
    {
      key: "userName",
      header: "Member",
      render: (c) => {
        const initials = c.userName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
        return (
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold" style={{ backgroundColor: "#2563EB15", color: "#2563EB" }}>{initials}</div>
            <div>
              <span className="block font-medium text-slate-900 dark:text-white">{c.userName}</span>
              {c.clearedDate && <span className="text-[9px] text-slate-500 dark:text-slate-400">Cleared {new Date(c.clearedDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>}
            </div>
          </div>
        );
      },
    },
    {
      key: "groupName",
      header: "Circle",
      render: (c) => (
        <span className="rounded-md px-2 py-0.5 font-mono text-[9px] font-bold uppercase" style={{ backgroundColor: "#2563EB12", color: "#2563EB", border: "1px solid #2563EB20" }}>{c.groupName}</span>
      ),
    },
    {
      key: "cycleNumber",
      header: "Cycle",
      align: "right",
      mono: true,
      render: (c) => <span className="font-semibold text-slate-900 dark:text-white">#{c.cycleNumber}</span>,
    },
    {
      key: "payoutAmount",
      header: "Payout",
      align: "right",
      mono: true,
      render: (c) => <span className="font-semibold text-slate-900 dark:text-white">{formatNaira(c.payoutAmount)}</span>,
    },
    {
      key: "progress",
      header: "Progress",
      align: "right",
      render: (c) => {
        const progress = c.payoutAmount > 0 ? Math.round((c.contributed / c.payoutAmount) * 100) : 0;
        return (
          <div className="flex items-center justify-end gap-2">
            <div className="h-1 w-[60px] overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div className="h-full rounded-full" style={{ backgroundColor: progress === 100 ? "#059669" : "#2563EB", width: `${progress}%`, transition: "width 0.5s ease" }} />
            </div>
            <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400">{progress}%</span>
          </div>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      align: "right",
      render: (c) => {
        const st = statusStyles[c.status] || statusStyles.pending;
        return (
          <span className="rounded-md px-2 py-0.5 font-bold uppercase text-[9px]" style={{ backgroundColor: st.bg, color: st.color, border: `1px solid ${st.border}` }}>{c.status}</span>
        );
      },
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (c) => (
        <div className="flex justify-end">
          {c.status !== "cleared" && (
            <button onClick={(e) => { e.stopPropagation(); approveClearance(c.id); }}
              className="cursor-pointer rounded-md px-2 py-1 text-[10px] font-semibold"
              style={{ border: "1px solid #2563EB30", backgroundColor: "#2563EB08", color: "#2563EB" }}>
              Approve
            </button>
          )}
        </div>
      ),
    },
  ];

  const payoutColumns: SimpleColumn<PayoutRequest>[] = [
    {
      key: "user",
      header: "Member",
      render: (r) => {
        const initials = r.user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
        return (
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold" style={{ backgroundColor: "#2563EB15", color: "#2563EB" }}>{initials}</div>
            <span className="font-medium text-slate-900 dark:text-white">{r.user.name}</span>
          </div>
        );
      },
    },
    {
      key: "circle",
      header: "Circle",
      render: (r) => (
        <span className="rounded-md px-2 py-0.5 font-mono text-[9px] font-bold uppercase" style={{ backgroundColor: "#2563EB12", color: "#2563EB", border: "1px solid #2563EB20" }}>{r.circleAccount.circle.name}</span>
      ),
    },
    {
      key: "principal",
      header: "Principal",
      align: "right",
      mono: true,
      render: (r) => <span className="font-semibold text-slate-900 dark:text-white">{formatNaira(r.circleAccount.principalAmount)}</span>,
    },
    {
      key: "interest",
      header: "Interest",
      align: "right",
      mono: true,
      render: (r) => <span className="font-semibold text-emerald-600">{formatNaira(r.circleAccount.interestEarned)}</span>,
    },
    {
      key: "amount",
      header: "Payout",
      align: "right",
      mono: true,
      render: (r) => <span className="font-bold text-blue-600">{formatNaira(r.amount)}</span>,
    },
    {
      key: "createdAt",
      header: "Requested",
      align: "right",
      mono: true,
      render: (r) => (
        <span className="text-slate-500 dark:text-slate-400">
          {new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      align: "right",
      render: (r) => {
        const st = statusStyles[r.status] || statusStyles.pending;
        return (
          <span className="rounded-md px-2 py-0.5 font-bold uppercase text-[9px]" style={{ backgroundColor: st.bg, color: st.color, border: `1px solid ${st.border}` }}>{r.status}</span>
        );
      },
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (r) => (
        <div className="flex justify-end gap-1.5">
          {r.status === "pending" && (
            <>
              <button onClick={(e) => { e.stopPropagation(); handleClearPayout(r.id); }} disabled={processingId === r.id}
                className="cursor-pointer rounded-md border border-blue-200 bg-blue-50 px-2 py-1 text-[10px] font-semibold text-blue-600"
                style={{ opacity: processingId === r.id ? 0.5 : 1 }}>
                {processingId === r.id ? "..." : "Clear"}
              </button>
              <button onClick={(e) => { e.stopPropagation(); setDeclineTarget(r.id); }} disabled={processingId === r.id}
                className="cursor-pointer rounded-md border border-red-200 bg-red-50 px-2 py-1 text-[10px] font-semibold text-red-600">
                Decline
              </button>
            </>
          )}
          {r.status === "cleared" && (
            <button onClick={(e) => { e.stopPropagation(); setDisburseTarget(r); setProofFile(null); setManualRef(""); setManualNote(""); }} disabled={processingId === r.id}
              className="cursor-pointer rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-600"
              style={{ opacity: processingId === r.id ? 0.5 : 1 }}>
              Disburse
            </button>
          )}
          {r.status === "disbursed" && r.disbursementProofUrl && (
            <a href={r.disbursementProofUrl} target="_blank" rel="noreferrer"
              className="cursor-pointer rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-2 py-1 text-[10px] font-semibold text-slate-600 dark:text-slate-400">
              Proof
            </a>
          )}
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="mx-auto max-w-[1280px] p-[clamp(1rem,3vw,2rem)]">
        <div className="p-16 text-center text-[13px] text-slate-500 dark:text-slate-400">Loading clearances...</div>
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
          <div className={`mb-6 rounded-2xl border px-4 py-3 text-[13px] font-medium ${message.type === "success" ? "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-900" : "bg-red-50 text-red-600 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-900"}`}>
            {message.text}
          </div>
        </FadeIn>
      )}

      <div className="mb-6 flex gap-2">
        <button onClick={() => setActiveTab("group")}
          className="cursor-pointer rounded-full border-[1.5px] px-5 py-2 text-[12px] font-semibold transition-all duration-150"
          style={{ backgroundColor: activeTab === "group" ? "#2563EB" : "#ffffff", color: activeTab === "group" ? "#ffffff" : "#717171", borderColor: activeTab === "group" ? "#2563EB" : "#EAEAEA" }}>
          Group Clearances
        </button>
        <button onClick={() => setActiveTab("circle")}
          className="cursor-pointer rounded-full border-[1.5px] px-5 py-2 text-[12px] font-semibold transition-all duration-150"
          style={{ backgroundColor: activeTab === "circle" ? "#2563EB" : "#ffffff", color: activeTab === "circle" ? "#ffffff" : "#717171", borderColor: activeTab === "circle" ? "#2563EB" : "#EAEAEA" }}>
          Circle Payouts {pendingPRCount > 0 && <span className="ml-1 rounded-full bg-red-600 px-1.5 text-[10px] text-white">{pendingPRCount}</span>}
        </button>
      </div>

      {activeTab === "group" && (
        <>
          <StaggerChildren staggerDelay={100} className="mb-8 grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
            <Card padding="1.5rem">
              <span className="block text-[9px] font-bold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">Total Clearances</span>
              <span className="mt-1 block font-mono text-2xl font-bold text-slate-900 dark:text-white">{totalItems}</span>
            </Card>
            <Card padding="1.5rem">
              <span className="block text-[9px] font-bold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">Cleared Amount</span>
              <span className="mt-1 block font-mono text-2xl font-bold text-emerald-600">{formatNaira(clearStats.totalCleared)}</span>
            </Card>
            <Card padding="1.5rem">
              <span className="block text-[9px] font-bold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">Pending Payout</span>
              <span className="mt-1 block font-mono text-2xl font-bold text-amber-600">{formatNaira(clearStats.totalPending)}</span>
            </Card>
          </StaggerChildren>

          <FadeInUp delay={300}>
            <Card padding="1.5rem" className="mb-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <span className="rounded-[0.375rem] px-2 py-0.5 text-[9px] font-bold uppercase" style={{ backgroundColor: "#2563EB12", color: "#2563EB" }}>
                  Clearance Records
                </span>
                <div className="flex gap-1 rounded-lg bg-slate-100 dark:bg-slate-800 p-1">
                  {(["all", "cleared", "partial", "pending"] as const).map((f) => (
                    <button key={f} onClick={() => { setFilter(f); setPage(1); }}
                      className="cursor-pointer rounded-md px-3 py-1.5 text-[11px] font-semibold capitalize"
                      style={{ backgroundColor: filter === f ? "#ffffff" : "transparent", color: filter === f ? "#2563EB" : "#717171", boxShadow: filter === f ? "0 1px 3px rgba(0,0,0,0.08)" : "none" }}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {(listLoading && paginatedItems.length === 0) ? (
                <div className="p-8 text-center text-[13px] text-slate-500 dark:text-slate-400">Loading...</div>
              ) : paginatedItems.length === 0 ? (
                <div className="p-8 text-center text-[13px] text-slate-500 dark:text-slate-400">No clearance records found.</div>
              ) : (
                <SimpleTable columns={clearanceColumns} data={paginatedItems} minWidth="650px" />
              )}
              <Pagination page={page} totalPages={totalPages} total={totalItems} limit={LIMIT} onPageChange={setPage} loading={listLoading} />
            </Card>
          </FadeInUp>
        </>
      )}

      {activeTab === "circle" && (
        <>
          <StaggerChildren staggerDelay={100} className="mb-8 grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
            <Card padding="1.5rem">
              <span className="block text-[9px] font-bold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">Pending Requests</span>
              <span className="mt-1 block font-mono text-2xl font-bold text-amber-600">{payoutRequests.filter((r) => r.status === "pending").length}</span>
            </Card>
            <Card padding="1.5rem">
              <span className="block text-[9px] font-bold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">Disbursed Total</span>
              <span className="mt-1 block font-mono text-2xl font-bold text-emerald-600">
                {formatNaira(payoutRequests.filter((r) => r.status === "disbursed").reduce((sum, r) => sum + r.amount, 0))}
              </span>
            </Card>
            <Card padding="1.5rem">
              <span className="block text-[9px] font-bold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">Total Requests</span>
              <span className="mt-1 block font-mono text-2xl font-bold text-slate-900 dark:text-white">{prTotal}</span>
            </Card>
          </StaggerChildren>

          <FadeInUp delay={300}>
            <Card padding="1.5rem">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <span className="rounded-[0.375rem] px-2 py-0.5 text-[9px] font-bold uppercase" style={{ backgroundColor: "#2563EB12", color: "#2563EB" }}>
                  Circle Payout Requests
                </span>
                <div className="flex gap-1 rounded-lg bg-slate-100 dark:bg-slate-800 p-1">
                  {(["all", "pending", "cleared", "disbursed", "declined"] as const).map((f) => (
                    <button key={f} onClick={() => { setPrFilter(f); setPrPage(1); }}
                      className="cursor-pointer rounded-md px-3 py-1.5 text-[11px] font-semibold capitalize"
                      style={{ backgroundColor: prFilter === f ? "#ffffff" : "transparent", color: prFilter === f ? "#2563EB" : "#717171", boxShadow: prFilter === f ? "0 1px 3px rgba(0,0,0,0.08)" : "none" }}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {payoutRequests.length === 0 ? (
                <div className="p-8 text-center text-[13px] text-slate-500 dark:text-slate-400">No circle payout requests found.</div>
              ) : (
                <SimpleTable columns={payoutColumns} data={payoutRequests} minWidth="750px" />
              )}
              <Pagination page={prPage} totalPages={prTotalPages} total={prTotal} limit={LIMIT} onPageChange={setPrPage} />
            </Card>
          </FadeInUp>
        </>
      )}

      <FadeInUp delay={400}>
        <Card padding="1.5rem">
          <div className="mb-4">
            <span className="rounded-[0.375rem] px-2 py-0.5 text-[9px] font-bold uppercase" style={{ backgroundColor: "#8A7D7312", color: "#8A7D73" }}>
              Clearance Process
            </span>
            <h2 className="mt-2 text-[1.125rem] font-medium text-slate-900 dark:text-white">How Clearance Works</h2>
          </div>
          <div className="flex flex-col gap-0">
            {[
              { step: 1, title: "Cycle Completion", desc: "All members complete their contributions for the current cycle.", color: "#2563EB" },
              { step: 2, title: "Payout Eligibility", desc: "The designated recipient is verified for clearance eligibility.", color: "#8A7D73" },
              { step: 3, title: "Clearance Approval", desc: "Circle leader or admin reviews and approves the payout.", color: "#3D4D40" },
              { step: 4, title: "Funds Disbursed", desc: "Wallet balance is credited and payout is recorded.", color: "#059669" },
            ].map((item, i) => (
              <div key={item.step} className="flex gap-4 py-4" style={{ borderBottom: i < 3 ? "1px solid #F0F0F0" : "none" }}>
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full font-mono text-[12px] font-bold" style={{ backgroundColor: `${item.color}15`, color: item.color }}>{item.step}</div>
                <div>
                  <span className="block text-[12px] font-semibold text-slate-900 dark:text-white">{item.title}</span>
                  <span className="text-[11px] font-light text-slate-500 dark:text-slate-400">{item.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </FadeInUp>

      {declineTarget && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 p-4" onClick={() => { setDeclineTarget(null); setDeclineNote(""); }}>
          <div className="w-full max-w-[400px] rounded-2xl bg-white p-8 shadow-[0_20px_60px_rgba(0,0,0,0.15)]" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-2 text-base font-semibold text-slate-900 dark:text-white">Decline Payout Request</h3>
            <p className="mb-4 text-[12px] text-slate-500 dark:text-slate-400">Optionally provide a reason for declining.</p>
            <textarea value={declineNote} onChange={(e) => setDeclineNote(e.target.value)} placeholder="Reason (optional)"
              rows={3}
              className="mb-4 w-full resize-y rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-[13px] outline-none" />
            <div className="flex gap-3">
              <button onClick={() => { setDeclineTarget(null); setDeclineNote(""); }}
                className="flex-1 cursor-pointer rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-2.5 text-[13px] font-medium">Cancel</button>
              <button onClick={() => handleDeclinePayout(declineTarget)} disabled={processingId === declineTarget}
                className="flex-1 cursor-pointer rounded-lg bg-red-600 px-2.5 py-2.5 text-[13px] font-semibold text-white"
                style={{ opacity: processingId === declineTarget ? 0.5 : 1 }}>
                {processingId === declineTarget ? "Declining..." : "Decline"}
              </button>
            </div>
          </div>
        </div>
      )}

      {disburseTarget && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 p-4" onClick={() => setDisburseTarget(null)}>
          <div className="max-h-[90vh] w-full max-w-[440px] overflow-y-auto rounded-2xl bg-white p-8 shadow-[0_20px_60px_rgba(0,0,0,0.15)]" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-1 text-base font-semibold text-slate-900 dark:text-white">Disburse Payout</h3>
            <p className="mb-4 text-[12px] text-slate-500 dark:text-slate-400">
              {disburseTarget.user.name} · <span className="font-mono font-semibold">{formatNaira(disburseTarget.amount)}</span>
            </p>

            <div className="mb-5 rounded-2xl border border-emerald-100 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-900/20 p-4">
              <span className="mb-1 block text-[11px] font-semibold text-slate-900 dark:text-white">Option 1 — Flutterwave Transfer</span>
              <span className="mb-3 block text-[11px] text-slate-500 dark:text-slate-400">Sends funds directly to the member&apos;s saved bank account.</span>
              <button onClick={() => handleDisburseFlutterwave(disburseTarget.id)} disabled={processingId === disburseTarget.id}
                className="w-full cursor-pointer rounded-lg bg-emerald-600 px-2.5 py-2.5 text-[13px] font-semibold text-white"
                style={{ opacity: processingId === disburseTarget.id ? 0.5 : 1 }}>
                {processingId === disburseTarget.id ? "Processing..." : "Transfer via Flutterwave"}
              </button>
            </div>

            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-800/60 p-4">
              <span className="mb-1 block text-[11px] font-semibold text-slate-900 dark:text-white">Option 2 — Manual (mark disbursed)</span>
              <span className="mb-3 block text-[11px] text-slate-500 dark:text-slate-400">Record an external payment with proof and/or reference.</span>
              <label className="mb-1.5 block text-[11px] font-semibold text-slate-900 dark:text-white">Proof of Payment</label>
              <input type="file" accept="image/*,application/pdf" onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                className="mb-3 w-full text-[12px]" />
              <label className="mb-1.5 block text-[11px] font-semibold text-slate-900 dark:text-white">Reference</label>
              <input type="text" value={manualRef} onChange={(e) => setManualRef(e.target.value)} placeholder="e.g. bank transfer ref"
                className="mb-3 w-full rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-[13px] outline-none" />
              <label className="mb-1.5 block text-[11px] font-semibold text-slate-900 dark:text-white">Note</label>
              <textarea value={manualNote} onChange={(e) => setManualNote(e.target.value)} rows={2} placeholder="Optional note"
                className="mb-3 w-full resize-y rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-[13px] outline-none" />
              <button onClick={() => handleMarkDisbursed(disburseTarget.id)} disabled={processingId === disburseTarget.id || proofUploading}
                className="w-full cursor-pointer rounded-lg px-2.5 py-2.5 text-[13px] font-semibold text-white"
                style={{ backgroundColor: "#2563EB", opacity: processingId === disburseTarget.id || proofUploading ? 0.5 : 1 }}>
                {proofUploading ? "Uploading..." : processingId === disburseTarget.id ? "Saving..." : "Mark as Disbursed"}
              </button>
            </div>

            <button onClick={() => setDisburseTarget(null)}
              className="mt-4 w-full cursor-pointer rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-2.5 text-[13px] font-medium">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
