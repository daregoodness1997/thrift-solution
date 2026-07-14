"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { config } from "@thrift/config";

export default function RegisterForm() {
  const { register } = useAuth();
  const searchParams = useSearchParams();
  const referralFromUrl = searchParams.get("ref") || "";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (referralFromUrl) setReferralCode(referralFromUrl);
  }, [referralFromUrl]);

  const passwordStrength = (() => {
    if (!password) return { level: 0, label: "", color: "" };
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 10) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    if (score <= 2) return { level: 1, label: "Weak", color: "#DC2626" };
    if (score <= 3) return { level: 2, label: "Fair", color: "#D97706" };
    if (score <= 4) return { level: 3, label: "Good", color: "#2563EB" };
    return { level: 4, label: "Strong", color: "#059669" };
  })();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name || !email || !password) {
      setError("Name, email, and password are required");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    const result = await register({
      email,
      name,
      password,
      referralCode: referralCode.trim() || undefined,
    });
    setLoading(false);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Account created successfully!");
      window.location.href = "/kyc";
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
        <div style={{ position: "absolute", top: "-10%", right: "-10%", width: "300px", height: "300px", borderRadius: "50%", border: `1px solid rgba(255,255,255,0.06)` }} />
        <div style={{ position: "absolute", bottom: "-15%", left: "-10%", width: "400px", height: "400px", borderRadius: "50%", border: `1px solid rgba(255,255,255,0.04)` }} />
        <div style={{ position: "absolute", top: "30%", right: "15%", width: "100px", height: "100px", borderRadius: "50%", backgroundColor: `rgba(255,255,255,0.03)` }} />

        <div style={{ position: "relative", zIndex: 1, textAlign: "center", maxWidth: "320px" }}>
          <a href="/" style={{ textDecoration: "none", display: "block", marginBottom: "3rem" }}>
            <span style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.05em", color: "#ffffff" }}>
              {config.name.toUpperCase().replace(/\s+/g, "")}
            </span>
          </a>

          <h1 style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 300, color: "#ffffff", lineHeight: 1.3, marginBottom: "1rem" }}>
            Start your<br />
            <span style={{ fontStyle: "italic", fontFamily: "'Playfair Display', serif", fontWeight: 500, color: config.colors.accent }}>
              savings journey
            </span>
          </h1>

          <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)", lineHeight: 1.6 }}>
            Join thousands of Nigerians building wealth together through trusted community savings circles.
          </p>

          {/* Features */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "2.5rem", textAlign: "left" }}>
            {[
              { icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z", text: "Zero-fee wallet funding" },
              { icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z", text: "Join or create savings circles" },
              { icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z", text: "Bank-grade security & KYC" },
              { icon: "M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7", text: "Earn referral rewards" },
            ].map((item) => (
              <div key={item.text} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div style={{ width: "28px", height: "28px", borderRadius: "0.5rem", backgroundColor: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d={item.icon} /></svg>
                </div>
                <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)" }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel — Form */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem", overflowY: "auto" }}>
        <div style={{ width: "100%", maxWidth: "400px" }}>
          <div style={{ marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 600, color: "#1A1A1A", letterSpacing: "-0.025em" }}>Create Account</h2>
            <p style={{ fontSize: "13px", color: "#717171", marginTop: "0.375rem" }}>Fill in your details to get started</p>
          </div>

          <form onSubmit={handleSubmit}>
            {error && (
              <div style={{ padding: "0.75rem 1rem", borderRadius: "0.75rem", backgroundColor: "#FEF2F2", border: "1px solid #FECACA", color: "#DC2626", fontSize: "12px", fontWeight: 500, marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {error}
              </div>
            )}

            <div style={{ marginBottom: "1rem" }}>
              <label style={{ fontSize: "12px", fontWeight: 500, color: "#374151", display: "block", marginBottom: "0.375rem" }}>Full Name</label>
              <div style={{ position: "relative" }}>
                <svg style={{ position: "absolute", left: "0.875rem", top: "50%", transform: "translateY(-50%)", color: "#9CA3AF" }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
                </svg>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Adaeze Nwankwo" autoComplete="name"
                  style={{ width: "100%", padding: "0.6875rem 0.875rem 0.6875rem 2.5rem", borderRadius: "0.625rem", border: "1px solid #E5E7EB", fontSize: "13px", outline: "none", transition: "all 0.2s ease", boxSizing: "border-box", color: "#1A1A1A" }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = config.colors.primary; e.currentTarget.style.boxShadow = `0 0 0 3px ${config.colors.primary}15`; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "#E5E7EB"; e.currentTarget.style.boxShadow = "none"; }}
                />
              </div>
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <label style={{ fontSize: "12px", fontWeight: 500, color: "#374151", display: "block", marginBottom: "0.375rem" }}>Email Address</label>
              <div style={{ position: "relative" }}>
                <svg style={{ position: "absolute", left: "0.875rem", top: "50%", transform: "translateY(-50%)", color: "#9CA3AF" }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
                </svg>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="adaeze@email.com" autoComplete="email"
                  style={{ width: "100%", padding: "0.6875rem 0.875rem 0.6875rem 2.5rem", borderRadius: "0.625rem", border: "1px solid #E5E7EB", fontSize: "13px", outline: "none", transition: "all 0.2s ease", boxSizing: "border-box", color: "#1A1A1A" }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = config.colors.primary; e.currentTarget.style.boxShadow = `0 0 0 3px ${config.colors.primary}15`; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "#E5E7EB"; e.currentTarget.style.boxShadow = "none"; }}
                />
              </div>
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <label style={{ fontSize: "12px", fontWeight: 500, color: "#374151", display: "block", marginBottom: "0.375rem" }}>Password</label>
              <div style={{ position: "relative" }}>
                <svg style={{ position: "absolute", left: "0.875rem", top: "50%", transform: "translateY(-50%)", color: "#9CA3AF" }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
                <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min. 6 characters" autoComplete="new-password"
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
              {/* Password strength */}
              {password && (
                <div style={{ marginTop: "0.5rem" }}>
                  <div style={{ display: "flex", gap: "0.25rem", marginBottom: "0.25rem" }}>
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} style={{ flex: 1, height: "3px", borderRadius: "9999px", backgroundColor: i <= passwordStrength.level ? passwordStrength.color : "#E5E7EB", transition: "background-color 0.2s ease" }} />
                    ))}
                  </div>
                  <span style={{ fontSize: "10px", color: passwordStrength.color, fontWeight: 500 }}>{passwordStrength.label}</span>
                </div>
              )}
            </div>

            <div style={{ marginBottom: "1.25rem" }}>
              <label style={{ fontSize: "12px", fontWeight: 500, color: "#374151", display: "block", marginBottom: "0.375rem" }}>Confirm Password</label>
              <div style={{ position: "relative" }}>
                <svg style={{ position: "absolute", left: "0.875rem", top: "50%", transform: "translateY(-50%)", color: "#9CA3AF" }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter password" autoComplete="new-password"
                  style={{
                    width: "100%", padding: "0.6875rem 0.875rem 0.6875rem 2.5rem", borderRadius: "0.625rem",
                    border: `1px solid ${confirmPassword && password !== confirmPassword ? "#FECACA" : "#E5E7EB"}`,
                    fontSize: "13px", outline: "none", transition: "all 0.2s ease", boxSizing: "border-box", color: "#1A1A1A",
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = config.colors.primary; e.currentTarget.style.boxShadow = `0 0 0 3px ${config.colors.primary}15`; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = confirmPassword && password !== confirmPassword ? "#FECACA" : "#E5E7EB"; e.currentTarget.style.boxShadow = "none"; }}
                />
                {confirmPassword && password === confirmPassword && (
                  <svg style={{ position: "absolute", right: "0.875rem", top: "50%", transform: "translateY(-50%)", color: "#059669" }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M20 6L9 17l-5-5" /></svg>
                )}
              </div>
              {confirmPassword && password !== confirmPassword && (
                <span style={{ fontSize: "10px", color: "#DC2626", marginTop: "0.25rem", display: "block" }}>Passwords do not match</span>
              )}
            </div>

            {/* Referral Code */}
            <div style={{ marginBottom: "1.5rem", padding: "0.875rem", borderRadius: "0.625rem", backgroundColor: referralCode ? `${config.colors.primary}06` : "#FAFAFA", border: `1px solid ${referralCode ? `${config.colors.primary}20` : "#F3F4F6"}`, transition: "all 0.2s ease" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: referralCode ? "0.5rem" : 0 }}>
                <span style={{ fontSize: "12px", fontWeight: 500, color: "#374151", display: "flex", alignItems: "center", gap: "0.375rem" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={config.colors.primary} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                  </svg>
                  Have a referral code?
                </span>
                {!referralCode && (
                  <button type="button" onClick={() => setReferralCode(" ")}
                    style={{ fontSize: "11px", fontWeight: 600, color: config.colors.primary, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                    Enter code
                  </button>
                )}
              </div>
              {(referralCode || referralFromUrl) && (
                <div style={{ position: "relative" }}>
                  <input type="text" value={referralCode} onChange={(e) => setReferralCode(e.target.value)} placeholder="e.g. ADAEZE-8K3M"
                    style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: "0.5rem", border: "1px solid #E5E7EB", fontSize: "12px", fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, letterSpacing: "0.05em", outline: "none", boxSizing: "border-box", color: config.colors.primary, backgroundColor: "#ffffff" }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = config.colors.primary; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = "#E5E7EB"; }}
                  />
                  {referralFromUrl && (
                    <span style={{ fontSize: "10px", color: config.colors.primary, fontWeight: 500, display: "block", marginTop: "0.375rem" }}>
                      Applied from referral link
                    </span>
                  )}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%", padding: "0.75rem", borderRadius: "0.625rem", fontSize: "13px", fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer", backgroundColor: config.colors.primary, color: "#ffffff",
                border: "none", transition: "all 0.2s ease", opacity: loading ? 0.6 : 1,
                display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
              }}
            >
              {loading ? (
                <>
                  <svg style={{ animation: "spin 1s linear infinite" }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M21 12a9 9 0 11-6.219-8.56" /></svg>
                  Creating account...
                </>
              ) : "Create Account"}
            </button>
          </form>

          <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
            <span style={{ fontSize: "13px", color: "#717171" }}>
              Already have an account?{" "}
              <a href="/login" style={{ color: config.colors.primary, fontWeight: 600, textDecoration: "none" }}>
                Sign in
              </a>
            </span>
          </div>

          <div style={{ textAlign: "center", marginTop: "1.5rem", paddingTop: "1.5rem", borderTop: "1px solid #F3F4F6" }}>
            <p style={{ fontSize: "11px", color: "#9CA3AF", lineHeight: 1.5 }}>
              By creating an account, you agree to our{" "}
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
