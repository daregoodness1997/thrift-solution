"use client";

import { useState, useEffect, useCallback } from "react";
import { config, BrandConfig } from "@thrift/config";
import { Card, ColorfulBadge, FadeIn, FadeInUp, StaggerChildren } from "@thrift/ui";
import { formatNaira } from "@thrift/utils";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/PageHeader";
import Pagination from "@/components/Pagination";

const fallback = config;

interface ClearanceItem {
  id: string;
  groupName: string;
  cycleNumber: number;
  payoutAmount: number;
  contributed: number;
  status: string;
  clearedDate?: string;
  totalCycles?: number;
}

interface PayoutRequest {
  id: string;
  circleAccountId: string;
  amount: number;
  status: string;
  note?: string;
  clearanceNote?: string;
  disbursementNote?: string;
  disbursementRef?: string;
  disbursedAt?: string;
  reviewedAt?: string;
  createdAt: string;
  circleAccount: {
    principalAmount: number;
    interestEarned: number;
    circle: { id: string; name: string; amount: number; durationMonths: number; interestRateAnnual: number };
  };
}

const statusStyles: Record<string, { bg: string; color: string; border: string }> = {
  cleared: { bg: "#EFF6FF", color: "#2563EB", border: "#BFDBFE" },
  approved: { bg: "#ECFDF5", color: "#059669", border: "#A7F3D0" },
  disbursed: { bg: "#ECFDF5", color: "#059669", border: "#A7F3D0" },
  disbursement_failed: { bg: "#FEF2F2", color: "#DC2626", border: "#FECACA" },
  pending: { bg: "#FFFBEB", color: "#D97706", border: "#FDE68A" },
  declined: { bg: "#FEF2F2", color: "#DC2626", border: "#FECACA" },
  upcoming: { bg: "#F3F4F6", color: "#6B7280", border: "#E5E7EB" },
};

export default function MyClearancePage() {
  const { token } = useAuth();
  const [cfg] = useState<BrandConfig>(config);
  const [activeTab, setActiveTab] = useState<"group" | "circle">("group");

  const [clearances, setClearances] = useState<ClearanceItem[]>([]);
  const [stats, setStats] = useState({ totalPayouts: 0, totalContributed: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const LIMIT = 20;

  const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>([]);
  const [prPage, setPrPage] = useState(1);
  const [prTotalPages, setPrTotalPages] = useState(1);
  const [prTotal, setPrTotal] = useState(0);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  const fetchClearances = useCallback(async () => {
    if (!token) { setLoading(false); return; }
    try {
      const res = await fetch(`${API_URL}/api/clearances`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) {
        setClearances(data.data.clearances || []);
        setStats({ totalPayouts: data.data.totalPayouts || 0, totalContributed: data.data.totalContributed || 0 });
      }
    } catch {}
    setLoading(false);
  }, [token, API_URL]);

  const [paginatedItems, setPaginatedItems] = useState<ClearanceItem[]>([]);
  const [listLoading, setListLoading] = useState(false);

  const fetchPaginatedList = useCallback(async () => {
    if (!token) return;
    setListLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/clearances/list?page=${page}&limit=${LIMIT}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) {
        setPaginatedItems(data.data.items || []);
        setTotalPages(data.data.totalPages || 1);
        setTotalItems(data.data.total || 0);
      }
    } catch {}
    setListLoading(false);
  }, [token, page, API_URL]);

  const fetchPayoutRequests = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/circles/payout-requests/my?page=${prPage}&limit=${LIMIT}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setPayoutRequests(data.data.items || []);
        setPrTotalPages(data.data.totalPages || 1);
        setPrTotal(data.data.total || 0);
      }
    } catch {}
  }, [token, prPage, API_URL]);

  useEffect(() => { fetchClearances(); }, [fetchClearances]);
  useEffect(() => { fetchPaginatedList(); }, [fetchPaginatedList]);
  useEffect(() => { fetchPayoutRequests(); }, [fetchPayoutRequests]);

  const nextPayout = clearances.find((c) => c.status === "pending");
  const pendingRequests = payoutRequests.filter((r) => r.status === "pending");

  if (loading) {
    return (
      <div className="mx-auto max-w-[900px] p-[clamp(1rem,3vw,2rem)]">
        <div className="p-16 text-center text-[13px] text-gray-400">Loading clearances...</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[900px] p-[clamp(1rem,3vw,2rem)]">
      <PageHeader
        badgeLabel="Member Portal"
        heading="My"
        accentText="Clearance"
        description="Track your payout clearances and circle progress."
      />

      <StaggerChildren staggerDelay={100} className="mb-8 grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
        <Card padding="1.25rem">
          <span className="block text-[9px] font-bold uppercase tracking-[0.1em] text-gray-400">Total Payouts Received</span>
          <span className="mt-1 block font-mono text-2xl font-bold text-emerald-600">{formatNaira(stats.totalPayouts)}</span>
        </Card>
        <Card padding="1.25rem">
          <span className="block text-[9px] font-bold uppercase tracking-[0.1em] text-gray-400">Total Contributed</span>
          <span className="mt-1 block font-mono text-2xl font-bold text-brand-dark">{formatNaira(stats.totalContributed)}</span>
        </Card>
        <Card padding="1.25rem">
          <span className="block text-[9px] font-bold uppercase tracking-[0.1em] text-gray-400">Pending Requests</span>
          <span className="mt-1 block font-mono text-2xl font-bold" style={{ color: pendingRequests.length > 0 ? cfg.colors.primary : "#999" }}>
            {pendingRequests.length}
          </span>
          {pendingRequests.length > 0 && <span className="text-[10px] text-gray-500">Awaiting approval</span>}
        </Card>
      </StaggerChildren>

      <div className="mb-6 flex gap-2">
        <button onClick={() => setActiveTab("group")}
          className="cursor-pointer rounded-full border-[1.5px] px-5 py-2 text-xs font-semibold transition-all"
          style={{ backgroundColor: activeTab === "group" ? cfg.colors.primary : "#ffffff", color: activeTab === "group" ? "#ffffff" : "#717171", borderColor: activeTab === "group" ? cfg.colors.primary : "#EAEAEA" }}>
          Group Clearances
        </button>
        <button onClick={() => setActiveTab("circle")}
          className="cursor-pointer rounded-full border-[1.5px] px-5 py-2 text-xs font-semibold transition-all"
          style={{ backgroundColor: activeTab === "circle" ? cfg.colors.primary : "#ffffff", color: activeTab === "circle" ? "#ffffff" : "#717171", borderColor: activeTab === "circle" ? cfg.colors.primary : "#EAEAEA" }}>
          Circle Payouts
        </button>
      </div>

      {activeTab === "group" && (
        <FadeInUp delay={300}>
          <Card padding="1.5rem" className="mb-6">
            <div className="mb-4">
              <ColorfulBadge label="Clearance History" color={cfg.colors.primary} />
              <h2 className="mt-2 text-lg font-medium text-brand-dark">My Payout Clearances</h2>
            </div>
            {(listLoading && paginatedItems.length === 0) ? (
              <div className="p-8 text-center text-[13px] text-gray-400">Loading...</div>
            ) : paginatedItems.length === 0 ? (
              <div className="p-8 text-center text-[13px] text-gray-400">
                No clearances yet. Join a circle to start earning payouts.
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {paginatedItems.map((c) => {
                  const st = statusStyles[c.status] || statusStyles.pending;
                  return (
                    <div key={c.id} className="rounded-xl p-5 transition-all hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)]"
                      style={{ border: `1px solid ${st.border}`, backgroundColor: st.bg + "30" }}>
                      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <span className="block text-[13px] font-semibold text-[#2D2D2D]">{c.groupName}</span>
                          <span className="text-[11px] text-gray-500">Cycle {c.cycleNumber} payout</span>
                        </div>
                        <span className="rounded-md border px-2 py-0.5 text-[9px] font-bold capitalize" style={{ backgroundColor: st.bg, color: st.color, borderColor: st.border }}>{c.status}</span>
                      </div>

                      <div className="mb-3 grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-3">
                        <div>
                          <span className="block text-[9px] font-bold uppercase tracking-[0.1em] text-gray-400">Payout Amount</span>
                          <span className="mt-0.5 block font-mono text-base font-bold text-emerald-600">{formatNaira(c.payoutAmount)}</span>
                        </div>
                        <div>
                          <span className="block text-[9px] font-bold uppercase tracking-[0.1em] text-gray-400">My Contribution</span>
                          <span className="mt-0.5 block font-mono text-base font-bold text-[#2D2D2D]">{formatNaira(c.contributed)}</span>
                        </div>
                        {c.clearedDate && (
                          <div>
                            <span className="block text-[9px] font-bold uppercase tracking-[0.1em] text-gray-400">Cleared On</span>
                          <span className="mt-0.5 block font-mono text-xs font-medium text-[#2D2D2D]">
                              {new Date(c.clearedDate).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <Pagination page={page} totalPages={totalPages} total={totalItems} limit={LIMIT} onPageChange={setPage} loading={listLoading} />
          </Card>
        </FadeInUp>
      )}

      {activeTab === "circle" && (
        <FadeInUp delay={300}>
          <Card padding="1.5rem" className="mb-6">
            <div className="mb-4">
              <ColorfulBadge label="Circle Payout Requests" color={cfg.colors.primary} />
              <h2 className="mt-2 text-lg font-medium text-brand-dark">My Circle Payout Requests</h2>
            </div>

            {payoutRequests.length === 0 ? (
              <div className="p-8 text-center text-[13px] text-gray-400">
                No circle payout requests yet. Maturity payouts will appear here when requested.
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {payoutRequests.map((r) => {
                  const st = statusStyles[r.status] || statusStyles.pending;
                  return (
                    <div key={r.id} className="rounded-xl p-5 transition-all hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)]"
                      style={{ border: `1px solid ${st.border}`, backgroundColor: st.bg + "30" }}>
                      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <span className="block text-[13px] font-semibold text-[#2D2D2D]">{r.circleAccount.circle.name}</span>
                          <span className="text-[11px] text-gray-500">
                            {formatNaira(r.circleAccount.principalAmount)} &middot; {r.circleAccount.circle.interestRateAnnual}% p.a.
                          </span>
                        </div>
                        <span className="rounded-md border px-2 py-0.5 text-[9px] font-bold capitalize" style={{ backgroundColor: st.bg, color: st.color, borderColor: st.border }}>{r.status}</span>
                      </div>

                      <div className="mb-2 grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-3">
                        <div>
                          <span className="block text-[9px] font-bold uppercase tracking-[0.1em] text-gray-400">Principal</span>
                          <span className="mt-0.5 block font-mono text-sm font-bold" style={{ color: cfg.colors.primary }}>{formatNaira(r.circleAccount.principalAmount)}</span>
                        </div>
                        <div>
                          <span className="block text-[9px] font-bold uppercase tracking-[0.1em] text-gray-400">Interest Earned</span>
                          <span className="mt-0.5 block font-mono text-sm font-bold text-emerald-600">{formatNaira(r.circleAccount.interestEarned)}</span>
                        </div>
                        <div>
                          <span className="block text-[9px] font-bold uppercase tracking-[0.1em] text-gray-400">Total Payout</span>
                          <span className="mt-0.5 block font-mono text-sm font-bold text-[#2D2D2D]">{formatNaira(r.amount)}</span>
                        </div>
                        <div>
                          <span className="block text-[9px] font-bold uppercase tracking-[0.1em] text-gray-400">Requested</span>
                          <span className="mt-0.5 block font-mono text-xs font-medium text-[#2D2D2D]">
                            {new Date(r.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                          </span>
                        </div>
                      </div>

                      {r.note && (
                        <div className="mt-2 rounded-lg bg-red-50 p-3 text-[11px] text-red-600">
                          Note: {r.note}
                        </div>
                      )}

                      {r.status === "pending" && (
                        <div className="mt-3 text-[11px] font-medium text-amber-600">
                          Waiting for admin review...
                        </div>
                      )}
                      {r.status === "cleared" && (
                        <div className="mt-3 text-[11px] font-medium text-blue-600">
                          Cleared — awaiting disbursement.
                        </div>
                      )}
                      {r.status === "disbursed" && (
                        <div className="mt-3 text-[11px] font-medium text-emerald-600">
                          Disbursed{r.disbursedAt ? ` on ${new Date(r.disbursedAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}` : ""}{r.disbursementRef ? ` · Ref ${r.disbursementRef}` : ""}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            <Pagination page={prPage} totalPages={prTotalPages} total={prTotal} limit={LIMIT} onPageChange={setPrPage} />
          </Card>
        </FadeInUp>
      )}

      <FadeInUp delay={400}>
        <Card padding="1.5rem">
          <div className="mb-4">
            <ColorfulBadge label="How It Works" color={cfg.colors.accent} />
            <h2 className="mt-2 text-lg font-medium text-brand-dark">Clearance Process</h2>
          </div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
            {[
              { step: 1, title: "Contribute", desc: "Make your contributions each cycle to build your eligibility.", color: cfg.colors.primary },
              { step: 2, title: "Build Eligibility", desc: "Complete the required cycles to qualify for a payout.", color: "#8A7D73" },
              { step: 3, title: "Get Cleared", desc: "Once approved, your payout is credited to your wallet.", color: "#059669" },
            ].map((item) => (
              <div key={item.step} className="rounded-xl bg-gray-50 p-4 text-center">
                <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full font-mono text-[13px] font-bold" style={{ backgroundColor: `${item.color}15`, color: item.color }}>
                  {item.step}
                </div>
                <span className="block text-xs font-semibold text-[#2D2D2D]">{item.title}</span>
                <span className="text-[10px] font-light text-gray-500">{item.desc}</span>
              </div>
            ))}
          </div>
        </Card>
      </FadeInUp>
    </div>
  );
}
