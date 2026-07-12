"use client";

import { useState, useEffect, useCallback } from "react";
import { config, BrandConfig } from "@thrift/config";
import { Card, ColorfulBadge, ColorBar } from "@thrift/ui";
import { formatNaira } from "@thrift/utils";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/PageHeader";

const fallback = config;

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description?: string;
  status: string;
  createdAt: string;
  groupId?: string;
  reference: string;
}

export default function TransactionsPage() {
  const { token } = useAuth();
  const [cfg, setCfg] = useState<BrandConfig>(fallback);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  useEffect(() => {
    fetch(`${API_URL}/api/config`)
      .then((r) => r.json())
      .then((data) => { if (data?.name) setCfg((p) => ({ ...p, ...data })); })
      .catch(() => {});
  }, [API_URL]);

  const fetchTransactions = useCallback(async () => {
    if (!token) { setLoading(false); return; }
    try {
      const url = filter === "all"
        ? `${API_URL}/api/transactions`
        : `${API_URL}/api/transactions?type=${filter}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setTransactions(data.data || []);
    } catch {}
    setLoading(false);
  }, [token, API_URL, filter]);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  const getTypeColor = (type: string) => {
    switch (type) {
      case "contribution": return "#4A5D4E";
      case "payout": return "#059669";
      case "donation": return cfg.colors.primary;
      case "funding": return "#2563EB";
      case "referral_earning": return "#8A7D73";
      default: return "#717171";
    }
  };

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "clamp(1rem, 3vw, 2rem)" }}>
      <PageHeader
        badgeLabel="Contribution Ledger"
        heading="Transaction"
        accentText="History"
        description="View all your contributions, payouts, and financial activity."
        right={
          <span style={{ fontSize: "10px", fontFamily: "'JetBrains Mono', monospace", color: "#717171" }}>{transactions.length} entries</span>
        }
      />

      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1.5rem" }}>
        {[{ key: "all", label: "All" }, { key: "contribution", label: "Contributions" }, { key: "payout", label: "Payouts" }, { key: "funding", label: "Funding" }, { key: "donation", label: "Donations" }, { key: "referral_earning", label: "Referrals" }].map((f) => (
          <button key={f.key} onClick={() => setFilter(f.key)} style={{ padding: "0.375rem 1rem", borderRadius: "9999px", fontSize: "11px", fontWeight: 600, cursor: "pointer", border: "1px solid", borderColor: filter === f.key ? cfg.colors.primary : "#EAEAEA", backgroundColor: filter === f.key ? cfg.colors.primary : "#ffffff", color: filter === f.key ? "#ffffff" : "#717171" }}>
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "#999", fontSize: "13px" }}>Loading transactions...</div>
      ) : (
        <Card padding="0">
          {transactions.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem", color: "#999", fontSize: "13px" }}>
              No transactions found. <a href="/groups" style={{ color: cfg.colors.primary }}>Join a circle</a> to get started.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", fontSize: "12px", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #F0F0F0", color: "#999", textTransform: "uppercase", letterSpacing: "0.1em", fontSize: "9px", fontFamily: "'JetBrains Mono', monospace" }}>
                    <th style={{ padding: "1rem 1.5rem", textAlign: "left", fontWeight: 600 }}>Date</th>
                    <th style={{ padding: "1rem 0", textAlign: "left", fontWeight: 600 }}>Type</th>
                    <th style={{ padding: "1rem 0", textAlign: "left", fontWeight: 600 }}>Description</th>
                    <th style={{ padding: "1rem 0", textAlign: "left", fontWeight: 600 }}>Reference</th>
                    <th style={{ padding: "1rem 0", textAlign: "right", fontWeight: 600 }}>Status</th>
                    <th style={{ padding: "1rem 1.5rem", textAlign: "right", fontWeight: 600 }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t) => {
                    const typeColor = getTypeColor(t.type);
                    return (
                      <tr key={t.id} style={{ borderBottom: "1px solid #F5F5F5", transition: "background 0.15s" }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#F9FAFB"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}>
                        <td style={{ padding: "0.875rem 1.5rem", fontFamily: "'JetBrains Mono', monospace", color: "#717171" }}>
                          {new Date(t.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                        </td>
                        <td style={{ padding: "0.875rem 0" }}>
                          <span style={{ padding: "0.125rem 0.5rem", borderRadius: "0.375rem", fontSize: "9px", fontWeight: 700, textTransform: "uppercase", fontFamily: "'JetBrains Mono', monospace", backgroundColor: `${typeColor}12`, color: typeColor, border: `1px solid ${typeColor}20` }}>{t.type}</span>
                        </td>
                        <td style={{ padding: "0.875rem 0", fontWeight: 500, color: "#2D2D2D" }}>{t.description || t.type}</td>
                        <td style={{ padding: "0.875rem 0", fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", color: "#999" }}>{t.reference.slice(0, 16)}...</td>
                        <td style={{ padding: "0.875rem 0", textAlign: "right" }}>
                          <span style={{ fontSize: "9px", fontWeight: 700, color: t.status === "completed" ? "#059669" : t.status === "pending" ? "#D97706" : "#717171", backgroundColor: t.status === "completed" ? "#ECFDF5" : t.status === "pending" ? "#FFFBEB" : "#F3F4F6", padding: "0.125rem 0.5rem", borderRadius: "0.375rem" }}>{t.status}</span>
                        </td>
                        <td style={{ padding: "0.875rem 1.5rem", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: t.type === "payout" || t.type === "funding" ? "#059669" : "#2D2D2D" }}>{formatNaira(t.amount)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
