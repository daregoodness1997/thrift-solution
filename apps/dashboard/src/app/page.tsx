"use client";

import { useState, useEffect, useCallback } from "react";
import { config, BrandConfig } from "@thrift/config";
import { StatCard, Card, Button, GradientStrip, SavingsGrowthChart, ColorfulBadge, ColorBar, FadeIn, FadeInUp, StaggerChildren } from "@thrift/ui";
import { formatNaira } from "@thrift/utils";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/PageHeader";
import { Skeleton, SkeletonCard } from "@/components/Skeleton";

const fallback = config;

interface UserProfile {
  name: string;
  email: string;
  stats: {
    totalSaved: number;
    totalDonated: number;
    activeCircles: number;
    trustScore: number;
    trustLevel: string;
    clearances: number;
    totalContributed: number;
    totalReceived: number;
  };
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description?: string;
  status: string;
  createdAt: string;
  groupId?: string;
}

interface UserGroup {
  groupId: string;
  groupName: string;
  targetAmount: number;
  currentAmount: number;
  cycleFrequency: string;
}

export default function Dashboard() {
  const { user, token } = useAuth();
  const [cfg, setCfg] = useState<BrandConfig>(fallback);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [walletAmount, setWalletAmount] = useState("");
  const [walletCustom, setWalletCustom] = useState("");
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletFunded, setWalletFunded] = useState(false);
  const [referralCode, setReferralCode] = useState("");
  const [referralCopied, setReferralCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  useEffect(() => {
    fetch(`${API_URL}/api/config`)
      .then((r) => r.json())
      .then((data) => { if (data && data.name) setCfg((prev) => ({ ...prev, ...data })); })
      .catch(() => {});
  }, [API_URL]);

  const fetchData = useCallback(async () => {
    if (!token) { setLoading(false); return; }
    try {
      const [profileRes, txRes, groupsRes, referralRes] = await Promise.all([
        fetch(`${API_URL}/api/user/profile`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/api/transactions?limit=5`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/api/user/groups`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/api/referrals/code`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const [profileData, txData, groupsData, referralData] = await Promise.all([
        profileRes.json(),
        txRes.json(),
        groupsRes.json(),
        referralRes.json(),
      ]);

      if (profileData.success) {
        setProfile(profileData.data);
        setWalletBalance(profileData.data.stats.totalSaved);
      }
      if (txData.success) setTransactions(txData.data || []);
      if (groupsData.success) setGroups(groupsData.data || []);
      if (referralData?.data?.code) setReferralCode(referralData.data.code);
    } catch {}
    setLoading(false);
  }, [token, API_URL]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleWalletFunding = async () => {
    const selected = walletCustom || walletAmount;
    if (!selected || parseFloat(selected) <= 0 || !token) return;
    setWalletLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/user/fund`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount: parseFloat(selected) }),
      });
      const data = await res.json();
      if (data.success) {
        setWalletBalance((prev) => prev + parseFloat(selected));
        setWalletAmount("");
        setWalletCustom("");
        setWalletFunded(true);
        setTimeout(() => setWalletFunded(false), 3000);
      }
    } catch {}
    setWalletLoading(false);
  };

  const handleReferralCopy = async () => {
    if (!referralCode) return;
    try {
      await navigator.clipboard.writeText(referralCode);
      setReferralCopied(true);
      setTimeout(() => setReferralCopied(false), 2000);
    } catch {}
  };

  const displayName = user?.name?.split(" ")[0] || "Member";
  const displayInitials = user?.name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "M";

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "contribution": return "Contribution";
      case "payout": return "Payout";
      case "donation": return "Donation";
      case "funding": return "Funding";
      case "referral_earning": return "Referral";
      default: return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "contribution": return "#4A5D4E";
      case "payout": return "#059669";
      case "donation": return cfg.colors.primary;
      case "funding": return "#2563EB";
      case "referral_earning": return "#8A7D73";
      default: return "#717171";
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "clamp(1rem, 3vw, 2rem)" }}>
        <div style={{ marginBottom: "2rem" }}>
          <Skeleton width="100px" height="12px" style={{ marginBottom: "0.75rem" }} />
          <Skeleton width="280px" height="28px" style={{ marginBottom: "0.5rem" }} />
          <Skeleton width="200px" height="12px" />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.5rem", marginBottom: "2rem" }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <Skeleton width="100%" height="160px" style={{ marginBottom: "2rem" }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem", marginBottom: "2rem" }}>
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <Skeleton width="100%" height="240px" />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "clamp(1rem, 3vw, 2rem)" }}>
      <PageHeader
        badgeLabel="Member Portal"
        heading={`Welcome back, ${displayName}`}
        description="Your Arosco savings dashboard"
        right={
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            {user?.accountNumber && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", backgroundColor: "#FAF9F5", borderRadius: "1rem", padding: "0.625rem 1rem", transition: "all 0.2s ease" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "50%", backgroundColor: `${cfg.colors.primary}12`, color: cfg.colors.primary, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M7 8h10M7 12h6" /></svg>
                </div>
                <div>
                  <span style={{ fontSize: "9px", color: "#999", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", display: "block" }}>Account</span>
                  <span style={{ fontSize: "11px", fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: "#2D2D2D", letterSpacing: "0.03em" }}>{user.accountNumber}</span>
                </div>
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", backgroundColor: "#FAF9F5", borderRadius: "1rem", padding: "0.625rem 1rem", transition: "all 0.2s ease" }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: `linear-gradient(135deg, ${cfg.colors.primary}, ${cfg.colors.accent})`, color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700 }}>{profile?.stats.trustScore || 1}</div>
              <div>
                <span style={{ fontSize: "9px", color: cfg.colors.accent, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", display: "block" }}>Trust Score</span>
                <span style={{ fontSize: "12px", fontWeight: 600, color: "#2D2D2D" }}>{profile?.stats.trustLevel || "Member"}</span>
              </div>
            </div>
          </div>
        }
      />

      <StaggerChildren staggerDelay={100} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.5rem", marginBottom: "2rem" }}>
        <StatCard label="Total Saved" value={formatNaira(profile?.stats.totalSaved || 0)} change={`Across ${profile?.stats.activeCircles || 0} circles`} positive variant="default" />
        <StatCard label="Total Donated" value={formatNaira(profile?.stats.totalDonated || 0)} change={`${profile?.stats.clearances || 0} clearances`} positive variant="warm" />
        <StatCard label="Active Circles" value={String(profile?.stats.activeCircles || 0)} change="All circles on track" positive variant="default" />
        <StatCard label="Trust Score" value={`${profile?.stats.trustScore || 1}/5`} change={profile?.stats.trustLevel || "Member"} positive variant="warm" />
      </StaggerChildren>

      {referralCode && (
        <FadeInUp delay={300}>
          <Card padding="1.5rem" style={{ marginBottom: "2rem", background: `linear-gradient(135deg, ${cfg.colors.primary}08, ${cfg.colors.primary}03)`, border: `1px solid ${cfg.colors.primary}20` }}>
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
              <div>
                <ColorfulBadge label="Referral Code" color={cfg.colors.primary} />
                <h2 style={{ fontSize: "1.125rem", fontWeight: 500, color: "#1A1A1A", marginTop: "0.5rem" }}>Your Referral Code</h2>
                <p style={{ fontSize: "12px", color: "#717171", fontWeight: 300, marginTop: "0.25rem" }}>Share with friends to earn tiered rewards when they join.</p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span style={{ fontSize: "clamp(1.25rem, 3vw, 1.75rem)", fontFamily: "'JetBrains Mono', monospace", fontWeight: 800, letterSpacing: "0.05em", color: cfg.colors.primary }}>
                  {referralCode}
                </span>
                <button onClick={handleReferralCopy}
                  style={{ padding: "0.5rem 1rem", borderRadius: "9999px", fontSize: "11px", fontWeight: 600, cursor: "pointer", border: `1px solid ${cfg.colors.primary}`, backgroundColor: referralCopied ? "#ECFDF5" : "transparent", color: referralCopied ? "#059669" : cfg.colors.primary, transition: "all 0.2s ease", whiteSpace: "nowrap" }}>
                  {referralCopied ? "Copied!" : "Copy"}
                </button>
                <a href="/referrals" style={{ padding: "0.5rem 1rem", borderRadius: "9999px", fontSize: "11px", fontWeight: 600, cursor: "pointer", backgroundColor: cfg.colors.primary, color: "#ffffff", textDecoration: "none", transition: "all 0.2s ease", whiteSpace: "nowrap" }}>
                  View Details
                </a>
              </div>
            </div>
          </Card>
        </FadeInUp>
      )}

      <FadeInUp delay={350}>
        <Card padding="1.5rem" style={{ marginBottom: "2rem" }}>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", marginBottom: "1.25rem" }}>
            <div>
              <ColorfulBadge label="Wallet" color={cfg.colors.primary} />
              <h2 style={{ fontSize: "1.125rem", fontWeight: 500, color: "#1A1A1A", marginTop: "0.5rem" }}>Fund Your Wallet</h2>
              <p style={{ fontSize: "12px", color: "#717171", fontWeight: 300, marginTop: "0.25rem" }}>Add funds for contributions and donations.</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <span style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#999", fontWeight: 700, display: "block" }}>Available Balance</span>
              <span style={{ fontSize: "1.5rem", fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: cfg.colors.primary }}>{formatNaira(walletBalance)}</span>
            </div>
          </div>
          {walletFunded && (
            <div style={{ padding: "0.75rem 1rem", borderRadius: "0.75rem", backgroundColor: "#ECFDF5", border: "1px solid #A7F3D0", color: "#059669", fontSize: "12px", fontWeight: 500, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><path d="M22 4L12 14.01l-3-3" /></svg>
              Wallet funded successfully! New balance: {formatNaira(walletBalance)}
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "0.5rem" }}>
              {[1000, 5000, 10000, 25000, 50000, 100000].map((preset) => (
                <button key={preset}
                  onClick={() => { setWalletAmount(String(preset)); setWalletCustom(""); }}
                  style={{ padding: "0.625rem", fontSize: "12px", fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, borderRadius: "0.75rem", border: `1px solid ${walletAmount === String(preset) ? cfg.colors.primary : "#EAEAEA"}`, backgroundColor: walletAmount === String(preset) ? `${cfg.colors.primary}0A` : "#ffffff", color: walletAmount === String(preset) ? cfg.colors.primary : "#717171", cursor: "pointer", transition: "all 0.2s ease" }}
                >
                  {formatNaira(preset)}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
              <div style={{ position: "relative", flex: 1 }}>
                <span style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", fontSize: "12px", fontWeight: 600, color: "#999" }}>₦</span>
                <input type="number" placeholder="Custom amount" value={walletCustom}
                  onChange={(e) => { setWalletCustom(e.target.value); setWalletAmount(""); }}
                  style={{ width: "100%", padding: "0.625rem 0.75rem 0.625rem 1.75rem", borderRadius: "0.75rem", border: "1px solid #EAEAEA", fontSize: "12px", fontFamily: "'JetBrains Mono', monospace", outline: "none", transition: "border-color 0.2s ease", boxSizing: "border-box" }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = cfg.colors.primary; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "#EAEAEA"; }}
                />
              </div>
              <button onClick={handleWalletFunding}
                disabled={walletLoading || (!walletAmount && !walletCustom)}
                style={{ padding: "0.625rem 1.25rem", borderRadius: "9999px", fontSize: "12px", fontWeight: 600, cursor: walletLoading || (!walletAmount && !walletCustom) ? "not-allowed" : "pointer", backgroundColor: cfg.colors.primary, color: "#ffffff", border: "none", transition: "all 0.2s ease", opacity: walletLoading || (!walletAmount && !walletCustom) ? 0.5 : 1, whiteSpace: "nowrap" }}>
                {walletLoading ? "Processing..." : "Fund Wallet"}
              </button>
            </div>
          </div>
        </Card>
      </FadeInUp>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem", marginBottom: "2rem" }}>
        <FadeInUp delay={400}>
          <Card padding="1.5rem">
            <div style={{ marginBottom: "1rem" }}>
              <ColorfulBadge label="Quick Actions" color={cfg.colors.primary} />
              <h2 style={{ fontSize: "1.125rem", fontWeight: 500, color: "#1A1A1A", marginTop: "0.75rem" }}>My Circles</h2>
              <p style={{ fontSize: "12px", color: "#717171", fontWeight: 300, marginTop: "0.25rem" }}>Select a circle and make your contribution.</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1rem" }}>
              {groups.length > 0 ? groups.slice(0, 3).map((g) => (
                <a key={g.groupId} href="/groups"
                  style={{ padding: "0.75rem", borderRadius: "0.75rem", cursor: "pointer", transition: "all 0.2s ease", textDecoration: "none", display: "block" }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#F9FAFB"; e.currentTarget.style.transform = "translateX(4px)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.transform = "translateX(0)"; }}>
                  <span style={{ fontSize: "12px", fontWeight: 600, color: "#2D2D2D", display: "block" }}>{g.groupName}</span>
                  <span style={{ fontSize: "10px", color: "#717171", fontWeight: 300 }}>{g.cycleFrequency} contributions &middot; {formatNaira(g.currentAmount)} saved</span>
                </a>
              )) : (
                <div style={{ padding: "1rem", textAlign: "center", color: "#999", fontSize: "12px" }}>
                  No circles yet. <a href="/groups" style={{ color: cfg.colors.primary }}>Create one</a>
                </div>
              )}
            </div>
            <a href="/groups" style={{ display: "block", textAlign: "center", padding: "0.625rem 1rem", borderRadius: "9999px", fontSize: "13px", fontWeight: 600, color: cfg.colors.primary, border: `1px solid ${cfg.colors.primary}30`, backgroundColor: `${cfg.colors.primary}08`, textDecoration: "none", transition: "all 0.2s ease" }}>
              View All Circles &rarr;
            </a>
          </Card>
        </FadeInUp>

        <FadeInUp delay={500}>
          <Card padding="1.5rem">
            <div style={{ marginBottom: "1rem" }}>
              <ColorfulBadge label="Financial Summary" color={cfg.colors.accent} />
              <h2 style={{ fontSize: "1.125rem", fontWeight: 500, color: "#1A1A1A", marginTop: "0.75rem" }}>My Stats</h2>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {[
                { label: "Total Contributed", value: formatNaira(profile?.stats.totalContributed || 0), color: "#4A5D4E" },
                { label: "Total Received", value: formatNaira(profile?.stats.totalReceived || 0), color: "#059669" },
                { label: "Total Donated", value: formatNaira(profile?.stats.totalDonated || 0), color: cfg.colors.accent },
              ].map((m) => (
                <div key={m.label}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.375rem" }}>
                    <span style={{ fontSize: "12px", fontWeight: 500, color: "#2D2D2D" }}>{m.label}</span>
                    <span style={{ fontSize: "12px", fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: m.color }}>{m.value}</span>
                  </div>
                  <div style={{ height: "6px", backgroundColor: "#F0F0F0", borderRadius: "9999px", overflow: "hidden" }}>
                    <div style={{ height: "100%", backgroundColor: m.color, borderRadius: "9999px", width: `${Math.min(100, (parseFloat(m.value.replace(/[₦,]/g, "")) || 0) / 1000)}%`, transition: "width 1s cubic-bezier(0.16, 1, 0.3, 1)" }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </FadeInUp>
      </div>

      <FadeInUp delay={700}>
        <Card padding="1.5rem">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", paddingBottom: "1rem", borderBottom: "1px solid #F0F0F0" }}>
            <div>
              <ColorfulBadge label="Recent Activity" color="#8A7D73" />
              <h2 style={{ fontSize: "1.125rem", fontWeight: 500, color: "#1A1A1A", marginTop: "0.5rem" }}>Contribution History</h2>
            </div>
            <span style={{ fontSize: "10px", fontFamily: "'JetBrains Mono', monospace", color: "#717171" }}>{transactions.length} entries</span>
          </div>
          {transactions.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2rem", color: "#999", fontSize: "13px" }}>
              No transactions yet. <a href="/groups" style={{ color: cfg.colors.primary }}>Join a circle</a> to get started.
            </div>
          ) : (
            <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
              <table style={{ width: "100%", fontSize: "12px", borderCollapse: "collapse", minWidth: "500px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #F0F0F0", color: "#999", textTransform: "uppercase", letterSpacing: "0.1em", fontSize: "9px", fontFamily: "'JetBrains Mono', monospace" }}>
                    <th style={{ paddingBottom: "0.75rem", textAlign: "left", fontWeight: 600 }}>Date</th>
                    <th style={{ paddingBottom: "0.75rem", textAlign: "left", fontWeight: 600 }}>Type</th>
                    <th style={{ paddingBottom: "0.75rem", textAlign: "left", fontWeight: 600 }}>Description</th>
                    <th style={{ paddingBottom: "0.75rem", textAlign: "right", fontWeight: 600 }}>Status</th>
                    <th style={{ paddingBottom: "0.75rem", textAlign: "right", fontWeight: 600 }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t) => {
                    const typeColor = getTypeColor(t.type);
                    return (
                      <tr key={t.id} style={{ borderBottom: "1px solid #F5F5F5", transition: "background-color 0.2s ease" }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#F9FAFB"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}>
                        <td style={{ padding: "0.75rem 0", fontFamily: "'JetBrains Mono', monospace", color: "#717171" }}>
                          {new Date(t.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                        </td>
                        <td style={{ padding: "0.75rem 0" }}>
                          <span style={{ padding: "0.125rem 0.5rem", borderRadius: "0.375rem", fontSize: "9px", fontWeight: 700, textTransform: "uppercase", fontFamily: "'JetBrains Mono', monospace", backgroundColor: `${typeColor}12`, color: typeColor, border: `1px solid ${typeColor}20` }}>{getTypeLabel(t.type)}</span>
                        </td>
                        <td style={{ padding: "0.75rem 0", fontWeight: 500, color: "#2D2D2D" }}>{t.description || getTypeLabel(t.type)}</td>
                        <td style={{ padding: "0.75rem 0", textAlign: "right" }}>
                          <span style={{ fontSize: "9px", fontWeight: 700, color: t.status === "completed" ? "#059669" : t.status === "pending" ? "#D97706" : "#717171", backgroundColor: t.status === "completed" ? "#ECFDF5" : t.status === "pending" ? "#FFFBEB" : "#F3F4F6", padding: "0.125rem 0.5rem", borderRadius: "0.375rem" }}>{t.status}</span>
                        </td>
                        <td style={{ padding: "0.75rem 0", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: t.type === "payout" || t.type === "funding" ? "#059669" : "#2D2D2D" }}>{formatNaira(t.amount)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </FadeInUp>
    </div>
  );
}
