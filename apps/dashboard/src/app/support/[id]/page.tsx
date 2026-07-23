"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { config } from "@thrift/config";
import { Card, Button } from "@thrift/ui";
import { useAuth } from "@/lib/auth-context";
import { Headphones } from "lucide-react";
import {
  TICKET_STATUS_CONFIG,
  TICKET_PRIORITY_CONFIG,
  type TicketWithMessages,
} from "@thrift/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();
  const router = useRouter();

  const [ticket, setTicket] = useState<TicketWithMessages | null>(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);

  const fetchTicket = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/support/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setTicket(data.data);
      else router.replace("/support");
    } catch {
      router.replace("/support");
    }
    setLoading(false);
  }, [token, id, router]);

  useEffect(() => {
    fetchTicket();
  }, [fetchTicket]);

  const sendReply = async () => {
    if (!reply.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`${API_URL}/api/support/${id}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ body: reply }),
      });
      const data = await res.json();
      if (data.success) {
        setReply("");
        fetchTicket();
      }
    } catch {
    } finally {
      setSending(false);
    }
  };

  if (loading)
    return (
      <div className="p-10 text-center text-sm text-slate-400 dark:text-slate-500">
        Loading ticket...
      </div>
    );
  if (!ticket) return null;

  return (
    <div className="mx-auto max-w-[1280px] p-[clamp(1rem,3vw,2rem)]">
      <div className="mb-8 pt-2 pb-6 border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/80 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1">
                <Headphones className="w-3.5 h-3.5 text-blue-500" />
                <span>Support</span>
              </span>
            </div>
            <h3 className="font-display font-bold text-xl sm:text-2xl text-slate-900 dark:text-white mt-1">{ticket.subject}</h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">#{ticket.id.slice(0, 8)} · opened {new Date(ticket.createdAt).toLocaleString()}</p>
          </div>
          <button className="btn-secondary" onClick={() => router.push("/support")}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-[1280px] p-[clamp(1rem,3vw,2rem)]">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span
            className="rounded-md px-2.5 py-0.5 text-[9px] font-bold capitalize"
            style={{
              color: TICKET_STATUS_CONFIG[ticket.status].color,
              backgroundColor: `${TICKET_STATUS_CONFIG[ticket.status].color}12`,
            }}
          >
            {TICKET_STATUS_CONFIG[ticket.status].label}
          </span>
          <span
            className="rounded-md px-2.5 py-0.5 text-[9px] font-bold capitalize"
            style={{
              color: TICKET_PRIORITY_CONFIG[ticket.priority].color,
              backgroundColor: `${TICKET_PRIORITY_CONFIG[ticket.priority].color}12`,
            }}
          >
            {TICKET_PRIORITY_CONFIG[ticket.priority].label}
          </span>
          {ticket.categoryName && (
            <span className="text-[11px] text-slate-400 dark:text-slate-500">
              Category: {ticket.categoryName}
            </span>
          )}
        </div>

        <Card className="mb-5 p-5 rounded-3xl">
          <p className="text-xs leading-relaxed text-slate-900 dark:text-white whitespace-pre-wrap">
            {ticket.description}
          </p>
        </Card>

        <div className="flex flex-col gap-3">
          {ticket.messages.map((m) => {
            const mine = m.userId === ticket.userId;
            return (
              <div
                key={m.id}
                className={`flex ${mine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${mine ? "bg-blue-600 text-white" : "bg-white dark:bg-slate-900 text-slate-900 dark:text-white"}`}
                >
                  <div
                    className={`mb-1 flex items-center gap-2 text-[10px] ${mine ? "text-white/70" : "text-slate-400 dark:text-slate-500"}`}
                  >
                    <span className="font-semibold">{m.userName}</span>
                    <span>{new Date(m.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="text-xs leading-relaxed whitespace-pre-wrap">
                    {m.body}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-5 rounded-3xl border border-black/5 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            rows={3}
            placeholder="Write a reply..."
            className="w-full rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-800/60 p-3 text-xs text-slate-900 dark:text-white outline-none focus:border-blue-600"
          />
          <div className="mt-3 flex justify-end">
            <button className="btn-primary" onClick={sendReply} disabled={sending || !reply.trim()}>
              {sending ? "Sending..." : "Send Reply"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
