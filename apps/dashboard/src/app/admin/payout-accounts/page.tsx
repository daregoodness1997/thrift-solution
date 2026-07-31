"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, FadeIn, FadeInUp } from "@thrift/ui";
import { useAuth } from "@/lib/auth-context";
import { CreditCard, CheckCircle2, XCircle, Clock, X } from "lucide-react";
import Pagination from "@/components/Pagination";
import { SimpleTable, SimpleColumn } from "@/components/SimpleTable";
import { useConfirm } from "@/components/ConfirmDialog";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const LIMIT = 20;

interface PayoutAccount {
  id: string;
  name: string;
  email: string;
  accountNumber: string;
  bankName: string | null;
  bankCode: string | null;
  bankAccountNumber: string | null;
  bankAccountName: string | null;
  bankAccountStatus: string | null;
  bankAccountRejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
}

const STATUSES = ["pending", "approved", "rejected"] as const;
type Status = (typeof STATUSES)[number];

export default function AdminPayoutAccountsPage() {
  const { user, token, loading: authLoading } = useAuth();
  const { confirm, Dialog } = useConfirm();
  const router = useRouter();
  const isAdmin = user?.role === "admin" || user?.role === "superadmin";

  const [items, setItems] = useState<PayoutAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<Status>("pending");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<PayoutAccount | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (!authLoading && user && !isAdmin) router.replace("/");
  }, [authLoading, user, isAdmin, router]);

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const fetchAccounts = useCallback(async () => {
    if (!token || !isAdmin) { setLoading(false); return; }
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT), status: statusFilter });
      if (search.trim()) params.set("search", search.trim());
      const res = await fetch(`${API_URL}/api/admin/payout-accounts?${params}`, {
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

  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

  const handleApprove = async (acc: PayoutAccount) => {
    const proceed = await confirm({ variant: "success", title: "Approve payout account?", description: `${acc.name}'s bank account will be approved for future disbursements.`, confirmLabel: "Approve" });
    if (!proceed) return;
    setBusyId(acc.id);
    try {
      const res = await fetch(`${API_URL}/api/admin/payout-accounts/${acc.id}/approve`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        showMessage("success", `${acc.name}'s payout account approved`);
        fetchAccounts();
      } else {
        showMessage("error", data.error || "Approval failed");
      }
    } catch {
      showMessage("error", "Approval failed");
    }
    setBusyId(null);
  };

  const handleReject = async () => {
    if (!rejecting) return;
    setBusyId(rejecting.id);
    try {
      const res = await fetch(`${API_URL}/api/admin/payout-accounts/${rejecting.id}/reject`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectReason.trim() || undefined }),
      });
      const data = await res.json();
      if (data.success) {
        showMessage("success", `${rejecting.name}'s payout account rejected`);
        setRejecting(null);
        setRejectReason("");
        fetchAccounts();
      } else {
        showMessage("error", data.error || "Rejection failed");
      }
    } catch {
      showMessage("error", "Rejection failed");
    }
    setBusyId(null);
  };

  if (authLoading) return null;
  if (!isAdmin) return null;

  const columns: SimpleColumn<PayoutAccount>[] = [
    {
      key: "user",
      header: "User",
      render: (a) => (
        <>
          <span className="block font-semibold text-slate-900 dark:text-white">{a.name}</span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">{a.email} · {a.accountNumber}</span>
        </>
      ),
    },
    {
      key: "bank",
      header: "Bank",
      render: (a) => (
        <>
          <span className="block font-semibold text-slate-900 dark:text-white">{a.bankName || "—"}</span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">{a.bankCode || "—"}</span>
        </>
      ),
    },
    {
      key: "account",
      header: "Account",
      mono: true,
      render: (a) => (
        <>
          <span className="block font-mono text-slate-900 dark:text-white">{a.bankAccountNumber || "—"}</span>
          <span className="block text-[11px] text-slate-500 dark:text-slate-400">{a.bankAccountName || "—"}</span>
        </>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (a) => {
        const status = a.bankAccountStatus || "pending";
        if (status === "approved") {
          return (
            <span className="inline-flex items-center gap-1 rounded-md border border-emerald-300 bg-emerald-50 px-2 py-0.5 font-mono text-[9px] font-bold uppercase text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400">
              <CheckCircle2 className="w-3 h-3" />
              Approved
            </span>
          );
        }
        if (status === "rejected") {
          return (
            <span className="inline-flex items-center gap-1 rounded-md border border-red-300 bg-red-50 px-2 py-0.5 font-mono text-[9px] font-bold uppercase text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400">
              <XCircle className="w-3 h-3" />
              Rejected
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1 rounded-md border border-amber-300 bg-amber-50 px-2 py-0.5 font-mono text-[9px] font-bold uppercase text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
      },
    },
    {
      key: "reason",
      header: "Reason",
      render: (a) => (
        <span className="text-[11px] text-slate-500 dark:text-slate-400">
          {a.bankAccountStatus === "rejected" ? a.bankAccountRejectionReason || "—" : "—"}
        </span>
      ),
    },
    {
      key: "updatedAt",
      header: "Updated",
      render: (a) => (
        <span className="text-[11px] text-slate-500 dark:text-slate-400">
          {new Date(a.updatedAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (a) => (
        <div className="flex justify-end gap-1.5">
          {a.bankAccountStatus === "pending" && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleApprove(a);
                }}
                disabled={busyId === a.id}
                className={`cursor-pointer rounded-md border border-emerald-300 bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400 ${busyId === a.id ? "opacity-50" : ""}`}
              >
                {busyId === a.id ? "..." : "Approve"}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setRejecting(a);
                  setRejectReason("");
                }}
                disabled={busyId === a.id}
                className={`cursor-pointer rounded-md border border-red-300 bg-red-50 px-2 py-1 text-[10px] font-semibold text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400 ${busyId === a.id ? "opacity-50" : ""}`}
              >
                Reject
              </button>
            </>
          )}
          {a.bankAccountStatus === "approved" && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setRejecting(a);
                setRejectReason("");
              }}
              disabled={busyId === a.id}
              className={`cursor-pointer rounded-md border border-red-300 bg-red-50 px-2 py-1 text-[10px] font-semibold text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400 ${busyId === a.id ? "opacity-50" : ""}`}
            >
              Revoke
            </button>
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
              <CreditCard className="w-3.5 h-3.5 text-amber-500" />
              <span>Admin</span>
            </span>
          </div>
          <h3 className="font-display font-bold text-xl sm:text-2xl text-slate-900 dark:text-white mt-1">Payout <span className="bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 bg-clip-text font-display font-bold text-transparent">Accounts</span></h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Review and approve members&apos; payout bank accounts before disbursements.</p>
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
            <div className="flex gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
              {STATUSES.map((f) => (
                <button key={f} onClick={() => { setStatusFilter(f); setPage(1); }}
                  className={`cursor-pointer rounded-md px-3 py-1.5 text-[11px] font-semibold capitalize transition-colors ${statusFilter === f ? "bg-white text-blue-600 shadow-sm dark:bg-slate-700 dark:text-blue-400" : "text-slate-500 dark:text-slate-400"}`}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-[13px] text-slate-500 dark:text-slate-400">Loading payout accounts...</div>
          ) : (
            <SimpleTable
              columns={columns}
              data={items}
              minWidth="900px"
              emptyMessage={
                statusFilter === "pending"
                  ? "No pending payout accounts. 🎉"
                  : "No payout accounts found."
              }
            />
          )}
          <Pagination page={page} totalPages={totalPages} total={total} limit={LIMIT} onPageChange={setPage} loading={loading} />
        </Card>
      </FadeInUp>

      {rejecting && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 p-4" onClick={() => setRejecting(null)}>
          <div className="w-full max-w-[440px] rounded-3xl bg-white p-8 shadow-[0_20px_60px_rgba(0,0,0,0.15)] dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <span className="inline-block rounded-full bg-red-600/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-red-600 dark:bg-red-500/15 dark:text-red-400">Reject Payout Account</span>
              <button onClick={() => setRejecting(null)} className="cursor-pointer rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="w-4 h-4" />
              </button>
            </div>
            <h3 className="mb-1 mt-3 text-base font-semibold text-slate-900 dark:text-white">{rejecting.name}</h3>
            <p className="mb-6 text-[12px] text-slate-500 dark:text-slate-400">
              {rejecting.bankName || "—"} · {rejecting.bankAccountNumber || "—"}
            </p>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase tracking-[0.1em] text-slate-400 font-bold">
                Reason (optional)
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                placeholder="e.g. Account name mismatch with KYC"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div className="mt-6 flex gap-3">
              <button className="btn-secondary" onClick={() => setRejecting(null)}>Cancel</button>
              <button onClick={handleReject} disabled={busyId === rejecting.id}
                className={`btn-primary flex-1 ${busyId === rejecting.id ? "opacity-50" : ""}`}>
                {busyId === rejecting.id ? "Rejecting..." : "Reject Account"}
              </button>
            </div>
          </div>
        </div>
      )}
      {Dialog}
    </div>
  );
}
