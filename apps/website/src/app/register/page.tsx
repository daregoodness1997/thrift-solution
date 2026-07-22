"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { config } from "@thrift/config";
import { clsx } from "@/lib/clsx";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const REG_FEE = parseInt(process.env.NEXT_PUBLIC_REGISTRATION_FEE || "4200", 10);

const STEPS = ["Basic", "Payment", "KYC"];

function StepIndicator({ step }: { step: number }) {
  return (
    <div className="mb-8 flex items-center justify-center gap-2">
      {STEPS.map((label, i) => {
        const num = i + 1;
        const isActive = step === num;
        const isDone = step > num;
        return (
          <div key={label} className="flex items-center gap-2">
            <div
              className={clsx(
                "flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold transition-colors",
                isDone && "bg-green-600 text-white",
                isActive && "bg-brand-primary text-white",
                !isDone && !isActive && "bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-500"
              )}
            >
              {isDone ? "✓" : num}
            </div>
            <span className={clsx("text-[11px]", isActive ? "font-semibold text-brand-dark dark:text-slate-100" : "font-normal text-gray-400 dark:text-slate-500")}>
              {label}
            </span>
            {i < STEPS.length - 1 && (
              <div className={clsx("h-px w-6", isDone ? "bg-green-600" : "bg-gray-200 dark:bg-slate-700")} />
            )}
          </div>
        );
      })}
    </div>
  );
}

const inputBase =
  "w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm text-brand-dark dark:text-slate-100 outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20";

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
    <div className="mb-4">
      <label className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-slate-300">{label}</label>
      <div className="relative">
        {icon && <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">{icon}</span>}
        <input
          {...props}
          className={clsx(inputBase, icon ? "pl-10" : "", rightSlot ? "pr-10" : "", invalid ? "border-red-300" : "border-gray-200")}
        />
        {rightSlot && <span className="absolute right-3 top-1/2 -translate-y-1/2">{rightSlot}</span>}
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

function WebsiteRegisterPage() {
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
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
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
        confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 } });
      }
    } catch {
      setError("Network error. Please try again.");
    }
    setLoading(false);
  };

  const btnClass =
    "w-full rounded-xl bg-brand-primary px-4 py-3 text-sm font-semibold text-white transition disabled:opacity-60";

  return (
    <div className="flex min-h-screen flex-col bg-brand-cream dark:bg-slate-950 pt-20 lg:flex-row">
      <div className="flex flex-col justify-center bg-gradient-to-br from-brand-secondary via-brand-primary to-[#0B1220] p-10 text-center lg:flex-[0_0_42%] lg:p-16">
        <div className="mx-auto max-w-sm">
          <h1 className="font-display text-3xl font-light text-white">
            Join GFW<br />
            <span className="italic text-brand-accent">in three easy steps</span>
          </h1>
          <p className="mt-4 text-sm text-white/60">
            Create your account, pay the one-time ₦{REG_FEE.toLocaleString()} registration fee,
            and verify your BVN &amp; NIN to unlock your virtual account.
          </p>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {step <= 3 && <StepIndicator step={step} />}

          <div className="mb-6">
            <h2 className="font-display text-2xl font-semibold tracking-tight text-brand-dark dark:text-slate-100">
              {step === 1 && "Create Account"}
              {step === 2 && "Registration Fee"}
              {step === 3 && "Verify Your Identity"}
              {step === 4 && "You're All Set!"}
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
              {step === 1 && "Fill in your details to get started"}
              {step === 2 && `Pay the one-time ₦${REG_FEE.toLocaleString()} fee to continue`}
              {step === 3 && "Enter your BVN & NIN — we verify instantly via CreditChek"}
              {step === 4 && "Your account is verified and your virtual account is ready"}
            </p>
          </div>

          {error && (
            <div className="mb-5 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 px-4 py-3 text-xs font-medium text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {step === 1 && !otpSent && (
            <form onSubmit={handleBasic}>
              <TextField label="Full Name" icon={icons.user} type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Adaeze Nwankwo" />
              <TextField label="Email Address" icon={icons.mail} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="adaeze@email.com" />
              <TextField label="Phone (optional)" icon={icons.phone} type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+234..." />

              <div className="mb-4">
                <label className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-slate-300">Password</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">{icons.lock}</span>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    autoComplete="new-password"
                    className={clsx(inputBase, "pl-10 pr-10")}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPassword ? icons.eyeOff : icons.eyeOpen}
                  </button>
                </div>
                {password && (
                  <div className="mt-2">
                    <div className="mb-1 flex gap-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-1 flex-1 rounded-full" style={{ backgroundColor: i <= passwordStrength.level ? passwordStrength.color : (typeof window !== 'undefined' && document.documentElement.classList.contains('dark') ? '#334155' : '#E5E7EB') }} />
                      ))}
                    </div>
                    <span className="text-[10px] font-medium" style={{ color: passwordStrength.color }}>{passwordStrength.label}</span>
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

              <div className={clsx("mb-6 rounded-xl border p-3.5", referralCode ? "border-brand-primary/30 bg-brand-primary/[0.04] dark:bg-blue-950/20" : "border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800")}>
                <div className={clsx("flex items-center justify-between", referralCode && "mb-2")}>
                  <span className="flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-slate-300">{icons.gift} Have a referral code?</span>
                  {!referralCode && (
                    <button type="button" onClick={() => setReferralCode(" ")} className="bg-none border-0 p-0 text-xs font-semibold text-brand-primary">
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
                    className="w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 font-mono text-xs font-semibold tracking-wider text-brand-primary dark:text-blue-400 outline-none focus:border-brand-primary"
                  />
                )}
              </div>

              <button type="submit" disabled={loading} className={btnClass}>
                {loading ? "Creating account..." : "Continue"}
              </button>
            </form>
          )}

          {step === 1 && otpSent && (
            <div>
              <TextField label="Verification Code" type="text" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="6-digit code from email" />
              <button onClick={handleVerifyEmail} disabled={loading} className={btnClass}>
                {loading ? "Verifying..." : "Verify Email & Continue"}
              </button>
            </div>
          )}

          {step === 2 && (
            <div>
              <div className="mb-6 rounded-xl bg-gray-50 dark:bg-slate-800 p-6 text-center">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-slate-500">Registration Fee</span>
                <div className="mt-1 font-mono text-2xl font-bold text-brand-primary dark:text-blue-400">₦{REG_FEE.toLocaleString()}</div>
                <p className="mt-2 text-[11px] text-gray-500 dark:text-slate-400">One-time fee. Secured by Flutterwave.</p>
              </div>
              <button onClick={handlePay} disabled={loading} className={btnClass}>
                {loading ? "Redirecting..." : `Pay ₦${REG_FEE.toLocaleString()}`}
              </button>
            </div>
          )}

          {step === 3 && (
            <div>
              <TextField label="BVN (11 digits)" type="text" value={bvn} onChange={(e) => setBvn(e.target.value.replace(/\D/g, "").slice(0, 11))} placeholder="12345678901" inputMode="numeric" />
              <TextField label="NIN (11 digits)" type="text" value={nin} onChange={(e) => setNin(e.target.value.replace(/\D/g, "").slice(0, 11))} placeholder="98765432109" inputMode="numeric" />
              <button onClick={handleKyc} disabled={loading} className={btnClass}>
                {loading ? "Verifying with CreditChek..." : "Verify & Finish"}
              </button>
            </div>
          )}

          {step === 4 && (
            <div>
              <div className="mb-6 rounded-xl border border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/30 p-6">
                <div className="text-sm font-semibold text-green-600 dark:text-green-400">✓ Identity verified &amp; KYC approved</div>
                {virtualAccount ? (
                  <div className="mt-3 text-xs text-green-700 dark:text-green-300">
                    <div className="mb-1"><span className="text-gray-500 dark:text-slate-400">Virtual Account: </span><strong className="font-mono">{virtualAccount.accountNumber}</strong></div>
                    <div><span className="text-gray-500 dark:text-slate-400">Bank: </span><strong>{virtualAccount.bankName}</strong></div>
                  </div>
                ) : (
                  <div className="mt-2 text-xs text-green-700 dark:text-green-300">Your virtual account will be created shortly.</div>
                )}
              </div>
              <a href="/dashboard" className="block w-full rounded-xl bg-brand-primary py-3 text-center text-sm font-semibold text-white">
                Go to Dashboard
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="py-32 text-center text-gray-400 dark:text-slate-500">Loading...</div>}>
      <WebsiteRegisterPage />
    </Suspense>
  );
}
