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
  cleared: { bg: "#ECFDF5", color: "#059669", border: "#A7F3D0" },
};

export default function DefaultManagementPage() {
  const { token } = useAuth();
  const [cfg] = useState<BrandConfig>(config);
  const [defaults, setDefaults] = useState<DefaultItem[]>([]);
  const [filter, setFilter] = useState<"all" | "overdue" | "pending" | "resolved">("all");
  const [showReminder, setShowReminder] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [defStats, setDefStats] = useState({ totalDefaults: 0, totalOverdue: 0, totalPending: 0 });
  const [resolveTarget, setResolveTarget] = useState<string | null>(null);
  const [proofUrl, setProofUrl] = useState("");
  const [resolveNote, setResolveNote] = useState("");
  const [processingResolve, setProcessingResolve] = useState(false);
   const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

   const showMessage = (type: "success" | "error", text: string) => {
     setMessage({ type, text });
     setTimeout(() => setMessage(null), 4000);
   };

   const LIMIT = 20;
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  const fetchDefaults = useCallback(async () => {
    if (!token) { setLoading(false); return; }
    try {
      const statusParam = filter !== "all" ? `&status=${filter}` : "";
      const res = await fetch(`${API_URL}/api/defaults?page=${page}&limit=${LIMIT}${statusParam}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) {
        setDefaults(data.data.items || []);
        setTotalPages(data.data.totalPages || 1);
        setTotal(data.data.total || 0);
        if (data.data.stats) setDefStats(data.data.stats);
      }
    } catch {}
    setLoading(false);
  }, [token, API_URL, page, LIMIT, filter]);

  useEffect(() => { fetchDefaults(); }, [fetchDefaults]);

  const handleFilterChange = (f: typeof filter) => {
    setFilter(f);
    setPage(1);
  };

  const filtered = defaults;

  const sendReminder = (id: string) => {
    setShowReminder(id);
    setTimeout(() => setShowReminder(null), 2000);
  };

  const markResolved = async (id: string) => {
    if (!token) return;
    setProcessingResolve(true);
    try {
      const res = await fetch(`${API_URL}/api/defaults/${id}/resolve`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ proofUrl: proofUrl || undefined, note: resolveNote || undefined }),
      });
      const data = await res.json();
      if (data.success) {
        setDefaults((prev) => prev.map((d) => d.id === id ? { ...d, status: "resolved", daysOverdue: 0 } : d));
        setResolveTarget(null);
        setProofUrl("");
        setResolveNote("");
        showMessage("success", "Default marked as cleared");
      } else {
        showMessage("error", data.error || "Failed to resolve default");
      }
    } catch {
      showMessage("error", "Failed to resolve default");
    }
    setProcessingResolve(false);
  };

  const columns: SimpleColumn<DefaultItem>[] = [
    {
      key: "userName",
      header: "Member",
      render: (d) => {
        const initials = d.userName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
        return (
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold" style={{ backgroundColor: "#2563EB15", color: "#2563EB" }}>
              {initials}
            </div>
            <span className="font-medium text-slate-900 dark:text-white">{d.userName}</span>
          </div>
        );
      },
    },
    {
      key: "groupName",
      header: "Circle",
      render: (d) => (
        <span className="rounded-md px-2 py-0.5 font-mono text-[9px] font-bold uppercase" style={{ backgroundColor: "#2563EB12", color: "#2563EB", border: "1px solid #2563EB20" }}>{d.groupName}</span>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      mono: true,
      render: (d) => <span className="font-semibold text-slate-900 dark:text-white">{formatNaira(d.amount)}</span>,
    },
    {
      key: "dueDate",
      header: "Due Date",
      render: (d) => (
        <span className="font-mono text-slate-500 dark:text-slate-400">
          {new Date(d.dueDate).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
          {d.daysOverdue > 0 && <span className="ml-1.5 text-[9px] text-red-600">({d.daysOverdue}d late)</span>}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      align: "right",
      render: (d) => {
        const st = statusStyles[d.status] || statusStyles.pending;
        return (
          <span className="rounded-md px-2 py-0.5 font-bold uppercase text-[9px]" style={{ backgroundColor: st.bg, color: st.color, border: `1px solid ${st.border}` }}>{d.status}</span>
        );
      },
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (d) => (
        <div className="flex justify-end gap-1.5">
          {d.status !== "resolved" && (
            <button onClick={(e) => { e.stopPropagation(); setResolveTarget(d.id); setProofUrl(""); setResolveNote(""); }}
              className="cursor-pointer rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-600">
              Mark Cleared
            </button>
          )}
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="mx-auto max-w-[1280px] p-[clamp(1rem,3vw,2rem)]">
        <div className="p-16 text-center text-[13px] text-slate-500 dark:text-slate-400">Loading defaults...</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1280px] p-[clamp(1rem,3vw,2rem)]">
      <PageHeader
        badgeLabel="Member Management"
        heading="Default"
        accentText="Management"
        description="Track and manage missed contributions across your circles."
      />

      <StaggerChildren staggerDelay={100} className="mb-8 grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
        <Card padding="1.5rem">
          <span className="block text-[9px] font-bold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">Total Defaults</span>
          <span className="mt-1 block font-mono text-2xl font-bold text-slate-900 dark:text-white">{defStats.totalDefaults}</span>
        </Card>
        <Card padding="1.5rem">
          <span className="block text-[9px] font-bold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">Overdue Amount</span>
          <span className="mt-1 block font-mono text-2xl font-bold text-red-600">{formatNaira(defStats.totalOverdue)}</span>
        </Card>
        <Card padding="1.5rem">
          <span className="block text-[9px] font-bold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">Pending Amount</span>
          <span className="mt-1 block font-mono text-2xl font-bold text-amber-600">{formatNaira(defStats.totalPending)}</span>
        </Card>
      </StaggerChildren>

      {message && (
        <FadeIn>
          <div className={`mb-6 rounded-2xl border px-4 py-3 text-[13px] font-medium ${message.type === "success" ? "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-900" : "bg-red-50 text-red-600 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-900"}`}>
            {message.text}
          </div>
        </FadeIn>
      )}

      <FadeInUp delay={300}>
        <Card padding="1.5rem" className="mb-6">
          <div className="mb-4 flex items-center justify-between">
            <span className="rounded-[0.375rem] px-2 py-0.5 text-[9px] font-bold uppercase" style={{ backgroundColor: "#2563EB12", color: "#2563EB" }}>
              Defaulters
            </span>
            <div className="flex gap-1 rounded-lg bg-slate-100 dark:bg-slate-800 p-1">
              {(["all", "overdue", "pending", "resolved"] as const).map((f) => (
                <button key={f} onClick={() => handleFilterChange(f)}
                  className="cursor-pointer rounded-md px-3 py-1.5 text-[11px] font-semibold capitalize"
                  style={{ backgroundColor: filter === f ? "#ffffff" : "transparent", color: filter === f ? "#2563EB" : "#717171", boxShadow: filter === f ? "0 1px 3px rgba(0,0,0,0.08)" : "none" }}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="p-8 text-center text-[13px] text-slate-500 dark:text-slate-400">
              No default records found.
            </div>
          ) : (
            <SimpleTable columns={columns} data={filtered} minWidth="600px" />
          )}
          <Pagination page={page} totalPages={totalPages} total={total} limit={LIMIT} onPageChange={setPage} loading={loading} />
        </Card>
      </FadeInUp>

      <FadeInUp delay={400}>
        <Card padding="1.5rem">
          <div className="mb-4">
            <span className="rounded-[0.375rem] px-2 py-0.5 text-[9px] font-bold uppercase" style={{ backgroundColor: "#8A7D7312", color: "#8A7D73" }}>
              Policy
            </span>
            <h2 className="mt-2 text-[1.125rem] font-medium text-slate-900 dark:text-white">Default Policy Settings</h2>
          </div>
          <div className="flex flex-col gap-0">
            <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80 py-3">
              <div>
                <span className="block text-[12px] font-medium text-slate-900 dark:text-white">Grace Period</span>
                <span className="text-[11px] font-light text-slate-500 dark:text-slate-400">Days after due date before marking as default</span>
              </div>
              <span className="font-mono text-[12px] font-semibold text-blue-600">3 days</span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80 py-3">
              <div>
                <span className="block text-[12px] font-medium text-slate-900 dark:text-white">Auto-reminders</span>
                <span className="text-[11px] font-light text-slate-500 dark:text-slate-400">Send automatic reminders to defaulting members</span>
              </div>
              <span className="text-[12px] font-semibold text-emerald-600">Enabled</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <span className="block text-[12px] font-medium text-slate-900 dark:text-white">Maximum Defaults</span>
                <span className="text-[11px] font-light text-slate-500 dark:text-slate-400">Consecutive defaults before member review</span>
              </div>
              <span className="font-mono text-[12px] font-semibold text-blue-600">2</span>
            </div>
          </div>
        </Card>
      </FadeInUp>

      {resolveTarget && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 p-4" onClick={() => { setResolveTarget(null); setProofUrl(""); setResolveNote(""); }}>
          <div className="w-full max-w-[400px] rounded-2xl bg-white p-8 shadow-[0_20px_60px_rgba(0,0,0,0.15)]" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-2 text-base font-semibold text-slate-900 dark:text-white">Mark Default as Cleared</h3>
            <p className="mb-4 text-[12px] text-slate-500 dark:text-slate-400">Provide proof of payment and/or a note for the record.</p>
            <label className="mb-1.5 block text-[11px] font-semibold text-slate-900 dark:text-white">Proof URL</label>
            <input type="text" value={proofUrl} onChange={(e) => setProofUrl(e.target.value)} placeholder="e.g. https://..."
              className="mb-3 w-full rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-[13px] outline-none" />
            <label className="mb-1.5 block text-[11px] font-semibold text-slate-900 dark:text-white">Reasoning / Note</label>
            <textarea value={resolveNote} onChange={(e) => setResolveNote(e.target.value)} placeholder="Optional note" rows={3}
              className="mb-4 w-full resize-y rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-[13px] outline-none" />
            <div className="flex gap-3">
              <button onClick={() => { setResolveTarget(null); setProofUrl(""); setResolveNote(""); }}
                className="flex-1 cursor-pointer rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-2.5 text-[13px] font-medium">Cancel</button>
              <button onClick={() => resolveTarget && markResolved(resolveTarget)} disabled={processingResolve}
                className="flex-1 cursor-pointer rounded-lg bg-emerald-600 px-2.5 py-2.5 text-[13px] font-semibold text-white"
                style={{ opacity: processingResolve ? 0.5 : 1 }}>
                {processingResolve ? "Saving..." : "Mark Cleared"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
