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

  const inputClass = "w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-2.5 px-3 text-[13px] text-slate-900 dark:text-white outline-none box-border transition-colors focus:border-blue-600";

  return (
    <div className="mx-auto max-w-[720px] p-[clamp(1rem,3vw,2rem)]">
      <PageHeader badgeLabel="Job Board" heading="Post a" accentText="Job" description="Share job opportunities with the community." />
      <FadeInUp delay={200}>
        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-8">
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-900 dark:text-white">Job Title *</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Senior Software Engineer" className={inputClass}  />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-900 dark:text-white">Description *</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the role, requirements, and benefits..." rows={5} className={`${inputClass} resize-y font-sans`}  />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-900 dark:text-white">Company</label>
                  <input type="text" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Company name" className={inputClass}  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-900 dark:text-white">Location *</label>
                  <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Lagos, Nigeria" className={inputClass}  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-900 dark:text-white">Job Type *</label>
                  <select value={jobType} onChange={(e) => setJobType(e.target.value)} className={`${inputClass} cursor-pointer`}>
                    {JOB_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-900 dark:text-white">Category *</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className={`${inputClass} cursor-pointer`}>
                    {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-900 dark:text-white">Min Salary (NGN)</label>
                  <input type="number" value={salaryMin} onChange={(e) => setSalaryMin(e.target.value)} placeholder="0" min="0" className={`${inputClass} font-mono`}  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-900 dark:text-white">Max Salary (NGN)</label>
                  <input type="number" value={salaryMax} onChange={(e) => setSalaryMax(e.target.value)} placeholder="0" min="0" className={`${inputClass} font-mono`}  />
                </div>
              </div>
              {error && <div className="rounded-2xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-xs font-medium text-red-600 dark:text-red-400">{error}</div>}
              <div className="flex items-center justify-end gap-3 pt-2">
                <a href="/jobs" className="btn-secondary py-2.5 px-5 text-[13px]">Cancel</a>
                <Button type="submit" variant="primary" size="md" className="btn-primary py-2.5 px-5 text-[13px]" disabled={submitting}>{submitting ? "Posting..." : "Post Job"}</Button>
              </div>
            </div>
          </form>
        </div>
      </FadeInUp>
    </div>
  );
}
