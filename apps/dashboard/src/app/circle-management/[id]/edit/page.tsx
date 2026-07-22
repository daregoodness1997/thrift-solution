"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { config, BrandConfig } from "@thrift/config";
import { Card, Button, ColorfulBadge, FadeInUp } from "@thrift/ui";
import { formatNaira } from "@thrift/utils";
import { useAuth } from "@/lib/auth-context";
import { useRouter, useParams } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { Skeleton } from "@/components/Skeleton";

const fallback = config;

interface Circle {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  cycleType: string;
  amount: number;
  weeklyAmount?: number | null;
  totalWeeks?: number | null;
  durationMonths: number;
  interestRateAnnual: number;
  maxAccountsPerUser: number;
  maxSubscribers?: number | null;
  payoutMode: string;
  blockPayoutOnDefault: boolean;
  processingFeeType?: string | null;
  processingFeeValue?: number | null;
  initialWeeksCount?: number | null;
  defaultPenaltyType?: string | null;
  defaultPenaltyValue?: number | null;
  addons?: any[];
}

interface AddonFormData {
  id?: string;
  name: string;
  description: string;
  quantity: string;
  estimatedCost: string;
  imageUrl: string;
}

interface CircleFormData {
  name: string;
  description: string;
  imageUrl: string;
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
  initialWeeksCount: string;
  defaultPenaltyType: "percent" | "fixed";
  defaultPenaltyValue: string;
}

function formatDuration(months: number) {
  if (months < 12) return `${months}mo`;
  const y = Math.floor(months / 12);
  const m = months % 12;
  return m > 0 ? `${y}y ${m}mo` : `${y}y`;
}

export default function EditCirclePage() {
  const { token } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [cfg, setCfg] = useState<BrandConfig>(fallback);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<CircleFormData | null>(null);
  const [saving, setSaving] = useState(false);
  const [addons, setAddons] = useState<AddonFormData[]>([]);
  const [showAddonForm, setShowAddonForm] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  useEffect(() => {
    fetch(`${API_URL}/api/config`)
      .then((r) => r.json())
      .then((d) => { if (d && d.name) setCfg((p) => ({ ...p, ...d })); })
      .catch(() => {});
  }, [API_URL]);

  const fetchCircle = useCallback(async () => {
    if (!token || !id) { setLoading(false); return; }
    try {
      const res = await fetch(`${API_URL}/api/circles/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        const c: Circle = data.data;
        setForm({
          name: c.name,
          description: c.description || "",
          imageUrl: c.imageUrl || "",
          cycleType: c.cycleType === "weekly_contribution" ? "weekly_contribution" : "deposit",
          amount: String(c.amount || ""),
          weeklyAmount: c.weeklyAmount != null ? String(c.weeklyAmount) : "",
          totalWeeks: c.totalWeeks != null ? String(c.totalWeeks) : "",
          durationMonths: String(c.durationMonths),
          interestRateAnnual: String(c.interestRateAnnual),
          maxAccountsPerUser: c.maxAccountsPerUser > 0 ? String(c.maxAccountsPerUser) : "",
          maxSubscribers: c.maxSubscribers != null && c.maxSubscribers > 0 ? String(c.maxSubscribers) : "",
          payoutMode: c.payoutMode === "clearance" ? "clearance" : "auto",
          blockPayoutOnDefault: c.blockPayoutOnDefault ?? true,
          processingFeeType: (c.processingFeeType as CircleFormData["processingFeeType"]) ?? "",
          processingFeeValue: c.processingFeeValue != null ? String(c.processingFeeValue) : "",
          initialWeeksCount: c.initialWeeksCount != null ? String(c.initialWeeksCount) : "3",
          defaultPenaltyType: (c.defaultPenaltyType as CircleFormData["defaultPenaltyType"]) ?? "percent",
          defaultPenaltyValue: c.defaultPenaltyValue != null ? String(c.defaultPenaltyValue) : "100",
        });
        if (c.addons && Array.isArray(c.addons)) {
          setAddons(c.addons.map((a: any) => ({
            id: a.id,
            name: a.name,
            description: a.description || "",
            quantity: String(a.quantity || 1),
            estimatedCost: String(a.estimatedCost || 0),
            imageUrl: a.imageUrl || "",
          })));
        }
      } else {
        router.push("/circle-management");
      }
    } catch {
      router.push("/circle-management");
    }
    setLoading(false);
  }, [token, API_URL, id, router]);

  useEffect(() => { fetchCircle(); }, [fetchCircle]);

  const handleSave = async () => {
    if (!form) return;
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
        imageUrl: form.imageUrl || undefined,
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
        initialWeeksCount: isWeekly ? Number(form.initialWeeksCount) || 3 : undefined,
        defaultPenaltyType: form.defaultPenaltyType,
        defaultPenaltyValue: Number(form.defaultPenaltyValue) || 100,
      };

      const res = await fetch(`${API_URL}/api/circles/${id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        // Save addons
        for (const addon of addons) {
          if (addon.id) {
            // Update existing addon
            await fetch(`${API_URL}/api/circles/${id}/addons/${addon.id}`, {
              method: "PUT",
              headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
              body: JSON.stringify({
                name: addon.name,
                description: addon.description || undefined,
                quantity: Number(addon.quantity) || 1,
                estimatedCost: Number(addon.estimatedCost),
                imageUrl: addon.imageUrl || undefined,
              }),
            });
          } else {
            // Create new addon
            await fetch(`${API_URL}/api/circles/${id}/addons`, {
              method: "POST",
              headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
              body: JSON.stringify({
                name: addon.name,
                description: addon.description || undefined,
                quantity: Number(addon.quantity) || 1,
                estimatedCost: Number(addon.estimatedCost),
                imageUrl: addon.imageUrl || undefined,
              }),
            });
          }
        }
        toast.success("Circle updated successfully");
        router.push("/circle-management");
      } else {
        toast.error(data.error || "Failed to save circle");
      }
    } catch {
      toast.error("Failed to save circle");
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-[720px] p-[clamp(1rem,3vw,2rem)]">
        <Skeleton width="200px" height="12px" style={{ marginBottom: "1rem" }} />
        <Skeleton width="320px" height="28px" style={{ marginBottom: "2rem" }} />
        <Card padding="2rem">
          <div className="flex flex-col gap-6">
            <Skeleton width="100%" height="40px" />
            <Skeleton width="100%" height="80px" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton width="100%" height="40px" />
              <Skeleton width="100%" height="40px" />
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (!form) return null;

  return (
    <div className="mx-auto max-w-[720px] p-[clamp(1rem,3vw,2rem)]">
      <PageHeader
        badgeLabel="Admin"
        heading="Edit"
        accentText="Circle"
        description="Update circle configuration below."
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
              <input type="text" value={form.name} onChange={(e) => setForm((p) => ({ ...p!, name: e.target.value }))}
                placeholder="e.g. Gold Circle"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] outline-none" />
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-semibold text-brand-dark">Description</label>
              <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p!, description: e.target.value }))}
                placeholder="Optional description"
                rows={2}
                className="w-full resize-y rounded-lg border border-gray-200 px-3 py-2 text-[13px] outline-none" />
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-semibold text-brand-dark">Circle Image URL</label>
              <input type="text" value={form.imageUrl} onChange={(e) => setForm((p) => ({ ...p!, imageUrl: e.target.value }))}
                placeholder="https://example.com/circle-image.jpg"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] outline-none" />
              {form.imageUrl && (
                <div className="mt-2 h-24 w-full overflow-hidden rounded-lg">
                  <img src={form.imageUrl} alt="Preview" className="h-full w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                </div>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-semibold text-brand-dark">Cycle Type *</label>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { v: "deposit", label: "Lump Deposit", desc: "One-time deposit" },
                  { v: "weekly_contribution", label: "Weekly", desc: "Auto weekly debit" },
                ] as const).map((opt) => (
                  <button key={opt.v} type="button" onClick={() => setForm((p) => ({ ...p!, cycleType: opt.v }))}
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
                  <input type="number" value={form.amount} onChange={(e) => setForm((p) => ({ ...p!, amount: e.target.value }))}
                    placeholder="e.g. 25000"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 font-mono text-[13px] outline-none" />
                </div>
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold text-brand-dark">Duration (months) *</label>
                  <input type="number" value={form.durationMonths} onChange={(e) => setForm((p) => ({ ...p!, durationMonths: e.target.value }))}
                    placeholder="e.g. 12"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 font-mono text-[13px] outline-none" />
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-[11px] font-semibold text-brand-dark">Weekly Amount *</label>
                    <input type="number" value={form.weeklyAmount} onChange={(e) => setForm((p) => ({ ...p!, weeklyAmount: e.target.value }))}
                      placeholder="e.g. 5000"
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 font-mono text-[13px] outline-none" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[11px] font-semibold text-brand-dark">Total Weeks *</label>
                    <input type="number" value={form.totalWeeks} onChange={(e) => setForm((p) => ({ ...p!, totalWeeks: e.target.value }))}
                      placeholder="e.g. 52"
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 font-mono text-[13px] outline-none" />
                  </div>
                </div>
                {form.totalWeeks && Number(form.totalWeeks) > 0 && (
                  <p className="text-[11px] text-gray-500">
                    Maturity: ~{Math.ceil(Number(form.totalWeeks) / 4.345)} month(s) ({form.totalWeeks} weeks from start).
                  </p>
                )}
                <div className="rounded-lg border border-gray-200 p-4">
                  <div className="mb-2">
                    <label className="block text-[11px] font-semibold text-brand-dark">Initial Weeks Collection</label>
                    <p className="text-[11px] text-gray-500">Number of weeks collected upfront when a user joins</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <input type="number" min={1} max={Number(form.totalWeeks) || 52} value={form.initialWeeksCount} onChange={(e) => setForm((p) => ({ ...p!, initialWeeksCount: e.target.value }))}
                      className="w-24 rounded-lg border border-gray-200 px-3 py-2 font-mono text-[13px] outline-none" />
                    <span className="text-[11px] text-gray-500">weeks</span>
                    {form.weeklyAmount && Number(form.weeklyAmount) > 0 && form.initialWeeksCount && Number(form.initialWeeksCount) > 0 && (
                      <span className="ml-auto text-[11px] font-semibold text-brand-dark">
                        Upfront: {formatNaira(Number(form.weeklyAmount) * Number(form.initialWeeksCount))}
                      </span>
                    )}
                  </div>
                </div>
              </>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold text-brand-dark">Interest Rate (% p.a.) *</label>
                <input type="number" step="0.1" value={form.interestRateAnnual} onChange={(e) => setForm((p) => ({ ...p!, interestRateAnnual: e.target.value }))}
                  placeholder="e.g. 10"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 font-mono text-[13px] outline-none" />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold text-brand-dark">Max Accounts/User</label>
                <input type="number" min={0} value={form.maxAccountsPerUser} onChange={(e) => setForm((p) => ({ ...p!, maxAccountsPerUser: e.target.value }))}
                  placeholder="∞ (no limit)"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 font-mono text-[13px] outline-none" />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold text-brand-dark">Max Subscribers</label>
                <input type="number" min={0} value={form.maxSubscribers} onChange={(e) => setForm((p) => ({ ...p!, maxSubscribers: e.target.value }))}
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
                  <select value={form.processingFeeType} onChange={(e) => setForm((p) => ({ ...p!, processingFeeType: e.target.value as CircleFormData["processingFeeType"] }))}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] outline-none">
                    <option value="">None</option>
                    <option value="fixed">Fixed (₦)</option>
                    <option value="percent">Percent of deposit (%)</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold text-brand-dark">Value</label>
                  <input type="number" step="0.01" value={form.processingFeeValue} onChange={(e) => setForm((p) => ({ ...p!, processingFeeValue: e.target.value }))}
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
                  <button key={opt.v} type="button" onClick={() => setForm((p) => ({ ...p!, payoutMode: opt.v }))}
                    className="cursor-pointer rounded-lg border p-3 text-left"
                    style={{ borderColor: form.payoutMode === opt.v ? cfg.colors.primary : "#e5e7eb", backgroundColor: form.payoutMode === opt.v ? `${cfg.colors.primary}08` : "#fff" }}>
                    <span className="block text-[12px] font-semibold text-brand-dark">{opt.label}</span>
                    <span className="text-[10px] text-gray-500">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 p-5">
              <div className="mb-4">
                <label className="block text-[11px] font-semibold text-brand-dark">Defaults & Penalties</label>
                <p className="text-[11px] text-gray-500">Configure what happens when weekly contributions are missed</p>
              </div>

              <div className="mb-4 flex items-center justify-between rounded-lg bg-gray-50 p-3">
                <div>
                  <span className="block text-[12px] font-semibold text-brand-dark">Block Payout on Default</span>
                  <span className="text-[11px] text-gray-500">{form.blockPayoutOnDefault ? "Outstanding defaults block maturity payouts" : "Payouts proceed regardless of defaults"}</span>
                </div>
                <button type="button" onClick={() => setForm((p) => ({ ...p!, blockPayoutOnDefault: !p!.blockPayoutOnDefault }))}
                  style={{ width: "44px", height: "24px", borderRadius: "12px", border: "none", cursor: "pointer", position: "relative", backgroundColor: form.blockPayoutOnDefault ? "#059669" : "#D1D5DB" }}>
                  <span style={{ position: "absolute", top: "2px", left: form.blockPayoutOnDefault ? "22px" : "2px", width: "20px", height: "20px", borderRadius: "50%", backgroundColor: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }} />
                </button>
              </div>

              {form.cycleType === "weekly_contribution" && (
                <>
                  <div className="mb-3 grid grid-cols-3 gap-3">
                    <div>
                      <label className="mb-1.5 block text-[11px] font-semibold text-brand-dark">Penalty Type</label>
                      <select value={form.defaultPenaltyType} onChange={(e) => setForm((p) => ({ ...p!, defaultPenaltyType: e.target.value as "percent" | "fixed" }))}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] outline-none">
                        <option value="percent">Percent (%)</option>
                        <option value="fixed">Fixed (₦)</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[11px] font-semibold text-brand-dark">Penalty Value</label>
                      <input type="number" step="0.01" value={form.defaultPenaltyValue} onChange={(e) => setForm((p) => ({ ...p!, defaultPenaltyValue: e.target.value }))}
                        placeholder={form.defaultPenaltyType === "percent" ? "e.g. 100" : "e.g. 500"}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 font-mono text-[13px] outline-none" />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[11px] font-semibold text-brand-dark">Clearance Cost</label>
                      <div className="rounded-lg bg-gray-50 px-3 py-2 font-mono text-[13px]">
                        {(() => {
                          const weekly = Number(form.weeklyAmount) || 0;
                          const val = Number(form.defaultPenaltyValue) || 0;
                          if (weekly <= 0) return "—";
                          const clearance = form.defaultPenaltyType === "percent"
                            ? weekly * (1 + val / 100)
                            : weekly + val;
                          return formatNaira(Math.round(clearance * 100) / 100);
                        })()}
                      </div>
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-400">
                    {form.defaultPenaltyType === "percent" && Number(form.defaultPenaltyValue) === 100
                      ? "At 100%, clearance = 2× the missed weekly amount"
                      : `Clearance = weekly amount + ${form.defaultPenaltyType === "percent" ? `${form.defaultPenaltyValue}%` : formatNaira(Number(form.defaultPenaltyValue) || 0)}`}
                  </p>
                </>
              )}
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <label className="block text-[11px] font-semibold text-brand-dark">Maturity Addons (Rewards)</label>
                  <p className="text-[11px] text-gray-500">Optional items members receive when circle matures (e.g., bag of rice, groundnut oil)</p>
                </div>
                <button type="button" onClick={() => setShowAddonForm(!showAddonForm)}
                  className="cursor-pointer rounded-lg px-3 py-1.5 text-[11px] font-semibold"
                  style={{ border: `1px solid ${cfg.colors.primary}30`, backgroundColor: `${cfg.colors.primary}08`, color: cfg.colors.primary }}>
                  {showAddonForm ? "Cancel" : "+ Add Reward"}
                </button>
              </div>

              {showAddonForm && (
                <div className="mb-3 rounded-lg border border-gray-200 p-4">
                  <div className="mb-3 grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1.5 block text-[11px] font-semibold text-brand-dark">Item Name *</label>
                      <input type="text" id="edit-addon-name" placeholder="e.g., Bag of Rice (10kg)"
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] outline-none" />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[11px] font-semibold text-brand-dark">Estimated Cost (₦) *</label>
                      <input type="number" id="edit-addon-cost" placeholder="e.g., 8000"
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 font-mono text-[13px] outline-none" />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[11px] font-semibold text-brand-dark">Quantity</label>
                      <input type="number" id="edit-addon-qty" placeholder="1" defaultValue="1"
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 font-mono text-[13px] outline-none" />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[11px] font-semibold text-brand-dark">Image URL (optional)</label>
                      <input type="text" id="edit-addon-image" placeholder="https://..."
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] outline-none" />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="mb-1.5 block text-[11px] font-semibold text-brand-dark">Description</label>
                    <textarea id="edit-addon-desc" placeholder="Optional description" rows={2}
                      className="w-full resize-y rounded-lg border border-gray-200 px-3 py-2 text-[13px] outline-none" />
                  </div>
                  <button type="button" onClick={() => {
                    const nameEl = document.getElementById("edit-addon-name") as HTMLInputElement;
                    const costEl = document.getElementById("edit-addon-cost") as HTMLInputElement;
                    const qtyEl = document.getElementById("edit-addon-qty") as HTMLInputElement;
                    const imageEl = document.getElementById("edit-addon-image") as HTMLInputElement;
                    const descEl = document.getElementById("edit-addon-desc") as HTMLTextAreaElement;
                    if (!nameEl?.value || !costEl?.value) {
                      toast.error("Item name and estimated cost are required");
                      return;
                    }
                    setAddons([...addons, {
                      name: nameEl.value,
                      description: descEl?.value || "",
                      quantity: qtyEl?.value || "1",
                      estimatedCost: costEl.value,
                      imageUrl: imageEl?.value || "",
                    }]);
                    nameEl.value = "";
                    costEl.value = "";
                    qtyEl.value = "1";
                    imageEl.value = "";
                    descEl.value = "";
                    setShowAddonForm(false);
                  }}
                    className="cursor-pointer rounded-lg px-3 py-1.5 text-[11px] font-semibold"
                    style={{ backgroundColor: cfg.colors.primary, color: "#fff" }}>
                    Add to List
                  </button>
                </div>
              )}

              {addons.length > 0 && (
                <div className="space-y-2">
                  {addons.map((addon, idx) => (
                    <div key={addon.id || idx} className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
                      {addon.imageUrl && (
                        <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg">
                          <img src={addon.imageUrl} alt={addon.name} className="h-full w-full object-cover" />
                        </div>
                      )}
                      <div className="flex-1">
                        <span className="block text-[12px] font-semibold text-brand-dark">{addon.name}</span>
                        <span className="text-[11px] text-gray-500">
                          Qty: {addon.quantity} × {formatNaira(Number(addon.estimatedCost))}
                          {addon.description && ` — ${addon.description}`}
                        </span>
                      </div>
                      <button type="button" onClick={() => setAddons(addons.filter((_, i) => i !== idx))}
                        className="cursor-pointer rounded-md px-2 py-1 text-[10px] font-semibold"
                        style={{ border: "1px solid #FECACA", backgroundColor: "#FEF2F2", color: "#DC2626" }}>
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
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
                {saving ? "Saving..." : "Update Circle"}
              </Button>
            </div>
          </div>
        </Card>
      </FadeInUp>
    </div>
  );
}
