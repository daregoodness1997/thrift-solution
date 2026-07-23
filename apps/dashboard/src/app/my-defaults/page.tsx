"use client";

import { useState, useEffect, useCallback } from "react";
import { config, BrandConfig } from "@thrift/config";
import { Card, FadeIn, FadeInUp, StaggerChildren } from "@thrift/ui";
import { formatNaira } from "@thrift/utils";
import { useAuth } from "@/lib/auth-context";
import { AlertTriangle, DollarSign, Wallet, Filter } from "lucide-react";
import Pagination from "@/components/Pagination";

const fallback = config;

interface CircleDefault {
  id: string;
  circleAccountId: string;
  weekNumber: number;
  amountDue: number;
  clearanceAmount: number;
  status: string;
  clearedAt?: string;
  createdAt: string;
  circleAccount: {
    id: string;
    circle: { id: string; name: string; weeklyAmount?: number | null; defaultPenaltyType?: string | null; defaultPenaltyValue?: number | null };
  };
}

function formatClearanceLabel(penaltyType?: string | null, penaltyValue?: number | null) {
  const pt = penaltyType || "percent";
  const pv = penaltyValue != null ? penaltyValue : 100;
  if (pt === "percent") return `${100 + pv}%`;
  return `+₦${pv.toLocaleString()}`;
}

const statusStyles: Record<string, { bg: string; color: string; border: string }> = {
  outstanding: { bg: "#FEF2F2", color: "#DC2626", border: "#FECACA" },
  cleared: { bg: "#ECFDF5", color: "#059669", border: "#A7F3D0" },
};

export default function MyDefaultsPage() {
  const { token } = useAuth();
  const [cfg] = useState<BrandConfig>(fallback);
  const [defaults, setDefaults] = useState<CircleDefault[]>([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "outstanding" | "cleared">("outstanding");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [clearingId, setClearingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const LIMIT = 20;
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const fetchDefaults = useCallback(async () => {
    if (!token) { setLoading(false); return; }
    try {
      const statusParam = filter === "all" ? "" : `&status=${filter}`;
      const res = await fetch(`${API_URL}/api/circles/defaults/my?page=${page}&limit=${LIMIT}${statusParam}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setDefaults(data.data.items || []);
        setTotalPages(data.data.totalPages || 1);
        setTotal(data.data.total || 0);
      }
      try {
        const walletRes = await fetch(`${API_URL}/api/wallet/balance`, { headers: { Authorization: `Bearer ${token}` } });
        const walletJson = await walletRes.json();
        if (walletJson.success) setWalletBalance(walletJson.data.balance);
      } catch {}
    } catch {}
    setLoading(false);
  }, [token, API_URL, page, filter]);

  useEffect(() => { fetchDefaults(); }, [fetchDefaults]);

  const handleClear = async (id: string) => {
    setClearingId(id);
    try {
      const res = await fetch(`${API_URL}/api/circles/defaults/${id}/clear`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        showMessage("success", "Default cleared. Contribution recorded.");
        if (typeof data.data?.walletBalance === "number") setWalletBalance(data.data.walletBalance);
        fetchDefaults();
      } else {
        showMessage("error", data.error || "Failed to clear default");
      }
    } catch {
      showMessage("error", "Failed to clear default");
    }
    setClearingId(null);
  };

  const outstandingTotal = defaults.filter((d) => d.status === "outstanding").reduce((s, d) => s + d.clearanceAmount, 0);
  const outstandingCount = defaults.filter((d) => d.status === "outstanding").length;

  return (
    <div className="mx-auto max-w-[900px] p-[clamp(1rem,3vw,2rem)]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-blue-500" />
              <span>Member Portal</span>
            </span>
          </div>
          <h3 className="font-display font-bold text-xl sm:text-2xl text-slate-900 dark:text-white mt-1">My <span className="bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 bg-clip-text text-transparent">Defaults</span></h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">Missed weekly contributions. Clear them to keep your circle in good standing.</p>
        </div>
        <span className="text-[12px] text-slate-500 dark:text-slate-400 shrink-0">Wallet: <span className="font-mono font-semibold text-blue-600">{formatNaira(walletBalance)}</span></span>
      </div>

      {message && (
        <FadeIn>
          <div className="mb-6 rounded-2xl px-4 py-3 text-[13px] font-medium" style={{ backgroundColor: message.type === "success" ? "#ECFDF5" : "#FEF2F2", color: message.type === "success" ? "#059669" : "#DC2626", border: `1px solid ${message.type === "success" ? "#A7F3D0" : "#FECACA"}` }}>
            {message.text}
          </div>
        </FadeIn>
      )}

      <StaggerChildren staggerDelay={100} className="mb-8 grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
        <div className="p-4 rounded-2xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/50 space-y-1">
          <div className="text-[10px] font-bold uppercase text-rose-700 dark:text-rose-400 tracking-wider flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" /><span>Outstanding Defaults</span>
          </div>
          <div className="font-display font-bold text-2xl text-rose-600 dark:text-rose-400">{outstandingCount}</div>
        </div>
        <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/50 space-y-1">
          <div className="text-[10px] font-bold uppercase text-blue-700 dark:text-blue-400 tracking-wider flex items-center gap-1">
            <DollarSign className="w-3.5 h-3.5" /><span>Clearance Owed</span>
          </div>
          <div className="font-display font-bold text-2xl text-slate-900 dark:text-white">{formatNaira(outstandingTotal)}</div>
        </div>
      </StaggerChildren>

      <FadeInUp delay={200}>
        <Card padding="1.5rem" className="rounded-3xl">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 w-fit">
              <AlertTriangle className="w-3.5 h-3.5 text-blue-500" />
              <span>Circle Defaults</span>
            </span>
            <div className="flex gap-1 rounded-lg bg-slate-100 dark:bg-slate-800 p-1">
              {(["outstanding", "cleared", "all"] as const).map((f) => (
                <button key={f} onClick={() => { setFilter(f); setPage(1); }}
                  className="cursor-pointer rounded-md px-3 py-1.5 text-[11px] font-semibold capitalize"
                  style={{ backgroundColor: filter === f ? "#ffffff" : "transparent", color: filter === f ? "#2563EB" : "#717171", boxShadow: filter === f ? "0 1px 3px rgba(0,0,0,0.08)" : "none" }}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center text-[13px] text-slate-400 dark:text-slate-500">Loading defaults...</div>
          ) : defaults.length === 0 ? (
            <div className="p-8 text-center text-[13px] text-slate-400 dark:text-slate-500">
              {filter === "outstanding" ? "No outstanding defaults. You're all caught up!" : "No defaults found."}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {defaults.map((d) => {
                const st = statusStyles[d.status] || statusStyles.outstanding;
                return (
                  <div key={d.id} className="rounded-2xl p-5" style={{ border: `1px solid ${st.border}`, backgroundColor: st.bg + "30" }}>
                    <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <span className="block text-[13px] font-semibold text-slate-900 dark:text-white">{d.circleAccount.circle.name}</span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">Week {d.weekNumber} missed &middot; {new Date(d.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                      </div>
                      <span className="rounded-md border px-2 py-0.5 text-[9px] font-bold capitalize" style={{ backgroundColor: st.bg, color: st.color, borderColor: st.border }}>{d.status}</span>
                    </div>

                    <div className="mb-3 grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-3">
                      <div>
                        <span className="block text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400 dark:text-slate-500">Amount Due</span>
                        <span className="mt-0.5 block font-mono text-sm font-bold text-slate-900 dark:text-white">{formatNaira(d.amountDue)}</span>
                      </div>
                      <div>
                        <span className="block text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400 dark:text-slate-500">Clearance ({formatClearanceLabel(d.circleAccount.circle.defaultPenaltyType, d.circleAccount.circle.defaultPenaltyValue)})</span>
                        <span className="mt-0.5 block font-mono text-base font-bold text-red-600">{formatNaira(d.clearanceAmount)}</span>
                      </div>
                      {d.clearedAt && (
                        <div>
                          <span className="block text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400 dark:text-slate-500">Cleared On</span>
                          <span className="mt-0.5 block font-mono text-xs font-medium text-slate-900 dark:text-white">{new Date(d.clearedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                        </div>
                      )}
                    </div>

                    {d.status === "outstanding" && (
                      <div className="flex items-center gap-3">
                        <button className="btn-primary py-2 px-4 text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-md" disabled={clearingId === d.id || walletBalance < d.clearanceAmount} onClick={() => handleClear(d.id)}>
                          {clearingId === d.id ? "Clearing..." : `Clear ${formatNaira(d.clearanceAmount)}`}
                        </button>
                        {walletBalance < d.clearanceAmount && (
                          <span className="text-[11px] font-medium text-red-600">Insufficient wallet balance</span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          <Pagination page={page} totalPages={totalPages} total={total} limit={LIMIT} onPageChange={setPage} loading={loading} />
        </Card>
      </FadeInUp>

      <FadeInUp delay={300}>
        <Card padding="1.5rem" className="mt-6 rounded-3xl">
          <div className="mb-4">
            <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 w-fit">
              <Wallet className="w-3.5 h-3.5 text-blue-500" />
              <span>How It Works</span>
            </span>
            <h2 className="mt-2 text-lg font-medium text-slate-900 dark:text-white">Weekly Defaults</h2>
          </div>
          <p className="text-[12px] leading-relaxed text-slate-500 dark:text-slate-400">
            When your wallet has insufficient funds on a weekly contribution date, that week is recorded as a default.
            To resolve it and keep your account eligible for payout, you must clear it by paying the clearance amount,
            which is the missed weekly amount plus a penalty configured by the circle admin. The base contribution is
            credited to your circle principal.
          </p>
        </Card>
      </FadeInUp>
    </div>
  );
}
