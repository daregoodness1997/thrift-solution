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

  return (
    <div className="mx-auto max-w-[1280px] p-[clamp(1rem,3vw,2rem)]">
      <PageHeader badgeLabel="Admin" heading="Referral" accentText="Earnings" description="Review referral bonuses and pay out pending earnings to members." />

      {message && (
        <FadeIn>
          <div className={`mb-6 rounded-xl border px-4 py-3 text-[13px] font-medium ${message.type === "success" ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-red-50 text-red-600 border-red-200"}`}>
            {message.text}
          </div>
        </FadeIn>
      )}

      <FadeInUp delay={100}>
        <div className="mb-6 grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-3">
          <div className="rounded-xl border border-[#FDE68A] bg-amber-50 p-4">
            <div className="font-mono text-[9px] uppercase tracking-[0.08em] text-amber-600">Pending Payout</div>
            <div className="mt-1 text-base font-bold text-amber-600">{formatNaira(pending.amount)}</div>
            <div className="mt-0.5 text-[10px] text-gray-500">{pending.count} earnings</div>
          </div>
        </div>
      </FadeInUp>

      <FadeInUp delay={200}>
        <Card padding="1.5rem">
          <div className="mb-4 flex flex-wrap gap-3">
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-[12px] capitalize">
              {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {loading ? (
            <div className="p-12 text-center text-[13px] text-gray-500">Loading earnings...</div>
          ) : items.length === 0 ? (
            <div className="p-8 text-center text-[13px] text-gray-500">No referral earnings found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[12px] min-w-[820px]">
                <thead>
                  <tr className="border-b border-gray-100 font-mono text-[9px] uppercase tracking-[0.1em] text-gray-500">
                    <th className="pb-3 text-left font-semibold">Referrer</th>
                    <th className="pb-3 text-left font-semibold">Referred</th>
                    <th className="pb-3 text-right font-semibold">Amount</th>
                    <th className="pb-3 text-left font-semibold">Level</th>
                    <th className="pb-3 text-left font-semibold">Status</th>
                    <th className="pb-3 text-left font-semibold">Date</th>
                    <th className="pb-3 text-right font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((e) => (
                    <tr key={e.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3">
                        <span className="block font-semibold text-brand-dark">{e.referrer?.name || "—"}</span>
                        <span className="text-[11px] text-gray-500">{e.referrer?.email}</span>
                      </td>
                      <td className="py-3">
                        <span className="block text-gray-500">{e.referredUser?.name || "—"}</span>
                        <span className="text-[11px] text-gray-500">{e.referredUser?.email}</span>
                      </td>
                      <td className="py-3 text-right font-mono font-semibold text-brand-dark">{formatNaira(e.amount)}</td>
                      <td className="py-3 text-gray-500">L{e.level}</td>
                      <td className="py-3"><StatusBadge status={e.status} /></td>
                      <td className="py-3 text-gray-500">{formatDate(new Date(e.createdAt))}</td>
                      <td className="py-3 text-right">
                        {e.status === "pending" ? (
                          <button onClick={() => pay(e)} disabled={busyId === e.id}
                            className="cursor-pointer rounded-md border border-emerald-600/25 bg-emerald-600/10 px-2 py-1 text-[10px] font-semibold text-emerald-600"
                            style={{ opacity: busyId === e.id ? 0.5 : 1 }}>
                            {busyId === e.id ? "..." : "Pay"}
                          </button>
                        ) : <span className="text-[10px] text-[#B0B0B0]">—</span>}
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

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string; border: string }> = {
    credited: { bg: "#ECFDF5", color: "#059669", border: "#A7F3D0" },
    pending: { bg: "#FFFBEB", color: "#D97706", border: "#FDE68A" },
    cancelled: { bg: "#FEF2F2", color: "#DC2626", border: "#FECACA" },
  };
  const s = map[status] || { bg: "#F3F4F6", color: "#4B5563", border: "#E5E7EB" };
  return <span className="rounded-md px-2 py-0.5 font-mono text-[9px] font-bold uppercase" style={{ backgroundColor: s.bg, color: s.color, border: `1px solid ${s.border}` }}>{status}</span>;
}
