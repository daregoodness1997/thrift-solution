"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, FadeIn, FadeInUp } from "@thrift/ui";
import { useAuth } from "@/lib/auth-context";
import { Banknote, CheckCircle2, XCircle, Clock, X, Loader2, ShieldCheck } from "lucide-react";
import Pagination from "@/components/Pagination";
import { SimpleTable, SimpleColumn } from "@/components/SimpleTable";
import { formatNaira } from "@thrift/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const LIMIT = 20;

interface PayoutRequestUser {
  id: string;
  name: string;
  email: string;
  accountNumber: string;
  bankName: string | null;
  bankCode: string | null;
  bankAccountNumber: string | null;
  bankAccountName: string | null;
  bankAccountStatus: string | null;
}

interface PayoutRequest {
  id: string;
  amount: number;
  note?: string | null;
  status: string;
  disbursementStatus: string;
  disbursementRef?: string | null;
  disbursementProofUrl?: string | null;
  disbursementNote?: string | null;
  reviewedNote?: string | null;
  reviewedAt?: string | null;
  disbursedAt?: string | null;
  createdAt: string;
  user: PayoutRequestUser;
  reviewedBy?: { id: string; name: string; email: string } | null;
  payoutBankAccountNumber?: string | null;
  payoutBankCode?: string | null;
  payoutBankName?: string | null;
  payoutBankAccountName?: string | null;
}

const STATUSES = ["pending", "approved", "disbursed", "rejected", "cancelled"] as const;
type Status = (typeof STATUSES)[number];

type ActionTarget =
  | { kind: "reject"; request: PayoutRequest }
  | { kind: "disburse"; request: PayoutRequest }
  | { kind: "markDisbursed"; request: PayoutRequest };

export default function AdminPayoutRequestsPage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const isAdmin = user?.role === "admin" || user?.role === "superadmin";

  const [items, setItems] = useState<PayoutRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<Status>("pending");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [target, setTarget] = useState<ActionTarget | null>(null);
  const [note, setNote] = useState("");
  const [pin, setPin] = useState("");
  const [proofUrl, setProofUrl] = useState("");
  const [reference, setReference] = useState("");

  useEffect(() => {
    if (!authLoading && user && !isAdmin) router.replace("/");
  }, [authLoading, user, isAdmin, router]);

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const fetchRequests = useCallback(async () => {
    if (!token || !isAdmin) { setLoading(false); return; }
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT), status: statusFilter });
      if (search.trim()) params.set("search", search.trim());
      const res = await fetch(`${API_URL}/api/admin/payout-requests?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setItems(data.data.items || []);
        setTotalPages(data.data.totalPages || 1);
        setTotal(data.data.total || 0);
      }
    } catch {}
    setLoading(false);
  }, [token, isAdmin, page, statusFilter, search]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const postAction = async (path: string, body?: Record<string, unknown>) => {
    const res = await fetch(`${API_URL}/api/admin/payout-requests/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body || {}),
    });
    return res.json();
  };

  const handleApprove = async (request: PayoutRequest) => {
    setBusyId(request.id);
    try {
      const data = await postAction(`${request.id}/approve`, { note: note.trim() || undefined });
      if (data.success) {
        showMessage("success", `Payout of ${formatNaira(request.amount)} approved`);
        setTarget(null);
        setNote("");
        fetchRequests();
      } else {
        showMessage("error", data.error || "Approval failed");
      }
    } catch {
      showMessage("error", "Approval failed");
    }
    setBusyId(null);
  };

  const handleReject = async () => {
    if (!target || target.kind !== "reject") return;
    setBusyId(target.request.id);
    try {
      const data = await postAction(`${target.request.id}/reject`, { reason: note.trim() || undefined });
      if (data.success) {
        showMessage("success", `Payout of ${formatNaira(target.request.amount)} rejected`);
        setTarget(null);
        setNote("");
        fetchRequests();
      } else {
        showMessage("error", data.error || "Rejection failed");
      }
    } catch {
      showMessage("error", "Rejection failed");
    }
    setBusyId(null);
  };

  const handleDisburse = async () => {
    if (!target || target.kind !== "disburse") return;
    if (!/^\d{4,6}$/.test(pin)) {
      showMessage("error", "Enter your 4-6 digit transaction PIN");
      return;
    }
    setBusyId(target.request.id);
    try {
      const data = await postAction(`${target.request.id}/disburse`, { pin });
      if (data.success) {
        showMessage("success", `Disbursement initiated for ${formatNaira(target.request.amount)}`);
        setTarget(null);
        setPin("");
        fetchRequests();
      } else {
        showMessage("error", data.error || "Disbursement failed");
      }
    } catch {
      showMessage("error", "Disbursement failed");
    }
    setBusyId(null);
  };

  const handleMarkDisbursed = async () => {
    if (!target || target.kind !== "markDisbursed") return;
    if (!/^\d{4,6}$/.test(pin)) {
      showMessage("error", "Enter your 4-6 digit transaction PIN");
      return;
    }
    if (!proofUrl.trim() && !reference.trim()) {
      showMessage("error", "Provide a proof URL or a transfer reference");
      return;
    }
    setBusyId(target.request.id);
    try {
      const data = await postAction(`${target.request.id}/mark-disbursed`, {
        pin,
        proofUrl: proofUrl.trim() || undefined,
        reference: reference.trim() || undefined,
        note: note.trim() || undefined,
      });
      if (data.success) {
        showMessage("success", `Payout of ${formatNaira(target.request.amount)} marked disbursed`);
        setTarget(null);
        setPin("");
        setProofUrl("");
        setReference("");
        setNote("");
        fetchRequests();
      } else {
        showMessage("error", data.error || "Mark disbursed failed");
      }
    } catch {
      showMessage("error", "Mark disbursed failed");
    }
    setBusyId(null);
  };

  const statusBadge = (status: string) => {
    if (status === "disbursed") {
      return (
        <span className="inline-flex items-center gap-1 rounded-md border border-emerald-300 bg-emerald-50 px-2 py-0.5 font-mono text-[9px] font-bold uppercase text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400">
          <CheckCircle2 className="w-3 h-3" />
          Disbursed
        </span>
      );
    }
    if (status === "approved") {
      return (
        <span className="inline-flex items-center gap-1 rounded-md border border-blue-300 bg-blue-50 px-2 py-0.5 font-mono text-[9px] font-bold uppercase text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-400">
          <ShieldCheck className="w-3 h-3" />
          Approved
        </span>
      );
    }
    if (status === "rejected" || status === "cancelled") {
      return (
        <span className="inline-flex items-center gap-1 rounded-md border border-red-300 bg-red-50 px-2 py-0.5 font-mono text-[9px] font-bold uppercase text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400">
          <XCircle className="w-3 h-3" />
          {status === "rejected" ? "Rejected" : "Cancelled"}
        </span>
      );
    }
    if (status === "disbursement_failed") {
      return (
        <span className="inline-flex items-center gap-1 rounded-md border border-red-300 bg-red-50 px-2 py-0.5 font-mono text-[9px] font-bold uppercase text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400">
          <XCircle className="w-3 h-3" />
          Failed
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-amber-300 bg-amber-50 px-2 py-0.5 font-mono text-[9px] font-bold uppercase text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400">
        <Clock className="w-3 h-3" />
        Pending
      </span>
    );
  };

  if (authLoading) return null;
  if (!isAdmin) return null;

  const columns: SimpleColumn<PayoutRequest>[] = [
    {
      key: "user",
      header: "User",
      render: (r) => (
        <>
          <span className="block font-semibold text-slate-900 dark:text-white">{r.user.name}</span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">{r.user.email} · {r.user.accountNumber}</span>
        </>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      mono: true,
      render: (r) => (
        <span className="font-mono font-bold text-slate-900 dark:text-white">{formatNaira(r.amount)}</span>
      ),
    },
    {
      key: "bank",
      header: "Bank Account",
      render: (r) => (
        <>
          <span className="block font-mono text-slate-900 dark:text-white">{r.payoutBankAccountNumber || r.user.bankAccountNumber || "—"}</span>
          <span className="block text-[11px] text-slate-500 dark:text-slate-400">{r.payoutBankAccountName || r.user.bankAccountName || r.payoutBankName || r.user.bankName || "—"}</span>
        </>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (r) => statusBadge(r.status),
    },
    {
      key: "note",
      header: "Note",
      render: (r) => (
        <span className="block max-w-[180px] truncate text-[11px] text-slate-500 dark:text-slate-400" title={r.note || ""}>
          {r.note || "—"}
        </span>
      ),
    },
    {
      key: "createdAt",
      header: "Requested",
      render: (r) => (
        <span className="text-[11px] text-slate-500 dark:text-slate-400">
          {new Date(r.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (r) => (
        <div className="flex justify-end gap-1.5">
          {r.status === "pending" && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); setNote(""); handleApprove(r); }}
                disabled={busyId === r.id}
                className={`cursor-pointer rounded-md border border-emerald-300 bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400 ${busyId === r.id ? "opacity-50" : ""}`}
              >
                Approve
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setNote(""); setTarget({ kind: "reject", request: r }); }}
                disabled={busyId === r.id}
                className={`cursor-pointer rounded-md border border-red-300 bg-red-50 px-2 py-1 text-[10px] font-semibold text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400 ${busyId === r.id ? "opacity-50" : ""}`}
              >
                Reject
              </button>
            </>
          )}
          {r.status === "approved" && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); setPin(""); setTarget({ kind: "disburse", request: r }); }}
                disabled={busyId === r.id}
                className={`cursor-pointer rounded-md border border-blue-300 bg-blue-50 px-2 py-1 text-[10px] font-semibold text-blue-700 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-400 ${busyId === r.id ? "opacity-50" : ""}`}
              >
                Disburse
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setPin(""); setProofUrl(""); setReference(""); setNote(""); setTarget({ kind: "markDisbursed", request: r }); }}
                disabled={busyId === r.id}
                className={`cursor-pointer rounded-md border border-slate-300 bg-slate-50 px-2 py-1 text-[10px] font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 ${busyId === r.id ? "opacity-50" : ""}`}
              >
                Mark Disbursed
              </button>
            </>
          )}
        </div>
      ),
    },
  ];
  return (
    <div className="mx-auto max-w-[1280px] p-[clamp(1rem,3vw,2rem)]">
      <div className="mb-8 pt-2 pb-6 border-b border-slate-200/80 dark:border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/80 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1">
              <Banknote className="w-3.5 h-3.5 text-amber-500" />
              <span>Admin</span>
            </span>
          </div>
          <h3 className="font-display font-bold text-xl sm:text-2xl text-slate-900 dark:text-white mt-1">Payout <span className="bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 bg-clip-text font-display font-bold text-transparent">Requests</span></h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Approve wallet payouts and disburse them to members&apos; approved bank accounts.</p>
        </div>
      </div>

      {message && (
        <FadeIn>
          <div className={`mb-6 rounded-2xl border px-4 py-3 text-[13px] font-medium ${message.type === "success" ? "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50" : "bg-red-50 text-red-600 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50"}`}>
            {message.text}
          </div>
        </FadeIn>
      )}

      <FadeInUp delay={200}>
        <Card padding="1.5rem" className="rounded-3xl">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search name, email, account no."
              className="min-w-[260px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
            <div className="flex flex-wrap gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
              {STATUSES.map((f) => (
                <button key={f} onClick={() => { setStatusFilter(f); setPage(1); }}
                  className={`cursor-pointer rounded-md px-3 py-1.5 text-[11px] font-semibold capitalize transition-colors ${statusFilter === f ? "bg-white text-blue-600 shadow-sm dark:bg-slate-700 dark:text-blue-400" : "text-slate-500 dark:text-slate-400"}`}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-[13px] text-slate-500 dark:text-slate-400">Loading payout requests...</div>
          ) : (
            <SimpleTable
              columns={columns}
              data={items}
              minWidth="1000px"
              emptyMessage={statusFilter === "pending" ? "No pending payout requests. 🎉" : "No payout requests found."}
            />
          )}
          <Pagination page={page} totalPages={totalPages} total={total} limit={LIMIT} onPageChange={setPage} loading={loading} />
        </Card>
      </FadeInUp>

      {target && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 p-4" onClick={() => setTarget(null)}>
          <div className="w-full max-w-[440px] rounded-3xl bg-white p-8 shadow-[0_20px_60px_rgba(0,0,0,0.15)] dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <span className="inline-block rounded-full bg-blue-600/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:bg-blue-500/15 dark:text-blue-400">
                {target.kind === "reject" ? "Reject Payout" : target.kind === "disburse" ? "Disburse Payout" : "Mark as Disbursed"}
              </span>
              <button onClick={() => setTarget(null)} className="cursor-pointer rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="w-4 h-4" />
              </button>
            </div>
            <h3 className="mb-1 mt-3 text-base font-semibold text-slate-900 dark:text-white">
              {formatNaira(target.request.amount)} → {target.request.payoutBankAccountName || target.request.user.bankAccountName || target.request.user.name}
            </h3>
            <p className="mb-6 text-[12px] text-slate-500 dark:text-slate-400">
              {target.request.payoutBankName || target.request.user.bankName || "—"} · {target.request.payoutBankAccountNumber || target.request.user.bankAccountNumber || "—"}
            </p>

            {target.kind === "reject" && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase tracking-[0.1em] text-slate-400 font-bold">Reason (optional)</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  placeholder="e.g. Amount exceeds available balance"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            )}

            {target.kind === "disburse" && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase tracking-[0.1em] text-slate-400 font-bold">Your Transaction PIN</label>
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="Enter your 4-6 digit PIN"
                  maxLength={6}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] tracking-[0.4em] font-mono outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
                <p className="text-[11px] text-slate-400">This will debit the member&apos;s wallet and pay the approved bank account via Flutterwave.</p>
              </div>
            )}

            {target.kind === "markDisbursed" && (
              <div className="space-y-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase tracking-[0.1em] text-slate-400 font-bold">Your Transaction PIN</label>
                  <input
                    type="password"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="Enter your 4-6 digit PIN"
                    maxLength={6}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] tracking-[0.4em] font-mono outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase tracking-[0.1em] text-slate-400 font-bold">Proof URL (required)</label>
                  <input
                    value={proofUrl}
                    onChange={(e) => setProofUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase tracking-[0.1em] text-slate-400 font-bold">Transfer Reference (optional)</label>
                  <input
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="e.g. BANK-REF-123"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase tracking-[0.1em] text-slate-400 font-bold">Note (optional)</label>
                  <input
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Anything about this disbursement"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>
            )}

            <div className="mt-6 flex gap-3">
              <button className="btn-secondary" onClick={() => setTarget(null)}>Cancel</button>
              <button
                onClick={() => {
                  if (target.kind === "reject") handleReject();
                  else if (target.kind === "disburse") handleDisburse();
                  else handleMarkDisbursed();
                }}
                disabled={busyId === target.request.id}
                className={`btn-primary flex-1 ${busyId === target.request.id ? "opacity-50" : ""} flex items-center justify-center gap-2`}
              >
                {busyId === target.request.id && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {busyId === target.request.id ? "Working..." : target.kind === "reject" ? "Reject Payout" : target.kind === "disburse" ? "Disburse Now" : "Mark as Disbursed"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
