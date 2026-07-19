"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { config } from "@thrift/config";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const REG_FEE = parseInt(process.env.NEXT_PUBLIC_REGISTRATION_FEE || "4200", 10);

const STEPS = ["Basic", "Payment", "KYC"];

function StepIndicator({ step }: { step: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {STEPS.map((label, i) => {
        const num = i + 1;
        const isActive = step === num;
        const isDone = step > num;
        return (
          <div key={label} className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-full text-[11px] font-bold flex items-center justify-center"
              style={{
                backgroundColor: isDone ? "#059669" : isActive ? config.colors.primary : "#F0F0F0",
                color: isDone || isActive ? "#fff" : "#999",
              }}
            >
              {isDone ? "✓" : num}
            </div>
            <span
              className="text-[11px]"
              style={{ fontWeight: isActive ? 600 : 400, color: isActive ? "#2D2D2D" : "#999" }}
            >
              {label}
            </span>
            {i < STEPS.length - 1 && (
              <div
                className="w-6 h-px"
                style={{ backgroundColor: isDone ? "#059669" : "#E5E7EB" }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

const inputClass =
  "w-full py-[0.6875rem] rounded-[0.625rem] border border-gray-200 text-[13px] text-brand-dark outline-none transition";

function TextField({
  label,
  icon,
  rightSlot,
  invalid,
  ...props
}: {
  label: string;
  icon?: React.ReactNode;
  rightSlot?: React.ReactNode;
  invalid?: boolean;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="mb-4">
      <label className="block text-xs font-medium text-gray-700 mb-1.5">{label}</label>
      <div className="relative">
        {icon && (
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 flex">
            {icon}
          </span>
        )}
        <input
          {...props}
          className={`${inputClass} ${icon ? "pl-10" : "pl-[0.875rem]"} ${rightSlot ? "pr-10" : "pr-[0.875rem]"}`}
          style={{ border: `1px solid ${invalid ? "#FECACA" : "#E5E7EB"}` }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = config.colors.primary;
            e.currentTarget.style.boxShadow = `0 0 0 3px ${config.colors.primary}15`;
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = invalid ? "#FECACA" : "#E5E7EB";
            e.currentTarget.style.boxShadow = "none";
            props.onBlur?.(e);
          }}
        />
        {rightSlot && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
            {rightSlot}
          </span>
        )}
      </div>
    </div>
  );
}

const icons = {
  user: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>,
  mail: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>,
  phone: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.13.96.36 1.9.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0122 16.92z" /></svg>,
  lock: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>,
  shield: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>,
  gift: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={config.colors.primary} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" /></svg>,
  check: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth={2} strokeLinecap="round"><path d="M20 6L9 17l-5-5" /></svg>,
  eyeOpen: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>,
  eyeOff: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>,
};

export default function RegisterForm() {
  const searchParams = useSearchParams();
  const [step, setStep] = useState(1);
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  const [bvn, setBvn] = useState("");
  const [nin, setNin] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [virtualAccount, setVirtualAccount] = useState<{ accountNumber: string; bankName: string; bankCode?: string } | null>(null);

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

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) setReferralCode(ref);
    const reference = searchParams.get("reference");
    if (reference) {
      const storedToken = localStorage.getItem("token");
      if (storedToken) {
        setToken(storedToken);
        setStep(3);
        verifyPayment(reference, storedToken);
      }
    }

    const mode = searchParams.get("mode");
    const qEmail = searchParams.get("email");
    const qUserId = searchParams.get("userId");
    if (mode === "verify" && qUserId) {
      setUserId(qUserId);
      if (qEmail) setEmail(qEmail);
      setOtpSent(true);
      setStep(1);
    } else if (mode === "pay" && qUserId) {
      setUserId(qUserId);
      if (qEmail) setEmail(qEmail);
      const qToken = searchParams.get("token");
      if (qToken) {
        localStorage.setItem("token", qToken);
        setToken(qToken);
      }
      setStep(2);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const verifyPayment = useCallback(async (reference: string, tk: string) => {
    try {
      const res = await fetch(`${API_URL}/api/registration/payment/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${tk}` },
        body: JSON.stringify({ reference }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Payment confirmed");
        setStep(3);
      } else {
        toast.error(data.error || "Payment verification failed");
        setStep(2);
      }
    } catch {
      toast.error("Could not verify payment");
      setStep(2);
    }
  }, []);

  // ── Step 1: Basic ──────────────────────────────────────────────────
  const handleBasic = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name || !email || !password) return setError("Name, email, and password are required");
    if (password.length < 6) return setError("Password must be at least 6 characters");
    if (password !== confirmPassword) return setError("Passwords do not match");

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/registration/basic`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, phone, referralCode: referralCode.trim() || undefined }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Registration failed");
      } else {
        setUserId(data.data.userId);
        setOtpSent(true);
        toast.success("Verification code sent to your email");
      }
    } catch {
      setError("Network error. Please try again.");
    }
    setLoading(false);
  };

  const handleVerifyEmail = async () => {
    if (!otp) return setError("Enter the verification code");
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/registration/verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, code: otp }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Verification failed");
      } else {
        localStorage.setItem("token", data.data.token);
        setToken(data.data.token);
        setStep(2);
        toast.success("Email verified");
      }
    } catch {
      setError("Network error. Please try again.");
    }
    setLoading(false);
  };

  const handleResendOtp = async () => {
    if (!email) return;
    try {
      const res = await fetch(`${API_URL}/api/auth/resend-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) toast.success("Verification code resent to your email");
      else toast.error(data.error || "Failed to resend code");
    } catch {
      toast.error("Network error. Please try again.");
    }
  };

  // ── Step 2: Payment ────────────────────────────────────────────────
  const handlePay = async () => {
    if (!token) return setError("Please verify your email first");
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/registration/payment/initialize`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!data.success || !data.data.authorizationUrl) {
        setError(data.error || "Failed to initialize payment");
        setLoading(false);
        return;
      }
      const reference = data.data.reference;
      const paymentWindow = window.open(data.data.authorizationUrl, "_blank", "width=500,height=700,scrollbars=yes,resizable=yes");
      const poll = setInterval(() => {
        if (paymentWindow?.closed) {
          clearInterval(poll);
          verifyPayment(reference, token!);
        }
      }, 600);
    } catch {
      setError("Network error. Please try again.");
    }
    setLoading(false);
  };

  // ── Step 3: KYC ────────────────────────────────────────────────────
  const handleKyc = async () => {
    if (!/^\d{11}$/.test(bvn)) return setError("BVN must be 11 digits");
    if (!/^\d{11}$/.test(nin)) return setError("NIN must be 11 digits");
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/registration/kyc`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ bvn, nin }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || "KYC verification failed");
      } else {
        setVirtualAccount(data.data.virtualAccount || null);
        setStep(4);
        toast.success("Account created & verified!");
      }
    } catch {
      setError("Network error. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex bg-brand-cream">
      {/* Left Panel */}
      <div
        className="hidden md:flex w-1/2 flex-col justify-center items-center p-12 relative overflow-hidden"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?auto=format&fit=crop&w=1200&q=80')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute -top-[10%] -right-[10%] w-[300px] h-[300px] rounded-full border border-[rgba(255,255,255,0.06)]" />
        <div className="absolute -bottom-[15%] -left-[10%] w-[400px] h-[400px] rounded-full border border-[rgba(255,255,255,0.04)]" />
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-[420px]">
          {step <= 3 && <StepIndicator step={step} />}

          <div className="mb-6">
            <h2 className="text-[1.5rem] font-semibold text-brand-dark tracking-[-0.025em]">
              {step === 1 && "Create Account"}
              {step === 2 && "Registration Fee"}
              {step === 3 && "Verify Your Identity"}
              {step === 4 && "You're All Set!"}
            </h2>
            <p className="text-[13px] text-gray-500 mt-1.5">
              {step === 1 && "Fill in your details to get started"}
              {step === 2 && `Pay the one-time ₦${REG_FEE.toLocaleString()} fee to continue`}
              {step === 3 && "Enter your BVN & NIN — we verify instantly via CreditChek"}
              {step === 4 && "Your account is verified and your virtual account is ready"}
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-medium mb-5">
              {error}
            </div>
          )}

          {/* Step 1 */}
          {step === 1 && !otpSent && (
            <form onSubmit={handleBasic}>
              <TextField label="Full Name" icon={icons.user} type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Adaeze Nwankwo" autoComplete="name" />
              <TextField label="Email Address" icon={icons.mail} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="adaeze@email.com" autoComplete="email" />
              <TextField label="Phone (optional)" icon={icons.phone} type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+234..." />

              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Password</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 flex">{icons.lock}</span>
                  <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min. 6 characters" autoComplete="new-password"
                    className={`${inputClass} pl-10 pr-10`}
                    onFocus={(e) => { e.currentTarget.style.borderColor = config.colors.primary; e.currentTarget.style.boxShadow = `0 0 0 3px ${config.colors.primary}15`; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = "#E5E7EB"; e.currentTarget.style.boxShadow = "none"; }}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-none border-none cursor-pointer p-1 text-gray-400 flex">
                    {showPassword ? icons.eyeOff : icons.eyeOpen}
                  </button>
                </div>
                {password && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex-1 h-[3px] rounded-full transition-colors" style={{ backgroundColor: i <= passwordStrength.level ? passwordStrength.color : "#E5E7EB" }} />
                      ))}
                    </div>
                    <span className="text-[10px] font-medium" style={{ color: passwordStrength.color }}>{passwordStrength.label}</span>
                  </div>
                )}
              </div>

              <TextField
                label="Confirm Password"
                icon={icons.shield}
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                autoComplete="new-password"
                invalid={!!(confirmPassword && password !== confirmPassword)}
                rightSlot={confirmPassword && password === confirmPassword ? icons.check : undefined}
              />

              {/* Referral Code */}
              <div
                className="mb-6 p-[0.875rem] rounded-[0.625rem] transition"
                style={{
                  backgroundColor: referralCode ? `${config.colors.primary}06` : "#FAFAFA",
                  border: `1px solid ${referralCode ? `${config.colors.primary}20` : "#F3F4F6"}`,
                }}
              >
                <div className="flex items-center justify-between mb-2" style={{ marginBottom: referralCode ? "0.5rem" : 0 }}>
                  <span className="text-xs font-medium text-gray-700 flex items-center gap-1.5">
                    {icons.gift}
                    Have a referral code?
                  </span>
                  {!referralCode && (
                    <button type="button" onClick={() => setReferralCode(" ")}
                      className="text-[11px] font-semibold bg-none border-none cursor-pointer p-0 no-underline"
                      style={{ color: config.colors.primary }}>
                      Enter code
                    </button>
                  )}
                </div>
                {referralCode && (
                  <div className="relative">
                    <input type="text" value={referralCode} onChange={(e) => setReferralCode(e.target.value)} placeholder="e.g. ADAEZE-8K3M"
                      className="w-full py-2 px-3 rounded-lg border border-gray-200 text-xs font-mono font-semibold tracking-[0.05em] outline-none"
                      style={{ color: config.colors.primary, backgroundColor: "#ffffff" }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = config.colors.primary; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = "#E5E7EB"; }}
                    />
                  </div>
                )}
              </div>

              <button type="submit" disabled={loading}
                className="w-full py-3 rounded-[0.625rem] text-[13px] font-semibold text-white border-none flex items-center justify-center gap-2 transition"
                style={{
                  backgroundColor: config.colors.primary,
                  color: "#ffffff",
                  opacity: loading ? 0.6 : 1,
                  cursor: loading ? "not-allowed" : "pointer",
                }}>
                {loading ? "Creating account..." : "Continue"}
              </button>
            </form>
          )}

          {step === 1 && otpSent && (
            <div>
              <TextField label="Verification Code" type="text" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="6-digit code from email" />
              <button onClick={handleVerifyEmail} disabled={loading}
                className="w-full py-3 rounded-[0.625rem] text-[13px] font-semibold text-white border-none transition"
                style={{
                  backgroundColor: config.colors.primary,
                  color: "#ffffff",
                  opacity: loading ? 0.6 : 1,
                  cursor: loading ? "not-allowed" : "pointer",
                }}>
                {loading ? "Verifying..." : "Verify Email & Continue"}
              </button>
              <p className="text-[11px] text-gray-400 mt-3 text-center">
                 Didn't get it?{" "}
                 <button type="button" onClick={handleResendOtp} className="underline bg-none border-none cursor-pointer p-0" style={{ color: config.colors.primary }}>
                   Resend code
                 </button>
               </p>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div>
              <div className="p-5 bg-gray-50 rounded-xl mb-6 text-center">
                <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-[0.1em]">Registration Fee</span>
                <div className="text-[1.75rem] font-mono font-bold mt-1" style={{ color: config.colors.primary }}>
                  ₦{REG_FEE.toLocaleString()}
                </div>
                <p className="text-[11px] text-gray-500 mt-2">
                  One-time fee. Secured by Flutterwave (card, bank transfer, USSD).
                </p>
              </div>
              <button onClick={handlePay} disabled={loading}
                className="w-full py-3 rounded-[0.625rem] text-[13px] font-semibold text-white border-none flex items-center justify-center gap-2 transition"
                style={{
                  backgroundColor: config.colors.primary,
                  color: "#ffffff",
                  opacity: loading ? 0.6 : 1,
                  cursor: loading ? "not-allowed" : "pointer",
                }}>
                {loading ? "Redirecting..." : `Pay ₦${REG_FEE.toLocaleString()}`}
              </button>
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div>
              <TextField label="BVN (11 digits)" type="text" value={bvn} onChange={(e) => setBvn(e.target.value.replace(/\D/g, "").slice(0, 11))} placeholder="12345678901" inputMode="numeric" />
              <TextField label="NIN (11 digits)" type="text" value={nin} onChange={(e) => setNin(e.target.value.replace(/\D/g, "").slice(0, 11))} placeholder="98765432109" inputMode="numeric" />
              <button onClick={handleKyc} disabled={loading}
                className="w-full py-3 rounded-[0.625rem] text-[13px] font-semibold text-white border-none flex items-center justify-center gap-2 transition"
                style={{
                  backgroundColor: config.colors.primary,
                  color: "#ffffff",
                  opacity: loading ? 0.6 : 1,
                  cursor: loading ? "not-allowed" : "pointer",
                }}>
                {loading ? "Verifying with CreditChek..." : "Verify & Finish"}
              </button>
            </div>
          )}

          {/* Step 4 — success */}
          {step === 4 && (
            <div>
              <div className="p-6 bg-emerald-50 rounded-xl mb-6 border border-emerald-200">
                <div className="text-[13px] font-semibold text-emerald-600 mb-3">✓ Identity verified & KYC approved</div>
                {virtualAccount ? (
                  <div className="text-xs text-emerald-800">
                    <div className="mb-2">
                      <span className="text-gray-500">Virtual Account: </span>
                      <strong className="font-mono">{virtualAccount.accountNumber}</strong>
                    </div>
                    <div><span className="text-gray-500">Bank: </span><strong>{virtualAccount.bankName}</strong></div>
                  </div>
                ) : (
                  <div className="text-xs text-emerald-800">Your virtual account will be created shortly.</div>
                )}
              </div>
              <button onClick={() => { window.location.href = "/"; }}
                className="w-full py-3 rounded-[0.625rem] text-[13px] font-semibold text-white border-none"
                style={{ backgroundColor: config.colors.primary, color: "#ffffff", cursor: "pointer" }}>
                Go to Dashboard
              </button>
            </div>
          )}

          {step <= 3 && (
            <div className="text-center mt-6">
              <span className="text-[13px] text-gray-500">
                Already have an account?{" "}
                <a href="/login" className="font-semibold no-underline" style={{ color: config.colors.primary }}>Sign in</a>
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
