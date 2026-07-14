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
  onSelectConfig?: (amount: number, durationMonths: number, accounts: number) => void;
}

function calcWeeklyInterest(principal: number, annualRatePct: number): number {
  return principal * (annualRatePct / 100) / 52;
}

function formatDuration(months: number) {
  if (months < 12) return `${months} months`;
  const y = Math.floor(months / 12);
  const m = months % 12;
  if (m === 0) return `${y} year${y !== 1 ? "s" : ""}`;
  return `${y}y ${m}mo`;
}

export function CircleCalculator({ circleAmount = 10000, annualRate = 10, circles = [], onSelectConfig }: CircleCalculatorProps) {
  const cfg: BrandConfig = config;
  const [selectedCircleId, setSelectedCircleId] = useState<string | null>(null);
  const [duration, setDuration] = useState(12);
  const [accounts, setAccounts] = useState(1);
  const [customAccounts, setCustomAccounts] = useState("");
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);

  const selectedCircle = circles.find((c) => c.id === selectedCircleId) ?? null;
  const activeAmount = selectedCircle ? selectedCircle.amount : circleAmount;
  const activeRate = selectedCircle ? selectedCircle.interestRateAnnual : annualRate;

  const effectiveAccounts = customAccounts ? Math.max(1, Math.min(50, parseInt(customAccounts) || 1)) : accounts;
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
    <div style={{ borderRadius: "1rem", backgroundColor: "#111111", border: "1px solid #2A2A2A", overflow: "hidden" }}>
      <div style={{ padding: "1.5rem 2rem 0.5rem" }}>
        <div style={{ display: "inline-flex", padding: "0.25rem 0.75rem", borderRadius: "9999px", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: cfg.colors.primary, backgroundColor: `${cfg.colors.primary}18`, border: `1px solid ${cfg.colors.primary}30` }}>Calculator</div>
        <h2 style={{ fontSize: "1.125rem", fontWeight: 600, color: "#ffffff", marginTop: "0.5rem", marginBottom: "1.5rem" }}>Circle Interest Calculator</h2>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", minHeight: "420px" }}>
        <div style={{ padding: "0 2rem 2rem" }}>
          {circles.length > 0 && (
            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#A0A0A0", marginBottom: "0.5rem" }}>Select Circle</label>
              <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap", marginBottom: "0.5rem" }}>
                {circles.map((c) => (
                  <button key={c.id} onClick={() => setSelectedCircleId(selectedCircleId === c.id ? null : c.id)}
                    style={{ padding: "0.5rem 1rem", borderRadius: "9999px", fontSize: "12px", fontWeight: 600, border: "1.5px solid", cursor: "pointer", transition: "all 0.15s ease", backgroundColor: selectedCircleId === c.id ? cfg.colors.primary : "#1A1A1A", color: selectedCircleId === c.id ? "#ffffff" : "#777777", borderColor: selectedCircleId === c.id ? cfg.colors.primary : "#333333", whiteSpace: "nowrap" }}>
                    {c.name}
                  </button>
                ))}
              </div>
              <span style={{ fontSize: "11px", color: "#555555" }}>Pick a circle to calculate interest for, or use the default</span>
            </div>
          )}

          <div style={{ marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.5rem" }}>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "#A0A0A0" }}>Circle Amount (per account)</label>
              <span style={{ fontSize: "18px", fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: cfg.colors.primary }}>{formatNaira(activeAmount)}</span>
            </div>
            <div style={{ padding: "0.75rem 1rem", borderRadius: "0.75rem", backgroundColor: "#1A1A1A", border: "1px solid #2A2A2A" }}>
              <span style={{ fontSize: "11px", color: "#666666" }}>{selectedCircle ? `${selectedCircle.name} deposit amount` : "Fixed deposit amount per circle account"}</span>
            </div>
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#A0A0A0", marginBottom: "0.5rem" }}>Duration</label>
            <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap" }}>
              {DURATION_PRESETS.map((d) => (
                <button key={d} onClick={() => setDuration(d)}
                  style={{ padding: "0.5rem 1.25rem", borderRadius: "9999px", fontSize: "12px", fontWeight: 600, border: "1.5px solid", cursor: "pointer", transition: "all 0.15s ease", backgroundColor: duration === d ? cfg.colors.primary : "#1A1A1A", color: duration === d ? "#ffffff" : "#777777", borderColor: duration === d ? cfg.colors.primary : "#333333" }}>
                  {formatDuration(d)}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#A0A0A0", marginBottom: "0.5rem" }}>Number of Accounts</label>
            <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
              {ACCOUNT_PRESETS.map((a) => (
                <button key={a} onClick={() => { setAccounts(a); setCustomAccounts(""); }}
                  style={{ padding: "0.5rem 1rem", borderRadius: "9999px", fontSize: "12px", fontWeight: 600, border: "1.5px solid", cursor: "pointer", transition: "all 0.15s ease", backgroundColor: !customAccounts && accounts === a ? cfg.colors.primary : "#1A1A1A", color: !customAccounts && accounts === a ? "#ffffff" : "#777777", borderColor: !customAccounts && accounts === a ? cfg.colors.primary : "#333333" }}>
                  {a}
                </button>
              ))}
              <button onClick={() => setCustomAccounts(customAccounts ? "" : "3")}
                style={{ padding: "0.5rem 1rem", borderRadius: "9999px", fontSize: "12px", fontWeight: 600, border: "1.5px solid", cursor: "pointer", transition: "all 0.15s ease", backgroundColor: !!customAccounts ? cfg.colors.primary : "#1A1A1A", color: !!customAccounts ? "#ffffff" : "#777777", borderColor: !!customAccounts ? cfg.colors.primary : "#333333" }}>
                Custom
              </button>
            </div>
            {customAccounts !== "" && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <input type="number" value={customAccounts} onChange={(e) => setCustomAccounts(e.target.value)} min="1" max="50"
                  style={{ width: "80px", padding: "0.5rem 0.75rem", borderRadius: "0.75rem", border: "1px solid #333333", backgroundColor: "#1A1A1A", color: "#ffffff", fontSize: "13px", outline: "none", boxSizing: "border-box", textAlign: "center", fontFamily: "'JetBrains Mono', monospace" }} />
                <span style={{ fontSize: "12px", color: "#666666" }}>accounts (1-50)</span>
              </div>
            )}
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#A0A0A0", marginBottom: "0.5rem" }}>Interest Calculation Cycle</label>
            <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap", marginBottom: "0.5rem" }}>
              {CYCLE_PRESETS.filter((c) => c <= totalWeeks).map((c) => (
                <button key={c} onClick={() => setSelectedWeek(selectedWeek === c ? null : c)}
                  style={{ padding: "0.5rem 1rem", borderRadius: "9999px", fontSize: "12px", fontWeight: 600, border: "1.5px solid", cursor: "pointer", transition: "all 0.15s ease", backgroundColor: selectedWeek === c ? cfg.colors.primary : "#1A1A1A", color: selectedWeek === c ? "#ffffff" : "#777777", borderColor: selectedWeek === c ? cfg.colors.primary : "#333333" }}>
                  Week {c}
                </button>
              ))}
              <button onClick={() => setSelectedWeek(null)}
                style={{ padding: "0.5rem 1rem", borderRadius: "9999px", fontSize: "12px", fontWeight: 600, border: "1.5px solid", cursor: "pointer", transition: "all 0.15s ease", backgroundColor: selectedWeek === null ? cfg.colors.primary : "#1A1A1A", color: selectedWeek === null ? "#ffffff" : "#777777", borderColor: selectedWeek === null ? cfg.colors.primary : "#333333" }}>
                Full
              </button>
            </div>
            <span style={{ fontSize: "11px", color: "#555555" }}>Select a cycle to see interest at that point, or view full duration</span>
          </div>

          <button onClick={() => onSelectConfig?.(activeAmount, duration, effectiveAccounts)}
            style={{ width: "100%", padding: "0.75rem", borderRadius: "9999px", fontSize: "13px", fontWeight: 600, cursor: "pointer", backgroundColor: cfg.colors.primary, color: "#ffffff", border: "none", transition: "all 0.15s" }}>
            Open {effectiveAccounts} Circle Account{effectiveAccounts > 1 ? "s" : ""}
          </button>
        </div>

        <div style={{ padding: "0 2rem 2rem 0", display: "flex", flexDirection: "column" }}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
              <span style={{ display: "block", fontSize: "10px", fontWeight: 600, color: "#666666", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.375rem" }}>{results.isCycleSelected ? `After ${results.cycleWeeks} Week${results.cycleWeeks !== 1 ? "s" : ""}` : "Maturity Payout"}</span>
              <span style={{ fontSize: "2rem", fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: "#ffffff" }}>{formatNaira(displayPayout)}</span>
            </div>

            <div style={{ display: "flex", gap: "1.5rem", justifyContent: "center", marginBottom: "1.5rem" }}>
              <div style={{ textAlign: "center" }}><span style={{ display: "block", fontSize: "10px", color: "#666666", marginBottom: "0.125rem" }}>You Invest</span><span style={{ fontSize: "14px", fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", color: "#E0E0E0" }}>{formatNaira(totalInvestment)}</span></div>
              <div style={{ width: "1px", backgroundColor: "#2A2A2A" }} />
              <div style={{ textAlign: "center" }}><span style={{ display: "block", fontSize: "10px", color: "#666666", marginBottom: "0.125rem" }}>You Earn</span><span style={{ fontSize: "14px", fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", color: "#10B981" }}>{formatNaira(displayInterest)}</span></div>
            </div>

            <div style={{ height: "8px", borderRadius: "4px", backgroundColor: "#222222", display: "flex", overflow: "hidden", marginBottom: "1.25rem" }}>
              <div style={{ width: `${principalPct}%`, backgroundColor: cfg.colors.primary, transition: "width 0.3s" }} />
              <div style={{ width: `${interestPct}%`, backgroundColor: "#10B981", transition: "width 0.3s" }} />
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#777777", marginBottom: "1rem" }}>
              <span>{principalPct.toFixed(1)}% Principal</span>
              <span>{interestPct.toFixed(1)}% Interest</span>
            </div>

            <div style={{ padding: "1rem", borderRadius: "0.75rem", backgroundColor: "#1A1A1A", border: "1px solid #2A2A2A" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "0.5rem" }}><span style={{ color: "#666666" }}>Weekly Interest (per account)</span><span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: "#10B981" }}>{formatNaira(results.weeklyPerAccount)}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "0.5rem" }}><span style={{ color: "#666666" }}>{results.isCycleSelected ? `Interest (${results.cycleWeeks} weeks)` : "Total Interest (all accounts)"}</span><span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: "#10B981" }}>{formatNaira(results.isCycleSelected ? results.cycleInterest : results.totalInterest)}</span></div>
              {results.isCycleSelected && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "0.5rem" }}><span style={{ color: "#666666" }}>At Maturity ({results.totalWeeks} weeks)</span><span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: "#E0E0E0" }}>{formatNaira(results.totalInterest)}</span></div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "0.5rem" }}><span style={{ color: "#666666" }}>Duration</span><span style={{ fontWeight: 600, color: "#E0E0E0" }}>{formatDuration(duration)}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "0.5rem" }}><span style={{ color: "#666666" }}>Interest Rate</span><span style={{ fontWeight: 600, color: "#E0E0E0" }}>{activeRate}% p.a.</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}><span style={{ color: "#666666" }}>Accounts</span><span style={{ fontWeight: 600, color: "#E0E0E0" }}>{effectiveAccounts}</span></div>
            </div>
          </div>
        </div>
      </div>

      {weeklySchedule.length > 0 && (
        <FadeInUp>
          <div style={{ borderTop: "1px solid #2A2A2A", padding: "1.5rem 2rem" }}>
            <h3 style={{ fontSize: "12px", fontWeight: 600, color: "#E0E0E0", marginBottom: "0.75rem" }}>Interest Growth Schedule ({weeklySchedule.length} intervals)</h3>
            <div style={{ maxHeight: "280px", overflowY: "auto", borderRadius: "0.5rem", border: "1px solid #2A2A2A" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
                <thead style={{ position: "sticky", top: 0, zIndex: 1 }}>
                  <tr style={{ backgroundColor: "#1A1A1A" }}>
                    {["Week", "Weekly Interest", "Cumulative Interest"].map((h) => (
                      <th key={h} style={{ padding: "0.625rem 0.75rem", textAlign: "right", fontWeight: 600, color: "#777777", borderBottom: "1px solid #2A2A2A" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {weeklySchedule.map((row) => (
                    <tr key={row.week} style={{ backgroundColor: row.week % 2 === 0 ? "#161616" : "#111111" }}>
                      <td style={{ padding: "0.5rem 0.75rem", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", color: "#555555" }}>{row.week}</td>
                      <td style={{ padding: "0.5rem 0.75rem", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontWeight: 500, color: "#10B981" }}>{formatNaira(row.interest)}</td>
                      <td style={{ padding: "0.5rem 0.75rem", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", color: "#E0E0E0" }}>{formatNaira(row.cumulative)}</td>
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
