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
    <div className="mx-auto max-w-[720px] p-[clamp(1rem,3vw,2rem)]">
      <PageHeader
        badgeLabel="Marketplace"
        heading="Create"
        accentText="Listing"
        description="List an item for sale or trade in the community marketplace."
      />

      <FadeInUp delay={200}>
        <Card padding="2rem">
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-brand-dark">Title *</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What are you selling?"
                  className="w-full rounded-xl border border-gray-200 py-2.5 px-3 text-[13px] outline-none box-border transition-colors"
                  onFocus={(e) => { e.currentTarget.style.borderColor = cfg.colors.primary; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "#EAEAEA"; }} />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-brand-dark">Description *</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the item, its condition, and any relevant details..." rows={4}
                  className="w-full rounded-xl border border-gray-200 py-2.5 px-3 resize-y text-[13px] outline-none box-border font-sans transition-colors"
                  onFocus={(e) => { e.currentTarget.style.borderColor = cfg.colors.primary; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "#EAEAEA"; }} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-brand-dark">Price (NGN) *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] font-semibold text-gray-500">₦</span>
                    <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00" min="0" step="0.01"
                      className="w-full rounded-xl border border-gray-200 py-2.5 pl-7 pr-3 font-mono text-[13px] outline-none box-border transition-colors"
                      onFocus={(e) => { e.currentTarget.style.borderColor = cfg.colors.primary; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = "#EAEAEA"; }} />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-brand-dark">Category *</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)}
                    className="w-full cursor-pointer rounded-xl border border-gray-200 bg-white py-2.5 px-3 text-[13px] outline-none box-border transition-colors"
                    onFocus={(e) => { e.currentTarget.style.borderColor = cfg.colors.primary; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = "#EAEAEA"; }}>
                    {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-brand-dark">Condition *</label>
                <select value={condition} onChange={(e) => setCondition(e.target.value)}
                  className="w-full cursor-pointer rounded-xl border border-gray-200 bg-white py-2.5 px-3 text-[13px] outline-none box-border transition-colors"
                  onFocus={(e) => { e.currentTarget.style.borderColor = cfg.colors.primary; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "#EAEAEA"; }}>
                  {CONDITIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-brand-dark">Product Image (optional)</label>
                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleFileSelect} className="hidden" />
                {imageFile ? (
                  <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                    <img src={imageFile.preview} alt="Preview" className="h-16 w-16 rounded-lg object-cover" />
                    <div className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-medium text-brand-dark">{imageFile.file.name}</span>
                      <span className="text-[10px] text-emerald-600">{(imageFile.file.size / 1024).toFixed(1)} KB</span>
                    </div>
                    <button type="button" onClick={removeFile} className="cursor-pointer border-none bg-none p-1 text-red-600">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M18 6L6 18M6 6l12 12" /></svg>
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={() => fileRef.current?.click()} className="w-full cursor-pointer rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center transition-all hover:border-brand-primary hover:bg-[#1D4ED805]">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth={1.5} className="mx-auto mb-2"><path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                    <span className="block text-xs text-gray-500">Click to upload product image</span>
                    <span className="mt-1 block text-[10px] text-gray-500">JPEG, PNG, WebP, or GIF up to 10MB</span>
                  </button>
                )}
              </div>

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-600">
                  {error}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <a href="/marketplace" className="rounded-full border border-gray-200 px-5 py-2.5 text-[13px] font-semibold text-gray-500 no-underline transition-all">
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
