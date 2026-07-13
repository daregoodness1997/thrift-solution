"use client";

import { useState, useEffect, useCallback } from "react";
import { config, BrandConfig } from "@thrift/config";
import { Card, StatCard, ColorfulBadge, ColorBar, FadeInUp, FadeIn, StaggerChildren } from "@thrift/ui";
import { formatNaira } from "@thrift/utils";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/PageHeader";
import { Skeleton, SkeletonCard, SkeletonTable } from "@/components/Skeleton";
import Pagination from "@/components/Pagination";

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
  }, [API_URL]);

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
  }, [API_URL, referralsPage]);

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
  }, [API_URL, earningsPage]);

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

  const shareUrl = `https://arosco.com/register?ref=${referralCode}`;
  const shareText = `Join Arosco using my referral code ${referralCode} and start saving together! ${shareUrl}`;

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
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "clamp(1rem, 3vw, 2rem)" }}>
        <ColorBar />
        <div style={{ marginBottom: "2rem" }}>
          <Skeleton width="100px" height="12px" style={{ marginBottom: "0.75rem" }} />
          <Skeleton width="320px" height="28px" style={{ marginBottom: "0.5rem" }} />
          <Skeleton width="250px" height="12px" />
        </div>
        <Skeleton width="100%" height="120px" style={{ marginBottom: "2rem" }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.5rem", marginBottom: "2rem" }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <Skeleton width="100%" height="140px" style={{ marginBottom: "2rem" }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "1.5rem", marginBottom: "2rem" }}>
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "clamp(1rem, 3vw, 2rem)" }}>
      <PageHeader
        badgeLabel="Referral Program"
        heading="Invite Friends,"
        accentText="Earn Rewards"
        description="Share your code and earn tiered rewards for every friend who joins."
      />

      {/* Referral Code Card */}
      <FadeInUp delay={200}>
        <Card padding="1.5rem" style={{ marginBottom: "2rem", background: `linear-gradient(135deg, ${cfg.colors.primary}08, ${cfg.colors.primary}03)`, border: `1px solid ${cfg.colors.primary}20` }}>
          <ColorfulBadge label="Your Code" color={cfg.colors.primary} />
          <div style={{ display: "flex", flexWrap: "wrap", gap: "1.5rem", alignItems: "center", justifyContent: "space-between", marginTop: "1rem" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span style={{ fontSize: "clamp(1.5rem, 4vw, 2.25rem)", fontFamily: "'JetBrains Mono', monospace", fontWeight: 800, letterSpacing: "0.05em", color: cfg.colors.primary }}>
                  {referralCode}
                </span>
                <button onClick={handleCopy}
                  style={{ padding: "0.5rem 1rem", borderRadius: "9999px", fontSize: "11px", fontWeight: 600, cursor: "pointer", border: `1px solid ${cfg.colors.primary}`, backgroundColor: copied ? "#ECFDF5" : "transparent", color: copied ? "#059669" : cfg.colors.primary, transition: "all 0.2s ease", whiteSpace: "nowrap" }}>
                  {copied ? "Copied!" : "Copy Code"}
                </button>
              </div>
              <p style={{ fontSize: "12px", color: "#717171", fontWeight: 300, marginTop: "0.5rem" }}>Share this code with friends. They enter it when signing up.</p>
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <a href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noopener noreferrer"
                style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "36px", height: "36px", borderRadius: "50%", backgroundColor: "#25D366", color: "#fff", textDecoration: "none", transition: "transform 0.2s ease" }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.1)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.498 14.382c-.301-.15-1.767-.967-2.04-1.08-.273-.114-.473-.165-.673.165-.197.325-.767.997-.94 1.2-.175.208-.347.23-.644.08-.297-.15-1.261-.485-2.403-1.546-.888-.828-1.484-1.854-1.66-2.149-.173-.3-.019-.465.13-.615.13-.13.3-.345.45-.523.146-.181.194-.301.297-.5.1-.194.05-.372-.025-.527-.075-.15-.672-1.62-.922-2.206-.24-.584-.487-.51-.672-.51-.172-.015-.371-.015-.571-.015-.2 0-.523.074-.797.375-.273.3-1.045 1.02-1.045 2.475s1.07 2.865 1.219 3.075c.149.21 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.767-.721 2.016-1.426.247-.705.247-1.305.173-1.426-.074-.121-.274-.198-.575-.347z M12.05 21.785h-.001a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982 1.003-3.628-.235-.374A9.86 9.86 0 012.16 12c0-5.44 4.418-9.858 9.85-9.858 5.44 0 9.857 4.418 9.857 9.858 0 2.665-1.05 5.117-2.95 6.959l-.35.35.003.002-5.858 5.636z"/></svg>
              </a>
              <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noopener noreferrer"
                style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "36px", height: "36px", borderRadius: "50%", backgroundColor: "#1DA1F2", color: "#fff", textDecoration: "none", transition: "transform 0.2s ease" }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.1)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M23.643 4.937c-.835.37-1.732.62-2.675.733.962-.576 1.7-1.49 2.048-2.578-.9.534-1.897.922-2.958 1.13-.85-.904-2.06-1.47-3.4-1.47-2.572 0-4.658 2.086-4.658 4.66 0 .364.042.718.12 1.06-3.873-.195-7.304-2.05-9.602-4.868-.4.69-.63 1.49-.63 2.342 0 1.616.823 3.043 2.072 3.878-.764-.025-1.482-.234-2.11-.583v.06c0 2.257 1.605 4.14 3.737 4.568-.392.106-.803.162-1.227.162-.3 0-.593-.028-.877-.082.593 1.85 2.313 3.198 4.352 3.234-1.595 1.25-3.604 1.995-5.786 1.995-.376 0-.747-.022-1.112-.065 2.062 1.323 4.51 2.093 7.14 2.093 8.57 0 13.255-7.098 13.255-13.254 0-.2-.005-.402-.014-.602.91-.658 1.7-1.477 2.323-2.41z"/></svg>
              </a>
              <button onClick={handleCopy}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "36px", height: "36px", borderRadius: "50%", backgroundColor: cfg.colors.primary, color: "#fff", border: "none", cursor: "pointer", transition: "transform 0.2s ease" }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.1)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
              </button>
            </div>
          </div>
        </Card>
      </FadeInUp>

      {/* Stats Row */}
      <StaggerChildren staggerDelay={100} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.5rem", marginBottom: "2rem" }}>
        <StatCard label="Total Referrals" value={String(stats?.totalReferrals ?? 0)} change={`${stats?.completedReferrals ?? 0} completed`} positive variant="default" />
        <StatCard label="Total Earnings" value={formatNaira(stats?.totalEarnings ?? 0)} change={`${stats?.currentTier ?? "Bronze"} tier`} positive variant="warm" />
        <StatCard label="Pending" value={String(stats?.pendingReferrals ?? 0)} change="Awaiting registration" positive variant="default" />
        <StatCard label="Next Tier" value={stats?.nextTier ?? "Max"} change={stats?.referralsToNextTier ? `${stats.referralsToNextTier} more referrals` : "Highest tier!"} positive variant="warm" />
      </StaggerChildren>

      {/* Tier Progress */}
      <FadeInUp delay={400}>
        <Card padding="1.5rem" style={{ marginBottom: "2rem" }}>
          <ColorfulBadge label="Your Tier" color={TIER_COLORS[stats?.currentTier ?? "Bronze"] || cfg.colors.primary} />
          <div style={{ display: "flex", flexWrap: "wrap", gap: "2rem", marginTop: "1rem", alignItems: "flex-start" }}>
            <div style={{ flex: "1 1 280px" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", marginBottom: "1rem" }}>
                <span style={{ fontSize: "2rem", fontWeight: 800, fontFamily: "'Playfair Display', serif", color: TIER_COLORS[stats?.currentTier ?? "Bronze"] || cfg.colors.primary }}>
                  {stats?.currentTier ?? "Bronze"}
                </span>
                <span style={{ fontSize: "12px", color: "#717171" }}>current tier</span>
              </div>
              <div style={{ position: "relative", height: "8px", backgroundColor: "#F0F0F0", borderRadius: "9999px", overflow: "hidden", marginBottom: "0.5rem" }}>
                <div style={{ height: "100%", borderRadius: "9999px", background: `linear-gradient(90deg, ${TIER_COLORS[stats?.currentTier ?? "Bronze"] || cfg.colors.primary}, ${cfg.colors.accent})`, width: `${tierProgress}%`, transition: "width 1s cubic-bezier(0.16, 1, 0.3, 1)" }} />
              </div>
              <span style={{ fontSize: "10px", color: "#717171", fontFamily: "'JetBrains Mono', monospace" }}>
                {stats?.completedReferrals ?? 0} referrals {stats?.referralsToNextTier ? `— ${stats.referralsToNextTier} more to ${stats.nextTier}` : "— Max tier achieved!"}
              </span>
            </div>
            <div style={{ flex: "1 1 320px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.75rem" }}>
                {ALL_TIERS.map((tier) => {
                  const isActive = stats?.currentTier === tier.name;
                  const isPast = ALL_TIERS.findIndex((t) => t.name === tier.name) < ALL_TIERS.findIndex((t) => t.name === (stats?.currentTier ?? "Bronze"));
                  return (
                    <div key={tier.name} style={{ padding: "0.75rem", borderRadius: "0.75rem", border: `1px solid ${isActive ? TIER_COLORS[tier.name] : "#EAEAEA"}`, backgroundColor: isActive ? `${TIER_COLORS[tier.name]}10` : "#FAFAFA", opacity: isPast && !isActive ? 0.6 : 1, transition: "all 0.2s ease" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "12px", fontWeight: 700, color: TIER_COLORS[tier.name] }}>{tier.name}</span>
                        {isActive && <span style={{ fontSize: "8px", fontWeight: 700, color: "#fff", backgroundColor: TIER_COLORS[tier.name], padding: "0.125rem 0.375rem", borderRadius: "9999px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Current</span>}
                      </div>
                      <span style={{ fontSize: "10px", color: "#717171", display: "block", marginTop: "0.25rem" }}>
                        {tier.min === 1 ? "1" : tier.min}–{tier.max === Infinity ? "25+" : tier.max} referrals
                      </span>
                      <span style={{ fontSize: "12px", fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", color: "#2D2D2D", display: "block", marginTop: "0.25rem" }}>
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

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "1.5rem", marginBottom: "2rem" }}>
        {/* Referral History */}
        <FadeInUp delay={500}>
          <Card padding="1.5rem">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", paddingBottom: "1rem", borderBottom: "1px solid #F0F0F0" }}>
              <div>
                <ColorfulBadge label="Referrals" color={cfg.colors.primary} />
                <h2 style={{ fontSize: "1.125rem", fontWeight: 500, color: "#1A1A1A", marginTop: "0.5rem" }}>Referral History</h2>
              </div>
              <span style={{ fontSize: "10px", fontFamily: "'JetBrains Mono', monospace", color: "#717171" }}>{referralsTotal} entries</span>
            </div>
            {referrals.length === 0 ? (
              <div style={{ padding: "2rem", textAlign: "center" }}>
                <p style={{ fontSize: "12px", color: "#999" }}>No referrals yet. Share your code to get started!</p>
              </div>
            ) : (
              <>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", fontSize: "12px", borderCollapse: "collapse", minWidth: "300px" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #F0F0F0", color: "#999", textTransform: "uppercase", letterSpacing: "0.1em", fontSize: "9px", fontFamily: "'JetBrains Mono', monospace" }}>
                      <th style={{ paddingBottom: "0.75rem", textAlign: "left", fontWeight: 600 }}>Name</th>
                      <th style={{ paddingBottom: "0.75rem", textAlign: "left", fontWeight: 600 }}>Date</th>
                      <th style={{ paddingBottom: "0.75rem", textAlign: "right", fontWeight: 600 }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {referrals.map((r) => (
                      <tr key={r.id} style={{ borderBottom: "1px solid #F5F5F5" }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#F9FAFB"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}>
                        <td style={{ padding: "0.75rem 0", fontWeight: 500, color: "#2D2D2D" }}>{r.referredUser.name}</td>
                        <td style={{ padding: "0.75rem 0", fontFamily: "'JetBrains Mono', monospace", color: "#717171" }}>
                          {new Date(r.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                        </td>
                        <td style={{ padding: "0.75rem 0", textAlign: "right" }}>
                          <span style={{ fontSize: "9px", fontWeight: 700, color: r.status === "completed" ? "#059669" : "#D97706", backgroundColor: r.status === "completed" ? "#ECFDF5" : "#FFFBEB", padding: "0.125rem 0.5rem", borderRadius: "0.375rem", textTransform: "capitalize" }}>
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
          <Card padding="1.5rem">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", paddingBottom: "1rem", borderBottom: "1px solid #F0F0F0" }}>
              <div>
                <ColorfulBadge label="Earnings" color="#059669" />
                <h2 style={{ fontSize: "1.125rem", fontWeight: 500, color: "#1A1A1A", marginTop: "0.5rem" }}>Earnings History</h2>
              </div>
              <span style={{ fontSize: "10px", fontFamily: "'JetBrains Mono', monospace", color: "#717171" }}>{earningsTotal} entries</span>
            </div>
            {earnings.length === 0 ? (
              <div style={{ padding: "2rem", textAlign: "center" }}>
                <p style={{ fontSize: "12px", color: "#999" }}>No earnings yet. Referrals will generate rewards!</p>
              </div>
            ) : (
              <>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", fontSize: "12px", borderCollapse: "collapse", minWidth: "300px" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #F0F0F0", color: "#999", textTransform: "uppercase", letterSpacing: "0.1em", fontSize: "9px", fontFamily: "'JetBrains Mono', monospace" }}>
                      <th style={{ paddingBottom: "0.75rem", textAlign: "left", fontWeight: 600 }}>Tier</th>
                      <th style={{ paddingBottom: "0.75rem", textAlign: "left", fontWeight: 600 }}>Date</th>
                      <th style={{ paddingBottom: "0.75rem", textAlign: "right", fontWeight: 600 }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {earnings.map((e) => (
                      <tr key={e.id} style={{ borderBottom: "1px solid #F5F5F5" }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#F9FAFB"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}>
                        <td style={{ padding: "0.75rem 0" }}>
                          <span style={{ padding: "0.125rem 0.5rem", borderRadius: "0.375rem", fontSize: "9px", fontWeight: 700, textTransform: "uppercase", fontFamily: "'JetBrains Mono', monospace", backgroundColor: `${TIER_COLORS[e.tier] || cfg.colors.primary}12`, color: TIER_COLORS[e.tier] || cfg.colors.primary, border: `1px solid ${TIER_COLORS[e.tier] || cfg.colors.primary}20` }}>
                            {e.tier}
                          </span>
                        </td>
                        <td style={{ padding: "0.75rem 0", fontFamily: "'JetBrains Mono', monospace", color: "#717171" }}>
                          {new Date(e.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                        </td>
                        <td style={{ padding: "0.75rem 0", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: "#059669" }}>
                          {formatNaira(e.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
