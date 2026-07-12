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

interface JobListing {
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
  applications: Application[];
}

interface Application {
  id: string;
  resumeUrl?: string;
  coverLetter?: string;
  status: string;
  createdAt: string;
  applicant: { id: string; name: string; email: string };
}

const JOB_TYPE_COLORS: Record<string, string> = {
  full_time: "#059669", part_time: "#2563EB", contract: "#D97706", internship: "#8B5CF6", remote: "#EC4899",
};

const APP_STATUS_COLORS: Record<string, string> = {
  pending: "#D97706", reviewed: "#2563EB", shortlisted: "#059669", rejected: "#DC2626", accepted: "#059669",
};

export default function JobDetailPage() {
  const { token, user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [cfg, setCfg] = useState<BrandConfig>(fallback);
  const [job, setJob] = useState<JobListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");
  const [applyError, setApplyError] = useState("");
  const [applySuccess, setApplySuccess] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  useEffect(() => { fetch(`${API_URL}/api/config`).then((r) => r.json()).then((d) => { if (d && d.name) setCfg((p) => ({ ...p, ...d })); }).catch(() => {}); }, [API_URL]);

  const fetchJob = useCallback(async () => {
    if (!token || !id) { setLoading(false); return; }
    try {
      const res = await fetch(`${API_URL}/api/jobs/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setJob(data.data);
    } catch {}
    setLoading(false);
  }, [token, API_URL, id]);

  useEffect(() => { fetchJob(); }, [fetchJob]);

  const isPoster = user && job && job.poster.id === user.id;
  const hasApplied = user && job && job.applications.some((a) => a.applicant.id === user.id);

  const formatSalary = (min?: number, max?: number) => {
    if (!min && !max) return "Not specified";
    if (min && max) return `${formatNaira(min)} - ${formatNaira(max)}`;
    if (min) return `From ${formatNaira(min)}`;
    return `Up to ${formatNaira(max!)}`;
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setApplyError("");
    setApplying(true);
    try {
      const res = await fetch(`${API_URL}/api/jobs/${id}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ resumeUrl: resumeUrl.trim() || undefined, coverLetter: coverLetter.trim() || undefined }),
      });
      const data = await res.json();
      if (data.success) {
        setApplySuccess(true);
        setCoverLetter("");
        setResumeUrl("");
        fetchJob();
        setTimeout(() => setApplySuccess(false), 3000);
      } else setApplyError(data.error || "Failed to submit application");
    } catch { setApplyError("Failed to submit application"); }
    setApplying(false);
  };

  const handleApplicationAction = async (applicationId: string, status: string) => {
    try {
      const res = await fetch(`${API_URL}/api/jobs/${id}/applications/${applicationId}`, {
        method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) fetchJob();
    } catch {}
  };

  const handleDelete = async () => {
    if (!confirm("Delete this job listing?")) return;
    setDeleting(true);
    try {
      const res = await fetch(`${API_URL}/api/jobs/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) router.push("/jobs");
    } catch {}
    setDeleting(false);
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

  if (!job) {
    return (
      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "clamp(1rem, 3vw, 2rem)" }}>
        <Card padding="3rem"><div style={{ textAlign: "center" }}><h3 style={{ fontSize: "1rem", fontWeight: 600, color: "#2D2D2D", marginBottom: "0.5rem" }}>Job not found</h3><a href="/jobs"><Button variant="primary" size="sm">Back to Jobs</Button></a></div></Card>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "clamp(1rem, 3vw, 2rem)" }}>
      <FadeIn>
        <div style={{ marginBottom: "1.5rem" }}><a href="/jobs" style={{ fontSize: "12px", color: cfg.colors.primary, textDecoration: "none", fontWeight: 600 }}>&larr; Back to Jobs</a></div>
      </FadeIn>

      <FadeIn delay={100}>
        <Card padding="2rem" style={{ marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem", flexWrap: "wrap", gap: "0.75rem" }}>
            <div>
              <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#1A1A1A", marginBottom: "0.25rem" }}>{job.title}</h1>
              <p style={{ fontSize: "13px", color: "#717171" }}>{job.company || job.poster.name} &middot; {job.location}</p>
            </div>
            <span style={{ padding: "0.25rem 0.75rem", borderRadius: "9999px", fontSize: "11px", fontWeight: 700, color: JOB_TYPE_COLORS[job.jobType] || "#717171", backgroundColor: `${JOB_TYPE_COLORS[job.jobType] || "#717171"}12`, border: `1px solid ${JOB_TYPE_COLORS[job.jobType] || "#EAEAEA"}`, textTransform: "capitalize" }}>
              {job.jobType.replace("_", " ")}
            </span>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "1.5rem", marginBottom: "1.5rem", fontSize: "12px" }}>
            <div><span style={{ color: "#999", display: "block", marginBottom: "0.25rem" }}>Salary</span><span style={{ fontWeight: 600, color: cfg.colors.primary, fontFamily: "'JetBrains Mono', monospace" }}>{formatSalary(job.salaryMin, job.salaryMax)}</span></div>
            <div><span style={{ color: "#999", display: "block", marginBottom: "0.25rem" }}>Category</span><span style={{ fontWeight: 600, color: "#2D2D2D", textTransform: "capitalize" }}>{job.category}</span></div>
            <div><span style={{ color: "#999", display: "block", marginBottom: "0.25rem" }}>Posted</span><span style={{ fontWeight: 600, color: "#2D2D2D" }}>{new Date(job.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</span></div>
            <div><span style={{ color: "#999", display: "block", marginBottom: "0.25rem" }}>Applications</span><span style={{ fontWeight: 600, color: "#2D2D2D" }}>{job.applications.length}</span></div>
          </div>

          <div style={{ padding: "1rem", borderRadius: "0.75rem", backgroundColor: "#FAF9F5", border: "1px solid #F0F0F0" }}>
            <p style={{ fontSize: "13px", color: "#2D2D2D", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{job.description}</p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "1.5rem", paddingTop: "1rem", borderTop: "1px solid #F0F0F0" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "50%", backgroundColor: cfg.colors.primary, color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700 }}>
              {job.poster.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
            </div>
            <div><span style={{ fontSize: "12px", fontWeight: 600, color: "#2D2D2D", display: "block" }}>Posted by {job.poster.name}</span></div>
          </div>

          {isPoster ? (
            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem" }}>
              <button onClick={handleDelete} disabled={deleting} style={{ padding: "0.625rem 1.25rem", borderRadius: "9999px", fontSize: "13px", fontWeight: 600, cursor: "pointer", backgroundColor: "#ffffff", color: "#DC2626", border: "1px solid #FECACA", opacity: deleting ? 0.5 : 1 }}>
                {deleting ? "Deleting..." : "Delete Job"}
              </button>
            </div>
          ) : !hasApplied && job.status === "active" ? (
            <form onSubmit={handleApply} style={{ marginTop: "1.5rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#2D2D2D", marginBottom: "0.375rem" }}>Resume URL (optional)</label>
                <input type="url" value={resumeUrl} onChange={(e) => setResumeUrl(e.target.value)} placeholder="https://..." style={{ width: "100%", padding: "0.625rem 0.75rem", borderRadius: "0.75rem", border: "1px solid #EAEAEA", fontSize: "13px", outline: "none", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#2D2D2D", marginBottom: "0.375rem" }}>Cover Letter (optional)</label>
                <textarea value={coverLetter} onChange={(e) => setCoverLetter(e.target.value)} placeholder="Tell the employer why you're a great fit..." rows={4} style={{ width: "100%", padding: "0.625rem 0.75rem", borderRadius: "0.75rem", border: "1px solid #EAEAEA", fontSize: "13px", outline: "none", boxSizing: "border-box", resize: "vertical", fontFamily: "inherit" }} />
              </div>
              {applyError && <div style={{ fontSize: "12px", color: "#DC2626" }}>{applyError}</div>}
              {applySuccess && <div style={{ fontSize: "12px", color: "#059669" }}>Application submitted!</div>}
              <Button type="submit" variant="primary" size="md" disabled={applying}>{applying ? "Submitting..." : "Apply Now"}</Button>
            </form>
          ) : hasApplied ? (
            <div style={{ marginTop: "1.5rem", padding: "0.75rem 1rem", borderRadius: "0.75rem", backgroundColor: "#ECFDF5", border: "1px solid #A7F3D0", color: "#059669", fontSize: "12px", fontWeight: 500 }}>You have already applied to this position.</div>
          ) : null}
        </Card>
      </FadeIn>

      {isPoster && job.applications.length > 0 && (
        <FadeInUp delay={300}>
          <Card padding="1.5rem">
            <ColorfulBadge label="Applications" color={cfg.colors.primary} />
            <h2 style={{ fontSize: "1.125rem", fontWeight: 500, color: "#1A1A1A", marginTop: "0.5rem", marginBottom: "1rem" }}>Applications ({job.applications.length})</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {job.applications.map((app) => (
                <a key={app.id} href={`/jobs/applications/${app.id}`} style={{ textDecoration: "none", display: "block" }}>
                  <div style={{ padding: "1rem", borderRadius: "0.75rem", border: "1px solid #F0F0F0", backgroundColor: "#FAFAFA", cursor: "pointer", transition: "border-color 0.2s ease" }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = cfg.colors.primary; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#F0F0F0"; }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <div style={{ width: "32px", height: "32px", borderRadius: "50%", backgroundColor: "#F0F0F0", color: "#717171", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700 }}>
                          {app.applicant.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                        </div>
                        <div>
                          <span style={{ fontSize: "12px", fontWeight: 600, color: "#2D2D2D", display: "block" }}>{app.applicant.name}</span>
                          {app.coverLetter && <span style={{ fontSize: "11px", color: "#717171", display: "block", marginTop: "0.125rem", maxWidth: "400px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{app.coverLetter}</span>}
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <span style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase", fontFamily: "'JetBrains Mono', monospace", color: APP_STATUS_COLORS[app.status], backgroundColor: `${APP_STATUS_COLORS[app.status]}12`, padding: "0.125rem 0.5rem", borderRadius: "0.375rem" }}>{app.status}</span>
                        {app.status === "pending" && (
                          <div style={{ display: "flex", gap: "0.375rem" }} onClick={(e) => e.preventDefault()}>
                            <button onClick={(e) => { e.preventDefault(); handleApplicationAction(app.id, "shortlisted"); }} style={{ padding: "0.375rem 0.75rem", borderRadius: "9999px", fontSize: "11px", fontWeight: 600, backgroundColor: "#059669", color: "#ffffff", border: "none", cursor: "pointer" }}>Shortlist</button>
                            <button onClick={(e) => { e.preventDefault(); handleApplicationAction(app.id, "rejected"); }} style={{ padding: "0.375rem 0.75rem", borderRadius: "9999px", fontSize: "11px", fontWeight: 600, backgroundColor: "#ffffff", color: "#DC2626", border: "1px solid #FECACA", cursor: "pointer" }}>Reject</button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </Card>
        </FadeInUp>
      )}
    </div>
  );
}
