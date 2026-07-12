"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { config } from "@thrift/config";
import { Card, Button, ColorfulBadge, FadeInUp, HourglassIcon, CheckIcon, CrossIcon } from "@thrift/ui";
import { ColorBar } from "@thrift/ui";

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
    <div style={{ maxWidth: "480px", margin: "0 auto", padding: "clamp(1rem, 3vw, 2rem)", textAlign: "center" }}>
      <ColorBar />
      <FadeInUp>
        <Card padding="2rem">
          {status === "verifying" && (
            <>
              <div style={{ marginBottom: "1rem", color: config.colors.primary, animation: "spin 1s linear infinite" }}><HourglassIcon size={32} /></div>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 600, color: "#1A1A1A", marginBottom: "0.5rem" }}>
                Verifying Payment...
              </h2>
              <p style={{ fontSize: "13px", color: "#717171" }}>
                Please wait while we confirm your donation.
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <div style={{ marginBottom: "1rem", color: "#059669" }}><CheckIcon size={48} /></div>
              <ColorfulBadge label="Payment Confirmed" color="#059669" />
              <h2 style={{ fontSize: "1.5rem", fontWeight: 600, color: "#1A1A1A", marginTop: "1rem", marginBottom: "0.5rem" }}>
                Donation Successful!
              </h2>
              <p style={{ fontSize: "13px", color: "#717171", marginBottom: "1rem", lineHeight: 1.6 }}>
                Thank you for your generous contribution. Your donation has been recorded.
              </p>
              {details.amount && (
                <div style={{ padding: "0.75rem 1rem", backgroundColor: "#F0FDF4", borderRadius: "0.75rem", marginBottom: "1.5rem" }}>
                  <span style={{ fontSize: "10px", color: "#059669", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>Amount</span>
                  <span style={{ display: "block", fontSize: "1.25rem", fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: "#059669", marginTop: "0.25rem" }}>
                    ₦{(details.amount || 0).toLocaleString()}
                  </span>
                </div>
              )}
            </>
          )}

          {status === "failed" && (
            <>
              <div style={{ marginBottom: "1rem", color: config.colors.accent }}><CrossIcon size={48} /></div>
              <h2 style={{ fontSize: "1.5rem", fontWeight: 600, color: "#1A1A1A", marginBottom: "0.5rem" }}>
                Payment Failed
              </h2>
              <p style={{ fontSize: "13px", color: "#717171", marginBottom: "1.5rem", lineHeight: 1.6 }}>
                We couldn&apos;t verify your payment. Please try again or contact support.
              </p>
            </>
          )}

          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
            <a href="/donate" style={{ padding: "0.75rem 1.5rem", borderRadius: "9999px", fontSize: "14px", fontWeight: 600, backgroundColor: config.colors.primary, color: "#ffffff", textDecoration: "none", transition: "all 0.2s ease", display: "inline-flex", alignItems: "center" }}>
              {status === "success" ? "Make Another" : "Try Again"}
            </a>
            <a href="/donations" style={{ padding: "0.75rem 1.5rem", borderRadius: "9999px", fontSize: "14px", fontWeight: 600, border: "1px solid #EAEAEA", backgroundColor: "#ffffff", color: "#717171", textDecoration: "none", transition: "all 0.2s ease", display: "inline-flex", alignItems: "center" }}>
              View Donations
            </a>
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

export default function DonateCallbackPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: "center", padding: "4rem", color: "#999" }}>Loading...</div>}>
      <CallbackContent />
    </Suspense>
  );
}
