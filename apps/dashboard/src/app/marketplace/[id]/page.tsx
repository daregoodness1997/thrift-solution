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
      <div style={{ maxWidth: "960px", margin: "0 auto", padding: "clamp(1rem, 3vw, 2rem)" }}>
        <Skeleton width="200px" height="12px" style={{ marginBottom: "1rem" }} />
        <Skeleton width="320px" height="28px" style={{ marginBottom: "2rem" }} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
          <Skeleton width="100%" height="320px" />
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
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
      <div style={{ maxWidth: "960px", margin: "0 auto", padding: "clamp(1rem, 3vw, 2rem)" }}>
        <Card padding="3rem">
          <div style={{ textAlign: "center" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "#2D2D2D", marginBottom: "0.5rem" }}>Listing not found</h3>
            <p style={{ fontSize: "13px", color: "#717171", marginBottom: "1.5rem" }}>This listing may have been removed.</p>
            <a href="/marketplace"><Button variant="primary" size="sm">Back to Marketplace</Button></a>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "960px", margin: "0 auto", padding: "clamp(1rem, 3vw, 2rem)" }}>
      <FadeIn>
        <div style={{ marginBottom: "1.5rem" }}>
          <a href="/marketplace" style={{ fontSize: "12px", color: cfg.colors.primary, textDecoration: "none", fontWeight: 600 }}>&larr; Back to Marketplace</a>
        </div>
      </FadeIn>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", marginBottom: "2rem" }}>
        <FadeIn delay={100}>
          <div style={{ borderRadius: "0.75rem", overflow: "hidden", backgroundColor: "#F5F7F5", aspectRatio: "1", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {listing.imageUrl ? (
              <img src={listing.imageUrl} alt={listing.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#CCC" strokeWidth={1.5}>
                <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            )}
          </div>
        </FadeIn>

        <FadeIn delay={200}>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <span style={{ padding: "0.125rem 0.5rem", borderRadius: "0.375rem", fontSize: "9px", fontWeight: 700, textTransform: "uppercase", fontFamily: "'JetBrains Mono', monospace", color: CONDITION_COLORS[listing.condition] || "#717171", backgroundColor: `${CONDITION_COLORS[listing.condition] || "#717171"}12`, border: `1px solid ${CONDITION_COLORS[listing.condition] || "#717171"}20` }}>
                {listing.condition.replace("_", " ")}
              </span>
              <span style={{ padding: "0.125rem 0.5rem", borderRadius: "0.375rem", fontSize: "9px", fontWeight: 700, textTransform: "capitalize", fontFamily: "'JetBrains Mono', monospace", color: "#717171", backgroundColor: "#F5F5F5", border: "1px solid #EAEAEA" }}>
                {listing.category}
              </span>
              {listing.status !== "active" && (
                <span style={{ padding: "0.125rem 0.5rem", borderRadius: "0.375rem", fontSize: "9px", fontWeight: 700, textTransform: "uppercase", fontFamily: "'JetBrains Mono', monospace", color: listing.status === "sold" ? "#059669" : "#DC2626", backgroundColor: listing.status === "sold" ? "#ECFDF5" : "#FEF2F2", border: `1px solid ${listing.status === "sold" ? "#A7F3D0" : "#FECACA"}` }}>
                  {listing.status}
                </span>
              )}
            </div>

            <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#1A1A1A", lineHeight: 1.3 }}>{listing.title}</h1>

            <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem" }}>
              <span style={{ fontSize: "1.75rem", fontFamily: "'JetBrains Mono', monospace", fontWeight: 800, color: cfg.colors.primary }}>
                {formatNaira(listing.price)}
              </span>
              <span style={{ fontSize: "11px", color: "#999" }}>{listing.currency}</span>
            </div>

            <div style={{ padding: "1rem", borderRadius: "0.75rem", backgroundColor: "#FAF9F5", border: "1px solid #F0F0F0" }}>
              <p style={{ fontSize: "13px", color: "#2D2D2D", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{listing.description}</p>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", paddingTop: "0.5rem" }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "50%", backgroundColor: cfg.colors.primary, color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700 }}>
                {listing.seller.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
              </div>
              <div>
                <span style={{ fontSize: "12px", fontWeight: 600, color: "#2D2D2D", display: "block" }}>{listing.seller.name}</span>
                <span style={{ fontSize: "10px", color: "#999" }}>Listed {new Date(listing.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</span>
              </div>
            </div>

            {isSeller ? (
              <div style={{ display: "flex", gap: "0.75rem", paddingTop: "0.5rem" }}>
                <button onClick={handleDelete} disabled={deleting} style={{ flex: 1, padding: "0.625rem", borderRadius: "9999px", fontSize: "13px", fontWeight: 600, cursor: "pointer", backgroundColor: "#ffffff", color: "#DC2626", border: "1px solid #FECACA", transition: "all 0.2s ease", opacity: deleting ? 0.5 : 1 }}>
                  {deleting ? "Deleting..." : "Delete Listing"}
                </button>
              </div>
            ) : listing.status === "active" ? (
              <form onSubmit={handleOffer} style={{ display: "flex", flexDirection: "column", gap: "0.75rem", paddingTop: "0.5rem" }}>
                <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                  <div style={{ position: "relative", flex: 1 }}>
                    <span style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", fontSize: "13px", fontWeight: 600, color: "#999" }}>₦</span>
                    <input type="number" value={offerAmount} onChange={(e) => setOfferAmount(e.target.value)} placeholder="Your offer"
                      style={{ width: "100%", padding: "0.625rem 0.75rem 0.625rem 1.75rem", borderRadius: "0.75rem", border: "1px solid #EAEAEA", fontSize: "13px", fontFamily: "'JetBrains Mono', monospace", outline: "none", boxSizing: "border-box", transition: "border-color 0.2s ease" }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = cfg.colors.primary; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = "#EAEAEA"; }} />
                  </div>
                  <Button type="submit" variant="primary" size="md" disabled={submittingOffer}>
                    {submittingOffer ? "Sending..." : "Make Offer"}
                  </Button>
                </div>
                <input type="text" value={offerMessage} onChange={(e) => setOfferMessage(e.target.value)} placeholder="Message to seller (optional)"
                  style={{ width: "100%", padding: "0.625rem 0.75rem", borderRadius: "0.75rem", border: "1px solid #EAEAEA", fontSize: "13px", outline: "none", boxSizing: "border-box", transition: "border-color 0.2s ease" }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = cfg.colors.primary; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "#EAEAEA"; }} />
                {offerError && <div style={{ fontSize: "12px", color: "#DC2626" }}>{offerError}</div>}
                {offerSuccess && <div style={{ fontSize: "12px", color: "#059669" }}>Offer submitted successfully!</div>}
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
            <h2 style={{ fontSize: "1.125rem", fontWeight: 500, color: "#1A1A1A", marginTop: "0.5rem", marginBottom: "1rem" }}>Received Offers ({listing.offers.length})</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {listing.offers.map((offer) => (
                <div key={offer.id} style={{ padding: "1rem", borderRadius: "0.75rem", border: "1px solid #F0F0F0", backgroundColor: "#FAFAFA", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <div style={{ width: "32px", height: "32px", borderRadius: "50%", backgroundColor: "#F0F0F0", color: "#717171", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700 }}>
                      {offer.offerer.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                    </div>
                    <div>
                      <span style={{ fontSize: "12px", fontWeight: 600, color: "#2D2D2D", display: "block" }}>{offer.offerer.name}</span>
                      {offer.message && <span style={{ fontSize: "11px", color: "#717171", display: "block", marginTop: "0.125rem" }}>{offer.message}</span>}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <span style={{ fontSize: "14px", fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: cfg.colors.primary }}>{formatNaira(offer.amount)}</span>
                    <span style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase", fontFamily: "'JetBrains Mono', monospace", color: STATUS_COLORS[offer.status], backgroundColor: `${STATUS_COLORS[offer.status]}12`, padding: "0.125rem 0.5rem", borderRadius: "0.375rem" }}>{offer.status}</span>
                    {offer.status === "pending" && listing.status === "active" && (
                      <div style={{ display: "flex", gap: "0.375rem" }}>
                        <button onClick={() => handleOfferAction(offer.id, "accepted")} style={{ padding: "0.375rem 0.75rem", borderRadius: "9999px", fontSize: "11px", fontWeight: 600, backgroundColor: "#059669", color: "#ffffff", border: "none", cursor: "pointer" }}>Accept</button>
                        <button onClick={() => handleOfferAction(offer.id, "rejected")} style={{ padding: "0.375rem 0.75rem", borderRadius: "9999px", fontSize: "11px", fontWeight: 600, backgroundColor: "#ffffff", color: "#DC2626", border: "1px solid #FECACA", cursor: "pointer" }}>Reject</button>
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
