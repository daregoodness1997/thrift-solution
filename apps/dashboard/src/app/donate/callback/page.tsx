"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card, FadeInUp } from "@thrift/ui";
import { ColorBar } from "@thrift/ui";
import { CheckCircle, XCircle, Clock, ArrowRight, Home } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

function CallbackContent() {
  const searchParams = useSearchParams();
  const reference = searchParams.get("reference") || searchParams.get("tx_ref") || searchParams.get("orderId");
  const provider = searchParams.get("provider") || "paystack";
  const [status, setStatus] = useState<"verifying" | "success" | "failed">("verifying");
  const [details, setDetails] = useState<{ amount?: number; reference?: string }>({});

  useEffect(() => {
    if (!reference) {
      setStatus("failed");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setStatus("failed");
      return;
    }

    fetch(`${API_URL}/api/donations/verify/${reference}?provider=${provider}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.data.status === "completed") {
          setStatus("success");
          setDetails(data.data);
        } else {
          setStatus("failed");
        }
      })
      .catch(() => setStatus("failed"));
  }, [reference, provider]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-[clamp(1rem,3vw,2rem)]">
      <div className="mx-auto max-w-[480px] w-full text-center">
        <ColorBar />
        <FadeInUp>
          <Card padding="2rem" className="rounded-3xl">
            {status === "verifying" && (
              <>
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                  <Clock className="h-8 w-8 animate-spin" />
                </div>
                <h2 className="mb-2 font-heading text-[1.25rem] font-bold text-slate-900 dark:text-white">
                  Verifying Payment...
                </h2>
                <p className="text-[13px] text-slate-500 dark:text-slate-400">
                  Please wait while we confirm your donation.
                </p>
              </>
            )}

            {status === "success" && (
              <>
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle className="h-8 w-8" />
                </div>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  Payment Confirmed
                </span>
                <h2 className="mt-4 mb-2 font-heading text-[1.5rem] font-bold text-slate-900 dark:text-white">
                  Donation Successful!
                </h2>
                <p className="mb-4 text-[13px] text-slate-500 dark:text-slate-400 leading-[1.6]">
                  Thank you for your generous contribution. Your donation has been recorded.
                </p>
                {details.amount && (
                  <div className="mb-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 px-4 py-3">
                    <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-emerald-600 dark:text-emerald-400">Amount</span>
                    <span className="mt-1 block font-mono text-[1.25rem] font-bold text-emerald-600 dark:text-emerald-400">
                      ₦{(details.amount || 0).toLocaleString()}
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
                <h2 className="mb-2 font-heading text-[1.5rem] font-bold text-slate-900 dark:text-white">
                  Payment Failed
                </h2>
                <p className="mb-6 text-[13px] text-slate-500 dark:text-slate-400 leading-[1.6]">
                  We couldn&apos;t verify your payment. Please try again or contact support.
                </p>
              </>
            )}

            <div className="flex justify-center gap-3">
              <a href="/donate" className="btn-primary text-[14px] py-3 px-6 rounded-xl no-underline">
                <span>{status === "success" ? "Make Another" : "Try Again"}</span>
                <ArrowRight className="h-4 w-4" />
              </a>
              <a href="/donations" className="btn-secondary text-[14px] py-3 px-6 rounded-xl no-underline">
                <Home className="h-4 w-4" />
                <span>View Donations</span>
              </a>
            </div>
          </Card>
        </FadeInUp>
      </div>
    </div>
  );
}

export default function DonateCallbackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-400">Loading...</div>}>
      <CallbackContent />
    </Suspense>
  );
}
