"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { config } from "@thrift/config";

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
    fetch(`${API_URL}/api/donations/verify/${reference}?provider=${provider}`)
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
    <main className="flex min-h-screen items-center justify-center bg-brand-cream px-6 py-32">
      <div className="w-full max-w-md rounded-3xl border border-brand-primary/10 bg-white p-10 text-center shadow-sm">
        {status === "verifying" && (
          <>
            <div className="mb-4 text-3xl text-brand-primary animate-spin">⌛</div>
            <h2 className="text-xl font-semibold text-brand-dark">Verifying Payment...</h2>
            <p className="mt-2 text-sm text-gray-500">Please wait while we confirm your donation.</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="mb-4 text-4xl text-green-600">✓</div>
            <span className="inline-block rounded-full bg-green-100 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-green-700">Payment Confirmed</span>
            <h2 className="mt-4 text-2xl font-semibold text-brand-dark">Thank You!</h2>
            <p className="mt-2 text-sm text-gray-500">
              Your generous donation has been successfully processed. A confirmation email will be sent shortly.
            </p>
            {amount && (
              <div className="mt-4 rounded-xl bg-green-50 p-4">
                <span className="block text-[10px] font-bold uppercase tracking-widest text-green-700">Amount Donated</span>
                <span className="mt-1 block font-mono text-xl font-bold text-green-700">₦{amount.toLocaleString()}</span>
              </div>
            )}
          </>
        )}

        {status === "failed" && (
          <>
            <div className="mb-4 text-4xl text-brand-accent">✕</div>
            <h2 className="text-2xl font-semibold text-brand-dark">Payment Failed</h2>
            <p className="mt-2 text-sm text-gray-500">
              We couldn&apos;t verify your payment. Please try again or contact support.
            </p>
          </>
        )}

        <div className="mt-6 flex justify-center gap-3">
          <a href="/donate" className="rounded-full bg-brand-primary px-6 py-3 text-sm font-semibold text-white">
            {status === "success" ? "Donate Again" : "Try Again"}
          </a>
          <a href="/" className="rounded-full border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-500">
            Back to Home
          </a>
        </div>
      </div>
    </main>
  );
}

export default function WebsiteDonateCallbackPage() {
  return (
    <Suspense fallback={<div className="py-32 text-center text-gray-400">Loading...</div>}>
      <CallbackContent />
    </Suspense>
  );
}
