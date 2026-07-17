"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { config, BrandConfig } from "@thrift/config";
import { Card, FadeIn } from "@thrift/ui";
import { formatNaira } from "@thrift/utils";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/PageHeader";

const fallback = config;
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const PROVIDER = "flutterwave";

const STATUS_COLORS: Record<string, string> = {
  pending: "#D97706", approved: "#059669", disbursed: "#2563EB",
  completed: "#059669", rejected: "#DC2626", defaulted: "#DC2626",
};

interface ScheduleItem {
  id: string; installmentNo: number; dueDate: string; principal: number; interest: number; totalDue: number;
  principalPaid: number; interestPaid: number; status: string; paidAt?: string;
}
interface Repayment {
  id: string; amount: number; principal: number; interest: number; method: string; reference: string;
  status: string; note?: string; createdAt: string;
}
interface LoanDetail {
  id: string; amount: number; interestRate: number; termMonths: number; monthlyPayment: number; totalRepayment: number;
  disbursedAmount?: number | null; paidAmount?: number; outstandingBalance?: number; nextDueDate?: string;
  processingFee?: number | null; processingFeeType?: string | null; processingFeeValue?: number | null;
  purpose?: string; status: string; approvedAt?: string; disbursedAt?: string; completedAt?: string; createdAt: string;
  schedule: ScheduleItem[]; repayments: Repayment[];
}

function formatTerm(months: number) {
  if (months < 12) return `${months}mo`;
  const y = Math.floor(months / 12); const m = months % 12;
  return m > 0 ? `${y}y ${m}mo` : `${y}y`;
}

export default function LoanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { token } = useAuth();
  const [cfg, setCfg] = useState<BrandConfig>(fallback);
  const [loan, setLoan] = useState<LoanDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const loanId = params.id as string;

  useEffect(() => {
    fetch(`${API_URL}/api/config`).then((r) => r.json()).then((d) => { if (d?.name) setCfg((p) => ({ ...p, ...d })); }).catch(() => {});
  }, [API_URL]);

  const load = useCallback(async () => {
    if (!token || !loanId) { setLoading(false); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/loans/${loanId}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setLoan(data.data);
      else setError(data.error || "Loan not found");
    } catch { setError("Loan not found"); }
    setLoading(false);
  }, [token, loanId, API_URL]);

  useEffect(() => { load(); }, [load]);

  const redirect = (url?: string) => { if (url) window.location.href = url; };

  const payInstallment = async (s: ScheduleItem) => {
    if (busy || !loan) return;
    setBusy(true);
    try {
      const res = await fetch(`${API_URL}/api/loans/${loan.id}/pay`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ provider: PROVIDER, installmentNo: s.installmentNo }),
      });
      const data = await res.json();
      if (data.success && data.data.authorizationUrl) redirect(data.data.authorizationUrl);
      else { toast.error(data.error || "Failed to initiate payment"); setBusy(false); }
    } catch { toast.error("Failed to initiate payment"); setBusy(false); }
  };

  const liquidate = async () => {
    if (busy || !loan) return;
    setBusy(true);
    try {
      const res = await fetch(`${API_URL}/api/loans/${loan.id}/liquidate`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ provider: PROVIDER }),
      });
      const data = await res.json();
      if (data.success && data.data.authorizationUrl) redirect(data.data.authorizationUrl);
      else { toast.error(data.error || "Failed to liquidate loan"); setBusy(false); }
    } catch { toast.error("Failed to liquidate loan"); setBusy(false); }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-[860px] p-[clamp(1rem,3vw,2rem)]">
        <div className="p-16 text-center text-[13px] text-gray-400">Loading loan details...</div>
      </div>
    );
  }

  if (error || !loan) {
    return (
      <div className="mx-auto max-w-[860px] p-[clamp(1rem,3vw,2rem)]">
        <div className="p-16 text-center">
          <div className="mb-4 text-[14px] text-gray-500">{error || "Loan not found"}</div>
          <button onClick={() => router.push("/loans")} className="cursor-pointer rounded-full border-0 px-5 py-2 text-[12px] font-semibold text-white" style={{ backgroundColor: cfg.colors.primary }}>Back to Loans</button>
        </div>
      </div>
    );
  }

  const sc = STATUS_COLORS[loan.status] || "#717171";

  return (
    <div className="mx-auto max-w-[860px] p-[clamp(1rem,3vw,2rem)]">
      <PageHeader
        badgeLabel="Loan"
        heading="Loan"
        accentText="Details"
        description="View your loan terms, repayment schedule, and make payments."
        right={<button onClick={() => router.push("/loans")} className="cursor-pointer rounded-full border-0 px-4 py-2 text-[11px] font-semibold transition-all" style={{ borderColor: cfg.colors.primary, color: cfg.colors.primary }}>← All Loans</button>}
      />

      <FadeIn>
        <Card padding="0">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 px-8 py-6">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-400">Principal</span>
              <div className="mt-1 font-mono text-[1.8rem] font-bold text-brand-dark">{formatNaira(loan.amount)}</div>
              <span className="text-[11px] text-gray-400">{formatTerm(loan.termMonths)} &middot; {loan.interestRate}% APR</span>
            </div>
            <span className="rounded-full px-3 py-1 text-[11px] font-bold uppercase" style={{ backgroundColor: `${sc}12`, color: sc }}>{loan.status}</span>
          </div>

          <div className="grid grid-cols-2 gap-px bg-gray-100 sm:grid-cols-3">
            {[
              { label: "Monthly Payment", value: formatNaira(loan.monthlyPayment) },
              { label: "Total Repayment", value: formatNaira(loan.totalRepayment) },
              loan.disbursedAmount ? { label: "Disbursed", value: formatNaira(loan.disbursedAmount) } : null,
              loan.status === "disbursed" && loan.outstandingBalance !== undefined ? { label: "Outstanding", value: formatNaira(loan.outstandingBalance) } : null,
              loan.processingFee ? { label: "Processing Fee", value: `${formatNaira(loan.processingFee)}${loan.processingFeeType === "percent" ? ` (${loan.processingFeeValue}%)` : ""}` } : null,
              loan.purpose ? { label: "Purpose", value: loan.purpose } : null,
              loan.status === "disbursed" && loan.nextDueDate ? { label: "Next Due", value: new Date(loan.nextDueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) } : null,
            ].filter(Boolean).map((cell, i) => (
              <div key={i} className="bg-white p-4">
                <span className="block text-[10px] font-semibold uppercase tracking-[0.1em] text-gray-400">{cell!.label}</span>
                <span className="mt-1 block font-mono text-[14px] font-semibold text-brand-dark">{cell!.value}</span>
              </div>
            ))}
          </div>

          {loan.status === "disbursed" && (
            <div className="flex flex-wrap items-center gap-3 border-t border-gray-100 px-8 py-5">
              <button onClick={liquidate} disabled={busy} className="cursor-pointer rounded-lg px-5 py-2.5 text-[12px] font-semibold text-white transition-all disabled:opacity-50" style={{ backgroundColor: "#2563EB" }}>{busy ? "Processing..." : "Liquidate Loan"}</button>
              <span className="text-[11px] text-gray-400">Pay the full outstanding balance at once via Flutterwave</span>
            </div>
          )}
        </Card>
      </FadeIn>

      {loan.status === "disbursed" && (
        <FadeIn delay={100} className="mt-6">
          <Card padding="2rem">
            <h3 className="mb-4 font-display text-lg font-semibold tracking-tight text-brand-dark">Payment Schedule</h3>
            {loan.schedule.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[12px]">
                  <thead>
                    <tr className="text-gray-400">
                      <th className="py-2 pr-3 font-medium">#</th>
                      <th className="py-2 pr-3 font-medium">Due Date</th>
                      <th className="py-2 pr-3 font-medium text-right">Principal</th>
                      <th className="py-2 pr-3 font-medium text-right">Interest</th>
                      <th className="py-2 pr-3 font-medium text-right">Total</th>
                      <th className="py-2 font-medium">Status</th>
                      <th className="py-2 text-right font-medium">Pay</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loan.schedule.map((s) => {
                      const remaining = Math.round((s.principal + s.interest - s.principalPaid - s.interestPaid) * 100) / 100;
                      const isPaid = s.status === "paid";
                      return (
                        <tr key={s.id} className="border-t border-gray-100">
                          <td className="py-2.5 pr-3 font-mono">{s.installmentNo}</td>
                          <td className="py-2.5 pr-3">{new Date(s.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
                          <td className="py-2.5 pr-3 text-right font-mono">{formatNaira(s.principal)}</td>
                          <td className="py-2.5 pr-3 text-right font-mono">{formatNaira(s.interest)}</td>
                          <td className="py-2.5 pr-3 text-right font-mono">{formatNaira(s.totalDue)}</td>
                          <td className="py-2.5">
                            <span className="rounded px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase" style={{ color: STATUS_COLORS[s.status] || "#717171", backgroundColor: `${(STATUS_COLORS[s.status] || "#717171")}12` }}>{s.status}</span>
                          </td>
                          <td className="py-2.5 text-right">
                            {!isPaid && (
                              <button type="button" disabled={busy} onClick={() => payInstallment(s)} className="cursor-pointer rounded-md border px-2.5 py-1 text-[10px] font-semibold transition-all disabled:opacity-50" style={{ color: "#2563EB", borderColor: "#2563EB40" }}>{formatNaira(remaining)}</button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : <p className="text-[12px] text-gray-400">No schedule generated yet.</p>}
          </Card>
        </FadeIn>
      )}

      {loan.repayments.length > 0 && (
        <FadeIn delay={150} className="mt-6">
          <Card padding="2rem">
            <h3 className="mb-4 font-display text-lg font-semibold tracking-tight text-brand-dark">Repayment History</h3>
            <div className="flex flex-col gap-2">
              {loan.repayments.map((r) => (
                <div key={r.id} className="flex flex-wrap items-center justify-between rounded-lg border border-gray-100 px-3 py-2.5 text-[12px]">
                  <span className="font-mono font-semibold text-brand-dark">{formatNaira(r.amount)}</span>
                  <span className="text-gray-400">{r.method}</span>
                  <span className="text-gray-500">{new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                  <span className="font-mono text-gray-400">{r.reference}</span>
                </div>
              ))}
            </div>
          </Card>
        </FadeIn>
      )}

      {(() => {
        const events = [
          loan.approvedAt ? { label: "Approved", date: loan.approvedAt, color: "#059669" } : null,
          loan.disbursedAt ? { label: "Disbursed", date: loan.disbursedAt, color: "#2563EB" } : null,
          loan.completedAt ? { label: "Completed", date: loan.completedAt, color: "#059669" } : null,
        ].filter(Boolean) as { label: string; date: string; color: string }[];
        if (events.length === 0) return null;
        return (
          <FadeIn delay={200} className="mt-6">
            <Card padding="1.5rem">
              <h3 className="mb-4 font-display text-sm font-semibold tracking-tight text-brand-dark">Timeline</h3>
              <div className="flex flex-col gap-3">
                {events.map((ev) => (
                  <div key={ev.label} className="flex items-center gap-3">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: ev.color }} />
                    <span className="text-[12px] font-semibold text-brand-dark">{ev.label}</span>
                    <span className="text-[12px] text-gray-400">{new Date(ev.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
                  </div>
                ))}
              </div>
            </Card>
          </FadeIn>
        );
      })()}
    </div>
  );
}
