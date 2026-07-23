"use client";

import { useState, useEffect, useCallback } from "react";
import { config, BrandConfig } from "@thrift/config";
import { Card, Button, FadeInUp, FadeIn, StaggerChildren } from "@thrift/ui";
import { formatNaira } from "@thrift/utils";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/PageHeader";
import { Skeleton, SkeletonCard } from "@/components/Skeleton";

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
  _count: { applications: number };
}

const JOB_TYPES = [
  { key: "", label: "All" },
  { key: "full_time", label: "Full Time" },
  { key: "part_time", label: "Part Time" },
  { key: "contract", label: "Contract" },
  { key: "internship", label: "Internship" },
  { key: "remote", label: "Remote" },
];

const JOB_TYPE_COLORS: Record<string, string> = {
  full_time: "#059669",
  part_time: "#2563EB",
  contract: "#D97706",
  internship: "#8B5CF6",
  remote: "#EC4899",
};

export default function JobsPage() {
  const { token } = useAuth();
  const [cfg, setCfg] = useState<BrandConfig>(fallback);
  const [listings, setListings] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [jobType, setJobType] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  useEffect(() => {
    fetch(`${API_URL}/api/config`)
      .then((r) => r.json())
      .then((data) => { if (data && data.name) setCfg((prev) => ({ ...prev, ...data })); })
      .catch(() => {});
  }, [API_URL]);

  const fetchListings = useCallback(async () => {
    if (!token) { setLoading(false); return; }
    try {
      const params = new URLSearchParams({ page: String(page), limit: "12" });
      if (jobType) params.set("jobType", jobType);
      if (search) params.set("search", search);

      const res = await fetch(`${API_URL}/api/jobs?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setListings(data.data.items);
        setTotalPages(data.data.totalPages);
      }
    } catch {}
    setLoading(false);
  }, [token, API_URL, page, jobType, search]);

  useEffect(() => { setLoading(true); fetchListings(); }, [fetchListings]);

  const formatSalary = (min?: number, max?: number) => {
    if (!min && !max) return null;
    if (min && max) return `${formatNaira(min)} - ${formatNaira(max)}`;
    if (min) return `From ${formatNaira(min)}`;
    return `Up to ${formatNaira(max!)}`;
  };

  return (
    <div className="mx-auto max-w-[1280px] p-[clamp(1rem,3vw,2rem)]">
      <PageHeader
        badgeLabel="Job Board"
        heading="Find"
        accentText="Opportunities"
        description="Browse job openings posted by community members."
        right={
          <div className="flex gap-3">
               <a href="/jobs/my">
              <Button variant="outline" size="sm" className="btn-secondary py-2 px-4 text-xs">My Jobs</Button>
            </a>
            <a href="/jobs/new">
              <Button variant="primary" size="sm" className="btn-primary py-2 px-4 text-xs">+ Post Job</Button>
            </a>
          </div>
        }
      />

      <FadeIn delay={100}>
        <div className="mb-8">
          <form onSubmit={(e) => { e.preventDefault(); setPage(1); }} className="mb-4 flex flex-wrap gap-3">
            <div className="relative flex-[1_1_300px]">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              <input type="text" placeholder="Search jobs..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-2.5 pl-9 pr-3 text-[13px] text-slate-900 dark:text-white outline-none box-border transition-colors focus:border-blue-600" />
            </div>
          </form>
          <div className="flex flex-wrap gap-1.5">
            {JOB_TYPES.map((t) => (
              <button key={t.key} onClick={() => { setJobType(t.key); setPage(1); }}
                className={`rounded-full px-3 py-1.5 text-[11px] font-semibold cursor-pointer transition-all border ${jobType === t.key ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400" : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400"}`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </FadeIn>

      {loading ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(360px,1fr))] gap-6">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : listings.length === 0 ? (
        <FadeInUp>
          <Card padding="3rem">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/20">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth={1.5} strokeLinecap="round">
                  <path d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="mb-2 text-base font-semibold text-slate-900 dark:text-white">No jobs found</h3>
              <p className="mb-6 text-[13px] text-slate-500 dark:text-slate-400">
                {search || jobType ? "Try adjusting your search or filters." : "Be the first to post a job opening!"}
              </p>
              <a href="/jobs/new"><Button variant="primary" size="sm">Post a Job</Button></a>
            </div>
          </Card>
        </FadeInUp>
      ) : (
        <>
          <StaggerChildren staggerDelay={60} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: "1.5rem", marginBottom: "2rem" }}>
            {listings.map((job) => (
              <a key={job.id} href={`/jobs/${job.id}`} className="no-underline">
                <Card padding="1.5rem" className="cursor-pointer rounded-3xl">
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="mb-1 text-[15px] font-semibold text-slate-900 dark:text-white">{job.title}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{job.company || job.poster.name}</p>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-mono font-bold uppercase tracking-wider">
                      {job.jobType.replace("_", " ")}
                    </span>
                  </div>
                  <div className="mb-3 flex flex-wrap items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>
                      {job.location}
                    </span>
                    {formatSalary(job.salaryMin, job.salaryMax) && (
                      <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">
                        {formatSalary(job.salaryMin, job.salaryMax)}
                      </span>
                    )}
                  </div>
                  <p className="mb-3 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
                    {job.description}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                    <span>{job._count.applications} applicant{job._count.applications !== 1 ? "s" : ""}</span>
                    <span>{new Date(job.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                  </div>
                </Card>
              </a>
            ))}
          </StaggerChildren>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="btn-secondary py-2 px-4 text-xs disabled:opacity-50 disabled:cursor-not-allowed">Previous</button>
              <span className="px-4 py-2 text-xs text-slate-500 dark:text-slate-400 font-mono">Page {page} of {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="btn-secondary py-2 px-4 text-xs disabled:opacity-50 disabled:cursor-not-allowed">Next</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
