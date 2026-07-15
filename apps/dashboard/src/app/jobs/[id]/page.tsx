"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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

interface ResumeFile {
  file: File;
  name: string;
  size: number;
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
  const [resumeFile, setResumeFile] = useState<ResumeFile | null>(null);
  const [applyError, setApplyError] = useState("");
  const [applySuccess, setApplySuccess] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const resumeFileRef = useRef<HTMLInputElement>(null);

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

  const handleResumeSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setApplyError("Resume file size must be less than 5MB");
      return;
    }
    const allowedTypes = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!allowedTypes.includes(file.type)) {
      setApplyError("Only PDF, DOC, and DOCX files are allowed");
      return;
    }

    setApplyError("");
    setResumeFile({ file, name: file.name, size: file.size });
  };

  const removeResume = () => {
    setResumeFile(null);
    if (resumeFileRef.current) {
      resumeFileRef.current.value = "";
    }
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setApplyError("");
    setApplying(true);
    try {
      const formData = new FormData();
      if (resumeFile) {
        formData.append("resume", resumeFile.file);
      }
      if (coverLetter.trim()) {
        formData.append("coverLetter", coverLetter.trim());
      }

      const res = await fetch(`${API_URL}/api/jobs/${id}/apply`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setApplySuccess(true);
        setCoverLetter("");
        setResumeFile(null);
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
      <div className="mx-auto max-w-[800px] p-[clamp(1rem,3vw,2rem)]">
        <Skeleton width="200px" height="12px" style={{ marginBottom: "1rem" }} />
        <Skeleton width="320px" height="28px" style={{ marginBottom: "2rem" }} />
        <Skeleton width="100%" height="200px" style={{ marginBottom: "1.5rem" }} />
        <Skeleton width="100%" height="120px" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="mx-auto max-w-[800px] p-[clamp(1rem,3vw,2rem)]">
        <Card padding="3rem"><div className="text-center"><h3 className="mb-2 text-base font-semibold text-brand-dark">Job not found</h3><a href="/jobs"><Button variant="primary" size="sm">Back to Jobs</Button></a></div></Card></div>
    );
  }

  return (
    <div className="mx-auto max-w-[800px] p-[clamp(1rem,3vw,2rem)]">
      <FadeIn>
        <div className="mb-6"><a href="/jobs" className="text-xs font-semibold no-underline" style={{ color: cfg.colors.primary }}>&larr; Back to Jobs</a></div>
      </FadeIn>

      <FadeIn delay={100}>
        <Card padding="2rem" className="mb-6">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="mb-1 text-[1.5rem] font-bold text-brand-dark">{job.title}</h1>
              <p className="text-[13px] text-gray-500">{job.company || job.poster.name} &middot; {job.location}</p>
            </div>
            <span className="rounded-full px-3 py-1 text-[11px] font-bold capitalize" style={{ color: JOB_TYPE_COLORS[job.jobType] || "#717171", backgroundColor: `${JOB_TYPE_COLORS[job.jobType] || "#717171"}12`, border: `1px solid ${JOB_TYPE_COLORS[job.jobType] || "#EAEAEA"}` }}>
              {job.jobType.replace("_", " ")}
            </span>
          </div>

          <div className="mb-6 flex flex-wrap gap-6 text-xs">
            <div><span className="mb-1 block text-gray-500">Salary</span><span className="font-mono font-semibold" style={{ color: cfg.colors.primary }}>{formatSalary(job.salaryMin, job.salaryMax)}</span></div>
            <div><span className="mb-1 block text-gray-500">Category</span><span className="font-semibold capitalize text-brand-dark">{job.category}</span></div>
            <div><span className="mb-1 block text-gray-500">Posted</span><span className="font-semibold text-brand-dark">{new Date(job.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</span></div>
            <div><span className="mb-1 block text-gray-500">Applications</span><span className="font-semibold text-brand-dark">{job.applications.length}</span></div>
          </div>

          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <p className="whitespace-pre-wrap text-[13px] leading-[1.7] text-brand-dark">{job.description}</p>
          </div>

          <div className="mt-6 flex items-center gap-3 border-t border-gray-100 pt-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white" style={{ backgroundColor: cfg.colors.primary }}>
              {job.poster.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
            </div>
            <div><span className="block text-xs font-semibold text-brand-dark">Posted by {job.poster.name}</span></div>
          </div>

          {isPoster ? (
            <div className="mt-6 flex gap-3">
              <button onClick={handleDelete} disabled={deleting} className="cursor-pointer rounded-full border border-red-200 bg-white px-5 py-2.5 text-[13px] font-semibold text-red-600" style={{ opacity: deleting ? 0.5 : 1 }}>
                {deleting ? "Deleting..." : "Delete Job"}
              </button>
            </div>
          ) : !hasApplied && job.status === "active" ? (
            <form onSubmit={handleApply} className="mt-6 flex flex-col gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-brand-dark">Resume (optional)</label>
                <input ref={resumeFileRef} type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={handleResumeSelect} className="hidden" />
                {resumeFile ? (
                  <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#EFF6FF]">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth={2}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-medium text-brand-dark">{resumeFile.name}</span>
                      <span className="text-[10px] text-emerald-600">{(resumeFile.size / 1024).toFixed(1)} KB</span>
                    </div>
                    <button type="button" onClick={removeResume} className="cursor-pointer border-none bg-none p-1 text-red-600">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M18 6L6 18M6 6l12 12" /></svg>
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={() => resumeFileRef.current?.click()} className="w-full cursor-pointer rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-6 text-center transition-all hover:border-brand-primary">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth={1.5} className="mx-auto mb-1.5"><path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                    <span className="block text-xs text-gray-500">Click to upload resume</span>
                    <span className="mt-1 block text-[10px] text-gray-500">PDF, DOC, or DOCX up to 5MB</span>
                  </button>
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-brand-dark">Cover Letter (optional)</label>
                <textarea value={coverLetter} onChange={(e) => setCoverLetter(e.target.value)} placeholder="Tell the employer why you're a great fit..." rows={4} className="w-full rounded-xl border border-gray-200 py-2.5 px-3 resize-y text-[13px] outline-none box-border font-sans" />
              </div>
              {applyError && <div className="text-xs text-red-600">{applyError}</div>}
              {applySuccess && <div className="text-xs text-emerald-600">Application submitted!</div>}
              <Button type="submit" variant="primary" size="md" disabled={applying}>{applying ? "Submitting..." : "Apply Now"}</Button>
            </form>
          ) : hasApplied ? (
            <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-600">You have already applied to this position.</div>
          ) : null}
        </Card>
      </FadeIn>

      {isPoster && job.applications.length > 0 && (
        <FadeInUp delay={300}>
          <Card padding="1.5rem">
            <ColorfulBadge label="Applications" color={cfg.colors.primary} />
            <h2 className="mb-4 mt-2 text-[1.125rem] font-medium text-brand-dark">Applications ({job.applications.length})</h2>
            <div className="flex flex-col gap-3">
              {job.applications.map((app) => (
                <a key={app.id} href={`/jobs/applications/${app.id}`} className="block no-underline">
                  <div className="cursor-pointer rounded-xl border border-gray-100 bg-gray-50 p-4 transition-colors hover:border-brand-primary">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-500">
                          {app.applicant.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                        </div>
                        <div>
                          <span className="block text-xs font-semibold text-brand-dark">{app.applicant.name}</span>
                          {app.coverLetter && <span className="mt-0.5 block max-w-[400px] truncate text-[11px] text-gray-500">{app.coverLetter}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="rounded-md px-2 py-0.5 text-[9px] font-bold uppercase font-mono" style={{ color: APP_STATUS_COLORS[app.status], backgroundColor: `${APP_STATUS_COLORS[app.status]}12` }}>{app.status}</span>
                        {app.status === "pending" && (
                          <div className="flex gap-1.5" onClick={(e) => e.preventDefault()}>
                            <button onClick={(e) => { e.preventDefault(); handleApplicationAction(app.id, "shortlisted"); }} className="cursor-pointer rounded-full bg-emerald-600 px-3 py-1.5 text-[11px] font-semibold text-white border-none">Shortlist</button>
                            <button onClick={(e) => { e.preventDefault(); handleApplicationAction(app.id, "rejected"); }} className="cursor-pointer rounded-full border border-red-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-red-600">Reject</button>
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
