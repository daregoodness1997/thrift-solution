"use client";

import { config } from "@thrift/config";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}

const sizeStyles = {
  sm: { padding: "0.375rem 0.875rem", fontSize: "11px" },
  md: { padding: "0.5rem 1.25rem", fontSize: "12px" },
  lg: { padding: "0.75rem 1.5rem", fontSize: "13px" },
} as const;

export function Button({
  variant = "primary",
  size = "md",
  style,
  children,
  ...props
}: ButtonProps) {
  const base: React.CSSProperties = {
    borderRadius: "9999px",
    fontWeight: 600,
    cursor: "pointer",
    border: "none",
    transition: "all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
    display: "inline-flex",
    alignItems: "center",
    gap: "0.375rem",
    letterSpacing: "0.025em",
    transform: "translateY(0)",
    ...sizeStyles[size],
  };

  const variants: Record<string, React.CSSProperties> = {
    primary: {
      backgroundColor: config.colors.primary,
      color: "#ffffff",
      boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
    },
    secondary: {
      backgroundColor: config.colors.secondary,
      color: "#ffffff",
    },
    outline: {
      backgroundColor: "transparent",
      color: config.colors.primary,
      border: `1px solid ${config.colors.primary}`,
    },
    ghost: {
      backgroundColor: "transparent",
      color: config.colors.textMuted,
    },
  };

  return (
    <button
      style={{ ...base, ...variants[variant], ...style }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.12)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = variant === "primary" ? "0 1px 3px rgba(0,0,0,0.08)" : "none";
      }}
      {...props}
    >
      {children}
    </button>
  );
}
