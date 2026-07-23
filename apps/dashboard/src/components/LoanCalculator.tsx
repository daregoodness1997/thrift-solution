"use client";

import { useState, useMemo } from "react";
import { FadeInUp } from "@thrift/ui";
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
    <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
      <div className="px-6 sm:px-8 pt-6 pb-2">
        <span className="inline-flex px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200/80 dark:border-blue-800/80 text-[10px] font-mono font-bold uppercase tracking-wider">
          Calculator
        </span>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-2 mb-6">Loan Calculator</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[420px]">
        <div className="px-6 sm:px-8 pb-8">
          <div className="mb-6">
            <div className="flex justify-between items-baseline mb-2">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Loan Amount</label>
              <span className="text-lg font-bold font-mono text-blue-600">{formatNaira(amount)}</span>
            </div>
            <div className="relative h-8 flex items-center">
              <div className="absolute left-0 right-0 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800">
                <div className="h-full rounded-full bg-blue-600" style={{ width: `${sliderPct}%` }} />
              </div>
              <input type="range" min={MIN_AMOUNT} max={MAX_AMOUNT} step={50000} value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="absolute left-0 w-full h-8 appearance-none bg-transparent cursor-pointer m-0 z-[1]"
              />
            </div>
            <div className="-mt-1 flex justify-between text-[10px] text-slate-400 font-mono">
              <span>{formatNaira(MIN_AMOUNT)}</span>
              <span>{formatNaira(MAX_AMOUNT)}</span>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">Repayment Term</label>
            <div className="flex gap-1.5 flex-wrap mb-3">
              {TERM_PRESETS.map((t) => (
                <button key={t} onClick={() => { setTerm(t); setCustomTerm(""); }}
                  className={`px-3.5 py-2 rounded-xl text-[11px] font-bold border transition-all whitespace-nowrap ${
                    !customTerm && term === t
                      ? "bg-blue-600 text-white border-blue-600 shadow-md"
                      : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-blue-400"
                  }`}>
                  {formatTerm(t)}
                </button>
              ))}
              <button onClick={() => setCustomTerm(customTerm ? "" : "12")}
                className={`px-3.5 py-2 rounded-xl text-[11px] font-bold border transition-all whitespace-nowrap ${
                  !!customTerm
                    ? "bg-blue-600 text-white border-blue-600 shadow-md"
                    : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-blue-400"
                }`}>
                Custom
              </button>
            </div>
            {customTerm !== "" && (
              <div className="flex items-center gap-2">
                <input type="number" value={customTerm} onChange={(e) => setCustomTerm(e.target.value)} min="1" max="60"
                  className="w-20 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-[13px] outline-none box-border text-center font-mono focus:ring-2 focus:ring-blue-500" />
                <span className="text-xs text-slate-400">months (1-60)</span>
              </div>
            )}
          </div>

          <button onClick={() => onRequestLoan?.(amount, effectiveTerm)} disabled={disabled || !results}
            className={`w-full py-3 rounded-xl text-[13px] font-bold cursor-pointer border-none transition-all ${
              disabled || !results
                ? "bg-slate-100 dark:bg-slate-800 text-slate-400"
                : "btn-primary"
            }`}>
            {disabled ? "Active Loan Exists" : "Request This Loan"}
          </button>
        </div>

        <div className="px-6 sm:px-pb-8 flex flex-col">
          {results ? (
            <>
              <div className="flex-1 flex flex-col justify-center">
                <div className="text-center mb-6">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.05em] mb-1.5">Monthly Payment</span>
                  <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">{formatNaira(results.monthly)}</span>
                </div>

                <div className="flex gap-6 justify-center mb-6">
                  <div className="text-center"><span className="block text-[10px] text-slate-400 mb-0.5">You Borrow</span><span className="text-sm font-bold font-mono text-slate-900 dark:text-white">{formatNaira(amount)}</span></div>
                  <div className="w-px bg-slate-200 dark:bg-slate-700" />
                  <div className="text-center"><span className="block text-[10px] text-slate-400 mb-0.5">Interest</span><span className="text-sm font-bold font-mono text-amber-500">{formatNaira(results.interest)}</span></div>
                </div>

                <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 flex overflow-hidden mb-5">
                  <div className="bg-blue-600 transition-[width] duration-300" style={{ width: `${results.principalPct}%` }} />
                  <div className="bg-amber-500 transition-[width] duration-300" style={{ width: `${results.interestPct}%` }} />
                </div>

                <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-4">
                  <span>{results.principalPct.toFixed(1)}% Principal</span>
                  <span>{results.interestPct.toFixed(1)}% Interest</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
                  <div className="flex justify-between text-xs mb-2"><span className="text-slate-400">Total Repayment</span><span className="font-mono font-bold text-slate-900 dark:text-white">{formatNaira(results.total)}</span></div>
                  <div className="flex justify-between text-xs mb-2"><span className="text-slate-400">Loan Term</span><span className="font-bold text-slate-900 dark:text-white">{formatTerm(effectiveTerm)}</span></div>
                  <div className="flex justify-between text-xs"><span className="text-slate-400">Interest Rate</span><span className="font-bold text-slate-900 dark:text-white">5% APR</span></div>
                </div>
              </div>

              <div className="mt-4">
                <button onClick={() => setShowAmortization(!showAmortization)}
                  className="w-full py-2 rounded-xl text-[11px] font-bold cursor-pointer bg-transparent text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 transition-all hover:border-blue-400">
                  {showAmortization ? "Hide" : "Show"} Amortization Schedule
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-[13px] text-slate-400">Adjust the slider to see your loan breakdown</p>
            </div>
          )}
        </div>
      </div>

      {showAmortization && amortization.length > 0 && (
        <FadeInUp>
          <div className="border-t border-slate-200 dark:border-slate-800 px-6 sm:px-8 py-6">
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-3">Amortization Schedule ({amortization.length} payments)</h3>
            <div className="max-h-[280px] overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700">
              <table className="w-full text-[12px] border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/80 dark:border-slate-800/80 font-mono text-[9px] uppercase tracking-[0.1em] text-slate-400 dark:text-slate-500">
                    {["#", "Payment", "Principal", "Interest", "Balance"].map((h) => (
                      <th key={h} className="px-4 py-3 text-right font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {amortization.map((row) => (
                    <tr key={row.month} className="border-b border-slate-100 dark:border-slate-800/50 transition-colors duration-150 hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-3 text-right font-mono text-slate-400">{row.month}</td>
                      <td className="px-4 py-3 text-right font-mono font-medium text-slate-900 dark:text-white">{formatNaira(row.payment)}</td>
                      <td className="px-4 py-3 text-right font-mono text-blue-600">{formatNaira(row.principal)}</td>
                      <td className="px-4 py-3 text-right font-mono text-amber-500">{formatNaira(row.interest)}</td>
                      <td className="px-4 py-3 text-right font-mono text-slate-400">{formatNaira(row.balance)}</td>
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
          background: #2563EB;
          border: 3px solid white;
          box-shadow: 0 0 8px rgba(37, 99, 235, 0.4);
          cursor: pointer;
          margin-top: -8px;
        }
        input[type="range"]::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #2563EB;
          border: 3px solid white;
          box-shadow: 0 0 8px rgba(37, 99, 235, 0.4);
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
