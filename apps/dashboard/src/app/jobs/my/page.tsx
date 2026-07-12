"use client";

import { useState, useEffect, useCallback } from "react";
import { config, BrandConfig } from "@thrift/config";
import { Card, Button, ColorfulBadge, FadeInUp, StaggerChildren, StatCard } from "@thrift/ui";
import { formatNaira } from "@thrift/utils";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/PageHeader";
import { Skeleton, SkeletonCard } from "@/components/Skeleton";

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

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  useEffect(() => { fetch(`${API_URL}/api/config`).then((r) => r.json()).then((d) => { if (d && d.name) setCfg((p) => ({ ...p, ...d })); }).catch(() => {}); }, [API_URL]);

  const fetchData = useCallback(async () => {
    if (!token) { setLoading(false); return; }
    try {
      const [listingsRes, receivedRes, appliedRes] = await Promise.all([
        fetch(`${API_URL}/api/jobs/my`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/api/jobs/received-applications`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/api/jobs/my-applications`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const [listingsData, receivedData, appliedData] = await Promise.all([listingsRes.json(), receivedRes.json(), appliedRes.json()]);
      if (listingsData.success) setListings(listingsData.data);
      if (receivedData.success) setReceivedApps(receivedData.data);
      if (appliedData.success) setMyApps(appliedData.data);
    } catch {}
    setLoading(false);
  }, [token, API_URL]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "clamp(1rem, 3vw, 2rem)" }}>
      <PageHeader badgeLabel="Job Board" heading="My" accentText="Jobs" description="Manage your posted jobs and applications."
        right={<a href="/jobs/new"><Button variant="primary" size="sm">+ Post Job</Button></a>} />

      <StaggerChildren staggerDelay={100} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.5rem", marginBottom: "2rem" }}>
        <StatCard label="Posted Jobs" value={String(listings.length)} change={`${listings.filter((l) => l.status === "active").length} active`} positive variant="default" />
        <StatCard label="Received Applications" value={String(receivedApps.length)} change={`${receivedApps.filter((a) => a.status === "pending").length} pending`} positive variant="warm" />
        <StatCard label="My Applications" value={String(myApps.length)} change={`${myApps.filter((a) => a.status === "shortlisted" || a.status === "accepted").length} successful`} positive variant="default" />
      </StaggerChildren>

      <FadeInUp delay={200}>
        <div style={{ display: "flex", gap: "0.25rem", backgroundColor: "#F5F7F5", borderRadius: "0.5rem", padding: "0.2rem", marginBottom: "1.5rem", width: "fit-content" }}>
          {([["posted", "Posted Jobs"], ["received", "Received Applications"], ["applied", "My Applications"]] as const).map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)}
              style={{ padding: "0.5rem 1rem", borderRadius: "0.375rem", fontSize: "12px", fontWeight: 600, border: "none", cursor: "pointer", transition: "all 0.2s ease", backgroundColor: tab === key ? "#ffffff" : "transparent", color: tab === key ? cfg.colors.primary : "#717171" }}>
              {label}
            </button>
          ))}
        </div>
      </FadeInUp>

      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.5rem" }}>{Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}</div>
      ) : tab === "posted" ? (
        listings.length === 0 ? (
          <Card padding="3rem"><div style={{ textAlign: "center" }}><h3 style={{ fontSize: "1rem", fontWeight: 600, color: "#2D2D2D", marginBottom: "0.5rem" }}>No jobs posted yet</h3><a href="/jobs/new"><Button variant="primary" size="sm">Post a Job</Button></a></div></Card>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.5rem" }}>
            {listings.map((job) => (
              <a key={job.id} href={`/jobs/${job.id}`} style={{ textDecoration: "none" }}>
                <Card padding="1.25rem">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                    <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#2D2D2D", flex: 1, marginRight: "0.5rem" }}>{job.title}</h3>
                    <span style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase", fontFamily: "'JetBrains Mono', monospace", color: STATUS_COLORS[job.status], backgroundColor: `${STATUS_COLORS[job.status]}12`, padding: "0.125rem 0.5rem", borderRadius: "0.375rem" }}>{job.status}</span>
                  </div>
                  <span style={{ padding: "0.125rem 0.5rem", borderRadius: "9999px", fontSize: "9px", fontWeight: 700, color: JOB_TYPE_COLORS[job.jobType], backgroundColor: `${JOB_TYPE_COLORS[job.jobType]}12`, textTransform: "capitalize", marginBottom: "0.5rem", display: "inline-block" }}>{job.jobType.replace("_", " ")}</span>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.5rem" }}>
                    <span style={{ fontSize: "11px", color: "#999" }}>{job.location}</span>
                    <span style={{ fontSize: "11px", color: "#999" }}>{job._count.applications} applicant{job._count.applications !== 1 ? "s" : ""}</span>
                  </div>
                </Card>
              </a>
            ))}
          </div>
        )
      ) : tab === "received" ? (
        receivedApps.length === 0 ? (
          <Card padding="3rem"><div style={{ textAlign: "center" }}><h3 style={{ fontSize: "1rem", fontWeight: 600, color: "#2D2D2D", marginBottom: "0.5rem" }}>No applications received</h3><p style={{ fontSize: "13px", color: "#717171" }}>Applications to your job listings will appear here.</p></div></Card>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {receivedApps.map((app) => (
              <a key={app.id} href={`/jobs/applications/${app.id}`} style={{ textDecoration: "none" }}>
                <Card padding="1.25rem">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <div style={{ width: "32px", height: "32px", borderRadius: "50%", backgroundColor: "#F0F0F0", color: "#717171", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700 }}>
                        {app.applicant.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                      </div>
                      <div>
                        <span style={{ fontSize: "12px", fontWeight: 600, color: "#2D2D2D", display: "block" }}>{app.applicant.name}</span>
                        <span style={{ fontSize: "11px", color: "#999" }}>for {app.listing.title}</span>
                      </div>
                    </div>
                    <span style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase", fontFamily: "'JetBrains Mono', monospace", color: STATUS_COLORS[app.status], backgroundColor: `${STATUS_COLORS[app.status]}12`, padding: "0.125rem 0.5rem", borderRadius: "0.375rem" }}>{app.status}</span>
                  </div>
                </Card>
              </a>
            ))}
          </div>
        )
      ) : myApps.length === 0 ? (
        <Card padding="3rem"><div style={{ textAlign: "center" }}><h3 style={{ fontSize: "1rem", fontWeight: 600, color: "#2D2D2D", marginBottom: "0.5rem" }}>No applications yet</h3><p style={{ fontSize: "13px", color: "#717171" }}>Your job applications will appear here.</p></div></Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {myApps.map((app) => (
            <a key={app.id} href={`/jobs/applications/${app.id}`} style={{ textDecoration: "none" }}>
              <Card padding="1.25rem">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
                  <div>
                    <span style={{ fontSize: "12px", fontWeight: 600, color: "#2D2D2D", display: "block" }}>{app.listing.title}</span>
                    <span style={{ fontSize: "11px", color: "#999" }}>{app.listing.company || "Community"} &middot; {app.listing.location}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <span style={{ padding: "0.125rem 0.5rem", borderRadius: "9999px", fontSize: "9px", fontWeight: 700, color: JOB_TYPE_COLORS[app.listing.jobType], backgroundColor: `${JOB_TYPE_COLORS[app.listing.jobType]}12`, textTransform: "capitalize" }}>{app.listing.jobType.replace("_", " ")}</span>
                    <span style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase", fontFamily: "'JetBrains Mono', monospace", color: STATUS_COLORS[app.status], backgroundColor: `${STATUS_COLORS[app.status]}12`, padding: "0.125rem 0.5rem", borderRadius: "0.375rem" }}>{app.status}</span>
                  </div>
                </div>
              </Card>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
