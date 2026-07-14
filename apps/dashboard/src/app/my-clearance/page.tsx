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
  reviewedAt?: string;
  createdAt: string;
  circleAccount: {
    principalAmount: number;
    interestEarned: number;
    circle: { id: string; name: string; amount: number; durationMonths: number; interestRateAnnual: number };
  };
}

const statusStyles: Record<string, { bg: string; color: string; border: string }> = {
  cleared: { bg: "#ECFDF5", color: "#059669", border: "#A7F3D0" },
  approved: { bg: "#ECFDF5", color: "#059669", border: "#A7F3D0" },
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
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "clamp(1rem, 3vw, 2rem)" }}>
        <div style={{ textAlign: "center", padding: "4rem", color: "#999", fontSize: "13px" }}>Loading clearances...</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "clamp(1rem, 3vw, 2rem)" }}>
      <PageHeader
        badgeLabel="Member Portal"
        heading="My"
        accentText="Clearance"
        description="Track your payout clearances and circle progress."
      />

      <StaggerChildren staggerDelay={100} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        <Card padding="1.25rem">
          <span style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#999", fontWeight: 700, display: "block" }}>Total Payouts Received</span>
          <span style={{ fontSize: "1.5rem", fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: "#059669", display: "block", marginTop: "0.25rem" }}>{formatNaira(stats.totalPayouts)}</span>
        </Card>
        <Card padding="1.25rem">
          <span style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#999", fontWeight: 700, display: "block" }}>Total Contributed</span>
          <span style={{ fontSize: "1.5rem", fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: "#1A1A1A", display: "block", marginTop: "0.25rem" }}>{formatNaira(stats.totalContributed)}</span>
        </Card>
        <Card padding="1.25rem">
          <span style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#999", fontWeight: 700, display: "block" }}>Pending Requests</span>
          <span style={{ fontSize: "1.5rem", fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: pendingRequests.length > 0 ? cfg.colors.primary : "#999", display: "block", marginTop: "0.25rem" }}>
            {pendingRequests.length}
          </span>
          {pendingRequests.length > 0 && <span style={{ fontSize: "10px", color: "#717171" }}>Awaiting approval</span>}
        </Card>
      </StaggerChildren>

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
        <button onClick={() => setActiveTab("group")}
          style={{ padding: "0.5rem 1.25rem", borderRadius: "9999px", fontSize: "12px", fontWeight: 600, border: "1.5px solid", cursor: "pointer", transition: "all 0.15s ease", backgroundColor: activeTab === "group" ? cfg.colors.primary : "#ffffff", color: activeTab === "group" ? "#ffffff" : "#717171", borderColor: activeTab === "group" ? cfg.colors.primary : "#EAEAEA" }}>
          Group Clearances
        </button>
        <button onClick={() => setActiveTab("circle")}
          style={{ padding: "0.5rem 1.25rem", borderRadius: "9999px", fontSize: "12px", fontWeight: 600, border: "1.5px solid", cursor: "pointer", transition: "all 0.15s ease", backgroundColor: activeTab === "circle" ? cfg.colors.primary : "#ffffff", color: activeTab === "circle" ? "#ffffff" : "#717171", borderColor: activeTab === "circle" ? cfg.colors.primary : "#EAEAEA" }}>
          Circle Payouts
        </button>
      </div>

      {activeTab === "group" && (
        <FadeInUp delay={300}>
          <Card padding="1.5rem" style={{ marginBottom: "1.5rem" }}>
            <div style={{ marginBottom: "1rem" }}>
              <ColorfulBadge label="Clearance History" color={cfg.colors.primary} />
              <h2 style={{ fontSize: "1.125rem", fontWeight: 500, color: "#1A1A1A", marginTop: "0.5rem" }}>My Payout Clearances</h2>
            </div>
            {(listLoading && paginatedItems.length === 0) ? (
              <div style={{ textAlign: "center", padding: "2rem", color: "#999", fontSize: "13px" }}>Loading...</div>
            ) : paginatedItems.length === 0 ? (
              <div style={{ textAlign: "center", padding: "2rem", color: "#999", fontSize: "13px" }}>
                No clearances yet. Join a circle to start earning payouts.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {paginatedItems.map((c) => {
                  const st = statusStyles[c.status] || statusStyles.pending;
                  return (
                    <div key={c.id} style={{ padding: "1.25rem", borderRadius: "1rem", border: `1px solid ${st.border}`, backgroundColor: st.bg + "30", transition: "all 0.2s ease" }}
                      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.06)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem", flexWrap: "wrap", gap: "0.5rem" }}>
                        <div>
                          <span style={{ fontSize: "13px", fontWeight: 600, color: "#2D2D2D", display: "block" }}>{c.groupName}</span>
                          <span style={{ fontSize: "11px", color: "#717171" }}>Cycle {c.cycleNumber} payout</span>
                        </div>
                        <span style={{ fontSize: "9px", fontWeight: 700, padding: "0.125rem 0.5rem", borderRadius: "0.375rem", backgroundColor: st.bg, color: st.color, border: `1px solid ${st.border}`, textTransform: "capitalize" }}>{c.status}</span>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "0.75rem", marginBottom: "0.75rem" }}>
                        <div>
                          <span style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#999", fontWeight: 700, display: "block" }}>Payout Amount</span>
                          <span style={{ fontSize: "16px", fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: "#059669", display: "block", marginTop: "0.125rem" }}>{formatNaira(c.payoutAmount)}</span>
                        </div>
                        <div>
                          <span style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#999", fontWeight: 700, display: "block" }}>My Contribution</span>
                          <span style={{ fontSize: "16px", fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: "#2D2D2D", display: "block", marginTop: "0.125rem" }}>{formatNaira(c.contributed)}</span>
                        </div>
                        {c.clearedDate && (
                          <div>
                            <span style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#999", fontWeight: 700, display: "block" }}>Cleared On</span>
                            <span style={{ fontSize: "12px", fontFamily: "'JetBrains Mono', monospace", fontWeight: 500, color: "#2D2D2D", display: "block", marginTop: "0.125rem" }}>
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
          <Card padding="1.5rem" style={{ marginBottom: "1.5rem" }}>
            <div style={{ marginBottom: "1rem" }}>
              <ColorfulBadge label="Circle Payout Requests" color={cfg.colors.primary} />
              <h2 style={{ fontSize: "1.125rem", fontWeight: 500, color: "#1A1A1A", marginTop: "0.5rem" }}>My Circle Payout Requests</h2>
            </div>

            {payoutRequests.length === 0 ? (
              <div style={{ textAlign: "center", padding: "2rem", color: "#999", fontSize: "13px" }}>
                No circle payout requests yet. Maturity payouts will appear here when requested.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {payoutRequests.map((r) => {
                  const st = statusStyles[r.status] || statusStyles.pending;
                  return (
                    <div key={r.id} style={{ padding: "1.25rem", borderRadius: "1rem", border: `1px solid ${st.border}`, backgroundColor: st.bg + "30", transition: "all 0.2s ease" }}
                      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.06)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem", flexWrap: "wrap", gap: "0.5rem" }}>
                        <div>
                          <span style={{ fontSize: "13px", fontWeight: 600, color: "#2D2D2D", display: "block" }}>{r.circleAccount.circle.name}</span>
                          <span style={{ fontSize: "11px", color: "#717171" }}>
                            {formatNaira(r.circleAccount.principalAmount)} &middot; {r.circleAccount.circle.interestRateAnnual}% p.a.
                          </span>
                        </div>
                        <span style={{ fontSize: "9px", fontWeight: 700, padding: "0.125rem 0.5rem", borderRadius: "0.375rem", backgroundColor: st.bg, color: st.color, border: `1px solid ${st.border}`, textTransform: "capitalize" }}>{r.status}</span>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "0.75rem", marginBottom: "0.5rem" }}>
                        <div>
                          <span style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#999", fontWeight: 700, display: "block" }}>Principal</span>
                          <span style={{ fontSize: "14px", fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: cfg.colors.primary, display: "block", marginTop: "0.125rem" }}>{formatNaira(r.circleAccount.principalAmount)}</span>
                        </div>
                        <div>
                          <span style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#999", fontWeight: 700, display: "block" }}>Interest Earned</span>
                          <span style={{ fontSize: "14px", fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: "#059669", display: "block", marginTop: "0.125rem" }}>{formatNaira(r.circleAccount.interestEarned)}</span>
                        </div>
                        <div>
                          <span style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#999", fontWeight: 700, display: "block" }}>Total Payout</span>
                          <span style={{ fontSize: "14px", fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: "#2D2D2D", display: "block", marginTop: "0.125rem" }}>{formatNaira(r.amount)}</span>
                        </div>
                        <div>
                          <span style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#999", fontWeight: 700, display: "block" }}>Requested</span>
                          <span style={{ fontSize: "12px", fontFamily: "'JetBrains Mono', monospace", fontWeight: 500, color: "#2D2D2D", display: "block", marginTop: "0.125rem" }}>
                            {new Date(r.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                          </span>
                        </div>
                      </div>

                      {r.note && (
                        <div style={{ marginTop: "0.5rem", padding: "0.5rem 0.75rem", backgroundColor: "#FEF2F2", borderRadius: "0.5rem", fontSize: "11px", color: "#DC2626" }}>
                          Note: {r.note}
                        </div>
                      )}

                      {r.status === "pending" && (
                        <div style={{ marginTop: "0.75rem", fontSize: "11px", color: "#D97706", fontWeight: 500 }}>
                          Waiting for admin approval...
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
          <div style={{ marginBottom: "1rem" }}>
            <ColorfulBadge label="How It Works" color={cfg.colors.accent} />
            <h2 style={{ fontSize: "1.125rem", fontWeight: 500, color: "#1A1A1A", marginTop: "0.5rem" }}>Clearance Process</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
            {[
              { step: 1, title: "Contribute", desc: "Make your contributions each cycle to build your eligibility.", color: cfg.colors.primary },
              { step: 2, title: "Build Eligibility", desc: "Complete the required cycles to qualify for a payout.", color: "#8A7D73" },
              { step: 3, title: "Get Cleared", desc: "Once approved, your payout is credited to your wallet.", color: "#059669" },
            ].map((item) => (
              <div key={item.step} style={{ padding: "1rem", borderRadius: "0.75rem", backgroundColor: "#FAFAFA", textAlign: "center" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "50%", backgroundColor: `${item.color}15`, color: item.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", margin: "0 auto 0.5rem" }}>
                  {item.step}
                </div>
                <span style={{ fontSize: "12px", fontWeight: 600, color: "#2D2D2D", display: "block" }}>{item.title}</span>
                <span style={{ fontSize: "10px", color: "#717171", fontWeight: 300 }}>{item.desc}</span>
              </div>
            ))}
          </div>
        </Card>
      </FadeInUp>
    </div>
  );
}
