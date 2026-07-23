"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, FadeIn, FadeInUp } from "@thrift/ui";
import { formatNaira, formatDate } from "@thrift/utils";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/PageHeader";
import Pagination from "@/components/Pagination";
import { SimpleTable, SimpleColumn } from "@/components/SimpleTable";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const LIMIT = 20;

interface Earning {
  id: string;
  amount: number;
  status: string;
  level: number;
  createdAt: string;
  referrer?: { id: string; name: string; email: string };
  referredUser?: { id: string; name: string; email: string };
}

export default function AdminReferralsPage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const isAdmin = user?.role === "admin" || user?.role === "superadmin";

  const [items, setItems] = useState<Earning[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState("all");
  const [pending, setPending] = useState<{ count: number; amount: number }>({ count: 0, amount: 0 });
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (!authLoading && user && !isAdmin) router.replace("/");
  }, [authLoading, user, isAdmin, router]);

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const fetchAll = useCallback(async () => {
    if (!token || !isAdmin) { setLoading(false); return; }
    setLoading(true);
    try {
      const sp = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
      if (statusFilter !== "all") sp.set("status", statusFilter);
      const res = await fetch(`${API_URL}/api/admin/referrals?${sp}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) {
        setItems(data.data.items || []);
        setTotalPages(data.data.totalPages || 1);
        setTotal(data.data.total || 0);
        setPending(data.data.pending || { count: 0, amount: 0 });
      }
    } catch {}
    setLoading(false);
  }, [token, isAdmin, page, statusFilter]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const pay = async (e: Earning) => {
    setBusyId(e.id);
    try {
      const res = await fetch(`${API_URL}/api/admin/referrals/${e.id}/pay`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) showMessage("success", `Paid ${formatNaira(e.amount)} to ${e.referrer?.name || "referrer"}`);
      else showMessage("error", data.error || "Failed");
      fetchAll();
    } catch {
      showMessage("error", "Failed");
    }
    setBusyId(null);
  };

  if (authLoading || !isAdmin) return null;

  const statuses = ["all", "pending", "credited", "cancelled"];

  const columns: SimpleColumn<Earning>[] = [
    {
      key: "referrer",
      header: "Referrer",
      render: (e) => (
        <>
          <span className="block font-semibold text-slate-900 dark:text-white">{e.referrer?.name || "—"}</span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">{e.referrer?.email}</span>
        </>
      ),
    },
    {
      key: "referred",
      header: "Referred",
      render: (e) => (
        <>
          <span className="block text-slate-500 dark:text-slate-400">{e.referredUser?.name || "—"}</span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">{e.referredUser?.email}</span>
        </>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      mono: true,
      render: (e) => formatNaira(e.amount),
    },
    {
      key: "level",
      header: "Level",
      render: (e) => `L${e.level}`,
    },
    {
      key: "status",
      header: "Status",
      render: (e) => <StatusBadge status={e.status} />,
    },
    {
      key: "date",
      header: "Date",
      render: (e) => formatDate(new Date(e.createdAt)),
    },
    {
      key: "action",
      header: "Action",
      align: "right",
      render: (e) =>
        e.status === "pending" ? (
          <button onClick={(ev) => { ev.stopPropagation(); pay(e); }} disabled={busyId === e.id}
            className="cursor-pointer rounded-md border border-emerald-600/25 bg-emerald-600/10 px-2 py-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400"
            style={{ opacity: busyId === e.id ? 0.5 : 1 }}>
            {busyId === e.id ? "..." : "Pay"}
          </button>
        ) : <span className="text-[10px] text-slate-400">—</span>,
    },
  ];

  return (
    <div className="mx-auto max-w-[1280px] p-[clamp(1rem,3vw,2rem)]">
      <PageHeader badgeLabel="Admin" heading="Referral" accentText="Earnings" description="Review referral bonuses and pay out pending earnings to members." />

      {message && (
        <FadeIn>
          <div className={`mb-6 rounded-2xl border px-4 py-3 text-[13px] font-medium ${message.type === "success" ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800" : "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800"}`}>
            {message.text}
          </div>
        </FadeIn>
      )}

      <FadeInUp delay={100}>
        <div className="mb-6 grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-3">
          <div className="rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-4">
            <div className="font-mono text-[9px] uppercase tracking-[0.08em] text-amber-600 dark:text-amber-400">Pending Payout</div>
            <div className="mt-1 text-base font-bold text-amber-600 dark:text-amber-400">{formatNaira(pending.amount)}</div>
            <div className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">{pending.count} earnings</div>
          </div>
        </div>
      </FadeInUp>

      <FadeInUp delay={200}>
        <Card padding="1.5rem">
          <div className="mb-4 flex flex-wrap gap-3">
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-[12px] capitalize dark:text-white">
              {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {loading ? (
            <div className="p-12 text-center text-[13px] text-slate-500 dark:text-slate-400">Loading earnings...</div>
          ) : items.length === 0 ? (
            <div className="p-8 text-center text-[13px] text-slate-500 dark:text-slate-400">No referral earnings found.</div>
          ) : (
            <SimpleTable columns={columns} data={items} minWidth="820px" />
          )}
          <Pagination page={page} totalPages={totalPages} total={total} limit={LIMIT} onPageChange={setPage} loading={loading} />
        </Card>
      </FadeInUp>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string; border: string }> = {
    credited: { bg: "bg-emerald-50 dark:bg-emerald-900/20", color: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-200 dark:border-emerald-800" },
    pending: { bg: "bg-amber-50 dark:bg-amber-900/20", color: "text-amber-600 dark:text-amber-400", border: "border-amber-200 dark:border-amber-800" },
    cancelled: { bg: "bg-red-50 dark:bg-red-900/20", color: "text-red-600 dark:text-red-400", border: "border-red-200 dark:border-red-800" },
  };
  const s = map[status] || { bg: "bg-slate-50 dark:bg-slate-800", color: "text-slate-600 dark:text-slate-400", border: "border-slate-200 dark:border-slate-700" };
  return <span className={`rounded-md px-2 py-0.5 font-mono text-[9px] font-bold uppercase border ${s.bg} ${s.color} ${s.border}`}>{status}</span>;
}
