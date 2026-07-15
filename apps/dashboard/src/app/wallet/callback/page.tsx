"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { config } from "@thrift/config";
import { Card, ColorfulBadge, FadeInUp, HourglassIcon, CheckIcon, CrossIcon } from "@thrift/ui";
import { ColorBar } from "@thrift/ui";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

function CallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reference = searchParams.get("reference") || searchParams.get("trxref") || searchParams.get("tx_ref") || searchParams.get("orderId");
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

    fetch(`${API_URL}/api/wallet/verify/${reference}?provider=${provider}`, {
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

  const handleClose = () => {
    if (window.opener) {
      window.close();
    } else {
      router.push("/");
    }
  };

  return (
    <div className="mx-auto max-w-[480px] p-[clamp(1rem,3vw,2rem)] text-center">
      <ColorBar />
      <FadeInUp>
        <Card padding="2rem">
          {status === "verifying" && (
            <>
              <div className="mb-4" style={{ color: config.colors.primary, animation: "spin 1s linear infinite" }}><HourglassIcon size={32} /></div>
              <h2 className="mb-2 text-[1.25rem] font-semibold text-brand-dark">
                Verifying Payment...
              </h2>
              <p className="text-[13px] text-gray-500">
                Please wait while we confirm your wallet funding.
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="mb-4 text-emerald-600"><CheckIcon size={48} /></div>
              <ColorfulBadge label="Payment Confirmed" color="#059669" />
              <h2 className="mt-4 mb-2 text-[1.5rem] font-semibold text-brand-dark">
                Wallet Funded Successfully!
              </h2>
              <p className="mb-4 text-[13px] text-gray-500 leading-[1.6]">
                Your wallet has been credited. You can now use your balance.
              </p>
              {details.amount && (
                <div className="mb-6 rounded-xl bg-green-50 px-4 py-3">
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
              <div className="mb-4" style={{ color: config.colors.accent }}><CrossIcon size={48} /></div>
              <h2 className="mb-2 text-[1.5rem] font-semibold text-brand-dark">
                Payment Failed
              </h2>
              <p className="mb-6 text-[13px] text-gray-500 leading-[1.6]">
                We couldn&apos;t verify your payment. Please try again or contact support.
              </p>
            </>
          )}

          <div className="flex justify-center gap-3">
            <button
              onClick={handleClose}
              className="cursor-pointer rounded-full border-0 px-6 py-3 text-[14px] font-semibold text-white transition-all duration-200"
              style={{ backgroundColor: config.colors.primary }}
            >
              {status === "success" ? "Done" : "Back to Dashboard"}
            </button>
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
  );
}

export default function WalletCallbackPage() {
  return (
    <Suspense fallback={<div className="p-16 text-center text-gray-400">Loading...</div>}>
      <CallbackContent />
    </Suspense>
  );
}
