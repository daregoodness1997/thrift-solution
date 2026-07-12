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
    <div style={{ borderRadius: "1rem", backgroundColor: "#111111", border: "1px solid #2A2A2A", overflow: "hidden" }}>
      <div style={{ padding: "1.5rem 2rem 0.5rem" }}>
        <div style={{ display: "inline-flex", padding: "0.25rem 0.75rem", borderRadius: "9999px", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: cfg.colors.primary, backgroundColor: `${cfg.colors.primary}18`, border: `1px solid ${cfg.colors.primary}30` }}>Calculator</div>
        <h2 style={{ fontSize: "1.125rem", fontWeight: 600, color: "#ffffff", marginTop: "0.5rem", marginBottom: "1.5rem" }}>Loan Calculator</h2>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", minHeight: "420px" }}>
        <div style={{ padding: "0 2rem 2rem" }}>
          <div style={{ marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.5rem" }}>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "#A0A0A0" }}>Loan Amount</label>
              <span style={{ fontSize: "18px", fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: cfg.colors.primary }}>{formatNaira(amount)}</span>
            </div>
            <div style={{ position: "relative", height: "32px", display: "flex", alignItems: "center" }}>
              <div style={{ position: "absolute", left: 0, right: 0, height: "4px", borderRadius: "2px", backgroundColor: "#2A2A2A" }}>
                <div style={{ width: `${sliderPct}%`, height: "100%", borderRadius: "2px", background: `linear-gradient(90deg, ${cfg.colors.primary}, ${cfg.colors.primary}cc)` }} />
              </div>
              <input type="range" min={MIN_AMOUNT} max={MAX_AMOUNT} step={50000} value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                style={{ position: "absolute", left: 0, width: "100%", height: "32px", appearance: "none", background: "transparent", cursor: "pointer", margin: 0, zIndex: 1 }}
              />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#666666", fontFamily: "'JetBrains Mono', monospace", marginTop: "-0.25rem" }}>
              <span>{formatNaira(MIN_AMOUNT)}</span>
              <span>{formatNaira(MAX_AMOUNT)}</span>
            </div>
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#A0A0A0", marginBottom: "0.5rem" }}>Repayment Term</label>
            <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
              {TERM_PRESETS.map((t) => (
                <button key={t} onClick={() => { setTerm(t); setCustomTerm(""); }}
                  style={{ padding: "0.5rem 0.875rem", borderRadius: "9999px", fontSize: "11px", fontWeight: 600, border: "1.5px solid", cursor: "pointer", transition: "all 0.15s ease", backgroundColor: !customTerm && term === t ? cfg.colors.primary : "#1A1A1A", color: !customTerm && term === t ? "#ffffff" : "#777777", borderColor: !customTerm && term === t ? cfg.colors.primary : "#333333" }}>
                  {formatTerm(t)}
                </button>
              ))}
              <button onClick={() => setCustomTerm(customTerm ? "" : "12")}
                style={{ padding: "0.5rem 0.875rem", borderRadius: "9999px", fontSize: "11px", fontWeight: 600, border: "1.5px solid", cursor: "pointer", transition: "all 0.15s ease", backgroundColor: !!customTerm ? cfg.colors.primary : "#1A1A1A", color: !!customTerm ? "#ffffff" : "#777777", borderColor: !!customTerm ? cfg.colors.primary : "#333333" }}>
                Custom
              </button>
            </div>
            {customTerm !== "" && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <input type="number" value={customTerm} onChange={(e) => setCustomTerm(e.target.value)} min="1" max="60"
                  style={{ width: "80px", padding: "0.5rem 0.75rem", borderRadius: "0.75rem", border: "1px solid #333333", backgroundColor: "#1A1A1A", color: "#ffffff", fontSize: "13px", outline: "none", boxSizing: "border-box", textAlign: "center", fontFamily: "'JetBrains Mono', monospace" }} />
                <span style={{ fontSize: "12px", color: "#666666" }}>months (1-60)</span>
              </div>
            )}
          </div>

          <button onClick={() => onRequestLoan?.(amount, effectiveTerm)} disabled={disabled || !results}
            style={{ width: "100%", padding: "0.75rem", borderRadius: "9999px", fontSize: "13px", fontWeight: 600, cursor: disabled || !results ? "not-allowed" : "pointer", backgroundColor: disabled || !results ? "#333333" : cfg.colors.primary, color: disabled || !results ? "#666666" : "#ffffff", border: "none", transition: "all 0.15s" }}>
            {disabled ? "Active Loan Exists" : "Request This Loan"}
          </button>
        </div>

        <div style={{ padding: "0 2rem 2rem 0", display: "flex", flexDirection: "column" }}>
          {results ? (
            <>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
                  <span style={{ display: "block", fontSize: "10px", fontWeight: 600, color: "#666666", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.375rem" }}>Monthly Payment</span>
                  <span style={{ fontSize: "2rem", fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: "#ffffff" }}>{formatNaira(results.monthly)}</span>
                </div>

                <div style={{ display: "flex", gap: "1.5rem", justifyContent: "center", marginBottom: "1.5rem" }}>
                  <div style={{ textAlign: "center" }}><span style={{ display: "block", fontSize: "10px", color: "#666666", marginBottom: "0.125rem" }}>You Borrow</span><span style={{ fontSize: "14px", fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", color: "#E0E0E0" }}>{formatNaira(amount)}</span></div>
                  <div style={{ width: "1px", backgroundColor: "#2A2A2A" }} />
                  <div style={{ textAlign: "center" }}><span style={{ display: "block", fontSize: "10px", color: "#666666", marginBottom: "0.125rem" }}>Interest</span><span style={{ fontSize: "14px", fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", color: "#F59E0B" }}>{formatNaira(results.interest)}</span></div>
                </div>

                <div style={{ height: "8px", borderRadius: "4px", backgroundColor: "#222222", display: "flex", overflow: "hidden", marginBottom: "1.25rem" }}>
                  <div style={{ width: `${results.principalPct}%`, backgroundColor: cfg.colors.primary, transition: "width 0.3s" }} />
                  <div style={{ width: `${results.interestPct}%`, backgroundColor: "#F59E0B", transition: "width 0.3s" }} />
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#777777", marginBottom: "1rem" }}>
                  <span>{results.principalPct.toFixed(1)}% Principal</span>
                  <span>{results.interestPct.toFixed(1)}% Interest</span>
                </div>

                <div style={{ padding: "1rem", borderRadius: "0.75rem", backgroundColor: "#1A1A1A", border: "1px solid #2A2A2A" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "0.5rem" }}><span style={{ color: "#666666" }}>Total Repayment</span><span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: "#E0E0E0" }}>{formatNaira(results.total)}</span></div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "0.5rem" }}><span style={{ color: "#666666" }}>Loan Term</span><span style={{ fontWeight: 600, color: "#E0E0E0" }}>{formatTerm(effectiveTerm)}</span></div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}><span style={{ color: "#666666" }}>Interest Rate</span><span style={{ fontWeight: 600, color: "#E0E0E0" }}>5% APR</span></div>
                </div>
              </div>

              <div style={{ marginTop: "1rem" }}>
                <button onClick={() => setShowAmortization(!showAmortization)}
                  style={{ width: "100%", padding: "0.5rem", borderRadius: "0.5rem", fontSize: "11px", fontWeight: 600, cursor: "pointer", backgroundColor: "transparent", color: "#777777", border: "1px solid #333333", transition: "all 0.15s" }}>
                  {showAmortization ? "Hide" : "Show"} Amortization Schedule
                </button>
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <p style={{ fontSize: "13px", color: "#555555" }}>Adjust the slider to see your loan breakdown</p>
            </div>
          )}
        </div>
      </div>

      {showAmortization && amortization.length > 0 && (
        <FadeInUp>
          <div style={{ borderTop: "1px solid #2A2A2A", padding: "1.5rem 2rem" }}>
            <h3 style={{ fontSize: "12px", fontWeight: 600, color: "#E0E0E0", marginBottom: "0.75rem" }}>Amortization Schedule ({amortization.length} payments)</h3>
            <div style={{ maxHeight: "280px", overflowY: "auto", borderRadius: "0.5rem", border: "1px solid #2A2A2A" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
                <thead style={{ position: "sticky", top: 0, zIndex: 1 }}>
                  <tr style={{ backgroundColor: "#1A1A1A" }}>
                    {["#", "Payment", "Principal", "Interest", "Balance"].map((h) => (
                      <th key={h} style={{ padding: "0.625rem 0.75rem", textAlign: "right", fontWeight: 600, color: "#777777", borderBottom: "1px solid #2A2A2A" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {amortization.map((row) => (
                    <tr key={row.month} style={{ backgroundColor: row.month % 2 === 0 ? "#161616" : "#111111" }}>
                      <td style={{ padding: "0.5rem 0.75rem", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", color: "#555555" }}>{row.month}</td>
                      <td style={{ padding: "0.5rem 0.75rem", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontWeight: 500, color: "#E0E0E0" }}>{formatNaira(row.payment)}</td>
                      <td style={{ padding: "0.5rem 0.75rem", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", color: cfg.colors.primary }}>{formatNaira(row.principal)}</td>
                      <td style={{ padding: "0.5rem 0.75rem", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", color: "#F59E0B" }}>{formatNaira(row.interest)}</td>
                      <td style={{ padding: "0.5rem 0.75rem", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", color: "#777777" }}>{formatNaira(row.balance)}</td>
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
