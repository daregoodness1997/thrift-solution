"use client";

import { useState, useEffect, useCallback } from "react";
import { config, BrandConfig } from "@thrift/config";
import { useAuth } from "@/lib/auth-context";
import { Card, ColorfulBadge, ColorBar, FadeInUp } from "@thrift/ui";
import Pagination from "@/components/Pagination";

const LIMIT = 20;
const fallback = config;

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
  const [cfg] = useState<BrandConfig>(fallback);
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
        return { color: "#059669", bg: "#ECFDF5", border: "#A7F3D0" };
      case "pending":
        return { color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE" };
      case "under_review":
        return { color: "#D97706", bg: "#FFFBEB", border: "#FDE68A" };
      case "rejected":
        return { color: "#DC2626", bg: "#FEF2F2", border: "#FECACA" };
      default:
        return { color: "#6B7280", bg: "#F3F4F6", border: "#E5E7EB" };
    }
  };

  if (loading) {
    return (
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "clamp(1rem, 3vw, 2rem)",
        }}
      >
        <ColorBar />
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "400px",
          }}
        >
          <span style={{ fontSize: "12px", color: "#999" }}>
            Loading KYC submissions...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "clamp(1rem, 3vw, 2rem)",
      }}
    >
      <ColorBar />

      <FadeInUp delay={100}>
        <div
          style={{
            marginBottom: "2rem",
            marginTop: "2rem",
            borderBottom: "1px solid #EAEAEA",
            paddingBottom: "1.5rem",
          }}
        >
          <ColorfulBadge label="Admin Panel" color={cfg.colors.primary} />
          <h1
            style={{
              fontSize: "clamp(1.25rem, 3vw, 1.75rem)",
              fontWeight: 300,
              color: "#1A1A1A",
              letterSpacing: "-0.025em",
              marginTop: "0.75rem",
            }}
          >
            KYC{" "}
            <span
              style={{
                fontStyle: "italic",
                fontFamily: "'Playfair Display', serif",
                color: cfg.colors.primary,
                fontWeight: 500,
              }}
            >
              Management
            </span>
          </h1>
        </div>
      </FadeInUp>

      {/* Stats */}
      {stats && (
        <FadeInUp delay={200}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: "0.75rem",
              marginBottom: "2rem",
            }}
          >
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
                <span
                  style={{
                    fontSize: "9px",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    color: "#999",
                    fontWeight: 700,
                    display: "block",
                  }}
                >
                  {s.label}
                </span>
                <span
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: 700,
                    color: s.color,
                    fontFamily: "'JetBrains Mono', monospace",
                    display: "block",
                    marginTop: "0.25rem",
                  }}
                >
                  {s.value}
                </span>
              </Card>
            ))}
          </div>
        </FadeInUp>
      )}

      {/* Message */}
      {message && (
        <FadeInUp delay={250}>
          <div
            style={{
              padding: "0.75rem 1rem",
              borderRadius: "0.75rem",
              backgroundColor: message.includes("error")
                ? "#FEF2F2"
                : "#ECFDF5",
              border: `1px solid ${message.includes("error") ? "#FECACA" : "#A7F3D0"}`,
              color: message.includes("error") ? "#DC2626" : "#059669",
              fontSize: "12px",
              fontWeight: 500,
              marginBottom: "1.5rem",
            }}
          >
            {message}
          </div>
        </FadeInUp>
      )}

      {/* Tabs */}
      <FadeInUp delay={300}>
        <div
          style={{
            display: "flex",
            gap: "0.25rem",
            marginBottom: "1.5rem",
            padding: "0.25rem",
            backgroundColor: "#F3F4F6",
            borderRadius: "0.75rem",
            flexWrap: "wrap",
          }}
        >
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "0.5rem",
                fontSize: "12px",
                fontWeight: activeTab === tab.value ? 600 : 400,
                cursor: "pointer",
                border: "none",
                transition: "all 0.2s ease",
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
                <span
                  style={{
                    marginLeft: "0.375rem",
                    padding: "0.125rem 0.375rem",
                    borderRadius: "9999px",
                    backgroundColor: "#DC2626",
                    color: "#ffffff",
                    fontSize: "9px",
                    fontWeight: 700,
                  }}
                >
                  {stats.pending}
                </span>
              )}
            </button>
          ))}
        </div>
      </FadeInUp>

      {/* Submissions List */}
      <FadeInUp delay={400}>
        {submissions.length === 0 ? (
          <Card padding="2rem">
            <div style={{ textAlign: "center" }}>
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#D1D5DB"
                strokeWidth={1.5}
                style={{ margin: "0 auto 1rem" }}
              >
                <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span style={{ fontSize: "13px", color: "#999" }}>
                No submissions found
              </span>
            </div>
          </Card>
        ) : (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
          >
            {submissions.map((sub) => {
              const ss = getStatusStyle(sub.status);
              return (
                <Card key={sub.id} padding="0" style={{ overflow: "hidden" }}>
                  <div
                    style={{ padding: "1rem", cursor: "pointer" }}
                    onClick={() =>
                      setSelectedKyc(selectedKyc?.id === sub.id ? null : sub)
                    }
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "1rem",
                        flexWrap: "wrap",
                      }}
                    >
                      <div
                        style={{
                          width: "40px",
                          height: "40px",
                          borderRadius: "50%",
                          backgroundColor: `${cfg.colors.primary}15`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "14px",
                          fontWeight: 700,
                          color: cfg.colors.primary,
                          flexShrink: 0,
                        }}
                      >
                        {sub.user.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)}
                      </div>
                      <div style={{ flex: 1, minWidth: "150px" }}>
                        <span
                          style={{
                            fontSize: "13px",
                            fontWeight: 600,
                            color: "#2D2D2D",
                            display: "block",
                          }}
                        >
                          {sub.user.name}
                        </span>
                        <span style={{ fontSize: "11px", color: "#717171" }}>
                          {sub.user.email}
                        </span>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <span
                          style={{
                            fontSize: "11px",
                            color: "#717171",
                            display: "block",
                          }}
                        >
                          {ID_TYPE_LABELS[sub.idType] || sub.idType}
                        </span>
                        <span
                          style={{
                            fontSize: "11px",
                            color: "#999",
                            fontFamily: "'JetBrains Mono', monospace",
                          }}
                        >
                          ...{sub.idNumber.slice(-4)}
                        </span>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <span
                          style={{
                            fontSize: "10px",
                            color: "#999",
                            display: "block",
                          }}
                        >
                          {new Date(sub.submittedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <span
                        style={{
                          padding: "0.25rem 0.75rem",
                          borderRadius: "9999px",
                          fontSize: "10px",
                          fontWeight: 600,
                          color: ss.color,
                          backgroundColor: ss.bg,
                          border: `1px solid ${ss.border}`,
                          textTransform: "capitalize",
                        }}
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
                        style={{
                          transform:
                            selectedKyc?.id === sub.id
                              ? "rotate(180deg)"
                              : "rotate(0)",
                          transition: "transform 0.2s",
                        }}
                      >
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </div>

                    {/* Expanded Detail */}
                    {selectedKyc?.id === sub.id && (
                      <div
                        style={{
                          marginTop: "1rem",
                          paddingTop: "1rem",
                          borderTop: "1px solid #F0F0F0",
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns:
                              "repeat(auto-fit, minmax(280px, 1fr))",
                            gap: "1rem",
                            marginBottom: "1rem",
                          }}
                        >
                          {/* Documents */}
                          <div>
                            <span
                              style={{
                                fontSize: "10px",
                                textTransform: "uppercase",
                                letterSpacing: "0.05em",
                                color: "#999",
                                fontWeight: 700,
                                display: "block",
                                marginBottom: "0.5rem",
                              }}
                            >
                              Documents
                            </span>
                            {sub.documents.length > 0 ? (
                              sub.documents.map((doc) => (
                                <div
                                  key={doc.id}
                                  style={{
                                    padding: "0.5rem",
                                    borderRadius: "0.5rem",
                                    backgroundColor: "#FAFAFA",
                                    marginBottom: "0.375rem",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.5rem",
                                  }}
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
                                  <span
                                    style={{
                                      fontSize: "11px",
                                      color: "#2D2D2D",
                                      flex: 1,
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      whiteSpace: "nowrap",
                                    }}
                                  >
                                    {doc.fileName}
                                  </span>
                                  <a
                                    href={doc.fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                      fontSize: "10px",
                                      color: cfg.colors.primary,
                                      textDecoration: "none",
                                    }}
                                  >
                                    View
                                  </a>
                                </div>
                              ))
                            ) : (
                              <span style={{ fontSize: "11px", color: "#999" }}>
                                No documents uploaded
                              </span>
                            )}
                          </div>

                          {/* Audit Log */}
                          <div>
                            <span
                              style={{
                                fontSize: "10px",
                                textTransform: "uppercase",
                                letterSpacing: "0.05em",
                                color: "#999",
                                fontWeight: 700,
                                display: "block",
                                marginBottom: "0.5rem",
                              }}
                            >
                              Activity
                            </span>
                            {sub.auditLogs?.slice(0, 3).map((log, i) => (
                              <div
                                key={i}
                                style={{
                                  padding: "0.375rem 0",
                                  borderBottom:
                                    i < 2 ? "1px solid #F0F0F0" : "none",
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: "11px",
                                    color: "#2D2D2D",
                                    textTransform: "capitalize",
                                  }}
                                >
                                  {log.action.replace(/_/g, " ")}
                                </span>
                                {log.notes && (
                                  <span
                                    style={{
                                      fontSize: "10px",
                                      color: "#717171",
                                      display: "block",
                                    }}
                                  >
                                    {log.notes}
                                  </span>
                                )}
                                <span
                                  style={{ fontSize: "9px", color: "#999" }}
                                >
                                  {new Date(log.createdAt).toLocaleString()}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Rejection Reason */}
                        {sub.status === "rejected" && sub.rejectionReason && (
                          <div
                            style={{
                              padding: "0.75rem",
                              borderRadius: "0.5rem",
                              backgroundColor: "#FEF2F2",
                              border: "1px solid #FECACA",
                              marginBottom: "1rem",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "10px",
                                textTransform: "uppercase",
                                color: "#DC2626",
                                fontWeight: 700,
                                display: "block",
                                marginBottom: "0.25rem",
                              }}
                            >
                              Rejection Reason
                            </span>
                            <span
                              style={{ fontSize: "12px", color: "#2D2D2D" }}
                            >
                              {sub.rejectionReason}
                            </span>
                          </div>
                        )}

                        {/* Actions */}
                        {sub.status !== "verified" && (
                          <div
                            style={{
                              display: "flex",
                              gap: "0.5rem",
                              flexWrap: "wrap",
                              alignItems: "flex-end",
                            }}
                          >
                            {sub.status === "pending" && (
                              <button
                                onClick={() => handleAction(sub.id, "review")}
                                disabled={actionLoading}
                                style={{
                                  padding: "0.5rem 1rem",
                                  borderRadius: "9999px",
                                  fontSize: "12px",
                                  fontWeight: 600,
                                  cursor: actionLoading
                                    ? "not-allowed"
                                    : "pointer",
                                  backgroundColor: "#D97706",
                                  color: "#ffffff",
                                  border: "none",
                                }}
                              >
                                Start Review
                              </button>
                            )}
                            <button
                              onClick={() => handleAction(sub.id, "approve")}
                              disabled={actionLoading}
                              style={{
                                padding: "0.5rem 1rem",
                                borderRadius: "9999px",
                                fontSize: "12px",
                                fontWeight: 600,
                                cursor: actionLoading
                                  ? "not-allowed"
                                  : "pointer",
                                backgroundColor: "#059669",
                                color: "#ffffff",
                                border: "none",
                              }}
                            >
                              Approve
                            </button>
                            <div
                              style={{
                                display: "flex",
                                gap: "0.375rem",
                                flex: 1,
                                minWidth: "200px",
                              }}
                            >
                              <input
                                type="text"
                                value={rejectReason}
                                onChange={(e) =>
                                  setRejectReason(e.target.value)
                                }
                                placeholder="Rejection reason..."
                                style={{
                                  flex: 1,
                                  padding: "0.5rem 0.75rem",
                                  borderRadius: "9999px",
                                  border: "1px solid #EAEAEA",
                                  fontSize: "12px",
                                  outline: "none",
                                }}
                              />
                              <button
                                onClick={() =>
                                  rejectReason && handleAction(sub.id, "reject")
                                }
                                disabled={actionLoading || !rejectReason}
                                style={{
                                  padding: "0.5rem 1rem",
                                  borderRadius: "9999px",
                                  fontSize: "12px",
                                  fontWeight: 600,
                                  cursor:
                                    actionLoading || !rejectReason
                                      ? "not-allowed"
                                      : "pointer",
                                  backgroundColor: rejectReason
                                    ? "#DC2626"
                                    : "#E5E7EB",
                                  color: "#ffffff",
                                  border: "none",
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
