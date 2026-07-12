"use client";

import { useState, useEffect, useCallback } from "react";
import { config, BrandConfig } from "@thrift/config";
import { Card, Button, ColorfulBadge, FadeIn, FadeInUp, StaggerChildren, StatCard } from "@thrift/ui";
import { formatNaira } from "@thrift/utils";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/PageHeader";
import { Skeleton, SkeletonCard } from "@/components/Skeleton";
import { LoanCalculator } from "@/components/LoanCalculator";

const fallback = config;

interface Loan {
  id: string; amount: number; interestRate: number; termMonths: number; monthlyPayment: number; totalRepayment: number;
  purpose?: string; status: string; approvedAt?: string; disbursedAt?: string; completedAt?: string; createdAt: string;
}

const STATUS_COLORS: Record<string, string> = { pending: "#D97706", approved: "#059669", disbursed: "#2563EB", completed: "#059669", rejected: "#DC2626", defaulted: "#DC2626" };
const TERM_PRESETS = [3, 6, 12, 24, 36];

export default function LoansPage() {
  const { token } = useAuth();
  const [cfg, setCfg] = useState<BrandConfig>(fallback);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState("");
  const [termMonths, setTermMonths] = useState("12");
  const [purpose, setPurpose] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [expandedLoan, setExpandedLoan] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  useEffect(() => { fetch(`${API_URL}/api/config`).then((r) => r.json()).then((d) => { if (d && d.name) setCfg((p) => ({ ...p, ...d })); }).catch(() => {}); }, [API_URL]);

  const fetchLoans = useCallback(async () => {
    if (!token) { setLoading(false); return; }
    try {
      const res = await fetch(`${API_URL}/api/loans/my`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setLoans(data.data);
    } catch {}
    setLoading(false);
  }, [token, API_URL]);

  useEffect(() => { fetchLoans(); }, [fetchLoans]);

  const activeLoan = loans.find((l) => l.status === "pending" || l.status === "approved" || l.status === "disbursed");
  const completedCount = loans.filter((l) => l.status === "completed").length;
  const totalBorrowed = loans.filter((l) => l.status === "disbursed" || l.status === "completed").reduce((sum, l) => sum + l.amount, 0);

  const handleRequestFromCalculator = (calcAmount: number, calcTerm: number) => {
    setAmount(String(calcAmount));
    setTermMonths(String(calcTerm));
    setPurpose("");
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { setError("Please enter a valid amount"); return; }
    const months = parseInt(termMonths);
    if (!months || months <= 0 || months > 60) { setError("Term must be between 1 and 60 months"); return; }
    if (activeLoan) { setError("You already have an active loan request"); return; }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/loans`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount: amt, termMonths: months, purpose: purpose.trim() || undefined }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        setAmount("");
        setTermMonths("12");
        setPurpose("");
        setShowForm(false);
        fetchLoans();
        setTimeout(() => setSuccess(false), 3000);
      } else setError(data.error || "Failed to submit loan request");
    } catch { setError("Failed to submit loan request"); }
    setSubmitting(false);
  };

  const formatTerm = (months: number) => {
    if (months < 12) return `${months}mo`;
    const y = Math.floor(months / 12);
    const m = months % 12;
    return m > 0 ? `${y}y ${m}mo` : `${y}y`;
  };

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "clamp(1rem, 3vw, 2rem)" }}>
      <PageHeader badgeLabel="Financial" heading="Low Interest" accentText="Loans" description="Access community-funded loans at just 5% annual interest rate."
        right={<Button variant="primary" size="sm" onClick={() => setShowForm(!showForm)} disabled={!!activeLoan}>{showForm ? "Cancel" : "+ Request Loan"}</Button>} />

      <StaggerChildren staggerDelay={100} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.5rem", marginBottom: "2rem" }}>
        <StatCard label="Total Borrowed" value={formatNaira(totalBorrowed)} change={`${loans.length} total loan${loans.length !== 1 ? "s" : ""}`} positive variant="default" />
        <StatCard label="Active Loan" value={activeLoan ? formatNaira(activeLoan.amount) : "None"} change={activeLoan ? activeLoan.status : "No active loan"} positive variant="warm" />
        <StatCard label="Completed" value={String(completedCount)} change={completedCount > 0 ? "Successfully repaid" : "No completed loans yet"} positive variant="default" />
      </StaggerChildren>

      <FadeInUp delay={200} style={{ marginBottom: "2rem" }}>
        <LoanCalculator onRequestLoan={handleRequestFromCalculator} disabled={!!activeLoan} />
      </FadeInUp>

      {showForm && (
        <FadeInUp>
          <Card padding="2rem" style={{ marginBottom: "1.5rem", maxWidth: "700px" }}>
            <ColorfulBadge label="Loan Request" color={cfg.colors.primary} />
            <h2 style={{ fontSize: "1.125rem", fontWeight: 500, color: "#1A1A1A", marginTop: "0.5rem", marginBottom: "1.25rem" }}>Request a Loan</h2>

            <form onSubmit={handleApply}>
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#2D2D2D", marginBottom: "0.375rem" }}>Loan Amount</label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", fontSize: "13px", color: "#999", fontFamily: "'JetBrains Mono', monospace" }}>&#8358;</span>
                  <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" step="100" min="100" style={{ width: "100%", padding: "0.625rem 0.75rem 0.625rem 2rem", borderRadius: "0.75rem", border: "1px solid #EAEAEA", fontSize: "13px", outline: "none", boxSizing: "border-box", fontFamily: "'JetBrains Mono', monospace" }} />
                </div>
              </div>

              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#2D2D2D", marginBottom: "0.375rem" }}>Repayment Term</label>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.5rem" }}>
                  {TERM_PRESETS.map((t) => (
                    <button key={t} type="button" onClick={() => setTermMonths(String(t))}
                      style={{ padding: "0.5rem 1rem", borderRadius: "9999px", fontSize: "12px", fontWeight: 600, border: "1px solid", cursor: "pointer", transition: "all 0.2s", backgroundColor: termMonths === String(t) ? cfg.colors.primary : "#ffffff", color: termMonths === String(t) ? "#ffffff" : "#717171", borderColor: termMonths === String(t) ? cfg.colors.primary : "#EAEAEA" }}>
                      {formatTerm(t)}
                    </button>
                  ))}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <input type="number" value={termMonths} onChange={(e) => setTermMonths(e.target.value)} min="1" max="60" style={{ width: "80px", padding: "0.5rem 0.75rem", borderRadius: "0.75rem", border: "1px solid #EAEAEA", fontSize: "13px", outline: "none", boxSizing: "border-box", textAlign: "center" }} />
                  <span style={{ fontSize: "12px", color: "#999" }}>months</span>
                </div>
              </div>

              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#2D2D2D", marginBottom: "0.375rem" }}>Purpose (optional)</label>
                <textarea value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="e.g. Business expansion, Education, Medical" rows={3} style={{ width: "100%", padding: "0.625rem 0.75rem", borderRadius: "0.75rem", border: "1px solid #EAEAEA", fontSize: "13px", outline: "none", boxSizing: "border-box", resize: "vertical", fontFamily: "inherit" }} />
              </div>

              {error && <div style={{ fontSize: "12px", color: "#DC2626", marginBottom: "0.75rem" }}>{error}</div>}
              {success && <div style={{ fontSize: "12px", color: "#059669", marginBottom: "0.75rem" }}>Loan request submitted!</div>}
              <Button type="submit" variant="primary" size="md" disabled={submitting || !!activeLoan}>{submitting ? "Submitting..." : "Request Loan"}</Button>
            </form>
          </Card>
        </FadeInUp>
      )}

      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.5rem" }}>{Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}</div>
      ) : loans.length === 0 ? (
        <FadeInUp delay={400}>
          <Card padding="3rem">
            <div style={{ textAlign: "center" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "50%", backgroundColor: "#F0F0F0", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem", fontSize: "20px" }}>&#8358;</div>
              <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "#2D2D2D", marginBottom: "0.5rem" }}>No loans yet</h3>
              <p style={{ fontSize: "13px", color: "#717171", marginBottom: "1rem" }}>Access low-interest loans funded by the community.</p>
              <Button variant="primary" size="sm" onClick={() => setShowForm(true)}>Request Your First Loan</Button>
            </div>
          </Card>
        </FadeInUp>
      ) : (
        <FadeInUp delay={400}>
          <Card padding="1.5rem">
            <ColorfulBadge label="Loan History" color={cfg.colors.primary} />
            <h2 style={{ fontSize: "1.125rem", fontWeight: 500, color: "#1A1A1A", marginTop: "0.5rem", marginBottom: "1rem" }}>Your Loans ({loans.length})</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {loans.map((loan) => (
                <div key={loan.id} style={{ padding: "1rem", borderRadius: "0.75rem", border: "1px solid #F0F0F0", backgroundColor: expandedLoan === loan.id ? "#FAF9F5" : "#ffffff", transition: "all 0.2s" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", flexWrap: "wrap", gap: "0.75rem" }} onClick={() => setExpandedLoan(expandedLoan === loan.id ? null : loan.id)}>
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                      <div style={{ width: "40px", height: "40px", borderRadius: "0.75rem", backgroundColor: "#F0F0F0", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", fontWeight: 700, color: cfg.colors.primary }}>{formatNaira(loan.amount).split(" ")[0]}</div>
                      <div>
                        <span style={{ fontSize: "14px", fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", color: "#2D2D2D", display: "block" }}>{formatNaira(loan.amount)}</span>
                        <span style={{ fontSize: "11px", color: "#999" }}>{formatTerm(loan.termMonths)} &middot; 5% APR &middot; {new Date(loan.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</span>
                      </div>
                    </div>
                    <span style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase", fontFamily: "'JetBrains Mono', monospace", color: STATUS_COLORS[loan.status], backgroundColor: `${STATUS_COLORS[loan.status]}12`, padding: "0.125rem 0.5rem", borderRadius: "0.375rem" }}>{loan.status}</span>
                  </div>

                  {expandedLoan === loan.id && (
                    <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid #F0F0F0" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "1rem", fontSize: "12px" }}>
                        <div><span style={{ color: "#999", display: "block", marginBottom: "0.25rem" }}>Monthly Payment</span><span style={{ fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", color: cfg.colors.primary }}>{formatNaira(loan.monthlyPayment)}</span></div>
                        <div><span style={{ color: "#999", display: "block", marginBottom: "0.25rem" }}>Total Repayment</span><span style={{ fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", color: "#2D2D2D" }}>{formatNaira(loan.totalRepayment)}</span></div>
                        <div><span style={{ color: "#999", display: "block", marginBottom: "0.25rem" }}>Interest Rate</span><span style={{ fontWeight: 600, color: "#2D2D2D" }}>5% APR</span></div>
                        <div><span style={{ color: "#999", display: "block", marginBottom: "0.25rem" }}>Purpose</span><span style={{ fontWeight: 500, color: "#2D2D2D" }}>{loan.purpose || "Not specified"}</span></div>
                      </div>
                      {loan.approvedAt && <p style={{ fontSize: "11px", color: "#059669", marginTop: "0.75rem" }}>Approved on {new Date(loan.approvedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>}
                      {loan.disbursedAt && <p style={{ fontSize: "11px", color: "#2563EB", marginTop: "0.25rem" }}>Disbursed on {new Date(loan.disbursedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>}
                      {loan.completedAt && <p style={{ fontSize: "11px", color: "#059669", marginTop: "0.25rem" }}>Completed on {new Date(loan.completedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </FadeInUp>
      )}
    </div>
  );
}
