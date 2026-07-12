"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { config, BrandConfig } from "@thrift/config";
import { Card } from "@thrift/ui";
import { formatNaira } from "@thrift/utils";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/PageHeader";
import { DataTable, Column, PaginationInfo } from "@/components/DataTable";

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

const PAGE_SIZE = 20;

export default function TransactionsPage() {
  const { token } = useAuth();
  const router = useRouter();
  const [cfg, setCfg] = useState<BrandConfig>(fallback);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationInfo>({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 });

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  useEffect(() => {
    fetch(`${API_URL}/api/config`)
      .then((r) => r.json())
      .then((data) => { if (data?.name) setCfg((p) => ({ ...p, ...data })); })
      .catch(() => {});
  }, [API_URL]);

  const fetchTransactions = useCallback(async (page: number) => {
    if (!token) { setLoading(false); return; }
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
      if (filter !== "all") params.set("type", filter);
      const res = await fetch(`${API_URL}/api/transactions?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) {
        setTransactions(data.data.items || []);
        setPagination({ page: data.data.page, limit: data.data.limit, total: data.data.total, totalPages: data.data.totalPages });
      }
    } catch {}
    setLoading(false);
  }, [token, API_URL, filter]);

  useEffect(() => { fetchTransactions(1); }, [fetchTransactions]);

  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter);
  };

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

  const columns: Column<Transaction>[] = [
    {
      key: "createdAt",
      header: "Date",
      mono: true,
      render: (t) => (
        <span style={{ color: "#717171" }}>
          {new Date(t.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
        </span>
      ),
    },
    {
      key: "type",
      header: "Type",
      render: (t) => {
        const c = getTypeColor(t.type);
        return (
          <span style={{ padding: "0.125rem 0.5rem", borderRadius: "0.375rem", fontSize: "9px", fontWeight: 700, textTransform: "uppercase", fontFamily: "'JetBrains Mono', monospace", backgroundColor: `${c}12`, color: c, border: `1px solid ${c}20` }}>
            {getTypeLabel(t.type)}
          </span>
        );
      },
    },
    {
      key: "description",
      header: "Description",
      render: (t) => (
        <span style={{ fontWeight: 500, color: "#2D2D2D" }}>{t.description || getTypeLabel(t.type)}</span>
      ),
    },
    {
      key: "reference",
      header: "Reference",
      mono: true,
      render: (t) => (
        <span style={{ fontSize: "10px", color: "#999" }}>{t.reference.length > 20 ? t.reference.slice(0, 20) + "..." : t.reference}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      align: "right",
      render: (t) => (
        <span style={{ fontSize: "9px", fontWeight: 700, color: t.status === "completed" ? "#059669" : t.status === "pending" ? "#D97706" : "#717171", backgroundColor: t.status === "completed" ? "#ECFDF5" : t.status === "pending" ? "#FFFBEB" : "#F3F4F6", padding: "0.125rem 0.5rem", borderRadius: "0.375rem" }}>
          {t.status}
        </span>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      mono: true,
      render: (t) => (
        <span style={{ fontWeight: 600, color: t.type === "payout" || t.type === "funding" || t.type === "circle_withdrawal" || t.type === "circle_interest" || t.type === "referral_earning" ? "#059669" : "#2D2D2D" }}>
          {formatNaira(t.amount)}
        </span>
      ),
    },
  ];

  const filters = [
    { key: "all", label: "All" },
    { key: "contribution", label: "Contributions" },
    { key: "payout", label: "Payouts" },
    { key: "funding", label: "Funding" },
    { key: "donation", label: "Donations" },
    { key: "referral_earning", label: "Referrals" },
    { key: "circle_deposit", label: "Circle Deposits" },
    { key: "circle_withdrawal", label: "Circle Withdrawals" },
    { key: "circle_interest", label: "Circle Interest" },
  ];

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "clamp(1rem, 3vw, 2rem)" }}>
      <PageHeader
        badgeLabel="Contribution Ledger"
        heading="Transaction"
        accentText="History"
        description="View all your contributions, payouts, and financial activity."
        right={
          <span style={{ fontSize: "10px", fontFamily: "'JetBrains Mono', monospace", color: "#717171" }}>{pagination.total} entries</span>
        }
      />

      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1.5rem" }}>
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => handleFilterChange(f.key)}
            style={{
              padding: "0.375rem 1rem",
              borderRadius: "9999px",
              fontSize: "11px",
              fontWeight: 600,
              cursor: "pointer",
              border: "1px solid",
              borderColor: filter === f.key ? cfg.colors.primary : "#EAEAEA",
              backgroundColor: filter === f.key ? cfg.colors.primary : "#ffffff",
              color: filter === f.key ? "#ffffff" : "#717171",
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      <Card padding="0">
        <DataTable
          columns={columns}
          data={transactions}
          pagination={pagination}
          onPageChange={(page) => fetchTransactions(page)}
          onRowClick={(t) => router.push(`/transactions/${t.id}`)}
          loading={loading}
          emptyMessage="No transactions found."
          emptyAction={
            <a href="/circles" style={{ color: cfg.colors.primary, fontWeight: 600, fontSize: "12px" }}>
              Join a circle to get started
            </a>
          }
          accentColor={cfg.colors.primary}
        />
      </Card>
    </div>
  );
}
