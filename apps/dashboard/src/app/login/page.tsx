"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import PhoneInput from "@/components/PhoneInput";
import { config } from "@thrift/config";
import {
  ArrowLeft,
  Sparkles,
  User,
  Lock,
  ArrowRight,
  ShieldCheck,
  Sun,
  Moon,
  Mail,
  Phone,
  Eye,
  EyeOff,
  GraduationCap,
  Award,
  Zap,
  Users,
  Shield,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

type ThemeMode = "light" | "dark";

export default function LoginPage() {
  const { login } = useAuth();
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
  const [loginMethod, setLoginMethod] = useState<"email" | "phone">("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
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

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name || !email || !password) {
      setError("Name, email, and password are required");
      return;
    }
    setLoading(true);
    toast.success("Redirecting to registration...");
    setTimeout(() => {
      window.location.href = `/register?name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}`;
    }, 600);
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
      <div
        className={`min-h-screen flex flex-col ${isDark ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"} transition-colors font-sans`}
      >
        <header
          className={`sticky top-0 z-40 ${isDark ? "bg-slate-900/90 border-slate-800" : "bg-white/90 border-slate-200"} backdrop-blur-xl border-b py-3.5 px-4 sm:px-8`}
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setTwoFactorRequired(false);
                  setChallengeToken("");
                  setTwoFactorCode("");
                  setEmailCodeSent(false);
                }}
                className={`p-2 rounded-xl ${isDark ? "bg-slate-800 text-slate-300 hover:text-white" : "bg-slate-100 text-slate-600 hover:text-slate-900"} transition-colors flex items-center gap-1.5 text-xs font-bold`}
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Sign In</span>
              </button>
              <div
                className={`h-4 w-px ${isDark ? "bg-slate-700" : "bg-slate-300"} hidden sm:block`}
              />
              <div className="flex items-center gap-2">
                <img
                  src={config.logo}
                  alt={config.name}
                  className="w-8 h-8 rounded-xl object-contain shadow-md"
                />
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
            <button
              onClick={toggleTheme}
              className={`p-2.5 rounded-xl ${isDark ? "text-slate-300 hover:bg-slate-800" : "text-slate-600 hover:bg-slate-100"} transition-colors border ${isDark ? "border-slate-800" : "border-slate-200"}`}
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
          <div
            className={`w-full max-w-md ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"} rounded-3xl p-6 sm:p-8 border shadow-2xl`}
          >
            <div className="mb-8">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${isDark ? "bg-blue-950/60" : "bg-blue-50"}`}
              >
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight">
                Two-Factor Authentication
              </h2>
              <p
                className={`text-sm ${isDark ? "text-slate-300" : "text-slate-600"} mt-1.5`}
              >
                Enter the verification code to continue
              </p>
            </div>

            {availableMethods.length > 1 && (
              <div
                className={`flex gap-2 mb-6 p-1.5 rounded-2xl ${isDark ? "bg-slate-800/60" : "bg-slate-100"}`}
              >
                <button
                  onClick={() => handleMethodSwitch("totp")}
                  className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${
                    selectedMethod === "totp"
                      ? `${isDark ? "bg-slate-900 text-blue-400" : "bg-white text-blue-600"} shadow-sm`
                      : `${isDark ? "text-slate-500 hover:text-white" : "text-slate-500 hover:text-slate-900"}`
                  }`}
                >
                  Authenticator App
                </button>
                <button
                  onClick={() => handleMethodSwitch("email")}
                  className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${
                    selectedMethod === "email"
                      ? `${isDark ? "bg-slate-900 text-blue-400" : "bg-white text-blue-600"} shadow-sm`
                      : `${isDark ? "text-slate-500 hover:text-white" : "text-slate-500 hover:text-slate-900"}`
                  }`}
                >
                  Email Code
                </button>
              </div>
            )}

            <form onSubmit={handleVerifyTwoFactor}>
              <div className="mb-6">
                <label
                  className={`block text-xs font-bold ${isDark ? "text-slate-300" : "text-slate-700"} mb-1.5`}
                >
                  {selectedMethod === "totp"
                    ? "Authenticator App Code"
                    : "Email Verification Code"}
                </label>
                <div className="relative">
                  <Shield
                    className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? "text-slate-400" : "text-slate-400"}`}
                  />
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
                    className={`w-full py-2.5 pl-10 pr-4 rounded-xl border ${isDark ? "border-slate-700 bg-slate-800 text-white" : "border-slate-300 bg-slate-50 text-slate-900"} text-xs font-semibold font-mono tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    autoFocus
                  />
                </div>
                {selectedMethod === "email" && (
                  <p
                    className={`text-[11px] ${isDark ? "text-slate-400" : "text-slate-500"} mt-2`}
                  >
                    Code sent to {loginIdentifier}
                    <button
                      type="button"
                      onClick={() => sendEmailCode()}
                      className="ml-1 font-semibold text-blue-600 hover:underline"
                    >
                      Resend
                    </button>
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={twoFactorLoading}
                className="w-full py-3.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md flex items-center justify-center gap-2 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {twoFactorLoading ? (
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
                    Verifying...
                  </>
                ) : (
                  <>
                    <span>Verify</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 pt-4 border-t border-slate-100 dark:border-slate-800">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Encrypted SSL • Secure Authentication</span>
            </div>
          </div>
        </main>

        <footer
          className={`border-t ${isDark ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white"} py-4 px-6 text-center text-xs text-slate-500`}
        >
          {config.name} •{" "}
          {config.tagline.split("—")[1]?.trim() || config.tagline}
        </footer>
      </div>
    );
  }

  // Normal login form
  return (
    <div
      className={`min-h-screen ${isDark ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"} transition-colors selection:bg-blue-500 selection:text-white font-sans flex flex-col`}
    >
      {/* HEADER NAVBAR */}
      <header
        className={`sticky top-0 z-40 ${isDark ? "bg-slate-900/90 border-slate-800" : "bg-white/90 border-slate-200"} backdrop-blur-xl border-b py-3.5 px-4 sm:px-8`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a
              href="/"
              className={`p-2 rounded-xl ${isDark ? "bg-slate-800 text-slate-300 hover:text-white" : "bg-slate-100 text-slate-600 hover:text-slate-900"} transition-colors flex items-center gap-1.5 text-xs font-bold`}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Home</span>
            </a>

            <div
              className={`h-4 w-px ${isDark ? "bg-slate-700" : "bg-slate-300"} hidden sm:block`}
            />

            {/* Brand Logo */}
            <div className="flex items-center gap-2">
              <img
                src={config.logo}
                alt={config.name}
                className="w-8 h-8 rounded-xl object-contain shadow-md"
              />
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
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT PAGE */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex items-center justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center w-full my-auto">
          {/* LEFT COLUMN: HERO INFORMATION & FELLOWSHIP HIGHLIGHTS (6 COLS) */}
          <div className="lg:col-span-6 space-y-6">
            <div
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full ${isDark ? "bg-blue-950/80 border-blue-800 text-blue-300" : "bg-blue-100 border-blue-200 text-blue-700"} border text-xs font-mono font-bold uppercase tracking-wider`}
            >
              <GraduationCap className="w-4 h-4 text-blue-600" />
              <span>EQUIGLOBAL LEARNER GATEWAY</span>
            </div>

            <h1 className="font-bold text-3xl sm:text-5xl tracking-tight leading-tight">
              Sign In to Your Scholar Workspace
            </h1>

            <p
              className={`text-sm sm:text-base ${isDark ? "text-slate-300" : "text-slate-600"} leading-relaxed`}
            >
              Access your active learning modules, micro-grant stipends,
              hardware equipment loans, global mentors, and project capstone
              submissions.
            </p>

            <div className="space-y-3 pt-2">
              <div
                className={`flex items-center gap-3 p-3 rounded-2xl ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"} border shadow-sm`}
              >
                <div
                  className={`w-10 h-10 rounded-xl ${isDark ? "bg-blue-950/60 text-blue-400" : "bg-blue-50 text-blue-600"} flex items-center justify-center shrink-0`}
                >
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold">
                    Scholar Stipends & Micro-Grants
                  </div>
                  <div
                    className={`text-[11px] ${isDark ? "text-slate-400" : "text-slate-500"}`}
                  >
                    Track and withdraw grant disbursements directly to M-Pesa or
                    direct bank.
                  </div>
                </div>
              </div>

              <div
                className={`flex items-center gap-3 p-3 rounded-2xl ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"} border shadow-sm`}
              >
                <div
                  className={`w-10 h-10 rounded-xl ${isDark ? "bg-teal-950/60 text-teal-400" : "bg-teal-50 text-teal-600"} flex items-center justify-center shrink-0`}
                >
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold">Equipment Micro-Loans</div>
                  <div
                    className={`text-[11px] ${isDark ? "text-slate-400" : "text-slate-500"}`}
                  >
                    Manage 0% interest laptop and solar hardware loans with
                    flexible schedules.
                  </div>
                </div>
              </div>

              <div
                className={`flex items-center gap-3 p-3 rounded-2xl ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"} border shadow-sm`}
              >
                <div
                  className={`w-10 h-10 rounded-xl ${isDark ? "bg-indigo-950/60 text-indigo-400" : "bg-indigo-50 text-indigo-600"} flex items-center justify-center shrink-0`}
                >
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold">
                    Global Cohort Collaboration
                  </div>
                  <div
                    className={`text-[11px] ${isDark ? "text-slate-400" : "text-slate-500"}`}
                  >
                    Connect with peer scholars and mentors across 32 countries.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: AUTHENTICATION FORM CARD (6 COLS) */}
          <div
            className={`lg:col-span-6 ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"} rounded-3xl p-6 sm:p-8 border shadow-2xl space-y-6`}
          >
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div
                  className={`w-full border-t ${isDark ? "border-slate-800" : "border-slate-200"}`}
                />
              </div>
              <span
                className={`relative px-3 ${isDark ? "bg-slate-900" : "bg-white"} text-[11px] font-semibold uppercase tracking-wider ${isDark ? "text-slate-400" : "text-slate-400"}`}
              >
                {activeTab === "login"
                  ? "Or Sign In With"
                  : "Or Fill Application"}
              </span>
            </div>

            {/* Main Form */}
            <form
              onSubmit={activeTab === "login" ? handleSubmit : handleSignup}
              className="space-y-4"
            >
              {error && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-medium">
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

              {activeTab === "signup" && (
                <div>
                  <label
                    className={`block text-xs font-bold ${isDark ? "text-slate-300" : "text-slate-700"} mb-1`}
                  >
                    Full Name
                  </label>
                  <div className="relative">
                    <User
                      className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? "text-slate-400" : "text-slate-400"}`}
                    />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Amina Diallo"
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl border ${isDark ? "border-slate-700 bg-slate-800 text-white" : "border-slate-300 bg-slate-50 text-slate-900"} text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                  </div>
                </div>
              )}

              {activeTab === "login" && (
                <div
                  className={`flex border-b ${isDark ? "border-slate-800 bg-slate-800/60" : "border-slate-200 bg-slate-100"} p-1.5 rounded-2xl mb-4`}
                >
                  <button
                    type="button"
                    onClick={() => setLoginMethod("email")}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                      loginMethod === "email"
                        ? `${isDark ? "bg-slate-900 text-blue-400" : "bg-white text-blue-600"} shadow-sm`
                        : `${isDark ? "text-slate-500 hover:text-white" : "text-slate-500 hover:text-slate-900"}`
                    }`}
                  >
                    <Mail className="w-3.5 h-3.5" />
                    Email
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoginMethod("phone")}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                      loginMethod === "phone"
                        ? `${isDark ? "bg-slate-900 text-blue-400" : "bg-white text-blue-600"} shadow-sm`
                        : `${isDark ? "text-slate-500 hover:text-white" : "text-slate-500 hover:text-slate-900"}`
                    }`}
                  >
                    <Phone className="w-3.5 h-3.5" />
                    Phone
                  </button>
                </div>
              )}

              {activeTab === "login" && loginMethod === "email" && (
                <div>
                  <label
                    className={`block text-xs font-bold ${isDark ? "text-slate-300" : "text-slate-700"} mb-1`}
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail
                      className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? "text-slate-400" : "text-slate-400"}`}
                    />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="scholar@equiglobal.org"
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl border ${isDark ? "border-slate-700 bg-slate-800 text-white" : "border-slate-300 bg-slate-50 text-slate-900"} text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                  </div>
                </div>
              )}

              {activeTab === "login" && loginMethod === "phone" && (
                <PhoneInput
                  value={phone}
                  onChange={setPhone}
                  label="Phone Number"
                  placeholder="Enter phone number"
                />
              )}

              {activeTab === "signup" && (
                <div>
                  <label
                    className={`block text-xs font-bold ${isDark ? "text-slate-300" : "text-slate-700"} mb-1`}
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail
                      className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? "text-slate-400" : "text-slate-400"}`}
                    />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="scholar@equiglobal.org"
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl border ${isDark ? "border-slate-700 bg-slate-800 text-white" : "border-slate-300 bg-slate-50 text-slate-900"} text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                  </div>
                </div>
              )}

              <div>
                <label
                  className={`block text-xs font-bold ${isDark ? "text-slate-300" : "text-slate-700"} mb-1`}
                >
                  Password
                </label>
                <div className="relative">
                  <Lock
                    className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? "text-slate-400" : "text-slate-400"}`}
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`w-full pl-10 pr-10 py-2.5 rounded-xl border ${isDark ? "border-slate-700 bg-slate-800 text-white" : "border-slate-300 bg-slate-50 text-slate-900"} text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 ${isDark ? "text-slate-400" : "text-slate-400"} hover:text-slate-600`}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {activeTab === "login" && (
                <div className="flex justify-end">
                  <a href="/forgot-password" className="text-[11px] font-semibold text-blue-600 hover:underline">
                    Forgot password?
                  </a>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md flex items-center justify-center gap-2 rounded-xl transition disabled:opacity-60 disabled:cursor-not-allowed"
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
                    <span>Loading Portal...</span>
                  </>
                ) : (
                  <>
                    <span>
                      {activeTab === "login"
                        ? "Log In to Portal"
                        : "Submit Fellowship Application"}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>
                Encrypted SSL • Free Access for Approved Global Scholars
              </span>
            </div>

            <div className="text-center pt-2">
              <span className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                Don&apos;t have an account?{" "}
                <a href="/register" className="font-semibold text-blue-600 hover:underline">Create account</a>
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* FOOTER BAR */}
      <footer
        className={`border-t ${isDark ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white"} py-4 px-6 text-center text-xs text-slate-500`}
      >
        {config.name} • {config.tagline.split("—")[1]?.trim() || config.tagline}
      </footer>
    </div>
  );
}
