"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  Mail,
  User,
  Lock,
  ArrowRight,
  CheckCircle,
  Eye,
  EyeOff,
  AlertTriangle,
  ShieldCheck,
  Wallet,
  Shield,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

function AcceptInviteForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") || "";

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [invitationInfo, setInvitationInfo] = useState<{
    email: string;
    role: string;
    name: string | null;
    inviterName: string | null;
    registrationFeePaid: boolean;
    adminInitiated: boolean;
  } | null>(null);
  const [done, setDone] = useState(false);
  const [kycResult, setKycResult] = useState<{ status: string; creditScore?: number } | null>(null);
  const [virtualAccount, setVirtualAccount] = useState<{ accountNumber: string; bankName: string } | null>(null);

  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    symbol: /[^A-Za-z0-9]/.test(password),
  };
  const isStrong = Object.values(checks).every(Boolean);

  useEffect(() => {
    if (!token) {
      setValidating(false);
      setError("No invitation token found. Please use the link from your email.");
      return;
    }

    const validateToken = async () => {
      try {
        const res = await fetch(`${API_URL}/api/invitations/${token}`);
        const data = await res.json();
        if (data.success) {
          setInvitationInfo(data.data);
          if (data.data.name) {
            setName(data.data.name);
          }
        } else {
          setError(data.error || "Invalid invitation");
        }
      } catch {
        setError("Failed to validate invitation. Please try again.");
      }
      setValidating(false);
    };

    validateToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
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
      const res = await fetch(`${API_URL}/api/invitations/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, name: name.trim(), password }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Failed to accept invitation");
      } else {
        localStorage.setItem("token", data.data.token);
        localStorage.setItem("refreshToken", data.data.refreshToken);
        if (data.data.kyc) setKycResult(data.data.kyc);
        if (data.data.virtualAccount) setVirtualAccount(data.data.virtualAccount);
        setDone(true);
        toast.success("Account created successfully!");
        setTimeout(() => router.push("/"), 2000);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    }
    setLoading(false);
  };

  if (validating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-[13px] text-slate-500 dark:text-slate-400">Validating invitation...</p>
        </div>
      </div>
    );
  }

  if (error && !invitationInfo) {
    return (
      <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950">
        <div className="hidden lg:flex w-1/2 flex-col justify-between p-12 bg-mesh relative overflow-hidden">
          <div className="absolute -right-32 -top-24 h-80 w-80 rounded-full bg-[var(--color-brand-primary)]/8 blur-3xl" />
          <div className="absolute -left-32 bottom-0 h-60 w-60 rounded-full bg-[var(--color-brand-accent)]/8 blur-3xl" />
          <div className="relative z-10">
            <a href="/login" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors border border-slate-200/60 dark:border-slate-700/60">
              <ArrowLeft className="w-4 h-4" />
              Back to Sign In
            </a>
          </div>
          <div className="relative z-10 max-w-md">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 text-xs font-semibold uppercase tracking-wider mb-6">
              <AlertTriangle className="w-3.5 h-3.5" />
              Invalid Invitation
            </div>
            <h1 className="font-heading font-bold text-4xl sm:text-5xl text-slate-900 dark:text-white tracking-tight leading-tight mb-4">
              Invitation{" "}
              <span className="bg-gradient-to-r from-red-600 to-orange-500 bg-clip-text text-transparent">
                unavailable
              </span>
            </h1>
            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 leading-relaxed">
              This invitation link is invalid, expired, or has already been used. Please contact the person who invited you for a new link.
            </p>
          </div>
          <div className="relative z-10 flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Encrypted SSL &middot; Secure Invitation</span>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-6 sm:p-8">
          <div className="w-full max-w-[420px]">
            <div className="lg:hidden mb-8">
              <a href="/login" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                <ArrowLeft className="w-4 h-4" />
                Back to Sign In
              </a>
            </div>
            <div className="p-6 rounded-3xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/40">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/60 text-red-600 dark:text-red-400">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h3 className="text-center font-heading font-bold text-lg text-red-800 dark:text-red-200">
                Invalid Invitation
              </h3>
              <p className="mt-2 text-center text-[13px] text-red-700 dark:text-red-300 leading-relaxed">
                {error}
              </p>
              <div className="mt-5 text-center">
                <a href="/login" className="text-[13px] font-semibold no-underline text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                  Go to sign in
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950">
      {/* Left: Hero Panel */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between p-12 bg-mesh relative overflow-hidden">
        <div className="absolute -right-32 -top-24 h-80 w-80 rounded-full bg-[var(--color-brand-primary)]/8 blur-3xl" />
        <div className="absolute -left-32 bottom-0 h-60 w-60 rounded-full bg-[var(--color-brand-accent)]/8 blur-3xl" />

        <div className="relative z-10">
          <a href="/login" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors border border-slate-200/60 dark:border-slate-700/60">
            <ArrowLeft className="w-4 h-4" />
            Back to Sign In
          </a>
        </div>

        <div className="relative z-10 max-w-md">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-semibold uppercase tracking-wider mb-6">
            <Mail className="w-3.5 h-3.5" />
            You&apos;re Invited
          </div>
          <h1 className="font-heading font-bold text-4xl sm:text-5xl text-slate-900 dark:text-white tracking-tight leading-tight mb-4">
            Join{" "}
            <span className="bg-gradient-to-r from-blue-600 to-emerald-500 bg-clip-text text-transparent">
              Global Freedom Worldwide
            </span>
          </h1>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 leading-relaxed">
            {invitationInfo?.inviterName
              ? `${invitationInfo.inviterName} has invited you to join our community savings platform.`
              : "You've been invited to join our community savings platform."}
            {" "}Set up your account to get started.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Encrypted SSL &middot; Secure Invitation</span>
        </div>
      </div>

      {/* Right: Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8">
        <div className="w-full max-w-[420px]">
          {/* Mobile back link */}
          <div className="lg:hidden mb-8">
            <a href="/login" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back to Sign In
            </a>
          </div>

          <div className="mb-8">
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center mb-4">
              <Mail className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="font-heading text-[1.5rem] font-bold text-slate-900 dark:text-white tracking-tight">
              Accept Invitation
            </h2>
            <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1.5">
              {invitationInfo ? `Setting up account for ${invitationInfo.email}` : "Set up your account to get started"}
            </p>
            {invitationInfo && (
              <span className="inline-block mt-2 rounded-md bg-blue-600/10 px-2 py-0.5 font-mono text-[9px] font-bold uppercase text-blue-600 dark:bg-blue-500/15 dark:text-blue-400">
                Role: {invitationInfo.role}
              </span>
            )}
          </div>

          {done ? (
            <div className="p-6 rounded-3xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400">
                <CheckCircle className="h-6 w-6" />
              </div>
              <h3 className="text-center font-heading font-bold text-lg text-emerald-800 dark:text-emerald-200">
                Welcome aboard!
              </h3>
              <p className="mt-2 text-center text-[13px] text-emerald-700 dark:text-emerald-300 leading-relaxed">
                Your account has been created successfully. Redirecting you to your dashboard...
              </p>

              {kycResult && (
                <div className="mt-4 p-3 rounded-xl bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-700">
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-[12px] font-semibold text-slate-900 dark:text-white">KYC Verified</span>
                  </div>
                  {kycResult.creditScore && (
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      Credit Score: <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{kycResult.creditScore}</span>
                    </p>
                  )}
                </div>
              )}

              {virtualAccount && (
                <div className="mt-3 p-3 rounded-xl bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-700">
                  <div className="flex items-center gap-2 mb-2">
                    <Wallet className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-[12px] font-semibold text-slate-900 dark:text-white">Virtual Account Created</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    {virtualAccount.bankName}: <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{virtualAccount.accountNumber}</span>
                  </p>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && (
                <div className="mb-5 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs font-medium">
                  {error}
                </div>
              )}

              <div className="mb-5">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    autoComplete="name"
                    className="w-full py-3 pl-10 pr-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[13px] text-slate-900 dark:text-white outline-none focus:border-[var(--color-brand-primary)] focus:ring-2 focus:ring-[var(--color-brand-primary)]/20 transition placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                </div>
              </div>

              <div className="mb-5">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    autoComplete="new-password"
                    className="w-full py-3 pl-10 pr-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[13px] text-slate-900 dark:text-white outline-none focus:border-[var(--color-brand-primary)] focus:ring-2 focus:ring-[var(--color-brand-primary)]/20 transition placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="-my-2 mb-6 grid grid-cols-2 gap-x-4 gap-y-1.5">
                {[
                  { ok: checks.length, label: "At least 8 characters" },
                  { ok: checks.uppercase, label: "One uppercase letter" },
                  { ok: checks.lowercase, label: "One lowercase letter" },
                  { ok: checks.number, label: "One number" },
                  { ok: checks.symbol, label: "One special character" },
                ].map((c) => (
                  <div key={c.label} className="flex items-center gap-1.5 text-xs" style={{ color: c.ok ? "#047857" : "#9CA3AF" }}>
                    <span
                      className="w-4 h-4 rounded-full flex-none flex items-center justify-center text-[10px] font-bold text-white"
                      style={{ backgroundColor: c.ok ? "#10B981" : "#E5E7EB" }}
                    >{c.ok ? "✓" : ""}</span>
                    {c.label}
                  </div>
                ))}
              </div>

              <div className="mb-6">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Re-enter password"
                    autoComplete="new-password"
                    className="w-full py-3 pl-10 pr-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[13px] text-slate-900 dark:text-white outline-none focus:border-[var(--color-brand-primary)] focus:ring-2 focus:ring-[var(--color-brand-primary)]/20 transition placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl text-[13px] font-semibold text-white bg-blue-600 hover:bg-blue-700 border-none transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  "Creating account..."
                ) : (
                  <>
                    Create Account
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center mt-8">
                <a href="/login" className="text-[13px] font-semibold no-underline text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                  Already have an account? Sign in
                </a>
              </div>
            </form>
          )}

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500 mt-8 pt-5 border-t border-slate-100 dark:border-slate-800">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Encrypted SSL &middot; Secure Invitation</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-400 text-[13px]">Loading...</div>}>
      <AcceptInviteForm />
    </Suspense>
  );
}
