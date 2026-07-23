"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, FadeIn, FadeInUp } from "@thrift/ui";
import { useAuth } from "@/lib/auth-context";
import { Settings } from "lucide-react";
import { ActionMessage, useFlashMessage } from "@/components/AdminShared";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface Config {
  appName?: string;
  tagline?: string;
  contactEmail?: string;
  supportPhone?: string;
  walletAddress?: string;
  primaryColor?: string;
  social?: { twitter?: string; instagram?: string; facebook?: string; telegram?: string };
}

const FIELDS: { key: keyof Config; label: string; placeholder: string; group: string }[] = [
  { key: "appName", label: "App Name", placeholder: "Thrift", group: "Brand" },
  { key: "tagline", label: "Tagline", placeholder: "Save together, grow together", group: "Brand" },
  { key: "primaryColor", label: "Primary Color", placeholder: "#16A34A", group: "Brand" },
  { key: "contactEmail", label: "Contact Email", placeholder: "hello@example.com", group: "Contact" },
  { key: "supportPhone", label: "Support Phone", placeholder: "+234...", group: "Contact" },
  { key: "walletAddress", label: "Platform Wallet Address", placeholder: "0x...", group: "Contact" },
];

export default function AdminConfigPage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const isAdmin = user?.role === "admin" || user?.role === "superadmin";
  const { message, show } = useFlashMessage();

  const [cfg, setCfg] = useState<Config>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && user && !isAdmin) router.replace("/");
  }, [authLoading, user, isAdmin, router]);

  const load = useCallback(async () => {
    if (!token || !isAdmin) { setLoading(false); return; }
    try {
      const res = await fetch(`${API_URL}/api/config`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setCfg(data || {});
    } catch {}
    setLoading(false);
  }, [token, isAdmin]);

  useEffect(() => { load(); }, [load]);

  const setField = (key: keyof Config, value: string) => setCfg((c) => ({ ...c, [key]: value }));
  const setSocial = (key: string, value: string) =>
    setCfg((c) => ({ ...c, social: { ...(c.social || {}), [key]: value } }));

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/config`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(cfg),
      });
      const data = await res.json();
      if (data.success) show("success", "Configuration saved");
      else show("error", data.error || "Failed to save");
    } catch {
      show("error", "Failed to save");
    }
    setSaving(false);
  };

  if (authLoading || !isAdmin) return null;

  return (
    <div className="mx-auto max-w-[1280px] p-[clamp(1rem,3vw,2rem)]">
      <div className="mb-8 pt-2 pb-6 border-b border-slate-200/80 dark:border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/80 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1">
              <Settings className="w-3.5 h-3.5 text-indigo-500" />
              <span>Admin</span>
            </span>
          </div>
          <h3 className="font-display font-bold text-xl sm:text-2xl text-slate-900 dark:text-white mt-1">Platform <span className="bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 bg-clip-text font-display font-bold text-transparent">Configuration</span></h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Edit global brand, contact, and platform settings.</p>
        </div>
      </div>

      <ActionMessage message={message} />

      {loading ? (
        <div className="p-12 text-center text-[13px] text-slate-500 dark:text-slate-400">Loading config...</div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-4">
          <FadeInUp delay={100}>
            <Card padding="1.5rem" className="rounded-3xl">
              <h3 className="mb-4 text-[13px] font-bold text-slate-900 dark:text-white">Brand</h3>
              {FIELDS.filter((f) => f.group === "Brand").map((f) => (
                <Field key={f.key} label={f.label} value={cfg[f.key] as string || ""} placeholder={f.placeholder} onChange={(v) => setField(f.key, v)} />
              ))}
              <Field label="Twitter" value={cfg.social?.twitter || ""} placeholder="https://..." onChange={(v) => setSocial("twitter", v)} />
              <Field label="Instagram" value={cfg.social?.instagram || ""} placeholder="https://..." onChange={(v) => setSocial("instagram", v)} />
              <Field label="Facebook" value={cfg.social?.facebook || ""} placeholder="https://..." onChange={(v) => setSocial("facebook", v)} />
              <Field label="Telegram" value={cfg.social?.telegram || ""} placeholder="https://..." onChange={(v) => setSocial("telegram", v)} />
            </Card>
          </FadeInUp>

          <FadeInUp delay={200}>
            <Card padding="1.5rem" className="rounded-3xl">
              <h3 className="mb-4 text-[13px] font-bold text-slate-900 dark:text-white">Contact</h3>
              {FIELDS.filter((f) => f.group === "Contact").map((f) => (
                <Field key={f.key} label={f.label} value={cfg[f.key] as string || ""} placeholder={f.placeholder} onChange={(v) => setField(f.key, v)} />
              ))}
            </Card>
          </FadeInUp>
        </div>
      )}

      <FadeIn delay={300}>
        <div className="mt-6 flex justify-end">
          <button onClick={save} disabled={saving || loading}
            className="btn-primary"
            style={{ opacity: saving ? 0.5 : 1 }}>
            {saving ? "Saving..." : "Save Configuration"}
          </button>
        </div>
      </FadeIn>
    </div>
  );
}

function Field({ label, value, placeholder, onChange }: { label: string; value: string; placeholder: string; onChange: (v: string) => void }) {
  return (
    <div className="mb-3">
      <label className="mb-1 block text-[11px] font-semibold text-slate-500 dark:text-slate-400">{label}</label>
      <input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-[12px] outline-none dark:bg-slate-800 dark:text-white"
      />
    </div>
  );
}
