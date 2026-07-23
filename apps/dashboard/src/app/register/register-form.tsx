"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import PhoneInput from "@/components/PhoneInput";
import { config } from "@thrift/config";
import {
  ArrowLeft,
  User,
  Mail,
  Lock,
  Shield,
  Gift,
  CheckCircle2,
  Eye,
  EyeOff,
  GraduationCap,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  IdCard,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const REG_FEE = parseInt(process.env.NEXT_PUBLIC_REGISTRATION_FEE || "4200", 10);

type ThemeMode = "light" | "dark";

const STEPS = ["Basic", "Payment", "KYC"];

function StepIndicator({ step, isDark }: { step: number; isDark: boolean }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {STEPS.map((label, i) => {
        const num = i + 1;
        const isActive = step === num;
        const isDone = step > num;
        return (
          <div key={label} className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full text-[11px] font-bold flex items-center justify-center transition-colors ${
                isDone
                  ? "bg-emerald-600 text-white"
                  : isActive
                  ? "bg-blue-600 text-white"
                  : isDark
                  ? "bg-slate-800 text-slate-500"
                  : "bg-slate-100 text-slate-400"
              }`}
            >
              {isDone ? "✓" : num}
            </div>
            <span
              className={`text-[11px] ${isActive ? "font-semibold" : ""} ${
                isActive
                  ? isDark
                    ? "text-white"
                    : "text-slate-900"
                  : isDark
                  ? "text-slate-500"
                  : "text-slate-400"
              }`}
            >
              {label}
            </span>
            {i < STEPS.length - 1 && (
              <div
                className={`w-6 h-px ${isDone ? "bg-emerald-600" : isDark ? "bg-slate-800" : "bg-slate-200"}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

const inputClass =
  "w-full py-2.5 rounded-xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 transition";

function TextField({
  label,
  icon,
  rightSlot,
  invalid,
  isDark,
  ...props
}: {
  label: string;
  icon?: React.ReactNode;
  rightSlot?: React.ReactNode;
  invalid?: boolean;
  isDark: boolean;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="mb-4">
      <label className={`block text-xs font-bold ${isDark ? "text-slate-300" : "text-slate-700"} mb-1`}>{label}</label>
      <div className="relative">
        {icon && (
          <span className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${isDark ? "text-slate-400" : "text-slate-400"} flex`}>
            {icon}
          </span>
        )}
        <input
          {...props}
          className={`${inputClass} ${icon ? "pl-10" : "pl-4"} ${rightSlot ? "pr-10" : "pr-4"} ${
            isDark ? "border-slate-700 bg-slate-800 text-white" : "border-slate-300 bg-slate-50 text-slate-900"
          } ${invalid ? "border-red-300" : ""}`}
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

export default function RegisterForm() {
  const searchParams = useSearchParams();
  const [theme, setTheme] = useState<ThemeMode>("light");
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
  const [kycResult, setKycResult] = useState<{
    verifiedName?: string;
    identity?: Record<string, any>;
    creditScore?: number;
  } | null>(null);

  const toggleTheme = () => setTheme((t) => (t === "light" ? "dark" : "light"));
  const isDark = theme === "dark";

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
    const qName = searchParams.get("name");
    const qEmail = searchParams.get("email");
    if (qName) setName(qName);
    if (qEmail) setEmail(qEmail);
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
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
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
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
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
  const handleKyc = async (e: React.FormEvent) => {
    e.preventDefault();
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
        setKycResult({
          verifiedName: data.data.verifiedName,
          identity: data.data.identity,
          creditScore: data.data.creditScore,
        });
        setStep(4);
        toast.success("Account created & verified!");
        confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 } });
      }
    } catch {
      setError("Network error. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 selection:bg-blue-500 selection:text-white font-sans">
      {/* Left: Hero Panel */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between p-12 bg-mesh relative overflow-hidden">
        <div className="absolute -right-32 -top-24 h-80 w-80 rounded-full bg-[var(--color-brand-primary)]/8 blur-3xl" />
        <div className="absolute -left-32 bottom-0 h-60 w-60 rounded-full bg-[var(--color-brand-accent)]/8 blur-3xl" />

        <div className="relative z-10">
          <a
            href="/login"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors border border-slate-200/60 dark:border-slate-700/60"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Sign In
          </a>
        </div>

        <div className="relative z-10 max-w-md">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-6">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>FELLOWSHIP REGISTRATION</span>
          </div>
          <h1 className="font-heading font-bold text-4xl sm:text-5xl text-slate-900 dark:text-white tracking-tight leading-tight mb-4">
            {step === 1 && <>Create Your{" "}
              <span className="bg-gradient-to-r from-blue-600 to-emerald-500 bg-clip-text text-transparent">
                Scholar Account
              </span></>}
            {step === 2 && <>Complete{" "}
              <span className="bg-gradient-to-r from-blue-600 to-emerald-500 bg-clip-text text-transparent">
                Registration
              </span></>}
            {step === 3 && <>Verify Your{" "}
              <span className="bg-gradient-to-r from-blue-600 to-emerald-500 bg-clip-text text-transparent">
                Identity
              </span></>}
            {step === 4 && <>Welcome to the{" "}
              <span className="bg-gradient-to-r from-blue-600 to-emerald-500 bg-clip-text text-transparent">
                Cohort!
              </span></>}
          </h1>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 leading-relaxed">
            {step === 1 && "Join our global community of scholars, innovators, and change-makers across 32 countries."}
            {step === 2 && "A one-time registration fee unlocks your full scholar workspace, mentorship, and micro-grant access."}
            {step === 3 && "Quick identity verification via BVN & NIN — secure, instant, and required for all fellows."}
            {step === 4 && "Your account is ready. Access your dashboard, connect with mentors, and start your journey."}
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Encrypted SSL &middot; Secure Registration</span>
        </div>
      </div>

      {/* Right: Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8">
        <div className="w-full max-w-[420px]">
          {/* Mobile back link */}
          <div className="lg:hidden mb-8">
            <a
              href="/login"
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Sign In
            </a>
          </div>

          <div className="mb-8">
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center mb-4">
              <GraduationCap className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="font-heading text-[1.5rem] font-bold text-slate-900 dark:text-white tracking-tight">
              {step === 1 && "Create Your Account"}
              {step === 2 && "Registration Fee"}
              {step === 3 && "Verify Your Identity"}
              {step === 4 && "Welcome to the Cohort!"}
            </h2>
            <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1.5">
              {step === 1 && "Join our global community of scholars"}
              {step === 2 && "One-time fee to unlock your workspace"}
              {step === 3 && "Secure BVN & NIN verification"}
              {step === 4 && "Your account is ready"}
            </p>
          </div>

          {step <= 3 && <StepIndicator step={step} isDark={isDark} />}

          {error && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-xs font-medium mb-4">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}

          {step === 1 && !otpSent && (
            <form onSubmit={handleBasic} className="space-y-0">
              <TextField
                label="Full Name"
                icon={<User className="w-4 h-4" />}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Amina Diallo"
                required
                isDark={isDark}
              />
              <TextField
                label="Email Address"
                icon={<Mail className="w-4 h-4" />}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="scholar@globalfreedomworldwide.com"
                required
                isDark={isDark}
              />
              <PhoneInput label="Phone (optional)" value={phone} onChange={setPhone} placeholder="+234..." />
              <div className="mb-4">
                <label className={`block text-xs font-bold ${isDark ? "text-slate-300" : "text-slate-700"} mb-1`}>Password</label>
                <div className="relative">
                  <Lock className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? "text-slate-400" : "text-slate-400"}`} />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    autoComplete="new-password"
                    className={`${inputClass} pl-10 pr-10 ${
                      isDark ? "border-slate-700 bg-slate-800 text-white" : "border-slate-300 bg-slate-50 text-slate-900"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 ${isDark ? "text-slate-400" : "text-slate-400"} hover:text-slate-600`}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {password && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className="flex-1 h-[3px] rounded-full transition-colors"
                          style={{ backgroundColor: i <= passwordStrength.level ? passwordStrength.color : isDark ? "#334155" : "#E5E7EB" }}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] font-medium" style={{ color: passwordStrength.color }}>
                      {passwordStrength.label}
                    </span>
                  </div>
                )}
              </div>
              <TextField
                label="Confirm Password"
                icon={<Shield className="w-4 h-4" />}
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                autoComplete="new-password"
                invalid={!!(confirmPassword && password !== confirmPassword)}
                rightSlot={confirmPassword && password === confirmPassword ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : undefined}
                isDark={isDark}
              />
              {/* Referral Code */}
              <div
                className={`mb-6 p-3.5 rounded-xl transition ${
                  referralCode
                    ? isDark
                      ? "bg-blue-950/30 border-blue-900/50"
                      : "bg-blue-50/50 border-blue-200"
                    : isDark
                    ? "bg-slate-800/50 border-slate-700"
                    : "bg-slate-50 border-slate-200"
                } border`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-medium ${isDark ? "text-slate-300" : "text-slate-700"} flex items-center gap-1.5`}>
                    <Gift className="w-4 h-4 text-blue-600" />
                    Have a referral code?
                  </span>
                  {!referralCode && (
                    <button
                      type="button"
                      onClick={() => setReferralCode(" ")}
                      className="text-[11px] font-semibold text-blue-600 hover:underline"
                    >
                      Enter code
                    </button>
                  )}
                </div>
                {referralCode && (
                  <input
                    type="text"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value)}
                    placeholder="e.g. ADAEZE-8K3M"
                    className={`w-full py-2 px-3 rounded-lg border text-xs font-mono font-semibold tracking-wider outline-none ${
                      isDark ? "border-slate-700 bg-slate-800 text-blue-400" : "border-slate-200 bg-white text-blue-600"
                    }`}
                  />
                )}
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl text-[13px] font-semibold text-white bg-blue-600 hover:bg-blue-700 border-none transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
              >
                {loading ? "Submitting..." : <>Continue <ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>
          )}

          {step === 1 && otpSent && (
            <div className="space-y-4">
              <p className={`text-xs ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                We sent a 6-digit code to <strong>{email}</strong>. Enter it below.
              </p>
              <TextField
                label="Verification Code"
                icon={<Mail className="w-4 h-4" />}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="Enter 6-digit code"
                inputMode="numeric"
                required
                isDark={isDark}
              />
              <button
                type="button"
                onClick={handleVerifyEmail}
                disabled={loading}
                className="w-full py-3.5 rounded-xl text-[13px] font-semibold text-white bg-blue-600 hover:bg-blue-700 border-none transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? "Verifying..." : <>Verify & Continue <ArrowRight className="w-4 h-4" /></>}
              </button>
              <button
                type="button"
                onClick={() => { setOtpSent(false); setOtp(""); }}
                className={`w-full text-center text-[11px] font-semibold ${isDark ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-900"}`}
              >
                ← Change email
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className={`rounded-2xl p-4 border ${isDark ? "bg-slate-800/50 border-slate-700" : "bg-slate-50 border-slate-200"}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? "bg-blue-900/40" : "bg-blue-50"}`}>
                    <CreditCard className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-slate-900 dark:text-white">Registration Fee</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">One-time payment</p>
                  </div>
                  <span className="text-lg font-bold text-slate-900 dark:text-white">
                    ₦{REG_FEE.toLocaleString()}
                  </span>
                </div>
              </div>

              <p className={`text-[11px] text-center ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                Secured by Flutterwave (card, bank transfer, USSD).
              </p>

              <button
                type="button"
                onClick={handlePay}
                disabled={loading}
                className="w-full py-3.5 rounded-xl text-[13px] font-semibold text-white bg-blue-600 hover:bg-blue-700 border-none transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? "Redirecting..." : <><CreditCard className="w-4 h-4" /> Pay ₦{REG_FEE.toLocaleString()}</>}
              </button>
            </div>
          )}

          {step === 3 && (
            <form onSubmit={handleKyc} className="space-y-0">
              <div className={`rounded-2xl p-3 border mb-4 ${isDark ? "bg-slate-800/50 border-slate-700" : "bg-blue-50 border-blue-200"}`}>
                <p className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold">
                  🔒 Your BVN and NIN are encrypted and used only for identity verification.
                </p>
              </div>
              <TextField
                label="Bank Verification Number (BVN)"
                icon={<IdCard className="w-4 h-4" />}
                value={bvn}
                onChange={(e) => setBvn(e.target.value.replace(/\D/g, "").slice(0, 11))}
                placeholder="11-digit BVN"
                required
                isDark={isDark}
                inputMode="numeric"
              />
              <TextField
                label="National Identification Number (NIN)"
                icon={<IdCard className="w-4 h-4" />}
                value={nin}
                onChange={(e) => setNin(e.target.value.replace(/\D/g, "").slice(0, 11))}
                placeholder="11-digit NIN"
                required
                isDark={isDark}
                inputMode="numeric"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl text-[13px] font-semibold text-white bg-blue-600 hover:bg-blue-700 border-none transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
              >
                {loading ? "Verifying..." : <>Verify Identity <ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>
          )}

          {step === 4 && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">You&apos;re All Set!</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Welcome to the Global Freedom Worldwide scholar cohort. Your account is ready.
              </p>
              <button
                type="button"
                onClick={() => window.location.href = "/"}
                className="w-full py-3.5 rounded-xl text-[13px] font-semibold text-white bg-blue-600 hover:bg-blue-700 border-none transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-2"
              >
                Go to Dashboard <ArrowRight className="w-4 h-4" />
              </button>
              <div className="text-center pt-2">
                <span className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  Already have an account?{" "}
                  <a href="/login" className="font-semibold text-blue-600 hover:underline">Sign in</a>
                </span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500 mt-8 pt-5 border-t border-slate-100 dark:border-slate-800">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Encrypted SSL &middot; Secure Authentication</span>
          </div>
        </div>
      </div>
    </div>
  );
}
