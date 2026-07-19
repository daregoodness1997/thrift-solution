"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { config } from "@thrift/config";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

function ResetPasswordForm() {
  const params = useSearchParams();
  const [email] = useState(params.get("email") || "");
  const [code, setCode] = useState(params.get("code") || "");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    symbol: /[^A-Za-z0-9]/.test(password),
  };
  const isStrong = Object.values(checks).every(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
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
      const res = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, newPassword: password }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Reset failed");
      } else {
        setDone(true);
        toast.success("Password reset successful");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex bg-brand-cream">
      <div
        className="hidden md:flex flex-col justify-center items-center p-12 relative overflow-hidden"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?auto=format&fit=crop&w=1200&q=80')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-[400px]">
          <div className="mb-10">
            <h2 className="text-[1.5rem] font-semibold text-brand-dark tracking-[-0.025em]">Set New Password</h2>
            <p className="text-[13px] text-gray-500 mt-1.5">
              {email ? `Resetting password for ${email}` : "Enter the code from your email if the link didn't work"}
            </p>
          </div>

          {done ? (
            <div className="p-5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-[13px] leading-[1.6]">
              <strong>All set!</strong> Your password has been updated.
              <div className="mt-4">
                <a href="/login" className="font-semibold no-underline" style={{ color: config.colors.primary }}>Continue to sign in</a>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && (
                <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-medium mb-6">
                  {error}
                </div>
              )}

              {!code && (
                <div className="mb-5">
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Reset Code</label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="6-digit code from email"
                    className="w-full py-[0.6875rem] px-[0.875rem] rounded-[0.625rem] border border-gray-200 text-[13px] text-brand-dark outline-none"
                  />
                </div>
              )}

              <div className="mb-5">
                <label className="block text-xs font-medium text-gray-700 mb-1.5">New Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  autoComplete="new-password"
                  className="w-full py-[0.6875rem] px-[0.875rem] rounded-[0.625rem] border border-gray-200 text-[13px] text-brand-dark outline-none"
                  onFocus={(e) => { e.currentTarget.style.borderColor = config.colors.primary; e.currentTarget.style.boxShadow = `0 0 0 3px ${config.colors.primary}15`; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "#E5E7EB"; e.currentTarget.style.boxShadow = "none"; }}
                />
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
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Confirm Password</label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Re-enter password"
                  autoComplete="new-password"
                  className="w-full py-[0.6875rem] px-[0.875rem] rounded-[0.625rem] border border-gray-200 text-[13px] text-brand-dark outline-none"
                  onFocus={(e) => { e.currentTarget.style.borderColor = config.colors.primary; e.currentTarget.style.boxShadow = `0 0 0 3px ${config.colors.primary}15`; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "#E5E7EB"; e.currentTarget.style.boxShadow = "none"; }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-[0.625rem] text-[13px] font-semibold text-white border-none transition"
                style={{
                  backgroundColor: config.colors.primary,
                  color: "#ffffff",
                  opacity: loading ? 0.6 : 1,
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                {loading ? "Resetting..." : "Reset password"}
              </button>

              <div className="text-center mt-8">
                <a href="/login" className="text-[13px] font-semibold no-underline" style={{ color: config.colors.primary }}>Back to sign in</a>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-400 text-[13px]">Loading…</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
