"use client";

import { useState, useEffect, useCallback } from "react";
import { config, BrandConfig } from "@thrift/config";
import { Card, Button, ColorfulBadge, FadeInUp, FadeIn } from "@thrift/ui";
import { formatNaira } from "@thrift/utils";
import { useAuth } from "@/lib/auth-context";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { Skeleton } from "@/components/Skeleton";

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
  offers: Offer[];
}

interface Offer {
  id: string;
  amount: number;
  message?: string;
  status: string;
  createdAt: string;
  offerer: { id: string; name: string; email: string };
}

const CONDITION_COLORS: Record<string, string> = {
  new: "#059669",
  like_new: "#2563EB",
  good: "#D97706",
  fair: "#717171",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "#D97706",
  accepted: "#059669",
  rejected: "#DC2626",
  withdrawn: "#717171",
};

export default function ListingDetailPage() {
  const { token, user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [cfg, setCfg] = useState<BrandConfig>(fallback);
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [offerAmount, setOfferAmount] = useState("");
  const [offerMessage, setOfferMessage] = useState("");
  const [submittingOffer, setSubmittingOffer] = useState(false);
  const [offerError, setOfferError] = useState("");
  const [offerSuccess, setOfferSuccess] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
      if (data.success) setListing(data.data);
    } catch {}
    setLoading(false);
  }, [token, API_URL, id]);

  useEffect(() => { fetchListing(); }, [fetchListing]);

  const isSeller = user && listing && listing.seller.id === user.id;

  const handleOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    setOfferError("");
    if (!offerAmount || Number(offerAmount) <= 0) {
      setOfferError("Please enter a valid offer amount");
      return;
    }
    setSubmittingOffer(true);
    try {
      const res = await fetch(`${API_URL}/api/marketplace/${id}/offers`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount: Number(offerAmount), message: offerMessage.trim() || undefined }),
      });
      const data = await res.json();
      if (data.success) {
        setOfferSuccess(true);
        setOfferAmount("");
        setOfferMessage("");
        fetchListing();
        setTimeout(() => setOfferSuccess(false), 3000);
      } else {
        setOfferError(data.error || "Failed to submit offer");
      }
    } catch {
      setOfferError("Failed to submit offer");
    }
    setSubmittingOffer(false);
  };

  const handleOfferAction = async (offerId: string, status: string) => {
    try {
      const res = await fetch(`${API_URL}/api/marketplace/${id}/offers/${offerId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) fetchListing();
    } catch {}
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this listing?")) return;
    setDeleting(true);
    try {
      const res = await fetch(`${API_URL}/api/marketplace/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) router.push("/marketplace");
    } catch {}
    setDeleting(false);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-[960px] p-[clamp(1rem,3vw,2rem)]">
        <Skeleton width="200px" height="12px" style={{ marginBottom: "1rem" }} />
        <Skeleton width="320px" height="28px" style={{ marginBottom: "2rem" }} />
        <div className="grid grid-cols-2 gap-8">
          <Skeleton width="100%" height="320px" />
          <div className="flex flex-col gap-4">
            <Skeleton width="60%" height="14px" />
            <Skeleton width="40%" height="24px" />
            <Skeleton width="100%" height="80px" />
            <Skeleton width="100%" height="40px" />
          </div>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="mx-auto max-w-[960px] p-[clamp(1rem,3vw,2rem)]">
        <Card padding="3rem">
          <div className="text-center">
            <h3 className="mb-2 text-base font-semibold text-brand-dark">Listing not found</h3>
            <p className="mb-6 text-[13px] text-gray-500">This listing may have been removed.</p>
            <a href="/marketplace"><Button variant="primary" size="sm">Back to Marketplace</Button></a>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[960px] p-[clamp(1rem,3vw,2rem)]">
      <FadeIn>
        <div className="mb-6">
          <a href="/marketplace" className="text-xs font-semibold no-underline" style={{ color: cfg.colors.primary }}>&larr; Back to Marketplace</a>
        </div>
      </FadeIn>

      <div className="mb-8 grid grid-cols-2 gap-8">
        <FadeIn delay={100}>
          <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-[#F5F7F5]">
            {listing.imageUrl ? (
              <img src={listing.imageUrl} alt={listing.title} className="h-full w-full object-cover" />
            ) : (
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#CCC" strokeWidth={1.5}>
                <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            )}
          </div>
        </FadeIn>

        <FadeIn delay={200}>
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-md px-2 py-0.5 text-[9px] font-bold uppercase font-mono" style={{ color: CONDITION_COLORS[listing.condition] || "#717171", backgroundColor: `${CONDITION_COLORS[listing.condition] || "#717171"}12`, border: `1px solid ${CONDITION_COLORS[listing.condition] || "#717171"}20` }}>
                {listing.condition.replace("_", " ")}
              </span>
              <span className="rounded-md bg-[#F5F5F5] px-2 py-0.5 text-[9px] font-bold capitalize font-mono text-gray-500 border border-gray-200">
                {listing.category}
              </span>
              {listing.status !== "active" && (
                <span className="rounded-md px-2 py-0.5 text-[9px] font-bold uppercase font-mono" style={{ color: listing.status === "sold" ? "#059669" : "#DC2626", backgroundColor: listing.status === "sold" ? "#ECFDF5" : "#FEF2F2", border: `1px solid ${listing.status === "sold" ? "#A7F3D0" : "#FECACA"}` }}>
                  {listing.status}
                </span>
              )}
            </div>

            <h1 className="text-[1.5rem] font-bold leading-[1.3] text-brand-dark">{listing.title}</h1>

            <div className="flex items-baseline gap-2">
              <span className="text-[1.75rem] font-mono font-extrabold" style={{ color: cfg.colors.primary }}>
                {formatNaira(listing.price)}
              </span>
              <span className="text-[11px] text-gray-500">{listing.currency}</span>
            </div>

            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
              <p className="whitespace-pre-wrap text-[13px] leading-[1.7] text-brand-dark">{listing.description}</p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white" style={{ backgroundColor: cfg.colors.primary }}>
                {listing.seller.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
              </div>
              <div>
                <span className="block text-xs font-semibold text-brand-dark">{listing.seller.name}</span>
                <span className="text-[10px] text-gray-500">Listed {new Date(listing.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</span>
              </div>
            </div>

            {isSeller ? (
              <div className="flex gap-3 pt-2">
                <a href={`/marketplace/${id}/edit`} className="block flex-1 rounded-full px-5 py-2.5 text-center text-[13px] font-semibold text-white no-underline transition-all" style={{ backgroundColor: cfg.colors.primary }}>
                  Edit Listing
                </a>
                <button onClick={handleDelete} disabled={deleting} className="rounded-full border border-red-200 bg-white px-5 py-2.5 text-[13px] font-semibold text-red-600 transition-all cursor-pointer" style={{ opacity: deleting ? 0.5 : 1 }}>
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            ) : listing.status === "active" ? (
              <form onSubmit={handleOffer} className="flex flex-col gap-3 pt-2">
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] font-semibold text-gray-500">₦</span>
                    <input type="number" value={offerAmount} onChange={(e) => setOfferAmount(e.target.value)} placeholder="Your offer"
                      className="w-full rounded-xl border border-gray-200 py-2.5 pl-7 pr-3 font-mono text-[13px] outline-none box-border transition-colors"
                      onFocus={(e) => { e.currentTarget.style.borderColor = cfg.colors.primary; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = "#EAEAEA"; }} />
                  </div>
                  <Button type="submit" variant="primary" size="md" disabled={submittingOffer}>
                    {submittingOffer ? "Sending..." : "Make Offer"}
                  </Button>
                </div>
                <input type="text" value={offerMessage} onChange={(e) => setOfferMessage(e.target.value)} placeholder="Message to seller (optional)"
                  className="w-full rounded-xl border border-gray-200 py-2.5 px-3 text-[13px] outline-none box-border transition-colors"
                  onFocus={(e) => { e.currentTarget.style.borderColor = cfg.colors.primary; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "#EAEAEA"; }} />
                {offerError && <div className="text-xs text-red-600">{offerError}</div>}
                {offerSuccess && <div className="text-xs text-emerald-600">Offer submitted successfully!</div>}
              </form>
            ) : null}
          </div>
        </FadeIn>
      </div>

      {/* Offers Section */}
      {isSeller && listing.offers.length > 0 && (
        <FadeInUp delay={300}>
          <Card padding="1.5rem">
            <ColorfulBadge label="Offers" color={cfg.colors.primary} />
            <h2 className="mb-4 mt-2 text-[1.125rem] font-medium text-brand-dark">Received Offers ({listing.offers.length})</h2>
            <div className="flex flex-col gap-3">
              {listing.offers.map((offer) => (
                <div key={offer.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-500">
                      {offer.offerer.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                    </div>
                    <div>
                      <span className="block text-xs font-semibold text-brand-dark">{offer.offerer.name}</span>
                      {offer.message && <span className="mt-0.5 block text-[11px] text-gray-500">{offer.message}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-mono font-bold" style={{ color: cfg.colors.primary }}>{formatNaira(offer.amount)}</span>
                    <span className="rounded-md px-2 py-0.5 text-[9px] font-bold uppercase font-mono" style={{ color: STATUS_COLORS[offer.status], backgroundColor: `${STATUS_COLORS[offer.status]}12` }}>{offer.status}</span>
                    {offer.status === "pending" && listing.status === "active" && (
                      <div className="flex gap-1.5">
                        <button onClick={() => handleOfferAction(offer.id, "accepted")} className="cursor-pointer rounded-full bg-emerald-600 px-3 py-1.5 text-[11px] font-semibold text-white border-none">Accept</button>
                        <button onClick={() => handleOfferAction(offer.id, "rejected")} className="cursor-pointer rounded-full border border-red-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-red-600">Reject</button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </FadeInUp>
      )}
    </div>
  );
}
