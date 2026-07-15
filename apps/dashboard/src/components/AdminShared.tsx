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
  return <span className="text-[9px] font-bold uppercase font-mono px-2 py-0.5 rounded-md" style={{ backgroundColor: s.bg, color: s.color, border: `1px solid ${s.border}` }}>{status}</span>;
}

export function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4">
      <div className="text-[9px] uppercase tracking-[0.08em] text-gray-400 font-mono">{label}</div>
      <div className="text-base font-bold text-brand-dark mt-1">{value}</div>
      {sub && <div className="text-[10px] text-gray-400 mt-0.5">{sub}</div>}
    </div>
  );
}

export function FilterSelect({ value, onChange, options, capitalize = true }: { value: string; onChange: (v: string) => void; options: string[]; capitalize?: boolean }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}
      className="px-3 py-2 rounded-lg border border-gray-200 text-xs bg-white"
      style={{ textTransform: capitalize ? "capitalize" : "none" }}>
      {options.map((o) => <option key={o} value={o} style={{ textTransform: capitalize ? "capitalize" : "none" }}>{o}</option>)}
    </select>
  );
}

export function ActionMessage({ message }: { message: { type: "success" | "error"; text: string } | null }) {
  if (!message) return null;
  return (
    <FadeIn>
      <div className="px-4 py-3 rounded-xl mb-6 text-[13px] font-medium"
        style={{ backgroundColor: message.type === "success" ? "#ECFDF5" : "#FEF2F2", color: message.type === "success" ? "#059669" : "#DC2626", border: `1px solid ${message.type === "success" ? "#A7F3D0" : "#FECACA"}` }}>
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
