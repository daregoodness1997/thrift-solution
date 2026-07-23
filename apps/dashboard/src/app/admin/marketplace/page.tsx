"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, FadeInUp } from "@thrift/ui";
import { formatNaira, formatDate } from "@thrift/utils";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/PageHeader";
import Pagination from "@/components/Pagination";
import { StatusBadge, FilterSelect, ActionMessage, useFlashMessage } from "@/components/AdminShared";
import { SimpleTable, SimpleColumn } from "@/components/SimpleTable";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const LIMIT = 20;

interface Listing {
  id: string;
  title: string;
  price: number;
  currency?: string;
  category: string;
  status: string;
  createdAt: string;
  seller?: { id: string; name: string; email: string };
  _count?: { offers: number };
}

export default function AdminMarketplacePage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const isAdmin = user?.role === "admin" || user?.role === "superadmin";
  const { message, show } = useFlashMessage();

  const [items, setItems] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

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
      if (statusFilter !== "all") sp.set("status", statusFilter);
      if (debounced) sp.set("search", debounced);
      const res = await fetch(`${API_URL}/api/admin/marketplace?${sp}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) {
        setItems(data.data.items || []);
        setTotalPages(data.data.totalPages || 1);
        setTotal(data.data.total || 0);
      }
    } catch {}
    setLoading(false);
  }, [token, isAdmin, page, statusFilter, debounced]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const setStatus = async (l: Listing, status: "active" | "removed" | "sold") => {
    setBusyId(l.id);
    try {
      const res = await fetch(`${API_URL}/api/admin/marketplace/${l.id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) { show("success", `Listing marked ${status}`); fetchAll(); }
      else show("error", data.error || "Failed");
    } catch { show("error", "Failed"); }
    setBusyId(null);
  };

  const remove = async (l: Listing) => {
    setBusyId(l.id);
    try {
      const res = await fetch(`${API_URL}/api/admin/marketplace/${l.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) { show("success", "Listing removed"); fetchAll(); }
      else show("error", data.error || "Failed");
    } catch { show("error", "Failed"); }
    setBusyId(null);
  };

  if (authLoading || !isAdmin) return null;

  const columns: SimpleColumn<Listing>[] = [
    {
      key: "title",
      header: "Title",
      render: (l) => (
        <>
          <span className="block font-semibold text-slate-900 dark:text-white">{l.title}</span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">{l.category} · {l._count?.offers ?? 0} offers</span>
        </>
      ),
    },
    {
      key: "price",
      header: "Price",
      align: "right",
      mono: true,
      render: (l) => formatNaira(l.price),
    },
    {
      key: "seller",
      header: "Seller",
      render: (l) => (
        <>
          <span className="block text-slate-500 dark:text-slate-400">{l.seller?.name || "—"}</span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">{l.seller?.email}</span>
        </>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (l) => <StatusBadge status={l.status} />,
    },
    {
      key: "date",
      header: "Date",
      render: (l) => formatDate(new Date(l.createdAt)),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (l) => (
        <div className="flex justify-end gap-1.5">
          {l.status !== "active" && <button onClick={(e) => { e.stopPropagation(); setStatus(l, "active"); }} disabled={busyId === l.id} className="cursor-pointer rounded-md px-2 py-1 text-[10px] font-semibold border border-emerald-400/40 bg-emerald-500/[0.06] text-emerald-600">Approve</button>}
          {l.status !== "removed" && <button onClick={(e) => { e.stopPropagation(); setStatus(l, "removed"); }} disabled={busyId === l.id} className="cursor-pointer rounded-md px-2 py-1 text-[10px] font-semibold border border-amber-400/40 bg-amber-500/[0.06] text-amber-600">Hide</button>}
          {l.status !== "sold" && <button onClick={(e) => { e.stopPropagation(); setStatus(l, "sold"); }} disabled={busyId === l.id} className="cursor-pointer rounded-md px-2 py-1 text-[10px] font-semibold border border-blue-400/40 bg-blue-500/[0.06] text-blue-600">Sold</button>}
          <button onClick={(e) => { e.stopPropagation(); remove(l); }} disabled={busyId === l.id} className="cursor-pointer rounded-md px-2 py-1 text-[10px] font-semibold border border-red-400/40 bg-red-500/[0.06] text-red-600">Delete</button>
        </div>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-[1280px] p-[clamp(1rem,3vw,2rem)]">
      <PageHeader badgeLabel="Admin" heading="Marketplace" accentText="Moderation" description="Approve, reject, or remove member marketplace listings." />

      <ActionMessage message={message} />

      <FadeInUp delay={200}>
        <Card padding="1.5rem">
          <div className="mb-4 flex flex-wrap gap-3">
            <input
              placeholder="Search title, description..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="min-w-[200px] flex-1 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-[12px] outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400"
            />
            <FilterSelect value={statusFilter} onChange={(v) => { setStatusFilter(v); setPage(1); }} options={["all", "active", "removed", "sold", "pending"]} />
          </div>

          {loading ? (
            <div className="p-12 text-center text-[13px] text-slate-500 dark:text-slate-400">Loading listings...</div>
          ) : items.length === 0 ? (
            <div className="p-8 text-center text-[13px] text-slate-500 dark:text-slate-400">No listings found.</div>
          ) : (
            <SimpleTable columns={columns} data={items} minWidth="820px" />
          )}
          <Pagination page={page} totalPages={totalPages} total={total} limit={LIMIT} onPageChange={setPage} loading={loading} />
        </Card>
      </FadeInUp>
    </div>
  );
}


