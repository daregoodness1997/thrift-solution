"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
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

interface ImageFile {
  file: File;
  preview: string;
}

export default function NewListingPage() {
  const { token } = useAuth();
  const router = useRouter();
  const [cfg, setCfg] = useState<BrandConfig>(fallback);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("other");
  const [condition, setCondition] = useState("good");
  const [imageFile, setImageFile] = useState<ImageFile | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fileRef = useRef<HTMLInputElement>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  useEffect(() => {
    fetch(`${API_URL}/api/config`)
      .then((r) => r.json())
      .then((data) => { if (data && data.name) setCfg((prev) => ({ ...prev, ...data })); })
      .catch(() => {});
  }, [API_URL]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError("File size must be less than 10MB");
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
      setError("Only JPEG, PNG, WebP, and GIF files are allowed");
      return;
    }

    setError("");
    const preview = URL.createObjectURL(file);
    setImageFile({ file, preview });
  };

  const removeFile = () => {
    if (imageFile?.preview) {
      URL.revokeObjectURL(imageFile.preview);
    }
    setImageFile(null);
    if (fileRef.current) {
      fileRef.current.value = "";
    }
  };

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
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("description", description.trim());
      formData.append("price", String(Number(price)));
      formData.append("category", category);
      formData.append("condition", condition);

      if (imageFile) {
        formData.append("image", imageFile.file);
      }

      const res = await fetch(`${API_URL}/api/marketplace`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Listing created successfully!");
        router.push(`/marketplace/${data.data.id}`);
      } else {
        toast.error(data.error || "Failed to create listing");
      }
    } catch {
      toast.error("Failed to create listing");
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
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#2D2D2D", marginBottom: "0.375rem" }}>Product Image (optional)</label>
                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleFileSelect} style={{ display: "none" }} />
                {imageFile ? (
                  <div style={{ padding: "0.75rem", borderRadius: "0.75rem", border: "1px solid #A7F3D0", backgroundColor: "#ECFDF5", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <img src={imageFile.preview} alt="Preview" style={{ width: "64px", height: "64px", borderRadius: "0.5rem", objectFit: "cover" }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: "12px", fontWeight: 500, color: "#2D2D2D", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{imageFile.file.name}</span>
                      <span style={{ fontSize: "10px", color: "#059669" }}>{(imageFile.file.size / 1024).toFixed(1)} KB</span>
                    </div>
                    <button type="button" onClick={removeFile} style={{ background: "none", border: "none", cursor: "pointer", padding: "0.25rem", color: "#DC2626" }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M18 6L6 18M6 6l12 12" /></svg>
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={() => fileRef.current?.click()} style={{ width: "100%", padding: "2rem", borderRadius: "0.75rem", border: "2px dashed #D1D5DB", backgroundColor: "#FAFAFA", cursor: "pointer", textAlign: "center", transition: "all 0.2s ease" }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = cfg.colors.primary; e.currentTarget.style.backgroundColor = `${cfg.colors.primary}05`; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#D1D5DB"; e.currentTarget.style.backgroundColor = "#FAFAFA"; }}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth={1.5} style={{ margin: "0 auto 0.5rem" }}><path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                    <span style={{ fontSize: "12px", color: "#717171", display: "block" }}>Click to upload product image</span>
                    <span style={{ fontSize: "10px", color: "#999", display: "block", marginTop: "0.25rem" }}>JPEG, PNG, WebP, or GIF up to 10MB</span>
                  </button>
                )}
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
