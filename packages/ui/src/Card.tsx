"use client";

import { useState } from "react";
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
  default: "#FFFFFFDF",
  surface: "#F0ECE4",
  warm: "#FAF7F0",
};

export function Card({ children, padding = "1.5rem", variant = "default", hover = true, style, className }: CardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={className}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        backgroundColor: bgMap[variant],
        borderRadius: "1.5rem",
        padding,
        boxShadow: isHovered && hover
          ? "0 16px 48px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.03)"
          : "0 2px 8px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.02)",
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
