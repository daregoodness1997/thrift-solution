"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { Card, FadeInUp, StaggerChildren, StatCard } from "@thrift/ui";
import { formatNaira } from "@thrift/utils";
import { useAuth } from "@/lib/auth-context";
import { Shield } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface AdminStats {
  users: { total: number; newThisMonth: number };
  pending: { kyc: number; loans: number; payoutRequests: number };
  circles: { activeAccounts: number; totalPrincipal: number; totalInterest: number; assetsUnderManagement: number };
  donations: { completedCount: number; completedAmount: number };
  wallet: { totalCredited: number; totalDebited: number };
}

export default function AdminDashboardPage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.role === "admin" || user?.role === "superadmin";

  useEffect(() => {
    if (!authLoading && user && !isAdmin) router.replace("/");
  }, [authLoading, user, isAdmin, router]);

  const fetchStats = useCallback(async () => {
    if (!token || !isAdmin) { setLoading(false); return; }
    try {
      const res = await fetch(`${API_URL}/api/admin/stats`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setStats(data.data);
    } catch {}
    setLoading(false);
  }, [token, isAdmin]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  if (authLoading || loading) {
    return <div className="mx-auto max-w-[1280px] p-[clamp(1rem,3vw,2rem)]"><div className="p-16 text-center text-[13px] text-slate-500 dark:text-slate-400">Loading admin overview...</div></div>;
  }

  if (!isAdmin) return null;

  const totalPending = stats ? stats.pending.kyc + stats.pending.loans + stats.pending.payoutRequests : 0;

  return (
    <div className="mx-auto max-w-[1280px] p-[clamp(1rem,3vw,2rem)]">
      <div className="mb-8 pt-2 pb-6 border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border border-violet-200/80 dark:border-violet-800/80 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-violet-500" />
                <span>Admin</span>
              </span>
            </div>
            <h3 className="font-display font-bold text-xl sm:text-2xl text-slate-900 dark:text-white mt-1">Portal <span className="bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 bg-clip-text font-display font-bold text-transparent">Overview</span></h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Platform-wide metrics and pending actions.</p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin/users" className="btn-secondary">Users</Link>
            <Link href="/admin/audit-logs" className="btn-secondary">Audit Log</Link>
          </div>
        </div>
      </div>

      {stats && (
        <>
          <StaggerChildren staggerDelay={80} className="mb-6 grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4">
            <StatCard label="Total Users" value={String(stats.users.total)} />
            <StatCard label="New This Month" value={`+${stats.users.newThisMonth}`} />
            <StatCard label="Assets Under Mgmt" value={formatNaira(stats.circles.assetsUnderManagement)} />
            <StatCard label="Active Circle Accounts" value={String(stats.circles.activeAccounts)} />
          </StaggerChildren>

          <FadeInUp delay={200}>
            <Card padding="1.5rem" className="mb-6 rounded-3xl">
              <span className="mb-4 block text-[9px] font-bold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">
                Pending Actions ({totalPending})
              </span>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-4">
                <PendingItem label="KYC Reviews" count={stats.pending.kyc} href="/kyc/admin" />
                <PendingItem label="Loan Requests" count={stats.pending.loans} href="/admin/loans" />
                <PendingItem label="Payout Requests" count={stats.pending.payoutRequests} href="/clearance-management" />
              </div>
            </Card>
          </FadeInUp>

          <StaggerChildren staggerDelay={80} className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4">
            <StatCard label="Circle Principal" value={formatNaira(stats.circles.totalPrincipal)} />
            <StatCard label="Interest Accrued" value={formatNaira(stats.circles.totalInterest)} />
            <StatCard label="Donations Raised" value={formatNaira(stats.donations.completedAmount)} />
            <StatCard label="Wallet Inflow" value={formatNaira(stats.wallet.totalCredited)} />
          </StaggerChildren>
        </>
      )}
    </div>
  );
}

function PendingItem({ label, count, href }: { label: string; count: number; href: string }) {
  return (
    <Link href={href} className={`block rounded-3xl p-4 no-underline transition-all duration-200 ${count > 0 ? "border border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/30" : "border border-slate-200/80 bg-slate-50 dark:border-slate-800/80 dark:bg-slate-800/60"}`}>
      <span className={`block font-mono text-[1.75rem] font-bold ${count > 0 ? "text-amber-600 dark:text-amber-400" : "text-slate-900 dark:text-white"}`}>{count}</span>
      <span className="text-[12px] font-medium text-slate-500 dark:text-slate-400">{label}</span>
    </Link>
  );
}

