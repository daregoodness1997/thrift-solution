"use client";

import { useState, useEffect } from "react";
import { config } from "@thrift/config";

interface CardProps {
  children: React.ReactNode;
  padding?: string;
  variant?: "default" | "surface" | "warm";
  hover?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

const bgMap = {
  default: { light: "#FFFFFFDF", dark: "#1E293B" },
  surface: { light: "#F0ECE4", dark: "#0F172A" },
  warm: { light: "#FAF7F0", dark: "#1E293B" },
};

export function Card({ children, padding = "1.5rem", variant = "default", hover = true, style, className }: CardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains("dark"));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const bg = bgMap[variant][isDark ? "dark" : "light"];

  return (
    <div
      className={className}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        backgroundColor: bg,
        borderRadius: "1.5rem",
        padding,
        boxShadow: isHovered && hover
          ? isDark ? "0 16px 48px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.05)" : "0 16px 48px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.03)"
          : isDark ? "0 2px 8px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.03)" : "0 2px 8px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.02)",
        borderTop: `3px solid ${config.colors.primary}22`,
        transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
        transform: isHovered && hover ? "translateY(-4px)" : "translateY(0)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
