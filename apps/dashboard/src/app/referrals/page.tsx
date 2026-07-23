"use client";

import { useState, useEffect, useCallback } from "react";
import { config, BrandConfig } from "@thrift/config";
import { Card, StatCard, ColorBar, FadeInUp, FadeIn, StaggerChildren } from "@thrift/ui";
import { formatNaira } from "@thrift/utils";
import { useAuth } from "@/lib/auth-context";
import { Users, Gift, TrendingUp, Award, Copy, CheckCircle2, Share2 } from "lucide-react";
import { Skeleton, SkeletonCard, SkeletonTable } from "@/components/Skeleton";
import Pagination from "@/components/Pagination";
import { SimpleTable, SimpleColumn } from "@/components/SimpleTable";

const fallback = config;

interface ReferralStats {
  totalReferrals: number;
  pendingReferrals: number;
  completedReferrals: number;
  totalEarnings: number;
  currentTier: string;
  nextTier: string | null;
  referralsToNextTier: number;
  tierBreakdown: { tier: string; count: number; earnings: number }[];
}

interface Referral {
  id: string;
  referredUser: { name: string; email: string; createdAt: string };
  status: string;
  createdAt: string;
}

interface ReferralEarning {
  id: string;
  tier: string;
  amount: number;
  status: string;
  createdAt: string;
}

const TIER_COLORS: Record<string, string> = {
  Bronze: "#CD7F32",
  Silver: "#8A8D91",
  Gold: "#D4A843",
  Platinum: "#5B4A8A",
};

const ALL_TIERS = [
  { name: "Bronze", min: 1, max: 5, amount: 200 },
  { name: "Silver", min: 6, max: 10, amount: 500 },
  { name: "Gold", min: 11, max: 25, amount: 1000 },
  { name: "Platinum", min: 26, max: Infinity, amount: 2000 },
];

export default function ReferralsPage() {
  const { token } = useAuth();
  const [cfg, setCfg] = useState<BrandConfig>(fallback);
  const [referralCode, setReferralCode] = useState("");
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [earnings, setEarnings] = useState<ReferralEarning[]>([]);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [referralsPage, setReferralsPage] = useState(1);
  const [earningsPage, setEarningsPage] = useState(1);
  const [referralsTotal, setReferralsTotal] = useState(0);
  const [referralsTotalPages, setReferralsTotalPages] = useState(0);
  const [earningsTotal, setEarningsTotal] = useState(0);
  const [earningsTotalPages, setEarningsTotalPages] = useState(0);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
  const LIMIT = 20;

  useEffect(() => {
    fetch(`${API_URL}/api/config`)
      .then((r) => r.json())
      .then((data) => { if (data && data.name) setCfg((prev) => ({ ...prev, ...data })); })
      .catch(() => {});
  }, [API_URL]);

  const fetchData = useCallback(async () => {
    try {
      const [codeRes, statsRes] = await Promise.all([
        fetch(`${API_URL}/api/referrals/code`, { headers: authHeaders }),
        fetch(`${API_URL}/api/referrals/stats`, { headers: authHeaders }),
      ]);

      const [codeData, statsData] = await Promise.all([
        codeRes.json(),
        statsRes.json(),
      ]);

      if (codeData?.data?.code) setReferralCode(codeData.data.code);
      if (statsData?.data) setStats(statsData.data);
    } catch {
      setStats({
        totalReferrals: 0, pendingReferrals: 0, completedReferrals: 0,
        totalEarnings: 0, currentTier: "Bronze", nextTier: "Silver",
        referralsToNextTier: 1, tierBreakdown: [],
      });
    } finally {
      setLoading(false);
    }
  }, [API_URL, token]);

  const fetchReferrals = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/referrals?page=${referralsPage}&limit=${LIMIT}`, { headers: authHeaders });
      const data = await res.json();
      if (data?.data) {
        setReferrals(data.data.items);
        setReferralsTotal(data.data.total);
        setReferralsTotalPages(data.data.totalPages);
      }
    } catch {}
  }, [API_URL, token, referralsPage]);

  const fetchEarnings = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/referrals/earnings?page=${earningsPage}&limit=${LIMIT}`, { headers: authHeaders });
      const data = await res.json();
      if (data?.data) {
        setEarnings(data.data.items);
        setEarningsTotal(data.data.total);
        setEarningsTotalPages(data.data.totalPages);
      }
    } catch {}
  }, [API_URL, token, earningsPage]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { fetchReferrals(); }, [fetchReferrals]);
  useEffect(() => { fetchEarnings(); }, [fetchEarnings]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const shareUrl = `https://app.globalfreedomworldwide.com/register?ref=${referralCode}`;
  const shareText = `Join GFW using my referral code ${referralCode} and start saving together! ${shareUrl}`;

  const referralColumns: SimpleColumn<Referral>[] = [
    {
      key: "name",
      header: "Name",
      render: (r) => <span className="font-medium text-slate-900 dark:text-white">{r.referredUser.name}</span>,
    },
    {
      key: "date",
      header: "Date",
      mono: true,
      render: (r) => (
        <span className="text-slate-500 dark:text-slate-400">
          {new Date(r.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      align: "right",
      render: (r) => (
        <span className="rounded-md px-2 py-0.5 text-[9px] font-bold capitalize" style={{ color: r.status === "completed" ? "#059669" : "#D97706", backgroundColor: r.status === "completed" ? "#ECFDF5" : "#FFFBEB" }}>
          {r.status}
        </span>
      ),
    },
  ];

  const earningColumns: SimpleColumn<ReferralEarning>[] = [
    {
      key: "tier",
      header: "Tier",
      render: (e) => (
        <span className="rounded-md px-2 py-0.5 font-mono text-[9px] font-bold uppercase" style={{ backgroundColor: `${TIER_COLORS[e.tier] || "#2563eb"}12`, color: TIER_COLORS[e.tier] || "#2563eb", border: `1px solid ${TIER_COLORS[e.tier] || "#2563eb"}20` }}>
          {e.tier}
        </span>
      ),
    },
    {
      key: "date",
      header: "Date",
      mono: true,
      render: (e) => (
        <span className="text-slate-500 dark:text-slate-400">
          {new Date(e.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
        </span>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      mono: true,
      render: (e) => <span className="font-semibold text-emerald-600">{formatNaira(e.amount)}</span>,
    },
  ];

  const tierProgress = (() => {
    if (!stats) return 0;
    const current = ALL_TIERS.find((t) => t.name === stats.currentTier);
    if (!current) return 0;
    const idx = ALL_TIERS.indexOf(current);
    if (idx >= ALL_TIERS.length - 1) return 100;
    const next = ALL_TIERS[idx + 1];
    const range = next.min - current.min;
    const progress = stats.completedReferrals - current.min;
    return Math.min(100, Math.round((progress / range) * 100));
  })();

  if (loading) {
    return (
      <div className="mx-auto max-w-[1280px] p-[clamp(1rem,3vw,2rem)]">
        <ColorBar />
        <div className="mb-8">
          <Skeleton width="100px" height="12px" className="mb-3" />
          <Skeleton width="320px" height="28px" className="mb-2" />
          <Skeleton width="250px" height="12px" />
        </div>
        <Skeleton width="100%" height="120px" className="mb-8" />
        <div className="mb-8 grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <Skeleton width="100%" height="140px" className="mb-8" />
        <div className="mb-8 grid grid-cols-[repeat(auto-fit,minmax(360px,1fr))] gap-6">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1280px] p-[clamp(1rem,3vw,2rem)]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1">
              <Gift className="w-3.5 h-3.5 text-blue-500" />
              <span>Referral Program</span>
            </span>
          </div>
          <h3 className="font-display font-bold text-xl sm:text-2xl text-slate-900 dark:text-white mt-1">Invite Friends, <span className="bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 bg-clip-text text-transparent">Earn Rewards</span></h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">Share your code and earn tiered rewards for every friend who joins.</p>
        </div>
      </div>

      {/* Referral Code Card */}
      <FadeInUp delay={200}>
        <Card padding="1.5rem" className="mb-8 rounded-3xl bg-gradient-to-br from-blue-600/[0.05] to-blue-600/[0.02] border border-blue-600/10">
          <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 w-fit">
            <Copy className="w-3.5 h-3.5 text-blue-500" />
            <span>Your Code</span>
          </span>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-[clamp(1.5rem,4vw,2.25rem)] font-extrabold tracking-[0.05em] text-blue-600 dark:text-blue-400">
                  {referralCode}
                </span>
                <button onClick={handleCopy}
                  className={`btn-secondary py-2 px-4 text-xs ${copied ? "!border-emerald-300 !text-emerald-600 !bg-emerald-50 dark:!bg-emerald-950/40" : ""}`}>
                  {copied ? <><CheckCircle2 className="w-3.5 h-3.5 inline mr-1" /> Copied!</> : <><Copy className="w-3.5 h-3.5 inline mr-1" /> Copy Code</>}
                </button>
              </div>
                <p className="mt-2 text-xs font-light text-slate-500 dark:text-slate-400">Share this code with friends. They enter it when signing up.</p>
            </div>
            <div className="flex gap-2">
              <a href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[#25D366] text-white no-underline transition-transform hover:scale-110">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.498 14.382c-.301-.15-1.767-.967-2.04-1.08-.273-.114-.473-.165-.673.165-.197.325-.767.997-.94 1.2-.175.208-.347.23-.644.08-.297-.15-1.261-.485-2.403-1.546-.888-.828-1.484-1.854-1.66-2.149-.173-.3-.019-.465.13-.615.13-.13.3-.345.45-.523.146-.181.194-.301.297-.5.1-.194.05-.372-.025-.527-.075-.15-.672-1.62-.922-2.206-.24-.584-.487-.51-.672-.51-.172-.015-.371-.015-.571-.015-.2 0-.523.074-.797.375-.273.3-1.045 1.02-1.045 2.475s1.07 2.865 1.219 3.075c.149.21 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.767-.721 2.016-1.426.247-.705.247-1.305.173-1.426-.074-.121-.274-.198-.575-.347z M12.05 21.785h-.001a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982 1.003-3.628-.235-.374A9.86 9.86 0 012.16 12c0-5.44 4.418-9.858 9.85-9.858 5.44 0 9.857 4.418 9.857 9.858 0 2.665-1.05 5.117-2.95 6.959l-.35.35.003.002-5.858 5.636z"/></svg>
              </a>
              <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1DA1F2] text-white no-underline transition-transform hover:scale-110">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M23.643 4.937c-.835.37-1.732.62-2.675.733.962-.576 1.7-1.49 2.048-2.578-.9.534-1.897.922-2.958 1.13-.85-.904-2.06-1.47-3.4-1.47-2.572 0-4.658 2.086-4.658 4.66 0 .364.042.718.12 1.06-3.873-.195-7.304-2.05-9.602-4.868-.4.69-.63 1.49-.63 2.342 0 1.616.823 3.043 2.072 3.878-.764-.025-1.482-.234-2.11-.583v.06c0 2.257 1.605 4.14 3.737 4.568-.392.106-.803.162-1.227.162-.3 0-.593-.028-.877-.082.593 1.85 2.313 3.198 4.352 3.234-1.595 1.25-3.604 1.995-5.786 1.995-.376 0-.747-.022-1.112-.065 2.062 1.323 4.51 2.093 7.14 2.093 8.57 0 13.255-7.098 13.255-13.254 0-.2-.005-.402-.014-.602.91-.658 1.7-1.477 2.323-2.41z"/></svg>
              </a>
              <button onClick={handleCopy}
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-none bg-blue-600 text-white transition-transform hover:scale-110">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
              </button>
            </div>
          </div>
        </Card>
      </FadeInUp>

      {/* Stats Row */}
      <StaggerChildren staggerDelay={100} className="mb-8 grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-6">
        <StatCard label="Total Referrals" value={String(stats?.totalReferrals ?? 0)} change={`${stats?.completedReferrals ?? 0} completed`} positive variant="default" />
        <StatCard label="Total Earnings" value={formatNaira(stats?.totalEarnings ?? 0)} change={`${stats?.currentTier ?? "Bronze"} tier`} positive variant="warm" />
        <StatCard label="Pending" value={String(stats?.pendingReferrals ?? 0)} change="Awaiting registration" positive variant="default" />
        <StatCard label="Next Tier" value={stats?.nextTier ?? "Max"} change={stats?.referralsToNextTier ? `${stats.referralsToNextTier} more referrals` : "Highest tier!"} positive variant="warm" />
      </StaggerChildren>

      {/* Tier Progress */}
      <FadeInUp delay={400}>
        <Card padding="1.5rem" className="mb-8 rounded-3xl">
          <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 w-fit">
            <Award className="w-3.5 h-3.5 text-blue-500" />
            <span>Your Tier</span>
          </span>
          <div className="mt-4 flex flex-wrap items-start gap-8">
            <div className="flex-[1_1_280px]">
              <div className="mb-4 flex items-baseline gap-2">
                <span className="font-display text-[2rem] font-extrabold" style={{ color: TIER_COLORS[stats?.currentTier ?? "Bronze"] || "#2563eb" }}>
                  {stats?.currentTier ?? "Bronze"}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">current tier</span>
              </div>
              <div className="relative mb-2 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div className="h-full rounded-full" style={{ background: `linear-gradient(90deg, ${TIER_COLORS[stats?.currentTier ?? "Bronze"] || "#2563eb"}, ${cfg.colors.accent})`, width: `${tierProgress}%`, transition: "width 1s cubic-bezier(0.16, 1, 0.3, 1)" }} />
              </div>
              <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400">
                {stats?.completedReferrals ?? 0} referrals {stats?.referralsToNextTier ? `— ${stats.referralsToNextTier} more to ${stats.nextTier}` : "— Max tier achieved!"}
              </span>
            </div>
            <div className="flex-[1_1_320px]">
              <div className="grid grid-cols-2 gap-3">
                {ALL_TIERS.map((tier) => {
                  const isActive = stats?.currentTier === tier.name;
                  const isPast = ALL_TIERS.findIndex((t) => t.name === tier.name) < ALL_TIERS.findIndex((t) => t.name === (stats?.currentTier ?? "Bronze"));
                  return (
                    <div key={tier.name} className="rounded-2xl p-3 transition-all dark:border-slate-700" style={{ border: `1px solid ${isActive ? TIER_COLORS[tier.name] : "rgb(226 232 240)"}`, backgroundColor: isActive ? `${TIER_COLORS[tier.name]}10` : "rgb(248 250 252)", opacity: isPast && !isActive ? 0.6 : 1 }}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold" style={{ color: TIER_COLORS[tier.name] }}>{tier.name}</span>
                        {isActive && <span className="rounded-full px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-[0.05em] text-white" style={{ backgroundColor: TIER_COLORS[tier.name] }}>Current</span>}
                      </div>
                        <span className="mt-1 block text-[10px] text-slate-500 dark:text-slate-400">
                        {tier.min === 1 ? "1" : tier.min}–{tier.max === Infinity ? "25+" : tier.max} referrals
                      </span>
                        <span className="mt-1 block font-mono text-xs font-semibold text-slate-900 dark:text-white">
                        {formatNaira(tier.amount)}/referral
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Card>
      </FadeInUp>

      <div className="mb-8 grid grid-cols-[repeat(auto-fit,minmax(360px,1fr))] gap-6">
        {/* Referral History */}
        <FadeInUp delay={500}>
          <Card padding="1.5rem" className="rounded-3xl">
            <div className="mb-4 flex items-center justify-between border-b border-slate-200/80 pb-4 dark:border-slate-800/80">
              <div>
                <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 w-fit">
                  <Users className="w-3.5 h-3.5 text-blue-500" />
                  <span>Referrals</span>
                </span>
                <h2 className="mt-2 font-display text-lg font-medium tracking-tight text-slate-900 dark:text-white">Referral History</h2>
              </div>
              <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400">{referralsTotal} entries</span>
            </div>
            {referrals.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-xs text-slate-400 dark:text-slate-500">No referrals yet. Share your code to get started!</p>
              </div>
            ) : (
              <>
              <SimpleTable columns={referralColumns} data={referrals} minWidth="300px" />
              <Pagination
                page={referralsPage}
                totalPages={referralsTotalPages}
                total={referralsTotal}
                limit={LIMIT}
                onPageChange={setReferralsPage}
              />
              </>
            )}
          </Card>
        </FadeInUp>

        {/* Earnings History */}
        <FadeInUp delay={600}>
          <Card padding="1.5rem" className="rounded-3xl">
            <div className="mb-4 flex items-center justify-between border-b border-slate-200/80 pb-4 dark:border-slate-800/80">
              <div>
                <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 w-fit">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Earnings</span>
                </span>
                <h2 className="mt-2 font-display text-lg font-medium tracking-tight text-slate-900 dark:text-white">Earnings History</h2>
              </div>
              <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400">{earningsTotal} entries</span>
            </div>
            {earnings.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-xs text-slate-400 dark:text-slate-500">No earnings yet. Referrals will generate rewards!</p>
              </div>
            ) : (
              <>
              <SimpleTable columns={earningColumns} data={earnings} minWidth="300px" />
              <Pagination
                page={earningsPage}
                totalPages={earningsTotalPages}
                total={earningsTotal}
                limit={LIMIT}
                onPageChange={setEarningsPage}
              />
              </>
            )}
          </Card>
        </FadeInUp>
      </div>
    </div>
  );
}
