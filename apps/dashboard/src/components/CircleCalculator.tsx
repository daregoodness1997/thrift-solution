"use client";

import { useState, useMemo } from "react";
import { FadeInUp } from "@thrift/ui";
import { formatNaira } from "@thrift/utils";

const DURATION_PRESETS = [6, 12];
const ACCOUNT_PRESETS = [1, 2, 5, 10];
const CYCLE_PRESETS = [4, 8, 13, 26];

interface CircleOption {
  id: string;
  name: string;
  amount: number;
  durationMonths: number;
  interestRateAnnual: number;
}

interface CircleCalculatorProps {
  circleAmount?: number;
  annualRate?: number;
  circles?: CircleOption[];
  onSelectConfig?: (
    amount: number,
    durationMonths: number,
    accounts: number,
    circleId?: string | null,
  ) => void;
}

function calcWeeklyInterest(principal: number, annualRatePct: number): number {
  return (principal * (annualRatePct / 100)) / 52;
}

function formatDuration(months: number) {
  if (months < 12) return `${months} months`;
  const y = Math.floor(months / 12);
  const m = months % 12;
  if (m === 0) return `${y} year${y !== 1 ? "s" : ""}`;
  return `${y}y ${m}mo`;
}

export function CircleCalculator({
  circleAmount = 10000,
  annualRate = 10,
  circles = [],
  onSelectConfig,
}: CircleCalculatorProps) {
  const [selectedCircleId, setSelectedCircleId] = useState<string | null>(null);
  const [duration, setDuration] = useState(12);
  const [accounts, setAccounts] = useState(1);
  const [customAccounts, setCustomAccounts] = useState("");
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);

  const selectedCircle = circles.find((c) => c.id === selectedCircleId) ?? null;
  const activeAmount = selectedCircle ? selectedCircle.amount : circleAmount;
  const activeRate = selectedCircle ? selectedCircle.interestRateAnnual : annualRate;

  const effectiveAccounts = customAccounts
    ? Math.max(1, Math.min(50, parseInt(customAccounts) || 1))
    : accounts;
  const totalInvestment = activeAmount * effectiveAccounts;

  const totalWeeks = Math.round((duration / 12) * 52);
  const effectiveWeek = selectedWeek !== null ? Math.min(selectedWeek, totalWeeks) : null;

  const results = useMemo(() => {
    const weeklyPerAccount = calcWeeklyInterest(activeAmount, activeRate);
    const totalWeeksCalc = Math.round((duration / 12) * 52);
    const totalInterestPerAccount = weeklyPerAccount * totalWeeksCalc;
    const maturityPayoutPerAccount = activeAmount + totalInterestPerAccount;

    const cycleWeeks = effectiveWeek ?? totalWeeksCalc;
    const cycleInterestPerAccount = weeklyPerAccount * cycleWeeks;
    const cyclePayoutPerAccount = activeAmount + cycleInterestPerAccount;

    return {
      weeklyPerAccount,
      totalWeeks: totalWeeksCalc,
      totalInterestPerAccount,
      maturityPayoutPerAccount,
      totalInterest: totalInterestPerAccount * effectiveAccounts,
      totalPayout: maturityPayoutPerAccount * effectiveAccounts,
      totalProfit: totalInterestPerAccount * effectiveAccounts,
      cycleWeeks,
      cycleInterestPerAccount,
      cycleInterest: cycleInterestPerAccount * effectiveAccounts,
      cyclePayout: cyclePayoutPerAccount * effectiveAccounts,
      isCycleSelected: effectiveWeek !== null,
    };
  }, [activeAmount, activeRate, duration, effectiveAccounts, effectiveWeek]);

  const displayPayout = results.isCycleSelected ? results.cyclePayout : results.totalPayout;
  const displayInterest = results.isCycleSelected ? results.cycleInterest : results.totalInterest;
  const principalPct = (totalInvestment / displayPayout) * 100;
  const interestPct = (displayInterest / displayPayout) * 100;

  const weeklySchedule = useMemo(() => {
    const rows: { week: number; interest: number; cumulative: number }[] = [];
    let cumulative = 0;
    const totalWeeks = results.totalWeeks;
    const step = totalWeeks > 26 ? Math.ceil(totalWeeks / 26) : 1;
    for (let w = 1; w <= totalWeeks; w++) {
      cumulative += results.weeklyPerAccount;
      if (w === totalWeeks || w % step === 0) {
        rows.push({ week: w, interest: results.weeklyPerAccount, cumulative });
      }
    }
    return rows;
  }, [results]);

  return (
    <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
      <div className="px-6 sm:px-8 pt-6 pb-2">
        <span className="inline-flex px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200/80 dark:border-blue-800/80 text-[10px] font-mono font-bold uppercase tracking-wider">
          Calculator
        </span>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-2 mb-6">
          Circle Interest Calculator
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[420px]">
        <div className="px-6 sm:px-8 pb-8">
          {circles.length > 0 && (
            <div className="mb-6">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">
                Select Circle
              </label>
              <div className="flex gap-1.5 flex-wrap mb-2">
                {circles.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCircleId(selectedCircleId === c.id ? null : c.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all whitespace-nowrap ${
                      selectedCircleId === c.id
                        ? "bg-blue-600 text-white border-blue-600 shadow-md"
                        : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-blue-400"
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
              <span className="text-[11px] text-slate-400">
                Pick a circle to calculate interest for, or use the default
              </span>
            </div>
          )}

          <div className="mb-6">
            <div className="flex justify-between items-baseline mb-2">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400">
                Circle Amount (per account)
              </label>
              <span className="text-lg font-bold font-mono text-blue-600">
                {formatNaira(activeAmount)}
              </span>
            </div>
            <div className="px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
              <span className="text-[11px] text-slate-400">
                {selectedCircle ? `${selectedCircle.name} deposit amount` : "Fixed deposit amount per circle account"}
              </span>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">
              Duration
            </label>
            <div className="flex gap-1.5 flex-wrap">
              {DURATION_PRESETS.map((d) => (
                <button
                  key={d}
                  onClick={() => setDuration(d)}
                  className={`px-5 py-2 rounded-xl text-xs font-bold border transition-all whitespace-nowrap ${
                    duration === d
                      ? "bg-blue-600 text-white border-blue-600 shadow-md"
                      : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-blue-400"
                  }`}
                >
                  {formatDuration(d)}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">
              Number of Accounts
            </label>
            <div className="flex gap-1.5 flex-wrap mb-3">
              {ACCOUNT_PRESETS.map((a) => (
                <button
                  key={a}
                  onClick={() => { setAccounts(a); setCustomAccounts(""); }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all whitespace-nowrap ${
                    !customAccounts && accounts === a
                      ? "bg-blue-600 text-white border-blue-600 shadow-md"
                      : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-blue-400"
                  }`}
                >
                  {a}
                </button>
              ))}
              <button
                onClick={() => setCustomAccounts(customAccounts ? "" : "3")}
                className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all whitespace-nowrap ${
                  !!customAccounts
                    ? "bg-blue-600 text-white border-blue-600 shadow-md"
                    : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-blue-400"
                }`}
              >
                Custom
              </button>
            </div>
            {customAccounts !== "" && (
              <div className="flex items-center gap-2">
                <input type="number" value={customAccounts} onChange={(e) => setCustomAccounts(e.target.value)} min="1" max="50"
                  className="w-20 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-[13px] outline-none box-border text-center font-mono focus:ring-2 focus:ring-blue-500" />
                <span className="text-xs text-slate-400">accounts (1-50)</span>
              </div>
            )}
          </div>

          <div className="mb-6">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">
              Interest Calculation Cycle
            </label>
            <div className="flex gap-1.5 flex-wrap mb-2">
              {CYCLE_PRESETS.filter((c) => c <= totalWeeks).map((c) => (
                <button
                  key={c}
                  onClick={() => setSelectedWeek(selectedWeek === c ? null : c)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all whitespace-nowrap ${
                    selectedWeek === c
                      ? "bg-blue-600 text-white border-blue-600 shadow-md"
                      : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-blue-400"
                  }`}
                >
                  Week {c}
                </button>
              ))}
              <button
                onClick={() => setSelectedWeek(null)}
                className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all whitespace-nowrap ${
                  selectedWeek === null
                    ? "bg-blue-600 text-white border-blue-600 shadow-md"
                    : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-blue-400"
                }`}
              >
                Full
              </button>
            </div>
            <span className="text-[11px] text-slate-400">
              Select a cycle to see interest at that point, or view full duration
            </span>
          </div>

          <button
            onClick={() => { onSelectConfig?.(activeAmount, duration, effectiveAccounts, selectedCircleId); }}
            className="w-full py-3 rounded-xl text-[13px] font-bold cursor-pointer border-none transition-all btn-primary"
          >
            Open {effectiveAccounts} Circle Account{effectiveAccounts > 1 ? "s" : ""}
          </button>
        </div>

        <div className="px-6 sm:px-8 pb-8 flex flex-col">
          <div className="flex-1 flex flex-col justify-center">
            <div className="text-center mb-6">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.05em] mb-1.5">
                {results.isCycleSelected ? `After ${results.cycleWeeks} Week${results.cycleWeeks !== 1 ? "s" : ""}` : "Maturity Payout"}
              </span>
              <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
                {formatNaira(displayPayout)}
              </span>
            </div>

            <div className="flex gap-6 justify-center mb-5">
              <div className="text-center">
                <span className="block text-[10px] text-slate-400 mb-0.5">You Invest</span>
                <span className="text-sm font-bold font-mono text-slate-900 dark:text-white">{formatNaira(totalInvestment)}</span>
              </div>
              <div className="w-px bg-slate-200 dark:bg-slate-700" />
              <div className="text-center">
                <span className="block text-[10px] text-slate-400 mb-0.5">You Earn</span>
                <span className="text-sm font-bold font-mono text-emerald-500">{formatNaira(displayInterest)}</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-8 mb-4">
              <div className="relative w-20 h-20">
                <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
                  <path className="fill-none stroke-slate-200 dark:stroke-slate-800" strokeWidth="3" d="M18 2.0845a16 16 0 0 1 0 31.832a16 16 0 0 1 0-31.832" />
                  <path className="fill-none stroke-blue-600" strokeWidth="3" strokeDasharray={`${principalPct} 100`} strokeLinecap="round" d="M18 2.0845a16 16 0 0 1 0 31.832" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-[10px] font-bold text-slate-600 dark:text-slate-400">Principal</div>
                </div>
              </div>
              <div className="relative w-20 h-20">
                <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
                  <path className="fill-none stroke-slate-200 dark:stroke-slate-800" strokeWidth="3" d="M18 2.0845a16 16 0 0 1 0 31.832a16 16 0 0 1 0-31.832" />
                  <path className="fill-none stroke-emerald-500" strokeWidth="3" strokeDasharray={`${interestPct} 100`} strokeLinecap="round" d="M18 2.0845a16 16 0 0 1 0 31.832" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-[10px] font-bold text-slate-600 dark:text-slate-400">Interest</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-[11px] text-slate-500 dark:text-slate-400 mb-3">
              <div className="flex justify-between">
                <span>Duration</span>
                <span className="font-bold text-slate-900 dark:text-white">{formatDuration(duration)}</span>
              </div>
              <div className="flex justify-between">
                <span>Rate</span>
                <span className="font-bold text-slate-900 dark:text-white">{activeRate}% p.a.</span>
              </div>
              <div className="flex justify-between">
                <span>Accounts</span>
                <span className="font-bold text-slate-900 dark:text-white">{effectiveAccounts}</span>
              </div>
              <div className="flex justify-between">
                <span>Weekly</span>
                <span className="font-bold text-emerald-500 font-mono">{formatNaira(results.weeklyPerAccount)}</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800/60 dark:to-slate-900/60 border border-slate-200/80 dark:border-slate-700/80">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Total Investment</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{formatNaira(totalInvestment)}</span>
              </div>
              <div className="flex justify-between text-xs mt-1">
                <span className="text-slate-500">{results.isCycleSelected ? `Interest (${results.cycleWeeks} weeks)` : "Total Interest"}</span>
                <span className="font-mono font-bold text-emerald-500">{formatNaira(results.isCycleSelected ? results.cycleInterest : results.totalInterest)}</span>
              </div>
              {results.isCycleSelected && (
                <div className="flex justify-between text-xs mt-1">
                  <span className="text-slate-500">Maturity Value</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{formatNaira(results.totalPayout)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {weeklySchedule.length > 0 && (
        <FadeInUp>
          <div className="border-t border-slate-200 dark:border-slate-800 px-6 sm:px-8 py-6">
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-3">
              Interest Growth Schedule ({weeklySchedule.length} intervals)
            </h3>
            <div className="max-h-[280px] overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700">
              <table className="w-full text-[12px] border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/80 dark:border-slate-800/80 font-mono text-[9px] uppercase tracking-[0.1em] text-slate-400 dark:text-slate-500">
                    {["Week", "Weekly Interest", "Cumulative Interest"].map((h) => (
                      <th key={h} className="px-4 py-3 text-right font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {weeklySchedule.map((row) => (
                    <tr key={row.week} className="border-b border-slate-100 dark:border-slate-800/50 transition-colors duration-150 hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-3 text-right font-mono text-slate-400">{row.week}</td>
                      <td className="px-4 py-3 text-right font-mono font-medium text-emerald-500">{formatNaira(row.interest)}</td>
                      <td className="px-4 py-3 text-right font-mono text-slate-900 dark:text-white">{formatNaira(row.cumulative)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </FadeInUp>
      )}
    </div>
  );
}
