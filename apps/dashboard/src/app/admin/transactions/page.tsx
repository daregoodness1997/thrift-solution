"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, FadeIn, FadeInUp, StatCard } from "@thrift/ui";
import { formatNaira, formatDate } from "@thrift/utils";
import { useAuth } from "@/lib/auth-context";
import { ArrowLeftRight } from "lucide-react";
import Pagination from "@/components/Pagination";
import { SimpleTable, SimpleColumn } from "@/components/SimpleTable";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const LIMIT = 20;

interface Txn {
  id: string;
  type: string;
  amount: number;
  status: string;
  reference?: string;
  description?: string;
  createdAt: string;
  user?: { id: string; name: string; email: string };
}

export default function AdminTransactionsPage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const isAdmin = user?.role === "admin" || user?.role === "superadmin";

  const [items, setItems] = useState<Txn[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [stats, setStats] = useState<{ totalCount: number; byType: { type: string; total: number; count: number }[] }>({ totalCount: 0, byType: [] });

  useEffect(() => {
    if (!authLoading && user && !isAdmin) router.replace("/");
  }, [authLoading, user, isAdmin, router]);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchAll = useCallback(async () => {
    if (!token || !isAdmin) { setLoading(false); return; }
    setLoading(true);
    try {
      const sp = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
      if (typeFilter !== "all") sp.set("type", typeFilter);
      if (statusFilter !== "all") sp.set("status", statusFilter);
      if (debounced) sp.set("search", debounced);
      const [list, st] = await Promise.all([
        fetch(`${API_URL}/api/admin/transactions?${sp}`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
        fetch(`${API_URL}/api/admin/transactions/stats`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
      ]);
      if (list.success) {
        setItems(list.data.items || []);
        setTotalPages(list.data.totalPages || 1);
        setTotal(list.data.total || 0);
      }
      if (st.success) setStats(st.data);
    } catch {}
    setLoading(false);
  }, [token, isAdmin, page, typeFilter, statusFilter, debounced]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const columns: SimpleColumn<Txn>[] = [
    { key: "user", header: "User", render: (t) => <><span className="block font-semibold text-slate-900 dark:text-white">{t.user?.name || "—"}</span><span className="text-[11px] text-slate-500 dark:text-slate-400">{t.user?.email}</span></> },
    { key: "type", header: "Type", render: (t) => <span className="capitalize text-slate-500 dark:text-slate-400">{t.type.replace(/_/g, " ")}</span> },
    { key: "amount", header: "Amount", align: "right", mono: true, render: (t) => <span className="font-semibold text-slate-900 dark:text-white">{formatNaira(t.amount)}</span> },
    { key: "status", header: "Status", render: (t) => <StatusBadge status={t.status} /> },
    { key: "date", header: "Date", render: (t) => <span className="text-slate-500 dark:text-slate-400">{formatDate(new Date(t.createdAt))}</span> },
    { key: "reference", header: "Reference", mono: true, render: (t) => <span className="text-[10px] text-slate-500 dark:text-slate-400">{t.reference || "—"}</span> },
    { key: "actions", header: "", align: "right", render: (t) => <button onClick={(e) => { e.stopPropagation(); router.push(`/admin/transactions/${t.id}`); }} className="cursor-pointer rounded-md border border-slate-200 bg-white px-3 py-1 text-[10px] font-semibold text-slate-900 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700">View</button> },
  ];

  if (authLoading || !isAdmin) return null;

  const statuses = ["all", "pending", "completed", "failed"];
  const types = ["all", "contribution", "payout", "donation", "funding", "wallet_funding", "wallet_funding_reversal", "referral_earning", "circle_deposit", "circle_contribution", "circle_withdrawal", "circle_payout", "circle_interest", "circle_processing_fee", "circle_reversal", "loan_payout", "loan_disbursement", "loan_repayment", "registration_fee", "default_clearance", "circle_default_clearance"];

  return (
    <div className="mx-auto max-w-[1280px] p-[clamp(1rem,3vw,2rem)]">
      <div className="mb-8 pt-2 pb-6 border-b border-slate-200/80 dark:border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800/80 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1">
              <ArrowLeftRight className="w-3.5 h-3.5 text-rose-500" />
              <span>Admin</span>
            </span>
          </div>
          <h3 className="font-display font-bold text-xl sm:text-2xl text-slate-900 dark:text-white mt-1">Transaction <span className="bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 bg-clip-text font-display font-bold text-transparent">Ledger</span></h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Monitor all platform money movement, deposits, withdrawals, and loan flows.</p>
        </div>
      </div>

      <FadeInUp delay={100}>
        <div className="mb-6 grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3">
          <StatCard label="Total Txns" value={stats.totalCount.toLocaleString()} />
          {stats.byType.map((t) => (
            <StatCard key={t.type} label={t.type.replace("_", " ")} value={formatNaira(t.total)} sub={`${t.count} txns`} />
          ))}
        </div>
      </FadeInUp>

      <FadeInUp delay={200}>
        <Card padding="1.5rem" className="rounded-3xl">
          <div className="mb-4 flex flex-wrap gap-3">
            <input
              placeholder="Search reference, email, name..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="min-w-[200px] flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[12px] outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
            <FilterSelect value={typeFilter} onChange={(v) => { setTypeFilter(v); setPage(1); }} options={types} />
            <FilterSelect value={statusFilter} onChange={(v) => { setStatusFilter(v); setPage(1); }} options={statuses} />
          </div>

          {loading ? (
            <div className="p-12 text-center text-[13px] text-slate-500 dark:text-slate-400">Loading transactions...</div>
          ) : (
            <SimpleTable columns={columns} data={items} minWidth="820px" emptyMessage="No transactions found." />
          )}
          <Pagination page={page} totalPages={totalPages} total={total} limit={LIMIT} onPageChange={setPage} loading={loading} />
        </Card>
      </FadeInUp>
    </div>
  );
}

function FilterSelect({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}
      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[12px] capitalize dark:border-slate-700 dark:bg-slate-800 dark:text-white">
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string; border: string }> = {
    completed: { bg: "#ECFDF5", color: "#059669", border: "#A7F3D0" },
    pending: { bg: "#FFFBEB", color: "#D97706", border: "#FDE68A" },
    failed: { bg: "#FEF2F2", color: "#DC2626", border: "#FECACA" },
  };
  const s = map[status] || { bg: "#F3F4F6", color: "#4B5563", border: "#E5E7EB" };
  return <span className="rounded-md px-2 py-0.5 font-mono text-[9px] font-bold uppercase" style={{ backgroundColor: s.bg, color: s.color, border: `1px solid ${s.border}` }}>{status}</span>;
}
