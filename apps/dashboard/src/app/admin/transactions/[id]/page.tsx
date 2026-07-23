"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@thrift/ui";
import { formatNaira, formatDate } from "@thrift/utils";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/PageHeader";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface TransactionDetail {
  id: string;
  type: string;
  amount: number;
  description?: string;
  status: string;
  reference: string;
  groupId?: string;
  donationId?: string;
  createdAt: string;
  userId?: string;
  user?: { id: string; name: string; email: string };
  donation?: {
    id: string;
    type: string;
    amount?: number;
    currency?: string;
    paymentProvider?: string;
    itemName?: string;
    itemCategory?: string;
    itemCondition?: string;
    status: string;
    notes?: string;
    groupId?: string;
  } | null;
}

export default function AdminTransactionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, token, loading: authLoading } = useAuth();
  const isAdmin = user?.role === "admin" || user?.role === "superadmin";

  const [transaction, setTransaction] = useState<TransactionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const txId = params.id as string;

  useEffect(() => {
    if (!authLoading && user && !isAdmin) router.replace("/");
  }, [authLoading, user, isAdmin, router]);

  useEffect(() => {
    if (!token || !txId || !isAdmin) { setLoading(false); return; }
    fetch(`${API_URL}/api/admin/transactions/${txId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then((data) => {
        if (data.success) setTransaction(data.data);
        else setError("Transaction not found");
      })
      .catch(() => setError("Transaction not found"))
      .finally(() => setLoading(false));
  }, [token, txId, isAdmin, API_URL]);

  const getTypeLabel = (type: string) => {
    return type.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  };

  const statusConfig: Record<string, { color: string; bg: string; border: string }> = {
    completed: { color: "#059669", bg: "#ECFDF5", border: "#A7F3D0" },
    pending: { color: "#D97706", bg: "#FFFBEB", border: "#FDE68A" },
    failed: { color: "#DC2626", bg: "#FEF2F2", border: "#FECACA" },
  };
  const sConfig = statusConfig[transaction?.status || ""] || statusConfig.pending;

  const typeColorMap: Record<string, string> = {
    contribution: "#4A5D4E",
    payout: "#059669",
    donation: "#7C3AED",
    funding: "#2563EB",
    referral_bonus: "#8A7D73",
    circle_deposit: "#7C3AED",
    circle_withdrawal: "#0891B2",
    circle_interest: "#D97706",
    deposit: "#2563EB",
    withdrawal: "#DC2626",
    transfer: "#0891B2",
    loan_disbursement: "#059669",
    loan_repayment: "#4A5D4E",
  };
  const typeColor = typeColorMap[transaction?.type || ""] || "#717171";

  if (authLoading || loading) {
    return (
      <div className="mx-auto max-w-[800px] p-[clamp(1rem,3vw,2rem)]">
        <div className="p-16 text-center text-[13px] text-slate-400 dark:text-slate-500">Loading transaction details...</div>
      </div>
    );
  }

  if (!isAdmin) return null;

  if (error || !transaction) {
    return (
      <div className="mx-auto max-w-[800px] p-[clamp(1rem,3vw,2rem)]">
        <div className="p-16 text-center">
          <div className="mb-4 text-[14px] text-slate-500 dark:text-slate-400">{error || "Transaction not found"}</div>
          <button onClick={() => router.push("/admin/transactions")} className="cursor-pointer rounded-full border-0 bg-slate-900 px-5 py-2 text-[12px] font-semibold text-white dark:bg-white dark:text-slate-900">
            Back to Transactions
          </button>
        </div>
      </div>
    );
  }

  const detailRows: { label: string; value: string; mono?: boolean; copyable?: boolean; badge?: boolean; badgeColor?: string; badgeBg?: string; large?: boolean; amountColor?: string }[] = [
    { label: "Transaction ID", value: transaction.id, mono: true, copyable: true },
    { label: "Reference", value: transaction.reference || "—", mono: true, copyable: true },
    { label: "Type", value: getTypeLabel(transaction.type), badge: true, badgeColor: typeColor },
    { label: "Status", value: transaction.status, badge: true, badgeColor: sConfig.color, badgeBg: sConfig.bg },
    { label: "Amount", value: formatNaira(transaction.amount), large: true },
    { label: "Description", value: transaction.description || getTypeLabel(transaction.type) },
    { label: "Date & Time", value: new Date(transaction.createdAt).toLocaleString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" }) },
  ];

  if (transaction.user) {
    detailRows.splice(2, 0, { label: "User", value: `${transaction.user.name} (${transaction.user.email})` });
  }

  if (transaction.donation) {
    const d = transaction.donation;
    if (d.paymentProvider) {
      detailRows.push({ label: "Payment Provider", value: d.paymentProvider.charAt(0).toUpperCase() + d.paymentProvider.slice(1) });
    }
    if (d.itemName) {
      detailRows.push({ label: "Item Name", value: d.itemName });
    }
    if (d.itemCategory) {
      detailRows.push({ label: "Item Category", value: d.itemCategory });
    }
    if (d.itemCondition) {
      detailRows.push({ label: "Item Condition", value: d.itemCondition });
    }
    if (d.notes) {
      detailRows.push({ label: "Notes", value: d.notes });
    }
  }

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey((k) => (k === key ? null : k)), 1500);
    }).catch(() => {});
  };

  return (
    <div className="mx-auto max-w-[800px] p-[clamp(1rem,3vw,2rem)]">
      <PageHeader
        badgeLabel="Admin"
        heading="Transaction"
        accentText="Details"
        description="Full details for this transaction."
        right={
          <button onClick={() => router.push("/admin/transactions")} className="cursor-pointer rounded-full border border-transparent bg-transparent px-4 py-2 text-[11px] font-semibold text-slate-900 transition-all duration-200 hover:border-slate-200 dark:text-white dark:hover:border-slate-700">
            &larr; All Transactions
          </button>
        }
      />

      <Card padding="0">
        <div className="border-b border-slate-200/80 px-8 pb-6 pt-8 dark:border-slate-800/80">
          <div className="mb-5 flex flex-wrap items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: `${typeColor}12` }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={typeColor} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                {["contribution", "deposit"].includes(transaction.type) && <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />}
                {["payout", "withdrawal"].includes(transaction.type) && <><path d="M21 12V7H5a2 2 0 010-4h14v4" /><path d="M3 5v14a2 2 0 002 2h16v-5" /><path d="M18 12a2 2 0 000 4h4v-4z" /></>}
                {transaction.type === "funding" && <><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M7 8h10M7 12h6" /></>}
                {transaction.type === "donation" && <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />}
                {transaction.type === "referral_bonus" && <><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></>}
                {transaction.type === "circle_deposit" && <><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /><path d="M3 12h3m12 0h3" /></>}
                {transaction.type === "circle_withdrawal" && <><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M12 14a2 2 0 100-4 2 2 0 000 4z" /><path d="M6 8v2M18 8v2" /></>}
                {transaction.type === "circle_interest" && <><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></>}
                {["loan_disbursement", "loan_repayment"].includes(transaction.type) && <><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></>}
                {transaction.type === "transfer" && <><path d="M17 1l4 4-4 4" /><path d="M3 11V9a4 4 0 014-4h14" /><path d="M7 23l-4-4 4-4" /><path d="M21 13v2a4 4 0 01-4 4H3" /></>}
                {!["contribution","payout","funding","donation","referral_bonus","circle_deposit","circle_withdrawal","circle_interest","loan_disbursement","loan_repayment","deposit","withdrawal","transfer"].includes(transaction.type) && <><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></>}
              </svg>
            </div>
            <div>
              <h2 className="m-0 font-mono text-[1.5rem] font-bold text-slate-900 dark:text-white">
                {formatNaira(transaction.amount)}
              </h2>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">{getTypeLabel(transaction.type)}</span>
            </div>
            <div className="flex gap-2">
              <span className="rounded-full border px-3 py-1 text-[10px] font-bold uppercase font-mono" style={{ backgroundColor: `${typeColor}12`, color: typeColor, borderColor: `${typeColor}20` }}>
                {getTypeLabel(transaction.type)}
              </span>
              <span className="rounded-full px-3 py-1 text-[10px] font-bold uppercase font-mono" style={{ backgroundColor: sConfig.bg, color: sConfig.color }}>
                {transaction.status}
              </span>
            </div>
          </div>
        </div>

        <div className="px-8 pb-8 pt-6">
          {detailRows.map((row, idx) => (
            <div key={idx} className={`flex items-start justify-between gap-4 py-[0.875rem] ${idx < detailRows.length - 1 ? "border-b border-slate-200/80 dark:border-slate-800/80" : ""}`}>
              <span className="min-w-[120px] shrink-0 text-[11px] font-medium uppercase tracking-[0.05em] text-slate-400 dark:text-slate-500">{row.label}</span>
              <div className="flex items-center gap-2 text-right">
                {row.badge ? (
                  <span className="rounded-full px-3 py-1 text-[10px] font-bold uppercase font-mono" style={{ backgroundColor: row.badgeBg || `${row.badgeColor}12`, color: row.badgeColor }}>
                    {row.value}
                  </span>
                ) : (
                  <span
                    className={`block break-all ${row.mono ? "font-mono text-slate-500 dark:text-slate-400" : "text-slate-900 dark:text-white"}`}
                    style={{
                      fontSize: row.large ? "16px" : "12px",
                      fontWeight: row.large ? 700 : 500,
                    }}
                  >
                    {row.value}
                  </span>
                )}
                {row.copyable && (
                  <button
                    onClick={() => copyToClipboard(row.value, row.label)}
                    className="group relative shrink-0 cursor-pointer rounded-[0.25rem] border-0 bg-transparent p-1 text-slate-400 transition-colors duration-150 hover:text-blue-600 dark:hover:text-blue-400"
                    title="Copy to clipboard"
                  >
                    {copiedKey === row.label ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ color: "#059669" }}>
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                      </svg>
                    )}
                    <span
                      className={`pointer-events-none absolute -top-7 right-0 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-[10px] font-semibold text-white transition-opacity duration-150 dark:bg-white dark:text-slate-900 ${copiedKey === row.label ? "opacity-100" : "opacity-0"}`}
                    >
                      Copied!
                    </span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
