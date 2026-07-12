"use client";

import { BrandConfig } from "@thrift/config";
import { Input, Button, Card } from "@thrift/ui";

interface Props {
  config: BrandConfig;
  onChange: (config: BrandConfig) => void;
  onSave: () => void;
  saving: boolean;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card style={{ marginBottom: "1rem" }}>
      <h3 style={{ fontSize: "0.875rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#6b7280", marginBottom: "1rem" }}>
        {title}
      </h3>
      {children}
    </Card>
  );
}

function FieldRow({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
      {children}
    </div>
  );
}

export function ConfigForm({ config, onChange, onSave, saving }: Props) {
  function set(path: string, value: string) {
    const keys = path.split(".");
    const next = JSON.parse(JSON.stringify(config));
    let obj: any = next;
    for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
    obj[keys[keys.length - 1]] = value;
    onChange(next);
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>Brand Configuration</h1>
        <Button onClick={onSave} disabled={saving}>
          {saving ? "Saving..." : "Save Config"}
        </Button>
      </div>

      <Section title="Identity">
        <FieldRow>
          <Input label="Company Name" value={config.name} onChange={(e) => set("name", e.target.value)} />
          <Input label="Tagline" value={config.tagline} onChange={(e) => set("tagline", e.target.value)} />
        </FieldRow>
        <FieldRow>
          <Input label="Logo Path" value={config.logo} onChange={(e) => set("logo", e.target.value)} placeholder="/logo.svg" />
          <Input label="Favicon Path" value={config.favicon} onChange={(e) => set("favicon", e.target.value)} placeholder="/favicon.ico" />
        </FieldRow>
      </Section>

      <Section title="Colors">
        <FieldRow>
          <Input label="Primary" value={config.colors.primary} onChange={(e) => set("colors.primary", e.target.value)} type="color" style={{ height: "2.5rem", padding: "0.25rem" }} />
          <Input label="Secondary" value={config.colors.secondary} onChange={(e) => set("colors.secondary", e.target.value)} type="color" style={{ height: "2.5rem", padding: "0.25rem" }} />
        </FieldRow>
        <FieldRow>
          <Input label="Accent" value={config.colors.accent} onChange={(e) => set("colors.accent", e.target.value)} type="color" style={{ height: "2.5rem", padding: "0.25rem" }} />
          <Input label="Background" value={config.colors.background} onChange={(e) => set("colors.background", e.target.value)} type="color" style={{ height: "2.5rem", padding: "0.25rem" }} />
        </FieldRow>
        <FieldRow>
          <Input label="Surface" value={config.colors.surface} onChange={(e) => set("colors.surface", e.target.value)} type="color" style={{ height: "2.5rem", padding: "0.25rem" }} />
          <Input label="Text" value={config.colors.text} onChange={(e) => set("colors.text", e.target.value)} type="color" style={{ height: "2.5rem", padding: "0.25rem" }} />
        </FieldRow>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          <Input label="Text Muted" value={config.colors.textMuted} onChange={(e) => set("colors.textMuted", e.target.value)} type="color" style={{ height: "2.5rem", padding: "0.25rem" }} />
        </div>
      </Section>

      <Section title="Contact">
        <FieldRow>
          <Input label="Email" value={config.contact.email} onChange={(e) => set("contact.email", e.target.value)} type="email" />
          <Input label="Website" value={config.contact.website} onChange={(e) => set("contact.website", e.target.value)} />
        </FieldRow>
        <FieldRow>
          <Input label="Phone" value={config.contact.phone || ""} onChange={(e) => set("contact.phone", e.target.value)} />
          <Input label="Address" value={config.contact.address || ""} onChange={(e) => set("contact.address", e.target.value)} />
        </FieldRow>
      </Section>

      <Section title="Socials">
        <FieldRow>
          <Input label="Twitter" value={config.socials?.twitter || ""} onChange={(e) => set("socials.twitter", e.target.value)} placeholder="https://twitter.com/..." />
          <Input label="Facebook" value={config.socials?.facebook || ""} onChange={(e) => set("socials.facebook", e.target.value)} placeholder="https://facebook.com/..." />
        </FieldRow>
        <FieldRow>
          <Input label="Instagram" value={config.socials?.instagram || ""} onChange={(e) => set("socials.instagram", e.target.value)} placeholder="https://instagram.com/..." />
          <Input label="LinkedIn" value={config.socials?.linkedin || ""} onChange={(e) => set("socials.linkedin", e.target.value)} placeholder="https://linkedin.com/..." />
        </FieldRow>
      </Section>

      <Section title="Legal">
        <FieldRow>
          <Input label="Privacy Policy URL" value={config.legal?.privacyPolicy || ""} onChange={(e) => set("legal.privacyPolicy", e.target.value)} />
          <Input label="Terms of Service URL" value={config.legal?.termsOfService || ""} onChange={(e) => set("legal.termsOfService", e.target.value)} />
        </FieldRow>
      </Section>
    </div>
  );
}
