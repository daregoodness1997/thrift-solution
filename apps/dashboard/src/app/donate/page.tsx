"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { config } from "@thrift/config";
import { Card, Button, ColorfulBadge, FadeInUp } from "@thrift/ui";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/PageHeader";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const presetAmounts = [5000, 10000, 25000, 50000, 100000];

const itemCategories = [
  "Clothing", "Electronics", "Food & Groceries", "Household Items",
  "Books & Supplies", "Health & Wellness", "Other",
];

const itemConditions = ["New", "Like New", "Good", "Fair"];

interface ItemImageFile {
  file: File;
  preview: string;
}

export default function DonatePage() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<"monetary" | "item">("monetary");
  const [amount, setAmount] = useState("");
  const [customAmount, setCustomAmount] = useState("");
  const [provider, setProvider] = useState("paystack");
  const [providers, setProviders] = useState<string[]>([]);
  const [groupId, setGroupId] = useState("");
  const [groups, setGroups] = useState<{ id: string; name: string; targetAmount: number; currentAmount: number }[]>([]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [itemName, setItemName] = useState("");
  const [itemDescription, setItemDescription] = useState("");
  const [itemCategory, setItemCategory] = useState("");
  const [itemCondition, setItemCondition] = useState("");
  const [itemNotes, setItemNotes] = useState("");
  const [itemImage, setItemImage] = useState<ItemImageFile | null>(null);

  const itemImageRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!token) return;

    fetch(`${API_URL}/api/donations/providers`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => { if (d.success) setProviders(d.data); })
      .catch(() => {});

    fetch(`${API_URL}/api/groups`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => { if (d.success) setGroups(d.data); })
      .catch(() => {});
  }, [token]);

  const handleMonetaryDonation = async () => {
    const selectedAmount = customAmount || amount;
    if (!selectedAmount || parseFloat(selectedAmount) <= 0) {
      setError("Please select or enter an amount");
      return;
    }

    if (!token) {
      setError("Please log in to make a donation");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_URL}/api/donations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: parseFloat(selectedAmount),
          provider,
          groupId: groupId || undefined,
          notes: notes || undefined,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        toast.error(data.error || "Failed to create donation");
        return;
      }

      toast.success("Donation initiated successfully!");
      if (data.data.authorizationUrl) {
        window.location.href = data.data.authorizationUrl;
      } else {
        setSuccess(true);
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleItemImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError("Image file size must be less than 10MB");
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
      setError("Only JPEG, PNG, WebP, and GIF files are allowed");
      return;
    }

    setError("");
    const preview = URL.createObjectURL(file);
    setItemImage({ file, preview });
  };

  const removeItemImage = () => {
    if (itemImage?.preview) {
      URL.revokeObjectURL(itemImage.preview);
    }
    setItemImage(null);
    if (itemImageRef.current) {
      itemImageRef.current.value = "";
    }
  };

  const handleItemDonation = async () => {
    if (!itemName.trim()) {
      setError("Item name is required");
      return;
    }

    if (!token) {
      setError("Please log in to make a donation");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("itemName", itemName.trim());
      if (itemDescription.trim()) {
        formData.append("itemDescription", itemDescription.trim());
      }
      if (itemCategory) {
        formData.append("itemCategory", itemCategory);
      }
      if (itemCondition) {
        formData.append("itemCondition", itemCondition);
      }
      if (itemNotes.trim()) {
        formData.append("notes", itemNotes.trim());
      }
      if (itemImage) {
        formData.append("itemImage", itemImage.file);
      }

      const res = await fetch(`${API_URL}/api/donations/item`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();

      if (!data.success) {
        toast.error(data.error || "Failed to submit item donation");
        return;
      }

      toast.success("Item donation submitted!");
      setSuccess(true);
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="mx-auto max-w-[900px] p-[clamp(1rem,3vw,2rem)]">
        <FadeInUp>
          <Card padding="2rem" className="text-center">
            <div className="mb-4 text-5xl">
              {activeTab === "monetary" ? "\uD83C\uDF81" : "\uD83C\uDF8D"}
            </div>
            <h2 className="mb-2 text-2xl font-semibold text-brand-dark">
              {activeTab === "monetary" ? "Thank you for your donation!" : "Item donation submitted!"}
            </h2>
            <p className="mb-6 text-[14px] leading-[1.6] text-gray-500">
              {activeTab === "monetary"
                ? "Your payment is being processed. You will be redirected to complete the transaction."
                : "Your item donation has been recorded. Our team will review it shortly."}
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button onClick={() => { setSuccess(false); setAmount(""); setCustomAmount(""); setItemName(""); }}>
                Make Another Donation
              </Button>
              <a href="/donations" className="inline-flex items-center rounded-full border border-gray-100 bg-white px-6 py-3 text-[14px] font-semibold text-gray-500 no-underline transition-all duration-200">
                View History
              </a>
            </div>
          </Card>
        </FadeInUp>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[900px] p-[clamp(1rem,3vw,2rem)]">
      <PageHeader
        badgeLabel="Support the Community"
        heading="Make a"
        accentText="Donation"
        description="Contribute funds or items to support your circles and community."
      />

      <FadeInUp delay={200}>
        <div className="mb-6 flex gap-1 rounded-xl bg-[#F5F7F5] p-1">
          {(["monetary", "item"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setError(""); }}
              style={{
                flex: 1,
                padding: "0.625rem 1rem",
                borderRadius: "0.625rem",
                fontSize: "13px",
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
                transition: "all 0.2s ease",
                backgroundColor: activeTab === tab ? "#ffffff" : "transparent",
                color: activeTab === tab ? config.colors.primary : "#717171",
                boxShadow: activeTab === tab ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              }}
            >
              {tab === "monetary" ? "\uD83D\uDCB3 Monetary" : "\uD83C\uDFFC\uFE0F Item Donation"}
            </button>
          ))}
        </div>
      </FadeInUp>

      {error && (
        <FadeInUp delay={50}>
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-[13px] text-red-600">
            {error}
          </div>
        </FadeInUp>
      )}

      {activeTab === "monetary" ? (
        <FadeInUp delay={300}>
          <Card padding="1.5rem">
            {groups.length > 0 && (
              <div className="mb-6">
                <label className="mb-2 block text-[12px] font-semibold text-brand-dark">
                  Donate to a Circle (optional)
                </label>
                <select
                  value={groupId}
                  onChange={(e) => setGroupId(e.target.value)}
                  className="w-full cursor-pointer rounded-xl border border-gray-100 bg-white px-3 py-2.5 text-[13px] text-brand-dark outline-none"
                >
                  <option value="">General Fund</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>{g.name} — ₦{g.currentAmount.toLocaleString()} / ₦{g.targetAmount.toLocaleString()}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="mb-6">
              <label className="mb-2 block text-[12px] font-semibold text-brand-dark">
                Select Amount
              </label>
              <div className="mb-3 grid grid-cols-3 gap-2">
                {presetAmounts.map((preset) => (
                  <button
                    key={preset}
                    onClick={() => { setAmount(String(preset)); setCustomAmount(""); }}
                    style={{
                      padding: "0.75rem",
                      borderRadius: "0.75rem",
                      border: `1px solid ${amount === String(preset) ? config.colors.primary : "#EAEAEA"}`,
                      backgroundColor: amount === String(preset) ? `${config.colors.primary}0A` : "#ffffff",
                      color: amount === String(preset) ? config.colors.primary : "#717171",
                      fontSize: "13px",
                      fontWeight: 600,
                      fontFamily: "'JetBrains Mono', monospace",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                  >
                    ₦{preset.toLocaleString()}
                  </button>
                ))}
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] font-semibold text-gray-400">₦</span>
                <input
                  type="number"
                  placeholder="Custom amount"
                  value={customAmount}
                  onChange={(e) => { setCustomAmount(e.target.value); setAmount(""); }}
                  className="w-full rounded-xl border border-gray-100 p-3 pl-7 font-mono text-[13px] outline-none transition-colors"
                  onFocus={(e) => { e.currentTarget.style.borderColor = config.colors.primary; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "#EAEAEA"; }}
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="mb-2 block text-[12px] font-semibold text-brand-dark">
                Payment Method
              </label>
              <div className="flex gap-2">
                {providers.map((p) => (
                  <button
                    key={p}
                    onClick={() => setProvider(p)}
                    style={{
                      flex: 1,
                      padding: "0.625rem",
                      borderRadius: "0.75rem",
                      border: `1px solid ${provider === p ? config.colors.primary : "#EAEAEA"}`,
                      backgroundColor: provider === p ? `${config.colors.primary}0A` : "#ffffff",
                      color: provider === p ? config.colors.primary : "#717171",
                      fontSize: "12px",
                      fontWeight: 600,
                      textTransform: "capitalize",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="mb-2 block text-[12px] font-semibold text-brand-dark">
                Notes (optional)
              </label>
              <textarea
                placeholder="Add a note to your donation..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full resize-y rounded-xl border border-gray-100 p-3 text-[13px] font-sans outline-none transition-colors"
                onFocus={(e) => { e.currentTarget.style.borderColor = config.colors.primary; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "#EAEAEA"; }}
              />
            </div>

            <Button
              onClick={handleMonetaryDonation}
              disabled={loading || (!amount && !customAmount)}
              className="w-full justify-center" style={{ opacity: loading || (!amount && !customAmount) ? 0.5 : 1 }}
            >
              {loading ? "Processing..." : "Donate Now"}
            </Button>
          </Card>
        </FadeInUp>
      ) : (
        <FadeInUp delay={300}>
          <Card padding="1.5rem">
              <div className="mb-5">
              <label className="mb-2 block text-[12px] font-semibold text-brand-dark">
                Item Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Winter Jacket, Laptop Bag"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                className="w-full rounded-xl border border-gray-100 p-3 text-[13px] outline-none transition-colors"
                onFocus={(e) => { e.currentTarget.style.borderColor = config.colors.primary; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "#EAEAEA"; }}
              />
            </div>

            <div className="mb-5 grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-[12px] font-semibold text-brand-dark">
                  Category
                </label>
                <select
                  value={itemCategory}
                  onChange={(e) => setItemCategory(e.target.value)}
                  className="w-full cursor-pointer rounded-xl border border-gray-100 bg-white p-3 text-[13px] text-brand-dark outline-none"
                >
                  <option value="">Select category</option>
                  {itemCategories.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-[12px] font-semibold text-brand-dark">
                  Condition
                </label>
                <select
                  value={itemCondition}
                  onChange={(e) => setItemCondition(e.target.value)}
                  className="w-full cursor-pointer rounded-xl border border-gray-100 bg-white p-3 text-[13px] text-brand-dark outline-none"
                >
                  <option value="">Select condition</option>
                  {itemConditions.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

              <div className="mb-5">
              <label className="mb-2 block text-[12px] font-semibold text-brand-dark">
                Description
              </label>
              <textarea
                placeholder="Describe the item you'd like to donate..."
                value={itemDescription}
                onChange={(e) => setItemDescription(e.target.value)}
                rows={3}
                className="w-full resize-y rounded-xl border border-gray-100 p-3 text-[13px] font-sans outline-none transition-colors"
                onFocus={(e) => { e.currentTarget.style.borderColor = config.colors.primary; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "#EAEAEA"; }}
              />
            </div>

              <div className="mb-5">
              <label className="mb-2 block text-[12px] font-semibold text-brand-dark">
                Item Image (optional)
              </label>
               <input ref={itemImageRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleItemImageSelect} className="hidden" />
              {itemImage ? (
                <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                  <img src={itemImage.preview} alt="Preview" className="h-16 w-16 rounded-lg object-cover" />
                  <div className="min-w-0 flex-1">
                    <span className="block truncate text-[12px] font-medium text-brand-dark">{itemImage.file.name}</span>
                    <span className="text-[10px] text-emerald-600">{(itemImage.file.size / 1024).toFixed(1)} KB</span>
                  </div>
                   <button type="button" onClick={removeItemImage} className="cursor-pointer border-0 bg-none p-1 text-red-600">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M18 6L6 18M6 6l12 12" /></svg>
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => itemImageRef.current?.click()} className="w-full cursor-pointer rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-6 text-center transition-all duration-200"
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = config.colors.primary; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#D1D5DB"; }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth={1.5} className="mx-auto mb-1.5"><path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                  <span className="block text-[12px] text-gray-500">Click to upload item image</span>
                  <span className="mt-1 block text-[10px] text-gray-400">JPEG, PNG, WebP, or GIF up to 10MB</span>
                </button>
              )}
            </div>

            <div className="mb-6">
              <label className="mb-2 block text-[12px] font-semibold text-brand-dark">
                Additional Notes (optional)
              </label>
              <input
                type="text"
                placeholder="Any pickup preferences or other details..."
                value={itemNotes}
                onChange={(e) => setItemNotes(e.target.value)}
                className="w-full rounded-xl border border-gray-100 p-3 text-[13px] outline-none transition-colors"
                onFocus={(e) => { e.currentTarget.style.borderColor = config.colors.primary; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "#EAEAEA"; }}
              />
            </div>

            <Button
              onClick={handleItemDonation}
              disabled={loading || !itemName.trim()}
              className="w-full justify-center" style={{ opacity: loading || !itemName.trim() ? 0.5 : 1 }}
            >
              {loading ? "Submitting..." : "Submit Item Donation"}
            </Button>
          </Card>
        </FadeInUp>
      )}
    </div>
  );
}
