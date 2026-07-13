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
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "clamp(1rem, 3vw, 2rem)" }}>
        <FadeInUp>
          <Card padding="2rem" style={{ textAlign: "center" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>
              {activeTab === "monetary" ? "\uD83C\uDF81" : "\uD83C\uDF8D"}
            </div>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 600, color: "#1A1A1A", marginBottom: "0.5rem" }}>
              {activeTab === "monetary" ? "Thank you for your donation!" : "Item donation submitted!"}
            </h2>
            <p style={{ fontSize: "14px", color: "#717171", marginBottom: "1.5rem", lineHeight: 1.6 }}>
              {activeTab === "monetary"
                ? "Your payment is being processed. You will be redirected to complete the transaction."
                : "Your item donation has been recorded. Our team will review it shortly."}
            </p>
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
              <Button onClick={() => { setSuccess(false); setAmount(""); setCustomAmount(""); setItemName(""); }}>
                Make Another Donation
              </Button>
              <a href="/donations" style={{ padding: "0.75rem 1.5rem", borderRadius: "9999px", fontSize: "14px", fontWeight: 600, border: "1px solid #EAEAEA", backgroundColor: "#ffffff", color: "#717171", textDecoration: "none", transition: "all 0.2s ease", display: "inline-flex", alignItems: "center" }}>
                View History
              </a>
            </div>
          </Card>
        </FadeInUp>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "clamp(1rem, 3vw, 2rem)" }}>
      <PageHeader
        badgeLabel="Support the Community"
        heading="Make a"
        accentText="Donation"
        description="Contribute funds or items to support your circles and community."
      />

      <FadeInUp delay={200}>
        <div style={{ display: "flex", gap: "0.25rem", marginBottom: "1.5rem", backgroundColor: "#F5F7F5", borderRadius: "0.75rem", padding: "0.25rem" }}>
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
          <div style={{ padding: "0.75rem 1rem", borderRadius: "0.75rem", backgroundColor: "#FEF2F2", border: "1px solid #FECACA", color: "#DC2626", fontSize: "13px", marginBottom: "1rem" }}>
            {error}
          </div>
        </FadeInUp>
      )}

      {activeTab === "monetary" ? (
        <FadeInUp delay={300}>
          <Card padding="1.5rem">
            {groups.length > 0 && (
              <div style={{ marginBottom: "1.5rem" }}>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#2D2D2D", display: "block", marginBottom: "0.5rem" }}>
                  Donate to a Circle (optional)
                </label>
                <select
                  value={groupId}
                  onChange={(e) => setGroupId(e.target.value)}
                  style={{ width: "100%", padding: "0.625rem 0.75rem", borderRadius: "0.75rem", border: "1px solid #EAEAEA", fontSize: "13px", color: "#2D2D2D", backgroundColor: "#ffffff", outline: "none", cursor: "pointer" }}
                >
                  <option value="">General Fund</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>{g.name} — ₦{g.currentAmount.toLocaleString()} / ₦{g.targetAmount.toLocaleString()}</option>
                  ))}
                </select>
              </div>
            )}

            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "#2D2D2D", display: "block", marginBottom: "0.5rem" }}>
                Select Amount
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.5rem", marginBottom: "0.75rem" }}>
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
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", fontSize: "13px", fontWeight: 600, color: "#999" }}>₦</span>
                <input
                  type="number"
                  placeholder="Custom amount"
                  value={customAmount}
                  onChange={(e) => { setCustomAmount(e.target.value); setAmount(""); }}
                  style={{ width: "100%", padding: "0.75rem 0.75rem 0.75rem 1.75rem", borderRadius: "0.75rem", border: "1px solid #EAEAEA", fontSize: "13px", fontFamily: "'JetBrains Mono', monospace", outline: "none", transition: "border-color 0.2s ease", boxSizing: "border-box" }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = config.colors.primary; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "#EAEAEA"; }}
                />
              </div>
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "#2D2D2D", display: "block", marginBottom: "0.5rem" }}>
                Payment Method
              </label>
              <div style={{ display: "flex", gap: "0.5rem" }}>
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

            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "#2D2D2D", display: "block", marginBottom: "0.5rem" }}>
                Notes (optional)
              </label>
              <textarea
                placeholder="Add a note to your donation..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                style={{ width: "100%", padding: "0.75rem", borderRadius: "0.75rem", border: "1px solid #EAEAEA", fontSize: "13px", outline: "none", resize: "vertical", fontFamily: "inherit", transition: "border-color 0.2s ease", boxSizing: "border-box" }}
                onFocus={(e) => { e.currentTarget.style.borderColor = config.colors.primary; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "#EAEAEA"; }}
              />
            </div>

            <Button
              onClick={handleMonetaryDonation}
              disabled={loading || (!amount && !customAmount)}
              style={{ width: "100%", justifyContent: "center", opacity: loading || (!amount && !customAmount) ? 0.5 : 1 }}
            >
              {loading ? "Processing..." : "Donate Now"}
            </Button>
          </Card>
        </FadeInUp>
      ) : (
        <FadeInUp delay={300}>
          <Card padding="1.5rem">
            <div style={{ marginBottom: "1.25rem" }}>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "#2D2D2D", display: "block", marginBottom: "0.5rem" }}>
                Item Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Winter Jacket, Laptop Bag"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                style={{ width: "100%", padding: "0.75rem", borderRadius: "0.75rem", border: "1px solid #EAEAEA", fontSize: "13px", outline: "none", transition: "border-color 0.2s ease", boxSizing: "border-box" }}
                onFocus={(e) => { e.currentTarget.style.borderColor = config.colors.primary; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "#EAEAEA"; }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.25rem" }}>
              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#2D2D2D", display: "block", marginBottom: "0.5rem" }}>
                  Category
                </label>
                <select
                  value={itemCategory}
                  onChange={(e) => setItemCategory(e.target.value)}
                  style={{ width: "100%", padding: "0.75rem", borderRadius: "0.75rem", border: "1px solid #EAEAEA", fontSize: "13px", color: "#2D2D2D", backgroundColor: "#ffffff", outline: "none", cursor: "pointer", boxSizing: "border-box" }}
                >
                  <option value="">Select category</option>
                  {itemCategories.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#2D2D2D", display: "block", marginBottom: "0.5rem" }}>
                  Condition
                </label>
                <select
                  value={itemCondition}
                  onChange={(e) => setItemCondition(e.target.value)}
                  style={{ width: "100%", padding: "0.75rem", borderRadius: "0.75rem", border: "1px solid #EAEAEA", fontSize: "13px", color: "#2D2D2D", backgroundColor: "#ffffff", outline: "none", cursor: "pointer", boxSizing: "border-box" }}
                >
                  <option value="">Select condition</option>
                  {itemConditions.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: "1.25rem" }}>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "#2D2D2D", display: "block", marginBottom: "0.5rem" }}>
                Description
              </label>
              <textarea
                placeholder="Describe the item you'd like to donate..."
                value={itemDescription}
                onChange={(e) => setItemDescription(e.target.value)}
                rows={3}
                style={{ width: "100%", padding: "0.75rem", borderRadius: "0.75rem", border: "1px solid #EAEAEA", fontSize: "13px", outline: "none", resize: "vertical", fontFamily: "inherit", transition: "border-color 0.2s ease", boxSizing: "border-box" }}
                onFocus={(e) => { e.currentTarget.style.borderColor = config.colors.primary; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "#EAEAEA"; }}
              />
            </div>

            <div style={{ marginBottom: "1.25rem" }}>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "#2D2D2D", display: "block", marginBottom: "0.5rem" }}>
                Item Image (optional)
              </label>
              <input ref={itemImageRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleItemImageSelect} style={{ display: "none" }} />
              {itemImage ? (
                <div style={{ padding: "0.75rem", borderRadius: "0.75rem", border: "1px solid #A7F3D0", backgroundColor: "#ECFDF5", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <img src={itemImage.preview} alt="Preview" style={{ width: "64px", height: "64px", borderRadius: "0.5rem", objectFit: "cover" }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: "12px", fontWeight: 500, color: "#2D2D2D", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{itemImage.file.name}</span>
                    <span style={{ fontSize: "10px", color: "#059669" }}>{(itemImage.file.size / 1024).toFixed(1)} KB</span>
                  </div>
                  <button type="button" onClick={removeItemImage} style={{ background: "none", border: "none", cursor: "pointer", padding: "0.25rem", color: "#DC2626" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M18 6L6 18M6 6l12 12" /></svg>
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => itemImageRef.current?.click()} style={{ width: "100%", padding: "1.5rem", borderRadius: "0.75rem", border: "2px dashed #D1D5DB", backgroundColor: "#FAFAFA", cursor: "pointer", textAlign: "center", transition: "all 0.2s ease" }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = config.colors.primary; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#D1D5DB"; }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth={1.5} style={{ margin: "0 auto 0.375rem" }}><path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                  <span style={{ fontSize: "12px", color: "#717171", display: "block" }}>Click to upload item image</span>
                  <span style={{ fontSize: "10px", color: "#999", display: "block", marginTop: "0.25rem" }}>JPEG, PNG, WebP, or GIF up to 10MB</span>
                </button>
              )}
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "#2D2D2D", display: "block", marginBottom: "0.5rem" }}>
                Additional Notes (optional)
              </label>
              <input
                type="text"
                placeholder="Any pickup preferences or other details..."
                value={itemNotes}
                onChange={(e) => setItemNotes(e.target.value)}
                style={{ width: "100%", padding: "0.75rem", borderRadius: "0.75rem", border: "1px solid #EAEAEA", fontSize: "13px", outline: "none", transition: "border-color 0.2s ease", boxSizing: "border-box" }}
                onFocus={(e) => { e.currentTarget.style.borderColor = config.colors.primary; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "#EAEAEA"; }}
              />
            </div>

            <Button
              onClick={handleItemDonation}
              disabled={loading || !itemName.trim()}
              style={{ width: "100%", justifyContent: "center", opacity: loading || !itemName.trim() ? 0.5 : 1 }}
            >
              {loading ? "Submitting..." : "Submit Item Donation"}
            </Button>
          </Card>
        </FadeInUp>
      )}
    </div>
  );
}
