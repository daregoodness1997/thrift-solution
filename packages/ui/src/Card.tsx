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
        borderRadius: "1rem",
        padding,
        border: `1px solid ${isDark ? "#334155" : "#EAEAEA"}`,
        boxShadow: isHovered && hover
          ? isDark ? "0 8px 24px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.04)" : "0 8px 24px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.02)"
          : isDark ? "0 1px 3px rgba(0,0,0,0.15)" : "0 1px 3px rgba(0,0,0,0.04)",
        transition: "all 0.2s ease-out",
        transform: isHovered && hover ? "translateY(-2px)" : "translateY(0)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
