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
        <span className="text-gray-500">
          {new Date(d.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
        </span>
      ),
    },
    {
      key: "type",
      header: "Type",
      render: (d) => (
        <span className="rounded-[0.375rem] border px-2 py-0.5 text-[9px] font-bold uppercase font-mono" style={{ backgroundColor: d.type === "monetary" ? `${config.colors.primary}12` : "#FEF3C7", color: d.type === "monetary" ? config.colors.primary : "#D97706", borderColor: d.type === "monetary" ? `${config.colors.primary}20` : "#FDE68A" }}>
          {d.type === "monetary" ? "Funds" : "Item"}
        </span>
      ),
    },
    {
      key: "details",
      header: "Details",
      render: (d) => (
        <span className="font-medium text-brand-dark">
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
        <span className="text-[11px] text-gray-500">{d.group.name}</span>
      ) : (
        <span className="text-[11px] text-gray-300">—</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      align: "right",
      render: (d) => (
        <span className="rounded-[0.375rem] px-2 py-0.5 text-[9px] font-bold capitalize" style={{ color: statusColor(d.status), backgroundColor: `${statusColor(d.status)}12` }}>
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
        <span className="font-semibold text-brand-dark">
          {d.type === "monetary" && d.amount ? formatNaira(d.amount) : "—"}
        </span>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-[1280px] p-[clamp(1rem,3vw,2rem)]">
      <PageHeader
        badgeLabel="Donation History"
        badgeColor={config.colors.accent}
        heading="My"
        accentText="Donations"
        description="Track all your monetary and item contributions."
      />

      <StaggerChildren staggerDelay={100} className="mb-8 grid grid-cols-3 gap-6">
        <StatCard label="Total Donated" value={formatNaira(stats.totalDonated)} change="All time" positive variant="default" />
        <StatCard label="Total Donations" value={String(stats.totalCount)} change={`${stats.completedCount} completed`} positive variant="warm" />
        <StatCard label="Item Donations" value={String(stats.totalCount - stats.completedCount)} change="Items contributed" positive variant="default" />
      </StaggerChildren>

      <FadeInUp delay={400}>
        <Card padding="1.5rem">
          <div className="mb-6 flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <ColorfulBadge label="All Donations" color="#8A7D73" />
              <h2 className="mt-2 text-[1.125rem] font-medium text-brand-dark">Donation Records</h2>
            </div>
            <div className="flex gap-1 rounded-lg bg-[#F5F7F5] p-1">
              {(["all", "monetary", "item"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className="cursor-pointer rounded-[0.375rem] border-0 px-3 py-1.5 text-[11px] font-semibold capitalize transition-all duration-200"
                  style={{
                    backgroundColor: filter === f ? "#ffffff" : "transparent",
                    color: filter === f ? config.colors.primary : "#717171",
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
        <a href="/donate" className="text-[12px] font-semibold no-underline" style={{ color: config.colors.primary }}>
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
