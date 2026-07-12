"use client";

import { useState, useEffect } from "react";
import { config } from "@thrift/config";
import { Logo } from "./Logo";

interface NavItem {
  label: string;
  href: string;
  active?: boolean;
}

interface HeaderProps {
  nav?: NavItem[];
  actions?: React.ReactNode;
}

export function Header({ nav = [], actions }: HeaderProps) {
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return (
    <header
      style={{
        borderBottom: "1px solid rgba(0,0,0,0.06)",
        background: `linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,246,240,0.95) 100%)`,
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        position: "sticky",
        top: 0,
        zIndex: 40,
        animation: "fadeInDown 0.5s ease-out both",
        boxShadow: "0 1px 8px rgba(0,0,0,0.04)",
      }}
    >
      <nav
        style={{
          height: "60px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: isMobile ? "0 1rem" : "0 2rem",
          maxWidth: "1280px",
          margin: "0 auto",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: isMobile ? "1rem" : "2rem" }}>
          <a
            href="/"
            style={{
              fontSize: "1.125rem",
              fontWeight: 800,
              letterSpacing: "-0.05em",
              color: config.colors.primary,
              textDecoration: "none",
              flexShrink: 0,
              transition: "transform 0.2s ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.05)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
          >
            {config.name.toUpperCase().replace(/\s+/g, "")}
          </a>

          {!isMobile && nav.length > 0 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.25rem",
              }}
            >
              {nav.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onMouseEnter={() => setHoveredLink(item.href)}
                  onMouseLeave={() => setHoveredLink(null)}
                  style={{
                    padding: "0.375rem 0.75rem",
                    fontSize: "13px",
                    fontWeight: item.active ? 600 : 400,
                    color: item.active ? "#1A1A1A" : hoveredLink === item.href ? "#1A1A1A" : "#717171",
                    textDecoration: "none",
                    borderRadius: "0.375rem",
                    transition: "all 0.2s ease",
                    whiteSpace: "nowrap",
                    backgroundColor: hoveredLink === item.href && !item.active ? "rgba(0,0,0,0.03)" : "transparent",
                    position: "relative",
                  }}
                >
                  {item.label}
                  {item.active && (
                    <span
                      style={{
                        position: "absolute",
                        bottom: "-1px",
                        left: "50%",
                        transform: "translateX(-50%)",
                        width: "16px",
                        height: "2px",
                        backgroundColor: config.colors.primary,
                        borderRadius: "1px",
                      }}
                    />
                  )}
                </a>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {!isMobile && actions}
          {isMobile && (
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              style={{ background: "none", border: "none", cursor: "pointer", padding: "0.25rem", color: "#2D2D2D" }}
            >
              {mobileOpen ? (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
              )}
            </button>
          )}
        </div>
      </nav>

      {isMobile && mobileOpen && (
        <div
          style={{
            borderTop: "1px solid #EAEAEA",
            backgroundColor: "#ffffff",
            padding: "0.5rem 1rem 1rem",
          }}
        >
          {nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              style={{
                display: "block",
                padding: "0.625rem 0.75rem",
                fontSize: "14px",
                fontWeight: item.active ? 600 : 400,
                color: item.active ? config.colors.primary : "#717171",
                textDecoration: "none",
                borderRadius: "0.5rem",
                transition: "all 0.2s ease",
                backgroundColor: item.active ? `${config.colors.primary}0A` : "transparent",
              }}
            >
              {item.label}
            </a>
          ))}
          <div style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid #F0F0F0" }}>
            {actions}
          </div>
        </div>
      )}
    </header>
  );
}
