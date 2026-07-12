"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { config } from "@thrift/config";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Email and password are required");
      return;
    }
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      window.location.href = "/";
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", backgroundColor: "#FDFDFC" }}>
      {/* Left Panel — Brand */}
      <div style={{
        flex: "0 0 45%",
        background: `linear-gradient(160deg, ${config.colors.secondary} 0%, ${config.colors.primary} 50%, #1a4a30 100%)`,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "3rem",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Decorative circles */}
        <div style={{ position: "absolute", top: "-10%", right: "-10%", width: "300px", height: "300px", borderRadius: "50%", border: `1px solid rgba(255,255,255,0.06)` }} />
        <div style={{ position: "absolute", bottom: "-15%", left: "-10%", width: "400px", height: "400px", borderRadius: "50%", border: `1px solid rgba(255,255,255,0.04)` }} />
        <div style={{ position: "absolute", top: "20%", left: "10%", width: "150px", height: "150px", borderRadius: "50%", backgroundColor: `rgba(255,255,255,0.03)` }} />

        <div style={{ position: "relative", zIndex: 1, textAlign: "center", maxWidth: "320px" }}>
          <a href="/" style={{ textDecoration: "none", display: "block", marginBottom: "3rem" }}>
            <span style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.05em", color: "#ffffff" }}>
              {config.name.toUpperCase().replace(/\s+/g, "")}
            </span>
          </a>

          <h1 style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 300, color: "#ffffff", lineHeight: 1.3, marginBottom: "1rem" }}>
            Welcome back to<br />
            <span style={{ fontStyle: "italic", fontFamily: "'Playfair Display', serif", fontWeight: 500, color: config.colors.accent }}>
              {config.tagline.split(",")[0]}
            </span>
          </h1>

          <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)", lineHeight: 1.6 }}>
            Continue managing your savings circles, tracking contributions, and growing together.
          </p>

          {/* Stats */}
          <div style={{ display: "flex", gap: "2rem", justifyContent: "center", marginTop: "3rem" }}>
            {[
              { value: "50K+", label: "Members" },
              { value: "₦2B+", label: "Saved" },
              { value: "10K+", label: "Circles" },
            ].map((stat) => (
              <div key={stat.label} style={{ textAlign: "center" }}>
                <span style={{ fontSize: "1.25rem", fontWeight: 700, color: config.colors.accent, display: "block" }}>{stat.value}</span>
                <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.1em" }}>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel — Form */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
        <div style={{ width: "100%", maxWidth: "400px" }}>
          <div style={{ marginBottom: "2.5rem" }}>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 600, color: "#1A1A1A", letterSpacing: "-0.025em" }}>Sign In</h2>
            <p style={{ fontSize: "13px", color: "#717171", marginTop: "0.375rem" }}>Enter your credentials to access your account</p>
          </div>

          <form onSubmit={handleSubmit}>
            {error && (
              <div style={{ padding: "0.75rem 1rem", borderRadius: "0.75rem", backgroundColor: "#FEF2F2", border: "1px solid #FECACA", color: "#DC2626", fontSize: "12px", fontWeight: 500, marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {error}
              </div>
            )}

            <div style={{ marginBottom: "1.25rem" }}>
              <label style={{ fontSize: "12px", fontWeight: 500, color: "#374151", display: "block", marginBottom: "0.375rem" }}>
                Email Address
              </label>
              <div style={{ position: "relative" }}>
                <svg style={{ position: "absolute", left: "0.875rem", top: "50%", transform: "translateY(-50%)", color: "#9CA3AF" }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
                </svg>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  style={{ width: "100%", padding: "0.6875rem 0.875rem 0.6875rem 2.5rem", borderRadius: "0.625rem", border: "1px solid #E5E7EB", fontSize: "13px", outline: "none", transition: "all 0.2s ease", boxSizing: "border-box", color: "#1A1A1A" }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = config.colors.primary; e.currentTarget.style.boxShadow = `0 0 0 3px ${config.colors.primary}15`; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "#E5E7EB"; e.currentTarget.style.boxShadow = "none"; }}
                />
              </div>
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ fontSize: "12px", fontWeight: 500, color: "#374151", display: "block", marginBottom: "0.375rem" }}>
                Password
              </label>
              <div style={{ position: "relative" }}>
                <svg style={{ position: "absolute", left: "0.875rem", top: "50%", transform: "translateY(-50%)", color: "#9CA3AF" }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  style={{ width: "100%", padding: "0.6875rem 2.5rem 0.6875rem 2.5rem", borderRadius: "0.625rem", border: "1px solid #E5E7EB", fontSize: "13px", outline: "none", transition: "all 0.2s ease", boxSizing: "border-box", color: "#1A1A1A" }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = config.colors.primary; e.currentTarget.style.boxShadow = `0 0 0 3px ${config.colors.primary}15`; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "#E5E7EB"; e.currentTarget.style.boxShadow = "none"; }}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: "0.25rem", color: "#9CA3AF", display: "flex", alignItems: "center" }}>
                  {showPassword ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "0.75rem",
                borderRadius: "0.625rem",
                fontSize: "13px",
                fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
                backgroundColor: config.colors.primary,
                color: "#ffffff",
                border: "none",
                transition: "all 0.2s ease",
                opacity: loading ? 0.6 : 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
              }}
            >
              {loading ? (
                <>
                  <svg style={{ animation: "spin 1s linear infinite" }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M21 12a9 9 0 11-6.219-8.56" /></svg>
                  Signing in...
                </>
              ) : "Sign In"}
            </button>
          </form>

          <div style={{ textAlign: "center", marginTop: "2rem" }}>
            <span style={{ fontSize: "13px", color: "#717171" }}>
              Don&apos;t have an account?{" "}
              <a href="/register" style={{ color: config.colors.primary, fontWeight: 600, textDecoration: "none" }}>
                Create one
              </a>
            </span>
          </div>

          <div style={{ textAlign: "center", marginTop: "2rem", paddingTop: "1.5rem", borderTop: "1px solid #F3F4F6" }}>
            <p style={{ fontSize: "11px", color: "#9CA3AF", lineHeight: 1.5 }}>
              By signing in, you agree to our{" "}
              <a href="#" style={{ color: config.colors.primary, textDecoration: "none" }}>Terms</a>
              {" "}and{" "}
              <a href="#" style={{ color: config.colors.primary, textDecoration: "none" }}>Privacy Policy</a>
            </p>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @media (max-width: 768px) {
          div[style*="flex: 0 0 45%"] { display: none !important; }
        }
      `}</style>
    </div>
  );
}
