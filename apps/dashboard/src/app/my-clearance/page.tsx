"use client";

import { useState, useEffect, useCallback } from "react";
import { config, BrandConfig } from "@thrift/config";
import {
  Card,
  FadeInUp,
  StatCard,
  StaggerChildren,
} from "@thrift/ui";
import { formatNaira } from "@thrift/utils";
import { useAuth } from "@/lib/auth-context";
import { BadgeCheck, PiggyBank, Clock, Filter } from "lucide-react";
import { DataTable, Column, PaginationInfo } from "@/components/DataTable";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

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
    circle: {
      id: string;
      name: string;
      amount: number;
      durationMonths: number;
      interestRateAnnual: number;
    };
  };
}

const statusColor = (status: string) => {
  switch (status) {
    case "cleared":
    case "disbursed":
    case "approved":
      return "#059669";
    case "disbursement_failed":
    case "declined":
      return "#DC2626";
    case "pending":
      return "#D97706";
    default:
      return "#717171";
  }
};

const PAGE_SIZE = 20;

type ClearanceRow =
  | (ClearanceItem & { _type: "group" })
  | (PayoutRequest & { _type: "circle" });

function normalizeGroup(c: ClearanceItem): ClearanceRow {
  return { ...c, _type: "group" };
}

function normalizeCircle(r: PayoutRequest): ClearanceRow {
  return { ...r, _type: "circle" };
}

export default function MyClearancePage() {
  const { token } = useAuth();
  const [cfg] = useState<BrandConfig>(config);
  const [activeTab, setActiveTab] = useState<"group" | "circle">("circle");

  const [clearances, setClearances] = useState<ClearanceItem[]>([]);
  const [stats, setStats] = useState({ totalPayouts: 0, totalContributed: 0 });
  const [loading, setLoading] = useState(true);

  const [paginatedItems, setPaginatedItems] = useState<ClearanceItem[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 1,
  });

  const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>([]);
  const [prLoading, setPrLoading] = useState(false);
  const [prPagination, setPrPagination] = useState<PaginationInfo>({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 1,
  });

  const fetchClearances = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/clearances`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setClearances(data.data.clearances || []);
        setStats({
          totalPayouts: data.data.totalPayouts || 0,
          totalContributed: data.data.totalContributed || 0,
        });
      }
    } catch {}
    setLoading(false);
  }, [token, API_URL]);

  const fetchPaginatedList = useCallback(async () => {
    if (!token) return;
    setListLoading(true);
    try {
      const res = await fetch(
        `${API_URL}/api/clearances/list?page=${pagination.page}&limit=${PAGE_SIZE}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const data = await res.json();
      if (data.success) {
        setPaginatedItems(data.data.items || []);
        setPagination({
          page: data.data.page || pagination.page,
          limit: data.data.limit || PAGE_SIZE,
          total: data.data.total || 0,
          totalPages: data.data.totalPages || 1,
        });
      }
    } catch {}
    setListLoading(false);
  }, [token, pagination.page, API_URL]);

  const fetchPayoutRequests = useCallback(async () => {
    if (!token) return;
    setPrLoading(true);
    try {
      const res = await fetch(
        `${API_URL}/api/circles/payout-requests/my?page=${prPagination.page}&limit=${PAGE_SIZE}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await res.json();
      if (data.success) {
        setPayoutRequests(data.data.items || []);
        setPrPagination({
          page: data.data.page || prPagination.page,
          limit: data.data.limit || PAGE_SIZE,
          total: data.data.total || 0,
          totalPages: data.data.totalPages || 1,
        });
      }
    } catch {}
    setPrLoading(false);
  }, [token, prPagination.page, API_URL]);

  useEffect(() => {
    fetchClearances();
  }, [fetchClearances]);
  useEffect(() => {
    fetchPaginatedList();
  }, [fetchPaginatedList]);
  useEffect(() => {
    fetchPayoutRequests();
  }, [fetchPayoutRequests]);

  const pendingRequests = payoutRequests.filter((r) => r.status === "pending");

  const groupColumns: Column<ClearanceRow>[] = [
    {
      key: "group",
      header: "Group",
      render: (row) =>
        row._type === "group" ? (
          <div>
            <span className="block font-medium text-slate-900 dark:text-white">
              {row.groupName}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Cycle {row.cycleNumber} payout
            </span>
          </div>
        ) : null,
    },
    {
      key: "contributed",
      header: "My Contribution",
      mono: true,
      render: (row) =>
        row._type === "group" ? (
          <span className="font-semibold text-slate-900 dark:text-white">
            {formatNaira(row.contributed)}
          </span>
        ) : null,
    },
    {
      key: "payout",
      header: "Payout Amount",
      align: "right",
      mono: true,
      render: (row) =>
        row._type === "group" ? (
          <span className="font-semibold text-emerald-600">
            {formatNaira(row.payoutAmount)}
          </span>
        ) : null,
    },
    {
      key: "clearedDate",
      header: "Cleared On",
      align: "right",
      mono: true,
      render: (row) =>
        row._type === "group" ? (
          row.clearedDate ? (
            <span className="text-slate-500 dark:text-slate-400">
              {new Date(row.clearedDate).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
          ) : (
            <span className="text-slate-300 dark:text-slate-600">—</span>
          )
        ) : null,
    },
    {
      key: "status",
      header: "Status",
      align: "right",
      render: (row) =>
        row._type === "group" ? (
          <span
            className="rounded-[0.375rem] px-2 py-0.5 text-[9px] font-bold capitalize"
            style={{
              color: statusColor(row.status),
              backgroundColor: `${statusColor(row.status)}12`,
            }}
          >
            {row.status}
          </span>
        ) : null,
    },
  ];

  const circleColumns: Column<ClearanceRow>[] = [
    {
      key: "circle",
      header: "Circle",
      render: (row) =>
        row._type === "circle" ? (
          <div>
            <span className="block font-medium text-slate-900 dark:text-white">
              {row.circleAccount.circle.name}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              {formatNaira(row.circleAccount.principalAmount)} &middot;{" "}
              {row.circleAccount.circle.interestRateAnnual}% p.a.
            </span>
          </div>
        ) : null,
    },
    {
      key: "principal",
      header: "Principal",
      mono: true,
      render: (row) =>
        row._type === "circle" ? (
          <span className="font-semibold" style={{ color: "#2563EB" }}>
            {formatNaira(row.circleAccount.principalAmount)}
          </span>
        ) : null,
    },
    {
      key: "interest",
      header: "Interest",
      mono: true,
      render: (row) =>
        row._type === "circle" ? (
          <span className="font-semibold text-emerald-600">
            {formatNaira(row.circleAccount.interestEarned)}
          </span>
        ) : null,
    },
    {
      key: "total",
      header: "Total Payout",
      mono: true,
      render: (row) =>
        row._type === "circle" ? (
          <span className="font-semibold text-slate-900 dark:text-white">
            {formatNaira(row.amount)}
          </span>
        ) : null,
    },
    {
      key: "requested",
      header: "Requested",
      align: "right",
      mono: true,
      render: (row) =>
        row._type === "circle" ? (
          <span className="text-slate-500 dark:text-slate-400">
            {new Date(row.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </span>
        ) : null,
    },
    {
      key: "status",
      header: "Status",
      align: "right",
      render: (row) =>
        row._type === "circle" ? (
          <span
            className="rounded-[0.375rem] px-2 py-0.5 text-[9px] font-bold capitalize"
            style={{
              color: statusColor(row.status),
              backgroundColor: `${statusColor(row.status)}12`,
            }}
          >
            {row.status}
          </span>
        ) : null,
    },
  ];

  const columns = activeTab === "group" ? groupColumns : circleColumns;
  const rows: ClearanceRow[] =
    activeTab === "group"
      ? paginatedItems.map(normalizeGroup)
      : payoutRequests.map(normalizeCircle);

  const activePagination = activeTab === "group" ? pagination : prPagination;
  const activeLoading = activeTab === "group" ? listLoading : prLoading;
  const setActivePage = (page: number) => {
    if (activeTab === "group") setPagination((p) => ({ ...p, page }));
    else setPrPagination((p) => ({ ...p, page }));
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-[1280px] p-[clamp(1rem,3vw,2rem)]">
        <div className="p-16 text-center text-[13px] text-slate-400 dark:text-slate-500">
          Loading clearances...
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1280px] p-[clamp(1rem,3vw,2rem)]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1">
              <BadgeCheck className="w-3.5 h-3.5 text-blue-500" />
              <span>Clearance History</span>
            </span>
          </div>
          <h3 className="font-display font-bold text-xl sm:text-2xl text-slate-900 dark:text-white mt-1">My <span className="bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 bg-clip-text text-transparent">Clearance</span></h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">Track your payout clearances and circle progress.</p>
        </div>
      </div>

      <StaggerChildren
        staggerDelay={100}
        className="mb-8 grid grid-cols-3 gap-6"
      >
        <StatCard
          label="Total Payouts Received"
          value={formatNaira(stats.totalPayouts)}
          change="All time"
          positive
          variant="default"
        />
        <StatCard
          label="Total Contributed"
          value={formatNaira(stats.totalContributed)}
          change="To circles"
          positive
          variant="warm"
        />
        <StatCard
          label="Pending Requests"
          value={String(pendingRequests.length)}
          change={
            pendingRequests.length > 0 ? "Awaiting approval" : "All clear"
          }
          positive
          variant={pendingRequests.length > 0 ? "warm" : "default"}
        />
      </StaggerChildren>

      <FadeInUp delay={400}>
        <Card padding="1.5rem" className="rounded-3xl">
          <div className="mb-6 flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80 pb-4">
            <div>
              <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 w-fit">
                <BadgeCheck className="w-3.5 h-3.5 text-blue-500" />
                <span>{activeTab === "group" ? "Group Clearances" : "Circle Payouts"}</span>
              </span>
              <h2 className="mt-2 text-[1.125rem] font-medium text-slate-900 dark:text-white">
                {activeTab === "group"
                  ? "My Payout Clearances"
                  : "My Circle Payout Requests"}
              </h2>
            </div>
            <div className="flex gap-1 rounded-lg bg-slate-100 dark:bg-slate-800 p-1">
              {(["group", "circle"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className="cursor-pointer rounded-[0.375rem] border-0 px-3 py-1.5 text-[11px] font-semibold transition-all duration-200"
                  style={{
                    backgroundColor:
                      activeTab === t ? "#ffffff" : "transparent",
                    color: activeTab === t ? "#2563EB" : "#717171",
                  }}
                >
                  {t === "group" ? "Group" : "Circle"}
                </button>
              ))}
            </div>
          </div>

          <DataTable
            columns={columns}
            data={rows}
            pagination={activePagination}
            onPageChange={setActivePage}
            loading={activeLoading}
            emptyMessage={
              activeTab === "group"
                ? "No clearances yet. Join a circle to start earning payouts."
                : "No circle payout requests yet. Maturity payouts will appear here when requested."
            }
            accentColor="#2563EB"
          />
        </Card>
      </FadeInUp>

      <FadeInUp delay={500} className="mt-6">
        <Card padding="1.5rem" className="rounded-3xl">
          <div className="mb-4">
            <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 w-fit">
              <Clock className="w-3.5 h-3.5 text-blue-500" />
              <span>How It Works</span>
            </span>
            <h2 className="mt-2 text-[1.125rem] font-medium text-slate-900 dark:text-white">
              Clearance Process
            </h2>
          </div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
            {[
              {
                step: 1,
                title: "Contribute",
                desc: "Make your contributions each cycle to build your eligibility.",
                color: "#2563EB",
              },
              {
                step: 2,
                title: "Build Eligibility",
                desc: "Complete the required cycles to qualify for a payout.",
                color: "#8A7D73",
              },
              {
                step: 3,
                title: "Get Cleared",
                desc: "Once approved, your payout is credited to your wallet.",
                color: "#059669",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="rounded-2xl bg-slate-50 dark:bg-slate-800/60 p-4 text-center"
              >
                <div
                  className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full font-mono text-[13px] font-bold"
                  style={{
                    backgroundColor: `${item.color}15`,
                    color: item.color,
                  }}
                >
                  {item.step}
                </div>
                <span className="block text-xs font-semibold text-slate-900 dark:text-white">
                  {item.title}
                </span>
                <span className="text-[10px] font-light text-slate-500 dark:text-slate-400">
                  {item.desc}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </FadeInUp>
    </div>
  );
}
