"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { Card, ColorBar, FadeInUp } from "@thrift/ui";
import Pagination from "@/components/Pagination";

const LIMIT = 20;

const ID_TYPE_LABELS: Record<string, string> = {
  bvn: "BVN",
  nin: "NIN",
  drivers_license: "Driver's License",
  international_passport: "Passport",
  voter_card: "Voter's Card",
};

const STATUS_TABS = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "under_review", label: "Under Review" },
  { value: "verified", label: "Verified" },
  { value: "rejected", label: "Rejected" },
];

interface KycSubmission {
  id: string;
  userId: string;
  idType: string;
  idNumber: string;
  idDocumentUrl?: string;
  selfieUrl?: string;
  status: string;
  rejectionReason?: string;
  verifiedAt?: string;
  submittedAt: string;
  createdAt: string;
  user: { id: string; name: string; email: string };
  documents: {
    id: string;
    fileUrl: string;
    fileName: string;
    purpose: string;
  }[];
  auditLogs: { action: string; notes?: string; createdAt: string }[];
}

interface KycStats {
  total: number;
  pending: number;
  underReview: number;
  verified: number;
  rejected: number;
  expired: number;
}

export default function KycAdminPage() {
  const { token } = useAuth();
  const [submissions, setSubmissions] = useState<KycSubmission[]>([]);
  const [stats, setStats] = useState<KycStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedKyc, setSelectedKyc] = useState<KycSubmission | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  const authHeaders: Record<string, string> = token
    ? { Authorization: `Bearer ${token}` }
    : {};

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/kyc/admin/stats`, {
        headers: authHeaders,
      });
      const data = await res.json();
      if (data.success) setStats(data.data);
    } catch {}
  }, []);

  const fetchSubmissions = useCallback(async (status?: string, pageNum?: number) => {
    try {
      const params = new URLSearchParams();
      params.set("page", String(pageNum ?? 1));
      params.set("limit", String(LIMIT));
      if (status && status !== "all") params.set("status", status);
      const res = await fetch(`${API_URL}/api/kyc/admin/submissions?${params}`, { headers: authHeaders });
      const data = await res.json();
      if (data.success) {
        setSubmissions(data.data.items);
        setTotalPages(data.data.totalPages);
        setTotal(data.data.total);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    Promise.all([fetchStats(), fetchSubmissions(undefined, page)]).finally(() =>
      setLoading(false),
    );
  }, [page]);

  useEffect(() => {
    if (!token) return;
    setPage(1);
    setLoading(true);
    fetchSubmissions(activeTab, 1).finally(() => setLoading(false));
  }, [activeTab, token, fetchSubmissions]);

  const handleAction = async (
    kycId: string,
    action: "approve" | "reject" | "review",
  ) => {
    setActionLoading(true);
    setMessage("");
    try {
      let res;
      if (action === "approve") {
        res = await fetch(`${API_URL}/api/kyc/admin/${kycId}/approve`, {
          method: "PUT",
          headers: authHeaders,
        });
      } else if (action === "reject") {
        res = await fetch(`${API_URL}/api/kyc/admin/${kycId}/reject`, {
          method: "PUT",
          headers: { ...authHeaders, "Content-Type": "application/json" },
          body: JSON.stringify({ reason: rejectReason }),
        });
      } else {
        res = await fetch(`${API_URL}/api/kyc/admin/${kycId}/review`, {
          method: "PUT",
          headers: authHeaders,
        });
      }
      const data = await res.json();
      if (data.success) {
        setMessage(
          `KYC ${action === "approve" ? "approved" : action === "reject" ? "rejected" : "marked for review"} successfully`,
        );
        setRejectReason("");
        setSelectedKyc(null);
        fetchSubmissions(activeTab);
        fetchStats();
      } else {
        setMessage(data.error || "Action failed");
      }
    } catch {
      setMessage("Network error. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "verified":
        return { color: "#059669", bg: "bg-emerald-50 dark:bg-emerald-900/20", border: "border-emerald-200 dark:border-emerald-800" };
      case "pending":
        return { color: "#2563EB", bg: "bg-blue-50 dark:bg-blue-900/20", border: "border-blue-200 dark:border-blue-800" };
      case "under_review":
        return { color: "#D97706", bg: "bg-amber-50 dark:bg-amber-900/20", border: "border-amber-200 dark:border-amber-800" };
      case "rejected":
        return { color: "#DC2626", bg: "bg-red-50 dark:bg-red-900/20", border: "border-red-200 dark:border-red-800" };
      default:
        return { color: "#6B7280", bg: "bg-slate-50 dark:bg-slate-800", border: "border-slate-200 dark:border-slate-700" };
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-[1200px] p-[clamp(1rem,3vw,2rem)]">
        <ColorBar />
        <div className="flex min-h-[400px] items-center justify-center">
          <span className="text-xs text-slate-400">
            Loading KYC submissions...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1200px] p-[clamp(1rem,3vw,2rem)]">
      <ColorBar />

      <FadeInUp delay={100}>
        <div className="mb-8 mt-8 border-b border-slate-200 dark:border-slate-700 pb-6">
          <span className="rounded-full border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 text-[10px] font-semibold text-blue-600 dark:text-blue-400">Admin Panel</span>
          <h1 className="mt-3 text-[clamp(1.25rem,3vw,1.75rem)] font-light tracking-tight text-slate-900 dark:text-white">
            KYC{" "}
            <span className="font-medium text-blue-600">
              Management
            </span>
          </h1>
        </div>
      </FadeInUp>

      {stats && (
        <FadeInUp delay={200}>
          <div className="mb-8 grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-3">
            {[
              { label: "Total", value: stats.total, color: "#6B7280" },
              { label: "Pending", value: stats.pending, color: "#2563EB" },
              {
                label: "Under Review",
                value: stats.underReview,
                color: "#D97706",
              },
              { label: "Verified", value: stats.verified, color: "#059669" },
              { label: "Rejected", value: stats.rejected, color: "#DC2626" },
            ].map((s) => (
              <Card key={s.label} padding="1rem">
                <span className="block text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400">
                  {s.label}
                </span>
                <span className="mt-1 block font-mono text-2xl font-bold" style={{ color: s.color }}>
                  {s.value}
                </span>
              </Card>
            ))}
          </div>
        </FadeInUp>
      )}

      {message && (
        <FadeInUp delay={250}>
          <div
            className={`mb-6 rounded-2xl px-4 py-3 text-xs font-medium ${
              message.includes("error")
                ? "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400"
                : "bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400"
            }`}
          >
            {message}
          </div>
        </FadeInUp>
      )}

      <FadeInUp delay={300}>
        <div className="mb-6 flex flex-wrap gap-1 rounded-2xl bg-slate-100 dark:bg-slate-800 p-1">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className="cursor-pointer rounded-lg border-none px-4 py-2 text-xs transition-all"
              style={{
                fontWeight: activeTab === tab.value ? 600 : 400,
                backgroundColor:
                  activeTab === tab.value ? "#ffffff" : "transparent",
                color: activeTab === tab.value ? "#2D2D2D" : "#717171",
                boxShadow:
                  activeTab === tab.value
                    ? "0 1px 3px rgba(0,0,0,0.08)"
                    : "none",
              }}
            >
              {tab.label}
              {tab.value === "pending" && stats && stats.pending > 0 && (
                <span className="ml-1.5 rounded-full bg-red-600 px-1.5 py-0.5 text-[9px] font-bold text-white">
                  {stats.pending}
                </span>
              )}
            </button>
          ))}
        </div>
      </FadeInUp>

      <FadeInUp delay={400}>
        {submissions.length === 0 ? (
          <Card padding="2rem">
            <div className="text-center">
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#D1D5DB"
                strokeWidth={1.5}
                className="mx-auto mb-4"
              >
                <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="text-[13px] text-slate-400">
                No submissions found
              </span>
            </div>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {submissions.map((sub) => {
              const ss = getStatusStyle(sub.status);
              return (
                <Card key={sub.id} padding="0" className="overflow-hidden">
                  <div
                    className="cursor-pointer p-4"
                    onClick={() =>
                      setSelectedKyc(selectedKyc?.id === sub.id ? null : sub)
                    }
                  >
                    <div className="flex flex-wrap items-center gap-4">
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                      >
                        {sub.user.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)}
                      </div>
                      <div className="min-w-[150px] flex-1">
                        <span className="block text-[13px] font-semibold text-slate-900 dark:text-white">
                          {sub.user.name}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          {sub.user.email}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                          {ID_TYPE_LABELS[sub.idType] || sub.idType}
                        </span>
                        <span className="font-mono text-[11px] text-slate-400">
                          ...{sub.idNumber.slice(-4)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="block text-[10px] text-slate-400">
                          {new Date(sub.submittedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-[10px] font-semibold capitalize border ${ss.bg} ${ss.border}`}
                        style={{ color: ss.color }}
                      >
                        {sub.status.replace("_", " ")}
                      </span>
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#999"
                        strokeWidth={2}
                        className="transition-transform"
                        style={{
                          transform:
                            selectedKyc?.id === sub.id
                              ? "rotate(180deg)"
                              : "rotate(0)",
                        }}
                      >
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </div>

                    {selectedKyc?.id === sub.id && (
                      <div
                        className="mt-4 border-t border-slate-200/80 dark:border-slate-800/80 pt-4"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="mb-4 grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4">
                          <div>
                            <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.05em] text-slate-400">
                              Documents
                            </span>
                            {sub.documents.length > 0 ? (
                              sub.documents.map((doc) => (
                                <div
                                  key={doc.id}
                                  className="mb-1.5 flex items-center gap-2 rounded-lg bg-slate-50 dark:bg-slate-800 p-2"
                                >
                                  <svg
                                    width="14"
                                    height="14"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="#717171"
                                    strokeWidth={2}
                                  >
                                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                                    <polyline points="14 2 14 8 20 8" />
                                  </svg>
                                  <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-[11px] text-slate-900 dark:text-white">
                                    {doc.fileName}
                                  </span>
                                  <a
                                    href={doc.fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[10px] no-underline text-blue-600 dark:text-blue-400"
                                  >
                                    View
                                  </a>
                                </div>
                              ))
                            ) : (
                              <span className="text-[11px] text-slate-400">
                                No documents uploaded
                              </span>
                            )}
                          </div>

                          <div>
                            <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.05em] text-slate-400">
                              Activity
                            </span>
                            {sub.auditLogs?.slice(0, 3).map((log, i) => (
                              <div
                                key={i}
                                className="py-1.5"
                                style={{
                                  borderBottom:
                                    i < 2 ? "1px solid #F0F0F0" : "none",
                                }}
                              >
                                <span className="text-[11px] capitalize text-slate-900 dark:text-white">
                                  {log.action.replace(/_/g, " ")}
                                </span>
                                {log.notes && (
                                  <span className="block text-[10px] text-slate-500 dark:text-slate-400">
                                    {log.notes}
                                  </span>
                                )}
                                <span className="text-[9px] text-slate-400">
                                  {new Date(log.createdAt).toLocaleString()}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {sub.status === "rejected" && sub.rejectionReason && (
                          <div className="mb-4 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-3">
                            <span className="mb-1 block text-[10px] font-bold uppercase text-red-600 dark:text-red-400">
                              Rejection Reason
                            </span>
                            <span className="text-xs text-slate-900 dark:text-white">
                              {sub.rejectionReason}
                            </span>
                          </div>
                        )}

                        {sub.status !== "verified" && (
                          <div className="flex flex-wrap items-end gap-2">
                            {sub.status === "pending" && (
                              <button
                                onClick={() => handleAction(sub.id, "review")}
                                disabled={actionLoading}
                                className="cursor-pointer rounded-full border-none bg-amber-600 px-4 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed"
                              >
                                Start Review
                              </button>
                            )}
                            <button
                              onClick={() => handleAction(sub.id, "approve")}
                              disabled={actionLoading}
                              className="cursor-pointer rounded-full border-none bg-emerald-600 px-4 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed"
                            >
                              Approve
                            </button>
                            <div className="flex min-w-[200px] flex-1 gap-1.5">
                              <input
                                type="text"
                                value={rejectReason}
                                onChange={(e) =>
                                  setRejectReason(e.target.value)
                                }
                                placeholder="Rejection reason..."
                                className="flex-1 rounded-full border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs outline-none dark:bg-slate-800 dark:text-white"
                              />
                              <button
                                onClick={() =>
                                  rejectReason && handleAction(sub.id, "reject")
                                }
                                disabled={actionLoading || !rejectReason}
                                className="cursor-pointer rounded-full border-none px-4 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed"
                                style={{
                                  backgroundColor: rejectReason
                                    ? "#DC2626"
                                    : "#E5E7EB",
                                }}
                              >
                                Reject
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </FadeInUp>

      {!loading && submissions.length > 0 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          total={total}
          limit={LIMIT}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
