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
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", marginBottom: "2rem" }}>
      {STEPS.map((label, i) => {
        const num = i + 1;
        const isActive = step === num;
        const isDone = step > num;
        return (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div style={{
              width: "28px", height: "28px", borderRadius: "50%",
              backgroundColor: isDone ? "#059669" : isActive ? config.colors.primary : "#F0F0F0",
              color: isDone || isActive ? "#fff" : "#999", fontSize: "11px", fontWeight: 700,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {isDone ? "✓" : num}
            </div>
            <span style={{ fontSize: "11px", fontWeight: isActive ? 600 : 400, color: isActive ? "#2D2D2D" : "#999" }}>{label}</span>
            {i < STEPS.length - 1 && (
              <div style={{ width: "24px", height: "1px", backgroundColor: isDone ? "#059669" : "#E5E7EB" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "0.6875rem 0.875rem",
  borderRadius: "0.625rem", border: "1px solid #E5E7EB", fontSize: "14px",
  outline: "none", transition: "all 0.2s ease", boxSizing: "border-box", color: "#1A1A1A",
};

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
    <div style={{ marginBottom: "1rem" }}>
      <label style={{ fontSize: "12px", fontWeight: 500, color: "#374151", display: "block", marginBottom: "0.375rem" }}>{label}</label>
      <div style={{ position: "relative" }}>
        {icon && (
          <span style={{ position: "absolute", left: "0.875rem", top: "50%", transform: "translateY(-50%)", color: "#9CA3AF", display: "flex" }}>
            {icon}
          </span>
        )}
        <input
          {...props}
          style={{
            ...inputStyle,
            paddingLeft: icon ? "2.5rem" : "0.875rem",
            paddingRight: rightSlot ? "2.5rem" : "0.875rem",
            border: `1px solid ${invalid ? "#FECACA" : "#E5E7EB"}`,
          }}
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
          <span style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", display: "flex", alignItems: "center" }}>
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

export default function WebsiteRegisterPage() {
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
      const stored = localStorage.getItem("token");
      if (stored) {
        setToken(stored);
        setStep(3);
        verifyPayment(reference, stored);
      }
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
      if (!data.success) setError(data.error || "Registration failed");
      else {
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
      if (!data.success) setError(data.error || "Verification failed");
      else {
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
      if (!data.success) setError(data.error || "KYC verification failed");
      else {
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
    <div style={{ minHeight: "100vh", display: "flex", backgroundColor: "#FDFDFC" }}>
      <div style={{
        flex: "0 0 45%",
        background: `linear-gradient(160deg, ${config.colors.secondary} 0%, ${config.colors.primary} 50%, #1a4a30 100%)`,
        display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center",
        padding: "3rem", position: "relative", overflow: "hidden",
      }}>
        <a href="/" style={{ position: "absolute", top: "2rem", left: "2rem", textDecoration: "none" }}>
          <span style={{ fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-0.05em", color: "#ffffff" }}>
            {config.name.toUpperCase().replace(/\s+/g, "")}
          </span>
        </a>
        <div style={{ position: "relative", zIndex: 1, textAlign: "center", maxWidth: "320px" }}>
          <h1 style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 300, color: "#ffffff", lineHeight: 1.3, marginBottom: "1rem" }}>
            Join {config.name}<br />
            <span style={{ fontStyle: "italic", fontFamily: "'Playfair Display', serif", fontWeight: 500, color: config.colors.accent }}>
              in three easy steps
            </span>
          </h1>
          <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)", lineHeight: 1.6 }}>
            Create your account, pay the one-time ₦{REG_FEE.toLocaleString()} registration fee, and verify your BVN & NIN to unlock your virtual account.
          </p>
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem", overflowY: "auto" }}>
        <div style={{ width: "100%", maxWidth: "420px" }}>
          {step <= 3 && <StepIndicator step={step} />}

          <div style={{ marginBottom: "1.5rem" }}>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 600, color: "#1A1A1A", letterSpacing: "-0.025em" }}>
              {step === 1 && "Create Account"}
              {step === 2 && "Registration Fee"}
              {step === 3 && "Verify Your Identity"}
              {step === 4 && "You're All Set!"}
            </h2>
            <p style={{ fontSize: "13px", color: "#717171", marginTop: "0.375rem" }}>
              {step === 1 && "Fill in your details to get started"}
              {step === 2 && `Pay the one-time ₦${REG_FEE.toLocaleString()} fee to continue`}
              {step === 3 && "Enter your BVN & NIN — we verify instantly via CreditChek"}
              {step === 4 && "Your account is verified and your virtual account is ready"}
            </p>
          </div>

          {error && (
            <div style={{ padding: "0.75rem 1rem", borderRadius: "0.75rem", backgroundColor: "#FEF2F2", border: "1px solid #FECACA", color: "#DC2626", fontSize: "12px", fontWeight: 500, marginBottom: "1.25rem" }}>
              {error}
            </div>
          )}

          {step === 1 && !otpSent && (
            <form onSubmit={handleBasic}>
              <TextField label="Full Name" icon={icons.user} type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Adaeze Nwankwo" />
              <TextField label="Email Address" icon={icons.mail} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="adaeze@email.com" />
              <TextField label="Phone (optional)" icon={icons.phone} type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+234..." />

              <div style={{ marginBottom: "1rem" }}>
                <label style={{ fontSize: "12px", fontWeight: 500, color: "#374151", display: "block", marginBottom: "0.375rem" }}>Password</label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: "0.875rem", top: "50%", transform: "translateY(-50%)", color: "#9CA3AF", display: "flex" }}>{icons.lock}</span>
                  <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min. 6 characters" autoComplete="new-password"
                    style={{ ...inputStyle, paddingLeft: "2.5rem", paddingRight: "2.5rem" }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = config.colors.primary; e.currentTarget.style.boxShadow = `0 0 0 3px ${config.colors.primary}15`; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = "#E5E7EB"; e.currentTarget.style.boxShadow = "none"; }}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: "0.25rem", color: "#9CA3AF", display: "flex" }}>
                    {showPassword ? icons.eyeOff : icons.eyeOpen}
                  </button>
                </div>
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

              <TextField
                label="Confirm Password"
                icon={icons.shield}
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                invalid={!!(confirmPassword && password !== confirmPassword)}
                rightSlot={confirmPassword && password === confirmPassword ? icons.check : undefined}
              />

              <div style={{ marginBottom: "1.5rem", padding: "0.875rem", borderRadius: "0.625rem", backgroundColor: referralCode ? `${config.colors.primary}06` : "#FAFAFA", border: `1px solid ${referralCode ? `${config.colors.primary}20` : "#F3F4F6"}` }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: referralCode ? "0.5rem" : 0 }}>
                  <span style={{ fontSize: "12px", fontWeight: 500, color: "#374151", display: "flex", alignItems: "center", gap: "0.375rem" }}>
                    {icons.gift}
                    Have a referral code?
                  </span>
                  {!referralCode && (
                    <button type="button" onClick={() => setReferralCode(" ")}
                      style={{ fontSize: "11px", fontWeight: 600, color: config.colors.primary, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                      Enter code
                    </button>
                  )}
                </div>
                {referralCode && (
                  <input type="text" value={referralCode} onChange={(e) => setReferralCode(e.target.value)} placeholder="e.g. ADAEZE-8K3M"
                    style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: "0.5rem", border: "1px solid #E5E7EB", fontSize: "12px", fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, letterSpacing: "0.05em", outline: "none", boxSizing: "border-box", color: config.colors.primary, backgroundColor: "#ffffff" }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = config.colors.primary; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = "#E5E7EB"; }}
                  />
                )}
              </div>

              <button type="submit" disabled={loading}
                style={{ width: "100%", padding: "0.75rem", borderRadius: "0.625rem", fontSize: "14px", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", backgroundColor: config.colors.primary, color: "#ffffff", border: "none", opacity: loading ? 0.6 : 1 }}>
                {loading ? "Creating account..." : "Continue"}
              </button>
            </form>
          )}

          {step === 1 && otpSent && (
            <div>
              <TextField label="Verification Code" type="text" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="6-digit code from email" />
              <button onClick={handleVerifyEmail} disabled={loading}
                style={{ width: "100%", padding: "0.75rem", borderRadius: "0.625rem", fontSize: "14px", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", backgroundColor: config.colors.primary, color: "#ffffff", border: "none", opacity: loading ? 0.6 : 1 }}>
                {loading ? "Verifying..." : "Verify Email & Continue"}
              </button>
            </div>
          )}

          {step === 2 && (
            <div>
              <div style={{ padding: "1.25rem", backgroundColor: "#F9FAFB", borderRadius: "12px", marginBottom: "1.5rem", textAlign: "center" }}>
                <span style={{ fontSize: "10px", color: "#9CA3AF", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em" }}>Registration Fee</span>
                <div style={{ fontSize: "1.75rem", fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: config.colors.primary, marginTop: "0.25rem" }}>
                  ₦{REG_FEE.toLocaleString()}
                </div>
                <p style={{ fontSize: "11px", color: "#6B7280", marginTop: "0.5rem" }}>One-time fee. Secured by Flutterwave.</p>
              </div>
              <button onClick={handlePay} disabled={loading}
                style={{ width: "100%", padding: "0.75rem", borderRadius: "0.625rem", fontSize: "14px", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", backgroundColor: config.colors.primary, color: "#ffffff", border: "none", opacity: loading ? 0.6 : 1 }}>
                {loading ? "Redirecting..." : `Pay ₦${REG_FEE.toLocaleString()}`}
              </button>
            </div>
          )}

          {step === 3 && (
            <div>
              <TextField label="BVN (11 digits)" type="text" value={bvn} onChange={(e) => setBvn(e.target.value.replace(/\D/g, "").slice(0, 11))} placeholder="12345678901" inputMode="numeric" />
              <TextField label="NIN (11 digits)" type="text" value={nin} onChange={(e) => setNin(e.target.value.replace(/\D/g, "").slice(0, 11))} placeholder="98765432109" inputMode="numeric" />
              <button onClick={handleKyc} disabled={loading}
                style={{ width: "100%", padding: "0.75rem", borderRadius: "0.625rem", fontSize: "14px", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", backgroundColor: config.colors.primary, color: "#ffffff", border: "none", opacity: loading ? 0.6 : 1 }}>
                {loading ? "Verifying with CreditChek..." : "Verify & Finish"}
              </button>
            </div>
          )}

          {step === 4 && (
            <div>
              <div style={{ padding: "1.5rem", backgroundColor: "#ECFDF5", borderRadius: "12px", marginBottom: "1.5rem", border: "1px solid #A7F3D0" }}>
                <div style={{ fontSize: "13px", fontWeight: 600, color: "#059669", marginBottom: "0.75rem" }}>✓ Identity verified & KYC approved</div>
                {virtualAccount ? (
                  <div style={{ fontSize: "12px", color: "#065F46" }}>
                    <div style={{ marginBottom: "0.5rem" }}><span style={{ color: "#6B7280" }}>Virtual Account: </span><strong style={{ fontFamily: "'JetBrains Mono', monospace" }}>{virtualAccount.accountNumber}</strong></div>
                    <div><span style={{ color: "#6B7280" }}>Bank: </span><strong>{virtualAccount.bankName}</strong></div>
                  </div>
                ) : (
                  <div style={{ fontSize: "12px", color: "#065F46" }}>Your virtual account will be created shortly.</div>
                )}
              </div>
              <a href="/dashboard" style={{ display: "block", width: "100%", padding: "0.75rem", borderRadius: "0.625rem", fontSize: "14px", fontWeight: 600, textAlign: "center", textDecoration: "none", backgroundColor: config.colors.primary, color: "#ffffff" }}>
                Go to Dashboard
              </a>
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        @media (max-width: 768px) {
          div[style*="flex: 0 0 45%"] { display: none !important; }
        }
      `}</style>
    </div>
  );
}
