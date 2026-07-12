"use client";

import { BrandConfig } from "@thrift/config";

interface Props {
  config: BrandConfig;
}

export function Preview({ config }: Props) {
  return (
    <div style={{ position: "sticky", top: "1.5rem" }}>
      <h2 style={{ fontSize: "1rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#6b7280", marginBottom: "1rem" }}>
        Live Preview
      </h2>

      <div style={{
        borderRadius: "0.75rem",
        overflow: "hidden",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
      }}>
        {/* Mini Header */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0.75rem 1rem",
          backgroundColor: config.colors.background,
          borderBottom: `1px solid ${config.colors.textMuted}20`,
        }}>
          <span style={{ fontWeight: 700, color: config.colors.text, fontSize: "0.875rem" }}>
            {config.name}
          </span>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <span style={{ fontSize: "0.75rem", color: config.colors.textMuted }}>Home</span>
            <span style={{ fontSize: "0.75rem", color: config.colors.textMuted }}>About</span>
          </div>
        </div>

        {/* Mini Hero */}
        <div style={{
          padding: "2rem 1rem",
          backgroundColor: config.colors.background,
          textAlign: "center",
        }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: "0.5rem",
            backgroundColor: config.colors.primary,
            margin: "0 auto 0.75rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontWeight: 800,
            fontSize: "1.25rem",
          }}>
            {config.name.charAt(0)}
          </div>
          <h3 style={{ fontSize: "1.125rem", fontWeight: 700, color: config.colors.text, marginBottom: "0.25rem" }}>
            {config.name}
          </h3>
          <p style={{ fontSize: "0.8rem", color: config.colors.textMuted, marginBottom: "1rem" }}>
            {config.tagline}
          </p>
          <button style={{
            backgroundColor: config.colors.primary,
            color: "#fff",
            border: "none",
            borderRadius: "0.375rem",
            padding: "0.5rem 1.25rem",
            fontWeight: 600,
            fontSize: "0.8rem",
            cursor: "pointer",
          }}>
            Get Started
          </button>
        </div>

        {/* Mini Cards */}
        <div style={{
          padding: "1rem",
          backgroundColor: config.colors.surface,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "0.5rem",
        }}>
          {["$12,450", "$3,200", "148", "8.2%"].map((val, i) => (
            <div key={i} style={{
              backgroundColor: config.colors.background,
              borderRadius: "0.375rem",
              padding: "0.5rem",
            }}>
              <div style={{ fontSize: "0.6rem", color: config.colors.textMuted }}>Stat {i + 1}</div>
              <div style={{ fontSize: "0.85rem", fontWeight: 700, color: config.colors.text }}>{val}</div>
            </div>
          ))}
        </div>

        {/* Mini Footer */}
        <div style={{
          padding: "0.75rem 1rem",
          backgroundColor: config.colors.surface,
          borderTop: `1px solid ${config.colors.textMuted}20`,
          textAlign: "center",
        }}>
          <p style={{ fontSize: "0.65rem", color: config.colors.textMuted }}>
            &copy; 2026 {config.name}. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
