"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { config, BrandConfig } from "@thrift/config";
import { Card, Button, FadeInUp } from "@thrift/ui";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";

const fallback = config;

const JOB_TYPES = [
  { value: "full_time", label: "Full Time" },
  { value: "part_time", label: "Part Time" },
  { value: "contract", label: "Contract" },
  { value: "internship", label: "Internship" },
  { value: "remote", label: "Remote" },
];

const CATEGORIES = [
  { value: "technology", label: "Technology" },
  { value: "finance", label: "Finance" },
  { value: "healthcare", label: "Healthcare" },
  { value: "education", label: "Education" },
  { value: "marketing", label: "Marketing" },
  { value: "sales", label: "Sales" },
  { value: "design", label: "Design" },
  { value: "engineering", label: "Engineering" },
  { value: "operations", label: "Operations" },
  { value: "other", label: "Other" },
];

export default function NewJobPage() {
  const { token } = useAuth();
  const router = useRouter();
  const [cfg, setCfg] = useState<BrandConfig>(fallback);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [company, setCompany] = useState("");
  const [location, setLocation] = useState("");
  const [jobType, setJobType] = useState("full_time");
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [category, setCategory] = useState("technology");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  useEffect(() => {
    fetch(`${API_URL}/api/config`)
      .then((r) => r.json())
      .then((data) => { if (data && data.name) setCfg((prev) => ({ ...prev, ...data })); })
      .catch(() => {});
  }, [API_URL]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!title.trim() || !description.trim() || !location.trim()) {
      setError("Please fill in all required fields");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/jobs`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          company: company.trim() || undefined,
          location: location.trim(),
          jobType,
          salaryMin: salaryMin ? Number(salaryMin) : undefined,
          salaryMax: salaryMax ? Number(salaryMax) : undefined,
          category,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Job posted successfully!");
        router.push(`/jobs/${data.data.id}`);
      } else {
        toast.error(data.error || "Failed to create job listing");
      }
    } catch {
      toast.error("Failed to create job listing");
    }
    setSubmitting(false);
  };

  const inputStyle: React.CSSProperties = { width: "100%", padding: "0.625rem 0.75rem", borderRadius: "0.75rem", border: "1px solid #EAEAEA", fontSize: "13px", outline: "none", boxSizing: "border-box", transition: "border-color 0.2s ease" };
  const focusProps = { onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => { e.currentTarget.style.borderColor = cfg.colors.primary; }, onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => { e.currentTarget.style.borderColor = "#EAEAEA"; } };

  return (
    <div style={{ maxWidth: "720px", margin: "0 auto", padding: "clamp(1rem, 3vw, 2rem)" }}>
      <PageHeader badgeLabel="Job Board" heading="Post a" accentText="Job" description="Share job opportunities with the community." />
      <FadeInUp delay={200}>
        <Card padding="2rem">
          <form onSubmit={handleSubmit}>
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#2D2D2D", marginBottom: "0.375rem" }}>Job Title *</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Senior Software Engineer" style={inputStyle} {...focusProps} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#2D2D2D", marginBottom: "0.375rem" }}>Description *</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the role, requirements, and benefits..." rows={5} style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }} {...focusProps} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#2D2D2D", marginBottom: "0.375rem" }}>Company</label>
                  <input type="text" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Company name" style={inputStyle} {...focusProps} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#2D2D2D", marginBottom: "0.375rem" }}>Location *</label>
                  <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Lagos, Nigeria" style={inputStyle} {...focusProps} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#2D2D2D", marginBottom: "0.375rem" }}>Job Type *</label>
                  <select value={jobType} onChange={(e) => setJobType(e.target.value)} style={{ ...inputStyle, backgroundColor: "#ffffff", cursor: "pointer" }}>
                    {JOB_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#2D2D2D", marginBottom: "0.375rem" }}>Category *</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ ...inputStyle, backgroundColor: "#ffffff", cursor: "pointer" }}>
                    {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#2D2D2D", marginBottom: "0.375rem" }}>Min Salary (NGN)</label>
                  <input type="number" value={salaryMin} onChange={(e) => setSalaryMin(e.target.value)} placeholder="0" min="0" style={{ ...inputStyle, fontFamily: "'JetBrains Mono', monospace" }} {...focusProps} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#2D2D2D", marginBottom: "0.375rem" }}>Max Salary (NGN)</label>
                  <input type="number" value={salaryMax} onChange={(e) => setSalaryMax(e.target.value)} placeholder="0" min="0" style={{ ...inputStyle, fontFamily: "'JetBrains Mono', monospace" }} {...focusProps} />
                </div>
              </div>
              {error && <div style={{ padding: "0.75rem 1rem", borderRadius: "0.75rem", backgroundColor: "#FEF2F2", border: "1px solid #FECACA", color: "#DC2626", fontSize: "12px", fontWeight: 500 }}>{error}</div>}
              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", paddingTop: "0.5rem" }}>
                <a href="/jobs" style={{ padding: "0.625rem 1.25rem", borderRadius: "9999px", fontSize: "13px", fontWeight: 600, color: "#717171", border: "1px solid #EAEAEA", textDecoration: "none" }}>Cancel</a>
                <Button type="submit" variant="primary" size="md" disabled={submitting}>{submitting ? "Posting..." : "Post Job"}</Button>
              </div>
            </div>
          </form>
        </Card>
      </FadeInUp>
    </div>
  );
}
