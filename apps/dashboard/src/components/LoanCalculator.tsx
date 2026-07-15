"use client";

import { useState, useMemo } from "react";
import { config, BrandConfig } from "@thrift/config";
import { Button, FadeInUp } from "@thrift/ui";
import { formatNaira } from "@thrift/utils";

const ANNUAL_RATE = 0.05;
const MIN_AMOUNT = 10000;
const MAX_AMOUNT = 10000000;
const TERM_PRESETS = [3, 6, 12, 24, 36];

interface LoanCalculatorProps {
  onRequestLoan?: (amount: number, termMonths: number) => void;
  disabled?: boolean;
}

function calcMonthlyPayment(principal: number, months: number): number {
  const monthlyRate = ANNUAL_RATE / 12;
  if (monthlyRate === 0) return principal / months;
  return (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
}

function generateAmortization(principal: number, months: number) {
  const monthlyRate = ANNUAL_RATE / 12;
  const monthly = calcMonthlyPayment(principal, months);
  let balance = principal;
  const rows: { month: number; payment: number; principal: number; interest: number; balance: number }[] = [];

  for (let m = 1; m <= months; m++) {
    const interest = balance * monthlyRate;
    const princ = monthly - interest;
    balance = Math.max(0, balance - princ);
    rows.push({ month: m, payment: monthly, principal: princ, interest, balance });
  }
  return rows;
}

function formatTerm(months: number) {
  if (months < 12) return `${months} month${months !== 1 ? "s" : ""}`;
  const y = Math.floor(months / 12);
  const m = months % 12;
  if (m === 0) return `${y} year${y !== 1 ? "s" : ""}`;
  return `${y}y ${m}mo`;
}

export function LoanCalculator({ onRequestLoan, disabled }: LoanCalculatorProps) {
  const cfg: BrandConfig = config;
  const [amount, setAmount] = useState<number>(500000);
  const [term, setTerm] = useState(12);
  const [customTerm, setCustomTerm] = useState("");
  const [showAmortization, setShowAmortization] = useState(false);

  const effectiveTerm = customTerm ? parseInt(customTerm) || 12 : term;

  const results = useMemo(() => {
    if (amount < MIN_AMOUNT) return null;
    const monthly = calcMonthlyPayment(amount, effectiveTerm);
    const total = monthly * effectiveTerm;
    const interest = total - amount;
    const principalPct = (amount / total) * 100;
    const interestPct = (interest / total) * 100;
    return { monthly, total, interest, principalPct, interestPct };
  }, [amount, effectiveTerm]);

  const amortization = useMemo(() => {
    if (!showAmortization || amount < MIN_AMOUNT) return [];
    return generateAmortization(amount, effectiveTerm);
  }, [amount, effectiveTerm, showAmortization]);

  const sliderPct = ((amount - MIN_AMOUNT) / (MAX_AMOUNT - MIN_AMOUNT)) * 100;

  return (
    <div className="rounded-2xl bg-[#111111] border border-[#2A2A2A] overflow-hidden">
      <div className="px-8 pt-6 pb-2">
        <div className="inline-flex px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.05em]" style={{ color: cfg.colors.primary, backgroundColor: `${cfg.colors.primary}18`, border: `1px solid ${cfg.colors.primary}30` }}>Calculator</div>
        <h2 className="font-display tracking-tight text-lg font-semibold text-white mt-2 mb-6">Loan Calculator</h2>
      </div>

      <div className="grid grid-cols-2 min-h-[420px]">
        <div className="px-8 pb-8">
          <div className="mb-6">
            <div className="flex justify-between items-baseline mb-2">
              <label className="text-xs font-semibold text-[#A0A0A0]">Loan Amount</label>
              <span className="text-lg font-bold font-mono" style={{ color: cfg.colors.primary }}>{formatNaira(amount)}</span>
            </div>
            <div className="relative h-8 flex items-center">
              <div className="absolute left-0 right-0 h-1 rounded-sm bg-[#2A2A2A]">
                <div className="h-full rounded-sm" style={{ width: `${sliderPct}%`, background: `linear-gradient(90deg, ${cfg.colors.primary}, ${cfg.colors.primary}cc)` }} />
              </div>
              <input type="range" min={MIN_AMOUNT} max={MAX_AMOUNT} step={50000} value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="absolute left-0 w-full h-8 appearance-none bg-transparent cursor-pointer m-0 z-[1]"
              />
            </div>
            <div className="-mt-1 flex justify-between text-[10px] text-[#666666] font-mono">
              <span>{formatNaira(MIN_AMOUNT)}</span>
              <span>{formatNaira(MAX_AMOUNT)}</span>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-xs font-semibold text-[#A0A0A0] mb-2">Repayment Term</label>
            <div className="flex gap-1.5 flex-wrap mb-3">
              {TERM_PRESETS.map((t) => (
                <button key={t} onClick={() => { setTerm(t); setCustomTerm(""); }}
                  className="px-3.5 py-2 rounded-full text-[11px] font-semibold border-[1.5px] cursor-pointer transition-all duration-150 whitespace-nowrap"
                  style={{ backgroundColor: !customTerm && term === t ? cfg.colors.primary : "#1A1A1A", color: !customTerm && term === t ? "#ffffff" : "#777777", borderColor: !customTerm && term === t ? cfg.colors.primary : "#333333" }}>
                  {formatTerm(t)}
                </button>
              ))}
              <button onClick={() => setCustomTerm(customTerm ? "" : "12")}
                className="px-3.5 py-2 rounded-full text-[11px] font-semibold border-[1.5px] cursor-pointer transition-all duration-150 whitespace-nowrap"
                style={{ backgroundColor: !!customTerm ? cfg.colors.primary : "#1A1A1A", color: !!customTerm ? "#ffffff" : "#777777", borderColor: !!customTerm ? cfg.colors.primary : "#333333" }}>
                Custom
              </button>
            </div>
            {customTerm !== "" && (
              <div className="flex items-center gap-2">
                <input type="number" value={customTerm} onChange={(e) => setCustomTerm(e.target.value)} min="1" max="60"
                  className="w-20 px-3 py-2 rounded-xl border border-[#333333] bg-[#1A1A1A] text-white text-[13px] outline-none box-border text-center font-mono" />
                <span className="text-xs text-[#666666]">months (1-60)</span>
              </div>
            )}
          </div>

          <button onClick={() => onRequestLoan?.(amount, effectiveTerm)} disabled={disabled || !results}
            className="w-full py-3 rounded-full text-[13px] font-semibold cursor-pointer border-none transition-all duration-150"
            style={{ backgroundColor: disabled || !results ? "#333333" : cfg.colors.primary, color: disabled || !results ? "#666666" : "#ffffff" }}>
            {disabled ? "Active Loan Exists" : "Request This Loan"}
          </button>
        </div>

        <div className="px-8 pb-8 flex flex-col">
          {results ? (
            <>
              <div className="flex-1 flex flex-col justify-center">
                <div className="text-center mb-6">
                  <span className="block text-[10px] font-semibold text-[#666666] uppercase tracking-[0.05em] mb-1.5">Monthly Payment</span>
                  <span className="text-2xl font-bold font-mono text-white">{formatNaira(results.monthly)}</span>
                </div>

                <div className="flex gap-6 justify-center mb-6">
                  <div className="text-center"><span className="block text-[10px] text-[#666666] mb-0.5">You Borrow</span><span className="text-sm font-semibold font-mono text-[#E0E0E0]">{formatNaira(amount)}</span></div>
                  <div className="w-px bg-[#2A2A2A]" />
                  <div className="text-center"><span className="block text-[10px] text-[#666666] mb-0.5">Interest</span><span className="text-sm font-semibold font-mono text-amber-500">{formatNaira(results.interest)}</span></div>
                </div>

                <div className="h-2 rounded bg-[#222222] flex overflow-hidden mb-5">
                  <div className="transition-[width] duration-300" style={{ width: `${results.principalPct}%`, backgroundColor: cfg.colors.primary }} />
                  <div className="bg-amber-500 transition-[width] duration-300" style={{ width: `${results.interestPct}%` }} />
                </div>

                <div className="flex justify-between text-xs text-[#777777] mb-4">
                  <span>{results.principalPct.toFixed(1)}% Principal</span>
                  <span>{results.interestPct.toFixed(1)}% Interest</span>
                </div>

                <div className="p-4 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A]">
                  <div className="flex justify-between text-xs mb-2"><span className="text-[#666666]">Total Repayment</span><span className="font-mono font-semibold text-[#E0E0E0]">{formatNaira(results.total)}</span></div>
                  <div className="flex justify-between text-xs mb-2"><span className="text-[#666666]">Loan Term</span><span className="font-semibold text-[#E0E0E0]">{formatTerm(effectiveTerm)}</span></div>
                  <div className="flex justify-between text-xs"><span className="text-[#666666]">Interest Rate</span><span className="font-semibold text-[#E0E0E0]">5% APR</span></div>
                </div>
              </div>

              <div className="mt-4">
                <button onClick={() => setShowAmortization(!showAmortization)}
                  className="w-full py-2 rounded-lg text-[11px] font-semibold cursor-pointer bg-transparent text-[#777777] border border-[#333333] transition-all duration-150">
                  {showAmortization ? "Hide" : "Show"} Amortization Schedule
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-[13px] text-[#555555]">Adjust the slider to see your loan breakdown</p>
            </div>
          )}
        </div>
      </div>

      {showAmortization && amortization.length > 0 && (
        <FadeInUp>
          <div className="border-t border-[#2A2A2A] px-8 py-6">
            <h3 className="font-display tracking-tight text-xs font-semibold text-[#E0E0E0] mb-3">Amortization Schedule ({amortization.length} payments)</h3>
            <div className="max-h-[280px] overflow-y-auto rounded-lg border border-[#2A2A2A]">
              <table className="w-full border-collapse text-[11px]">
                <thead className="sticky top-0 z-[1]">
                  <tr className="bg-[#1A1A1A]">
                    {["#", "Payment", "Principal", "Interest", "Balance"].map((h) => (
                      <th key={h} className="px-3 py-2.5 text-right font-semibold text-[#777777] border-b border-[#2A2A2A]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {amortization.map((row) => (
                    <tr key={row.month} style={{ backgroundColor: row.month % 2 === 0 ? "#161616" : "#111111" }}>
                      <td className="px-3 py-2 text-right font-mono text-[#555555]">{row.month}</td>
                      <td className="px-3 py-2 text-right font-mono font-medium text-[#E0E0E0]">{formatNaira(row.payment)}</td>
                      <td className="px-3 py-2 text-right font-mono text-brand-primary">{formatNaira(row.principal)}</td>
                      <td className="px-3 py-2 text-right font-mono text-amber-500">{formatNaira(row.interest)}</td>
                      <td className="px-3 py-2 text-right font-mono text-[#777777]">{formatNaira(row.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </FadeInUp>
      )}

      <style>{`
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: ${cfg.colors.primary};
          border: 3px solid #111111;
          box-shadow: 0 0 8px ${cfg.colors.primary}44;
          cursor: pointer;
          margin-top: -8px;
        }
        input[type="range"]::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: ${cfg.colors.primary};
          border: 3px solid #111111;
          box-shadow: 0 0 8px ${cfg.colors.primary}44;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
