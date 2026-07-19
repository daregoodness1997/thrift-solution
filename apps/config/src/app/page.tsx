"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { BrandConfig } from "@thrift/config";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const fallback: BrandConfig = {
  name: "Thrift Solution",
  tagline: "Smart saving, smarter living.",
  logo: "/logo.png",
  favicon: "/favicon.ico",
  colors: {
    primary: "#4A5D4E",
    secondary: "#3D4D40",
    accent: "#8A7D73",
    background: "#FDFDFC",
    surface: "#F5F7F5",
    text: "#2D2D2D",
    textMuted: "#717171",
  },
  contact: {
    email: "hello@thriftsolution.com",
    website: "https://thriftsolution.com",
  },
  socials: {},
  legal: {},
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        borderRadius: "1.5rem",
        padding: "1.5rem",
        marginBottom: "1rem",
      }}
    >
      <h3
        style={{
          fontSize: "9px",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          color: "#999999",
          marginBottom: "1rem",
        }}
      >
        {title}
      </h3>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem", flex: 1 }}>
      <label style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#999999", fontWeight: 700 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function TextInput({ value, onChange, type = "text", placeholder }: { value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        backgroundColor: "#FAFAFA",
        border: "1px solid #EAEAEA",
        borderRadius: "0.75rem",
        padding: "0.5rem 0.75rem",
        fontSize: "12px",
        color: "#2D2D2D",
        outline: "none",
        width: "100%",
        fontFamily: "inherit",
        transition: "border-color 0.2s",
      }}
    />
  );
}

function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem", flex: 1 }}>
      <label style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#999999", fontWeight: 700 }}>
        {label}
      </label>
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{ width: "36px", height: "36px", border: "1px solid #EAEAEA", borderRadius: "0.5rem", cursor: "pointer", padding: "2px" }}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            flex: 1,
            backgroundColor: "#FAFAFA",
            border: "1px solid #EAEAEA",
            borderRadius: "0.75rem",
            padding: "0.5rem 0.75rem",
            fontSize: "12px",
            fontFamily: "'JetBrains Mono', monospace",
            color: "#2D2D2D",
            outline: "none",
          }}
        />
      </div>
    </div>
  );
}

export default function ConfigPage() {
  const [config, setConfig] = useState<BrandConfig>(fallback);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/config`)
      .then((r) => r.json())
      .then((data) => {
        if (data && data.name) setConfig((prev) => ({ ...prev, ...data }));
      })
      .catch(() => {});
  }, []);

  function set(path: string, value: string) {
    const keys = path.split(".");
    const next = JSON.parse(JSON.stringify(config));
    let obj: any = next;
    for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
    obj[keys[keys.length - 1]] = value;
    setConfig(next);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (res.ok) {
        toast.success("Config saved successfully");
      } else {
        toast.error("Failed to save config");
      }
    } catch {
      toast.error("Could not reach backend");
    }
    setSaving(false);
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#FDFDFC" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "2rem" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
          <div>
            <span style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.15em", color: config.colors.primary, fontWeight: 700, display: "block" }}>
              White Label Config
            </span>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 300, color: "#1A1A1A", letterSpacing: "-0.025em" }}>
              Brand Configuration
            </h1>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              backgroundColor: config.colors.primary,
              color: "#ffffff",
              border: "none",
              borderRadius: "9999px",
              padding: "0.5rem 1.5rem",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? "Saving..." : "Save Config"}
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "1.5rem", alignItems: "start" }}>
          {/* Form */}
          <div>
            <Section title="Identity">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
                <Field label="Company Name">
                  <TextInput value={config.name} onChange={(v) => set("name", v)} />
                </Field>
                <Field label="Tagline">
                  <TextInput value={config.tagline} onChange={(v) => set("tagline", v)} />
                </Field>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <Field label="Logo Path">
                  <TextInput value={config.logo} onChange={(v) => set("logo", v)} placeholder="/logo.png" />
                </Field>
                <Field label="Favicon Path">
                  <TextInput value={config.favicon} onChange={(v) => set("favicon", v)} placeholder="/favicon.ico" />
                </Field>
              </div>
            </Section>

            <Section title="Colors">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
                <ColorInput label="Primary" value={config.colors.primary} onChange={(v) => set("colors.primary", v)} />
                <ColorInput label="Secondary" value={config.colors.secondary} onChange={(v) => set("colors.secondary", v)} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
                <ColorInput label="Accent" value={config.colors.accent} onChange={(v) => set("colors.accent", v)} />
                <ColorInput label="Background" value={config.colors.background} onChange={(v) => set("colors.background", v)} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <ColorInput label="Surface" value={config.colors.surface} onChange={(v) => set("colors.surface", v)} />
                <ColorInput label="Text" value={config.colors.text} onChange={(v) => set("colors.text", v)} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginTop: "0.75rem" }}>
                <ColorInput label="Text Muted" value={config.colors.textMuted} onChange={(v) => set("colors.textMuted", v)} />
              </div>
            </Section>

            <Section title="Contact">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
                <Field label="Email">
                  <TextInput value={config.contact.email} onChange={(v) => set("contact.email", v)} type="email" />
                </Field>
                <Field label="Website">
                  <TextInput value={config.contact.website} onChange={(v) => set("contact.website", v)} />
                </Field>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <Field label="Phone">
                  <TextInput value={config.contact.phone || ""} onChange={(v) => set("contact.phone", v)} />
                </Field>
                <Field label="Address">
                  <TextInput value={config.contact.address || ""} onChange={(v) => set("contact.address", v)} />
                </Field>
              </div>
            </Section>

            <Section title="Socials">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
                <Field label="Twitter">
                  <TextInput value={config.socials?.twitter || ""} onChange={(v) => set("socials.twitter", v)} placeholder="https://twitter.com/..." />
                </Field>
                <Field label="Facebook">
                  <TextInput value={config.socials?.facebook || ""} onChange={(v) => set("socials.facebook", v)} placeholder="https://facebook.com/..." />
                </Field>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <Field label="Instagram">
                  <TextInput value={config.socials?.instagram || ""} onChange={(v) => set("socials.instagram", v)} placeholder="https://instagram.com/..." />
                </Field>
                <Field label="LinkedIn">
                  <TextInput value={config.socials?.linkedin || ""} onChange={(v) => set("socials.linkedin", v)} placeholder="https://linkedin.com/..." />
                </Field>
              </div>
            </Section>

            <Section title="Legal">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <Field label="Privacy Policy URL">
                  <TextInput value={config.legal?.privacyPolicy || ""} onChange={(v) => set("legal.privacyPolicy", v)} />
                </Field>
                <Field label="Terms of Service URL">
                  <TextInput value={config.legal?.termsOfService || ""} onChange={(v) => set("legal.termsOfService", v)} />
                </Field>
              </div>
            </Section>
          </div>

          {/* Preview */}
          <div style={{ position: "sticky", top: "1.5rem" }}>
            <div style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#999999", marginBottom: "1rem" }}>
              Live Preview
            </div>

            <div style={{ borderRadius: "1.5rem", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
              {/* Mini Header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.75rem 1rem", backgroundColor: config.colors.background, borderBottom: "1px solid #EAEAEA" }}>
                <span style={{ fontWeight: 800, color: config.colors.primary, fontSize: "12px", letterSpacing: "-0.05em" }}>
                  {config.name.toUpperCase().replace(/\s+/g, "")}
                </span>
                <div style={{ display: "flex", gap: "0.75rem" }}>
                  <span style={{ fontSize: "10px", color: "#717171", fontWeight: 500 }}>Marketplace</span>
                  <span style={{ fontSize: "10px", color: "#717171", fontWeight: 500 }}>Dashboard</span>
                </div>
              </div>

              {/* Mini Hero */}
              <div style={{ padding: "1.5rem 1rem", backgroundColor: "#F5F7F5", textAlign: "center" }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", backgroundColor: config.colors.primary, margin: "0 auto 0.5rem", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: "14px" }}>
                  {config.name.charAt(0)}
                </div>
                <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#1A1A1A", marginBottom: "0.125rem" }}>
                  {config.name}
                </h3>
                <p style={{ fontSize: "10px", color: "#717171", fontWeight: 300, marginBottom: "0.75rem" }}>
                  {config.tagline}
                </p>
                <button style={{ backgroundColor: config.colors.primary, color: "#fff", border: "none", borderRadius: "9999px", padding: "0.375rem 1rem", fontWeight: 600, fontSize: "10px", cursor: "pointer" }}>
                  Get Started
                </button>
              </div>

              {/* Mini Stats */}
              <div style={{ padding: "0.75rem", backgroundColor: config.colors.surface, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                {["$12,450", "$3,200", "148", "8.2%"].map((val, i) => (
                  <div key={i} style={{ backgroundColor: "#ffffff", borderRadius: "0.5rem", padding: "0.5rem" }}>
                    <div style={{ fontSize: "8px", color: "#999", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700 }}>Stat {i + 1}</div>
                    <div style={{ fontSize: "12px", fontWeight: 700, color: "#1A1A1A", fontFamily: "'JetBrains Mono', monospace" }}>{val}</div>
                  </div>
                ))}
              </div>

              {/* Mini Footer */}
              <div style={{ padding: "0.5rem 1rem", backgroundColor: "#ffffff", borderTop: "1px solid #EAEAEA", textAlign: "center" }}>
                <p style={{ fontSize: "8px", color: "#999", textTransform: "uppercase", letterSpacing: "0.2em" }}>
                  &copy; 2026 {config.name.toUpperCase()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
