"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, FadeInUp } from "@thrift/ui";
import { formatDate } from "@thrift/utils";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/PageHeader";
import Pagination from "@/components/Pagination";
import { StatusBadge, FilterSelect, ActionMessage, useFlashMessage } from "@/components/AdminShared";
import { SimpleTable, SimpleColumn } from "@/components/SimpleTable";

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

  const columns: SimpleColumn<Job>[] = [
    { key: "title", header: "Title", render: (j) => <><span className="block font-semibold text-slate-900 dark:text-white">{j.title}</span><span className="text-[11px] text-slate-500 dark:text-slate-400">{j.company || "—"} · {j.location} · {j._count?.applications ?? 0} apps</span></> },
    { key: "poster", header: "Poster", render: (j) => <><span className="block text-slate-500 dark:text-slate-400">{j.poster?.name || "—"}</span><span className="text-[11px] text-slate-500 dark:text-slate-400">{j.poster?.email}</span></> },
    { key: "type", header: "Type", render: (j) => <span className="capitalize text-slate-500 dark:text-slate-400">{j.jobType}</span> },
    { key: "status", header: "Status", render: (j) => <StatusBadge status={j.status} /> },
    { key: "date", header: "Date", render: (j) => <span className="text-slate-500 dark:text-slate-400">{formatDate(new Date(j.createdAt))}</span> },
    { key: "actions", header: "Actions", align: "right", render: (j) => (
      <div className="flex justify-end gap-1.5">
        {j.status !== "active" && <button onClick={(e) => { e.stopPropagation(); setStatus(j, "active"); }} disabled={busyId === j.id} className="cursor-pointer rounded-md px-2 py-1 text-[10px] font-semibold border border-emerald-400/40 bg-emerald-500/[0.06] text-emerald-600">Open</button>}
        {j.status !== "filled" && <button onClick={(e) => { e.stopPropagation(); setStatus(j, "filled"); }} disabled={busyId === j.id} className="cursor-pointer rounded-md px-2 py-1 text-[10px] font-semibold border border-blue-400/40 bg-blue-500/[0.06] text-blue-600">Fill</button>}
        {j.status !== "closed" && <button onClick={(e) => { e.stopPropagation(); setStatus(j, "closed"); }} disabled={busyId === j.id} className="cursor-pointer rounded-md px-2 py-1 text-[10px] font-semibold border border-amber-400/40 bg-amber-500/[0.06] text-amber-600">Close</button>}
        <button onClick={(e) => { e.stopPropagation(); remove(j); }} disabled={busyId === j.id} className="cursor-pointer rounded-md px-2 py-1 text-[10px] font-semibold border border-red-400/40 bg-red-500/[0.06] text-red-600">Delete</button>
      </div>
    ) },
  ];

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
              className="min-w-[200px] flex-1 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-[12px] outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400"
            />
            <FilterSelect value={statusFilter} onChange={(v) => { setStatusFilter(v); setPage(1); }} options={["all", "active", "closed", "filled", "pending"]} />
          </div>

          {loading ? (
            <div className="p-12 text-center text-[13px] text-slate-500 dark:text-slate-400">Loading jobs...</div>
          ) : (
            <SimpleTable columns={columns} data={items} minWidth="820px" emptyMessage="No jobs found." />
          )}
          <Pagination page={page} totalPages={totalPages} total={total} limit={LIMIT} onPageChange={setPage} loading={loading} />
        </Card>
      </FadeInUp>
    </div>
  );
}


