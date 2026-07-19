"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { config } from "@thrift/config";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Email and password are required");
      return;
    }
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Welcome back!");
      window.location.href = "/";
    }
  };

  return (
    <div className="min-h-screen flex bg-brand-cream">
      {/* Left Panel — Brand */}
      <div
        className="hidden md:flex flex-col justify-center items-center p-12 relative overflow-hidden"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?auto=format&fit=crop&w=1200&q=80')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Decorative circles */}
        <div className="absolute -top-[10%] -right-[10%] w-[300px] h-[300px] rounded-full border border-[rgba(255,255,255,0.06)]" />
        <div className="absolute -bottom-[15%] -left-[10%] w-[400px] h-[400px] rounded-full border border-[rgba(255,255,255,0.04)]" />
        <div className="absolute top-[20%] left-[10%] w-[150px] h-[150px] rounded-full bg-white/[0.03]" />
      </div>

      {/* Right Panel — Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-[400px]">
          <div className="mb-10">
            <h2 className="text-[1.5rem] font-semibold text-brand-dark tracking-[-0.025em]">Sign In</h2>
            <p className="text-[13px] text-gray-500 mt-1.5">Enter your credentials to access your account</p>
          </div>

          <form onSubmit={handleSubmit}>
            {error && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-medium mb-6">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {error}
              </div>
            )}

            <div className="mb-5">
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
                </svg>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="w-full py-[0.6875rem] pl-10 pr-[0.875rem] rounded-[0.625rem] border border-gray-200 text-[13px] text-brand-dark outline-none"
                  onFocus={(e) => { e.currentTarget.style.borderColor = config.colors.primary; e.currentTarget.style.boxShadow = `0 0 0 3px ${config.colors.primary}15`; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "#E5E7EB"; e.currentTarget.style.boxShadow = "none"; }}
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="w-full py-[0.6875rem] pl-10 pr-10 rounded-[0.625rem] border border-gray-200 text-[13px] text-brand-dark outline-none"
                  onFocus={(e) => { e.currentTarget.style.borderColor = config.colors.primary; e.currentTarget.style.boxShadow = `0 0 0 3px ${config.colors.primary}15`; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "#E5E7EB"; e.currentTarget.style.boxShadow = "none"; }}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-none border-none cursor-pointer p-1 text-gray-400 flex items-center">
                  {showPassword ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                  )}
                </button>
              </div>
            </div>

            <div className="text-right mt-2">
              <a href="/forgot-password" className="text-xs font-semibold no-underline" style={{ color: config.colors.primary }}>
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-[0.625rem] text-[13px] font-semibold text-white border-none flex items-center justify-center gap-2 transition"
              style={{
                backgroundColor: config.colors.primary,
                color: "#ffffff",
                opacity: loading ? 0.6 : 1,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? (
                <>
                  <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M21 12a9 9 0 11-6.219-8.56" /></svg>
                  Signing in...
                </>
              ) : "Sign In"}
            </button>
          </form>

          <div className="text-center mt-8">
            <span className="text-[13px] text-gray-500">
              Don&apos;t have an account?{" "}
              <a href="/register" className="font-semibold no-underline" style={{ color: config.colors.primary }}>
                Create one
              </a>
            </span>
          </div>

          <div className="text-center mt-8 pt-6 border-t border-gray-100">
            <p className="text-[11px] text-gray-400 leading-[1.5]">
              By signing in, you agree to our{" "}
              <a href="#" className="no-underline" style={{ color: config.colors.primary }}>Terms</a>
              {" "}and{" "}
              <a href="#" className="no-underline" style={{ color: config.colors.primary }}>Privacy Policy</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
