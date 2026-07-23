"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import PhoneInput from "@/components/PhoneInput";
import { config } from "@thrift/config";
import {
  ArrowLeft,
  Lock,
  ArrowRight,
  ShieldCheck,
  Mail,
  Phone,
  Eye,
  EyeOff,
  GraduationCap,
  Shield,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

type ThemeMode = "light" | "dark";

export default function LoginPage() {
  const { login } = useAuth();
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [loginMethod, setLoginMethod] = useState<"email" | "phone">("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // 2FA state
  const [twoFactorRequired, setTwoFactorRequired] = useState(false);
  const [challengeToken, setChallengeToken] = useState("");
  const [availableMethods, setAvailableMethods] = useState<string[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<"totp" | "email">(
    "totp",
  );
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);
  const [emailCodeSent, setEmailCodeSent] = useState(false);
  const [loginIdentifier, setLoginIdentifier] = useState("");

  const toggleTheme = () => setTheme((t) => (t === "light" ? "dark" : "light"));

  const handleDemoLogin = (profile: "amina" | "carlos") => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success(
        `Logged in as ${profile === "amina" ? "Amina Diallo" : "Carlos Ruiz"}`,
      );
      window.location.href = "/";
    }, 600);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const identifier = loginMethod === "email" ? email : phone;
    if (!identifier || !password) {
      setError(
        `${loginMethod === "email" ? "Email" : "Phone number"} and password are required`,
      );
      return;
    }

    setLoading(true);
    const result = await login(
      loginMethod === "email" ? { email } : { phone },
      password,
    );
    setLoading(false);

    if (result.error) {
      toast.error(result.error);
    } else if (result.data?.twoFactorRequired) {
      setChallengeToken(result.data.challengeToken);
      setAvailableMethods(result.data.availableMethods || []);
      setLoginIdentifier(loginMethod === "email" ? email : phone);
      if (
        result.data.availableMethods?.includes("email") &&
        !result.data.availableMethods?.includes("totp")
      ) {
        setSelectedMethod("email");
        sendEmailCode(result.data.challengeToken);
      } else {
        setSelectedMethod("totp");
      }
      setTwoFactorRequired(true);
    } else if (result.data?.needsVerification) {
      toast.success("A new verification code has been sent to your email");
      window.location.href = `/register?mode=verify&userId=${encodeURIComponent(result.data.userId)}&email=${encodeURIComponent(result.data.email)}`;
    } else if (result.data?.needsPayment) {
      toast.success("Please complete your registration fee payment");
      window.location.href = `/register?mode=pay&userId=${encodeURIComponent(result.data.userId)}&email=${encodeURIComponent(result.data.email)}&token=${encodeURIComponent(result.data.token)}`;
    } else {
      toast.success("Welcome back!");
      window.location.href = "/";
    }
  };

  const sendEmailCode = async (token?: string) => {
    try {
      const res = await fetch(`${API_URL}/api/auth/send-email-2fa-code`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token || challengeToken}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setEmailCodeSent(true);
        toast.success("Verification code sent to your email");
      }
    } catch {}
  };

  const handleVerifyTwoFactor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!twoFactorCode || twoFactorCode.length !== 6) {
      toast.error("Enter a 6-digit code");
      return;
    }
    setTwoFactorLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/2fa/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeToken,
          code: twoFactorCode,
          method: selectedMethod,
        }),
      });
      const data = await res.json();
      if (data.success && data.data?.token) {
        localStorage.setItem("token", data.data.token);
        if (data.data.refreshToken) {
          localStorage.setItem("refreshToken", data.data.refreshToken);
        }
        toast.success("Welcome back!");
        window.location.href = "/";
      } else {
        toast.error(data.error || "Invalid code");
      }
    } catch {
      toast.error("Network error");
    }
    setTwoFactorLoading(false);
  };

  const handleMethodSwitch = async (method: "totp" | "email") => {
    setSelectedMethod(method);
    setTwoFactorCode("");
    if (method === "email" && !emailCodeSent) {
      await sendEmailCode();
    }
  };

  const isDark = theme === "dark";

  // 2FA verification screen
  if (twoFactorRequired) {
    return (
      <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950">
        {/* Left: Hero Panel */}
        <div className="hidden lg:flex w-1/2 flex-col justify-between p-12 bg-mesh relative overflow-hidden">
          <div className="absolute -right-32 -top-24 h-80 w-80 rounded-full bg-[var(--color-brand-primary)]/8 blur-3xl" />
          <div className="absolute -left-32 bottom-0 h-60 w-60 rounded-full bg-[var(--color-brand-accent)]/8 blur-3xl" />

          <div className="relative z-10">
            <button
              onClick={() => {
                setTwoFactorRequired(false);
                setChallengeToken("");
                setTwoFactorCode("");
                setEmailCodeSent(false);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors border border-slate-200/60 dark:border-slate-700/60"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Sign In
            </button>
          </div>

          <div className="relative z-10 max-w-md">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-6">
              <Shield className="w-3.5 h-3.5" />
              Two-Factor Authentication
            </div>
            <h1 className="font-heading font-bold text-4xl sm:text-5xl text-slate-900 dark:text-white tracking-tight leading-tight mb-4">
              Extra{" "}
              <span className="bg-gradient-to-r from-blue-600 to-emerald-500 bg-clip-text text-transparent">
                security
              </span>{" "}
              layer
            </h1>
            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 leading-relaxed">
              Enter the verification code from your authenticator app or email to complete sign in.
            </p>
          </div>

          <div className="relative z-10 flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Encrypted SSL &middot; Secure Authentication</span>
          </div>
        </div>

        {/* Right: Form */}
        <div className="flex-1 flex items-center justify-center p-6 sm:p-8">
          <div className="w-full max-w-[420px]">
            {/* Mobile back link */}
            <div className="lg:hidden mb-8">
              <button
                onClick={() => {
                  setTwoFactorRequired(false);
                  setChallengeToken("");
                  setTwoFactorCode("");
                  setEmailCodeSent(false);
                }}
                className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Sign In
              </button>
            </div>

            <div className="mb-8">
              <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
              <h2 className="font-heading text-[1.5rem] font-bold text-slate-900 dark:text-white tracking-tight">
                Two-Factor Authentication
              </h2>
              <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1.5">
                Enter the verification code to continue
              </p>
            </div>

            {availableMethods.length > 1 && (
              <div className="flex gap-2 mb-6 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/60">
                <button
                  onClick={() => handleMethodSwitch("totp")}
                  className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${
                    selectedMethod === "totp"
                      ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  Authenticator App
                </button>
                <button
                  onClick={() => handleMethodSwitch("email")}
                  className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${
                    selectedMethod === "email"
                      ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  Email Code
                </button>
              </div>
            )}

            <form onSubmit={handleVerifyTwoFactor}>
              <div className="mb-6">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                  {selectedMethod === "totp"
                    ? "Authenticator App Code"
                    : "Email Verification Code"}
                </label>
                <div className="relative">
                  <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={twoFactorCode}
                    onChange={(e) =>
                      setTwoFactorCode(
                        e.target.value.replace(/\D/g, "").slice(0, 6),
                      )
                    }
                    placeholder="Enter 6-digit code"
                    autoComplete="one-time-code"
                    className="w-full py-3 pl-10 pr-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[13px] text-slate-900 dark:text-white font-mono tracking-widest text-center outline-none focus:border-[var(--color-brand-primary)] focus:ring-2 focus:ring-[var(--color-brand-primary)]/20 transition"
                    autoFocus
                  />
                </div>
                {selectedMethod === "email" && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                    Code sent to {loginIdentifier}
                    <button
                      type="button"
                      onClick={() => sendEmailCode()}
                      className="ml-1 font-semibold text-blue-600 hover:underline dark:text-blue-400"
                    >
                      Resend
                    </button>
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={twoFactorLoading}
                className="w-full py-3.5 rounded-xl text-[13px] font-semibold text-white bg-blue-600 hover:bg-blue-700 border-none transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {twoFactorLoading ? (
                  "Verifying..."
                ) : (
                  <>
                    <span>Verify</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500 mt-8 pt-5 border-t border-slate-100 dark:border-slate-800">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Encrypted SSL &middot; Secure Authentication</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Normal login form
  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 selection:bg-blue-500 selection:text-white font-sans">
      {/* Left: Hero Panel */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between p-12 bg-mesh relative overflow-hidden">
        <div className="absolute -right-32 -top-24 h-80 w-80 rounded-full bg-[var(--color-brand-primary)]/8 blur-3xl" />
        <div className="absolute -left-32 bottom-0 h-60 w-60 rounded-full bg-[var(--color-brand-accent)]/8 blur-3xl" />

        <div className="relative z-10">
          <a
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors border border-slate-200/60 dark:border-slate-700/60"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </a>
        </div>

        <div className="relative z-10 max-w-md">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-6">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>GLOBAL FREEDOM WORLDWIDE</span>
          </div>
          <h1 className="font-heading font-bold text-4xl sm:text-5xl text-slate-900 dark:text-white tracking-tight leading-tight mb-4">
            Sign In to Your{" "}
            <span className="bg-gradient-to-r from-blue-600 to-emerald-500 bg-clip-text text-transparent">
              Scholar Workspace
            </span>
          </h1>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 leading-relaxed">
            Access your active learning modules, micro-grant stipends,
            hardware equipment loans, global mentors, and project capstone
            submissions.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Encrypted SSL &middot; Free Access for Approved Global Scholars</span>
        </div>
      </div>

      {/* Right: Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8">
        <div className="w-full max-w-[420px]">
          {/* Mobile back link */}
          <div className="lg:hidden mb-8">
            <a
              href="/"
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </a>
          </div>

          <div className="mb-8">
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center mb-4">
              <Lock className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="font-heading text-[1.5rem] font-bold text-slate-900 dark:text-white tracking-tight">
              Welcome Back
            </h2>
            <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1.5">
              Sign in to access your Scholar workspace
            </p>
          </div>

          {/* Main Form */}
          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            {error && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-xs font-medium">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {error}
              </div>
            )}

            <div className="flex gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/60">
              <button
                type="button"
                onClick={() => setLoginMethod("email")}
                className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  loginMethod === "email"
                    ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                Email
              </button>
              <button
                type="button"
                onClick={() => setLoginMethod("phone")}
                className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  loginMethod === "phone"
                    ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Phone className="w-3.5 h-3.5" />
                Phone
              </button>
            </div>

            {loginMethod === "email" && (
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="scholar@globalfreedomworldwide.com"
                    className="w-full py-3 pl-10 pr-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[13px] text-slate-900 dark:text-white outline-none focus:border-[var(--color-brand-primary)] focus:ring-2 focus:ring-[var(--color-brand-primary)]/20 transition"
                  />
                </div>
              </div>
            )}

            {loginMethod === "phone" && (
              <PhoneInput
                value={phone}
                onChange={setPhone}
                label="Phone Number"
                placeholder="Enter phone number"
              />
            )}

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Password
                </label>
                <a
                  href="/forgot-password"
                  className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                >
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="w-full py-3 pl-10 pr-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[13px] text-slate-900 dark:text-white outline-none focus:border-[var(--color-brand-primary)] focus:ring-2 focus:ring-[var(--color-brand-primary)]/20 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl text-[13px] font-semibold text-white bg-blue-600 hover:bg-blue-700 border-none transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path d="M21 12a9 9 0 11-6.219-8.56" />
                  </svg>
                  Signing In...
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500 mt-8 pt-5 border-t border-slate-100 dark:border-slate-800">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Encrypted SSL &middot; Secure Authentication</span>
          </div>

          <div className="text-center pt-2">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Don&apos;t have an account?{" "}
              <a
                href="/register"
                className="font-semibold text-blue-600 hover:underline dark:text-blue-400"
              >
                Create account
              </a>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
