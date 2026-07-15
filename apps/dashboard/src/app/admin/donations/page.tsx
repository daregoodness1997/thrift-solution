"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, FadeInUp } from "@thrift/ui";
import { formatNaira, formatDate } from "@thrift/utils";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/PageHeader";
import Pagination from "@/components/Pagination";
import {
  StatusBadge,
  FilterSelect,
  ActionMessage,
  useFlashMessage,
  StatCard,
} from "@/components/AdminShared";

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
              className="min-w-[200px] flex-1 rounded-lg border border-gray-200 px-3 py-2 text-[12px] outline-none"
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
            <div className="p-12 text-center text-[13px] text-gray-500">
              Loading donations...
            </div>
          ) : items.length === 0 ? (
            <div className="p-8 text-center text-[13px] text-gray-500">
              No donations found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[12px] min-w-[820px]">
                <thead>
                  <tr className="border-b border-gray-100 font-mono text-[9px] uppercase tracking-[0.1em] text-gray-500">
                    <th className="pb-3 text-left font-semibold">Donor</th>
                    <th className="pb-3 text-left font-semibold">
                      Item / Type
                    </th>
                    <th className="pb-3 text-right font-semibold">Amount</th>
                    <th className="pb-3 text-left font-semibold">Status</th>
                    <th className="pb-3 text-left font-semibold">Date</th>
                    <th className="pb-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((d) => (
                    <tr
                      key={d.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-3">
                        <span className="block font-semibold text-brand-dark">
                          {d.user?.name || "—"}
                        </span>
                        <span className="text-[11px] text-gray-500">
                          {d.user?.email}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className="block text-gray-500">
                          {d.type === "item"
                            ? d.itemName || "Item"
                            : "Monetary"}
                        </span>
                        {d.group && (
                          <span className="text-[11px] text-gray-500">
                            {d.group.name}
                          </span>
                        )}
                      </td>
                      <td className="py-3 text-right font-mono font-semibold text-brand-dark">
                        {d.type === "monetary"
                          ? formatNaira(d.amount ?? 0)
                          : "—"}
                      </td>
                      <td className="py-3">
                        <StatusBadge status={d.status} />
                      </td>
                      <td className="py-3 text-gray-500">
                        {formatDate(new Date(d.createdAt))}
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex justify-end gap-1.5">
                          {d.status !== "completed" && (
                            <button
                              onClick={() => setStatus(d, "completed")}
                              disabled={busyId === d.id}
                              className="cursor-pointer rounded-md px-2 py-1 text-[10px] font-semibold"
                              style={btn("#059669")}
                            >
                              Complete
                            </button>
                          )}
                          {d.status !== "failed" && (
                            <button
                              onClick={() => setStatus(d, "failed")}
                              disabled={busyId === d.id}
                              className="cursor-pointer rounded-md px-2 py-1 text-[10px] font-semibold"
                              style={btn("#DC2626")}
                            >
                              Fail
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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

function btn(color: string): React.CSSProperties {
  return {
    padding: "0.25rem 0.5rem",
    borderRadius: "0.375rem",
    fontSize: "10px",
    fontWeight: 600,
    border: `1px solid ${color}40`,
    backgroundColor: `${color}0F`,
    color,
    cursor: "pointer",
  };
}
