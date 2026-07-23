"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, FadeInUp } from "@thrift/ui";
import { formatDate, formatNaira } from "@thrift/utils";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/PageHeader";
import Pagination from "@/components/Pagination";
import { StatusBadge, FilterSelect, ActionMessage, useFlashMessage } from "@/components/AdminShared";
import { SimpleTable, SimpleColumn } from "@/components/SimpleTable";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const LIMIT = 20;

interface VAccount {
  id: string;
  provider: string;
  accountNumber: string;
  accountName?: string;
  bankName?: string;
  status: string;
  walletBalance?: number;
  createdAt: string;
  user?: { id: string; name: string; email: string };
}

interface RegenerateModal {
  open: boolean;
  va: VAccount | null;
  provider: string;
  reason: string;
}

export default function AdminVirtualAccountsPage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const isAdmin = user?.role === "admin" || user?.role === "superadmin";
  const { message, show } = useFlashMessage();

  const [items, setItems] = useState<VAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState("all");
  const [providerFilter, setProviderFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [regen, setRegen] = useState<RegenerateModal>({ open: false, va: null, provider: "flutterwave", reason: "" });
  const [regenerating, setRegenerating] = useState(false);
  const [reconciling, setReconciling] = useState(false);

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
      if (providerFilter !== "all") sp.set("provider", providerFilter);
      if (debounced) sp.set("search", debounced);
      const res = await fetch(`${API_URL}/api/admin/virtual-accounts?${sp}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) {
        setItems(data.data.items || []);
        setTotalPages(data.data.totalPages || 1);
        setTotal(data.data.total || 0);
      }
    } catch {}
    setLoading(false);
  }, [token, isAdmin, page, statusFilter, providerFilter, debounced]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const setStatus = async (va: VAccount, status: "active" | "inactive") => {
    setBusyId(va.id);
    try {
      const res = await fetch(`${API_URL}/api/admin/virtual-accounts/${va.id}/status`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) { show("success", `Account ${status}`); fetchAll(); }
      else show("error", data.error || "Failed");
    } catch { show("error", "Failed"); }
    setBusyId(null);
  };

  const generateMissing = async () => {
    setGenerating(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/virtual-accounts/generate`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ provider: "monnify" }),
      });
      const data = await res.json();
      if (data.success) show("success", `Generated ${data.data.created} virtual account(s) for ${data.data.eligible} eligible member(s)`);
      else show("error", data.error || "Failed");
      fetchAll();
    } catch { show("error", "Failed"); }
    setGenerating(false);
  };

  const openRegenerate = (va: VAccount) => {
    setRegen({ open: true, va, provider: va.provider, reason: "" });
  };

  const handleRegenerate = async () => {
    if (!regen.va?.user?.id || !regen.reason.trim()) return;
    setRegenerating(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/virtual-accounts/${regen.va.user.id}/regenerate`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ provider: regen.provider, reason: regen.reason.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        show("success", "Virtual account regenerated successfully");
        setRegen({ open: false, va: null, provider: "flutterwave", reason: "" });
        fetchAll();
      } else {
        show("error", data.error || "Failed to regenerate");
      }
    } catch {
      show("error", "Failed to regenerate virtual account");
    }
    setRegenerating(false);
  };

  const reconcileAll = async () => {
    setReconciling(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/virtual-accounts/reconcile-all`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ sinceHours: 24 }),
      });
      const data = await res.json();
      if (data.success) {
        show("success", `Reconciled ${data.data.totalTransfersCredited} transfer(s) across ${data.data.accountsProcessed} account(s)`);
        fetchAll();
      } else {
        show("error", data.error || "Failed to reconcile");
      }
    } catch {
      show("error", "Failed to reconcile payments");
    }
    setReconciling(false);
  };

  const columns: SimpleColumn<VAccount>[] = [
    { key: "user", header: "User", render: (va) => <><span className="block font-semibold text-slate-900 dark:text-white">{va.user?.name || "—"}</span><span className="text-[11px] text-slate-500 dark:text-slate-400">{va.user?.email}</span></> },
    { key: "account", header: "Account", mono: true, render: (va) => <><span className="block font-semibold text-slate-900 dark:text-white">{va.accountNumber}</span><span className="text-[11px] text-slate-500 dark:text-slate-400">{va.bankName || "—"}</span></> },
    { key: "provider", header: "Provider", render: (va) => <span className="capitalize text-slate-500 dark:text-slate-400">{va.provider}</span> },
    { key: "wallet", header: "Wallet", mono: true, render: (va) => <span className="font-semibold text-slate-900 dark:text-white">{formatNaira(va.walletBalance || 0)}</span> },
    { key: "status", header: "Status", render: (va) => <StatusBadge status={va.status} /> },
    { key: "created", header: "Created", render: (va) => <span className="text-slate-500 dark:text-slate-400">{formatDate(new Date(va.createdAt))}</span> },
    { key: "actions", header: "Actions", align: "right", render: (va) => (
      <div className="flex justify-end gap-1.5">
        {va.status !== "active" && <button onClick={(e) => { e.stopPropagation(); setStatus(va, "active"); }} disabled={busyId === va.id} className="cursor-pointer rounded-md px-2 py-1 text-[10px] font-semibold" style={btn("#059669")}>{busyId === va.id ? "..." : "Activate"}</button>}
        {va.status !== "inactive" && <button onClick={(e) => { e.stopPropagation(); setStatus(va, "inactive"); }} disabled={busyId === va.id} className="cursor-pointer rounded-md px-2 py-1 text-[10px] font-semibold" style={btn("#DC2626")}>{busyId === va.id ? "..." : "Deactivate"}</button>}
        <button onClick={(e) => { e.stopPropagation(); openRegenerate(va); }} disabled={busyId === va.id} className="cursor-pointer rounded-md px-2 py-1 text-[10px] font-semibold" style={btn("#7C3AED")}>{busyId === va.id ? "..." : "Regenerate"}</button>
      </div>
    ) },
  ];

  if (authLoading || !isAdmin) return null;

  return (
    <div className="mx-auto max-w-[1280px] p-[clamp(1rem,3vw,2rem)]">
      <PageHeader badgeLabel="Admin" heading="Virtual" accentText="Accounts" description="Inspect assigned bank accounts used for auto-settlement and monitor their status." />

      <ActionMessage message={message} />

      <FadeInUp delay={200}>
        <Card padding="1.5rem">
          <div className="mb-4 flex flex-wrap gap-3">
            <input
              placeholder="Search account no, email, name..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="min-w-[200px] flex-1 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-[12px] outline-none dark:bg-slate-800 dark:text-white"
            />
            <FilterSelect value={providerFilter} onChange={(v) => { setProviderFilter(v); setPage(1); }} options={["all", "monnify", "flutterwave", "paystack"]} />
            <FilterSelect value={statusFilter} onChange={(v) => { setStatusFilter(v); setPage(1); }} options={["all", "active", "inactive", "pending"]} />
            <button onClick={generateMissing} disabled={generating}
              className="cursor-pointer whitespace-nowrap rounded-lg border border-emerald-600/25 bg-emerald-600/10 px-3 py-2 text-[12px] font-semibold text-emerald-600 dark:text-emerald-400"
              style={{ opacity: generating ? 0.5 : 1 }}>
              {generating ? "Generating..." : "Generate missing"}
            </button>
            <button onClick={reconcileAll} disabled={reconciling}
              className="cursor-pointer whitespace-nowrap rounded-lg border border-blue-600/25 bg-blue-600/10 px-3 py-2 text-[12px] font-semibold text-blue-600 dark:text-blue-400"
              style={{ opacity: reconciling ? 0.5 : 1 }}>
              {reconciling ? "Reconciling..." : "Reconcile all"}
            </button>
          </div>

          {loading ? (
            <div className="p-12 text-center text-[13px] text-slate-500 dark:text-slate-400">Loading accounts...</div>
          ) : (
            <SimpleTable columns={columns} data={items} minWidth="820px" emptyMessage="No virtual accounts found." />
          )}
          <Pagination page={page} totalPages={totalPages} total={total} limit={LIMIT} onPageChange={setPage} loading={loading} />
        </Card>
      </FadeInUp>

      {regen.open && regen.va && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-xl">
            <h3 className="mb-1 text-[15px] font-bold text-slate-900 dark:text-white">Regenerate Virtual Account</h3>
            <p className="mb-4 text-[12px] text-slate-500 dark:text-slate-400">
              This will deactivate the current account <span className="font-mono font-semibold">{regen.va.accountNumber}</span> and create a new one for <span className="font-semibold">{regen.va.user?.name || regen.va.user?.email}</span>.
            </p>

            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Provider</label>
            <select
              value={regen.provider}
              onChange={(e) => setRegen((r) => ({ ...r, provider: e.target.value }))}
              className="mb-3 w-full rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-[12px] outline-none dark:bg-slate-800 dark:text-white"
            >
              <option value="flutterwave">Flutterwave</option>
              <option value="paystack">Paystack</option>
              <option value="nomba">Nomba</option>
            </select>

            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Reason (required)</label>
            <textarea
              value={regen.reason}
              onChange={(e) => setRegen((r) => ({ ...r, reason: e.target.value }))}
              placeholder="e.g. User reported issues with current account..."
              rows={3}
              className="mb-4 w-full resize-none rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-[12px] outline-none dark:bg-slate-800 dark:text-white"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setRegen({ open: false, va: null, provider: "flutterwave", reason: "" })}
                className="cursor-pointer rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2 text-[12px] font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleRegenerate}
                disabled={regenerating || !regen.reason.trim()}
                className="cursor-pointer rounded-lg bg-blue-600 px-4 py-2 text-[12px] font-semibold text-white hover:bg-blue-700"
                style={{ opacity: regenerating || !regen.reason.trim() ? 0.5 : 1 }}
              >
                {regenerating ? "Regenerating..." : "Regenerate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function btn(color: string): React.CSSProperties {
  return { padding: "0.25rem 0.5rem", borderRadius: "0.375rem", fontSize: "10px", fontWeight: 600, border: `1px solid ${color}40`, backgroundColor: `${color}0F`, color, cursor: "pointer" };
}
