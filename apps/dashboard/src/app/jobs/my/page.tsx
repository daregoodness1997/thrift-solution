"use client";

import { useState, useEffect, useCallback } from "react";
import { config, BrandConfig } from "@thrift/config";
import { Card, Button, ColorfulBadge, FadeInUp, StaggerChildren, StatCard } from "@thrift/ui";
import { formatNaira } from "@thrift/utils";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/PageHeader";
import { Skeleton, SkeletonCard } from "@/components/Skeleton";
import Pagination from "@/components/Pagination";

const fallback = config;

interface JobListing {
  id: string; title: string; company?: string; location: string; jobType: string; status: string; createdAt: string;
  _count: { applications: number };
}

interface Application {
  id: string; status: string; createdAt: string;
  applicant: { id: string; name: string; email: string };
  listing: { id: string; title: string; company?: string; location: string };
}

interface MyApplication {
  id: string; status: string; createdAt: string;
  listing: { id: string; title: string; company?: string; location: string; jobType: string };
}

const JOB_TYPE_COLORS: Record<string, string> = { full_time: "#059669", part_time: "#2563EB", contract: "#D97706", internship: "#8B5CF6", remote: "#EC4899" };
const STATUS_COLORS: Record<string, string> = { active: "#059669", closed: "#DC2626", pending: "#D97706", reviewed: "#2563EB", shortlisted: "#059669", rejected: "#DC2626", accepted: "#059669" };

export default function MyJobsPage() {
  const { token } = useAuth();
  const [cfg, setCfg] = useState<BrandConfig>(fallback);
  const [listings, setListings] = useState<JobListing[]>([]);
  const [receivedApps, setReceivedApps] = useState<Application[]>([]);
  const [myApps, setMyApps] = useState<MyApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"posted" | "received" | "applied">("posted");
  const [listingsPage, setListingsPage] = useState(1);
  const [applicationsPage, setApplicationsPage] = useState(1);
  const [receivedPage, setReceivedPage] = useState(1);
  const [listingsMeta, setListingsMeta] = useState({ totalPages: 0, total: 0 });
  const [receivedMeta, setReceivedMeta] = useState({ totalPages: 0, total: 0 });
  const [appliedMeta, setAppliedMeta] = useState({ totalPages: 0, total: 0 });
  const [jobStats, setJobStats] = useState({ listingsTotal: 0, activeCount: 0, receivedTotal: 0, pendingCount: 0, appliedTotal: 0, successfulCount: 0 });

  const LIMIT = 20;
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  useEffect(() => { fetch(`${API_URL}/api/config`).then((r) => r.json()).then((d) => { if (d && d.name) setCfg((p) => ({ ...p, ...d })); }).catch(() => {}); }, [API_URL]);

  const fetchData = useCallback(async () => {
    if (!token) { setLoading(false); return; }
    try {
      const [listingsRes, receivedRes, appliedRes] = await Promise.all([
        fetch(`${API_URL}/api/jobs/my?page=${listingsPage}&limit=${LIMIT}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/api/jobs/received-applications?page=${receivedPage}&limit=${LIMIT}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/api/jobs/my-applications?page=${applicationsPage}&limit=${LIMIT}`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const [listingsData, receivedData, appliedData] = await Promise.all([listingsRes.json(), receivedRes.json(), appliedRes.json()]);
      if (listingsData.success) { setListings(listingsData.data.items); setListingsMeta({ totalPages: listingsData.data.totalPages, total: listingsData.data.total }); if (listingsData.data.stats) setJobStats((prev) => ({ ...prev, listingsTotal: listingsData.data.stats.total, activeCount: listingsData.data.stats.activeCount })); }
      if (receivedData.success) { setReceivedApps(receivedData.data.items); setReceivedMeta({ totalPages: receivedData.data.totalPages, total: receivedData.data.total }); if (receivedData.data.stats) setJobStats((prev) => ({ ...prev, receivedTotal: receivedData.data.stats.total, pendingCount: receivedData.data.stats.pendingCount })); }
      if (appliedData.success) { setMyApps(appliedData.data.items); setAppliedMeta({ totalPages: appliedData.data.totalPages, total: appliedData.data.total }); if (appliedData.data.stats) setJobStats((prev) => ({ ...prev, appliedTotal: appliedData.data.stats.total, successfulCount: appliedData.data.stats.successfulCount })); }
    } catch {}
    setLoading(false);
  }, [token, API_URL, listingsPage, receivedPage, applicationsPage]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div className="mx-auto max-w-[1280px] p-[clamp(1rem,3vw,2rem)]">
      <PageHeader badgeLabel="Job Board" heading="My" accentText="Jobs" description="Manage your posted jobs and applications."
        right={<a href="/jobs/new"><Button variant="primary" size="sm">+ Post Job</Button></a>} />

      <StaggerChildren staggerDelay={100} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.5rem", marginBottom: "2rem" }}>
        <StatCard label="Posted Jobs" value={String(jobStats.listingsTotal)} change={`${jobStats.activeCount} active`} positive variant="default" />
        <StatCard label="Received Applications" value={String(jobStats.receivedTotal)} change={`${jobStats.pendingCount} pending`} positive variant="warm" />
        <StatCard label="My Applications" value={String(jobStats.appliedTotal)} change={`${jobStats.successfulCount} successful`} positive variant="default" />
      </StaggerChildren>

      <FadeInUp delay={200}>
        <div className="mb-6 flex w-fit gap-1 rounded-lg bg-[#F5F7F5] p-0.5">
          {([["posted", "Posted Jobs"], ["received", "Received Applications"], ["applied", "My Applications"]] as const).map(([key, label]) => (
            <button key={key} onClick={() => { setTab(key); setListingsPage(1); setReceivedPage(1); setApplicationsPage(1); }}
              className="cursor-pointer rounded-md px-4 py-2 text-xs font-semibold transition-all"
              style={{ backgroundColor: tab === key ? "#ffffff" : "transparent", color: tab === key ? cfg.colors.primary : "#717171" }}>
              {label}
            </button>
          ))}
        </div>
      </FadeInUp>

      {loading ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-6">{Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}</div>
      ) : tab === "posted" ? (
        listings.length === 0 ? (
          <Card padding="3rem"><div className="text-center"><h3 className="mb-2 text-base font-semibold text-brand-dark">No jobs posted yet</h3><a href="/jobs/new"><Button variant="primary" size="sm">Post a Job</Button></a></div></Card>
        ) : (
          <>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-6">
              {listings.map((job) => (
                <a key={job.id} href={`/jobs/${job.id}`} className="no-underline">
                  <Card padding="1.25rem">
                    <div className="mb-3 flex items-start justify-between">
                      <h3 className="flex-1 mr-2 text-sm font-semibold text-brand-dark">{job.title}</h3>
                      <span className="rounded-md px-2 py-0.5 text-[9px] font-bold uppercase font-mono" style={{ color: STATUS_COLORS[job.status], backgroundColor: `${STATUS_COLORS[job.status]}12` }}>{job.status}</span>
                    </div>
                    <span className="mb-2 inline-block rounded-full px-2 py-0.5 text-[9px] font-bold capitalize" style={{ color: JOB_TYPE_COLORS[job.jobType], backgroundColor: `${JOB_TYPE_COLORS[job.jobType]}12` }}>{job.jobType.replace("_", " ")}</span>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[11px] text-gray-500">{job.location}</span>
                      <span className="text-[11px] text-gray-500">{job._count.applications} applicant{job._count.applications !== 1 ? "s" : ""}</span>
                    </div>
                  </Card>
                </a>
              ))}
            </div>
            <Pagination page={listingsPage} totalPages={listingsMeta.totalPages} total={listingsMeta.total} limit={LIMIT} onPageChange={setListingsPage} loading={loading} />
          </>
        )
      ) : tab === "received" ? (
        receivedApps.length === 0 ? (
          <Card padding="3rem"><div className="text-center"><h3 className="mb-2 text-base font-semibold text-brand-dark">No applications received</h3><p className="text-[13px] text-gray-500">Applications to your job listings will appear here.</p></div></Card>
        ) : (
          <>
            <div className="flex flex-col gap-3">
              {receivedApps.map((app) => (
                <a key={app.id} href={`/jobs/applications/${app.id}`} className="no-underline">
                  <Card padding="1.25rem">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-500">
                          {app.applicant.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                        </div>
                        <div>
                          <span className="block text-xs font-semibold text-brand-dark">{app.applicant.name}</span>
                          <span className="text-[11px] text-gray-500">for {app.listing.title}</span>
                        </div>
                      </div>
                      <span className="rounded-md px-2 py-0.5 text-[9px] font-bold uppercase font-mono" style={{ color: STATUS_COLORS[app.status], backgroundColor: `${STATUS_COLORS[app.status]}12` }}>{app.status}</span>
                    </div>
                  </Card>
                </a>
              ))}
            </div>
            <Pagination page={receivedPage} totalPages={receivedMeta.totalPages} total={receivedMeta.total} limit={LIMIT} onPageChange={setReceivedPage} loading={loading} />
          </>
        )
      ) : myApps.length === 0 ? (
        <Card padding="3rem"><div className="text-center"><h3 className="mb-2 text-base font-semibold text-brand-dark">No applications yet</h3><p className="text-[13px] text-gray-500">Your job applications will appear here.</p></div></Card>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {myApps.map((app) => (
              <a key={app.id} href={`/jobs/applications/${app.id}`} className="no-underline">
                <Card padding="1.25rem">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <span className="block text-xs font-semibold text-brand-dark">{app.listing.title}</span>
                      <span className="text-[11px] text-gray-500">{app.listing.company || "Community"} &middot; {app.listing.location}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="rounded-full px-2 py-0.5 text-[9px] font-bold capitalize" style={{ color: JOB_TYPE_COLORS[app.listing.jobType], backgroundColor: `${JOB_TYPE_COLORS[app.listing.jobType]}12` }}>{app.listing.jobType.replace("_", " ")}</span>
                      <span className="rounded-md px-2 py-0.5 text-[9px] font-bold uppercase font-mono" style={{ color: STATUS_COLORS[app.status], backgroundColor: `${STATUS_COLORS[app.status]}12` }}>{app.status}</span>
                    </div>
                  </div>
                </Card>
              </a>
            ))}
          </div>
          <Pagination page={applicationsPage} totalPages={appliedMeta.totalPages} total={appliedMeta.total} limit={LIMIT} onPageChange={setApplicationsPage} loading={loading} />
        </>
      )}
    </div>
  );
}
