"use client";

import { useState } from "react";
import { toast } from "sonner";
import { config } from "@thrift/config";

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
    <div className="min-h-screen flex bg-brand-cream">
      <div
        className="hidden md:flex w-1/2 flex-col justify-center items-center p-12 relative overflow-hidden"
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
            <h2 className="text-[1.5rem] font-semibold text-brand-dark tracking-[-0.025em]">Reset Password</h2>
            <p className="text-[13px] text-gray-500 mt-1.5">Enter your account email to receive a reset link</p>
          </div>

          {sent ? (
            <div className="p-5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-[13px] leading-[1.6]">
              <strong>Check your inbox.</strong> We&apos;ve sent a reset link and a backup code to <strong>{email}</strong>.
              The link opens a form that&apos;s already filled in for you.
              <div className="mt-4">
                <a href="/login" className="font-semibold no-underline" style={{ color: config.colors.primary }}>Back to sign in</a>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && (
                <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-medium mb-6">
                  {error}
                </div>
              )}

              <div className="mb-6">
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
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
                {loading ? "Sending..." : "Send reset link"}
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
