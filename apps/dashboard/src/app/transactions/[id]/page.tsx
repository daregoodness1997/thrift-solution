"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { config, BrandConfig } from "@thrift/config";
import { Card, ColorfulBadge } from "@thrift/ui";
import { formatNaira } from "@thrift/utils";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/PageHeader";

const fallback = config;

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

export default function TransactionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { token } = useAuth();
  const [cfg, setCfg] = useState<BrandConfig>(fallback);
  const [transaction, setTransaction] = useState<TransactionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  const txId = params.id as string;

  useEffect(() => {
    fetch(`${API_URL}/api/config`)
      .then((r) => r.json())
      .then((data) => { if (data?.name) setCfg((p) => ({ ...p, ...data })); })
      .catch(() => {});
  }, [API_URL]);

  useEffect(() => {
    if (!token || !txId) { setLoading(false); return; }
    fetch(`${API_URL}/api/transactions/${txId}`, {
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
  }, [token, txId, API_URL]);

  const getTypeColor = (type: string) => {
    switch (type) {
      case "contribution": return "#4A5D4E";
      case "payout": return "#059669";
      case "donation": return cfg.colors.primary;
      case "funding": return "#2563EB";
      case "referral_earning": return "#8A7D73";
      case "circle_deposit": return "#7C3AED";
      case "circle_withdrawal": return "#0891B2";
      case "circle_interest": return "#D97706";
      default: return "#717171";
    }
  };

  const getTypeLabel = (type: string) => {
    return type.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  };

  const statusConfig: Record<string, { color: string; bg: string; icon: string }> = {
    completed: { color: "#059669", bg: "#ECFDF5", icon: "M22 11.08V12a10 10 0 11-5.93-9.14M22 4L12 14.01l-3-3" },
    pending: { color: "#D97706", bg: "#FFFBEB", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
    failed: { color: "#DC2626", bg: "#FEF2F2", icon: "M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
  };

  if (loading) {
    return (
      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "clamp(1rem, 3vw, 2rem)" }}>
        <div style={{ textAlign: "center", padding: "4rem", color: "#999", fontSize: "13px" }}>Loading transaction details...</div>
      </div>
    );
  }

  if (error || !transaction) {
    return (
      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "clamp(1rem, 3vw, 2rem)" }}>
        <div style={{ textAlign: "center", padding: "4rem" }}>
          <div style={{ fontSize: "14px", color: "#717171", marginBottom: "1rem" }}>{error || "Transaction not found"}</div>
          <button onClick={() => router.push("/transactions")} style={{ padding: "0.5rem 1.25rem", borderRadius: "9999px", fontSize: "12px", fontWeight: 600, cursor: "pointer", backgroundColor: cfg.colors.primary, color: "#ffffff", border: "none" }}>
            Back to Transactions
          </button>
        </div>
      </div>
    );
  }

  const typeColor = getTypeColor(transaction.type);
  const sConfig = statusConfig[transaction.status] || statusConfig.pending;

  const detailRows = [
    { label: "Transaction ID", value: transaction.id, mono: true, copyable: true },
    { label: "Reference", value: transaction.reference, mono: true, copyable: true },
    { label: "Type", value: getTypeLabel(transaction.type), badge: true, badgeColor: typeColor },
    { label: "Status", value: transaction.status, badge: true, badgeColor: sConfig.color, badgeBg: sConfig.bg },
    { label: "Amount", value: formatNaira(transaction.amount), large: true, amountColor: transaction.type === "payout" || transaction.type === "funding" || transaction.type === "circle_withdrawal" || transaction.type === "circle_interest" || transaction.type === "referral_earning" ? "#059669" : "#2D2D2D" },
    { label: "Description", value: transaction.description || getTypeLabel(transaction.type) },
    { label: "Date & Time", value: new Date(transaction.createdAt).toLocaleString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" }) },
    { label: "Date", value: new Date(transaction.createdAt).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }) },
  ];

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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
  };

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "clamp(1rem, 3vw, 2rem)" }}>
      <PageHeader
        badgeLabel="Transaction Details"
        heading="Transaction"
        accentText="Details"
        description="Full details for this transaction."
        right={
          <button onClick={() => router.push("/transactions")} style={{ padding: "0.5rem 1rem", borderRadius: "9999px", fontSize: "11px", fontWeight: 600, cursor: "pointer", border: `1px solid ${cfg.colors.primary}`, backgroundColor: "transparent", color: cfg.colors.primary, transition: "all 0.2s ease" }}>
            &larr; All Transactions
          </button>
        }
      />

      <Card padding="0">
        <div style={{ padding: "2rem 2rem 1.5rem", borderBottom: "1px solid #F0F0F0" }}>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "1rem", marginBottom: "1.25rem" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "0.75rem", backgroundColor: `${typeColor}12`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={typeColor} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                {transaction.type === "contribution" && <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />}
                {transaction.type === "payout" && <><path d="M21 12V7H5a2 2 0 010-4h14v4" /><path d="M3 5v14a2 2 0 002 2h16v-5" /><path d="M18 12a2 2 0 000 4h4v-4z" /></>}
                {transaction.type === "funding" && <><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M7 8h10M7 12h6" /></>}
                {transaction.type === "donation" && <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />}
                {transaction.type === "referral_earning" && <><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></>}
                {transaction.type === "circle_deposit" && <><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /><path d="M3 12h3m12 0h3" /></>}
                {transaction.type === "circle_withdrawal" && <><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M12 14a2 2 0 100-4 2 2 0 000 4z" /><path d="M6 8v2M18 8v2" /></>}
                {transaction.type === "circle_interest" && <><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></>}
                {!["contribution","payout","funding","donation","referral_earning","circle_deposit","circle_withdrawal","circle_interest"].includes(transaction.type) && <><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></>}
              </svg>
            </div>
            <div>
              <h2 style={{ fontSize: "1.5rem", fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: "#1A1A1A", margin: 0 }}>
                {formatNaira(transaction.amount)}
              </h2>
              <span style={{ fontSize: "11px", color: "#717171" }}>{getTypeLabel(transaction.type)}</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <span style={{ padding: "0.25rem 0.75rem", borderRadius: "9999px", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", fontFamily: "'JetBrains Mono', monospace", backgroundColor: `${typeColor}12`, color: typeColor, border: `1px solid ${typeColor}20` }}>
              {getTypeLabel(transaction.type)}
            </span>
            <span style={{ padding: "0.25rem 0.75rem", borderRadius: "9999px", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", fontFamily: "'JetBrains Mono', monospace", backgroundColor: sConfig.bg, color: sConfig.color }}>
              {transaction.status}
            </span>
          </div>
        </div>

        <div style={{ padding: "1.5rem 2rem 2rem" }}>
          {detailRows.map((row, idx) => (
            <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "0.875rem 0", borderBottom: idx < detailRows.length - 1 ? "1px solid #F5F5F5" : "none", gap: "1rem" }}>
              <span style={{ fontSize: "11px", color: "#999", fontWeight: 500, flexShrink: 0, textTransform: "uppercase", letterSpacing: "0.05em", minWidth: "120px" }}>{row.label}</span>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", textAlign: "right" }}>
                {row.badge ? (
                  <span style={{ padding: "0.25rem 0.75rem", borderRadius: "9999px", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", fontFamily: "'JetBrains Mono', monospace", backgroundColor: row.badgeBg || `${row.badgeColor}12`, color: row.badgeColor }}>
                    {row.value}
                  </span>
                ) : (
                  <span style={{
                    fontSize: row.large ? "16px" : "12px",
                    fontWeight: row.large ? 700 : 500,
                    color: row.amountColor || row.mono ? "#717171" : "#2D2D2D",
                    fontFamily: row.mono ? "'JetBrains Mono', monospace" : "inherit",
                    wordBreak: "break-all",
                  }}>
                    {row.value}
                  </span>
                )}
                {row.copyable && (
                  <button
                    onClick={() => copyToClipboard(row.value)}
                    style={{ padding: "0.25rem", borderRadius: "0.25rem", border: "none", background: "none", cursor: "pointer", color: "#999", flexShrink: 0 }}
                    title="Copy to clipboard"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                    </svg>
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
