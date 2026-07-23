"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { config, BrandConfig } from "@thrift/config";
import { Card, Button, FadeInUp } from "@thrift/ui";
import { useAuth } from "@/lib/auth-context";
import { useRouter, useParams } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { Skeleton } from "@/components/Skeleton";

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

const STATUSES = [
  { value: "active", label: "Active" },
  { value: "sold", label: "Sold" },
  { value: "cancelled", label: "Cancelled" },
];

interface ImageFile {
  file: File;
  preview: string;
}

interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  condition: string;
  imageUrl?: string;
  status: string;
  createdAt: string;
  seller: { id: string; name: string; email: string };
}

export default function EditListingPage() {
  const { token, user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [cfg, setCfg] = useState<BrandConfig>(fallback);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("other");
  const [condition, setCondition] = useState("good");
  const [status, setStatus] = useState("active");
  const [existingImage, setExistingImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<ImageFile | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
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

  const fetchListing = useCallback(async () => {
    if (!token || !id) { setLoading(false); return; }
    try {
      const res = await fetch(`${API_URL}/api/marketplace/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        const listing: Listing = data.data;
        if (user && listing.seller.id !== user.id) {
          router.push(`/marketplace/${id}`);
          return;
        }
        setTitle(listing.title);
        setDescription(listing.description);
        setPrice(String(listing.price));
        setCategory(listing.category);
        setCondition(listing.condition);
        setStatus(listing.status);
        setExistingImage(listing.imageUrl || null);
      } else {
        router.push("/marketplace");
      }
    } catch {
      router.push("/marketplace");
    }
    setLoading(false);
  }, [token, API_URL, id, user, router]);

  useEffect(() => { fetchListing(); }, [fetchListing]);

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
    setRemoveImage(false);
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

  const handleRemoveExistingImage = () => {
    setExistingImage(null);
    setRemoveImage(true);
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
      formData.append("status", status);

      if (imageFile) {
        formData.append("image", imageFile.file);
      } else if (removeImage) {
        formData.append("imageUrl", "");
      }

      const res = await fetch(`${API_URL}/api/marketplace/${id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Listing updated successfully!");
        router.push(`/marketplace/${id}`);
      } else {
        toast.error(data.error || "Failed to update listing");
      }
    } catch {
      toast.error("Failed to update listing");
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-[720px] p-[clamp(1rem,3vw,2rem)]">
        <Skeleton width="200px" height="12px" style={{ marginBottom: "1rem" }} />
        <Skeleton width="320px" height="28px" style={{ marginBottom: "2rem" }} />
        <Card padding="2rem">
          <div className="flex flex-col gap-6">
            <Skeleton width="100%" height="40px" />
            <Skeleton width="100%" height="100px" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton width="100%" height="40px" />
              <Skeleton width="100%" height="40px" />
            </div>
            <Skeleton width="100%" height="40px" />
            <Skeleton width="100%" height="120px" />
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[720px] p-[clamp(1rem,3vw,2rem)]">
      <PageHeader
        badgeLabel="Marketplace"
        heading="Edit"
        accentText="Listing"
        description="Update your listing details."
      />

      <FadeInUp delay={200}>
        <Card padding="2rem">
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-900 dark:text-white">Title *</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What are you selling?"
                  className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-2.5 px-3 text-[13px] text-slate-900 dark:text-white outline-none box-border transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-900 dark:text-white">Description *</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the item, its condition, and any relevant details..." rows={4}
                  className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-2.5 px-3 resize-y text-[13px] text-slate-900 dark:text-white outline-none box-border font-sans transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-900 dark:text-white">Price (NGN) *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] font-semibold text-slate-500 dark:text-slate-400">₦</span>
                    <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00" min="0" step="0.01"
                      className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-2.5 pl-7 pr-3 font-mono text-[13px] text-slate-900 dark:text-white outline-none box-border transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-900 dark:text-white">Category *</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)}
                    className="w-full cursor-pointer rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-2.5 px-3 text-[13px] text-slate-900 dark:text-white outline-none box-border transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                    {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-900 dark:text-white">Condition *</label>
                  <select value={condition} onChange={(e) => setCondition(e.target.value)}
                    className="w-full cursor-pointer rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-2.5 px-3 text-[13px] text-slate-900 dark:text-white outline-none box-border transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                    {CONDITIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-900 dark:text-white">Status *</label>
                  <select value={status} onChange={(e) => setStatus(e.target.value)}
                    className="w-full cursor-pointer rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-2.5 px-3 text-[13px] text-slate-900 dark:text-white outline-none box-border transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                    {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-900 dark:text-white">Product Image (optional)</label>
                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleFileSelect} className="hidden" />
                {imageFile ? (
                  <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 p-3">
                    <img src={imageFile.preview} alt="Preview" className="h-16 w-16 rounded-lg object-cover" />
                    <div className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-medium text-slate-900 dark:text-white">{imageFile.file.name}</span>
                      <span className="text-[10px] text-emerald-600">{(imageFile.file.size / 1024).toFixed(1)} KB</span>
                    </div>
                    <button type="button" onClick={removeFile} className="cursor-pointer border-none bg-none p-1 text-red-600">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M18 6L6 18M6 6l12 12" /></svg>
                    </button>
                  </div>
                ) : existingImage ? (
                  <div className="flex items-center gap-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 p-3">
                    <img src={existingImage} alt="Current" className="h-16 w-16 rounded-lg object-cover" />
                    <div className="min-w-0 flex-1">
                      <span className="block text-xs font-medium text-slate-900 dark:text-white">Current image</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">Upload a new image to replace</span>
                    </div>
                    <button type="button" onClick={handleRemoveExistingImage} className="cursor-pointer border-none bg-none p-1 text-red-600">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M18 6L6 18M6 6l12 12" /></svg>
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={() => fileRef.current?.click()} className="w-full cursor-pointer rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/60 p-8 text-center transition-all hover:border-blue-500 hover:bg-blue-600/5">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth={1.5} className="mx-auto mb-2"><path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                    <span className="block text-xs text-slate-500 dark:text-slate-400">Click to upload product image</span>
                    <span className="mt-1 block text-[10px] text-slate-500 dark:text-slate-400">JPEG, PNG, WebP, or GIF up to 10MB</span>
                  </button>
                )}
              </div>

              {error && (
                <div className="rounded-2xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-xs font-medium text-red-600">
                  {error}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <a href={`/marketplace/${id}`} className="rounded-full border border-slate-200 dark:border-slate-700 px-5 py-2.5 text-[13px] font-semibold text-slate-500 dark:text-slate-400 no-underline transition-all hover:bg-slate-50 dark:hover:bg-slate-800">
                  Cancel
                </a>
                <Button type="submit" variant="primary" size="md" disabled={submitting}>
                  {submitting ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </form>
        </Card>
      </FadeInUp>
    </div>
  );
}
