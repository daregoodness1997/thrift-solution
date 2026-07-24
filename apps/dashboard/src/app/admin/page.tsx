"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";

import { Card, FadeInUp, StaggerChildren, StatCard, Button } from "@thrift/ui";
import { formatNaira } from "@thrift/utils";
import { useAuth } from "@/lib/auth-context";
import { Shield, Play, Loader2, CheckCircle2, XCircle, Clock, Layers, Calendar, Wallet, Users, Percent } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface AdminStats {
  users: { total: number; newThisMonth: number };
  pending: { kyc: number; loans: number; payoutRequests: number };
  circles: { activeAccounts: number; totalPrincipal: number; totalInterest: number; assetsUnderManagement: number };
  donations: { completedCount: number; completedAmount: number };
  wallet: { totalCredited: number; totalDebited: number };
}

interface CronJobInfo {
  id: string;
  label: string;
  running: boolean;
}

interface JobRunResult {
  jobId: string;
  label: string;
  elapsedMs: number;
  result: Record<string, unknown>;
}

interface Circle {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  cycleType: string;
  amount: number;
  weeklyAmount?: number | null;
  totalWeeks?: number | null;
  durationMonths: number;
  interestRateAnnual: number;
  maxAccountsPerUser: number;
  payoutMode?: string;
  status: string;
  _count?: { accounts: number };
}

const CARD_THEMES = [
  { gradient: "from-rose-500 to-pink-500", bg: "bg-rose-50", border: "border-rose-300 dark:border-rose-800", text: "text-rose-600", hoverShadow: "hover:shadow-rose-200/60 dark:hover:shadow-rose-900/30", badgeBg: "bg-rose-100 dark:bg-rose-950/60", badgeText: "text-rose-700 dark:text-rose-300", statBg: "bg-rose-50/80 dark:bg-rose-950/20", statBorder: "border-l-rose-400" },
  { gradient: "from-violet-500 to-purple-500", bg: "bg-violet-50", border: "border-violet-300 dark:border-violet-800", text: "text-violet-600", hoverShadow: "hover:shadow-violet-200/60 dark:hover:shadow-violet-900/30", badgeBg: "bg-violet-100 dark:bg-violet-950/60", badgeText: "text-violet-700 dark:text-violet-300", statBg: "bg-violet-50/80 dark:bg-violet-950/20", statBorder: "border-l-violet-400" },
  { gradient: "from-emerald-500 to-teal-500", bg: "bg-emerald-50", border: "border-emerald-300 dark:border-emerald-800", text: "text-emerald-600", hoverShadow: "hover:shadow-emerald-200/60 dark:hover:shadow-emerald-900/30", badgeBg: "bg-emerald-100 dark:bg-emerald-950/60", badgeText: "text-emerald-700 dark:text-emerald-300", statBg: "bg-emerald-50/80 dark:bg-emerald-950/20", statBorder: "border-l-emerald-400" },
  { gradient: "from-amber-500 to-orange-500", bg: "bg-amber-50", border: "border-amber-300 dark:border-amber-800", text: "text-amber-600", hoverShadow: "hover:shadow-amber-200/60 dark:hover:shadow-amber-900/30", badgeBg: "bg-amber-100 dark:bg-amber-950/60", badgeText: "text-amber-700 dark:text-amber-300", statBg: "bg-amber-50/80 dark:bg-amber-950/20", statBorder: "border-l-amber-400" },
];

function formatDuration(months: number) {
  if (months < 12) return `${months}mo`;
  const y = Math.floor(months / 12);
  const m = months % 12;
  return m > 0 ? `${y}y ${m}mo` : `${y}y`;
}

export default function AdminDashboardPage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [circles, setCircles] = useState<Circle[]>([]);
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

  useEffect(() => {
    if (!token || !isAdmin) return;
    fetch(`${API_URL}/api/circles?limit=50`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => { if (d.success) setCircles(d.data.items || []); })
      .catch(() => {});
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

          <FadeInUp delay={280}>
            <CronJobPanel token={token!} />
          </FadeInUp>

          <StaggerChildren staggerDelay={80} className="mt-6 grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4">
            <StatCard label="Circle Principal" value={formatNaira(stats.circles.totalPrincipal)} />
            <StatCard label="Interest Accrued" value={formatNaira(stats.circles.totalInterest)} />
            <StatCard label="Donations Raised" value={formatNaira(stats.donations.completedAmount)} />
            <StatCard label="Wallet Inflow" value={formatNaira(stats.wallet.totalCredited)} />
          </StaggerChildren>

          {circles.length > 0 && (
            <FadeInUp delay={350}>
              <div className="mt-8">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-violet-100 dark:bg-violet-950/80 text-violet-700 dark:text-violet-300 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-violet-500" />
                      <span>Circles</span>
                    </span>
                  </div>
                  <Link href="/circle-management" className="text-[12px] font-semibold text-violet-600 dark:text-violet-400 hover:underline">View All →</Link>
                </div>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-6">
                  {circles.map((circle, idx) => {
                    const theme = CARD_THEMES[idx % CARD_THEMES.length];
                    return (
                      <div key={circle.id} onClick={() => router.push(`/admin/circles/${circle.id}`)} className={`cursor-pointer rounded-2xl border-l-4 ${theme.border} border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-800/80 overflow-hidden transition-all duration-300 hover:shadow-xl ${theme.hoverShadow} hover:-translate-y-1`}>
                        <div className="relative h-36 w-full overflow-hidden">
                          {circle.imageUrl ? (
                            <>
                              <img src={circle.imageUrl} alt={circle.name} className="h-full w-full object-cover" />
                              <div className={`absolute inset-0 bg-gradient-to-t ${theme.gradient} opacity-40`} />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                            </>
                          ) : (
                            <div className={`h-full w-full bg-gradient-to-br ${theme.gradient} relative`}>
                              <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 200 200">
                                <circle cx="100" cy="100" r="80" fill="none" stroke="white" strokeWidth="2" />
                                <circle cx="100" cy="100" r="55" fill="none" stroke="white" strokeWidth="1.5" />
                                <circle cx="100" cy="100" r="30" fill="none" stroke="white" strokeWidth="1" />
                                <circle cx="100" cy="100" r="10" fill="white" opacity="0.3" />
                              </svg>
                            </div>
                          )}
                          <div className="absolute top-3 right-3 px-3 py-1.5 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm shadow-lg">
                            <span className={`text-[13px] font-mono font-bold ${theme.text}`}>{circle.interestRateAnnual}%</span>
                            <span className="text-[9px] text-slate-500 block leading-none">p.a.</span>
                          </div>
                          <div className="absolute top-3 left-3">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider ${theme.badgeBg} ${theme.badgeText} backdrop-blur-sm`}>
                              {circle.cycleType === "weekly_contribution" ? <Clock className="w-3 h-3" /> : <Layers className="w-3 h-3" />}
                              {circle.cycleType === "weekly_contribution" ? "Weekly" : "Deposit"}
                            </span>
                          </div>
                          <div className="absolute bottom-3 left-4 right-4">
                            <h3 className="text-[16px] font-bold text-white drop-shadow-md">{circle.name}</h3>
                            {circle.description && <p className="text-[11px] text-white/80 drop-shadow line-clamp-1">{circle.description}</p>}
                          </div>
                        </div>
                        <div className="p-4">
                          <div className="mb-3 grid grid-cols-2 gap-2">
                            <div className={`flex items-center gap-2 rounded-xl border-l-2 ${theme.statBorder} ${theme.statBg} px-3 py-2`}>
                              <div className={`w-7 h-7 rounded-lg ${theme.badgeBg} flex items-center justify-center`}>
                                {circle.cycleType === "weekly_contribution" ? (
                                  <Clock className={`w-3.5 h-3.5 ${theme.text}`} />
                                ) : (
                                  <Wallet className={`w-3.5 h-3.5 ${theme.text}`} />
                                )}
                              </div>
                              <div>
                                <span className="block text-[9px] text-slate-400 uppercase tracking-wider font-medium leading-none mb-0.5">
                                  {circle.cycleType === "weekly_contribution" ? "Weekly" : "Amount"}
                                </span>
                                <span className="font-mono text-[12px] font-bold text-slate-900 dark:text-white leading-none">
                                  {circle.cycleType === "weekly_contribution" ? formatNaira(circle.weeklyAmount || 0) : formatNaira(circle.amount)}
                                </span>
                              </div>
                            </div>
                            <div className={`flex items-center gap-2 rounded-xl border-l-2 ${theme.statBorder} ${theme.statBg} px-3 py-2`}>
                              <div className={`w-7 h-7 rounded-lg ${theme.badgeBg} flex items-center justify-center`}>
                                <Calendar className={`w-3.5 h-3.5 ${theme.text}`} />
                              </div>
                              <div>
                                <span className="block text-[9px] text-slate-400 uppercase tracking-wider font-medium leading-none mb-0.5">Duration</span>
                                <span className="text-[12px] font-bold text-slate-900 dark:text-white leading-none">{formatDuration(circle.durationMonths)}</span>
                              </div>
                            </div>
                            {circle.cycleType === "weekly_contribution" && circle.totalWeeks && (
                              <div className={`flex items-center gap-2 rounded-xl border-l-2 ${theme.statBorder} ${theme.statBg} px-3 py-2`}>
                                <div className={`w-7 h-7 rounded-lg ${theme.badgeBg} flex items-center justify-center`}>
                                  <Layers className={`w-3.5 h-3.5 ${theme.text}`} />
                                </div>
                                <div>
                                  <span className="block text-[9px] text-slate-400 uppercase tracking-wider font-medium leading-none mb-0.5">Total Weeks</span>
                                  <span className="text-[12px] font-bold text-slate-900 dark:text-white leading-none">{circle.totalWeeks}</span>
                                </div>
                              </div>
                            )}
                            <div className={`flex items-center gap-2 rounded-xl border-l-2 ${theme.statBorder} ${theme.statBg} px-3 py-2`}>
                              <div className={`w-7 h-7 rounded-lg ${theme.badgeBg} flex items-center justify-center`}>
                                <Users className={`w-3.5 h-3.5 ${theme.text}`} />
                              </div>
                              <div>
                                <span className="block text-[9px] text-slate-400 uppercase tracking-wider font-medium leading-none mb-0.5">Subscribers</span>
                                <span className="text-[12px] font-bold text-slate-900 dark:text-white leading-none">{circle._count?.accounts || 0}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold ${circle.status === "active" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"}`}>
                              {circle.status === "active" ? "Active" : "Inactive"}
                            </span>
                            <span className={`text-[11px] font-mono font-bold ${theme.text}`}>
                              {circle.cycleType === "weekly_contribution" ? `${formatNaira(circle.weeklyAmount || 0)} × ${circle.totalWeeks || 0}w` : formatNaira(circle.amount)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </FadeInUp>
          )}
        </>
      )}
    </div>
  );
}

function CronJobPanel({ token }: { token: string }) {
  const [jobs, setJobs] = useState<CronJobInfo[]>([]);
  const [runningJob, setRunningJob] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<JobRunResult | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/admin/cron-jobs`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => { if (d.success) setJobs(d.data); })
      .catch(() => {});
  }, [token]);

  const triggerJob = async (jobId: string) => {
    setRunningJob(jobId);
    setLastResult(null);
    setLastError(null);
    try {
      const res = await fetch(`${API_URL}/api/admin/cron-jobs/${jobId}/trigger`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setLastResult(data.data);
        toast.success(`${data.data.label} completed in ${(data.data.elapsedMs / 1000).toFixed(1)}s`);
      } else {
        setLastError(data.error);
        toast.error(data.error);
      }
    } catch {
      setLastError("Network error");
      toast.error("Failed to trigger job");
    }
    setRunningJob(null);
  };

  const cronDescriptions: Record<string, string> = {
    circleInterest: "Sunday 00:00 — calculates weekly interest for all active circle accounts",
    circleContribution: "Sunday 01:00 — debits weekly contributions from circle members' wallets",
    virtualAccount: "Daily 02:00 — auto-generates virtual accounts for KYC-verified users",
    paymentReversal: "Daily 03:00 — reconciles recent funding transactions and reverses if provider reports reversed",
    virtualAccountDeposit: "Checks all active virtual accounts for incoming deposits and credits wallets",
  };

  return (
    <Card padding="1.5rem" className="mb-6 rounded-3xl">
      <span className="mb-4 block text-[9px] font-bold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">
        Cron Jobs — Manual Trigger
      </span>
      <div className="space-y-3">
        {jobs.map((job) => (
          <div key={job.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/40 p-3">
            <div className="min-w-0">
              <span className="block text-[13px] font-semibold text-slate-900 dark:text-white">{job.label}</span>
              <span className="block text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{cronDescriptions[job.id] || ""}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={runningJob !== null}
              onClick={() => triggerJob(job.id)}
              style={{ minWidth: 100, justifyContent: "center" }}
            >
              {runningJob === job.id ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Running...</>
              ) : (
                <><Play className="w-3.5 h-3.5" /> Run Now</>
              )}
            </Button>
          </div>
        ))}
      </div>

      {lastResult && (
        <div className="mt-4 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-950/30 p-4">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-[13px] font-semibold text-emerald-800 dark:text-emerald-300">
              {lastResult.label}
            </span>
            <span className="ml-auto flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400">
              <Clock className="w-3 h-3" />
              {(lastResult.elapsedMs / 1000).toFixed(1)}s
            </span>
          </div>
          <JobResultSummary jobId={lastResult.jobId} result={lastResult.result} />
        </div>
      )}

      {lastError && (
        <div className="mt-4 rounded-2xl border border-red-200 dark:border-red-800/60 bg-red-50 dark:bg-red-950/30 p-3">
          <div className="flex items-center gap-2">
            <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
            <span className="text-[13px] font-semibold text-red-800 dark:text-red-300">{lastError}</span>
          </div>
        </div>
      )}
    </Card>
  );
}

function ResultStat({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className={`rounded-xl px-3 py-2 ${accent ? "bg-emerald-100/70 dark:bg-emerald-900/40" : "bg-white/60 dark:bg-slate-800/50"}`}>
      <span className={`block font-mono text-lg font-bold leading-tight ${accent ? "text-emerald-700 dark:text-emerald-300" : "text-slate-900 dark:text-white"}`}>{value}</span>
      <span className="block text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">{label}</span>
    </div>
  );
}

function JobResultSummary({ jobId, result }: { jobId: string; result: Record<string, unknown> }) {
  const r = result as Record<string, number>;

  const hasErrors = typeof r.errors === "number" && r.errors > 0;

  if (jobId === "circleInterest") {
    return (
      <div className="grid grid-cols-3 gap-2">
        <ResultStat label="Total Accounts" value={r.total ?? "—"} />
        <ResultStat label="Processed" value={r.processed ?? "—"} accent />
        <ResultStat label="Errors" value={r.errors ?? 0} />
      </div>
    );
  }

  if (jobId === "circleContribution") {
    return (
      <div className="grid grid-cols-4 gap-2">
        <ResultStat label="Total Members" value={r.total ?? "—"} />
        <ResultStat label="Charged" value={r.charged ?? "—"} accent />
        <ResultStat label="Defaulted" value={r.defaulted ?? 0} />
        <ResultStat label="Errors" value={r.errors ?? 0} />
      </div>
    );
  }

  if (jobId === "virtualAccount") {
    return (
      <div className="grid grid-cols-4 gap-2">
        <ResultStat label="Eligible Users" value={r.total ?? "—"} />
        <ResultStat label="Created" value={r.created ?? "—"} accent />
        <ResultStat label="Skipped" value={r.skipped ?? 0} />
        <ResultStat label="Errors" value={r.errors ?? 0} />
      </div>
    );
  }

  if (jobId === "paymentReversal") {
    return (
      <div className="grid grid-cols-3 gap-2">
        <ResultStat label="Transactions Checked" value={r.checked ?? "—"} />
        <ResultStat label="Reversed" value={r.reversed ?? "—"} accent={typeof r.reversed === "number" && r.reversed > 0} />
        <ResultStat label="Errors" value={r.errors ?? 0} />
      </div>
    );
  }

  if (jobId === "virtualAccountDeposit") {
    return (
      <div className="space-y-2">
        <div className="grid grid-cols-3 gap-2">
          <ResultStat label="Accounts Scanned" value={r.accountsProcessed ?? "—"} />
          <ResultStat label="Deposits Found" value={r.totalTransfersFound ?? "—"} accent />
          <ResultStat label="Wallets Credited" value={r.totalTransfersCredited ?? "—"} accent />
        </div>
        {Array.isArray(result.results) && result.results.length > 0 && (
          <div className="mt-2 max-h-32 overflow-y-auto rounded-xl bg-white/60 dark:bg-slate-800/50 p-2">
            {result.results.map((item: { accountNumber: string; provider: string; found: number; credited: number }, i: number) => (
              <div key={i} className="flex items-center justify-between py-1 text-[11px] border-b border-slate-200/50 dark:border-slate-700/50 last:border-0">
                <span className="font-mono text-slate-700 dark:text-slate-300">{item.accountNumber}</span>
                <span className="text-slate-500 dark:text-slate-400">{item.provider}</span>
                <span className={item.credited > 0 ? "font-semibold text-emerald-700 dark:text-emerald-300" : "text-slate-400 dark:text-slate-500"}>
                  {item.credited}/{item.found} credited
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {Object.entries(r).map(([key, val]) => (
        <ResultStat key={key} label={key.replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase())} value={val ?? "—"} />
      ))}
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

