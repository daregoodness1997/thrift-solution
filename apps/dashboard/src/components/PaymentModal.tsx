"use client";

import { useState, useRef, useEffect } from "react";
import { formatNaira } from "@thrift/utils";
import { X, CreditCard, CheckCircle2, Lock } from "lucide-react";

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
    id: "flutterwave",
    name: "Flutterwave",
    icon: "🌊",
    color: "#2563EB",
  },
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
        const paymentWindow = window.open(
          data.data.authorizationUrl,
          "_blank",
          "width=500,height=700,scrollbars=yes,resizable=yes",
        );

        const pollTimer = setInterval(() => {
          if (paymentWindow?.closed) {
            clearInterval(pollTimer);
            onSuccess();
            onClose();
          }
        }, 500);

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
          } catch {}
        }, 5000);
      } else {
        setError(data.error || "Failed to initialize payment");
      }
    } catch {
      setError("Network error. Please try again.");
    }

    setLoading(false);
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-[1000] p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-[420px] w-full shadow-2xl border border-slate-200 dark:border-slate-800 relative animate-scale-in">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-white flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center mb-4">
            <CreditCard className="w-6 h-6 text-blue-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
            Fund Your Wallet
          </h2>
          <p className="text-[13px] text-slate-500 dark:text-slate-400">
            Select a payment provider to continue
          </p>
        </div>

        {/* Amount Input */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 mb-6">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.1em]">
            Amount
          </span>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[1.75rem] font-mono font-bold text-blue-600">
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
              className="flex-1 bg-transparent text-[1.75rem] font-mono font-bold outline-none border-none w-full break-words text-blue-600"
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
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-3 block">
            Payment Method
          </span>
          <div className="flex flex-col gap-2">
            {providers.map((provider) => (
              <button
                key={provider.id}
                onClick={() => setSelectedProvider(provider.id)}
                className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all w-full text-left border-2 ${
                  selectedProvider === provider.id
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-950/40"
                    : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-300"
                }`}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[20px] bg-blue-50 dark:bg-blue-950/60">
                  {provider.icon}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-slate-900 dark:text-white">
                    {provider.name}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Pay with card, bank transfer, or USSD
                  </div>
                </div>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center border-2 ${
                  selectedProvider === provider.id
                    ? "border-blue-500 bg-blue-500"
                    : "border-slate-300 dark:border-slate-600"
                }`}>
                  {selectedProvider === provider.id && (
                    <CheckCircle2 className="w-3 h-3 text-white" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="px-4 py-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-red-600 dark:text-red-400 text-xs font-medium mb-4 flex items-center gap-2">
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
          disabled={loading || !isValidAmount}
          className="w-full py-3.5 rounded-xl text-sm font-bold border-none text-white flex items-center justify-center gap-2 transition-all btn-primary disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M21 12a9 9 0 11-6.219-8.56" />
              </svg>
              Processing...
            </>
          ) : (
            <>
              Pay {formatNaira(isValidAmount ? parsedAmount : 0)}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </>
          )}
        </button>

        {/* Security Note */}
        <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-slate-400">
          <Lock className="w-3 h-3" />
          Secured by {providers.find((p) => p.id === selectedProvider)?.name}
        </div>
      </div>
    </div>
  );
}
