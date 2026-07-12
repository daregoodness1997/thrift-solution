"use client";

import { useState, useEffect, useCallback } from "react";
import { config, BrandConfig } from "@thrift/config";
import { Card, Button, ColorfulBadge, FadeInUp, FadeIn } from "@thrift/ui";
import { formatNaira } from "@thrift/utils";
import { useAuth } from "@/lib/auth-context";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { Skeleton } from "@/components/Skeleton";

const fallback = config;

interface JobApplication {
  id: string;
  resumeUrl?: string;
  coverLetter?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  applicant: { id: string; name: string; email: string };
  listing: {
    id: string;
    title: string;
    description: string;
    company?: string;
    location: string;
    jobType: string;
    salaryMin?: number;
    salaryMax?: number;
    currency: string;
    category: string;
    status: string;
    createdAt: string;
    poster: { id: string; name: string; email: string };
  };
}

const JOB_TYPE_COLORS: Record<string, string> = {
  full_time: "#059669", part_time: "#2563EB", contract: "#D97706", internship: "#8B5CF6", remote: "#EC4899",
};

const APP_STATUS_COLORS: Record<string, string> = {
  pending: "#D97706", reviewed: "#2563EB", shortlisted: "#059669", rejected: "#DC2626", accepted: "#059669",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending Review", reviewed: "Reviewed", shortlisted: "Shortlisted", rejected: "Rejected", accepted: "Accepted",
};

export default function ApplicationDetailPage() {
  const { token, user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [cfg, setCfg] = useState<BrandConfig>(fallback);
  const [application, setApplication] = useState<JobApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState("");

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  useEffect(() => { fetch(`${API_URL}/api/config`).then((r) => r.json()).then((d) => { if (d && d.name) setCfg((p) => ({ ...p, ...d })); }).catch(() => {}); }, [API_URL]);

  const fetchApplication = useCallback(async () => {
    if (!token || !id) { setLoading(false); return; }
    try {
      const res = await fetch(`${API_URL}/api/jobs/applications/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setApplication(data.data);
    } catch {}
    setLoading(false);
  }, [token, API_URL, id]);

  useEffect(() => { fetchApplication(); }, [fetchApplication]);

  const isPoster = user && application && application.listing.poster.id === user.id;
  const isApplicant = user && application && application.applicant.id === user.id;

  const formatSalary = (min?: number, max?: number) => {
    if (!min && !max) return "Not specified";
    if (min && max) return `${formatNaira(min)} - ${formatNaira(max)}`;
    if (min) return `From ${formatNaira(min)}`;
    return `Up to ${formatNaira(max!)}`;
  };

  const handleStatusUpdate = async (status: string) => {
    setUpdating(true);
    setUpdateSuccess("");
    try {
      const res = await fetch(`${API_URL}/api/jobs/${application!.listing.id}/applications/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) {
        setApplication((prev) => prev ? { ...prev, status } : prev);
        setUpdateSuccess(`Application ${STATUS_LABELS[status]?.toLowerCase() || status}`);
        setTimeout(() => setUpdateSuccess(""), 3000);
      }
    } catch {}
    setUpdating(false);
  };

  if (loading) {
    return (
      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "clamp(1rem, 3vw, 2rem)" }}>
        <Skeleton width="200px" height="12px" style={{ marginBottom: "1rem" }} />
        <Skeleton width="320px" height="28px" style={{ marginBottom: "2rem" }} />
        <Skeleton width="100%" height="200px" style={{ marginBottom: "1.5rem" }} />
        <Skeleton width="100%" height="120px" />
      </div>
    );
  }

  if (!application) {
    return (
      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "clamp(1rem, 3vw, 2rem)" }}>
        <Card padding="3rem"><div style={{ textAlign: "center" }}><h3 style={{ fontSize: "1rem", fontWeight: 600, color: "#2D2D2D", marginBottom: "0.5rem" }}>Application not found</h3><p style={{ fontSize: "13px", color: "#717171", marginBottom: "1.5rem" }}>This application may have been removed or you don't have access.</p><a href="/jobs/my"><Button variant="primary" size="sm">Back to My Jobs</Button></a></div></Card>
      </div>
    );
  }

  const job = application.listing;

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "clamp(1rem, 3vw, 2rem)" }}>
      <FadeIn>
        <div style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "1.5rem" }}>
          <a href="/jobs/my" style={{ fontSize: "12px", color: cfg.colors.primary, textDecoration: "none", fontWeight: 600 }}>&larr; My Jobs</a>
          <a href={`/jobs/${job.id}`} style={{ fontSize: "12px", color: cfg.colors.primary, textDecoration: "none", fontWeight: 600 }}>View Job Listing</a>
        </div>
      </FadeIn>

      <FadeIn delay={100}>
        <Card padding="2rem" style={{ marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem", flexWrap: "wrap", gap: "0.75rem" }}>
            <div>
              <h1 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#1A1A1A", marginBottom: "0.25rem" }}>Application for {job.title}</h1>
              <p style={{ fontSize: "13px", color: "#717171" }}>{job.company || job.poster.name} &middot; {job.location}</p>
            </div>
            <span style={{ padding: "0.25rem 0.75rem", borderRadius: "9999px", fontSize: "11px", fontWeight: 700, color: APP_STATUS_COLORS[application.status], backgroundColor: `${APP_STATUS_COLORS[application.status]}12`, border: `1px solid ${APP_STATUS_COLORS[application.status]}`, textTransform: "uppercase", fontFamily: "'JetBrains Mono', monospace" }}>
              {STATUS_LABELS[application.status] || application.status}
            </span>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "1.5rem", marginBottom: "1.5rem", fontSize: "12px" }}>
            <div><span style={{ color: "#999", display: "block", marginBottom: "0.25rem" }}>Salary</span><span style={{ fontWeight: 600, color: cfg.colors.primary, fontFamily: "'JetBrains Mono', monospace" }}>{formatSalary(job.salaryMin, job.salaryMax)}</span></div>
            <div><span style={{ color: "#999", display: "block", marginBottom: "0.25rem" }}>Category</span><span style={{ fontWeight: 600, color: "#2D2D2D", textTransform: "capitalize" }}>{job.category}</span></div>
            <div><span style={{ color: "#999", display: "block", marginBottom: "0.25rem" }}>Job Type</span><span style={{ padding: "0.125rem 0.5rem", borderRadius: "9999px", fontSize: "10px", fontWeight: 700, color: JOB_TYPE_COLORS[job.jobType], backgroundColor: `${JOB_TYPE_COLORS[job.jobType]}12`, textTransform: "capitalize" }}>{job.jobType.replace("_", " ")}</span></div>
            <div><span style={{ color: "#999", display: "block", marginBottom: "0.25rem" }}>Job Posted</span><span style={{ fontWeight: 600, color: "#2D2D2D" }}>{new Date(job.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</span></div>
          </div>

          <div style={{ padding: "1rem", borderRadius: "0.75rem", backgroundColor: "#FAF9F5", border: "1px solid #F0F0F0", marginBottom: "1.5rem" }}>
            <p style={{ fontSize: "12px", fontWeight: 600, color: "#2D2D2D", marginBottom: "0.5rem" }}>Job Description</p>
            <p style={{ fontSize: "13px", color: "#2D2D2D", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{job.description}</p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", paddingTop: "1rem", borderTop: "1px solid #F0F0F0" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "50%", backgroundColor: cfg.colors.primary, color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700 }}>
              {job.poster.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
            </div>
            <div><span style={{ fontSize: "12px", fontWeight: 600, color: "#2D2D2D", display: "block" }}>Posted by {job.poster.name}</span></div>
          </div>
        </Card>
      </FadeIn>

      <FadeInUp delay={200}>
        <Card padding="2rem" style={{ marginBottom: "1.5rem" }}>
          <ColorfulBadge label="Your Application" color={APP_STATUS_COLORS[application.status]} />

          <div style={{ display: "flex", flexWrap: "wrap", gap: "1.5rem", marginTop: "1rem", marginBottom: "1.5rem", fontSize: "12px" }}>
            <div><span style={{ color: "#999", display: "block", marginBottom: "0.25rem" }}>Applied On</span><span style={{ fontWeight: 600, color: "#2D2D2D" }}>{new Date(application.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span></div>
            <div><span style={{ color: "#999", display: "block", marginBottom: "0.25rem" }}>Last Updated</span><span style={{ fontWeight: 600, color: "#2D2D2D" }}>{new Date(application.updatedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span></div>
          </div>

          {application.resumeUrl && (
            <div style={{ marginBottom: "1.5rem" }}>
              <p style={{ fontSize: "12px", fontWeight: 600, color: "#2D2D2D", marginBottom: "0.375rem" }}>Resume</p>
              <a href={application.resumeUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: "13px", color: cfg.colors.primary, textDecoration: "none", fontWeight: 500, display: "inline-flex", alignItems: "center", gap: "0.375rem" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14,2 14,8 20,8" /></svg>
                View Resume
              </a>
            </div>
          )}

          {application.coverLetter && (
            <div>
              <p style={{ fontSize: "12px", fontWeight: 600, color: "#2D2D2D", marginBottom: "0.375rem" }}>Cover Letter</p>
              <div style={{ padding: "1rem", borderRadius: "0.75rem", backgroundColor: "#FAF9F5", border: "1px solid #F0F0F0" }}>
                <p style={{ fontSize: "13px", color: "#2D2D2D", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{application.coverLetter}</p>
              </div>
            </div>
          )}

          {!application.resumeUrl && !application.coverLetter && (
            <p style={{ fontSize: "13px", color: "#999", fontStyle: "italic" }}>No additional details provided with this application.</p>
          )}

          {isApplicant && (
            <div style={{ marginTop: "1.5rem", paddingTop: "1rem", borderTop: "1px solid #F0F0F0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "50%", backgroundColor: "#F0F0F0", color: "#717171", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700 }}>
                  {application.applicant.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                </div>
                <div>
                  <span style={{ fontSize: "12px", fontWeight: 600, color: "#2D2D2D", display: "block" }}>{application.applicant.name}</span>
                  <span style={{ fontSize: "11px", color: "#999" }}>{application.applicant.email}</span>
                </div>
              </div>
            </div>
          )}
        </Card>
      </FadeInUp>

      {isPoster && (
        <FadeInUp delay={300}>
          <Card padding="1.5rem">
            <ColorfulBadge label="Manage Application" color={cfg.colors.primary} />
            <h2 style={{ fontSize: "14px", fontWeight: 600, color: "#1A1A1A", marginTop: "0.5rem", marginBottom: "0.75rem" }}>Applicant</h2>

            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "50%", backgroundColor: "#F0F0F0", color: "#717171", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 700 }}>
                {application.applicant.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
              </div>
              <div>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "#2D2D2D", display: "block" }}>{application.applicant.name}</span>
                <span style={{ fontSize: "12px", color: "#999" }}>{application.applicant.email}</span>
              </div>
            </div>

            {updateSuccess && (
              <div style={{ padding: "0.75rem 1rem", borderRadius: "0.75rem", backgroundColor: "#ECFDF5", border: "1px solid #A7F3D0", color: "#059669", fontSize: "12px", fontWeight: 500, marginBottom: "1rem" }}>{updateSuccess}</div>
            )}

            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              {application.status === "pending" && (
                <>
                  <button onClick={() => handleStatusUpdate("reviewed")} disabled={updating} style={{ padding: "0.5rem 1rem", borderRadius: "9999px", fontSize: "12px", fontWeight: 600, backgroundColor: "#ffffff", color: "#2563EB", border: "1px solid #BFDBFE", cursor: "pointer", opacity: updating ? 0.5 : 1 }}>Mark Reviewed</button>
                  <button onClick={() => handleStatusUpdate("shortlisted")} disabled={updating} style={{ padding: "0.5rem 1rem", borderRadius: "9999px", fontSize: "12px", fontWeight: 600, backgroundColor: "#059669", color: "#ffffff", border: "none", cursor: "pointer", opacity: updating ? 0.5 : 1 }}>Shortlist</button>
                  <button onClick={() => handleStatusUpdate("rejected")} disabled={updating} style={{ padding: "0.5rem 1rem", borderRadius: "9999px", fontSize: "12px", fontWeight: 600, backgroundColor: "#ffffff", color: "#DC2626", border: "1px solid #FECACA", cursor: "pointer", opacity: updating ? 0.5 : 1 }}>Reject</button>
                </>
              )}
              {application.status === "reviewed" && (
                <>
                  <button onClick={() => handleStatusUpdate("shortlisted")} disabled={updating} style={{ padding: "0.5rem 1rem", borderRadius: "9999px", fontSize: "12px", fontWeight: 600, backgroundColor: "#059669", color: "#ffffff", border: "none", cursor: "pointer", opacity: updating ? 0.5 : 1 }}>Shortlist</button>
                  <button onClick={() => handleStatusUpdate("rejected")} disabled={updating} style={{ padding: "0.5rem 1rem", borderRadius: "9999px", fontSize: "12px", fontWeight: 600, backgroundColor: "#ffffff", color: "#DC2626", border: "1px solid #FECACA", cursor: "pointer", opacity: updating ? 0.5 : 1 }}>Reject</button>
                </>
              )}
              {application.status === "shortlisted" && (
                <>
                  <button onClick={() => handleStatusUpdate("accepted")} disabled={updating} style={{ padding: "0.5rem 1rem", borderRadius: "9999px", fontSize: "12px", fontWeight: 600, backgroundColor: "#059669", color: "#ffffff", border: "none", cursor: "pointer", opacity: updating ? 0.5 : 1 }}>Accept</button>
                  <button onClick={() => handleStatusUpdate("rejected")} disabled={updating} style={{ padding: "0.5rem 1rem", borderRadius: "9999px", fontSize: "12px", fontWeight: 600, backgroundColor: "#ffffff", color: "#DC2626", border: "1px solid #FECACA", cursor: "pointer", opacity: updating ? 0.5 : 1 }}>Reject</button>
                </>
              )}
              {!["pending", "reviewed", "shortlisted"].includes(application.status) && (
                <p style={{ fontSize: "12px", color: "#999", fontStyle: "italic" }}>This application has been {application.status}.</p>
              )}
            </div>
          </Card>
        </FadeInUp>
      )}
    </div>
  );
}
