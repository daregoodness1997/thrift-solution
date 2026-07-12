"use client";

import { useState, useEffect, useCallback } from "react";
import { config, BrandConfig } from "@thrift/config";
import { Card, Button, ColorfulBadge, FadeInUp, FadeIn, StaggerChildren } from "@thrift/ui";
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
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "clamp(1rem, 3vw, 2rem)" }}>
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
        <div style={{ marginBottom: "2rem" }}>
          <form onSubmit={handleSearch} style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem", flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 300px", position: "relative" }}>
              <svg style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "#999" }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder="Search items..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: "100%", padding: "0.625rem 0.75rem 0.625rem 2.25rem", borderRadius: "0.75rem", border: "1px solid #EAEAEA", fontSize: "13px", outline: "none", boxSizing: "border-box", transition: "border-color 0.2s ease" }}
                onFocus={(e) => { e.currentTarget.style.borderColor = cfg.colors.primary; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "#EAEAEA"; }}
              />
            </div>
            <a href="/marketplace/my" style={{ display: "flex", alignItems: "center", padding: "0.625rem 1rem", borderRadius: "0.75rem", fontSize: "12px", fontWeight: 600, color: cfg.colors.primary, border: `1px solid ${cfg.colors.primary}30`, backgroundColor: `${cfg.colors.primary}08`, textDecoration: "none", transition: "all 0.2s ease", whiteSpace: "nowrap" }}>
              My Listings
            </a>
          </form>
          <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap" }}>
            {CATEGORIES.map((c) => (
              <button
                key={c.key}
                onClick={() => { setCategory(c.key); setPage(1); }}
                style={{ padding: "0.375rem 0.75rem", borderRadius: "9999px", fontSize: "11px", fontWeight: 600, border: `1px solid ${category === c.key ? cfg.colors.primary : "#EAEAEA"}`, backgroundColor: category === c.key ? `${cfg.colors.primary}0A` : "#ffffff", color: category === c.key ? cfg.colors.primary : "#717171", cursor: "pointer", transition: "all 0.2s ease" }}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </FadeIn>

      {/* Listings Grid */}
      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.5rem" }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : listings.length === 0 ? (
        <FadeInUp>
          <Card padding="3rem">
            <div style={{ textAlign: "center" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "50%", backgroundColor: `${cfg.colors.primary}10`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={cfg.colors.primary} strokeWidth={1.5} strokeLinecap="round">
                  <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "#2D2D2D", marginBottom: "0.5rem" }}>No listings found</h3>
              <p style={{ fontSize: "13px", color: "#717171", marginBottom: "1.5rem" }}>
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
              <a key={listing.id} href={`/marketplace/${listing.id}`} style={{ textDecoration: "none" }}>
                <div style={{ borderRadius: "1.5rem", overflow: "hidden", cursor: "pointer", transition: "all 0.2s ease", backgroundColor: "#FFFFFFDF", boxShadow: "0 2px 8px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.02)", borderTop: `3px solid ${cfg.colors.primary}22` }}
                  onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(0,0,0,0.08)"; }}
                  onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.02)"; }}>
                  <div style={{ height: "160px", backgroundColor: "#F5F7F5", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                    {listing.imageUrl ? (
                      <img src={listing.imageUrl} alt={listing.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#CCC" strokeWidth={1.5}>
                        <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    )}
                    <span style={{ position: "absolute", top: "0.75rem", right: "0.75rem", padding: "0.125rem 0.5rem", borderRadius: "9999px", fontSize: "9px", fontWeight: 700, color: CONDITION_COLORS[listing.condition] || "#717171", backgroundColor: "#ffffff", border: `1px solid ${CONDITION_COLORS[listing.condition] || "#EAEAEA"}`, textTransform: "capitalize" }}>
                      {listing.condition.replace("_", " ")}
                    </span>
                  </div>
                  <div style={{ padding: "1rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                      <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#2D2D2D", lineHeight: 1.3, flex: 1, marginRight: "0.5rem" }}>{listing.title}</h3>
                      <span style={{ fontSize: "14px", fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: cfg.colors.primary, whiteSpace: "nowrap" }}>
                        {formatNaira(listing.price)}
                      </span>
                    </div>
                    <p style={{ fontSize: "11px", color: "#717171", marginBottom: "0.75rem", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {listing.description}
                    </p>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "10px", color: "#999" }}>by {listing.seller.name}</span>
                      <span style={{ fontSize: "10px", color: "#999" }}>{listing._count.offers} offer{listing._count.offers !== 1 ? "s" : ""}</span>
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </StaggerChildren>

          {totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem" }}>
              <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} style={{ padding: "0.5rem 1rem", borderRadius: "0.5rem", fontSize: "12px", fontWeight: 600, border: "1px solid #EAEAEA", backgroundColor: "#ffffff", color: page <= 1 ? "#CCC" : "#717171", cursor: page <= 1 ? "not-allowed" : "pointer" }}>Previous</button>
              <span style={{ padding: "0.5rem 1rem", fontSize: "12px", color: "#999", fontFamily: "'JetBrains Mono', monospace" }}>Page {page} of {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} style={{ padding: "0.5rem 1rem", borderRadius: "0.5rem", fontSize: "12px", fontWeight: 600, border: "1px solid #EAEAEA", backgroundColor: "#ffffff", color: page >= totalPages ? "#CCC" : "#717171", cursor: page >= totalPages ? "not-allowed" : "pointer" }}>Next</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
