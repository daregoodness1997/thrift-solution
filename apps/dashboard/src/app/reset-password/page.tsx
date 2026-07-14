"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { config } from "@thrift/config";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

function ResetPasswordForm() {
  const params = useSearchParams();
  const [email] = useState(params.get("email") || "");
  const [code, setCode] = useState(params.get("code") || "");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    symbol: /[^A-Za-z0-9]/.test(password),
  };
  const isStrong = Object.values(checks).every(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!isStrong) {
      setError("Please meet all password requirements below");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, newPassword: password }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Reset failed");
      } else {
        setDone(true);
        toast.success("Password reset successful");
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
            Choose a new<br />
            <span style={{ fontStyle: "italic", fontFamily: "'Playfair Display', serif", fontWeight: 500, color: config.colors.accent }}>
              password
            </span>
          </h1>
          <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)", lineHeight: 1.6 }}>
            Pick something strong — you&apos;ll use it to sign in next time.
          </p>
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
        <div style={{ width: "100%", maxWidth: "400px" }}>
          <div style={{ marginBottom: "2.5rem" }}>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 600, color: "#1A1A1A", letterSpacing: "-0.025em" }}>Set New Password</h2>
            <p style={{ fontSize: "13px", color: "#717171", marginTop: "0.375rem" }}>
              {email ? `Resetting password for ${email}` : "Enter the code from your email if the link didn't work"}
            </p>
          </div>

          {done ? (
            <div style={{ padding: "1.25rem 1.25rem", borderRadius: "0.75rem", backgroundColor: "#ECFDF5", border: "1px solid #A7F3D0", color: "#047857", fontSize: "13px", lineHeight: 1.6 }}>
              <strong>All set!</strong> Your password has been updated.
              <div style={{ marginTop: "1rem" }}>
                <a href="/login" style={{ color: config.colors.primary, fontWeight: 600, textDecoration: "none" }}>Continue to sign in</a>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && (
                <div style={{ padding: "0.75rem 1rem", borderRadius: "0.75rem", backgroundColor: "#FEF2F2", border: "1px solid #FECACA", color: "#DC2626", fontSize: "12px", fontWeight: 500, marginBottom: "1.5rem" }}>
                  {error}
                </div>
              )}

              {!code && (
                <div style={{ marginBottom: "1.25rem" }}>
                  <label style={{ fontSize: "12px", fontWeight: 500, color: "#374151", display: "block", marginBottom: "0.375rem" }}>Reset Code</label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="6-digit code from email"
                    style={{ width: "100%", padding: "0.6875rem 0.875rem", borderRadius: "0.625rem", border: "1px solid #E5E7EB", fontSize: "13px", outline: "none", boxSizing: "border-box", color: "#1A1A1A" }}
                  />
                </div>
              )}

              <div style={{ marginBottom: "1.25rem" }}>
                <label style={{ fontSize: "12px", fontWeight: 500, color: "#374151", display: "block", marginBottom: "0.375rem" }}>New Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  autoComplete="new-password"
                  style={{ width: "100%", padding: "0.6875rem 0.875rem", borderRadius: "0.625rem", border: "1px solid #E5E7EB", fontSize: "13px", outline: "none", boxSizing: "border-box", color: "#1A1A1A" }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = config.colors.primary; e.currentTarget.style.boxShadow = `0 0 0 3px ${config.colors.primary}15`; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "#E5E7EB"; e.currentTarget.style.boxShadow = "none"; }}
                />
              </div>

              <div style={{ margin: "-0.5rem 0 1.5rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.375rem 1rem" }}>
                {[
                  { ok: checks.length, label: "At least 8 characters" },
                  { ok: checks.uppercase, label: "One uppercase letter" },
                  { ok: checks.lowercase, label: "One lowercase letter" },
                  { ok: checks.number, label: "One number" },
                  { ok: checks.symbol, label: "One special character" },
                ].map((c) => (
                  <div key={c.label} style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "12px", color: c.ok ? "#047857" : "#9CA3AF" }}>
                    <span style={{
                      width: "16px", height: "16px", borderRadius: "50%", flex: "0 0 16px",
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                      fontSize: "10px", fontWeight: 700, color: "#fff",
                      backgroundColor: c.ok ? "#10B981" : "#E5E7EB",
                    }}>{c.ok ? "✓" : ""}</span>
                    {c.label}
                  </div>
                ))}
              </div>

              <div style={{ marginBottom: "1.5rem" }}>
                <label style={{ fontSize: "12px", fontWeight: 500, color: "#374151", display: "block", marginBottom: "0.375rem" }}>Confirm Password</label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Re-enter password"
                  autoComplete="new-password"
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
                {loading ? "Resetting..." : "Reset password"}
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#999", fontSize: "13px" }}>Loading…</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
