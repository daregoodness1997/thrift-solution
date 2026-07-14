"use client";

import { useState } from "react";
import { toast } from "sonner";
import { config } from "@thrift/config";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email) {
      setError("Email is required");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Request failed");
      } else {
        setSent(true);
        toast.success("Reset link sent to your email");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", backgroundColor: "#FDFDFC" }}>
      <div style={{
        flex: "0 0 45%",
        background: `linear-gradient(160deg, ${config.colors.secondary} 0%, ${config.colors.primary} 50%, #1a4a30 100%)`,
        display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center",
        padding: "3rem", position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "relative", zIndex: 1, textAlign: "center", maxWidth: "320px" }}>
          <a href="/" style={{ textDecoration: "none", display: "block", marginBottom: "3rem" }}>
            <span style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.05em", color: "#ffffff" }}>
              {config.name.toUpperCase().replace(/\s+/g, "")}
            </span>
          </a>
          <h1 style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 300, color: "#ffffff", lineHeight: 1.3, marginBottom: "1rem" }}>
            Forgot your<br />
            <span style={{ fontStyle: "italic", fontFamily: "'Playfair Display', serif", fontWeight: 500, color: config.colors.accent }}>
              password?
            </span>
          </h1>
          <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)", lineHeight: 1.6 }}>
            No worries — we&apos;ll send you a secure link and code to reset it.
          </p>
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
        <div style={{ width: "100%", maxWidth: "400px" }}>
          <div style={{ marginBottom: "2.5rem" }}>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 600, color: "#1A1A1A", letterSpacing: "-0.025em" }}>Reset Password</h2>
            <p style={{ fontSize: "13px", color: "#717171", marginTop: "0.375rem" }}>Enter your account email to receive a reset link</p>
          </div>

          {sent ? (
            <div style={{ padding: "1.25rem 1.25rem", borderRadius: "0.75rem", backgroundColor: "#ECFDF5", border: "1px solid #A7F3D0", color: "#047857", fontSize: "13px", lineHeight: 1.6 }}>
              <strong>Check your inbox.</strong> We&apos;ve sent a reset link and a backup code to <strong>{email}</strong>.
              The link opens a form that&apos;s already filled in for you.
              <div style={{ marginTop: "1rem" }}>
                <a href="/login" style={{ color: config.colors.primary, fontWeight: 600, textDecoration: "none" }}>Back to sign in</a>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && (
                <div style={{ padding: "0.75rem 1rem", borderRadius: "0.75rem", backgroundColor: "#FEF2F2", border: "1px solid #FECACA", color: "#DC2626", fontSize: "12px", fontWeight: 500, marginBottom: "1.5rem" }}>
                  {error}
                </div>
              )}

              <div style={{ marginBottom: "1.5rem" }}>
                <label style={{ fontSize: "12px", fontWeight: 500, color: "#374151", display: "block", marginBottom: "0.375rem" }}>Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  style={{ width: "100%", padding: "0.6875rem 0.875rem", borderRadius: "0.625rem", border: "1px solid #E5E7EB", fontSize: "13px", outline: "none", boxSizing: "border-box", color: "#1A1A1A" }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = config.colors.primary; e.currentTarget.style.boxShadow = `0 0 0 3px ${config.colors.primary}15`; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "#E5E7EB"; e.currentTarget.style.boxShadow = "none"; }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{ width: "100%", padding: "0.75rem", borderRadius: "0.625rem", fontSize: "13px", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", backgroundColor: config.colors.primary, color: "#ffffff", border: "none", opacity: loading ? 0.6 : 1 }}
              >
                {loading ? "Sending..." : "Send reset link"}
              </button>

              <div style={{ textAlign: "center", marginTop: "2rem" }}>
                <a href="/login" style={{ fontSize: "13px", color: config.colors.primary, fontWeight: 600, textDecoration: "none" }}>Back to sign in</a>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
