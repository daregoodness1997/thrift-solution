"use client";

import { useState, useEffect } from "react";
import { config } from "@thrift/config";
import { Card, ColorfulBadge, FadeInUp, StatCard, StaggerChildren } from "@thrift/ui";
import { formatNaira } from "@thrift/utils";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/PageHeader";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface Donation {
  id: string;
  type: string;
  amount?: number;
  currency?: string;
  itemName?: string;
  itemCategory?: string;
  itemCondition?: string;
  status: string;
  paymentProvider?: string;
  createdAt: string;
  group?: { id: string; name: string } | null;
}

interface DonationStats {
  totalDonated: number;
  totalCount: number;
  completedCount: number;
}

export default function DonationsPage() {
  const { token } = useAuth();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [stats, setStats] = useState<DonationStats>({ totalDonated: 0, totalCount: 0, completedCount: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "monetary" | "item">("all");

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    fetch(`${API_URL}/api/donations`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setDonations(data.data.donations);
          setStats(data.data.stats);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = donations.filter((d) => filter === "all" || d.type === filter);

  const statusColor = (status: string) => {
    switch (status) {
      case "completed": return "#059669";
      case "pending": return "#D97706";
      case "failed": return "#DC2626";
      default: return "#717171";
    }
  };

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "clamp(1rem, 3vw, 2rem)" }}>
      <PageHeader
        badgeLabel="Donation History"
        badgeColor={config.colors.accent}
        heading="My"
        accentText="Donations"
        description="Track all your monetary and item contributions."
      />

      <StaggerChildren staggerDelay={100} style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.5rem", marginBottom: "2rem" }}>
        <StatCard label="Total Donated" value={formatNaira(stats.totalDonated)} change="All time" positive variant="default" />
        <StatCard label="Total Donations" value={String(stats.totalCount)} change={`${stats.completedCount} completed`} positive variant="warm" />
        <StatCard label="Item Donations" value={String(donations.filter((d) => d.type === "item").length)} change="Items contributed" positive variant="default" />
      </StaggerChildren>

      <FadeInUp delay={400}>
        <Card padding="1.5rem">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", paddingBottom: "1rem", borderBottom: "1px solid #F0F0F0" }}>
            <div>
              <ColorfulBadge label="All Donations" color="#8A7D73" />
              <h2 style={{ fontSize: "1.125rem", fontWeight: 500, color: "#1A1A1A", marginTop: "0.5rem" }}>Donation Records</h2>
            </div>
            <div style={{ display: "flex", gap: "0.25rem", backgroundColor: "#F5F7F5", borderRadius: "0.5rem", padding: "0.2rem" }}>
              {(["all", "monetary", "item"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  style={{
                    padding: "0.375rem 0.75rem",
                    borderRadius: "0.375rem",
                    fontSize: "11px",
                    fontWeight: 600,
                    border: "none",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    backgroundColor: filter === f ? "#ffffff" : "transparent",
                    color: filter === f ? config.colors.primary : "#717171",
                    textTransform: "capitalize",
                  }}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "3rem", color: "#999", fontSize: "13px" }}>Loading...</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem", color: "#999", fontSize: "13px" }}>
              {filter === "all" ? "No donations yet." : `No ${filter} donations.`}
              <br />
              <a href="/donate" style={{ color: config.colors.primary, textDecoration: "none", fontWeight: 600, fontSize: "12px", marginTop: "0.5rem", display: "inline-block" }}>
                Make your first donation &rarr;
              </a>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", fontSize: "12px", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #F0F0F0", color: "#999", textTransform: "uppercase", letterSpacing: "0.1em", fontSize: "9px", fontFamily: "'JetBrains Mono', monospace" }}>
                    <th style={{ paddingBottom: "0.75rem", textAlign: "left", fontWeight: 600 }}>Date</th>
                    <th style={{ paddingBottom: "0.75rem", textAlign: "left", fontWeight: 600 }}>Type</th>
                    <th style={{ paddingBottom: "0.75rem", textAlign: "left", fontWeight: 600 }}>Details</th>
                    <th style={{ paddingBottom: "0.75rem", textAlign: "left", fontWeight: 600 }}>Circle</th>
                    <th style={{ paddingBottom: "0.75rem", textAlign: "right", fontWeight: 600 }}>Status</th>
                    <th style={{ paddingBottom: "0.75rem", textAlign: "right", fontWeight: 600 }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((d) => (
                    <tr key={d.id} style={{ borderBottom: "1px solid #F5F5F5", transition: "background-color 0.2s ease" }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#F9FAFB"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}>
                      <td style={{ padding: "0.75rem 0", fontFamily: "'JetBrains Mono', monospace", color: "#717171" }}>
                        {new Date(d.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                      </td>
                      <td style={{ padding: "0.75rem 0" }}>
                        <span style={{ padding: "0.125rem 0.5rem", borderRadius: "0.375rem", fontSize: "9px", fontWeight: 700, textTransform: "uppercase", fontFamily: "'JetBrains Mono', monospace", backgroundColor: d.type === "monetary" ? `${config.colors.primary}12` : "#FEF3C7", color: d.type === "monetary" ? config.colors.primary : "#D97706", border: `1px solid ${d.type === "monetary" ? `${config.colors.primary}20` : "#FDE68A"}` }}>
                          {d.type === "monetary" ? "Funds" : "Item"}
                        </span>
                      </td>
                      <td style={{ padding: "0.75rem 0", fontWeight: 500, color: "#2D2D2D" }}>
                        {d.type === "monetary"
                          ? `${d.paymentProvider ? d.paymentProvider.charAt(0).toUpperCase() + d.paymentProvider.slice(1) : "Payment"}`
                          : d.itemName || "Item donation"}
                      </td>
                      <td style={{ padding: "0.75rem 0" }}>
                        {d.group ? (
                          <span style={{ fontSize: "11px", color: "#717171" }}>{d.group.name}</span>
                        ) : (
                          <span style={{ fontSize: "11px", color: "#CCC" }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: "0.75rem 0", textAlign: "right" }}>
                        <span style={{ fontSize: "9px", fontWeight: 700, color: statusColor(d.status), backgroundColor: `${statusColor(d.status)}12`, padding: "0.125rem 0.5rem", borderRadius: "0.375rem", textTransform: "capitalize" }}>
                          {d.status}
                        </span>
                      </td>
                      <td style={{ padding: "0.75rem 0", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: "#2D2D2D" }}>
                        {d.type === "monetary" && d.amount ? formatNaira(d.amount) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </FadeInUp>
    </div>
  );
}
