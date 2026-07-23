"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { config } from "@thrift/config";
import { CheckCircle, XCircle, Clock, ArrowRight, Home } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

function CallbackContent() {
  const searchParams = useSearchParams();
  const reference = searchParams.get("reference") || searchParams.get("tx_ref") || searchParams.get("orderId");
  const provider = searchParams.get("provider") || "paystack";
  const [status, setStatus] = useState<"verifying" | "success" | "failed">("verifying");
  const [amount, setAmount] = useState<number | null>(null);

  useEffect(() => {
    if (!reference) {
      setStatus("failed");
      return;
    }
    fetch(`${API_URL}/api/donations/public/verify/${reference}?provider=${provider}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.data.status === "completed") {
          setStatus("success");
          setAmount(data.data.amount);
        } else {
          setStatus("failed");
        }
      })
      .catch(() => setStatus("failed"));
  }, [reference, provider]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-brand-cream dark:bg-slate-950 px-6 py-32 bg-mesh">
      <div className="w-full max-w-md rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-10 text-center shadow-lg">
        {status === "verifying" && (
          <>
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
              <Clock className="h-8 w-8 animate-spin" />
            </div>
            <h2 className="font-heading text-xl font-bold text-slate-900 dark:text-white">
              Verifying Payment...
            </h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Please wait while we confirm your donation.
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
              <CheckCircle className="h-8 w-8" />
            </div>
            <span className="inline-block rounded-full bg-emerald-100 dark:bg-emerald-950/60 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
              Payment Confirmed
            </span>
            <h2 className="mt-4 font-heading text-2xl font-bold text-slate-900 dark:text-white">
              Thank You!
            </h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Your generous donation has been successfully processed. A confirmation email will be sent shortly.
            </p>
            {amount && (
              <div className="mt-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 p-4">
                <span className="block text-[10px] font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-300">
                  Amount Donated
                </span>
                <span className="mt-1 block font-mono text-xl font-bold text-emerald-700 dark:text-emerald-300">
                  ₦{amount.toLocaleString()}
                </span>
              </div>
            )}
          </>
        )}

        {status === "failed" && (
          <>
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400">
              <XCircle className="h-8 w-8" />
            </div>
            <h2 className="font-heading text-2xl font-bold text-slate-900 dark:text-white">
              Payment Failed
            </h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              We couldn&apos;t verify your payment. Please try again or contact support.
            </p>
          </>
        )}

        <div className="mt-6 flex justify-center gap-3">
          <a href="/donate" className="btn-primary text-sm py-3 px-6 rounded-xl">
            <span>{status === "success" ? "Donate Again" : "Try Again"}</span>
            <ArrowRight className="h-4 w-4" />
          </a>
          <a href="/" className="btn-secondary text-sm py-3 px-6 rounded-xl">
            <Home className="h-4 w-4" />
            <span>Home</span>
          </a>
        </div>
      </div>
    </main>
  );
}

export default function WebsiteDonateCallbackPage() {
  return (
    <Suspense fallback={<div className="py-32 text-center text-slate-400">Loading...</div>}>
      <CallbackContent />
    </Suspense>
  );
}
