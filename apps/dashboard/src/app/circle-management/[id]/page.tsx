"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { config, BrandConfig } from "@thrift/config";
import { Card, Button, FadeInUp, StaggerChildren } from "@thrift/ui";
import { formatNaira } from "@thrift/utils";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/PageHeader";
import { SkeletonCard } from "@/components/Skeleton";

const fallback = config;

interface CircleAnalytics {
  circle: {
    id: string;
    name: string;
    description?: string;
    cycleType: string;
    amount: number;
    weeklyAmount?: number | null;
    totalWeeks?: number | null;
    durationMonths: number;
    interestRateAnnual: number;
    maxAccountsPerUser: number;
    maxSubscribers?: number | null;
    autoPayout: boolean;
    payoutMode: string;
    blockPayoutOnDefault: boolean;
    status: string;
    _count?: { accounts: number };
  };
  stats: {
    subscribed: number;
    nearMaturity: number;
    matured: number;
    payoutPending: number;
    awaitingClearance: number;
    payoutCompleted: number;
    totalPrincipal: number;
    totalInterest: number;
    totalMaturityValue: number;
  };
}

function formatDuration(months: number) {
  if (months < 12) return `${months}mo`;
  const y = Math.floor(months / 12);
  const m = months % 12;
  return m > 0 ? `${y}y ${m}mo` : `${y}y`;
}

export default function AdminCircleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const circleId = params.id as string;
  const { token } = useAuth();
  const [cfg, setCfg] = useState<BrandConfig>(fallback);
  const [analytics, setAnalytics] = useState<CircleAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "accounts" | "payouts">("overview");

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  useEffect(() => {
    fetch(`${API_URL}/api/config`).then((r) => r.json()).then((d) => { if (d && d.name) setCfg((p) => ({ ...p, ...d })); }).catch(() => {});
  }, [API_URL]);

  const fetchData = useCallback(async () => {
    if (!token || !circleId) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/circles/${circleId}/analytics`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setAnalytics(data.data);
    } catch {}
    setLoading(false);
  }, [token, circleId, API_URL]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <div className="mx-auto max-w-[1280px] p-[clamp(1rem,3vw,2rem)]">
        <div className="grid gap-6">{Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}</div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="mx-auto max-w-[1280px] p-[clamp(1rem,3vw,2rem)]">
        <Card padding="3rem">
          <div className="text-center">
            <h3 className="mb-2 text-[1rem] font-semibold text-brand-dark">Circle not found</h3>
            <Button variant="primary" size="sm" onClick={() => router.push("/circle-management")}>Back to Circle Management</Button>
          </div>
        </Card>
      </div>
    );
  }

  const { circle, stats } = analytics;

  return (
    <div className="mx-auto max-w-[1280px] p-[clamp(1rem,3vw,2rem)]">
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => router.push("/circle-management")}
          className="flex items-center border-0 bg-none p-1 cursor-pointer text-gray-400"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      <PageHeader
        badgeLabel="Admin"
        heading={circle.name}
        accentText="Analytics"
        description="Circle performance metrics and subscriber analytics."
        right={
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => router.push(`/circle-management/${circle.id}/edit`)}>
              Edit Circle
            </Button>
          </div>
        }
      />

      <div className="mb-4 flex gap-1.5">
        {(
          [
            ["overview", "Overview"],
            ["accounts", "Accounts"],
            ["payouts", "Payouts"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className="cursor-pointer rounded-full border-[1.5px] px-5 py-2 text-[12px] font-semibold transition-all duration-150"
            style={{
              backgroundColor: activeTab === key ? cfg.colors.primary : "#ffffff",
              color: activeTab === key ? "#ffffff" : "#717171",
              borderColor: activeTab === key ? cfg.colors.primary : "#EAEAEA",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <>
          <StaggerChildren staggerDelay={80} className="mb-8 grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4">
            <Card padding="1.25rem">
              <span className="block text-[9px] font-bold uppercase tracking-[0.1em] text-gray-500">Subscribed</span>
              <span className="mt-1 block font-mono text-2xl font-bold text-brand-dark">{stats.subscribed}</span>
            </Card>
            <Card padding="1.25rem">
              <span className="block text-[9px] font-bold uppercase tracking-[0.1em] text-gray-500">Near Maturity</span>
              <span className="mt-1 block font-mono text-2xl font-bold text-amber-600">{stats.nearMaturity}</span>
            </Card>
            <Card padding="1.25rem">
              <span className="block text-[9px] font-bold uppercase tracking-[0.1em] text-gray-500">Matured</span>
              <span className="mt-1 block font-mono text-2xl font-bold text-emerald-600">{stats.matured}</span>
            </Card>
            <Card padding="1.25rem">
              <span className="block text-[9px] font-bold uppercase tracking-[0.1em] text-gray-500">Awaiting Clearance</span>
              <span className="mt-1 block font-mono text-2xl font-bold text-orange-600">{stats.awaitingClearance}</span>
            </Card>
            <Card padding="1.25rem">
              <span className="block text-[9px] font-bold uppercase tracking-[0.1em] text-gray-500">Payout (Pending)</span>
              <span className="mt-1 block font-mono text-2xl font-bold text-blue-600">{stats.payoutPending}</span>
            </Card>
            <Card padding="1.25rem">
              <span className="block text-[9px] font-bold uppercase tracking-[0.1em] text-gray-500">Payout (Completed)</span>
              <span className="mt-1 block font-mono text-2xl font-bold text-purple-600">{stats.payoutCompleted}</span>
            </Card>
          </StaggerChildren>

          <FadeInUp delay={300}>
            <Card padding="1.5rem" className="mb-8">
              <span className="mb-4 block text-[9px] font-bold uppercase tracking-[0.1em] text-gray-500">
                Financial Summary
              </span>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-6">
                <div>
                  <span className="mb-1 block text-[11px] text-gray-400">Total Principal</span>
                  <span className="font-mono text-[1.25rem] font-bold" style={{ color: cfg.colors.primary }}>
                    {formatNaira(stats.totalPrincipal)}
                  </span>
                </div>
                <div>
                  <span className="mb-1 block text-[11px] text-gray-400">Total Interest</span>
                  <span className="font-mono text-[1.25rem] font-bold text-emerald-500">
                    {formatNaira(stats.totalInterest)}
                  </span>
                </div>
                <div>
                  <span className="mb-1 block text-[11px] text-gray-400">Total Maturity Value</span>
                  <span className="font-mono text-[1.25rem] font-bold text-brand-dark">
                    {formatNaira(stats.totalMaturityValue)}
                  </span>
                </div>
              </div>
            </Card>
          </FadeInUp>

          <FadeInUp delay={400}>
            <Card padding="1.5rem">
              <span className="mb-4 block text-[9px] font-bold uppercase tracking-[0.1em] text-gray-500">
                Circle Configuration
              </span>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4 text-[12px]">
                <div>
                  <span className="mb-1 block text-gray-400">Cycle Type</span>
                  <span className="font-semibold text-brand-dark">
                    {circle.cycleType === "weekly_contribution" ? "Weekly Contribution" : "Deposit"}
                  </span>
                </div>
                <div>
                  <span className="mb-1 block text-gray-400">Amount</span>
                  <span className="font-mono font-semibold text-brand-dark">
                    {circle.cycleType === "weekly_contribution"
                      ? `${formatNaira(circle.weeklyAmount || 0)}/wk × ${circle.totalWeeks || 0}`
                      : formatNaira(circle.amount)}
                  </span>
                </div>
                <div>
                  <span className="mb-1 block text-gray-400">Duration</span>
                  <span className="font-semibold text-brand-dark">{formatDuration(circle.durationMonths)}</span>
                </div>
                <div>
                  <span className="mb-1 block text-gray-400">Interest Rate</span>
                  <span className="font-mono font-semibold" style={{ color: cfg.colors.primary }}>{circle.interestRateAnnual}% p.a.</span>
                </div>
                <div>
                  <span className="mb-1 block text-gray-400">Payout Mode</span>
                  <span className="font-semibold text-brand-dark">{circle.payoutMode === "auto" ? "Auto" : "Clearance"}</span>
                </div>
                <div>
                  <span className="mb-1 block text-gray-400">Status</span>
                  <span className="rounded-md px-2 py-0.5 font-mono text-[9px] font-bold uppercase"
                    style={{ backgroundColor: circle.status === "active" ? "#ECFDF5" : "#FFFBEB", color: circle.status === "active" ? "#059669" : "#D97706", border: `1px solid ${circle.status === "active" ? "#A7F3D0" : "#FDE68A"}` }}>
                    {circle.status}
                  </span>
                </div>
              </div>
            </Card>
          </FadeInUp>
        </>
      )}

      {activeTab === "accounts" && (
        <FadeInUp>
          <Card padding="1.5rem">
            <h3 className="mb-4 text-[14px] font-semibold text-brand-dark">
              Account Status Breakdown
            </h3>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
              <div className="rounded-xl border border-gray-100 p-4">
                <span className="block text-[11px] text-gray-400">Active Accounts</span>
                <span className="mt-1 block font-mono text-2xl font-bold text-brand-dark">{stats.subscribed}</span>
              </div>
              <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
                <span className="block text-[11px] text-amber-600">Near Maturity (&lt;14 days)</span>
                <span className="mt-1 block font-mono text-2xl font-bold text-amber-600">{stats.nearMaturity}</span>
              </div>
              <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                <span className="block text-[11px] text-emerald-600">Matured</span>
                <span className="mt-1 block font-mono text-2xl font-bold text-emerald-600">{stats.matured}</span>
              </div>
            </div>
            <div className="mt-4 rounded-lg bg-gray-50 p-4 text-[12px] text-gray-500">
              <strong>Total Accounts:</strong> {circle._count?.accounts || 0}
            </div>
          </Card>
        </FadeInUp>
      )}

      {activeTab === "payouts" && (
        <FadeInUp>
          <Card padding="1.5rem">
            <h3 className="mb-4 text-[14px] font-semibold text-brand-dark">
              Payout Status Breakdown
            </h3>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                <span className="block text-[11px] text-blue-600">Pending Approval</span>
                <span className="mt-1 block font-mono text-2xl font-bold text-blue-600">{stats.payoutPending}</span>
              </div>
              <div className="rounded-xl border border-orange-100 bg-orange-50 p-4">
                <span className="block text-[11px] text-orange-600">Awaiting Clearance</span>
                <span className="mt-1 block font-mono text-2xl font-bold text-orange-600">{stats.awaitingClearance}</span>
              </div>
              <div className="rounded-xl border border-purple-100 bg-purple-50 p-4">
                <span className="block text-[11px] text-purple-600">Completed/Disbursed</span>
                <span className="mt-1 block font-mono text-2xl font-bold text-purple-600">{stats.payoutCompleted}</span>
              </div>
            </div>
            <div className="mt-4 rounded-lg bg-gray-50 p-4 text-[12px] text-gray-500">
              <strong>Total Payout Requests:</strong> {stats.payoutPending + stats.awaitingClearance + stats.payoutCompleted}
            </div>
          </Card>
        </FadeInUp>
      )}
    </div>
  );
}
