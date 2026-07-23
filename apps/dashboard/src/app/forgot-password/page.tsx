"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Mail, KeyRound, ArrowRight, ShieldCheck, CheckCircle } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email) {
      setError("Email is required");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Request failed");
      } else {
        setSent(true);
        toast.success("Reset link sent to your email");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    }
    setLoading(false);
  };

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
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-6">
            <KeyRound className="w-3.5 h-3.5" />
            Account Recovery
          </div>
          <h1 className="font-heading font-bold text-4xl sm:text-5xl text-slate-900 dark:text-white tracking-tight leading-tight mb-4">
            Reset your{" "}
            <span className="bg-gradient-to-r from-blue-600 to-emerald-500 bg-clip-text text-transparent">
              password
            </span>
          </h1>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 leading-relaxed">
            Enter the email address associated with your account and we&apos;ll send you a secure link to reset your password.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Encrypted SSL &middot; Secure Account Recovery</span>
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
              Reset Password
            </h2>
            <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1.5">
              Enter your account email to receive a reset link
            </p>
          </div>

          {sent ? (
            <div className="p-6 rounded-3xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400">
                <CheckCircle className="h-6 w-6" />
              </div>
              <h3 className="text-center font-heading font-bold text-lg text-emerald-800 dark:text-emerald-200">
                Check your inbox
              </h3>
              <p className="mt-2 text-center text-[13px] text-emerald-700 dark:text-emerald-300 leading-relaxed">
                We&apos;ve sent a reset link and a backup code to{" "}
                <strong>{email}</strong>.
                The link opens a form that&apos;s already filled in for you.
              </p>
              <div className="mt-5 text-center">
                <a href="/login" className="text-[13px] font-semibold no-underline text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                  Back to sign in
                </a>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && (
                <div className="mb-5 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs font-medium">
                  {error}
                </div>
              )}

              <div className="mb-6">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
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
                  "Sending..."
                ) : (
                  <>
                    Send reset link
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center mt-8">
                <a href="/login" className="text-[13px] font-semibold no-underline text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                  Back to sign in
                </a>
              </div>
            </form>
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
