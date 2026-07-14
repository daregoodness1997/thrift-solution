"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, FadeIn, FadeInUp } from "@thrift/ui";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/PageHeader";
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
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "clamp(1rem, 3vw, 2rem)" }}>
      <PageHeader badgeLabel="Admin" heading="Platform" accentText="Configuration" description="Edit global brand, contact, and platform settings." />

      <ActionMessage message={message} />

      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "#999", fontSize: "13px" }}>Loading config...</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1rem" }}>
          <FadeInUp delay={100}>
            <Card padding="1.5rem">
              <h3 style={{ margin: "0 0 1rem", fontSize: "13px", fontWeight: 700, color: "#2D2D2D" }}>Brand</h3>
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
            <Card padding="1.5rem">
              <h3 style={{ margin: "0 0 1rem", fontSize: "13px", fontWeight: 700, color: "#2D2D2D" }}>Contact</h3>
              {FIELDS.filter((f) => f.group === "Contact").map((f) => (
                <Field key={f.key} label={f.label} value={cfg[f.key] as string || ""} placeholder={f.placeholder} onChange={(v) => setField(f.key, v)} />
              ))}
            </Card>
          </FadeInUp>
        </div>
      )}

      <FadeIn delay={300}>
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1.5rem" }}>
          <button onClick={save} disabled={saving || loading}
            style={{ padding: "0.6rem 1.25rem", borderRadius: "0.5rem", fontSize: "13px", fontWeight: 600, border: "none", backgroundColor: "#16A34A", color: "#fff", cursor: "pointer", opacity: saving ? 0.5 : 1 }}>
            {saving ? "Saving..." : "Save Configuration"}
          </button>
        </div>
      </FadeIn>
    </div>
  );
}

function Field({ label, value, placeholder, onChange }: { label: string; value: string; placeholder: string; onChange: (v: string) => void }) {
  return (
    <div style={{ marginBottom: "0.75rem" }}>
      <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "#717171", marginBottom: "0.25rem" }}>{label}</label>
      <input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: "0.5rem", border: "1px solid #E5E7EB", fontSize: "12px" }}
      />
    </div>
  );
}
