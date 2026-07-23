"use client";

import { useState } from "react";
import { toast } from "sonner";
import { config } from "@thrift/config";
import { clsx } from "@/lib/clsx";
import {
  Heart,
  Users,
  GraduationCap,
  UtensilsCrossed,
  Stethoscope,
  Droplets,
  Shield,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Lock,
  MessageCircle,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const presetAmounts = [1000, 2500, 5000, 10000, 25000, 50000];

const impactItems = [
  {
    amount: "₦5,000",
    impact: "Provides school supplies for one child for a term",
    icon: GraduationCap,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-100 dark:bg-blue-950",
  },
  {
    amount: "₦10,000",
    impact: "Funds a week of meals for a family in need",
    icon: UtensilsCrossed,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-100 dark:bg-emerald-950",
  },
  {
    amount: "₦25,000",
    impact: "Covers medical checkups for two people",
    icon: Stethoscope,
    color: "text-indigo-600 dark:text-indigo-400",
    bg: "bg-indigo-100 dark:bg-indigo-950",
  },
  {
    amount: "₦50,000",
    impact: "Provides clean water access for a household for a month",
    icon: Droplets,
    color: "text-sky-600 dark:text-sky-400",
    bg: "bg-sky-100 dark:bg-sky-950",
  },
];

const testimonials = [
  {
    name: "Chidi O.",
    text: "Donating through GFW was seamless. I could choose exactly where my money goes and track the impact in real time.",
    initials: "CO",
    bg: "bg-blue-600",
  },
  {
    name: "Blessing E.",
    text: "I love that I can donate items directly. The process is simple and I get confirmation right away.",
    initials: "BE",
    bg: "bg-emerald-600",
  },
  {
    name: "Ibrahim K.",
    text: "The multiple payment options make it so convenient. I use Paystack and it processes instantly.",
    initials: "IK",
    bg: "bg-indigo-600",
  },
];

export default function DonatePage() {
  const [amount, setAmount] = useState("");
  const [customAmount, setCustomAmount] = useState("");
  const [provider, setProvider] = useState("flutterwave");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleDonate = async () => {
    const selectedAmount = customAmount || amount;
    if (!selectedAmount || parseFloat(selectedAmount) <= 0) {
      setError("Please select or enter an amount");
      return;
    }
    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const isAuth = !!token;
      const endpoint = isAuth
        ? `${API_URL}/api/donations`
        : `${API_URL}/api/donations/public`;
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) headers.Authorization = `Bearer ${token}`;
      const callbackUrl = `${window.location.origin}/donate/callback?provider=${provider}`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify({
          amount: parseFloat(selectedAmount),
          provider,
          notes: notes || undefined,
          email: email.trim(),
          name: name.trim() || undefined,
          callbackUrl,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        toast.error(data.error || "Failed to initiate donation");
        return;
      }
      toast.success("Donation initiated successfully!");
      if (data.data.authorizationUrl) {
        window.location.href = data.data.authorizationUrl;
      } else {
        setSuccess(true);
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-brand-cream dark:bg-slate-950 px-6 py-24 bg-mesh">
        <div className="w-full max-w-md rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-12 text-center shadow-lg">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
            <CheckCircle className="h-8 w-8" />
          </div>
          <h2 className="font-heading text-2xl font-bold text-slate-900 dark:text-white">
            Thank You!
          </h2>
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
            Your donation has been recorded. You&apos;ll receive a confirmation
            email shortly.
          </p>
          <button
            onClick={() => setSuccess(false)}
            className="mt-6 btn-primary text-sm"
          >
            Donate Again
          </button>
        </div>
      </main>
    );
  }

  const inputClass =
    "w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-3 text-sm text-slate-900 dark:text-slate-100 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 placeholder:text-slate-400 dark:placeholder:text-slate-500";

  return (
    <main className="min-h-screen bg-brand-cream dark:bg-slate-950 pt-28 bg-mesh">
      {/* Hero */}
      <section className="relative overflow-hidden px-6 pb-16 pt-10">
        <div className="absolute -right-32 -top-24 h-80 w-80 rounded-full bg-blue-500/8 dark:bg-blue-500/10 blur-3xl" />
        <div className="absolute -left-32 bottom-0 h-60 w-60 rounded-full bg-emerald-500/8 dark:bg-emerald-500/10 blur-3xl" />
        <div className="relative mx-auto max-w-3xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-emerald-100 dark:bg-emerald-950/60 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
            <Heart className="h-3.5 w-3.5" />
            Support Our Community
          </div>
          <h1 className="font-heading text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
            Make a{" "}
            <span className="bg-gradient-to-r from-blue-600 to-emerald-500 bg-clip-text text-transparent">
              donation
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-base text-slate-500 dark:text-slate-400">
            Your generosity helps families build financial security through
            communal savings. Every contribution makes a difference.
          </p>
        </div>
      </section>

      {/* Impact Cards */}
      <section className="px-6 pb-16">
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {impactItems.map((item) => (
            <div
              key={item.amount}
              className="impact-card rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-6 shadow-md"
            >
              <div
                className={clsx(
                  "mb-4 flex h-11 w-11 items-center justify-center rounded-xl",
                  item.bg
                )}
              >
                <item.icon className={clsx("h-5 w-5", item.color)} />
              </div>
              <span className="block font-mono text-lg font-bold text-slate-900 dark:text-white">
                {item.amount}
              </span>
              <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {item.impact}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Donation Form */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-lg">
          <div className="mb-8 text-center">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-100 dark:bg-blue-950/60 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-300">
              <Sparkles className="h-3.5 w-3.5" />
              Donate Now
            </div>
            <h2 className="font-heading text-2xl font-bold text-slate-900 dark:text-white">
              Choose your contribution
            </h2>
          </div>

          <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-8 shadow-lg">
            {error && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30 px-4 py-3 text-xs font-medium text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            <div className="mb-4">
              <label className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">
                Your Name
              </label>
              <input
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="mb-4">
              <label className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">
                Email Address *
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="mb-4">
              <label className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">
                Select Amount
              </label>
              <div className="mb-3 grid grid-cols-3 gap-2">
                {presetAmounts.map((preset) => (
                  <button
                    key={preset}
                    onClick={() => {
                      setAmount(String(preset));
                      setCustomAmount("");
                    }}
                    className={clsx(
                      "rounded-xl border px-3 py-3 font-mono text-sm font-semibold transition-all",
                      amount === String(preset)
                        ? "border-blue-500 bg-blue-50 text-blue-600 dark:border-blue-400 dark:bg-blue-950/50 dark:text-blue-400 shadow-sm shadow-blue-500/10"
                        : "border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-blue-400 dark:hover:border-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                    )}
                  >
                    ₦{preset.toLocaleString()}
                  </button>
                ))}
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400 dark:text-slate-500">
                  ₦
                </span>
                <input
                  type="number"
                  placeholder="Custom amount"
                  value={customAmount}
                  onChange={(e) => {
                    setCustomAmount(e.target.value);
                    setAmount("");
                  }}
                  className={clsx(inputClass, "pl-7 font-mono")}
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">
                Notes (optional)
              </label>
              <div className="relative">
                <MessageCircle className="absolute left-3.5 top-3 h-4 w-4 text-slate-400 dark:text-slate-500" />
                <textarea
                  placeholder="Add a message with your donation..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className={clsx(inputClass, "resize-none pl-9")}
                />
              </div>
            </div>

            <button
              onClick={handleDonate}
              disabled={loading || (!amount && !customAmount) || !email}
              className="w-full btn-primary py-3.5 text-sm disabled:opacity-50"
            >
              {loading ? (
                "Processing..."
              ) : (
                <>
                  Donate Now
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            <div className="mt-4 flex items-center justify-center gap-6 border-t border-slate-100 dark:border-slate-800 pt-4 text-[10px] text-slate-400 dark:text-slate-500">
              <span className="flex items-center gap-1.5">
                <Lock className="h-3 w-3" />
                SSL Encrypted
              </span>
              <span className="flex items-center gap-1.5">
                <Shield className="h-3 w-3" />
                Secure Payment
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-emerald-100 dark:bg-emerald-950/60 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
              <Users className="h-3.5 w-3.5" />
              Donor Stories
            </div>
            <h2 className="font-heading text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Hear from our{" "}
              <span className="bg-gradient-to-r from-blue-600 to-emerald-500 bg-clip-text text-transparent">
                donors
              </span>
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="impact-card rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-7 shadow-md"
              >
                <p className="text-sm italic leading-relaxed text-slate-600 dark:text-slate-300">
                  &ldquo;{t.text}&rdquo;
                </p>
                <div className="mt-5 flex items-center gap-3">
                  <div
                    className={clsx(
                      "flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white",
                      t.bg
                    )}
                  >
                    {t.initials}
                  </div>
                  <span className="text-xs font-semibold text-slate-900 dark:text-white">
                    {t.name}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
