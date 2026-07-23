"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Card, FadeInUp } from "@thrift/ui";
import { useAuth } from "@/lib/auth-context";
import {
  Heart,
  CreditCard,
  Package,
  CheckCircle,
  ArrowRight,
  MessageCircle,
  Upload,
  X,
  Sparkles,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const presetAmounts = [5000, 10000, 25000, 50000, 100000];

const itemCategories = [
  "Clothing",
  "Electronics",
  "Food & Groceries",
  "Household Items",
  "Books & Supplies",
  "Health & Wellness",
  "Other",
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
  const [provider, setProvider] = useState("flutterwave");
  const [providers, setProviders] = useState<string[]>([]);
  const [groupId, setGroupId] = useState("");
  const [groups, setGroups] = useState<
    { id: string; name: string; targetAmount: number; currentAmount: number }[]
  >([]);
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

  const inputClass =
    "w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-3 text-[13px] text-slate-900 dark:text-slate-100 outline-none transition focus:border-[var(--color-brand-primary)] focus:ring-2 focus:ring-[var(--color-brand-primary)]/20 placeholder:text-slate-400 dark:placeholder:text-slate-500";

  useEffect(() => {
    if (!token) return;

    fetch(`${API_URL}/api/donations/providers`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setProviders(d.data);
      })
      .catch(() => {});

    fetch(`${API_URL}/api/groups`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setGroups(d.data);
      })
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
    if (
      !["image/jpeg", "image/png", "image/webp", "image/gif"].includes(
        file.type,
      )
    ) {
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
          <Card padding="2rem" className="text-center rounded-3xl">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
              <CheckCircle className="h-8 w-8" />
            </div>
            <h2 className="mb-2 font-heading text-2xl font-bold text-slate-900 dark:text-white">
              {activeTab === "monetary"
                ? "Thank you for your donation!"
                : "Item donation submitted!"}
            </h2>
            <p className="mb-6 text-[14px] leading-[1.6] text-slate-500 dark:text-slate-400">
              {activeTab === "monetary"
                ? "Your payment is being processed. You will be redirected to complete the transaction."
                : "Your item donation has been recorded. Our team will review it shortly."}
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                className="btn-primary py-3 px-6 text-xs"
                onClick={() => {
                  setSuccess(false);
                  setAmount("");
                  setCustomAmount("");
                  setItemName("");
                }}
              >
                Make Another Donation
                <ArrowRight className="h-4 w-4" />
              </button>
              <a
                href="/donations"
                className="btn-secondary py-3 px-6 text-xs no-underline"
              >
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1">
              <Heart className="w-3.5 h-3.5" />
              <span>Support the Community</span>
            </span>
          </div>
          <h3 className="font-display font-bold text-xl sm:text-2xl text-slate-900 dark:text-white mt-1">
            Make a{" "}
            <span className="bg-gradient-to-r from-blue-600 to-emerald-500 bg-clip-text text-transparent">
              Donation
            </span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Contribute funds or items to support your circles and community.
          </p>
        </div>
      </div>

      <FadeInUp delay={200}>
        <div className="mb-6 flex gap-1 rounded-2xl bg-slate-100 dark:bg-slate-800 p-1">
          {(["monetary", "item"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setError("");
              }}
              className={`flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-semibold border-none cursor-pointer transition-all duration-200 ${
                activeTab === tab
                  ? "bg-white dark:bg-slate-900 text-[var(--color-brand-primary)] shadow-sm"
                  : "bg-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              {tab === "monetary" ? (
                <>
                  <CreditCard className="h-4 w-4" />
                  Monetary
                </>
              ) : (
                <>
                  <Package className="h-4 w-4" />
                  Item Donation
                </>
              )}
            </button>
          ))}
        </div>
      </FadeInUp>

      {error && (
        <FadeInUp delay={50}>
          <div className="mb-4 rounded-2xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/30 p-3 text-[13px] text-red-600 dark:text-red-400">
            {error}
          </div>
        </FadeInUp>
      )}

      {activeTab === "monetary" ? (
        <FadeInUp delay={300}>
          <Card padding="1.5rem" className="rounded-3xl">
            {groups.length > 0 && (
              <div className="mb-6">
                <label className="mb-2 block text-[12px] font-semibold text-slate-600 dark:text-slate-300">
                  Donate to a Circle (optional)
                </label>
                <select
                  value={groupId}
                  onChange={(e) => setGroupId(e.target.value)}
                  className="w-full cursor-pointer rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5 text-[13px] text-slate-900 dark:text-white outline-none focus:border-[var(--color-brand-primary)] focus:ring-2 focus:ring-[var(--color-brand-primary)]/20"
                >
                  <option value="">General Fund</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} — ₦{g.currentAmount.toLocaleString()} / ₦
                      {g.targetAmount.toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="mb-6">
              <label className="mb-2 block text-[12px] font-semibold text-slate-600 dark:text-slate-300">
                Select Amount
              </label>
              <div className="mb-3 grid grid-cols-3 gap-2">
                {presetAmounts.map((preset) => (
                  <button
                    key={preset}
                    onClick={() => {
                      setAmount(String(preset));
                      setCustomAmount("");
                    }}
                    className={`rounded-xl border px-3 py-3 font-mono text-[13px] font-semibold transition-all cursor-pointer ${
                      amount === String(preset)
                        ? "border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)] shadow-sm"
                        : "border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-[var(--color-brand-primary)]/40 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    ₦{preset.toLocaleString()}
                  </button>
                ))}
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[13px] font-semibold text-slate-400 dark:text-slate-500">
                  ₦
                </span>
                <input
                  type="number"
                  placeholder="Custom amount"
                  value={customAmount}
                  onChange={(e) => {
                    setCustomAmount(e.target.value);
                    setAmount("");
                  }}
                  className={`${inputClass} pl-7 font-mono`}
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="mb-2 block text-[12px] font-semibold text-slate-600 dark:text-slate-300">
                Notes (optional)
              </label>
              <div className="relative">
                <MessageCircle className="absolute left-3.5 top-3 h-4 w-4 text-slate-400 dark:text-slate-500" />
                <textarea
                  placeholder="Add a note to your donation..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className={`${inputClass} resize-none pl-9`}
                />
              </div>
            </div>

            <button
              onClick={handleMonetaryDonation}
              disabled={loading || (!amount && !customAmount)}
              className="btn-primary py-3.5 text-xs w-full disabled:opacity-50"
            >
              {loading ? (
                "Processing..."
              ) : (
                <>
                  Donate Now
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </Card>
        </FadeInUp>
      ) : (
        <FadeInUp delay={300}>
          <Card padding="1.5rem" className="rounded-3xl">
            <div className="mb-5">
              <label className="mb-2 block text-[12px] font-semibold text-slate-600 dark:text-slate-300">
                Item Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Winter Jacket, Laptop Bag"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="mb-5 grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-[12px] font-semibold text-slate-600 dark:text-slate-300">
                  Category
                </label>
                <select
                  value={itemCategory}
                  onChange={(e) => setItemCategory(e.target.value)}
                  className="w-full cursor-pointer rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3 text-[13px] text-slate-900 dark:text-white outline-none focus:border-[var(--color-brand-primary)] focus:ring-2 focus:ring-[var(--color-brand-primary)]/20"
                >
                  <option value="">Select category</option>
                  {itemCategories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-[12px] font-semibold text-slate-600 dark:text-slate-300">
                  Condition
                </label>
                <select
                  value={itemCondition}
                  onChange={(e) => setItemCondition(e.target.value)}
                  className="w-full cursor-pointer rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3 text-[13px] text-slate-900 dark:text-white outline-none focus:border-[var(--color-brand-primary)] focus:ring-2 focus:ring-[var(--color-brand-primary)]/20"
                >
                  <option value="">Select condition</option>
                  {itemConditions.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mb-5">
              <label className="mb-2 block text-[12px] font-semibold text-slate-600 dark:text-slate-300">
                Description
              </label>
              <textarea
                placeholder="Describe the item you'd like to donate..."
                value={itemDescription}
                onChange={(e) => setItemDescription(e.target.value)}
                rows={3}
                className={`${inputClass} resize-none`}
              />
            </div>

            <div className="mb-5">
              <label className="mb-2 block text-[12px] font-semibold text-slate-600 dark:text-slate-300">
                Item Image (optional)
              </label>
              <input
                ref={itemImageRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleItemImageSelect}
                className="hidden"
              />
              {itemImage ? (
                <div className="flex items-center gap-3 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-900/30 p-3">
                  <img
                    src={itemImage.preview}
                    alt="Preview"
                    className="h-16 w-16 rounded-lg object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <span className="block truncate text-[12px] font-medium text-slate-900 dark:text-white">
                      {itemImage.file.name}
                    </span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                      {(itemImage.file.size / 1024).toFixed(1)} KB
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={removeItemImage}
                    className="cursor-pointer border-0 bg-none p-1 text-red-600 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => itemImageRef.current?.click()}
                  className="w-full cursor-pointer rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 p-6 text-center transition-all duration-200 hover:border-[var(--color-brand-primary)]"
                >
                  <Upload className="mx-auto mb-1.5 h-5 w-5 text-slate-400" />
                  <span className="block text-[12px] text-slate-500 dark:text-slate-400">
                    Click to upload item image
                  </span>
                  <span className="mt-1 block text-[10px] text-slate-400 dark:text-slate-500">
                    JPEG, PNG, WebP, or GIF up to 10MB
                  </span>
                </button>
              )}
            </div>

            <div className="mb-6">
              <label className="mb-2 block text-[12px] font-semibold text-slate-600 dark:text-slate-300">
                Additional Notes (optional)
              </label>
              <input
                type="text"
                placeholder="Any pickup preferences or other details..."
                value={itemNotes}
                onChange={(e) => setItemNotes(e.target.value)}
                className={inputClass}
              />
            </div>

            <button
              onClick={handleItemDonation}
              disabled={loading || !itemName.trim()}
              className="btn-primary py-3.5 text-xs w-full disabled:opacity-50"
            >
              {loading ? (
                "Submitting..."
              ) : (
                <>
                  Submit Item Donation
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </Card>
        </FadeInUp>
      )}
    </div>
  );
}
