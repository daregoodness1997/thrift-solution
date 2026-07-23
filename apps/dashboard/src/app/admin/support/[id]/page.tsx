"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, Button } from "@thrift/ui";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/PageHeader";
import {
  TICKET_STATUS_CONFIG,
  TICKET_PRIORITY_CONFIG,
  type TicketWithMessages,
  type TicketCategory,
} from "@thrift/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const STATUSES = Object.keys(TICKET_STATUS_CONFIG) as (keyof typeof TICKET_STATUS_CONFIG)[];
const PRIORITIES = Object.keys(TICKET_PRIORITY_CONFIG) as (keyof typeof TICKET_PRIORITY_CONFIG)[];

export default function AdminTicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();
  const router = useRouter();

  const [ticket, setTicket] = useState<TicketWithMessages | null>(null);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<TicketCategory[]>([]);
  const [agents, setAgents] = useState<{ id: string; name: string; email: string }[]>([]);

  const [reply, setReply] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const [sending, setSending] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchTicket = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/support/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setTicket(data.data);
      else router.replace("/admin/support");
    } catch { router.replace("/admin/support"); }
    setLoading(false);
  }, [token, id, router]);

  const fetchMeta = useCallback(async () => {
    if (!token) return;
    try {
      const [catRes, agentRes] = await Promise.all([
        fetch(`${API_URL}/api/support/categories`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/api/support/admin/agents`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const catData = await catRes.json();
      const agentData = await agentRes.json();
      if (catData.success) setCategories(catData.data || []);
      if (agentData.success) setAgents(agentData.data || []);
    } catch {}
  }, [token]);

  useEffect(() => { fetchTicket(); }, [fetchTicket]);
  useEffect(() => { fetchMeta(); }, [fetchMeta]);

  const patchTicket = async (patch: Record<string, unknown>) => {
    if (!ticket) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/support/${id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (data.success) setTicket(data.data);
    } catch {} finally { setSaving(false); }
  };

  const assign = async (assigneeId: string) => {
    try {
      const res = await fetch(`${API_URL}/api/support/${id}/assign`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ assigneeId: assigneeId || null }),
      });
      const data = await res.json();
      if (data.success) setTicket(data.data);
    } catch {}
  };

  const sendMessage = async (body: string, isInternal: boolean) => {
    if (!body.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`${API_URL}/api/support/${id}/messages`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ body, isInternal }),
      });
      const data = await res.json();
      if (data.success) {
        isInternal ? setInternalNote("") : setReply("");
        fetchTicket();
      }
    } catch {} finally { setSending(false); }
  };

  if (loading) return <div className="p-10 text-center text-sm text-slate-400">Loading ticket...</div>;
  if (!ticket) return null;

  return (
    <>
      <PageHeader
        badgeLabel="Support"
        badgeColor="#2563EB"
        heading={ticket.subject}
        description={`#${ticket.id.slice(0, 8)} · from ${ticket.userName} (${ticket.userEmail})`}
        right={
          <Button variant="outline" onClick={() => router.push("/admin/support")}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
            Back
          </Button>
        }
      />

      <div className="mx-auto max-w-[1280px] p-[clamp(1rem,3vw,2rem)]">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <ColorfulBadgeInline label={TICKET_STATUS_CONFIG[ticket.status].label} color={TICKET_STATUS_CONFIG[ticket.status].color} />
            <ColorfulBadgeInline label={TICKET_PRIORITY_CONFIG[ticket.priority].label} color={TICKET_PRIORITY_CONFIG[ticket.priority].color} />
            {ticket.categoryName && <span className="text-[11px] text-slate-400">Category: {ticket.categoryName}</span>}
          </div>

          <Card className="mb-5 p-5">
            <p className="text-xs leading-relaxed text-slate-900 dark:text-white whitespace-pre-wrap">{ticket.description}</p>
          </Card>

          <div className="flex flex-col gap-3">
            {ticket.messages.map((m) => (
              <div key={m.id} className={`flex ${m.isInternal ? "justify-center" : m.userId === ticket.userId ? "justify-end" : "justify-start"}`}>
                {m.isInternal ? (
                  <div className="max-w-[85%] rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 px-4 py-2 text-[11px] text-amber-800 dark:text-amber-300">
                    <span className="font-bold">Internal note</span> · {m.userName} · {new Date(m.createdAt).toLocaleString()}
                    <p className="mt-1 whitespace-pre-wrap text-amber-900 dark:text-amber-200">{m.body}</p>
                  </div>
                ) : (
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${m.userId === ticket.userId ? "bg-blue-600 text-white" : "bg-white dark:bg-slate-800 text-slate-900 dark:text-white"}`}>
                    <div className={`mb-1 flex items-center gap-2 text-[10px] ${m.userId === ticket.userId ? "text-white/70" : "text-slate-400"}`}>
                      <span className="font-semibold">{m.userName}</span>
                      <span>{new Date(m.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-xs leading-relaxed whitespace-pre-wrap">{m.body}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-4">
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">Reply to member</label>
            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              rows={3}
              placeholder="Write a public reply..."
              className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3 text-xs text-slate-900 dark:text-white outline-none focus:border-blue-600"
            />
            <div className="mt-3 flex justify-end">
              <Button onClick={() => sendMessage(reply, false)} disabled={sending || !reply.trim()}>{sending ? "Sending..." : "Send Reply"}</Button>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10 p-4">
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">Internal note (not visible to member)</label>
            <textarea
              value={internalNote}
              onChange={(e) => setInternalNote(e.target.value)}
              rows={2}
              placeholder="Add an internal note for agents..."
              className="w-full rounded-2xl border border-amber-200 dark:border-amber-800 bg-white dark:bg-slate-800 p-3 text-xs text-slate-900 dark:text-white outline-none focus:border-amber-400"
            />
            <div className="mt-3 flex justify-end">
              <Button variant="outline" onClick={() => sendMessage(internalNote, true)} disabled={sending || !internalNote.trim()}>Add Internal Note</Button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <Card className="flex flex-col gap-4 p-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Status</label>
              <select
                value={ticket.status}
                disabled={saving}
                onChange={(e) => patchTicket({ status: e.target.value })}
                className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-blue-600"
              >
                {STATUSES.map((s) => <option key={s} value={s}>{TICKET_STATUS_CONFIG[s].label}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Priority</label>
              <select
                value={ticket.priority}
                disabled={saving}
                onChange={(e) => patchTicket({ priority: e.target.value })}
                className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-blue-600"
              >
                {PRIORITIES.map((p) => <option key={p} value={p}>{TICKET_PRIORITY_CONFIG[p].label}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Category</label>
              <select
                value={ticket.categoryId ?? ""}
                disabled={saving}
                onChange={(e) => patchTicket({ categoryId: e.target.value || undefined })}
                className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-blue-600"
              >
                <option value="">General</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Assignee</label>
              <select
                value={ticket.assigneeId ?? ""}
                onChange={(e) => assign(e.target.value)}
                className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-blue-600"
              >
                <option value="">Unassigned</option>
                {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div className="border-t border-slate-200/80 dark:border-slate-800/80 pt-3 text-[11px] text-slate-400">
              <p>Opened: {new Date(ticket.createdAt).toLocaleString()}</p>
              <p>Updated: {new Date(ticket.updatedAt).toLocaleString()}</p>
              {ticket.closedAt && <p>Closed: {new Date(ticket.closedAt).toLocaleString()}</p>}
            </div>
          </Card>
        </div>
      </div>
      </div>
    </>
  );
}

function ColorfulBadgeInline({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="rounded-full px-2 py-0.5 text-[10px] font-semibold border"
      style={{
        backgroundColor: `${color}15`,
        color,
        borderColor: `${color}30`,
      }}
    >
      {label}
    </span>
  );
}
