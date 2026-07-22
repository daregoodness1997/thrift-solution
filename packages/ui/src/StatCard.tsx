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
}

const variantStyles = {
  default: { light: { backgroundColor: "#ffffff", borderColor: "#EAEAEA", labelColor: "#999999" }, dark: { backgroundColor: "#1E293B", borderColor: "#334155", labelColor: "#94A3B8" } },
  primary: { light: { backgroundColor: config.colors.primary, borderColor: config.colors.primary, labelColor: "rgba(255,255,255,0.7)" }, dark: { backgroundColor: config.colors.primary, borderColor: config.colors.primary, labelColor: "rgba(255,255,255,0.7)" } },
  warm: { light: { backgroundColor: "#FAF9F5", borderColor: "#EDEAE3", labelColor: "#8A7D73" }, dark: { backgroundColor: "#0F172A", borderColor: "#1E293B", labelColor: "#94A3B8" } },
};

export function StatCard({ label, value, change, positive, icon, variant = "default" }: StatCardProps) {
  const [isDark, setIsDark] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains("dark"));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const s = variantStyles[variant][isDark ? "dark" : "light"];
  const isLight = variant === "primary";

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        backgroundColor: s.backgroundColor,
        borderRadius: "1.5rem",
        padding: "1.5rem",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        position: "relative",
        overflow: "hidden",
        boxShadow: isHovered
          ? isDark ? "0 12px 40px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.05)" : "0 12px 40px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.02)"
          : isDark ? "0 1px 3px rgba(0,0,0,0.2)" : "0 1px 3px rgba(0,0,0,0.04)",
        transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
        transform: isHovered ? "translateY(-4px)" : "translateY(0)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <p
            style={{
              color: s.labelColor,
              fontSize: "9px",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              fontWeight: 700,
              marginBottom: "0.375rem",
            }}
          >
            {label}
          </p>
          <p
            style={{
              color: isLight ? "#ffffff" : isDark ? "#F5F8FF" : "#1A1A1A",
              fontSize: "1.75rem",
              fontWeight: 700,
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: "-0.025em",
            }}
          >
            {value}
          </p>
        </div>
        {icon && (
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "0.75rem",
              backgroundColor: isLight ? "rgba(255,255,255,0.1)" : isDark ? "#1E293B" : "#F5F7F5",
              border: isLight ? "none" : `1px solid ${isDark ? "#334155" : "#E1E8E1"}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: isLight ? "#ffffff" : config.colors.primary,
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
            marginTop: "0.75rem",
            paddingTop: "0.5rem",
            borderTop: `1px solid ${isLight ? "rgba(255,255,255,0.15)" : isDark ? "#334155" : "#F0F0F0"}`,
          }}
        >
          {positive ? "+" : ""}{change}
        </p>
      )}
    </div>
  );
}
