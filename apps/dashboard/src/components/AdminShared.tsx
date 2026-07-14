"use client";

import { useState } from "react";
import { FadeIn } from "@thrift/ui";

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string; border: string }> = {
    completed: { bg: "#ECFDF5", color: "#059669", border: "#A7F3D0" },
    active: { bg: "#ECFDF5", color: "#059669", border: "#A7F3D0" },
    pending: { bg: "#FFFBEB", color: "#D97706", border: "#FDE68A" },
    credited: { bg: "#ECFDF5", color: "#059669", border: "#A7F3D0" },
    approved: { bg: "#EFF6FF", color: "#2563EB", border: "#BFDBFE" },
    failed: { bg: "#FEF2F2", color: "#DC2626", border: "#FECACA" },
    rejected: { bg: "#FEF2F2", color: "#DC2626", border: "#FECACA" },
    cancelled: { bg: "#FEF2F2", color: "#DC2626", border: "#FECACA" },
    removed: { bg: "#F3F4F6", color: "#4B5563", border: "#E5E7EB" },
    inactive: { bg: "#F3F4F6", color: "#4B5563", border: "#E5E7EB" },
  };
  const s = map[status] || { bg: "#F3F4F6", color: "#4B5563", border: "#E5E7EB" };
  return <span style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase", fontFamily: "'JetBrains Mono', monospace", padding: "0.125rem 0.5rem", borderRadius: "0.375rem", backgroundColor: s.bg, color: s.color, border: `1px solid ${s.border}` }}>{status}</span>;
}

export function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div style={{ backgroundColor: "#fff", border: "1px solid #F0F0F0", borderRadius: "0.75rem", padding: "1rem" }}>
      <div style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.08em", color: "#999", fontFamily: "'JetBrains Mono', monospace" }}>{label}</div>
      <div style={{ fontSize: "16px", fontWeight: 700, color: "#2D2D2D", marginTop: "0.25rem" }}>{value}</div>
      {sub && <div style={{ fontSize: "10px", color: "#999", marginTop: "0.125rem" }}>{sub}</div>}
    </div>
  );
}

export function FilterSelect({ value, onChange, options, capitalize = true }: { value: string; onChange: (v: string) => void; options: string[]; capitalize?: boolean }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}
      style={{ padding: "0.5rem 0.75rem", borderRadius: "0.5rem", border: "1px solid #E5E7EB", fontSize: "12px", backgroundColor: "#fff", textTransform: capitalize ? "capitalize" : "none" }}>
      {options.map((o) => <option key={o} value={o} style={{ textTransform: capitalize ? "capitalize" : "none" }}>{o}</option>)}
    </select>
  );
}

export function ActionMessage({ message }: { message: { type: "success" | "error"; text: string } | null }) {
  if (!message) return null;
  return (
    <FadeIn>
      <div style={{ padding: "0.75rem 1rem", borderRadius: "0.75rem", marginBottom: "1.5rem", fontSize: "13px", fontWeight: 500, backgroundColor: message.type === "success" ? "#ECFDF5" : "#FEF2F2", color: message.type === "success" ? "#059669" : "#DC2626", border: `1px solid ${message.type === "success" ? "#A7F3D0" : "#FECACA"}` }}>
        {message.text}
      </div>
    </FadeIn>
  );
}

export function useFlashMessage() {
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const show = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };
  return { message, show };
}
