"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, FadeInUp } from "@thrift/ui";
import { formatDate } from "@thrift/utils";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/PageHeader";
import Pagination from "@/components/Pagination";
import { StatusBadge, FilterSelect, ActionMessage, useFlashMessage } from "@/components/AdminShared";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const LIMIT = 20;

interface Job {
  id: string;
  title: string;
  company?: string;
  location: string;
  jobType: string;
  status: string;
  createdAt: string;
  poster?: { id: string; name: string; email: string };
  _count?: { applications: number };
}

export default function AdminJobsPage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const isAdmin = user?.role === "admin" || user?.role === "superadmin";
  const { message, show } = useFlashMessage();

  const [items, setItems] = useState<Job[]>([]);
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
      const res = await fetch(`${API_URL}/api/admin/jobs?${sp}`, { headers: { Authorization: `Bearer ${token}` } });
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

  const setStatus = async (j: Job, status: "active" | "closed" | "filled") => {
    setBusyId(j.id);
    try {
      const res = await fetch(`${API_URL}/api/admin/jobs/${j.id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) { show("success", `Job marked ${status}`); fetchAll(); }
      else show("error", data.error || "Failed");
    } catch { show("error", "Failed"); }
    setBusyId(null);
  };

  const remove = async (j: Job) => {
    setBusyId(j.id);
    try {
      const res = await fetch(`${API_URL}/api/admin/jobs/${j.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) { show("success", "Job removed"); fetchAll(); }
      else show("error", data.error || "Failed");
    } catch { show("error", "Failed"); }
    setBusyId(null);
  };

  if (authLoading || !isAdmin) return null;

  return (
    <div className="mx-auto max-w-[1280px] p-[clamp(1rem,3vw,2rem)]">
      <PageHeader badgeLabel="Admin" heading="Job" accentText="Board Moderation" description="Approve, close, or remove member job postings." />

      <ActionMessage message={message} />

      <FadeInUp delay={200}>
        <Card padding="1.5rem">
          <div className="mb-4 flex flex-wrap gap-3">
            <input
              placeholder="Search title, company..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="min-w-[200px] flex-1 rounded-lg border border-gray-200 px-3 py-2 text-[12px] outline-none"
            />
            <FilterSelect value={statusFilter} onChange={(v) => { setStatusFilter(v); setPage(1); }} options={["all", "active", "closed", "filled", "pending"]} />
          </div>

          {loading ? (
            <div className="p-12 text-center text-[13px] text-gray-500">Loading jobs...</div>
          ) : items.length === 0 ? (
            <div className="p-8 text-center text-[13px] text-gray-500">No jobs found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[12px] min-w-[820px]">
                <thead>
                  <tr className="border-b border-gray-100 font-mono text-[9px] uppercase tracking-[0.1em] text-gray-500">
                    <th className="pb-3 text-left font-semibold">Title</th>
                    <th className="pb-3 text-left font-semibold">Poster</th>
                    <th className="pb-3 text-left font-semibold">Type</th>
                    <th className="pb-3 text-left font-semibold">Status</th>
                    <th className="pb-3 text-left font-semibold">Date</th>
                    <th className="pb-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((j) => (
                    <tr key={j.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3">
                        <span className="block font-semibold text-brand-dark">{j.title}</span>
                        <span className="text-[11px] text-gray-500">{j.company || "—"} · {j.location} · {j._count?.applications ?? 0} apps</span>
                      </td>
                      <td className="py-3">
                        <span className="block text-gray-500">{j.poster?.name || "—"}</span>
                        <span className="text-[11px] text-gray-500">{j.poster?.email}</span>
                      </td>
                      <td className="py-3 capitalize text-gray-500">{j.jobType}</td>
                      <td className="py-3"><StatusBadge status={j.status} /></td>
                      <td className="py-3 text-gray-500">{formatDate(new Date(j.createdAt))}</td>
                      <td className="py-3 text-right">
                        <div className="flex justify-end gap-1.5">
                          {j.status !== "active" && <button onClick={() => setStatus(j, "active")} disabled={busyId === j.id} className="cursor-pointer rounded-md px-2 py-1 text-[10px] font-semibold" style={btn("#059669")}>Open</button>}
                          {j.status !== "filled" && <button onClick={() => setStatus(j, "filled")} disabled={busyId === j.id} className="cursor-pointer rounded-md px-2 py-1 text-[10px] font-semibold" style={btn("#2563EB")}>Fill</button>}
                          {j.status !== "closed" && <button onClick={() => setStatus(j, "closed")} disabled={busyId === j.id} className="cursor-pointer rounded-md px-2 py-1 text-[10px] font-semibold" style={btn("#D97706")}>Close</button>}
                          <button onClick={() => remove(j)} disabled={busyId === j.id} className="cursor-pointer rounded-md px-2 py-1 text-[10px] font-semibold" style={btn("#DC2626")}>Delete</button>
                        </div>
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

function btn(color: string): React.CSSProperties {
  return { padding: "0.25rem 0.5rem", borderRadius: "0.375rem", fontSize: "10px", fontWeight: 600, border: `1px solid ${color}40`, backgroundColor: `${color}0F`, color, cursor: "pointer" };
}
