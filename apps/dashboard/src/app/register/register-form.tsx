"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
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
  Sun,
  Moon,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  IdCard,
  Users,
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
        setKycResult({
          verifiedName: data.data.verifiedName,
          identity: data.data.identity,
          creditScore: data.data.creditScore,
        });
        setStep(4);
        toast.success("Account created & verified!");
      }
    } catch {
      setError("Network error. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className={`min-h-screen ${isDark ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"} transition-colors selection:bg-blue-500 selection:text-white font-sans flex flex-col`}>
      {/* HEADER NAVBAR */}
      <header className={`sticky top-0 z-40 ${isDark ? "bg-slate-900/90 border-slate-800" : "bg-white/90 border-slate-200"} backdrop-blur-xl border-b py-3.5 px-4 sm:px-8`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a
              href="/login"
              className={`p-2 rounded-xl ${isDark ? "bg-slate-800 text-slate-300 hover:text-white" : "bg-slate-100 text-slate-600 hover:text-slate-900"} transition-colors flex items-center gap-1.5 text-xs font-bold`}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Sign In</span>
            </a>

            <div className={`h-4 w-px ${isDark ? "bg-slate-700" : "bg-slate-300"} hidden sm:block`} />

            {/* Brand Logo */}
            <div className="flex items-center gap-2">
              <img src={config.logo} alt={config.name} className="w-8 h-8 rounded-xl object-contain shadow-md" />
              <div className="flex flex-col">
                <span className="font-bold text-sm tracking-tight">
                  {config.name}
                </span>
                <span className="text-[10px] text-blue-600 font-mono font-semibold">
                  {config.tagline.split("—")[0]?.trim()}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`p-2.5 rounded-xl ${isDark ? "text-slate-300 hover:bg-slate-800" : "text-slate-600 hover:bg-slate-100"} transition-colors border ${isDark ? "border-slate-800" : "border-slate-200"}`}
              title={`Switch to ${isDark ? "Light" : "Dark"} Mode`}
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex items-center justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center w-full my-auto">
          
          {/* LEFT COLUMN: HERO INFORMATION */}
          <div className="lg:col-span-6 space-y-6">
            <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full ${isDark ? "bg-blue-950/80 border-blue-800 text-blue-300" : "bg-blue-100 border-blue-200 text-blue-700"} border text-xs font-mono font-bold uppercase tracking-wider`}>
              <GraduationCap className="w-4 h-4 text-blue-600" />
              <span>FELLOWSHIP REGISTRATION</span>
            </div>

            <h1 className="font-bold text-3xl sm:text-5xl tracking-tight leading-tight">
              {step === 1 && "Create Your Scholar Account"}
              {step === 2 && "Complete Registration"}
              {step === 3 && "Verify Your Identity"}
              {step === 4 && "Welcome to the Cohort!"}
            </h1>

            <p className={`text-sm sm:text-base ${isDark ? "text-slate-300" : "text-slate-600"} leading-relaxed`}>
              {step === 1 && "Join our global community of scholars, innovators, and change-makers across 32 countries."}
              {step === 2 && "A one-time registration fee unlocks your full scholar workspace, mentorship, and micro-grant access."}
              {step === 3 && "Quick identity verification via BVN & NIN — secure, instant, and required for all fellows."}
              {step === 4 && "Your account is ready. Access your dashboard, connect with mentors, and start your journey."}
            </p>

            {step <= 3 && (
              <div className="space-y-3 pt-2">
                <div className={`flex items-center gap-3 p-3 rounded-2xl ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"} border shadow-sm`}>
                  <div className={`w-10 h-10 rounded-xl ${isDark ? "bg-blue-950/60 text-blue-400" : "bg-blue-50 text-blue-600"} flex items-center justify-center shrink-0`}>
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold">Secure & Encrypted</div>
                    <div className={`text-[11px] ${isDark ? "text-slate-400" : "text-slate-500"}`}>Your data is protected with enterprise-grade security.</div>
                  </div>
                </div>

                <div className={`flex items-center gap-3 p-3 rounded-2xl ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"} border shadow-sm`}>
                  <div className={`w-10 h-10 rounded-xl ${isDark ? "bg-teal-950/60 text-teal-400" : "bg-teal-50 text-teal-600"} flex items-center justify-center shrink-0`}>
                    <Gift className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold">Referral Rewards</div>
                    <div className={`text-[11px] ${isDark ? "text-slate-400" : "text-slate-500"}`}>Earn bonuses when you invite fellow scholars.</div>
                  </div>
                </div>

                <div className={`flex items-center gap-3 p-3 rounded-2xl ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"} border shadow-sm`}>
                  <div className={`w-10 h-10 rounded-xl ${isDark ? "bg-indigo-950/60 text-indigo-400" : "bg-indigo-50 text-indigo-600"} flex items-center justify-center shrink-0`}>
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold">Global Network</div>
                    <div className={`text-[11px] ${isDark ? "text-slate-400" : "text-slate-500"}`}>Connect with peers and mentors worldwide.</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: REGISTRATION FORM CARD */}
          <div className={`lg:col-span-6 ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"} rounded-3xl p-6 sm:p-8 border shadow-2xl space-y-6`}>
            
            {step <= 3 && <StepIndicator step={step} isDark={isDark} />}

            {error && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-medium">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {error}
              </div>
            )}

            {/* Step 1 */}
            {step === 1 && !otpSent && (
              <form onSubmit={handleBasic}>
                <TextField
                  label="Full Name"
                  icon={<User className="w-4 h-4" />}
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Adaeze Nwankwo"
                  autoComplete="name"
                  isDark={isDark}
                />
                <TextField
                  label="Email Address"
                  icon={<Mail className="w-4 h-4" />}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="adaeze@email.com"
                  autoComplete="email"
                  isDark={isDark}
                />
                <PhoneInput label="Phone (optional)" value={phone} onChange={setPhone} placeholder="+234..." />

                <div className="mb-4">
                  <label className={`block text-xs font-bold ${isDark ? "text-slate-300" : "text-slate-700"} mb-1`}>Password</label>
                  <div className="relative">
                    <Lock className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? "text-slate-400" : "text-slate-400"}`} />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 6 characters"
                      autoComplete="new-password"
                      className={`${inputClass} pl-10 pr-10 ${isDark ? "border-slate-700 bg-slate-800 text-white" : "border-slate-300 bg-slate-50 text-slate-900"}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={`absolute right-3 top-1/2 -translate-y-1/2 ${isDark ? "text-slate-400" : "text-slate-400"}`}
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
                  className="w-full py-3.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md flex items-center justify-center gap-2 transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M21 12a9 9 0 11-6.219-8.56" /></svg>
                      Creating account...
                    </>
                  ) : (
                    <>
                      <span>Continue</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {step === 1 && otpSent && (
              <div>
                <TextField
                  label="Verification Code"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="6-digit code from email"
                  isDark={isDark}
                />
                <button
                  onClick={handleVerifyEmail}
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md flex items-center justify-center gap-2 transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M21 12a9 9 0 11-6.219-8.56" /></svg>
                      Verifying...
                    </>
                  ) : (
                    <>
                      <span>Verify Email & Continue</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
                <p className={`text-[11px] ${isDark ? "text-slate-400" : "text-slate-400"} mt-3 text-center`}>
                  Didn't get it?{" "}
                  <button type="button" onClick={handleResendOtp} className="text-blue-600 font-semibold hover:underline">
                    Resend code
                  </button>
                </p>
              </div>
            )}

            {/* Step 2 */}
            {step === 2 && (
              <div>
                <div className={`p-5 ${isDark ? "bg-slate-800/60" : "bg-slate-50"} rounded-xl mb-6 text-center`}>
                  <span className={`text-[10px] ${isDark ? "text-slate-400" : "text-slate-400"} font-semibold uppercase tracking-wider`}>Registration Fee</span>
                  <div className="text-3xl font-mono font-bold mt-1 text-blue-600">
                    ₦{REG_FEE.toLocaleString()}
                  </div>
                  <p className={`text-[11px] ${isDark ? "text-slate-400" : "text-slate-500"} mt-2`}>
                    One-time fee. Secured by Flutterwave (card, bank transfer, USSD).
                  </p>
                </div>
                <button
                  onClick={handlePay}
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md flex items-center justify-center gap-2 transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M21 12a9 9 0 11-6.219-8.56" /></svg>
                      Redirecting...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      <span>Pay ₦{REG_FEE.toLocaleString()}</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Step 3 */}
            {step === 3 && (
              <div>
                <TextField
                  label="BVN (11 digits)"
                  type="text"
                  value={bvn}
                  onChange={(e) => setBvn(e.target.value.replace(/\D/g, "").slice(0, 11))}
                  placeholder="12345678901"
                  inputMode="numeric"
                  isDark={isDark}
                />
                <TextField
                  label="NIN (11 digits)"
                  type="text"
                  value={nin}
                  onChange={(e) => setNin(e.target.value.replace(/\D/g, "").slice(0, 11))}
                  placeholder="98765432109"
                  inputMode="numeric"
                  isDark={isDark}
                />
                <button
                  onClick={handleKyc}
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md flex items-center justify-center gap-2 transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M21 12a9 9 0 11-6.219-8.56" /></svg>
                      Verifying with CreditChek...
                    </>
                  ) : (
                    <>
                      <IdCard className="w-4 h-4" />
                      <span>Verify & Finish</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Step 4 — success */}
            {step === 4 && (
              <div>
                <div className={`p-6 ${isDark ? "bg-emerald-950/40 border-emerald-800" : "bg-emerald-50 border-emerald-200"} rounded-xl mb-6 border`}>
                  <div className={`text-xs font-semibold ${isDark ? "text-emerald-400" : "text-emerald-600"} mb-3 flex items-center gap-1.5`}>
                    <CheckCircle2 className="w-4 h-4" />
                    Identity verified & KYC approved
                  </div>

                  {kycResult?.verifiedName && (
                    <div className={`text-xs ${isDark ? "text-emerald-300" : "text-emerald-800"} mb-3`}>
                      <span className={isDark ? "text-slate-400" : "text-slate-500"}>Verified Name: </span>
                      <strong>{kycResult.verifiedName}</strong>
                    </div>
                  )}

                  {kycResult?.identity && (
                    <div className={`grid grid-cols-2 gap-x-4 gap-y-2 text-xs ${isDark ? "text-emerald-300" : "text-emerald-800"} mb-3`}>
                      {kycResult.identity.bvn && (
                        <div><span className={isDark ? "text-slate-400" : "text-slate-500"}>BVN: </span><strong className="font-mono">{kycResult.identity.bvn}</strong></div>
                      )}
                      {kycResult.identity.nin && (
                        <div><span className={isDark ? "text-slate-400" : "text-slate-500"}>NIN: </span><strong className="font-mono">{kycResult.identity.nin}</strong></div>
                      )}
                      {kycResult.identity.dateOfBirth && (
                        <div><span className={isDark ? "text-slate-400" : "text-slate-500"}>Date of Birth: </span><strong>{kycResult.identity.dateOfBirth}</strong></div>
                      )}
                      {kycResult.identity.gender && (
                        <div><span className={isDark ? "text-slate-400" : "text-slate-500"}>Gender: </span><strong className="capitalize">{kycResult.identity.gender}</strong></div>
                      )}
                      {kycResult.identity.phoneNumber && (
                        <div><span className={isDark ? "text-slate-400" : "text-slate-500"}>Phone: </span><strong>{kycResult.identity.phoneNumber}</strong></div>
                      )}
                      {kycResult.identity.email && (
                        <div className="col-span-2 truncate"><span className={isDark ? "text-slate-400" : "text-slate-500"}>Email: </span><strong>{kycResult.identity.email}</strong></div>
                      )}
                      {kycResult.identity.enrollmentBank && (
                        <div className="col-span-2"><span className={isDark ? "text-slate-400" : "text-slate-500"}>Enrollment Bank: </span><strong>{kycResult.identity.enrollmentBank}</strong></div>
                      )}
                      {kycResult.identity.address && (
                        <div className="col-span-2"><span className={isDark ? "text-slate-400" : "text-slate-500"}>Address: </span><strong>{kycResult.identity.address}</strong></div>
                      )}
                    </div>
                  )}

                  {virtualAccount ? (
                    <div className={`text-xs ${isDark ? "text-emerald-300" : "text-emerald-800"} border-t ${isDark ? "border-emerald-800" : "border-emerald-200"} pt-3`}>
                      <div className="mb-2">
                        <span className={isDark ? "text-slate-400" : "text-slate-500"}>Virtual Account: </span>
                        <strong className="font-mono">{virtualAccount.accountNumber}</strong>
                      </div>
                      <div><span className={isDark ? "text-slate-400" : "text-slate-500"}>Bank: </span><strong>{virtualAccount.bankName}</strong></div>
                    </div>
                  ) : (
                    <div className={`text-xs ${isDark ? "text-emerald-300" : "text-emerald-800"} border-t ${isDark ? "border-emerald-800" : "border-emerald-200"} pt-3`}>
                      Your virtual account will be created shortly.
                    </div>
                  )}
                </div>
                <button
                  onClick={() => { window.location.href = "/"; }}
                  className="w-full py-3.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md flex items-center justify-center gap-2 transition"
                >
                  <span>Go to Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {step <= 3 && (
              <div className="text-center pt-2">
                <span className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  Already have an account?{" "}
                  <a href="/login" className="font-semibold text-blue-600 hover:underline">Sign in</a>
                </span>
              </div>
            )}

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Encrypted SSL • Free Access for Approved Global Scholars</span>
            </div>
          </div>

        </div>
      </main>

      {/* FOOTER BAR */}
      <footer className={`border-t ${isDark ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white"} py-4 px-6 text-center text-xs text-slate-500`}>
        {config.name} • {config.tagline.split("—")[1]?.trim() || config.tagline}
      </footer>
    </div>
  );
}
