"use client";

import { useState } from "react";
import { config } from "@thrift/config";
import { FadeIn } from "@thrift/ui";
import { formatNaira } from "@thrift/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  onSuccess: () => void;
}

interface Provider {
  id: string;
  name: string;
  icon: string;
  color: string;
}

const providers: Provider[] = [
  {
    id: "paystack",
    name: "Paystack",
    icon: "💳",
    color: "#43A047",
  },
  {
    id: "flutterwave",
    name: "Flutterwave",
    icon: "🌊",
    color: "#F5A623",
  },
  {
    id: "nomba",
    name: "Nomba",
    icon: "💰",
    color: "#7B68EE",
  },
];

export function PaymentModal({ isOpen, onClose, amount, onSuccess }: PaymentModalProps) {
  const [selectedProvider, setSelectedProvider] = useState<string>("paystack");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePayment = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Please log in to fund your wallet");
        setLoading(false);
        return;
      }

      const res = await fetch(`${API_URL}/api/wallet/fund`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amount, provider: selectedProvider }),
      });

      const data = await res.json();

      if (data.success && data.data.authorizationUrl) {
        // Open payment page in new window
        const paymentWindow = window.open(
          data.data.authorizationUrl,
          "_blank",
          "width=500,height=700,scrollbars=yes,resizable=yes"
        );

        // Poll for window close (user completed or cancelled payment)
        const pollTimer = setInterval(() => {
          if (paymentWindow?.closed) {
            clearInterval(pollTimer);
            // Refresh wallet balance after payment window closes
            onSuccess();
            onClose();
          }
        }, 500);

        // Also verify payment after a delay (in case webhook hasn't fired)
        setTimeout(async () => {
          try {
            const verifyRes = await fetch(
              `${API_URL}/api/wallet/verify/${data.data.reference}?provider=${selectedProvider}`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            const verifyData = await verifyRes.json();
            if (verifyData.success && verifyData.data.status === "completed") {
              onSuccess();
            }
          } catch {
            // Verification will happen via webhook
          }
        }, 5000);
      } else {
        setError(data.error || "Failed to initialize payment");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    }

    setLoading(false);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "1rem",
        backdropFilter: "blur(4px)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <FadeIn>
        <div
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "20px",
            padding: "2rem",
            maxWidth: "420px",
            width: "100%",
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
            position: "relative",
          }}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            style={{
              position: "absolute",
              top: "1rem",
              right: "1rem",
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              border: "none",
              backgroundColor: "#F3F4F6",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#E5E7EB";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#F3F4F6";
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth={2} strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>

          {/* Header */}
          <div style={{ marginBottom: "1.5rem" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                background: `linear-gradient(135deg, ${config.colors.primary}15, ${config.colors.primary}08)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "1rem",
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={config.colors.primary} strokeWidth={2} strokeLinecap="round">
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <path d="M2 10h20" />
              </svg>
            </div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 600, color: "#1A1A1A", marginBottom: "0.25rem" }}>
              Fund Your Wallet
            </h2>
            <p style={{ fontSize: "13px", color: "#6B7280" }}>
              Select a payment provider to continue
            </p>
          </div>

          {/* Amount Display */}
          <div
            style={{
              padding: "1rem",
              backgroundColor: "#F9FAFB",
              borderRadius: "12px",
              marginBottom: "1.5rem",
              textAlign: "center",
            }}
          >
            <span style={{ fontSize: "10px", color: "#9CA3AF", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Amount
            </span>
            <div
              style={{
                fontSize: "1.75rem",
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 700,
                color: config.colors.primary,
                marginTop: "0.25rem",
              }}
            >
              {formatNaira(amount)}
            </div>
          </div>

          {/* Provider Selection */}
          <div style={{ marginBottom: "1.5rem" }}>
            <span style={{ fontSize: "12px", fontWeight: 600, color: "#374151", marginBottom: "0.75rem", display: "block" }}>
              Payment Method
            </span>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {providers.map((provider) => (
                <button
                  key={provider.id}
                  onClick={() => setSelectedProvider(provider.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    padding: "1rem",
                    borderRadius: "12px",
                    border: `2px solid ${selectedProvider === provider.id ? provider.color : "#E5E7EB"}`,
                    backgroundColor: selectedProvider === provider.id ? `${provider.color}08` : "#FFFFFF",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    width: "100%",
                    textAlign: "left",
                  }}
                  onMouseEnter={(e) => {
                    if (selectedProvider !== provider.id) {
                      e.currentTarget.style.borderColor = `${provider.color}60`;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedProvider !== provider.id) {
                      e.currentTarget.style.borderColor = "#E5E7EB";
                    }
                  }}
                >
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "10px",
                      backgroundColor: `${provider.color}15`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "20px",
                    }}
                  >
                    {provider.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "14px", fontWeight: 600, color: "#1A1A1A" }}>
                      {provider.name}
                    </div>
                    <div style={{ fontSize: "11px", color: "#6B7280" }}>
                      Pay with card, bank transfer, or USSD
                    </div>
                  </div>
                  <div
                    style={{
                      width: "20px",
                      height: "20px",
                      borderRadius: "50%",
                      border: `2px solid ${selectedProvider === provider.id ? provider.color : "#D1D5DB"}`,
                      backgroundColor: selectedProvider === provider.id ? provider.color : "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {selectedProvider === provider.id && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} strokeLinecap="round">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div
              style={{
                padding: "0.75rem 1rem",
                borderRadius: "8px",
                backgroundColor: "#FEF2F2",
                border: "1px solid #FECACA",
                color: "#DC2626",
                fontSize: "12px",
                fontWeight: 500,
                marginBottom: "1rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4M12 16h.01" />
              </svg>
              {error}
            </div>
          )}

          {/* Pay Button */}
          <button
            onClick={handlePayment}
            disabled={loading}
            style={{
              width: "100%",
              padding: "1rem",
              borderRadius: "12px",
              fontSize: "14px",
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              backgroundColor: config.colors.primary,
              color: "#ffffff",
              border: "none",
              transition: "all 0.2s ease",
              opacity: loading ? 0.7 : 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.backgroundColor = config.colors.secondary;
                e.currentTarget.style.transform = "translateY(-1px)";
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.backgroundColor = config.colors.primary;
                e.currentTarget.style.transform = "translateY(0)";
              }
            }}
          >
            {loading ? (
              <>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  style={{ animation: "spin 1s linear infinite" }}
                >
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" strokeDasharray="31.4 31.4" />
                </svg>
                Processing...
              </>
            ) : (
              <>
                Pay {formatNaira(amount)}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </>
            )}
          </button>

          {/* Security Note */}
          <div
            style={{
              marginTop: "1rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              fontSize: "11px",
              color: "#9CA3AF",
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
            Secured by {providers.find((p) => p.id === selectedProvider)?.name}
          </div>
        </div>
      </FadeIn>

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
