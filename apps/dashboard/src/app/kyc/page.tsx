"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { config, BrandConfig } from "@thrift/config";
import { useAuth } from "@/lib/auth-context";
import { Card, ColorfulBadge, ColorBar, FadeInUp } from "@thrift/ui";
import { PageHeader } from "@/components/PageHeader";
import { KYC_STATUS_CONFIG } from "@thrift/types";

const fallback = config;

const inputClass = "box-border w-full rounded-[0.625rem] border border-gray-200 py-3 pl-10 pr-3.5 font-mono text-sm tracking-[0.05em] text-brand-dark outline-none transition-all";

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
      <div className="mx-auto max-w-[900px] p-[clamp(1rem,3vw,2rem)]">
        <ColorBar />
        <div className="flex min-h-[400px] items-center justify-center">
          <span className="text-xs text-gray-400">Loading verification status...</span>
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
    <div className="mx-auto max-w-[900px] p-[clamp(1rem,3vw,2rem)]">
      <PageHeader
        badgeLabel="Identity Verification"
        heading="KYC"
        accentText="Verification"
        description="Verify your identity instantly with your BVN and NIN. No documents required — we confirm everything automatically via CreditChek."
      />

      {/* Status Banner */}
      {status !== "none" && (
        <FadeInUp delay={150}>
          <Card padding="1.5rem" className="mb-8">
            {(() => {
              const sc = KYC_STATUS_CONFIG[status as keyof typeof KYC_STATUS_CONFIG] || KYC_STATUS_CONFIG.pending;
              return (
                <div className="rounded-xl p-4" style={{ backgroundColor: sc.bg, border: `1px solid ${sc.border}` }}>
                  <div className="flex items-center gap-4">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={sc.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <path d={sc.icon} />
                    </svg>
                    <div className="flex-1">
                      <span className="text-[13px] font-semibold" style={{ color: sc.color }}>
                        {isVerified ? "Identity Verified" : sc.label}
                      </span>
                      <span className="mt-0.5 block text-[11px] text-gray-500">
                        {isVerified
                          ? "Your BVN and NIN are verified. Your virtual account is active."
                          : "Your submission is being reviewed. This usually takes 1–2 business days."}
                      </span>
                      {kyc?.hasBvn && kyc?.hasNin && (
                        <span className="mt-1 block text-[11px] text-gray-500">
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
        <Card padding="1.5rem" className="mb-8">
          {isVerified ? (
            <div>
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                </div>
                <div>
                  <h2 className="font-display text-[1.1rem] font-semibold tracking-tight text-brand-dark">You&apos;re all set!</h2>
                  <p className="m-0 text-xs text-gray-500">Your identity is verified and your virtual account is ready to receive payments.</p>
                </div>
              </div>

              {account && (
                <div className="mb-5 rounded-xl border border-[#EEF1EE] bg-gray-50 p-5">
                  <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-gray-400">Virtual Account</span>
                  <div className="mt-1 font-mono text-[1.4rem] font-bold" style={{ color: cfg.colors.primary }}>
                    {account.accountNumber}
                  </div>
                  <div className="mt-1 text-[13px] text-gray-700">{account.bankName}</div>
                </div>
              )}

              {(result?.creditScore != null || (result?.rating)) && (
                <div className="mb-5 flex items-center gap-4 rounded-xl border border-[#EEF1EE] bg-gray-50 p-4">
                  <div className="flex-1">
                    <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-gray-400">Credit Score</span>
                    <div className="font-mono text-[1.4rem] font-bold text-brand-dark">
                      {result?.creditScore ?? "—"}
                    </div>
                  </div>
                  {result?.rating && (
                    <span className="rounded-full px-3 py-1.5 text-[11px] font-bold" style={{ color: ratingColor(result.rating), backgroundColor: `${ratingColor(result.rating)}15` }}>
                      {result.rating}
                    </span>
                  )}
                </div>
              )}

              <a href="/" className="block w-full rounded-[0.625rem] py-3 text-center text-[13px] font-semibold text-white no-underline" style={{ backgroundColor: cfg.colors.primary }}>
                Go to Dashboard
              </a>
            </div>
          ) : (
            <div>
              <div className="mb-6">
                <h2 className="mb-1 font-display text-[1.1rem] font-semibold tracking-tight text-brand-dark">Verify your identity</h2>
                <p className="m-0 text-xs text-gray-500">
                  Enter your BVN and NIN below. We&apos;ll confirm them instantly with CreditChek and create your virtual account.
                </p>
              </div>

              {error && (
                <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-600">
                  {error}
                </div>
              )}

              {isPending && (
                <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
                  Your previous submission is still under review. You can re-verify with your BVN and NIN to complete it instantly.
                </div>
              )}

              <div className="mb-4">
                <label className="mb-1.5 block text-xs font-medium text-gray-700">BVN (11 digits)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2">{icons.bvn}</span>
                  <input type="text" inputMode="numeric" value={bvn} onChange={(e) => setBvn(e.target.value.replace(/\D/g, "").slice(0, 11))} placeholder="12345678901"
                    className={inputClass}
                    onFocus={(e) => { e.currentTarget.style.borderColor = cfg.colors.primary; e.currentTarget.style.boxShadow = `0 0 0 3px ${cfg.colors.primary}15`; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = "#E5E7EB"; e.currentTarget.style.boxShadow = "none"; }}
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="mb-1.5 block text-xs font-medium text-gray-700">NIN (11 digits)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2">{icons.nin}</span>
                  <input type="text" inputMode="numeric" value={nin} onChange={(e) => setNin(e.target.value.replace(/\D/g, "").slice(0, 11))} placeholder="98765432109"
                    className={inputClass}
                    onFocus={(e) => { e.currentTarget.style.borderColor = cfg.colors.primary; e.currentTarget.style.boxShadow = `0 0 0 3px ${cfg.colors.primary}15`; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = "#E5E7EB"; e.currentTarget.style.boxShadow = "none"; }}
                  />
                </div>
              </div>

              <button onClick={handleVerify} disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-[0.625rem] border-none py-3.5 text-[13px] font-semibold text-white"
                style={{ cursor: submitting ? "not-allowed" : "pointer", backgroundColor: cfg.colors.primary, opacity: submitting ? 0.7 : 1 }}>
                {submitting ? (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" style={{ animation: "spin 1s linear infinite" }}><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" strokeDasharray="31.4 31.4" /></svg>
                    Verifying with CreditChek...
                  </>
                ) : (
                  "Verify & Create Virtual Account"
                )}
              </button>

              <p className="mt-3 mb-0 text-center text-[11px] text-gray-400">
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
          <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
            {[
              { title: "Instant Verification", desc: "Your BVN and NIN are confirmed in seconds via CreditChek — no document uploads." },
              { title: "Virtual Account", desc: "A dedicated account is created automatically so you can receive contributions." },
              { title: "Credit Insight", desc: "We pull a credit report to personalise your limits and trust score." },
              { title: "Build Trust", desc: "A verified identity increases your trust score across savings circles." },
            ].map((item) => (
              <div key={item.title} className="rounded-xl bg-gray-50 p-4">
                <h3 className="mb-1 text-[13px] font-semibold text-brand-dark">{item.title}</h3>
                <p className="text-[11px] leading-normal text-gray-500">{item.desc}</p>
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
