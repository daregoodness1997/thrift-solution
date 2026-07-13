"use client";

import { useState, useEffect, useCallback } from "react";
import { config } from "@thrift/config";
import { Card, ColorfulBadge, FadeInUp, StatCard, StaggerChildren } from "@thrift/ui";
import { formatNaira } from "@thrift/utils";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/PageHeader";
import { DataTable, Column, PaginationInfo } from "@/components/DataTable";

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

const PAGE_SIZE = 20;

export default function DonationsPage() {
  const { token } = useAuth();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [stats, setStats] = useState<DonationStats>({ totalDonated: 0, totalCount: 0, completedCount: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "monetary" | "item">("all");
  const [pagination, setPagination] = useState<PaginationInfo>({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 });

  const fetchDonations = useCallback(async (page: number) => {
    if (!token) { setLoading(false); return; }
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
      if (filter !== "all") params.set("type", filter);
      const res = await fetch(`${API_URL}/api/donations?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setDonations(data.data.donations);
        setStats(data.data.stats);
        setPagination({ page: data.data.page, limit: data.data.limit, total: data.data.total, totalPages: data.data.totalPages });
      }
    } catch {}
    setLoading(false);
  }, [token, filter]);

  useEffect(() => { fetchDonations(1); }, [fetchDonations, filter]);

  const filtered = donations;

  const statusColor = (status: string) => {
    switch (status) {
      case "completed": return "#059669";
      case "pending": return "#D97706";
      case "failed": return "#DC2626";
      default: return "#717171";
    }
  };

  const columns: Column<Donation>[] = [
    {
      key: "createdAt",
      header: "Date",
      mono: true,
      render: (d) => (
        <span style={{ color: "#717171" }}>
          {new Date(d.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
        </span>
      ),
    },
    {
      key: "type",
      header: "Type",
      render: (d) => (
        <span style={{ padding: "0.125rem 0.5rem", borderRadius: "0.375rem", fontSize: "9px", fontWeight: 700, textTransform: "uppercase", fontFamily: "'JetBrains Mono', monospace", backgroundColor: d.type === "monetary" ? `${config.colors.primary}12` : "#FEF3C7", color: d.type === "monetary" ? config.colors.primary : "#D97706", border: `1px solid ${d.type === "monetary" ? `${config.colors.primary}20` : "#FDE68A"}` }}>
          {d.type === "monetary" ? "Funds" : "Item"}
        </span>
      ),
    },
    {
      key: "details",
      header: "Details",
      render: (d) => (
        <span style={{ fontWeight: 500, color: "#2D2D2D" }}>
          {d.type === "monetary"
            ? `${d.paymentProvider ? d.paymentProvider.charAt(0).toUpperCase() + d.paymentProvider.slice(1) : "Payment"}`
            : d.itemName || "Item donation"}
        </span>
      ),
    },
    {
      key: "group",
      header: "Circle",
      render: (d) => d.group ? (
        <span style={{ fontSize: "11px", color: "#717171" }}>{d.group.name}</span>
      ) : (
        <span style={{ fontSize: "11px", color: "#CCC" }}>—</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      align: "right",
      render: (d) => (
        <span style={{ fontSize: "9px", fontWeight: 700, color: statusColor(d.status), backgroundColor: `${statusColor(d.status)}12`, padding: "0.125rem 0.5rem", borderRadius: "0.375rem", textTransform: "capitalize" }}>
          {d.status}
        </span>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      mono: true,
      render: (d) => (
        <span style={{ fontWeight: 600, color: "#2D2D2D" }}>
          {d.type === "monetary" && d.amount ? formatNaira(d.amount) : "—"}
        </span>
      ),
    },
  ];

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
        <StatCard label="Item Donations" value={String(stats.totalCount - stats.completedCount)} change="Items contributed" positive variant="default" />
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

          <DataTable
            columns={columns}
            data={filtered}
            pagination={pagination}
            onPageChange={(page) => fetchDonations(page)}
            loading={loading}
            emptyMessage={filter === "all" ? "No donations yet." : `No ${filter} donations.`}
            emptyAction={
              <a href="/donate" style={{ color: config.colors.primary, textDecoration: "none", fontWeight: 600, fontSize: "12px" }}>
                Make your first donation &rarr;
              </a>
            }
            accentColor={config.colors.accent}
          />
        </Card>
      </FadeInUp>
    </div>
  );
}
