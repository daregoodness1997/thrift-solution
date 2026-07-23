"use client";

import { useState, useEffect, useCallback } from "react";
import { config, BrandConfig } from "@thrift/config";
import { Card, Button, FadeInUp, FadeIn, StaggerChildren } from "@thrift/ui";
import { formatNaira } from "@thrift/utils";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/PageHeader";
import { Skeleton, SkeletonCard } from "@/components/Skeleton";

const fallback = config;

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
  _count: { offers: number };
}

const CATEGORIES = [
  { key: "", label: "All" },
  { key: "clothing", label: "Clothing" },
  { key: "electronics", label: "Electronics" },
  { key: "food", label: "Food" },
  { key: "household", label: "Household" },
  { key: "books", label: "Books" },
  { key: "health", label: "Health" },
  { key: "services", label: "Services" },
  { key: "other", label: "Other" },
];

const CONDITION_COLORS: Record<string, string> = {
  new: "#059669",
  like_new: "#2563EB",
  good: "#D97706",
  fair: "#717171",
};

export default function MarketplacePage() {
  const { token, user } = useAuth();
  const [cfg, setCfg] = useState<BrandConfig>(fallback);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  useEffect(() => {
    fetch(`${API_URL}/api/config`)
      .then((r) => r.json())
      .then((data) => { if (data && data.name) setCfg((prev) => ({ ...prev, ...data })); })
      .catch(() => {});
  }, [API_URL]);

  const fetchListings = useCallback(async () => {
    if (!token) { setLoading(false); return; }
    try {
      const params = new URLSearchParams({ page: String(page), limit: "12" });
      if (category) params.set("category", category);
      if (search) params.set("search", search);

      const res = await fetch(`${API_URL}/api/marketplace?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setListings(data.data.items);
        setTotalPages(data.data.totalPages);
      }
    } catch {}
    setLoading(false);
  }, [token, API_URL, page, category, search]);

  useEffect(() => { setLoading(true); fetchListings(); }, [fetchListings]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  return (
    <div className="mx-auto max-w-[1280px] p-[clamp(1rem,3vw,2rem)]">
      <PageHeader
        badgeLabel="Marketplace"
        heading="Community"
        accentText="Marketplace"
        description="Buy, sell, and trade with fellow community members."
        right={
          <a href="/marketplace/new">
            <Button variant="primary" size="sm">+ List Item</Button>
          </a>
        }
      />

      {/* Search & Filters */}
      <FadeIn delay={100}>
        <div className="mb-8">
          <form onSubmit={handleSearch} className="mb-4 flex flex-wrap gap-3">
            <div className="relative flex-[1_1_300px]">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder="Search items..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-2.5 pl-9 pr-3 text-[13px] text-slate-900 dark:text-white outline-none box-border transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
              <a
              href="/marketplace/my"
              className="btn-secondary py-2.5 px-4 text-xs"
            >
              My Listings
            </a>
          </form>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((c) => (
              <button
                key={c.key}
                onClick={() => { setCategory(c.key); setPage(1); }}
                className={`rounded-full px-3 py-1.5 text-[11px] font-semibold cursor-pointer transition-all border ${
                  category === c.key
                    ? "border-blue-600 bg-blue-600/5 text-blue-600"
                    : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </FadeIn>

      {/* Listings Grid */}
      {loading ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : listings.length === 0 ? (
        <FadeInUp>
          <Card padding="3rem">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-600/10">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth={1.5} strokeLinecap="round">
                  <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h3 className="mb-2 text-base font-semibold text-slate-900 dark:text-white">No listings found</h3>
              <p className="mb-6 text-[13px] text-slate-500 dark:text-slate-400">
                {search || category ? "Try adjusting your search or filters." : "Be the first to list an item on the marketplace!"}
              </p>
              <a href="/marketplace/new">
                <Button variant="primary" size="sm">Create Listing</Button>
              </a>
            </div>
          </Card>
        </FadeInUp>
      ) : (
        <>
          <StaggerChildren staggerDelay={60} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.5rem", marginBottom: "2rem" }}>
            {listings.map((listing) => (
              <a key={listing.id} href={`/marketplace/${listing.id}`} className="no-underline">
                <div
                  className="overflow-hidden rounded-3xl cursor-pointer bg-white dark:bg-slate-900 transition-all shadow-[0_2px_8px_rgba(0,0,0,0.04),0_0_0_1px_rgba(0,0,0,0.02)] hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] border border-slate-200/80 dark:border-slate-800/80"
                >
                  <div className="relative flex h-40 items-center justify-center bg-slate-50 dark:bg-slate-800/60">
                    {listing.imageUrl ? (
                      <img src={listing.imageUrl} alt={listing.title} className="h-full w-full object-cover" />
                    ) : (
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth={1.5}>
                        <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    )}
                    <span
                      className="absolute top-3 right-3 px-2.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-mono font-bold uppercase tracking-wider"
                    >
                      {listing.condition.replace("_", " ")}
                    </span>
                  </div>
                  <div className="p-4">
                    <div className="mb-2 flex items-start justify-between">
                      <h3 className="flex-1 mr-2 text-sm font-semibold leading-[1.3] text-slate-900 dark:text-white">{listing.title}</h3>
                      <span className="whitespace-nowrap text-sm font-mono font-bold text-blue-600">
                        {formatNaira(listing.price)}
                      </span>
                    </div>
                    <p className="mb-3 line-clamp-2 text-[11px] text-slate-500 dark:text-slate-400">
                      {listing.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">by {listing.seller.name}</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">{listing._count.offers} offer{listing._count.offers !== 1 ? "s" : ""}</span>
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </StaggerChildren>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="btn-secondary py-2 px-4 text-xs disabled:opacity-50 disabled:cursor-not-allowed">Previous</button>
              <span className="px-4 py-2 text-xs text-slate-500 dark:text-slate-400 font-mono">Page {page} of {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="btn-secondary py-2 px-4 text-xs disabled:opacity-50 disabled:cursor-not-allowed">Next</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
