"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, FadeInUp, StatCard } from "@thrift/ui";
import { formatNaira, formatDate } from "@thrift/utils";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/PageHeader";
import Pagination from "@/components/Pagination";
import {
  StatusBadge,
  FilterSelect,
  ActionMessage,
  useFlashMessage,
} from "@/components/AdminShared";
import { SimpleTable, SimpleColumn } from "@/components/SimpleTable";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const LIMIT = 20;

interface Donation {
  id: string;
  type: string;
  amount?: number;
  status: string;
  itemName?: string;
  createdAt: string;
  user?: { id: string; name: string; email: string };
  group?: { id: string; name: string } | null;
}

export default function AdminDonationsPage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const isAdmin = user?.role === "admin" || user?.role === "superadmin";
  const { message, show } = useFlashMessage();

  const [items, setItems] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [stats, setStats] = useState<{
    totalRaised: number;
    monetaryCount: number;
    itemCount: number;
    byStatus: { status: string; count: number }[];
  }>({ totalRaised: 0, monetaryCount: 0, itemCount: 0, byStatus: [] });

  useEffect(() => {
    if (!authLoading && user && !isAdmin) router.replace("/");
  }, [authLoading, user, isAdmin, router]);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchAll = useCallback(async () => {
    if (!token || !isAdmin) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const sp = new URLSearchParams({
        page: String(page),
        limit: String(LIMIT),
      });
      if (typeFilter !== "all") sp.set("type", typeFilter);
      if (statusFilter !== "all") sp.set("status", statusFilter);
      if (debounced) sp.set("search", debounced);
      const [list, st] = await Promise.all([
        fetch(`${API_URL}/api/admin/donations?${sp}`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then((r) => r.json()),
        fetch(`${API_URL}/api/admin/donations/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then((r) => r.json()),
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

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const setStatus = async (d: Donation, status: string) => {
    setBusyId(d.id);
    try {
      const res = await fetch(`${API_URL}/api/admin/donations/${d.id}/status`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) {
        show("success", `Donation ${status}`);
        fetchAll();
      } else show("error", data.error || "Failed");
    } catch {
      show("error", "Failed");
    }
    setBusyId(null);
  };

  if (authLoading || !isAdmin) return null;

  const statuses = ["all", "pending", "completed", "failed", "cancelled"];
  const types = ["all", "monetary", "item"];

  const columns: SimpleColumn<Donation>[] = [
    {
      key: "donor",
      header: "Donor",
      render: (d) => (
        <>
          <span className="block font-semibold text-slate-900 dark:text-white">
            {d.user?.name || "—"}
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            {d.user?.email}
          </span>
        </>
      ),
    },
    {
      key: "item",
      header: "Item / Type",
      render: (d) => (
        <>
          <span className="block text-slate-500 dark:text-slate-400">
            {d.type === "item" ? d.itemName || "Item" : "Monetary"}
          </span>
          {d.group && (
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              {d.group.name}
            </span>
          )}
        </>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      mono: true,
      render: (d) =>
        d.type === "monetary" ? formatNaira(d.amount ?? 0) : "—",
    },
    {
      key: "status",
      header: "Status",
      render: (d) => <StatusBadge status={d.status} />,
    },
    {
      key: "date",
      header: "Date",
      render: (d) => formatDate(new Date(d.createdAt)),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (d) => (
        <div className="flex justify-end gap-1.5">
          {d.status !== "completed" && (
            <button
              onClick={(e) => { e.stopPropagation(); setStatus(d, "completed"); }}
              disabled={busyId === d.id}
              className="cursor-pointer rounded-md px-2 py-1 text-[10px] font-semibold border border-emerald-400/40 bg-emerald-500/[0.06] text-emerald-600"
            >
              Complete
            </button>
          )}
          {d.status !== "failed" && (
            <button
              onClick={(e) => { e.stopPropagation(); setStatus(d, "failed"); }}
              disabled={busyId === d.id}
              className="cursor-pointer rounded-md px-2 py-1 text-[10px] font-semibold border border-red-400/40 bg-red-500/[0.06] text-red-600"
            >
              Fail
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-[1280px] p-[clamp(1rem,3vw,2rem)]">
      <PageHeader
        badgeLabel="Admin"
        heading="Donations"
        accentText="Oversight"
        description="Track monetary and item donations across the platform."
      />

      <ActionMessage message={message} />

      <FadeInUp delay={100}>
        <div className="mb-6 grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3">
          <StatCard
            label="Total Raised"
            value={formatNaira(stats.totalRaised)}
            sub={`${stats.monetaryCount} monetary`}
          />
          <StatCard label="Item Donations" value={String(stats.itemCount)} />
          {stats.byStatus.map((s) => (
            <StatCard
              key={s.status}
              label={`${s.status}`}
              value={String(s.count)}
            />
          ))}
        </div>
      </FadeInUp>

      <FadeInUp delay={200}>
        <Card padding="1.5rem">
          <div className="mb-4 flex flex-wrap gap-3">
            <input
              placeholder="Search item, email, name..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="min-w-[200px] flex-1 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-[12px] outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400"
            />
            <FilterSelect
              value={typeFilter}
              onChange={(v) => {
                setTypeFilter(v);
                setPage(1);
              }}
              options={types}
            />
            <FilterSelect
              value={statusFilter}
              onChange={(v) => {
                setStatusFilter(v);
                setPage(1);
              }}
              options={statuses}
            />
          </div>

          {loading ? (
            <div className="p-12 text-center text-[13px] text-slate-500 dark:text-slate-400">
              Loading donations...
            </div>
          ) : items.length === 0 ? (
            <div className="p-8 text-center text-[13px] text-slate-500 dark:text-slate-400">
              No donations found.
            </div>
          ) : (
            <SimpleTable columns={columns} data={items} minWidth="820px" />
          )}
          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            limit={LIMIT}
            onPageChange={setPage}
            loading={loading}
          />
        </Card>
      </FadeInUp>
    </div>
  );
}


