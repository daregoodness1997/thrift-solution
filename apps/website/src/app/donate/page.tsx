"use client";

import { useState } from "react";
import { toast } from "sonner";
import { config } from "@thrift/config";
import { clsx } from "@/lib/clsx";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const presetAmounts = [1000, 2500, 5000, 10000, 25000, 50000];

const impactItems = [
  {
    amount: "₦5,000",
    impact: "Provides school supplies for one child for a term",
    icon: "📚",
  },
  {
    amount: "₦10,000",
    impact: "Funds a week of meals for a family in need",
    icon: "🍲",
  },
  {
    amount: "₦25,000",
    impact: "Covers medical checkups for two people",
    icon: "🚑",
  },
  {
    amount: "₦50,000",
    impact: "Provides clean water access for a household for a month",
    icon: "💧",
  },
];

const testimonials = [
  {
    name: "Chidi O.",
    text: "Donating through Arosco was seamless. I could choose exactly where my money goes and track the impact in real time.",
    color: "#4A5D4E",
  },
  {
    name: "Blessing E.",
    text: "I love that I can donate items directly. The process is simple and I get confirmation right away.",
    color: "#8A7D73",
  },
  {
    name: "Ibrahim K.",
    text: "The multiple payment options make it so convenient. I use Paystack and it processes instantly.",
    color: "#3D4D40",
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
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(`${API_URL}/api/donations`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          amount: parseFloat(selectedAmount),
          provider,
          notes: notes || undefined,
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
      <main className="flex min-h-screen items-center justify-center bg-brand-cream px-6 py-24">
        <div className="w-full max-w-md rounded-3xl border border-brand-primary/10 bg-white p-12 text-center shadow-sm">
          <div className="mb-4 text-4xl text-brand-primary">✓</div>
          <h2 className="font-display text-2xl font-semibold text-brand-dark">
            Thank You!
          </h2>
          <p className="mt-3 text-sm font-light text-gray-500">
            Your donation has been recorded. You&apos;ll receive a confirmation
            email shortly.
          </p>
          <button
            onClick={() => setSuccess(false)}
            className="mt-6 rounded-full bg-brand-primary px-8 py-3 text-sm font-semibold text-white"
          >
            Donate Again
          </button>
        </div>
      </main>
    );
  }

  const inputClass =
    "w-full rounded-xl border border-gray-200 px-3.5 py-3 text-sm text-brand-dark outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20";

  return (
    <main className="min-h-screen bg-brand-cream pt-32">
      <section className="relative overflow-hidden px-6 pb-12 pt-6">
        <div className="absolute -right-32 -top-24 h-80 w-80 rounded-full bg-brand-primary/10 blur-3xl" />
        <div className="relative mx-auto max-w-3xl text-center">
          <span className="mb-3 inline-block rounded-full border border-brand-primary/15 bg-brand-primary/8 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-brand-primary">
            Support Our Community
          </span>
          <h1 className="font-display text-4xl font-bold tracking-tight text-brand-dark sm:text-5xl">
            Make a{" "}
            <span className="bg-gradient-to-r from-brand-primary to-brand-accent bg-clip-text text-transparent italic">
              donation
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-base font-light text-brand-muted">
            Your generosity helps families build financial security through
            communal savings. Every contribution makes a difference.
          </p>
        </div>
      </section>

      <section className="px-6 pb-12">
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {impactItems.map((item) => (
            <div
              key={item.amount}
              className="rounded-2xl border border-white/70 bg-white p-6 shadow-sm"
            >
              <div className="mb-2 text-2xl">{item.icon}</div>
              <span className="block font-mono text-lg font-bold text-brand-primary">
                {item.amount}
              </span>
              <span className="mt-1 block text-xs font-light text-gray-500">
                {item.impact}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-gradient-to-b from-brand-surface/50 to-brand-cream px-6 py-16">
        <div className="mx-auto max-w-lg">
          <div className="mb-8 text-center">
            <span className="mb-3 inline-block rounded-full border border-brand-primary/15 bg-brand-primary/8 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-brand-primary">
              Donate Now
            </span>
            <h2 className="font-display text-2xl font-semibold text-brand-dark">
              Choose your contribution
            </h2>
          </div>

          <div className="rounded-3xl border border-brand-primary/10 bg-white p-8 shadow-sm">
            {error && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-600">
                {error}
              </div>
            )}

            <div className="mb-4">
              <label className="mb-1.5 block text-xs font-medium text-gray-700">
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
              <label className="mb-1.5 block text-xs font-medium text-gray-700">
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
              <label className="mb-1.5 block text-xs font-medium text-gray-700">
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
                      "rounded-xl border px-3 py-3 font-mono text-sm font-semibold transition",
                      amount === String(preset)
                        ? "border-brand-primary bg-brand-primary/10 text-brand-primary"
                        : "border-gray-200 text-gray-500 hover:border-brand-primary/40",
                    )}
                  >
                    ₦{preset.toLocaleString()}
                  </button>
                ))}
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-400">
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
              <label className="mb-1.5 block text-xs font-medium text-gray-700">
                Notes (optional)
              </label>
              <textarea
                placeholder="Add a message with your donation..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className={clsx(inputClass, "resize-none")}
              />
            </div>

            <button
              onClick={handleDonate}
              disabled={loading || (!amount && !customAmount) || !email}
              className="w-full rounded-xl bg-brand-primary py-3.5 text-sm font-semibold text-white transition hover:bg-brand-secondary disabled:opacity-50"
            >
              {loading ? "Processing..." : "Donate Now"}
            </button>

            <div className="mt-4 flex items-center justify-center gap-6 border-t border-gray-100 pt-4 text-[10px] text-gray-400">
              <span className="flex items-center gap-1.5">
                🔒 SSL Encrypted
              </span>
              <span className="flex items-center gap-1.5">
                ✓ Secure Payment
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <span className="mb-3 inline-block rounded-full border border-brand-accent/20 bg-brand-accent/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-brand-accent">
              Donor Stories
            </span>
            <h2 className="font-display text-3xl font-bold tracking-tight text-brand-dark">
              Hear from our{" "}
              <span className="bg-gradient-to-r from-brand-primary to-brand-accent bg-clip-text text-transparent italic">
                donors
              </span>
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="rounded-2xl border border-white/70 bg-white p-7 shadow-sm"
              >
                <p className="text-sm font-light italic leading-relaxed text-brand-dark">
                  &ldquo;{t.text}&rdquo;
                </p>
                <div className="mt-5 flex items-center gap-3">
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ background: t.color }}
                  >
                    {t.name.charAt(0)}
                  </div>
                  <span className="text-xs font-semibold text-brand-dark">
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
