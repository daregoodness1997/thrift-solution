"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatNaira } from "@thrift/utils";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/PageHeader";
import confetti from "canvas-confetti";
import {
  Send,
  User,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Shield,
  CreditCard,
  Clock,
  X,
  RefreshCw,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface WalletBalance {
  balance: number;
}

interface RecipientPreview {
  recipientType: "member";
  recipientName: string;
  recipientAccount: string;
  recipientBank?: string;
  fee: number;
}

interface TransferInitResponse {
  transferId: string;
  reference: string;
  recipientName: string;
  recipientAccount: string;
  recipientBank?: string;
  recipientType: string;
  amount: number;
}

const QUICK_AMOUNTS = [1000, 5000, 10000, 25000];

export default function TransferPage() {
  const { token } = useAuth();
  const router = useRouter();

  // Step tracking
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Recipient
  const [accountNumber, setAccountNumber] = useState("");
  const [recipientPreview, setRecipientPreview] = useState<RecipientPreview | null>(null);
  const [resolving, setResolving] = useState(false);

  // Step 2: Amount
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [balance, setBalance] = useState<number>(0);

  // Step 3: PIN
  const [pin, setPin] = useState("");
  const [hasPin, setHasPin] = useState(false);
  const [initiating, setInitiating] = useState(false);
  const [transferRef, setTransferRef] = useState<string>("");
  const [transferData, setTransferData] = useState<TransferInitResponse | null>(null);

  // Step 4: OTP
  const [otp, setOtp] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [resending, setResending] = useState(false);
  const [completed, setCompleted] = useState(false);

  const fetchBalance = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/wallet/balance`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setBalance(data.data.balance);
    } catch {}
  }, [token, API_URL]);

  const fetchPinStatus = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/pin/status`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setHasPin(data.data.hasPin);
    } catch {}
  }, [token, API_URL]);

  useEffect(() => { fetchBalance(); fetchPinStatus(); }, [fetchBalance, fetchPinStatus]);

  const handleResolveRecipient = async () => {
    if (!accountNumber) {
      toast.error("Enter a THR account number");
      return;
    }

    setResolving(true);
    try {
      const res = await fetch(`${API_URL}/api/transfers/preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ recipientType: "member", accountNumber }),
      });
      const data = await res.json();
      if (data.success) {
        setRecipientPreview(data.data);
        setStep(2);
      } else {
        toast.error(data.error || "Could not resolve recipient");
      }
    } catch {
      toast.error("Network error");
    }
    setResolving(false);
  };

  const handleInitiate = async () => {
    if (!pin || !/^\d{4,6}$/.test(pin)) {
      toast.error("Enter your 4-6 digit PIN");
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (parseFloat(amount) > balance) {
      toast.error("Insufficient balance");
      return;
    }

    setInitiating(true);
    try {
      const res = await fetch(`${API_URL}/api/transfers/initiate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          pin,
          amount: parseFloat(amount),
          recipientType: "member",
          accountNumber,
          description: description || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTransferRef(data.data.reference);
        setTransferData(data.data);
        setStep(4);
        toast.success("OTP sent! Check your phone or email.");
      } else {
        toast.error(data.error || "Failed to initiate transfer");
      }
    } catch {
      toast.error("Network error");
    }
    setInitiating(false);
  };

  const handleConfirm = async () => {
    if (!otp || otp.length !== 6) {
      toast.error("Enter the 6-digit OTP");
      return;
    }

    setConfirming(true);
    try {
      const res = await fetch(`${API_URL}/api/transfers/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reference: transferRef, otp }),
      });
      const data = await res.json();
      if (data.success) {
        setCompleted(true);
        confetti({ particleCount: 150, spread: 100, origin: { y: 0.5 } });
        toast.success("Transfer completed!");
        fetchBalance();
      } else {
        toast.error(data.error || "Transfer failed");
      }
    } catch {
      toast.error("Network error");
    }
    setConfirming(false);
  };

  const handleResendOtp = async () => {
    setResending(true);
    try {
      const res = await fetch(`${API_URL}/api/transfers/resend-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reference: transferRef }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("OTP resent!");
      } else {
        toast.error(data.error || "Failed to resend OTP");
      }
    } catch {
      toast.error("Network error");
    }
    setResending(false);
  };

  const handleCancel = async () => {
    if (transferRef) {
      try {
        await fetch(`${API_URL}/api/transfers/cancel`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ reference: transferRef }),
        });
      } catch {}
    }
    router.push("/wallet");
  };

  const resetForm = () => {
    setStep(1);
    setAccountNumber("");
    setRecipientPreview(null);
    setAmount("");
    setDescription("");
    setPin("");
    setOtp("");
    setTransferRef("");
    setTransferData(null);
    setCompleted(false);
  };

  const amountNum = parseFloat(amount) || 0;
  const totalDeduction = amountNum + (recipientPreview?.fee || 0);

  return (
    <div className="mx-auto max-w-[640px] p-[clamp(1rem,3vw,2rem)] space-y-6">
      <PageHeader
        badgeLabel="Send Money"
        heading="Transfer"
        accentText="Funds"
        description="Send money to another member. To move funds to your bank account, request a payout from your wallet instead."
        right={
          <button
            onClick={() => router.push("/wallet")}
            className="btn-secondary rounded-full px-4 py-2 text-[12px] font-semibold flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Wallet
          </button>
        }
      />

      {/* Balance display */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-4 flex justify-between items-center">
        <div>
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Available Balance</div>
          <div className="font-mono font-bold text-lg text-slate-900 dark:text-white">{formatNaira(balance)}</div>
        </div>
        <div className="text-[10px] text-slate-400 text-right">
          <Clock className="w-3 h-3 inline mr-1" />
          Spendable now
        </div>
      </div>

      {/* Step indicators */}
      <div className="flex items-center justify-center gap-2">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold transition-all ${
                step >= s
                  ? "bg-blue-600 text-white"
                  : "bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
              } ${completed && s <= 4 ? "bg-emerald-500 text-white" : ""}`}
            >
              {completed && s <= 4 ? <CheckCircle2 className="w-4 h-4" /> : s}
            </div>
            {s < 4 && (
              <div className={`w-8 h-0.5 ${step > s ? "bg-blue-600" : "bg-slate-200 dark:bg-slate-700"}`} />
            )}
          </div>
        ))}
      </div>

      {!hasPin && step === 1 && (
        <div className="rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-4">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-amber-800 dark:text-amber-200">Transaction PIN Required</p>
              <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-1">
                You need to set a transaction PIN before making transfers.
              </p>
              <a
                href="/settings"
                className="inline-block mt-2 text-[11px] font-semibold text-amber-800 dark:text-amber-200 underline"
              >
                Go to Settings →
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Step 1: Recipient */}
      {step === 1 && (
        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-6 space-y-5">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 w-fit">
              <Send className="w-3.5 h-3.5 text-blue-500" />
              <span>Recipient</span>
            </span>
          </div>

          {/* Recipient card */}
          <div className="p-4 rounded-2xl border-2 border-blue-500 bg-blue-50 dark:bg-blue-950/30 flex items-start gap-3">
            <User className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <div className="text-xs font-semibold text-slate-900 dark:text-white">Thrift Member</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                Send to a THR account. Bank withdrawals go through wallet payouts.
              </div>
            </div>
          </div>

          {/* Account input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase tracking-[0.1em] text-slate-400 dark:text-slate-500 font-bold">
              THR Account Number
            </label>
            <input
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder="e.g. THR-000001"
              className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-white outline-none font-mono"
            />
          </div>

          <button
            onClick={handleResolveRecipient}
            disabled={resolving || !hasPin}
            className="btn-primary w-full py-3 text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-md rounded-xl"
          >
            {resolving ? "Resolving..." : "Continue"}
          </button>
        </div>
      )}

      {/* Step 2: Amount */}
      {step === 2 && recipientPreview && (
        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-6 space-y-5">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 w-fit">
              <CreditCard className="w-3.5 h-3.5 text-blue-500" />
              <span>Amount</span>
            </span>
          </div>

          {/* Recipient summary */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Sending to</div>
            <div className="text-xs font-semibold text-slate-900 dark:text-white">{recipientPreview.recipientName}</div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
              {recipientPreview.recipientAccount}
              {recipientPreview.recipientBank ? ` · ${recipientPreview.recipientBank}` : ""}
            </div>
          </div>

          {/* Amount input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase tracking-[0.1em] text-slate-400 dark:text-slate-500 font-bold">Amount</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">₦</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                min="1"
                className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-3 py-3 text-lg font-mono font-bold text-slate-900 dark:text-white outline-none"
              />
            </div>
          </div>

          {/* Quick amounts */}
          <div className="flex flex-wrap gap-2">
            {QUICK_AMOUNTS.map((amt) => (
              <button
                key={amt}
                onClick={() => setAmount(String(amt))}
                className={`rounded-full border px-4 py-1.5 text-[12px] font-semibold transition-all ${
                  parseFloat(amount) === amt
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30 text-blue-600"
                    : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-blue-300"
                }`}
              >
                {formatNaira(amt)}
              </button>
            ))}
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase tracking-[0.1em] text-slate-400 dark:text-slate-500 font-bold">Note (optional)</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this for?"
              className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-white outline-none"
            />
          </div>

          {amountNum > 0 && (
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-500">Amount</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-white">{formatNaira(amountNum)}</span>
              </div>
              {recipientPreview.fee > 0 && (
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-500">Fee</span>
                  <span className="font-mono font-semibold text-slate-900 dark:text-white">{formatNaira(recipientPreview.fee)}</span>
                </div>
              )}
              <div className="flex justify-between text-[11px] font-bold pt-1 border-t border-slate-200 dark:border-slate-700">
                <span className="text-slate-700 dark:text-slate-300">Total</span>
                <span className="font-mono text-slate-900 dark:text-white">{formatNaira(totalDeduction)}</span>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setStep(1)}
              className="btn-secondary py-3 px-5 text-xs rounded-xl flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
            <button
              onClick={() => {
                if (!amount || amountNum <= 0) { toast.error("Enter an amount"); return; }
                if (amountNum > balance) { toast.error("Insufficient balance"); return; }
                setStep(3);
              }}
              className="btn-primary flex-1 py-3 text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-md rounded-xl flex items-center justify-center gap-1.5"
            >
              Continue <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: PIN */}
      {step === 3 && (
        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-6 space-y-5">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 w-fit">
              <Shield className="w-3.5 h-3.5 text-amber-500" />
              <span>Verify PIN</span>
            </span>
          </div>

          {/* Summary */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-500">Recipient</span>
              <span className="font-semibold text-slate-900 dark:text-white text-right">{recipientPreview?.recipientName}</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-500">Account</span>
              <span className="font-mono text-slate-900 dark:text-white">{recipientPreview?.recipientAccount}</span>
            </div>
            <div className="flex justify-between text-[11px] font-bold pt-2 border-t border-slate-200 dark:border-slate-700">
              <span className="text-slate-700 dark:text-slate-300">Total</span>
              <span className="font-mono text-slate-900 dark:text-white">{formatNaira(totalDeduction)}</span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase tracking-[0.1em] text-slate-400 dark:text-slate-500 font-bold">Transaction PIN</label>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="Enter your 4-6 digit PIN"
              maxLength={6}
              autoFocus
              className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-3 text-center text-lg font-mono font-bold text-slate-900 dark:text-white outline-none tracking-[0.5em]"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep(2)}
              className="btn-secondary py-3 px-5 text-xs rounded-xl flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
            <button
              onClick={handleInitiate}
              disabled={initiating || !pin}
              className="btn-primary flex-1 py-3 text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-md rounded-xl flex items-center justify-center gap-1.5"
            >
              {initiating ? (
                "Sending OTP..."
              ) : (
                <>
                  Send OTP & Continue <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step 4: OTP */}
      {step === 4 && !completed && (
        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-6 space-y-5">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 w-fit">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Confirm Transfer</span>
            </span>
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Enter the 6-digit code sent to your {transferData?.recipientType === "member" ? "phone or email" : "email"}.
          </p>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase tracking-[0.1em] text-slate-400 dark:text-slate-500 font-bold">OTP Code</label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="Enter 6-digit code"
              maxLength={6}
              autoFocus
              className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-3 text-center text-lg font-mono font-bold text-slate-900 dark:text-white outline-none tracking-[0.5em]"
            />
          </div>

          <button
            onClick={handleResendOtp}
            disabled={resending}
            className="text-[11px] font-medium cursor-pointer bg-none border-none text-blue-600 flex items-center gap-1"
          >
            <RefreshCw className={`w-3 h-3 ${resending ? "animate-spin" : ""}`} />
            {resending ? "Resending..." : "Resend code"}
          </button>

          <div className="flex gap-3">
            <button
              onClick={handleCancel}
              className="btn-secondary py-3 px-5 text-xs rounded-xl flex items-center gap-1.5 !border-red-300 !text-red-500"
            >
              <X className="w-3.5 h-3.5" /> Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={confirming || otp.length !== 6}
              className="btn-primary flex-1 py-3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-md rounded-xl flex items-center justify-center gap-1.5"
            >
              {confirming ? "Processing..." : "Confirm Transfer"}
            </button>
          </div>
        </div>
      )}

      {/* Success */}
      {completed && (
        <div className="rounded-3xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/20 p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white">Transfer Successful!</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {formatNaira(amountNum)} has been sent to {transferData?.recipientName}
          </p>
          <div className="p-3 rounded-xl bg-white dark:bg-slate-800/60 border border-emerald-200 dark:border-emerald-800 text-left space-y-1">
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-500">Reference</span>
              <span className="font-mono text-slate-900 dark:text-white text-[10px]">{transferRef}</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-500">Recipient</span>
              <span className="font-semibold text-slate-900 dark:text-white">{transferData?.recipientName}</span>
            </div>
          </div>
          <div className="flex gap-3 justify-center pt-2">
            <button
              onClick={resetForm}
              className="btn-secondary py-2.5 px-5 text-xs rounded-xl"
            >
              New Transfer
            </button>
            <button
              onClick={() => router.push("/wallet")}
              className="btn-primary py-2.5 px-5 text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-md rounded-xl"
            >
              Back to Wallet
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
