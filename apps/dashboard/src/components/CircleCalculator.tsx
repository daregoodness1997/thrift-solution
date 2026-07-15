"use client";

import { useState, useMemo } from "react";
import { config, BrandConfig } from "@thrift/config";
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
  const cfg: BrandConfig = config;
  const [selectedCircleId, setSelectedCircleId] = useState<string | null>(null);
  const [duration, setDuration] = useState(12);
  const [accounts, setAccounts] = useState(1);
  const [customAccounts, setCustomAccounts] = useState("");
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);

  const selectedCircle = circles.find((c) => c.id === selectedCircleId) ?? null;
  const activeAmount = selectedCircle ? selectedCircle.amount : circleAmount;
  const activeRate = selectedCircle
    ? selectedCircle.interestRateAnnual
    : annualRate;

  const effectiveAccounts = customAccounts
    ? Math.max(1, Math.min(50, parseInt(customAccounts) || 1))
    : accounts;
  const totalInvestment = activeAmount * effectiveAccounts;

  const totalWeeks = Math.round((duration / 12) * 52);
  const effectiveWeek =
    selectedWeek !== null ? Math.min(selectedWeek, totalWeeks) : null;

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

  const displayPayout = results.isCycleSelected
    ? results.cyclePayout
    : results.totalPayout;
  const displayInterest = results.isCycleSelected
    ? results.cycleInterest
    : results.totalInterest;
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
    <div className="rounded-2xl bg-[#111111] border border-[#2A2A2A] overflow-hidden">
      <div className="px-8 pt-6 pb-2">
        <div
          className="inline-flex px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.05em]"
          style={{
            color: cfg.colors.primary,
            backgroundColor: `${cfg.colors.primary}18`,
            border: `1px solid ${cfg.colors.primary}30`,
          }}
        >
          Calculator
        </div>
        <h2 className="font-display tracking-tight text-lg font-semibold text-white mt-2 mb-6">
          Circle Interest Calculator
        </h2>
      </div>

      <div className="grid grid-cols-2 min-h-[420px]">
        <div className="px-8 pb-8">
          {circles.length > 0 && (
            <div className="mb-6">
              <label className="block text-xs font-semibold text-[#A0A0A0] mb-2">
                Select Circle
              </label>
              <div className="flex gap-1.5 flex-wrap mb-2">
                {circles.map((c) => (
                  <button
                    key={c.id}
                    onClick={() =>
                      setSelectedCircleId(
                        selectedCircleId === c.id ? null : c.id,
                      )
                    }
                    className="px-4 py-2 rounded-full text-xs font-semibold border-[1.5px] cursor-pointer transition-all duration-150 whitespace-nowrap"
                    style={{
                      backgroundColor:
                        selectedCircleId === c.id
                          ? cfg.colors.primary
                          : "#1A1A1A",
                      color: selectedCircleId === c.id ? "#ffffff" : "#777777",
                      borderColor:
                        selectedCircleId === c.id
                          ? cfg.colors.primary
                          : "#333333",
                    }}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
              <span className="text-[11px] text-[#555555]">
                Pick a circle to calculate interest for, or use the default
              </span>
            </div>
          )}

          <div className="mb-6">
            <div className="flex justify-between items-baseline mb-2">
              <label className="text-xs font-semibold text-[#A0A0A0]">
                Circle Amount (per account)
              </label>
              <span
                className="text-lg font-bold font-mono"
                style={{ color: cfg.colors.primary }}
              >
                {formatNaira(activeAmount)}
              </span>
            </div>
            <div className="px-4 py-3 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A]">
              <span className="text-[11px] text-[#666666]">
                {selectedCircle
                  ? `${selectedCircle.name} deposit amount`
                  : "Fixed deposit amount per circle account"}
              </span>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-xs font-semibold text-[#A0A0A0] mb-2">
              Duration
            </label>
            <div className="flex gap-1.5 flex-wrap">
              {DURATION_PRESETS.map((d) => (
                <button
                  key={d}
                  onClick={() => setDuration(d)}
                  className="px-5 py-2 rounded-full text-xs font-semibold border-[1.5px] cursor-pointer transition-all duration-150 whitespace-nowrap"
                  style={{
                    backgroundColor:
                      duration === d ? cfg.colors.primary : "#1A1A1A",
                    color: duration === d ? "#ffffff" : "#777777",
                    borderColor:
                      duration === d ? cfg.colors.primary : "#333333",
                  }}
                >
                  {formatDuration(d)}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-xs font-semibold text-[#A0A0A0] mb-2">
              Number of Accounts
            </label>
            <div className="flex gap-1.5 flex-wrap mb-3">
              {ACCOUNT_PRESETS.map((a) => (
                <button
                  key={a}
                  onClick={() => {
                    setAccounts(a);
                    setCustomAccounts("");
                  }}
                  className="px-4 py-2 rounded-full text-xs font-semibold border-[1.5px] cursor-pointer transition-all duration-150 whitespace-nowrap"
                  style={{
                    backgroundColor:
                      !customAccounts && accounts === a
                        ? cfg.colors.primary
                        : "#1A1A1A",
                    color:
                      !customAccounts && accounts === a ? "#ffffff" : "#777777",
                    borderColor:
                      !customAccounts && accounts === a
                        ? cfg.colors.primary
                        : "#333333",
                  }}
                >
                  {a}
                </button>
              ))}
              <button
                onClick={() => setCustomAccounts(customAccounts ? "" : "3")}
                className="px-4 py-2 rounded-full text-xs font-semibold border-[1.5px] cursor-pointer transition-all duration-150 whitespace-nowrap"
                style={{
                  backgroundColor: !!customAccounts
                    ? cfg.colors.primary
                    : "#1A1A1A",
                  color: !!customAccounts ? "#ffffff" : "#777777",
                  borderColor: !!customAccounts
                    ? cfg.colors.primary
                    : "#333333",
                }}
              >
                Custom
              </button>
            </div>
            {customAccounts !== "" && (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={customAccounts}
                  onChange={(e) => setCustomAccounts(e.target.value)}
                  min="1"
                  max="50"
                  className="w-20 px-3 py-2 rounded-xl border border-[#333333] bg-[#1A1A1A] text-white text-[13px] outline-none box-border text-center font-mono"
                />
                <span className="text-xs text-[#666666]">accounts (1-50)</span>
              </div>
            )}
          </div>

          <div className="mb-6">
            <label className="block text-xs font-semibold text-[#A0A0A0] mb-2">
              Interest Calculation Cycle
            </label>
            <div className="flex gap-1.5 flex-wrap mb-2">
              {CYCLE_PRESETS.filter((c) => c <= totalWeeks).map((c) => (
                <button
                  key={c}
                  onClick={() => setSelectedWeek(selectedWeek === c ? null : c)}
                  className="px-4 py-2 rounded-full text-xs font-semibold border-[1.5px] cursor-pointer transition-all duration-150 whitespace-nowrap"
                  style={{
                    backgroundColor:
                      selectedWeek === c ? cfg.colors.primary : "#1A1A1A",
                    color: selectedWeek === c ? "#ffffff" : "#777777",
                    borderColor:
                      selectedWeek === c ? cfg.colors.primary : "#333333",
                  }}
                >
                  Week {c}
                </button>
              ))}
              <button
                onClick={() => setSelectedWeek(null)}
                className="px-4 py-2 rounded-full text-xs font-semibold border-[1.5px] cursor-pointer transition-all duration-150 whitespace-nowrap"
                style={{
                  backgroundColor:
                    selectedWeek === null ? cfg.colors.primary : "#1A1A1A",
                  color: selectedWeek === null ? "#ffffff" : "#777777",
                  borderColor:
                    selectedWeek === null ? cfg.colors.primary : "#333333",
                }}
              >
                Full
              </button>
            </div>
            <span className="text-[11px] text-[#555555]">
              Select a cycle to see interest at that point, or view full
              duration
            </span>
          </div>

          <button
            onClick={() => {
              onSelectConfig?.(activeAmount, duration, effectiveAccounts, selectedCircleId);
            }}
            className="w-full py-3 rounded-full text-[13px] font-semibold cursor-pointer border-none transition-all duration-150"
            style={{ backgroundColor: cfg.colors.primary, color: "#ffffff" }}
          >
            Open {effectiveAccounts} Circle Account
            {effectiveAccounts > 1 ? "s" : ""}
          </button>
        </div>

        <div className="px-8 pb-8 flex flex-col">
          <div className="flex-1 flex flex-col justify-center">
            <div className="text-center mb-6">
              <span className="block text-[10px] font-semibold text-[#666666] uppercase tracking-[0.05em] mb-1.5">
                {results.isCycleSelected
                  ? `After ${results.cycleWeeks} Week${results.cycleWeeks !== 1 ? "s" : ""}`
                  : "Maturity Payout"}
              </span>
              <span className="text-2xl font-bold font-mono text-white">
                {formatNaira(displayPayout)}
              </span>
            </div>

            <div className="flex gap-6 justify-center mb-6">
              <div className="text-center">
                <span className="block text-[10px] text-[#666666] mb-0.5">
                  You Invest
                </span>
                <span className="text-sm font-semibold font-mono text-[#E0E0E0]">
                  {formatNaira(totalInvestment)}
                </span>
              </div>
              <div className="w-px bg-[#2A2A2A]" />
              <div className="text-center">
                <span className="block text-[10px] text-[#666666] mb-0.5">
                  You Earn
                </span>
                <span className="text-sm font-semibold font-mono text-emerald-500">
                  {formatNaira(displayInterest)}
                </span>
              </div>
            </div>

            <div className="h-2 rounded bg-[#222222] flex overflow-hidden mb-5">
              <div
                className="transition-[width] duration-300"
                style={{
                  width: `${principalPct}%`,
                  backgroundColor: cfg.colors.primary,
                }}
              />
              <div
                className="bg-emerald-500 transition-[width] duration-300"
                style={{ width: `${interestPct}%` }}
              />
            </div>

            <div className="flex justify-between text-xs text-[#777777] mb-4">
              <span>{principalPct.toFixed(1)}% Principal</span>
              <span>{interestPct.toFixed(1)}% Interest</span>
            </div>

            <div className="p-4 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A]">
              <div className="flex justify-between text-xs mb-2">
                <span className="text-[#666666]">
                  Weekly Interest (per account)
                </span>
                <span className="font-mono font-semibold text-emerald-500">
                  {formatNaira(results.weeklyPerAccount)}
                </span>
              </div>
              <div className="flex justify-between text-xs mb-2">
                <span className="text-[#666666]">
                  {results.isCycleSelected
                    ? `Interest (${results.cycleWeeks} weeks)`
                    : "Total Interest (all accounts)"}
                </span>
                <span className="font-mono font-semibold text-emerald-500">
                  {formatNaira(
                    results.isCycleSelected
                      ? results.cycleInterest
                      : results.totalInterest,
                  )}
                </span>
              </div>
              {results.isCycleSelected && (
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-[#666666]">
                    At Maturity ({results.totalWeeks} weeks)
                  </span>
                  <span className="font-mono font-semibold text-[#E0E0E0]">
                    {formatNaira(results.totalInterest)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-xs mb-2">
                <span className="text-[#666666]">Duration</span>
                <span className="font-semibold text-[#E0E0E0]">
                  {formatDuration(duration)}
                </span>
              </div>
              <div className="flex justify-between text-xs mb-2">
                <span className="text-[#666666]">Interest Rate</span>
                <span className="font-semibold text-[#E0E0E0]">
                  {activeRate}% p.a.
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#666666]">Accounts</span>
                <span className="font-semibold text-[#E0E0E0]">
                  {effectiveAccounts}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {weeklySchedule.length > 0 && (
        <FadeInUp>
          <div className="border-t border-[#2A2A2A] px-8 py-6">
            <h3 className="font-display tracking-tight text-xs font-semibold text-[#E0E0E0] mb-3">
              Interest Growth Schedule ({weeklySchedule.length} intervals)
            </h3>
            <div className="max-h-[280px] overflow-y-auto rounded-lg border border-[#2A2A2A]">
              <table className="w-full border-collapse text-[11px]">
                <thead className="sticky top-0 z-[1]">
                  <tr className="bg-[#1A1A1A]">
                    {["Week", "Weekly Interest", "Cumulative Interest"].map(
                      (h) => (
                        <th
                          key={h}
                          className="px-3 py-2.5 text-right font-semibold text-[#777777] border-b border-[#2A2A2A]"
                        >
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {weeklySchedule.map((row) => (
                    <tr
                      key={row.week}
                      style={{
                        backgroundColor:
                          row.week % 2 === 0 ? "#161616" : "#111111",
                      }}
                    >
                      <td className="px-3 py-2 text-right font-mono text-[#555555]">
                        {row.week}
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-medium text-emerald-500">
                        {formatNaira(row.interest)}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-[#E0E0E0]">
                        {formatNaira(row.cumulative)}
                      </td>
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
