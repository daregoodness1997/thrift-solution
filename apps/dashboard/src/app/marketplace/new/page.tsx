"use client";

import { useState, useEffect } from "react";
import { config, BrandConfig } from "@thrift/config";
import { Card, Button, ColorfulBadge, FadeInUp } from "@thrift/ui";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";

const fallback = config;

const CATEGORIES = [
  { value: "clothing", label: "Clothing & Accessories" },
  { value: "electronics", label: "Electronics" },
  { value: "food", label: "Food & Groceries" },
  { value: "household", label: "Household Items" },
  { value: "books", label: "Books & Supplies" },
  { value: "health", label: "Health & Wellness" },
  { value: "services", label: "Services" },
  { value: "other", label: "Other" },
];

const CONDITIONS = [
  { value: "new", label: "New" },
  { value: "like_new", label: "Like New" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
];

export default function NewListingPage() {
  const { token } = useAuth();
  const router = useRouter();
  const [cfg, setCfg] = useState<BrandConfig>(fallback);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("other");
  const [condition, setCondition] = useState("good");
  const [imageUrl, setImageUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  useEffect(() => {
    fetch(`${API_URL}/api/config`)
      .then((r) => r.json())
      .then((data) => { if (data && data.name) setCfg((prev) => ({ ...prev, ...data })); })
      .catch(() => {});
  }, [API_URL]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!title.trim() || !description.trim() || !price) {
      setError("Please fill in all required fields");
      return;
    }
    if (Number(price) <= 0) {
      setError("Price must be greater than 0");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/marketplace`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          price: Number(price),
          category,
          condition,
          imageUrl: imageUrl.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        router.push(`/marketplace/${data.data.id}`);
      } else {
        setError(data.error || "Failed to create listing");
      }
    } catch {
      setError("Failed to create listing");
    }
    setSubmitting(false);
  };

  return (
    <div style={{ maxWidth: "720px", margin: "0 auto", padding: "clamp(1rem, 3vw, 2rem)" }}>
      <PageHeader
        badgeLabel="Marketplace"
        heading="Create"
        accentText="Listing"
        description="List an item for sale or trade in the community marketplace."
      />

      <FadeInUp delay={200}>
        <Card padding="2rem">
          <form onSubmit={handleSubmit}>
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#2D2D2D", marginBottom: "0.375rem" }}>Title *</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What are you selling?"
                  style={{ width: "100%", padding: "0.625rem 0.75rem", borderRadius: "0.75rem", border: "1px solid #EAEAEA", fontSize: "13px", outline: "none", boxSizing: "border-box", transition: "border-color 0.2s ease" }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = cfg.colors.primary; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "#EAEAEA"; }} />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#2D2D2D", marginBottom: "0.375rem" }}>Description *</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the item, its condition, and any relevant details..." rows={4}
                  style={{ width: "100%", padding: "0.625rem 0.75rem", borderRadius: "0.75rem", border: "1px solid #EAEAEA", fontSize: "13px", outline: "none", boxSizing: "border-box", resize: "vertical", fontFamily: "inherit", transition: "border-color 0.2s ease" }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = cfg.colors.primary; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "#EAEAEA"; }} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#2D2D2D", marginBottom: "0.375rem" }}>Price (NGN) *</label>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", fontSize: "13px", fontWeight: 600, color: "#999" }}>₦</span>
                    <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00" min="0" step="0.01"
                      style={{ width: "100%", padding: "0.625rem 0.75rem 0.625rem 1.75rem", borderRadius: "0.75rem", border: "1px solid #EAEAEA", fontSize: "13px", fontFamily: "'JetBrains Mono', monospace", outline: "none", boxSizing: "border-box", transition: "border-color 0.2s ease" }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = cfg.colors.primary; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = "#EAEAEA"; }} />
                  </div>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#2D2D2D", marginBottom: "0.375rem" }}>Category *</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)}
                    style={{ width: "100%", padding: "0.625rem 0.75rem", borderRadius: "0.75rem", border: "1px solid #EAEAEA", fontSize: "13px", outline: "none", boxSizing: "border-box", backgroundColor: "#ffffff", cursor: "pointer", transition: "border-color 0.2s ease" }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = cfg.colors.primary; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = "#EAEAEA"; }}>
                    {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#2D2D2D", marginBottom: "0.375rem" }}>Condition *</label>
                  <select value={condition} onChange={(e) => setCondition(e.target.value)}
                    style={{ width: "100%", padding: "0.625rem 0.75rem", borderRadius: "0.75rem", border: "1px solid #EAEAEA", fontSize: "13px", outline: "none", boxSizing: "border-box", backgroundColor: "#ffffff", cursor: "pointer", transition: "border-color 0.2s ease" }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = cfg.colors.primary; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = "#EAEAEA"; }}>
                    {CONDITIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#2D2D2D", marginBottom: "0.375rem" }}>Image URL (optional)</label>
                  <input type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..."
                    style={{ width: "100%", padding: "0.625rem 0.75rem", borderRadius: "0.75rem", border: "1px solid #EAEAEA", fontSize: "13px", outline: "none", boxSizing: "border-box", transition: "border-color 0.2s ease" }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = cfg.colors.primary; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = "#EAEAEA"; }} />
                </div>
              </div>

              {error && (
                <div style={{ padding: "0.75rem 1rem", borderRadius: "0.75rem", backgroundColor: "#FEF2F2", border: "1px solid #FECACA", color: "#DC2626", fontSize: "12px", fontWeight: 500 }}>
                  {error}
                </div>
              )}

              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", paddingTop: "0.5rem" }}>
                <a href="/marketplace" style={{ padding: "0.625rem 1.25rem", borderRadius: "9999px", fontSize: "13px", fontWeight: 600, color: "#717171", border: "1px solid #EAEAEA", textDecoration: "none", transition: "all 0.2s ease" }}>
                  Cancel
                </a>
                <Button type="submit" variant="primary" size="md" disabled={submitting}>
                  {submitting ? "Creating..." : "Create Listing"}
                </Button>
              </div>
            </div>
          </form>
        </Card>
      </FadeInUp>
    </div>
  );
}
