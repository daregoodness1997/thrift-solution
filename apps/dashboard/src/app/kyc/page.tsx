"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { config, BrandConfig } from "@thrift/config";
import { useAuth } from "@/lib/auth-context";
import { Card, ColorfulBadge, ColorBar, FadeInUp } from "@thrift/ui";
import { PageHeader } from "@/components/PageHeader";
import { KYC_STATUS_CONFIG } from "@thrift/types";

const fallback = config;

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.75rem 0.875rem 0.75rem 2.5rem",
  borderRadius: "0.625rem",
  border: "1px solid #E5E7EB",
  fontSize: "14px",
  outline: "none",
  transition: "all 0.2s ease",
  boxSizing: "border-box",
  color: "#1A1A1A",
  fontFamily: "'JetBrains Mono', monospace",
  letterSpacing: "0.05em",
};

const icons = {
  bvn: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></svg>,
  nin: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M9 12l2 2 4-4" /><path d="M21 12c-1 0-3-1-3-3s1-3 3-3-3-1-3-3" /><circle cx="12" cy="12" r="10" /></svg>,
};

interface KycData {
  status: string;
  hasBvn?: boolean;
  hasNin?: boolean;
}

interface VirtualAccount {
  accountNumber: string;
  bankName: string;
  bankCode?: string;
  status: string;
}

interface VerifyResult {
  kycId: string;
  status: string;
  creditScore?: number;
  rating?: string;
  virtualAccount?: { accountNumber: string; bankName: string; bankCode?: string };
}

export default function KycPage() {
  const { user, token } = useAuth();
  const [cfg, setCfg] = useState<BrandConfig>(fallback);
  const [kyc, setKyc] = useState<KycData | null>(null);
  const [account, setAccount] = useState<VirtualAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [bvn, setBvn] = useState("");
  const [nin, setNin] = useState("");
  const [result, setResult] = useState<VerifyResult | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

  useEffect(() => {
    fetch(`${API_URL}/api/config`)
      .then((r) => r.json())
      .then((data) => { if (data && data.name) setCfg((prev) => ({ ...prev, ...data })); })
      .catch(() => {});
  }, [API_URL]);

  const loadStatus = useCallback(async () => {
    try {
      const [statusRes, vaRes] = await Promise.all([
        fetch(`${API_URL}/api/registration/status`, { headers: authHeaders }).then((r) => r.json()).catch(() => null),
        fetch(`${API_URL}/api/virtual-accounts`, { headers: authHeaders }).then((r) => r.json()).catch(() => null),
      ]);
      const status = statusRes?.data?.kycStatus ?? "none";
      setKyc({ status, hasBvn: !!statusRes?.data?.hasBvn, hasNin: !!statusRes?.data?.hasNin });
      const accounts: VirtualAccount[] | undefined = vaRes?.data;
      if (Array.isArray(accounts) && accounts.length > 0) {
        setAccount(accounts[0]);
      }
    } catch {
      setKyc({ status: "none" });
    } finally {
      setLoading(false);
    }
  }, [API_URL, authHeaders]);

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    loadStatus();
  }, [token, loadStatus]);

  const handleVerify = async () => {
    setError("");
    if (!/^\d{11}$/.test(bvn)) return setError("BVN must be exactly 11 digits");
    if (!/^\d{11}$/.test(nin)) return setError("NIN must be exactly 11 digits");

    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/registration/kyc`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ bvn, nin }),
      });
      const data = await res.json();
      if (!data.success) {
        toast.error(data.error || "Verification failed");
        setError(data.error || "Verification failed");
        setSubmitting(false);
        return;
      }
      toast.success("Identity verified — your virtual account is ready!");
      setResult(data.data);
      setKyc({ status: "verified", hasBvn: true, hasNin: true });
      if (data.data.virtualAccount) setAccount(data.data.virtualAccount);
    } catch {
      toast.error("Network error. Please try again.");
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "clamp(1rem, 3vw, 2rem)" }}>
        <ColorBar />
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
          <span style={{ fontSize: "12px", color: "#999" }}>Loading verification status...</span>
        </div>
      </div>
    );
  }

  const status = kyc?.status ?? "none";
  const isVerified = status === "verified" || !!result;
  const isPending = status === "pending" || status === "under_review";

  const ratingColor = (r?: string) => {
    if (r === "EXCELLENT") return "#059669";
    if (r === "GOOD") return "#2563EB";
    if (r === "FAIR") return "#D97706";
    return "#DC2626";
  };

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "clamp(1rem, 3vw, 2rem)" }}>
      <PageHeader
        badgeLabel="Identity Verification"
        heading="KYC"
        accentText="Verification"
        description="Verify your identity instantly with your BVN and NIN. No documents required — we confirm everything automatically via CreditChek."
      />

      {/* Status Banner */}
      {status !== "none" && (
        <FadeInUp delay={150}>
          <Card padding="1.5rem" style={{ marginBottom: "2rem" }}>
            {(() => {
              const sc = KYC_STATUS_CONFIG[status as keyof typeof KYC_STATUS_CONFIG] || KYC_STATUS_CONFIG.pending;
              return (
                <div style={{ padding: "1rem", borderRadius: "0.75rem", backgroundColor: sc.bg, border: `1px solid ${sc.border}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={sc.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <path d={sc.icon} />
                    </svg>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: "13px", fontWeight: 600, color: sc.color }}>
                        {isVerified ? "Identity Verified" : sc.label}
                      </span>
                      <span style={{ fontSize: "11px", color: "#717171", display: "block", marginTop: "0.125rem" }}>
                        {isVerified
                          ? "Your BVN and NIN are verified. Your virtual account is active."
                          : "Your submission is being reviewed. This usually takes 1–2 business days."}
                      </span>
                      {kyc?.hasBvn && kyc?.hasNin && (
                        <span style={{ fontSize: "11px", color: "#717171", display: "block", marginTop: "0.25rem" }}>
                          Verified with BVN + NIN
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}
          </Card>
        </FadeInUp>
      )}

      {/* Verification Card */}
      <FadeInUp delay={250}>
        <Card padding="1.5rem" style={{ marginBottom: "2rem" }}>
          {isVerified ? (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "0.75rem", backgroundColor: "#ECFDF5", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                </div>
                <div>
                  <h2 style={{ fontSize: "1.1rem", fontWeight: 600, color: "#1A1A1A" }}>You&apos;re all set!</h2>
                  <p style={{ fontSize: "12px", color: "#717171", margin: 0 }}>Your identity is verified and your virtual account is ready to receive payments.</p>
                </div>
              </div>

              {account && (
                <div style={{ padding: "1.25rem", borderRadius: "0.75rem", backgroundColor: "#F9FAFB", border: "1px solid #EEF1EE", marginBottom: "1.25rem" }}>
                  <span style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em", color: "#9CA3AF", fontWeight: 700 }}>Virtual Account</span>
                  <div style={{ fontSize: "1.4rem", fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: cfg.colors.primary, marginTop: "0.25rem" }}>
                    {account.accountNumber}
                  </div>
                  <div style={{ fontSize: "13px", color: "#374151", marginTop: "0.25rem" }}>{account.bankName}</div>
                </div>
              )}

              {(result?.creditScore != null || (result?.rating)) && (
                <div style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1rem", borderRadius: "0.75rem", backgroundColor: "#F9FAFB", border: "1px solid #EEF1EE", marginBottom: "1.25rem" }}>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em", color: "#9CA3AF", fontWeight: 700 }}>Credit Score</span>
                    <div style={{ fontSize: "1.4rem", fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: "#1A1A1A" }}>
                      {result?.creditScore ?? "—"}
                    </div>
                  </div>
                  {result?.rating && (
                    <span style={{ fontSize: "11px", fontWeight: 700, color: ratingColor(result.rating), backgroundColor: `${ratingColor(result.rating)}15`, padding: "0.375rem 0.75rem", borderRadius: "9999px" }}>
                      {result.rating}
                    </span>
                  )}
                </div>
              )}

              <a href="/" style={{ display: "block", width: "100%", padding: "0.75rem", borderRadius: "0.625rem", fontSize: "13px", fontWeight: 600, textAlign: "center", textDecoration: "none", backgroundColor: cfg.colors.primary, color: "#ffffff" }}>
                Go to Dashboard
              </a>
            </div>
          ) : (
            <div>
              <div style={{ marginBottom: "1.5rem" }}>
                <h2 style={{ fontSize: "1.1rem", fontWeight: 600, color: "#1A1A1A", marginBottom: "0.25rem" }}>Verify your identity</h2>
                <p style={{ fontSize: "12px", color: "#717171", margin: 0 }}>
                  Enter your BVN and NIN below. We&apos;ll confirm them instantly with CreditChek and create your virtual account.
                </p>
              </div>

              {error && (
                <div style={{ padding: "0.75rem 1rem", borderRadius: "0.75rem", backgroundColor: "#FEF2F2", border: "1px solid #FECACA", color: "#DC2626", fontSize: "12px", fontWeight: 500, marginBottom: "1.5rem" }}>
                  {error}
                </div>
              )}

              {isPending && (
                <div style={{ padding: "1rem", borderRadius: "0.75rem", backgroundColor: "#FFFBEB", border: "1px solid #FDE68A", marginBottom: "1.5rem", fontSize: "12px", color: "#92400E" }}>
                  Your previous submission is still under review. You can re-verify with your BVN and NIN to complete it instantly.
                </div>
              )}

              <div style={{ marginBottom: "1rem" }}>
                <label style={{ fontSize: "12px", fontWeight: 500, color: "#374151", display: "block", marginBottom: "0.375rem" }}>BVN (11 digits)</label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: "0.875rem", top: "50%", transform: "translateY(-50%)" }}>{icons.bvn}</span>
                  <input type="text" inputMode="numeric" value={bvn} onChange={(e) => setBvn(e.target.value.replace(/\D/g, "").slice(0, 11))} placeholder="12345678901"
                    style={inputStyle}
                    onFocus={(e) => { e.currentTarget.style.borderColor = cfg.colors.primary; e.currentTarget.style.boxShadow = `0 0 0 3px ${cfg.colors.primary}15`; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = "#E5E7EB"; e.currentTarget.style.boxShadow = "none"; }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: "1.5rem" }}>
                <label style={{ fontSize: "12px", fontWeight: 500, color: "#374151", display: "block", marginBottom: "0.375rem" }}>NIN (11 digits)</label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: "0.875rem", top: "50%", transform: "translateY(-50%)" }}>{icons.nin}</span>
                  <input type="text" inputMode="numeric" value={nin} onChange={(e) => setNin(e.target.value.replace(/\D/g, "").slice(0, 11))} placeholder="98765432109"
                    style={inputStyle}
                    onFocus={(e) => { e.currentTarget.style.borderColor = cfg.colors.primary; e.currentTarget.style.boxShadow = `0 0 0 3px ${cfg.colors.primary}15`; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = "#E5E7EB"; e.currentTarget.style.boxShadow = "none"; }}
                  />
                </div>
              </div>

              <button onClick={handleVerify} disabled={submitting}
                style={{ width: "100%", padding: "0.875rem", borderRadius: "0.625rem", fontSize: "13px", fontWeight: 600, cursor: submitting ? "not-allowed" : "pointer", backgroundColor: cfg.colors.primary, color: "#ffffff", border: "none", opacity: submitting ? 0.7 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                {submitting ? (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" style={{ animation: "spin 1s linear infinite" }}><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" strokeDasharray="31.4 31.4" /></svg>
                    Verifying with CreditChek...
                  </>
                ) : (
                  "Verify & Create Virtual Account"
                )}
              </button>

              <p style={{ fontSize: "11px", color: "#9CA3AF", textAlign: "center", marginTop: "0.75rem", marginBottom: 0 }}>
                Secured by CreditChek • BVN & NIN are verified, not stored as plain secrets.
              </p>
            </div>
          )}
        </Card>
      </FadeInUp>

      {/* Info Card */}
      <FadeInUp delay={350}>
        <Card padding="1.5rem">
          <ColorfulBadge label="Why KYC?" color={cfg.colors.accent} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginTop: "1rem" }}>
            {[
              { title: "Instant Verification", desc: "Your BVN and NIN are confirmed in seconds via CreditChek — no document uploads." },
              { title: "Virtual Account", desc: "A dedicated account is created automatically so you can receive contributions." },
              { title: "Credit Insight", desc: "We pull a credit report to personalise your limits and trust score." },
              { title: "Build Trust", desc: "A verified identity increases your trust score across savings circles." },
            ].map((item) => (
              <div key={item.title} style={{ padding: "1rem", borderRadius: "0.75rem", backgroundColor: "#FAFAFA" }}>
                <h3 style={{ fontSize: "13px", fontWeight: 600, color: "#2D2D2D", marginBottom: "0.25rem" }}>{item.title}</h3>
                <p style={{ fontSize: "11px", color: "#717171", lineHeight: 1.5 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </Card>
      </FadeInUp>

      <style jsx global>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
