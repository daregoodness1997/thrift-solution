"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { config, BrandConfig } from "@thrift/config";
import { Card, Button, FadeInUp, FadeIn } from "@thrift/ui";
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
        <Card padding="3rem"><div className="text-center"><h3 className="mb-2 text-base font-semibold text-slate-900 dark:text-white">Job not found</h3><a href="/jobs"><Button variant="primary" size="sm">Back to Jobs</Button></a></div></Card></div>
    );
  }

  return (
    <div className="mx-auto max-w-[800px] p-[clamp(1rem,3vw,2rem)]">
      <FadeIn>
        <div className="mb-6"><a href="/jobs" className="text-xs font-semibold no-underline text-blue-600 dark:text-blue-400">&larr; Back to Jobs</a></div>
      </FadeIn>

       <FadeIn delay={100}>
        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-8 mb-6">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="mb-1 text-[1.5rem] font-bold text-slate-900 dark:text-white">{job.title}</h1>
              <p className="text-[13px] text-slate-500 dark:text-slate-400">{job.company || job.poster.name} &middot; {job.location}</p>
            </div>
            <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-mono font-bold uppercase tracking-wider">
              {job.jobType.replace("_", " ")}
            </span>
          </div>

          <div className="mb-6 flex flex-wrap gap-6 text-xs">
            <div><span className="mb-1 block text-slate-500 dark:text-slate-400">Salary</span><span className="font-mono font-semibold text-blue-600 dark:text-blue-400">{formatSalary(job.salaryMin, job.salaryMax)}</span></div>
            <div><span className="mb-1 block text-slate-500 dark:text-slate-400">Category</span><span className="font-semibold capitalize text-slate-900 dark:text-white">{job.category}</span></div>
            <div><span className="mb-1 block text-slate-500 dark:text-slate-400">Posted</span><span className="font-semibold text-slate-900 dark:text-white">{new Date(job.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</span></div>
            <div><span className="mb-1 block text-slate-500 dark:text-slate-400">Applications</span><span className="font-semibold text-slate-900 dark:text-white">{job.applications.length}</span></div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-800/60 p-4">
            <p className="whitespace-pre-wrap text-[13px] leading-[1.7] text-slate-900 dark:text-white">{job.description}</p>
          </div>

          <div className="mt-6 flex items-center gap-3 border-t border-slate-200/80 dark:border-slate-800/80 pt-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white bg-blue-600">
              {job.poster.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
            </div>
            <div><span className="block text-xs font-semibold text-slate-900 dark:text-white">Posted by {job.poster.name}</span></div>
          </div>

          {isPoster ? (
            <div className="mt-6 flex gap-3">
              <button onClick={handleDelete} disabled={deleting} className="btn-secondary py-2.5 px-5 text-[13px] text-red-600 border-red-200 dark:border-red-800" style={{ opacity: deleting ? 0.5 : 1 }}>
                {deleting ? "Deleting..." : "Delete Job"}
              </button>
            </div>
          ) : !hasApplied && job.status === "active" ? (
            <form onSubmit={handleApply} className="mt-6 flex flex-col gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-900 dark:text-white">Resume (optional)</label>
                <input ref={resumeFileRef} type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={handleResumeSelect} className="hidden" />
                {resumeFile ? (
                  <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#EFF6FF]">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth={2}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-medium text-slate-900 dark:text-white">{resumeFile.name}</span>
                      <span className="text-[10px] text-emerald-600">{(resumeFile.size / 1024).toFixed(1)} KB</span>
                    </div>
                    <button type="button" onClick={removeResume} className="cursor-pointer border-none bg-none p-1 text-red-600">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M18 6L6 18M6 6l12 12" /></svg>
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={() => resumeFileRef.current?.click()} className="w-full cursor-pointer rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/60 p-6 text-center transition-all hover:border-brand-primary">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth={1.5} className="mx-auto mb-1.5"><path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                    <span className="block text-xs text-slate-500 dark:text-slate-400">Click to upload resume</span>
                    <span className="mt-1 block text-[10px] text-slate-500 dark:text-slate-400">PDF, DOC, or DOCX up to 5MB</span>
                  </button>
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-900 dark:text-white">Cover Letter (optional)</label>
                <textarea value={coverLetter} onChange={(e) => setCoverLetter(e.target.value)} placeholder="Tell the employer why you're a great fit..." rows={4} className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 py-2.5 px-3 resize-y text-[13px] outline-none box-border font-sans" />
              </div>
              {applyError && <div className="text-xs text-red-600">{applyError}</div>}
              {applySuccess && <div className="text-xs text-emerald-600">Application submitted!</div>}
              <Button type="submit" variant="primary" size="md" className="btn-primary py-2.5 text-[13px]" disabled={applying}>{applying ? "Submitting..." : "Apply Now"}</Button>
            </form>
          ) : hasApplied ? (
            <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-600">You have already applied to this position.</div>
          ) : null}
        </div>
      </FadeIn>

      {isPoster && job.applications.length > 0 && (
        <FadeInUp delay={300}>
          <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-6">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1">
                <span>Applications</span>
              </span>
            </div>
            <h3 className="font-display font-bold text-xl sm:text-2xl text-slate-900 dark:text-white mt-1">Applications ({job.applications.length})</h3>
            <div className="flex flex-col gap-3 mt-4">
              {job.applications.map((app) => (
                <a key={app.id} href={`/jobs/applications/${app.id}`} className="block no-underline">
                  <div className="cursor-pointer rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-800/60 p-4 transition-colors hover:border-blue-500">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-500 dark:text-slate-400">
                          {app.applicant.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                        </div>
                        <div>
                          <span className="block text-xs font-semibold text-slate-900 dark:text-white">{app.applicant.name}</span>
                          {app.coverLetter && <span className="mt-0.5 block max-w-[400px] truncate text-[11px] text-slate-500 dark:text-slate-400">{app.coverLetter}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="px-2.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-[10px] font-mono font-bold uppercase tracking-wider">{app.status}</span>
                        {app.status === "pending" && (
                          <div className="flex gap-1.5" onClick={(e) => e.preventDefault()}>
                            <button onClick={(e) => { e.preventDefault(); handleApplicationAction(app.id, "shortlisted"); }} className="btn-primary py-1.5 px-3 text-[11px]">Shortlist</button>
                            <button onClick={(e) => { e.preventDefault(); handleApplicationAction(app.id, "rejected"); }} className="btn-secondary py-1.5 px-3 text-[11px] text-red-600 border-red-200 dark:border-red-800">Reject</button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </FadeInUp>
      )}
    </div>
  );
}
