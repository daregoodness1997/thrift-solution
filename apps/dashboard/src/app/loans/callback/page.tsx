"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, Button, FadeInUp, HourglassIcon, CheckIcon, CrossIcon } from "@thrift/ui";
import { ColorBar } from "@thrift/ui";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

function LoanCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reference = searchParams.get("reference") || searchParams.get("tx_ref") || searchParams.get("orderId");
  const provider = searchParams.get("provider") || "flutterwave";
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

    fetch(`${API_URL}/api/loans/pay/verify/${reference}?provider=${provider}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success && (data.data.status === "completed" || data.data.status === "successful")) {
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
          <Card padding="2rem">
            {status === "verifying" && (
              <>
                <div className="mb-4 text-blue-600 animate-spin"><HourglassIcon size={32} /></div>
                <h2 className="mb-2 text-[1.25rem] font-semibold text-slate-900 dark:text-white">
                  Verifying Payment...
                </h2>
                <p className="text-[13px] text-slate-500 dark:text-slate-400">
                  Please wait while we confirm your loan repayment.
                </p>
              </>
            )}

            {status === "success" && (
              <>
                <div className="mb-4 text-emerald-600"><CheckIcon size={48} /></div>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  Payment Confirmed
                </span>
                <h2 className="mt-4 mb-2 text-[1.5rem] font-semibold text-slate-900 dark:text-white">
                  Repayment Successful!
                </h2>
                <p className="mb-4 text-[13px] text-slate-500 dark:text-slate-400 leading-[1.6]">
                  Your loan repayment has been recorded. Thank you.
                </p>
                {details.amount && (
                  <div className="mb-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 px-4 py-3">
                    <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-emerald-600">Amount</span>
                    <span className="mt-1 block font-mono text-[1.25rem] font-bold text-emerald-600">
                      ₦{(details.amount || 0).toLocaleString()}
                    </span>
                  </div>
                )}
              </>
            )}

            {status === "failed" && (
              <>
                <div className="mb-4 text-red-500"><CrossIcon size={48} /></div>
                <h2 className="mb-2 text-[1.5rem] font-semibold text-slate-900 dark:text-white">
                  Payment Failed
                </h2>
                <p className="mb-6 text-[13px] text-slate-500 dark:text-slate-400 leading-[1.6]">
                  We couldn&apos;t verify your payment. Please try again or contact support.
                </p>
              </>
            )}

            <div className="flex justify-center gap-3">
              <Button variant="primary" size="md" onClick={() => router.push("/loans")}>
                Back to Loans
              </Button>
            </div>
          </Card>
        </FadeInUp>

        <style jsx>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}

export default function LoanCallbackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-400">Loading...</div>}>
      <LoanCallbackContent />
    </Suspense>
  );
}
