"use client";

import { useState, useEffect, useCallback } from "react";
import { config, BrandConfig } from "@thrift/config";
import { Card, Button, ColorfulBadge, FadeInUp, StaggerChildren } from "@thrift/ui";
import { formatNaira } from "@thrift/utils";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/PageHeader";
import Pagination from "@/components/Pagination";

const fallback = config;

interface DefaultItem {
  id: string;
  userId: string;
  userName: string;
  groupName: string;
  amount: number;
  dueDate: string;
  status: string;
  daysOverdue: number;
}

const statusStyles: Record<string, { bg: string; color: string; border: string }> = {
  overdue: { bg: "#FEF2F2", color: "#DC2626", border: "#FECACA" },
  pending: { bg: "#FFFBEB", color: "#D97706", border: "#FDE68A" },
  resolved: { bg: "#ECFDF5", color: "#059669", border: "#A7F3D0" },
};

export default function DefaultManagementPage() {
  const { token } = useAuth();
  const [cfg] = useState<BrandConfig>(config);
  const [defaults, setDefaults] = useState<DefaultItem[]>([]);
  const [filter, setFilter] = useState<"all" | "overdue" | "pending" | "resolved">("all");
  const [showReminder, setShowReminder] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [defStats, setDefStats] = useState({ totalDefaults: 0, totalOverdue: 0, totalPending: 0 });

  const LIMIT = 20;
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  const fetchDefaults = useCallback(async () => {
    if (!token) { setLoading(false); return; }
    try {
      const statusParam = filter !== "all" ? `&status=${filter}` : "";
      const res = await fetch(`${API_URL}/api/defaults?page=${page}&limit=${LIMIT}${statusParam}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) {
        setDefaults(data.data.items || []);
        setTotalPages(data.data.totalPages || 1);
        setTotal(data.data.total || 0);
        if (data.data.stats) setDefStats(data.data.stats);
      }
    } catch {}
    setLoading(false);
  }, [token, API_URL, page, LIMIT, filter]);

  useEffect(() => { fetchDefaults(); }, [fetchDefaults]);

  const handleFilterChange = (f: typeof filter) => {
    setFilter(f);
    setPage(1);
  };

  const filtered = defaults;

  const sendReminder = (id: string) => {
    setShowReminder(id);
    setTimeout(() => setShowReminder(null), 2000);
  };

  const markResolved = async (id: string) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/defaults/${id}/resolve`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setDefaults((prev) => prev.map((d) => d.id === id ? { ...d, status: "resolved", daysOverdue: 0 } : d));
      }
    } catch {}
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-[1280px] p-[clamp(1rem,3vw,2rem)]">
        <div className="p-16 text-center text-[13px] text-gray-500">Loading defaults...</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1280px] p-[clamp(1rem,3vw,2rem)]">
      <PageHeader
        badgeLabel="Member Management"
        heading="Default"
        accentText="Management"
        description="Track and manage missed contributions across your circles."
      />

      <StaggerChildren staggerDelay={100} className="mb-8 grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
        <Card padding="1.25rem">
          <span className="block text-[9px] font-bold uppercase tracking-[0.1em] text-gray-500">Total Defaults</span>
          <span className="mt-1 block font-mono text-2xl font-bold text-brand-dark">{defStats.totalDefaults}</span>
        </Card>
        <Card padding="1.25rem">
          <span className="block text-[9px] font-bold uppercase tracking-[0.1em] text-gray-500">Overdue Amount</span>
          <span className="mt-1 block font-mono text-2xl font-bold text-red-600">{formatNaira(defStats.totalOverdue)}</span>
        </Card>
        <Card padding="1.25rem">
          <span className="block text-[9px] font-bold uppercase tracking-[0.1em] text-gray-500">Pending Amount</span>
          <span className="mt-1 block font-mono text-2xl font-bold text-amber-600">{formatNaira(defStats.totalPending)}</span>
        </Card>
      </StaggerChildren>

      <FadeInUp delay={300}>
        <Card padding="1.5rem" className="mb-6">
          <div className="mb-4 flex items-center justify-between">
            <ColorfulBadge label="Defaulters" color={cfg.colors.primary} />
            <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
              {(["all", "overdue", "pending", "resolved"] as const).map((f) => (
                <button key={f} onClick={() => handleFilterChange(f)}
                  className="cursor-pointer rounded-md px-3 py-1.5 text-[11px] font-semibold capitalize"
                  style={{ backgroundColor: filter === f ? "#ffffff" : "transparent", color: filter === f ? cfg.colors.primary : "#717171", boxShadow: filter === f ? "0 1px 3px rgba(0,0,0,0.08)" : "none" }}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="p-8 text-center text-[13px] text-gray-500">
              No default records found.
            </div>
          ) : (
            <div className="overflow-x-auto [-webkit-overflow-scrolling:touch]">
              <table className="w-full border-collapse text-[12px] min-w-[600px]">
                <thead>
                  <tr className="border-b border-gray-100 font-mono text-[9px] uppercase tracking-[0.1em] text-gray-500">
                    <th className="pb-3 text-left font-semibold">Member</th>
                    <th className="pb-3 text-left font-semibold">Circle</th>
                    <th className="pb-3 text-right font-semibold">Amount</th>
                    <th className="pb-3 text-left font-semibold">Due Date</th>
                    <th className="pb-3 text-right font-semibold">Status</th>
                    <th className="pb-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((d) => {
                    const st = statusStyles[d.status] || statusStyles.pending;
                    const initials = d.userName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
                    return (
                      <tr key={d.id} className="border-b border-gray-100 transition-colors hover:bg-gray-50">
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold" style={{ backgroundColor: `${cfg.colors.primary}15`, color: cfg.colors.primary }}>
                              {initials}
                            </div>
                            <span className="font-medium text-brand-dark">{d.userName}</span>
                          </div>
                        </td>
                        <td className="py-3">
                          <span className="rounded-md px-2 py-0.5 font-mono text-[9px] font-bold uppercase" style={{ backgroundColor: `${cfg.colors.primary}12`, color: cfg.colors.primary, border: `1px solid ${cfg.colors.primary}20` }}>{d.groupName}</span>
                        </td>
                        <td className="py-3 text-right font-mono font-semibold text-brand-dark">{formatNaira(d.amount)}</td>
                        <td className="py-3 font-mono text-gray-500">
                          {new Date(d.dueDate).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                          {d.daysOverdue > 0 && <span className="ml-1.5 text-[9px] text-red-600">({d.daysOverdue}d late)</span>}
                        </td>
                        <td className="py-3 text-right">
                          <span className="rounded-md px-2 py-0.5 font-bold uppercase" style={{ backgroundColor: st.bg, color: st.color, border: `1px solid ${st.border}` }}>{d.status}</span>
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex justify-end gap-1.5">
                            {d.status !== "resolved" && (
                              <>
                                <button onClick={() => sendReminder(d.id)}
                                  className="cursor-pointer rounded-md px-2 py-1 text-[10px] font-semibold"
                                  style={{ border: `1px solid ${cfg.colors.primary}30`, backgroundColor: showReminder === d.id ? "#ECFDF5" : `${cfg.colors.primary}08`, color: cfg.colors.primary }}>
                                  {showReminder === d.id ? "Sent!" : "Remind"}
                                </button>
                                <button onClick={() => markResolved(d.id)}
                                  className="cursor-pointer rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-600">
                                  Resolve
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <Pagination page={page} totalPages={totalPages} total={total} limit={LIMIT} onPageChange={setPage} loading={loading} />
        </Card>
      </FadeInUp>

      <FadeInUp delay={400}>
        <Card padding="1.5rem">
          <div className="mb-4">
            <ColorfulBadge label="Policy" color={cfg.colors.accent} />
            <h2 className="mt-2 text-[1.125rem] font-medium text-brand-dark">Default Policy Settings</h2>
          </div>
          <div className="flex flex-col gap-0">
            <div className="flex items-center justify-between border-b border-gray-100 py-3">
              <div>
                <span className="block text-[12px] font-medium text-brand-dark">Grace Period</span>
                <span className="text-[11px] font-light text-gray-500">Days after due date before marking as default</span>
              </div>
              <span className="font-mono text-[12px] font-semibold" style={{ color: cfg.colors.primary }}>3 days</span>
            </div>
            <div className="flex items-center justify-between border-b border-gray-100 py-3">
              <div>
                <span className="block text-[12px] font-medium text-brand-dark">Auto-reminders</span>
                <span className="text-[11px] font-light text-gray-500">Send automatic reminders to defaulting members</span>
              </div>
              <span className="text-[12px] font-semibold text-emerald-600">Enabled</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <span className="block text-[12px] font-medium text-brand-dark">Maximum Defaults</span>
                <span className="text-[11px] font-light text-gray-500">Consecutive defaults before member review</span>
              </div>
              <span className="font-mono text-[12px] font-semibold" style={{ color: cfg.colors.primary }}>2</span>
            </div>
          </div>
        </Card>
      </FadeInUp>
    </div>
  );
}
