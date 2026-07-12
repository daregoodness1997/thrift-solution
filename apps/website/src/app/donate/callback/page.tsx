"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { config } from "@thrift/config";
import { Header, Footer, Card, Button, ColorBar, ColorfulBadge, FadeIn, HourglassIcon, CheckIcon, CrossIcon } from "@thrift/ui";

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
    <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "4rem 2rem" }}>
        <FadeIn>
          <div style={{ maxWidth: "480px", width: "100%", textAlign: "center" }}>
            <Card padding="2.5rem">
              {status === "verifying" && (
                <>
                   <div style={{ fontSize: "2rem", marginBottom: "1rem", color: config.colors.primary, animation: "spin 1s linear infinite" }}>&#8987;</div>
                  <h2 style={{ fontSize: "1.25rem", fontWeight: 600, color: "#1A1A1A", marginBottom: "0.5rem" }}>Verifying Payment...</h2>
                  <p style={{ fontSize: "13px", color: "#717171" }}>Please wait while we confirm your donation.</p>
                </>
              )}

              {status === "success" && (
                <>
                   <div style={{ fontSize: "3rem", marginBottom: "1rem", color: "#059669" }}>&#10003;</div>
                  <ColorfulBadge label="Payment Confirmed" color="#059669" />
                  <h2 style={{ fontSize: "1.5rem", fontWeight: 600, color: "#1A1A1A", marginTop: "1rem", marginBottom: "0.5rem" }}>Thank You!</h2>
                  <p style={{ fontSize: "13px", color: "#717171", marginBottom: "1rem", lineHeight: 1.6 }}>
                    Your generous donation has been successfully processed. A confirmation email will be sent shortly.
                  </p>
                  {amount && (
                    <div style={{ padding: "0.75rem 1rem", backgroundColor: "#F0FDF4", borderRadius: "0.75rem", marginBottom: "1.5rem" }}>
                      <span style={{ fontSize: "10px", color: "#059669", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>Amount Donated</span>
                      <span style={{ display: "block", fontSize: "1.25rem", fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: "#059669", marginTop: "0.25rem" }}>
                        ₦{amount.toLocaleString()}
                      </span>
                    </div>
                  )}
                </>
              )}

              {status === "failed" && (
                <>
                   <div style={{ fontSize: "3rem", marginBottom: "1rem", color: config.colors.accent }}>&#10007;</div>
                  <h2 style={{ fontSize: "1.5rem", fontWeight: 600, color: "#1A1A1A", marginBottom: "0.5rem" }}>Payment Failed</h2>
                  <p style={{ fontSize: "13px", color: "#717171", marginBottom: "1.5rem", lineHeight: 1.6 }}>
                    We couldn&apos;t verify your payment. Please try again or contact support.
                  </p>
                </>
              )}

              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
                <a href="/donate" style={{ padding: "0.75rem 1.5rem", borderRadius: "9999px", fontSize: "14px", fontWeight: 600, backgroundColor: config.colors.primary, color: "#ffffff", textDecoration: "none" }}>
                  {status === "success" ? "Donate Again" : "Try Again"}
                </a>
                <a href="/" style={{ padding: "0.75rem 1.5rem", borderRadius: "9999px", fontSize: "14px", fontWeight: 600, border: "1px solid #EAEAEA", backgroundColor: "#ffffff", color: "#717171", textDecoration: "none" }}>
                  Back to Home
                </a>
              </div>
            </Card>
          </div>
        </FadeIn>
      </main>
  );
}

export default function WebsiteDonateCallbackPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: "center", padding: "4rem", color: "#999" }}>Loading...</div>}>
      <CallbackContent />
    </Suspense>
  );
}
