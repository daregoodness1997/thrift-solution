"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { config, BrandConfig } from "@thrift/config";
import { formatNaira } from "@thrift/utils";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/PageHeader";
import { DataTable, Column, PaginationInfo } from "@/components/DataTable";
import {
  Activity,
  Filter,
} from "lucide-react";

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
      case "donation": return "#2563EB";
      case "funding": return "#2563EB";
      case "referral_earning": return "#8A7D73";
      case "wallet_funding": return "#2563EB";
      case "wallet_funding_reversal": return "#DC2626";
      case "circle_reversal": return "#DC2626";
      case "circle_deposit": return "#7C3AED";
      case "circle_contribution": return "#7C3AED";
      case "circle_withdrawal": return "#0891B2";
      case "circle_payout": return "#0891B2";
      case "loan_payout": return "#0891B2";
      case "circle_interest": return "#D97706";
      case "circle_processing_fee": return "#D97706";
      default: return "#717171";
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "wallet_funding_reversal": return "Funding Reversed";
      case "circle_reversal": return "Circle Reversed";
      case "wallet_funding": return "Wallet Funding";
      case "circle_processing_fee": return "Processing Fee";
      default: return type.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    }
  };

  const columns: Column<Transaction>[] = [
    {
      key: "createdAt",
      header: "Date",
      mono: true,
      render: (t) => (
        <span className="text-slate-500 dark:text-slate-400">
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
          <span className="rounded-lg px-2 py-0.5 font-mono text-[9px] font-bold uppercase" style={{ backgroundColor: `${c}12`, color: c }}>
            {getTypeLabel(t.type)}
          </span>
        );
      },
    },
    {
      key: "description",
      header: "Description",
      render: (t) => (
        <span className="font-medium text-slate-900 dark:text-white">{t.description || getTypeLabel(t.type)}</span>
      ),
    },
    {
      key: "reference",
      header: "Reference",
      mono: true,
      render: (t) => (
        <span className="text-[10px] text-slate-400">{t.reference.length > 20 ? t.reference.slice(0, 20) + "..." : t.reference}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      align: "right",
      render: (t) => (
        <span className={`rounded-lg px-2 py-0.5 text-[9px] font-bold ${t.status === "completed" ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400" : t.status === "pending" ? "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}`}>
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
        <span className="font-semibold" style={{ color: t.type === "payout" || t.type === "funding" || t.type === "circle_withdrawal" || t.type === "circle_payout" || t.type === "loan_payout" || t.type === "circle_interest" || t.type === "referral_earning" ? "#059669" : "#2D2D2D" }}>
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
    { key: "wallet_funding", label: "Wallet Funding" },
    { key: "wallet_funding_reversal", label: "Funding Reversed" },
    { key: "donation", label: "Donations" },
    { key: "referral_earning", label: "Referrals" },
    { key: "circle_deposit", label: "Circle Deposits" },
    { key: "circle_contribution", label: "Circle Contributions" },
    { key: "circle_withdrawal", label: "Circle Withdrawals" },
    { key: "circle_payout", label: "Circle Payouts" },
    { key: "circle_interest", label: "Circle Interest" },
    { key: "circle_processing_fee", label: "Processing Fees" },
    { key: "circle_reversal", label: "Circle Reversed" },
    { key: "loan_payout", label: "Loan Payouts" },
  ];

  return (
    <div className="mx-auto max-w-[1280px] p-[clamp(1rem,3vw,2rem)] space-y-6">
      <PageHeader
        badgeLabel="Contribution Ledger"
        heading="Transaction"
        accentText="History"
        description="View all your contributions, payouts, and financial activity."
        right={
          <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400">{pagination.total} entries</span>
        }
      />

      {/* Filter Tabs - LearnerDashboardView rounded-2xl style */}
      <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-6">
        <div className="mb-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200/80 dark:border-blue-800/80 text-[10px] font-mono font-bold uppercase tracking-wider">
            <Filter className="w-3 h-3" /> Filter Transactions
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => handleFilterChange(f.key)}
              className={`cursor-pointer rounded-2xl border px-4 py-1.5 text-[11px] font-semibold transition-colors ${
                filter === f.key
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:border-blue-300 hover:text-blue-600"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Data Table */}
      <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="p-6 pb-0">
          <div className="mb-4 flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-slate-700/80 text-[10px] font-mono font-bold uppercase tracking-wider">
              <Activity className="w-3 h-3" /> Transaction Records
            </span>
            <span className="font-mono text-[10px] text-slate-400">{pagination.total} entries</span>
          </div>
        </div>
        <DataTable
          columns={columns}
          data={transactions}
          pagination={pagination}
          onPageChange={(page) => fetchTransactions(page)}
          onRowClick={(t) => router.push(`/transactions/${t.id}`)}
          loading={loading}
          emptyMessage="No transactions found."
          emptyAction={
            <a href="/circles" className="text-[12px] font-semibold text-blue-600 dark:text-blue-400">
              Join a circle to get started
            </a>
          }
          accentColor="#2563EB"
        />
      </div>
    </div>
  );
}
