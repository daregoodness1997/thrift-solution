"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { config } from "@thrift/config";
import { Card, FadeInUp, StaggerChildren } from "@thrift/ui";
import { formatNaira } from "@thrift/utils";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/PageHeader";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface AdminStats {
  users: { total: number; newThisMonth: number };
  pending: { kyc: number; loans: number; payoutRequests: number };
  circles: { activeAccounts: number; totalPrincipal: number; totalInterest: number; assetsUnderManagement: number };
  donations: { completedCount: number; completedAmount: number };
  wallet: { totalCredited: number; totalDebited: number };
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <Card padding="1.25rem">
      <span style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#999", fontWeight: 700, display: "block" }}>{label}</span>
      <span style={{ fontSize: "1.5rem", fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: accent || "#1A1A1A", display: "block", marginTop: "0.25rem" }}>{value}</span>
    </Card>
  );
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
    return <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "clamp(1rem, 3vw, 2rem)" }}><div style={{ textAlign: "center", padding: "4rem", color: "#999", fontSize: "13px" }}>Loading admin overview...</div></div>;
  }

  if (!isAdmin) return null;

  const totalPending = stats ? stats.pending.kyc + stats.pending.loans + stats.pending.payoutRequests : 0;

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "clamp(1rem, 3vw, 2rem)" }}>
      <PageHeader
        badgeLabel="Admin"
        heading="Portal"
        accentText="Overview"
        description="Platform-wide metrics and pending actions."
        right={
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <Link href="/admin/users" style={linkBtn(false)}>Users</Link>
            <Link href="/admin/audit-logs" style={linkBtn(false)}>Audit Log</Link>
          </div>
        }
      />

      {stats && (
        <>
          <StaggerChildren staggerDelay={80} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
            <StatCard label="Total Users" value={String(stats.users.total)} />
            <StatCard label="New This Month" value={`+${stats.users.newThisMonth}`} accent={config.colors.primary} />
            <StatCard label="Assets Under Mgmt" value={formatNaira(stats.circles.assetsUnderManagement)} accent={config.colors.primary} />
            <StatCard label="Active Circle Accounts" value={String(stats.circles.activeAccounts)} />
          </StaggerChildren>

          <FadeInUp delay={200}>
            <Card padding="1.5rem" style={{ marginBottom: "1.5rem" }}>
              <span style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#999", fontWeight: 700, display: "block", marginBottom: "1rem" }}>
                Pending Actions ({totalPending})
              </span>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem" }}>
                <PendingItem label="KYC Reviews" count={stats.pending.kyc} href="/kyc/admin" />
                <PendingItem label="Loan Requests" count={stats.pending.loans} href="/admin/loans" />
                <PendingItem label="Payout Requests" count={stats.pending.payoutRequests} href="/clearance-management" />
              </div>
            </Card>
          </FadeInUp>

          <StaggerChildren staggerDelay={80} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem" }}>
            <StatCard label="Circle Principal" value={formatNaira(stats.circles.totalPrincipal)} />
            <StatCard label="Interest Accrued" value={formatNaira(stats.circles.totalInterest)} accent={config.colors.primary} />
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
    <Link href={href} style={{ textDecoration: "none", display: "block", padding: "1rem", borderRadius: "0.75rem", border: `1px solid ${count > 0 ? "#FDE68A" : "#F0F0F0"}`, backgroundColor: count > 0 ? "#FFFBEB" : "#FAFAFA", transition: "all 0.2s ease" }}>
      <span style={{ fontSize: "1.75rem", fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: count > 0 ? "#D97706" : "#1A1A1A", display: "block" }}>{count}</span>
      <span style={{ fontSize: "12px", color: "#717171", fontWeight: 500 }}>{label}</span>
    </Link>
  );
}

function linkBtn(active: boolean): React.CSSProperties {
  return {
    padding: "0.375rem 0.75rem",
    borderRadius: "0.5rem",
    fontSize: "12px",
    fontWeight: 600,
    textDecoration: "none",
    border: `1px solid ${config.colors.primary}30`,
    backgroundColor: active ? config.colors.primary : `${config.colors.primary}08`,
    color: active ? "#fff" : config.colors.primary,
  };
}
