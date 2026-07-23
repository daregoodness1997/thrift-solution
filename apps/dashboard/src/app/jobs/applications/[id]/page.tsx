"use client";

import { useState, useEffect, useCallback } from "react";
import { config, BrandConfig } from "@thrift/config";
import { Card, Button, FadeInUp, FadeIn } from "@thrift/ui";
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
      <div className="mx-auto max-w-[800px] p-[clamp(1rem,3vw,2rem)]">
        <Skeleton width="200px" height="12px" style={{ marginBottom: "1rem" }} />
        <Skeleton width="320px" height="28px" style={{ marginBottom: "2rem" }} />
        <Skeleton width="100%" height="200px" style={{ marginBottom: "1.5rem" }} />
        <Skeleton width="100%" height="120px" />
      </div>
    );
  }

  if (!application) {
    return (
      <div className="mx-auto max-w-[800px] p-[clamp(1rem,3vw,2rem)]">
        <Card padding="3rem"><div className="text-center"><h3 className="mb-2 text-base font-semibold text-slate-900 dark:text-white">Application not found</h3><p className="mb-6 text-[13px] text-slate-500 dark:text-slate-400">This application may have been removed or you don't have access.</p><a href="/jobs/my"><Button variant="primary" size="sm">Back to My Jobs</Button></a></div></Card></div>
    );
  }

  const job = application.listing;

  return (
    <div className="mx-auto max-w-[800px] p-[clamp(1rem,3vw,2rem)]">
      <FadeIn>
        <div className="mb-6 flex items-center gap-6">
          <a href="/jobs/my" className="text-xs font-semibold no-underline text-blue-600 dark:text-blue-400">&larr; My Jobs</a>
          <a href={`/jobs/${job.id}`} className="text-xs font-semibold no-underline text-blue-600 dark:text-blue-400">View Job Listing</a>
        </div>
      </FadeIn>

      <FadeIn delay={100}>
        <Card padding="2rem" className="mb-6">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="mb-1 text-[1.25rem] font-bold text-slate-900 dark:text-white">Application for {job.title}</h1>
              <p className="text-[13px] text-slate-500 dark:text-slate-400">{job.company || job.poster.name} &middot; {job.location}</p>
            </div>
            <span className="rounded-full px-3 py-1 text-[11px] font-bold uppercase font-mono" style={{ color: APP_STATUS_COLORS[application.status], backgroundColor: `${APP_STATUS_COLORS[application.status]}12`, border: `1px solid ${APP_STATUS_COLORS[application.status]}` }}>
              {STATUS_LABELS[application.status] || application.status}
            </span>
          </div>

          <div className="mb-6 flex flex-wrap gap-6 text-xs">
            <div><span className="mb-1 block text-slate-500 dark:text-slate-400">Salary</span><span className="font-mono font-semibold text-blue-600 dark:text-blue-400">{formatSalary(job.salaryMin, job.salaryMax)}</span></div>
            <div><span className="mb-1 block text-slate-500 dark:text-slate-400">Category</span><span className="font-semibold capitalize text-slate-900 dark:text-white">{job.category}</span></div>
            <div><span className="mb-1 block text-slate-500 dark:text-slate-400">Job Type</span><span className="rounded-full px-2 py-0.5 text-[10px] font-bold capitalize" style={{ color: JOB_TYPE_COLORS[job.jobType], backgroundColor: `${JOB_TYPE_COLORS[job.jobType]}12` }}>{job.jobType.replace("_", " ")}</span></div>
            <div><span className="mb-1 block text-slate-500 dark:text-slate-400">Job Posted</span><span className="font-semibold text-slate-900 dark:text-white">{new Date(job.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</span></div>
          </div>

          <div className="mb-6 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-800/60 p-4">
            <p className="mb-2 text-xs font-semibold text-slate-900 dark:text-white">Job Description</p>
            <p className="whitespace-pre-wrap text-[13px] leading-[1.7] text-slate-900 dark:text-white">{job.description}</p>
          </div>

          <div className="flex items-center gap-3 border-t border-slate-200/80 dark:border-slate-800/80 pt-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white bg-blue-600">
              {job.poster.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
            </div>
            <div><span className="block text-xs font-semibold text-slate-900 dark:text-white">Posted by {job.poster.name}</span></div>
          </div>
        </Card>
      </FadeIn>

      <FadeInUp delay={200}>
        <Card padding="2rem" className="mb-6">
          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold" style={{ color: APP_STATUS_COLORS[application.status], backgroundColor: `${APP_STATUS_COLORS[application.status]}12` }}>Your Application</span>

          <div className="mb-6 mt-4 flex flex-wrap gap-6 text-xs">
            <div><span className="mb-1 block text-slate-500 dark:text-slate-400">Applied On</span><span className="font-semibold text-slate-900 dark:text-white">{new Date(application.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span></div>
            <div><span className="mb-1 block text-slate-500 dark:text-slate-400">Last Updated</span><span className="font-semibold text-slate-900 dark:text-white">{new Date(application.updatedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span></div>
          </div>

          {application.resumeUrl && (
            <div className="mb-6">
              <p className="mb-1.5 text-xs font-semibold text-slate-900 dark:text-white">Resume</p>
              <a href={application.resumeUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[13px] font-medium no-underline text-blue-600 dark:text-blue-400">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14,2 14,8 20,8" /></svg>
                View Resume
              </a>
            </div>
          )}

          {application.coverLetter && (
            <div>
              <p className="mb-1.5 text-xs font-semibold text-slate-900 dark:text-white">Cover Letter</p>
              <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-800/60 p-4">
                <p className="whitespace-pre-wrap text-[13px] leading-[1.7] text-slate-900 dark:text-white">{application.coverLetter}</p>
              </div>
            </div>
          )}

          {!application.resumeUrl && !application.coverLetter && (
            <p className="text-[13px] italic text-slate-500 dark:text-slate-400">No additional details provided with this application.</p>
          )}

          {isApplicant && (
            <div className="mt-6 border-t border-slate-200/80 dark:border-slate-800/80 pt-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-500 dark:text-slate-400">
                  {application.applicant.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                </div>
                <div>
                  <span className="block text-xs font-semibold text-slate-900 dark:text-white">{application.applicant.name}</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">{application.applicant.email}</span>
                </div>
              </div>
            </div>
          )}
        </Card>
      </FadeInUp>

      {isPoster && (
        <FadeInUp delay={300}>
          <Card padding="1.5rem">
            <span className="inline-flex items-center rounded-full bg-blue-50 dark:bg-blue-900/20 px-2.5 py-0.5 text-[11px] font-semibold text-blue-600 dark:text-blue-400">Manage Application</span>
            <h2 className="mb-3 mt-2 text-sm font-semibold text-slate-900 dark:text-white">Applicant</h2>

            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-[13px] font-bold text-slate-500 dark:text-slate-400">
                {application.applicant.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
              </div>
              <div>
                <span className="block text-[13px] font-semibold text-slate-900 dark:text-white">{application.applicant.name}</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">{application.applicant.email}</span>
              </div>
            </div>

            {updateSuccess && (
              <div className="mb-4 rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-3 text-xs font-medium text-emerald-600 dark:text-emerald-400">{updateSuccess}</div>
            )}

            <div className="flex flex-wrap gap-2">
              {application.status === "pending" && (
                <>
                  <button onClick={() => handleStatusUpdate("reviewed")} disabled={updating} className="cursor-pointer rounded-full border border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-800 px-4 py-2 text-xs font-semibold text-blue-600 dark:text-blue-400 disabled:opacity-50">Mark Reviewed</button>
                  <button onClick={() => handleStatusUpdate("shortlisted")} disabled={updating} className="cursor-pointer rounded-full border-none bg-emerald-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50">Shortlist</button>
                  <button onClick={() => handleStatusUpdate("rejected")} disabled={updating} className="cursor-pointer rounded-full border border-red-200 dark:border-red-800 bg-white dark:bg-slate-800 px-4 py-2 text-xs font-semibold text-red-600 dark:text-red-400 disabled:opacity-50">Reject</button>
                </>
              )}
              {application.status === "reviewed" && (
                <>
                  <button onClick={() => handleStatusUpdate("shortlisted")} disabled={updating} className="cursor-pointer rounded-full border-none bg-emerald-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50">Shortlist</button>
                  <button onClick={() => handleStatusUpdate("rejected")} disabled={updating} className="cursor-pointer rounded-full border border-red-200 dark:border-red-800 bg-white dark:bg-slate-800 px-4 py-2 text-xs font-semibold text-red-600 dark:text-red-400 disabled:opacity-50">Reject</button>
                </>
              )}
              {application.status === "shortlisted" && (
                <>
                  <button onClick={() => handleStatusUpdate("accepted")} disabled={updating} className="cursor-pointer rounded-full border-none bg-emerald-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50">Accept</button>
                  <button onClick={() => handleStatusUpdate("rejected")} disabled={updating} className="cursor-pointer rounded-full border border-red-200 dark:border-red-800 bg-white dark:bg-slate-800 px-4 py-2 text-xs font-semibold text-red-600 dark:text-red-400 disabled:opacity-50">Reject</button>
                </>
              )}
              {!["pending", "reviewed", "shortlisted"].includes(application.status) && (
                <p className="text-xs italic text-slate-500 dark:text-slate-400">This application has been {application.status}.</p>
              )}
            </div>
          </Card>
        </FadeInUp>
      )}
    </div>
  );
}
