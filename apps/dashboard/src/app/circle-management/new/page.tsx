"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { config, BrandConfig } from "@thrift/config";
import { Card, Button, ColorfulBadge, FadeInUp } from "@thrift/ui";
import { formatNaira } from "@thrift/utils";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";

const fallback = config;

interface CircleFormData {
  name: string;
  description: string;
  cycleType: "deposit" | "weekly_contribution";
  amount: string;
  weeklyAmount: string;
  totalWeeks: string;
  durationMonths: string;
  interestRateAnnual: string;
  maxAccountsPerUser: string;
  maxSubscribers: string;
  payoutMode: "auto" | "clearance";
  blockPayoutOnDefault: boolean;
  processingFeeType: "fixed" | "percent" | "";
  processingFeeValue: string;
}

const emptyForm: CircleFormData = {
  name: "",
  description: "",
  cycleType: "deposit",
  amount: "",
  weeklyAmount: "",
  totalWeeks: "",
  durationMonths: "",
  interestRateAnnual: "",
  maxAccountsPerUser: "10",
  maxSubscribers: "",
  payoutMode: "auto",
  blockPayoutOnDefault: true,
  processingFeeType: "",
  processingFeeValue: "",
};

function formatDuration(months: number) {
  if (months < 12) return `${months}mo`;
  const y = Math.floor(months / 12);
  const m = months % 12;
  return m > 0 ? `${y}y ${m}mo` : `${y}y`;
}

export default function NewCirclePage() {
  const { token } = useAuth();
  const router = useRouter();
  const [cfg, setCfg] = useState<BrandConfig>(fallback);
  const [form, setForm] = useState<CircleFormData>(emptyForm);
  const [saving, setSaving] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  useEffect(() => {
    fetch(`${API_URL}/api/config`)
      .then((r) => r.json())
      .then((d) => { if (d && d.name) setCfg((p) => ({ ...p, ...d })); })
      .catch(() => {});
  }, [API_URL]);

  const handleSave = async () => {
    const isWeekly = form.cycleType === "weekly_contribution";
    if (!form.name || !form.interestRateAnnual) {
      toast.error("Name and interest rate are required");
      return;
    }
    if (!isWeekly && (!form.amount || !form.durationMonths)) {
      toast.error("Deposit amount and duration are required for deposit cycles");
      return;
    }
    if (isWeekly && (!form.weeklyAmount || !form.totalWeeks)) {
      toast.error("Weekly amount and total weeks are required for weekly cycles");
      return;
    }
    setSaving(true);
    try {
      const durationMonths = isWeekly
        ? Math.max(1, Math.ceil(Number(form.totalWeeks) / 4.345))
        : Number(form.durationMonths);
      const body = {
        name: form.name,
        description: form.description || undefined,
        cycleType: form.cycleType,
        amount: Number(form.amount) || 0,
        weeklyAmount: isWeekly ? Number(form.weeklyAmount) : undefined,
        totalWeeks: isWeekly ? Number(form.totalWeeks) : undefined,
        durationMonths,
        interestRateAnnual: Number(form.interestRateAnnual),
        maxAccountsPerUser: form.maxAccountsPerUser ? Number(form.maxAccountsPerUser) : 0,
        maxSubscribers: form.maxSubscribers ? Number(form.maxSubscribers) : undefined,
        payoutMode: form.payoutMode,
        blockPayoutOnDefault: form.blockPayoutOnDefault,
        processingFeeType: form.processingFeeType || undefined,
        processingFeeValue: form.processingFeeValue ? Number(form.processingFeeValue) : undefined,
      };

      const res = await fetch(`${API_URL}/api/circles`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Circle created successfully");
        router.push("/circle-management");
      } else {
        toast.error(data.error || "Failed to save circle");
      }
    } catch {
      toast.error("Failed to save circle");
    }
    setSaving(false);
  };

  return (
    <div className="mx-auto max-w-[720px] p-[clamp(1rem,3vw,2rem)]">
      <PageHeader
        badgeLabel="Admin"
        heading="Create"
        accentText="New Circle"
        description="Configure a new circle savings product."
        right={
          <Button variant="secondary" size="sm" onClick={() => router.push("/circle-management")}>
            Back
          </Button>
        }
      />

      <FadeInUp delay={200}>
        <Card padding="2rem">
          <div className="flex flex-col gap-6">
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold text-brand-dark">Name *</label>
              <input type="text" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Gold Circle"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] outline-none" />
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-semibold text-brand-dark">Description</label>
              <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Optional description"
                rows={2}
                className="w-full resize-y rounded-lg border border-gray-200 px-3 py-2 text-[13px] outline-none" />
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-semibold text-brand-dark">Cycle Type *</label>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { v: "deposit", label: "Lump Deposit", desc: "One-time deposit" },
                  { v: "weekly_contribution", label: "Weekly", desc: "Auto weekly debit" },
                ] as const).map((opt) => (
                  <button key={opt.v} type="button" onClick={() => setForm((p) => ({ ...p, cycleType: opt.v }))}
                    className="cursor-pointer rounded-lg border p-3 text-left"
                    style={{ borderColor: form.cycleType === opt.v ? cfg.colors.primary : "#e5e7eb", backgroundColor: form.cycleType === opt.v ? `${cfg.colors.primary}08` : "#fff" }}>
                    <span className="block text-[12px] font-semibold text-brand-dark">{opt.label}</span>
                    <span className="text-[10px] text-gray-500">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {form.cycleType === "deposit" ? (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold text-brand-dark">Deposit Amount *</label>
                  <input type="number" value={form.amount} onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
                    placeholder="e.g. 25000"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 font-mono text-[13px] outline-none" />
                </div>
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold text-brand-dark">Duration (months) *</label>
                  <input type="number" value={form.durationMonths} onChange={(e) => setForm((p) => ({ ...p, durationMonths: e.target.value }))}
                    placeholder="e.g. 12"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 font-mono text-[13px] outline-none" />
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-[11px] font-semibold text-brand-dark">Weekly Amount *</label>
                    <input type="number" value={form.weeklyAmount} onChange={(e) => setForm((p) => ({ ...p, weeklyAmount: e.target.value }))}
                      placeholder="e.g. 5000"
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 font-mono text-[13px] outline-none" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[11px] font-semibold text-brand-dark">Total Weeks *</label>
                    <input type="number" value={form.totalWeeks} onChange={(e) => setForm((p) => ({ ...p, totalWeeks: e.target.value }))}
                      placeholder="e.g. 52"
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 font-mono text-[13px] outline-none" />
                  </div>
                </div>
                {form.totalWeeks && Number(form.totalWeeks) > 0 && (
                  <p className="text-[11px] text-gray-500">
                    Maturity: ~{Math.ceil(Number(form.totalWeeks) / 4.345)} month(s) ({form.totalWeeks} weeks from start).
                  </p>
                )}
                <p className="rounded-lg bg-blue-50 px-3 py-2 text-[11px] text-blue-700">
                  Missed weekly debits create a default requiring 2× clearance to resolve.
                </p>
              </>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold text-brand-dark">Interest Rate (% p.a.) *</label>
                <input type="number" step="0.1" value={form.interestRateAnnual} onChange={(e) => setForm((p) => ({ ...p, interestRateAnnual: e.target.value }))}
                  placeholder="e.g. 10"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 font-mono text-[13px] outline-none" />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold text-brand-dark">Max Accounts/User</label>
                <input type="number" min={0} value={form.maxAccountsPerUser} onChange={(e) => setForm((p) => ({ ...p, maxAccountsPerUser: e.target.value }))}
                  placeholder="∞ (no limit)"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 font-mono text-[13px] outline-none" />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold text-brand-dark">Max Subscribers</label>
                <input type="number" min={0} value={form.maxSubscribers} onChange={(e) => setForm((p) => ({ ...p, maxSubscribers: e.target.value }))}
                  placeholder="∞ (no limit)"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 font-mono text-[13px] outline-none" />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-semibold text-brand-dark">Processing Fee</label>
              <p className="mb-2 text-[11px] text-gray-500">Charged from the wallet when a member opens an account.</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold text-brand-dark">Type</label>
                  <select value={form.processingFeeType} onChange={(e) => setForm((p) => ({ ...p, processingFeeType: e.target.value as CircleFormData["processingFeeType"] }))}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] outline-none">
                    <option value="">None</option>
                    <option value="fixed">Fixed (₦)</option>
                    <option value="percent">Percent of deposit (%)</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold text-brand-dark">Value</label>
                  <input type="number" step="0.01" value={form.processingFeeValue} onChange={(e) => setForm((p) => ({ ...p, processingFeeValue: e.target.value }))}
                    placeholder={form.processingFeeType === "percent" ? "e.g. 2" : "e.g. 500"}
                    disabled={!form.processingFeeType}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 font-mono text-[13px] outline-none disabled:bg-gray-100" />
                </div>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-semibold text-brand-dark">Payout Mode *</label>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { v: "auto", label: "Auto", desc: "Credit wallet on maturity" },
                  { v: "clearance", label: "Clearance", desc: "Admin reviews & disburses" },
                ] as const).map((opt) => (
                  <button key={opt.v} type="button" onClick={() => setForm((p) => ({ ...p, payoutMode: opt.v }))}
                    className="cursor-pointer rounded-lg border p-3 text-left"
                    style={{ borderColor: form.payoutMode === opt.v ? cfg.colors.primary : "#e5e7eb", backgroundColor: form.payoutMode === opt.v ? `${cfg.colors.primary}08` : "#fff" }}>
                    <span className="block text-[12px] font-semibold text-brand-dark">{opt.label}</span>
                    <span className="text-[10px] text-gray-500">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4">
              <div>
                <span className="block text-[12px] font-semibold text-brand-dark">Block Payout on Default</span>
                <span className="text-[11px] text-gray-500">{form.blockPayoutOnDefault ? "Outstanding defaults block maturity payouts" : "Payouts proceed regardless of defaults"}</span>
              </div>
              <button type="button" onClick={() => setForm((p) => ({ ...p, blockPayoutOnDefault: !p.blockPayoutOnDefault }))}
                style={{ width: "44px", height: "24px", borderRadius: "12px", border: "none", cursor: "pointer", position: "relative", backgroundColor: form.blockPayoutOnDefault ? "#059669" : "#D1D5DB" }}>
                <span style={{ position: "absolute", top: "2px", left: form.blockPayoutOnDefault ? "22px" : "2px", width: "20px", height: "20px", borderRadius: "50%", backgroundColor: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }} />
              </button>
            </div>

            {((form.cycleType === "deposit" && form.amount && form.durationMonths) || (form.cycleType === "weekly_contribution" && form.weeklyAmount && form.totalWeeks)) && form.interestRateAnnual && (
              <div className="rounded-xl bg-gray-50 p-4 text-[12px]">
                {(() => {
                  const isWeekly = form.cycleType === "weekly_contribution";
                  const principal = isWeekly
                    ? Number(form.weeklyAmount) * Number(form.totalWeeks)
                    : Number(form.amount);
                  const durationMonths = isWeekly
                    ? Math.max(1, Math.ceil(Number(form.totalWeeks) / 4.345))
                    : Number(form.durationMonths);
                  return (
                    <>
                      <div className="mb-1.5 font-semibold text-brand-dark">Preview</div>
                      {isWeekly ? (
                        <div className="mb-1 flex justify-between">
                          <span className="text-gray-500">Contribution</span>
                          <span className="font-mono font-semibold">{formatNaira(Number(form.weeklyAmount))}/wk × {form.totalWeeks}</span>
                        </div>
                      ) : (
                        <div className="mb-1 flex justify-between">
                          <span className="text-gray-500">Deposit</span>
                          <span className="font-mono font-semibold">{formatNaira(Number(form.amount))}</span>
                        </div>
                      )}
                      <div className="mb-1 flex justify-between">
                        <span className="text-gray-500">Total Principal</span>
                        <span className="font-mono font-semibold">{formatNaira(principal)}</span>
                      </div>
                      <div className="mb-1 flex justify-between">
                        <span className="text-gray-500">Duration</span>
                        <span className="font-medium">{isWeekly ? `${form.totalWeeks} weeks (~${formatDuration(durationMonths)})` : formatDuration(durationMonths)}</span>
                      </div>
                      <div className="mb-1 flex justify-between">
                        <span className="text-gray-500">Annual Rate</span>
                        <span className="font-medium">{form.interestRateAnnual}%</span>
                      </div>
                      {form.processingFeeType && form.processingFeeValue ? (
                        <div className="mb-1 flex justify-between">
                          <span className="text-gray-500">Processing Fee</span>
                          <span className="font-mono font-semibold">
                            {form.processingFeeType === "percent"
                              ? `${form.processingFeeValue}% (${formatNaira(principal * (Number(form.processingFeeValue) / 100))})`
                              : formatNaira(Number(form.processingFeeValue))}
                          </span>
                        </div>
                      ) : null}
                      <div className="flex justify-between">
                        <span className="text-gray-500">Est. Maturity Value</span>
                        <span className="font-mono font-bold text-emerald-600">
                          {formatNaira(principal * (1 + (Number(form.interestRateAnnual) / 100) * (durationMonths / 12)))}
                        </span>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="secondary" size="md" onClick={() => router.push("/circle-management")}>
                Cancel
              </Button>
              <Button variant="primary" size="md" disabled={saving} onClick={handleSave}>
                {saving ? "Saving..." : "Create Circle"}
              </Button>
            </div>
          </div>
        </Card>
      </FadeInUp>
    </div>
  );
}
