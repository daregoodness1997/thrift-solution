"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatNaira } from "@thrift/utils";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/PageHeader";
import { useConfirm } from "@/components/ConfirmDialog";
import {
  Banknote,
  ArrowLeft,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface PayoutRequest {
  id: string;
  amount: number;
  note?: string | null;
  status: string;
  disbursementStatus: string;
  disbursementRef?: string | null;
  reviewedNote?: string | null;
  reviewedAt?: string | null;
  disbursedAt?: string | null;
  createdAt: string;
}

interface ProfileData {
  name?: string;
  bankAccountNumber?: string | null;
  bankAccountName?: string | null;
  bankName?: string | null;
  bankAccountStatus?: string | null;
  bankAccountRejectionReason?: string | null;
}

const statusMeta: Record<string, { label: string; cls: string; icon: typeof Clock }> = {
  pending: {
    label: "Pending",
    cls: "bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300",
    icon: Clock,
  },
  approved: {
    label: "Approved",
    cls: "bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300",
    icon: ShieldCheck,
  },
  rejected: {
    label: "Rejected",
    cls: "bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300",
    icon: XCircle,
  },
  cancelled: {
    label: "Cancelled",
    cls: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400",
    icon: XCircle,
  },
  disbursed: {
    label: "Disbursed",
    cls: "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300",
    icon: CheckCircle2,
  },
  disbursement_failed: {
    label: "Disbursement failed",
    cls: "bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300",
    icon: XCircle,
  },
};

function StatusBadge({ status }: { status: string }) {
  const meta = statusMeta[status] || {
    label: status,
    cls: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400",
    icon: Clock,
  };
  const Icon = meta.icon;
  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 w-fit ${meta.cls}`}>
      <Icon className="w-3 h-3" /> {meta.label}
    </span>
  );
}

export default function PayoutPage() {
  const { token } = useAuth();
  const { confirm, Dialog } = useConfirm();
  const router = useRouter();

  const [balance, setBalance] = useState<number | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [requests, setRequests] = useState<PayoutRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!token) return;
    try {
      const [balRes, profRes, reqRes] = await Promise.all([
        fetch(`${API_URL}/api/wallet/balance`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/api/user/profile`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/api/payouts/requests?limit=50`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const [balData, profData, reqData] = await Promise.all([
        balRes.json(),
        profRes.json(),
        reqRes.json(),
      ]);
      if (balData.success) setBalance(balData.data.balance);
      if (profData.success) setProfile(profData.data);
      if (reqData.success) setRequests(reqData.data.items);
    } catch {
      toast.error("Failed to load payout details");
    } finally {
      setLoading(false);
    }
  }, [token, API_URL]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const bankStatus = profile?.bankAccountStatus ?? null;
  const hasApprovedBank = bankStatus === "approved";

  const handleSubmit = async () => {
    const amountNum = parseFloat(amount) || 0;
    if (amountNum <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (balance != null && amountNum > balance) {
      toast.error("Insufficient wallet balance");
      return;
    }
    if (!hasApprovedBank) {
      toast.error("Your payout bank account must be approved by an admin first");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/payouts/requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount: amountNum, note: note || undefined }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Payout request submitted for review");
        setAmount("");
        setNote("");
        fetchData();
      } else {
        toast.error(data.error || "Failed to create payout request");
      }
    } catch {
      toast.error("Network error");
    }
    setSubmitting(false);
  };

  const handleCancel = async (id: string) => {
    const proceed = await confirm({ variant: "warning", title: "Cancel payout request?", description: "This payout request will be cancelled and funds returned to your wallet.", confirmLabel: "Cancel Request" });
    if (!proceed) return;
    setCancellingId(id);
    try {
      const res = await fetch(`${API_URL}/api/payouts/requests/${id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Payout request cancelled");
        fetchData();
      } else {
        toast.error(data.error || "Failed to cancel payout request");
      }
    } catch {
      toast.error("Network error");
    }
    setCancellingId(null);
  };

  return (
    <div className="mx-auto max-w-[720px] p-[clamp(1rem,3vw,2rem)] space-y-6">
      <PageHeader
        badgeLabel="Wallet Payout"
        heading="Withdraw to"
        accentText="Bank"
        description="Request a payout from your wallet. An admin reviews and disburses it to your approved bank account."
        right={
          <button
            onClick={() => router.push("/wallet")}
            className="btn-secondary rounded-full px-4 py-2 text-[12px] font-semibold flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Wallet
          </button>
        }
      />

      {/* Balance + bank account */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-4">
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Available Balance</div>
          <div className="font-mono font-bold text-lg text-slate-900 dark:text-white">
            {balance == null ? "—" : formatNaira(balance)}
          </div>
        </div>
        <div className={`rounded-2xl border p-4 ${
          hasApprovedBank
            ? "border-emerald-200/80 dark:border-emerald-800/80 bg-emerald-50/60 dark:bg-emerald-950/20"
            : "border-amber-200/80 dark:border-amber-800/80 bg-amber-50/60 dark:bg-amber-950/20"
        }`}>
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Payout Bank Account</div>
          {profile?.bankAccountNumber ? (
            <>
              <div className="font-mono font-bold text-sm text-slate-900 dark:text-white mt-1">
                {profile.bankAccountName || "—"} · {profile.bankAccountNumber}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">{profile.bankName || ""}</div>
              {hasApprovedBank ? (
                <div className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Approved for payout
                </div>
              ) : bankStatus === "rejected" ? (
                <div className="text-[10px] font-semibold text-red-600 dark:text-red-400 mt-1">
                  <div className="flex items-center gap-1">
                    <XCircle className="w-3 h-3" /> Rejected
                    {profile.bankAccountRejectionReason ? `: ${profile.bankAccountRejectionReason}` : ""}
                  </div>
                  <a href="/profile" className="text-blue-600 underline mt-1 inline-block">Resubmit on Profile →</a>
                </div>
              ) : (
                <div className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Awaiting admin approval
                </div>
              )}
            </>
          ) : (
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              No bank account saved yet.{" "}
              <a href="/profile" className="text-blue-600 underline">Add one →</a>
            </div>
          )}
        </div>
      </div>

      {/* Request form */}
      <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 w-fit">
            <Banknote className="w-3.5 h-3.5 text-blue-500" />
            <span>New Request</span>
          </span>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] uppercase tracking-[0.1em] text-slate-400 dark:text-slate-500 font-bold">Amount</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">₦</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              min="1"
              className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-3 py-3 text-lg font-mono font-bold text-slate-900 dark:text-white outline-none"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] uppercase tracking-[0.1em] text-slate-400 dark:text-slate-500 font-bold">Note (optional)</label>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Anything the admin should know"
            className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-white outline-none"
          />
        </div>

        {!hasApprovedBank && (
          <p className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            Your bank account must be approved by an admin before you can request a payout.
          </p>
        )}

        <button
          onClick={handleSubmit}
          disabled={submitting || !hasApprovedBank}
          className="btn-primary w-full py-3 text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-md rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {submitting ? "Submitting..." : "Request Payout"}
        </button>
      </div>

      {/* My requests */}
      <div className="space-y-3">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">My Payout Requests</div>
        {loading ? (
          <div className="text-[11px] text-slate-400">Loading...</div>
        ) : requests.length === 0 ? (
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-6 text-center text-[11px] text-slate-400">
            No payout requests yet.
          </div>
        ) : (
          requests.map((r) => (
            <div key={r.id} className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-4 flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">{formatNaira(r.amount)}</span>
                  <StatusBadge status={r.status} />
                </div>
                {r.note && <div className="text-[11px] text-slate-500 dark:text-slate-400">{r.note}</div>}
                <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                  {new Date(r.createdAt).toLocaleString()}
                  {r.reviewedNote ? ` · ${r.reviewedNote}` : ""}
                  {r.disbursementRef ? ` · ${r.disbursementRef}` : ""}
                </div>
              </div>
              {r.status === "pending" && (
                <button
                  onClick={() => handleCancel(r.id)}
                  disabled={cancellingId === r.id}
                  className="text-[10px] font-semibold text-rose-500 border border-rose-300 dark:border-rose-800 rounded-full px-3 py-1 hover:bg-rose-50 dark:hover:bg-rose-950/30 disabled:opacity-50"
                >
                  {cancellingId === r.id ? "..." : "Cancel"}
                </button>
              )}
            </div>
          ))
        )}
      </div>
      {Dialog}
    </div>
  );
}
