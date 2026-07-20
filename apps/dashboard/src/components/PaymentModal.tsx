"use client";

import { useState, useRef, useEffect } from "react";
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
  // {
  //   id: "paystack",
  //   name: "Paystack",
  //   icon: "💳",
  //   color: "#43A047",
  // },
  {
    id: "flutterwave",
    name: "Flutterwave",
    icon: "🌊",
    color: "#F5A623",
  },
  // {
  //   id: "nomba",
  //   name: "Nomba",
  //   icon: "💰",
  //   color: "#7B68EE",
  // },
];

export function PaymentModal({
  isOpen,
  onClose,
  amount,
  onSuccess,
}: PaymentModalProps) {
  const [selectedProvider, setSelectedProvider] =
    useState<string>("flutterwave");
  const [amountInput, setAmountInput] = useState<string>(String(amount));
  const amountRef = useRef<HTMLDivElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && amountRef.current) {
      amountRef.current.textContent = String(amount);
      setAmountInput(String(amount));
    }
  }, [isOpen, amount]);

  if (!isOpen) return null;

  const parsedAmount = Number(amountInput);
  const isValidAmount = parsedAmount > 0 && !Number.isNaN(parsedAmount);

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
        body: JSON.stringify({ amount: parsedAmount, provider: selectedProvider }),
      });

      const data = await res.json();

      if (data.success && data.data.authorizationUrl) {
        // Open payment page in new window
        const paymentWindow = window.open(
          data.data.authorizationUrl,
          "_blank",
          "width=500,height=700,scrollbars=yes,resizable=yes",
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
              { headers: { Authorization: `Bearer ${token}` } },
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
      className="fixed inset-0 flex items-center justify-center z-[1000] p-4 bg-black/50 backdrop-blur-sm w-screen h-screen top-0 left-0"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <FadeIn>
        <div className="bg-white rounded-[20px] p-8 max-w-[420px] w-full shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] relative">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full border-none bg-gray-100 cursor-pointer flex items-center justify-center transition-all duration-200 hover:bg-gray-200"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#6B7280"
              strokeWidth={2}
              strokeLinecap="round"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>

          {/* Header */}
          <div className="mb-6">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
              style={{
                background: `linear-gradient(135deg, ${config.colors.primary}15, ${config.colors.primary}08)`,
              }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke={config.colors.primary}
                strokeWidth={2}
                strokeLinecap="round"
              >
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <path d="M2 10h20" />
              </svg>
            </div>
            <h2 className="font-display tracking-tight text-xl font-semibold text-brand-dark mb-1">
              Fund Your Wallet
            </h2>
            <p className="text-[13px] text-gray-500">
              Select a payment provider to continue
            </p>
          </div>

          {/* Amount Input */}
          <div className="p-4 bg-gray-50 rounded-xl mb-6">
            <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-[0.1em]">
              Amount
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span
                className="text-[1.75rem] font-mono font-bold"
                style={{ color: config.colors.primary }}
              >
                ₦
              </span>
              <div
                ref={amountRef}
                contentEditable
                suppressContentEditableWarning
                role="textbox"
                inputMode="numeric"
                onInput={(e) => {
                  setAmountInput(e.currentTarget.textContent || "");
                  setError(null);
                }}
                className="flex-1 bg-transparent text-[1.75rem] font-mono font-bold outline-none border-none w-full break-words"
                style={{ color: config.colors.primary }}
              />
            </div>
            {!isValidAmount && (
              <span className="text-[11px] text-red-500 mt-1 block">
                Enter a valid amount greater than ₦0
              </span>
            )}
          </div>

          {/* Provider Selection */}
          <div className="mb-6">
            <span className="text-xs font-semibold text-gray-700 mb-3 block">
              Payment Method
            </span>
            <div className="flex flex-col gap-2">
              {providers.map((provider) => (
                <button
                  key={provider.id}
                  onClick={() => setSelectedProvider(provider.id)}
                  className="flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all duration-200 w-full text-left"
                  style={{
                    border: `2px solid ${selectedProvider === provider.id ? provider.color : "#E5E7EB"}`,
                    backgroundColor:
                      selectedProvider === provider.id
                        ? `${provider.color}08`
                        : "#FFFFFF",
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
                    className="w-10 h-10 rounded-[10px] flex items-center justify-center text-[20px]"
                    style={{ backgroundColor: `${provider.color}15` }}
                  >
                    {provider.icon}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-brand-dark">
                      {provider.name}
                    </div>
                    <div className="text-[11px] text-gray-500">
                      Pay with card, bank transfer, or USSD
                    </div>
                  </div>
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center"
                    style={{
                      border: `2px solid ${selectedProvider === provider.id ? provider.color : "#D1D5DB"}`,
                      backgroundColor:
                        selectedProvider === provider.id
                          ? provider.color
                          : "transparent",
                    }}
                  >
                    {selectedProvider === provider.id && (
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="white"
                        strokeWidth={3}
                        strokeLinecap="round"
                      >
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
            <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs font-medium mb-4 flex items-center gap-2">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4M12 16h.01" />
              </svg>
              {error}
            </div>
          )}

          {/* Pay Button */}
          <button
            onClick={handlePayment}
            disabled={loading || !isValidAmount}
            className="w-full p-4 rounded-xl text-sm font-semibold border-none text-white flex items-center justify-center gap-2 transition-all duration-200"
            style={{
              backgroundColor: config.colors.primary,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
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
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="none"
                    strokeDasharray="31.4 31.4"
                  />
                </svg>
                Processing...
              </>
            ) : (
              <>
                 Pay {formatNaira(isValidAmount ? parsedAmount : 0)}
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </>
            )}
          </button>

          {/* Security Note */}
          <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-gray-400">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
            Secured by {providers.find((p) => p.id === selectedProvider)?.name}
          </div>
        </div>
      </FadeIn>

      <style jsx>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
