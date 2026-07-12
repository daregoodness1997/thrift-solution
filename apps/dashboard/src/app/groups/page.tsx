"use client";

import { useState, useEffect, useCallback } from "react";
import { config, BrandConfig } from "@thrift/config";
import { Card, Button, ColorfulBadge, ColorBar } from "@thrift/ui";
import { formatNaira } from "@thrift/utils";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/PageHeader";

const fallback = config;

interface UserGroup {
  groupId: string;
  groupName: string;
  groupDescription?: string;
  role: string;
  joinedAt: string;
  targetAmount: number;
  currentAmount: number;
  memberCount: number;
  cycleFrequency: string;
  groupStatus: string;
}

const cycleColors: Record<string, { bg: string; color: string; border: string }> = {
  monthly: { bg: "#F5F7F5", color: "#4A5D4E", border: "#E1E8E1" },
  weekly: { bg: "#ECFDF5", color: "#065F46", border: "#D1FAE5" },
  "bi-weekly": { bg: "#FFFBEB", color: "#92400E", border: "#FDE68A" },
  "biweekly": { bg: "#FFFBEB", color: "#92400E", border: "#FDE68A" },
};

export default function GroupsPage() {
  const { token } = useAuth();
  const [cfg, setCfg] = useState<BrandConfig>(fallback);
  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [loading, setLoading] = useState(true);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  useEffect(() => {
    fetch(`${API_URL}/api/config`)
      .then((r) => r.json())
      .then((data) => { if (data?.name) setCfg((p) => ({ ...p, ...data })); })
      .catch(() => {});
  }, [API_URL]);

  const fetchGroups = useCallback(async () => {
    if (!token) { setLoading(false); return; }
    try {
      const res = await fetch(`${API_URL}/api/user/groups`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setGroups(data.data || []);
    } catch {}
    setLoading(false);
  }, [token, API_URL]);

  useEffect(() => { fetchGroups(); }, [fetchGroups]);

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "clamp(1rem, 3vw, 2rem)" }}>
      <PageHeader
        badgeLabel="Thrift Circles"
        heading="My Ajo"
        accentText="Circles"
        description="Manage your contribution groups and track payouts."
        right={<Button>Create New Circle</Button>}
      />

      {loading ? (
        <div style={{ textAlign: "center", padding: "4rem", color: "#999", fontSize: "13px" }}>Loading circles...</div>
      ) : groups.length === 0 ? (
        <Card padding="2rem">
          <div style={{ textAlign: "center", color: "#999", fontSize: "13px" }}>
            <p>You haven&apos;t joined any circles yet.</p>
            <a href="/groups" style={{ color: cfg.colors.primary, fontWeight: 600, fontSize: "12px", marginTop: "0.5rem", display: "inline-block" }}>Browse available circles &rarr;</a>
          </div>
        </Card>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
          {groups.map((g) => {
            const pct = Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100));
            const cat = cycleColors[g.cycleFrequency.toLowerCase()] || cycleColors.monthly;
            return (
              <Card key={g.groupId} padding="1.5rem">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                  <div>
                    <ColorfulBadge label={g.cycleFrequency} color={cat.color} />
                    <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#1A1A1A", marginTop: "0.5rem" }}>{g.groupName}</h3>
                  </div>
                  {g.role === "admin" && <ColorfulBadge label="Admin" color="#059669" />}
                </div>
                {g.groupDescription && (
                  <p style={{ fontSize: "12px", color: "#717171", fontWeight: 300, lineHeight: 1.7, marginBottom: "1rem" }}>{g.groupDescription}</p>
                )}
                <div style={{ display: "flex", gap: "1.5rem", marginBottom: "1rem" }}>
                  <div>
                    <span style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#999", fontWeight: 700, display: "block" }}>Target Amount</span>
                    <span style={{ fontSize: "14px", fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: "#1A1A1A" }}>{formatNaira(g.targetAmount)}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#999", fontWeight: 700, display: "block" }}>Current Total</span>
                    <span style={{ fontSize: "14px", fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: cat.color }}>{formatNaira(g.currentAmount)}</span>
                  </div>
                </div>
                <div style={{ marginBottom: "0.5rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                    <span style={{ fontSize: "10px", fontFamily: "'JetBrains Mono', monospace", color: "#717171" }}>{pct}% complete</span>
                    <span style={{ fontSize: "10px", fontFamily: "'JetBrains Mono', monospace", color: "#717171" }}>{g.memberCount} members</span>
                  </div>
                  <div style={{ height: "6px", backgroundColor: "#F0F0F0", borderRadius: "9999px", overflow: "hidden" }}>
                    <div style={{ height: "100%", backgroundColor: cat.color, borderRadius: "9999px", width: `${pct}%`, transition: "width 0.5s" }} />
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "0.75rem", borderTop: "1px solid #F0F0F0" }}>
                  <span style={{ fontSize: "10px", color: "#717171" }}>Joined {new Date(g.joinedAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</span>
                  <button style={{ padding: "0.375rem 1rem", borderRadius: "9999px", fontSize: "11px", fontWeight: 600, cursor: "pointer", border: "none", backgroundColor: cat.color, color: "#ffffff" }}>Contribute</button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
