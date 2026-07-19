"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { config } from "@thrift/config";
import { Card, Button, ColorfulBadge } from "@thrift/ui";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/PageHeader";
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
      const res = await fetch(`${API_URL}/api/support/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setTicket(data.data);
      else router.replace("/support");
    } catch {
      router.replace("/support");
    }
    setLoading(false);
  }, [token, id, router]);

  useEffect(() => { fetchTicket(); }, [fetchTicket]);

  const sendReply = async () => {
    if (!reply.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`${API_URL}/api/support/${id}/messages`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ body: reply }),
      });
      const data = await res.json();
      if (data.success) {
        setReply("");
        fetchTicket();
      }
    } catch {} finally {
      setSending(false);
    }
  };

  if (loading) return <div className="p-10 text-center text-sm text-gray-400">Loading ticket...</div>;
  if (!ticket) return null;

  return (
    <>
      <PageHeader
        badgeLabel="Support"
        badgeColor={config.colors.primary}
        heading={ticket.subject}
        description={`#${ticket.id.slice(0, 8)} · opened ${new Date(ticket.createdAt).toLocaleString()}`}
        right={
          <Button variant="outline" onClick={() => router.push("/support")}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
            Back
          </Button>
        }
      />

      <div className="mx-auto max-w-[1280px] p-[clamp(1rem,3vw,2rem)]">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <ColorfulBadge label={TICKET_STATUS_CONFIG[ticket.status].label} color={TICKET_STATUS_CONFIG[ticket.status].color} />
        <ColorfulBadge label={TICKET_PRIORITY_CONFIG[ticket.priority].label} color={TICKET_PRIORITY_CONFIG[ticket.priority].color} />
        {ticket.categoryName && <span className="text-[11px] text-gray-400">Category: {ticket.categoryName}</span>}
      </div>

      <Card className="mb-5 p-5">
        <p className="text-xs leading-relaxed text-brand-dark whitespace-pre-wrap">{ticket.description}</p>
      </Card>

      <div className="flex flex-col gap-3">
        {ticket.messages.map((m) => {
          const mine = m.userId === ticket.userId;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${mine ? "bg-brand-primary text-white" : "bg-white text-brand-dark"}`}>
                <div className={`mb-1 flex items-center gap-2 text-[10px] ${mine ? "text-white/70" : "text-gray-400"}`}>
                  <span className="font-semibold">{m.userName}</span>
                  <span>{new Date(m.createdAt).toLocaleString()}</span>
                </div>
                <p className="text-xs leading-relaxed whitespace-pre-wrap">{m.body}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-5 rounded-xl border border-black/5 bg-white p-4">
        <textarea
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          rows={3}
          placeholder="Write a reply..."
          className="w-full rounded-xl border border-[#EAEAEA] bg-[#FAFAFA] p-3 text-xs text-brand-dark outline-none focus:border-brand-primary"
        />
        <div className="mt-3 flex justify-end">
          <Button onClick={sendReply} disabled={sending || !reply.trim()}>{sending ? "Sending..." : "Send Reply"}</Button>
        </div>
      </div>
      </div>
    </>
  );
}
