"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, FadeIn, FadeInUp } from "@thrift/ui";
import { formatNaira, formatDate } from "@thrift/utils";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/PageHeader";
import Pagination from "@/components/Pagination";

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

  if (authLoading || !isAdmin) return null;

  const statuses = ["all", "pending", "completed", "failed"];
  const types = ["all", "contribution", "payout", "donation", "funding", "wallet_funding", "wallet_funding_reversal", "referral_earning", "circle_deposit", "circle_contribution", "circle_withdrawal", "circle_payout", "circle_interest", "circle_processing_fee", "circle_reversal", "loan_payout", "loan_disbursement", "loan_repayment", "registration_fee", "default_clearance", "circle_default_clearance"];

  return (
    <div className="mx-auto max-w-[1280px] p-[clamp(1rem,3vw,2rem)]">
      <PageHeader badgeLabel="Admin" heading="Transaction" accentText="Ledger" description="Monitor all platform money movement, deposits, withdrawals, and loan flows." />

      <FadeInUp delay={100}>
        <div className="mb-6 grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3">
          <StatCard label="Total Txns" value={stats.totalCount.toLocaleString()} />
          {stats.byType.map((t) => (
            <StatCard key={t.type} label={t.type.replace("_", " ")} value={formatNaira(t.total)} sub={`${t.count} txns`} />
          ))}
        </div>
      </FadeInUp>

      <FadeInUp delay={200}>
        <Card padding="1.5rem">
          <div className="mb-4 flex flex-wrap gap-3">
            <input
              placeholder="Search reference, email, name..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="min-w-[200px] flex-1 rounded-lg border border-gray-200 px-3 py-2 text-[12px] outline-none"
            />
            <FilterSelect value={typeFilter} onChange={(v) => { setTypeFilter(v); setPage(1); }} options={types} />
            <FilterSelect value={statusFilter} onChange={(v) => { setStatusFilter(v); setPage(1); }} options={statuses} />
          </div>

          {loading ? (
            <div className="p-12 text-center text-[13px] text-gray-500">Loading transactions...</div>
          ) : items.length === 0 ? (
            <div className="p-8 text-center text-[13px] text-gray-500">No transactions found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[12px] min-w-[820px]">
                <thead>
                  <tr className="border-b border-gray-100 font-mono text-[9px] uppercase tracking-[0.1em] text-gray-500">
                    <th className="pb-3 text-left font-semibold">User</th>
                    <th className="pb-3 text-left font-semibold">Type</th>
                    <th className="pb-3 text-right font-semibold">Amount</th>
                    <th className="pb-3 text-left font-semibold">Status</th>
                    <th className="pb-3 text-left font-semibold">Date</th>
                    <th className="pb-3 text-left font-semibold">Reference</th>
                    <th className="pb-3 text-right font-semibold"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((t) => (
                    <tr key={t.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3">
                        <span className="block font-semibold text-brand-dark">{t.user?.name || "—"}</span>
                        <span className="text-[11px] text-gray-500">{t.user?.email}</span>
                      </td>
                      <td className="py-3 capitalize text-gray-500">{t.type.replace(/_/g, " ")}</td>
                      <td className="py-3 text-right font-mono font-semibold text-brand-dark">{formatNaira(t.amount)}</td>
                      <td className="py-3"><StatusBadge status={t.status} /></td>
                      <td className="py-3 text-gray-500">{formatDate(new Date(t.createdAt))}</td>
                      <td className="py-3 font-mono text-[10px] text-gray-500">{t.reference || "—"}</td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => router.push(`/admin/transactions/${t.id}`)}
                          className="cursor-pointer rounded-md border border-gray-200 bg-white px-3 py-1 text-[10px] font-semibold text-brand-dark transition-colors hover:bg-gray-50"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Pagination page={page} totalPages={totalPages} total={total} limit={LIMIT} onPageChange={setPage} loading={loading} />
        </Card>
      </FadeInUp>
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4">
      <div className="font-mono text-[9px] uppercase tracking-[0.08em] text-gray-500">{label}</div>
      <div className="mt-1 text-base font-bold text-brand-dark">{value}</div>
      {sub && <div className="mt-0.5 text-[10px] text-gray-500">{sub}</div>}
    </div>
  );
}

function FilterSelect({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}
      className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-[12px] capitalize">
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
