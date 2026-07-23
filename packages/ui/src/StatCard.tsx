"use client";

import { useState, useEffect } from "react";
import { config } from "@thrift/config";

interface StatCardProps {
  label: string;
  value: string;
  change?: string;
  positive?: boolean;
  icon?: React.ReactNode;
  variant?: "default" | "primary" | "warm";
  sub?: string;
  color?: "rose" | "emerald" | "blue" | "amber" | "violet" | "teal";
}

const variantStyles = {
  default: { light: { backgroundColor: "#ffffff", borderColor: "#EAEAEA", labelColor: "#999999" }, dark: { backgroundColor: "#1E293B", borderColor: "#334155", labelColor: "#94A3B8" } },
  primary: { light: { backgroundColor: config.colors.primary, borderColor: config.colors.primary, labelColor: "rgba(255,255,255,0.7)" }, dark: { backgroundColor: config.colors.primary, borderColor: config.colors.primary, labelColor: "rgba(255,255,255,0.7)" } },
  warm: { light: { backgroundColor: "#FAF9F5", borderColor: "#EDEAE3", labelColor: "#8A7D73" }, dark: { backgroundColor: "#0F172A", borderColor: "#1E293B", labelColor: "#94A3B8" } },
};

const colorStyles: Record<string, { light: { bg: string; border: string; iconBg: string; iconColor: string; labelColor: string }; dark: { bg: string; border: string; iconBg: string; iconColor: string; labelColor: string } }> = {
  rose: {
    light: { bg: "rgba(254,205,210,0.6)", border: "rgba(254,205,210,0.8)", iconBg: "rgba(225,29,72,0.1)", iconColor: "#E11D48", labelColor: "#BE123C" },
    dark: { bg: "rgba(136,19,55,0.3)", border: "rgba(136,19,55,0.5)", iconBg: "rgba(251,113,133,0.15)", iconColor: "#FB7185", labelColor: "#FB7185" },
  },
  emerald: {
    light: { bg: "rgba(209,250,229,0.6)", border: "rgba(209,250,229,0.8)", iconBg: "rgba(5,150,105,0.1)", iconColor: "#059669", labelColor: "#047857" },
    dark: { bg: "rgba(6,78,59,0.3)", border: "rgba(6,78,59,0.5)", iconBg: "rgba(52,211,153,0.15)", iconColor: "#34D399", labelColor: "#34D399" },
  },
  blue: {
    light: { bg: "rgba(219,234,254,0.6)", border: "rgba(219,234,254,0.8)", iconBg: "rgba(37,99,235,0.1)", iconColor: "#2563EB", labelColor: "#1D4ED8" },
    dark: { bg: "rgba(30,58,138,0.3)", border: "rgba(30,58,138,0.5)", iconBg: "rgba(96,165,250,0.15)", iconColor: "#60A5FA", labelColor: "#60A5FA" },
  },
  amber: {
    light: { bg: "rgba(254,243,199,0.6)", border: "rgba(254,243,199,0.8)", iconBg: "rgba(217,119,6,0.1)", iconColor: "#D97706", labelColor: "#B45309" },
    dark: { bg: "rgba(120,53,15,0.3)", border: "rgba(120,53,15,0.5)", iconBg: "rgba(251,191,36,0.15)", iconColor: "#FBBF24", labelColor: "#FBBF24" },
  },
  violet: {
    light: { bg: "rgba(237,233,254,0.6)", border: "rgba(237,233,254,0.8)", iconBg: "rgba(124,58,237,0.1)", iconColor: "#7C3AED", labelColor: "#6D28D9" },
    dark: { bg: "rgba(76,29,149,0.3)", border: "rgba(76,29,149,0.5)", iconBg: "rgba(167,139,250,0.15)", iconColor: "#A78BFA", labelColor: "#A78BFA" },
  },
  teal: {
    light: { bg: "rgba(204,251,241,0.6)", border: "rgba(204,251,241,0.8)", iconBg: "rgba(13,148,136,0.1)", iconColor: "#0D9488", labelColor: "#0F766E" },
    dark: { bg: "rgba(19,78,74,0.3)", border: "rgba(19,78,74,0.5)", iconBg: "rgba(94,234,212,0.15)", iconColor: "#5EEAD4", labelColor: "#5EEAD4" },
  },
};

export function StatCard({ label, value, change, positive, icon, variant = "default", sub, color }: StatCardProps) {
  const [isDark, setIsDark] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains("dark"));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const isColorMode = !!color && !!colorStyles[color];
  const cs = isColorMode ? colorStyles[color][isDark ? "dark" : "light"] : null;
  const s = variantStyles[variant][isDark ? "dark" : "light"];
  const isLight = variant === "primary";

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        backgroundColor: cs ? cs.bg : s.backgroundColor,
        borderRadius: "1rem",
        padding: "1rem",
        border: `1px solid ${cs ? cs.border : s.borderColor}`,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        position: "relative",
        overflow: "hidden",
        boxShadow: isHovered
          ? isDark ? "0 12px 40px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.05)" : "0 12px 40px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.02)"
          : isDark ? "0 1px 3px rgba(0,0,0,0.2)" : "0 1px 3px rgba(0,0,0,0.04)",
        transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
        transform: isHovered ? "translateY(-2px)" : "translateY(0)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <p
            style={{
              color: cs ? cs.labelColor : isLight ? "rgba(255,255,255,0.7)" : s.labelColor,
              fontSize: "10px",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              fontWeight: 700,
              marginBottom: "0.25rem",
            }}
          >
            {label}
          </p>
          <p
            style={{
              color: isLight ? "#ffffff" : isDark ? "#F5F8FF" : "#1A1A1A",
              fontSize: "1.5rem",
              fontWeight: 700,
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: "-0.025em",
            }}
          >
            {value}
          </p>
          {sub && (
            <p
              style={{
                color: isLight ? "rgba(255,255,255,0.6)" : isDark ? "#94A3B8" : "#64748B",
                fontSize: "10px",
                marginTop: "0.25rem",
              }}
            >
              {sub}
            </p>
          )}
        </div>
        {icon && (
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "0.5rem",
              backgroundColor: cs ? cs.iconBg : isLight ? "rgba(255,255,255,0.1)" : isDark ? "#1E293B" : "#F5F7F5",
              border: cs ? "none" : isLight ? "none" : `1px solid ${isDark ? "#334155" : "#E1E8E1"}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: cs ? cs.iconColor : isLight ? "#ffffff" : config.colors.primary,
              transition: "transform 0.3s ease",
              transform: isHovered ? "scale(1.1) rotate(5deg)" : "scale(1) rotate(0deg)",
            }}
          >
            {icon}
          </div>
        )}
      </div>
      {change && (
        <p
          style={{
            color: isLight ? "rgba(255,255,255,0.8)" : positive ? "#22c55e" : "#ef4444",
            fontSize: "10px",
            fontFamily: "'JetBrains Mono', monospace",
            marginTop: "0.5rem",
            paddingTop: "0.5rem",
            borderTop: `1px solid ${cs ? cs.border : isLight ? "rgba(255,255,255,0.15)" : isDark ? "#334155" : "#F0F0F0"}`,
          }}
        >
          {positive ? "+" : ""}{change}
        </p>
      )}
    </div>
  );
}
