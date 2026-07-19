"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { config } from "@thrift/config";
import { Card, Button, ColorfulBadge, FadeInUp } from "@thrift/ui";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/PageHeader";
import {
  TICKET_STATUS_CONFIG,
  TICKET_PRIORITY_CONFIG,
  type Ticket,
  type TicketCategory,
  type TicketListResponse,
} from "@thrift/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const LIMIT = 15;

const PRIORITIES: ("low" | "normal" | "high" | "urgent")[] = ["low", "normal", "high", "urgent"];

export default function SupportPage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const isStaff = user?.role === "admin" || user?.role === "superadmin" || user?.role === "support" || user?.role === "moderator" || user?.role === "finance";

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [categories, setCategories] = useState<TicketCategory[]>([]);
  const [form, setForm] = useState({ subject: "", description: "", priority: "normal", categoryId: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (isStaff) router.replace("/admin/support");
  }, [isStaff, router]);

  const fetchTickets = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`${API_URL}/api/support?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) {
        const payload = data.data as TicketListResponse;
        setTickets(payload.items || []);
        setTotal(payload.total || 0);
        setTotalPages(payload.totalPages || 1);
      }
    } catch {}
    setLoading(false);
  }, [token, page, statusFilter]);

  const fetchCategories = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/support/categories`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setCategories(data.data || []);
    } catch {}
  }, [token]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);
  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.subject.trim() || !form.description.trim()) {
      setError("Subject and description are required");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/support`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, categoryId: form.categoryId || undefined }),
      });
      const data = await res.json();
      if (data.success) {
        setForm({ subject: "", description: "", priority: "normal", categoryId: "" });
        setShowForm(false);
        showMessage("success", "Ticket created. Our team will respond shortly.");
        setPage(1);
        fetchTickets();
      } else {
        setError(data.error || "Failed to create ticket");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) return null;

  return (
    <>
      <PageHeader
        badgeLabel="Support"
        badgeColor={config.colors.primary}
        heading="Support"
        accentText="Tickets"
        description="Open a ticket and track responses from our team."
        right={
          !showForm && (
            <Button onClick={() => setShowForm(true)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
              New Ticket
            </Button>
          )
        }
      />

      <div className="mx-auto max-w-[1280px] p-[clamp(1rem,3vw,2rem)]">
      {message && (
        <div className={`mb-4 rounded-xl px-4 py-3 text-xs ${message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {message.text}
        </div>
      )}

      {showForm && (
        <FadeInUp>
          <Card className="mb-6 p-5">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <InputField label="Subject" value={form.subject} onChange={(v) => setForm({ ...form, subject: v })} placeholder="Brief summary of your issue" />
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={5}
                  placeholder="Describe your issue in detail"
                  className="rounded-xl border border-[#EAEAEA] bg-[#FAFAFA] p-3 text-xs text-brand-dark outline-none focus:border-brand-primary"
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Priority</label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value as any })}
                    className="rounded-xl border border-[#EAEAEA] bg-[#FAFAFA] p-2.5 text-xs text-brand-dark outline-none focus:border-brand-primary"
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p}>{TICKET_PRIORITY_CONFIG[p].label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Category</label>
                  <select
                    value={form.categoryId}
                    onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                    className="rounded-xl border border-[#EAEAEA] bg-[#FAFAFA] p-2.5 text-xs text-brand-dark outline-none focus:border-brand-primary"
                  >
                    <option value="">General</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              {error && <span className="text-xs text-red-600">{error}</span>}
              <div className="flex gap-2">
                <Button type="submit" disabled={submitting}>{submitting ? "Submitting..." : "Submit Ticket"}</Button>
                <Button variant="ghost" type="button" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </Card>
        </FadeInUp>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        <FilterChip active={statusFilter === ""} onClick={() => setStatusFilter("")}>All</FilterChip>
        {Object.entries(TICKET_STATUS_CONFIG).map(([key, cfg]) => (
          <FilterChip key={key} active={statusFilter === key} onClick={() => setStatusFilter(key)}>{cfg.label}</FilterChip>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <Card className="p-10 text-center">
          <p className="text-sm text-gray-400">No tickets yet. Open one to get help.</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {tickets.map((t) => (
            <button
              key={t.id}
              onClick={() => router.push(`/support/${t.id}`)}
              className="w-full rounded-xl border border-black/5 bg-white p-4 text-left transition-all hover:translate-x-1 hover:border-brand-primary/30 hover:shadow-sm"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-brand-dark">{t.subject}</span>
                <ColorfulBadge label={TICKET_STATUS_CONFIG[t.status].label} color={TICKET_STATUS_CONFIG[t.status].color} />
                <ColorfulBadge label={TICKET_PRIORITY_CONFIG[t.priority].label} color={TICKET_PRIORITY_CONFIG[t.priority].color} />
              </div>
              <div className="mt-1.5 flex items-center gap-3 text-[11px] text-gray-400">
                <span>#{t.id.slice(0, 8)}</span>
                <span>{t.messageCount} message{t.messageCount === 1 ? "" : "s"}</span>
                {t.categoryName && <span>· {t.categoryName}</span>}
                <span>· {new Date(t.createdAt).toLocaleDateString()}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</Button>
          <span className="text-xs text-gray-500">Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</Button>
        </div>
      )}
      </div>
    </>
  );
}

function InputField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="rounded-xl border border-[#EAEAEA] bg-[#FAFAFA] p-2.5 text-xs text-brand-dark outline-none focus:border-brand-primary"
      />
    </div>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-[11px] font-semibold transition-all ${
        active ? "bg-brand-primary text-white" : "bg-white text-gray-500 hover:bg-brand-primary/5"
      }`}
    >
      {children}
    </button>
  );
}
