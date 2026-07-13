"use client";

import { useState, useEffect, useCallback } from "react";
import { config, BrandConfig } from "@thrift/config";
import { Card, Button, ColorfulBadge, FadeInUp, StaggerChildren, StatCard } from "@thrift/ui";
import { formatNaira } from "@thrift/utils";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/PageHeader";
import { Skeleton, SkeletonCard } from "@/components/Skeleton";
import Pagination from "@/components/Pagination";

const fallback = config;
const LIMIT = 20;

interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  condition: string;
  status: string;
  createdAt: string;
  _count: { offers: number };
}

interface ReceivedOffer {
  id: string;
  amount: number;
  message?: string;
  status: string;
  createdAt: string;
  offerer: { id: string; name: string; email: string };
  listing: { id: string; title: string; price: number; currency: string };
}

interface SentOffer {
  id: string;
  amount: number;
  message?: string;
  status: string;
  createdAt: string;
  listing: { id: string; title: string; price: number; currency: string; seller: { id: string; name: string } };
}

const STATUS_COLORS: Record<string, string> = {
  active: "#059669",
  sold: "#2563EB",
  cancelled: "#DC2626",
  pending: "#D97706",
  accepted: "#059669",
  rejected: "#DC2626",
  withdrawn: "#717171",
};

export default function MyMarketplacePage() {
  const { token, user } = useAuth();
  const [cfg, setCfg] = useState<BrandConfig>(fallback);
  const [listings, setListings] = useState<Listing[]>([]);
  const [receivedOffers, setReceivedOffers] = useState<ReceivedOffer[]>([]);
  const [sentOffers, setSentOffers] = useState<SentOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"listings" | "received" | "sent">("listings");
  const [listingsPage, setListingsPage] = useState(1);
  const [listingsTotalPages, setListingsTotalPages] = useState(1);
  const [listingsTotal, setListingsTotal] = useState(0);
  const [receivedOffersPage, setReceivedOffersPage] = useState(1);
  const [receivedOffersTotalPages, setReceivedOffersTotalPages] = useState(1);
  const [receivedOffersTotal, setReceivedOffersTotal] = useState(0);
  const [myOffersPage, setMyOffersPage] = useState(1);
  const [myOffersTotalPages, setMyOffersTotalPages] = useState(1);
  const [myOffersTotal, setMyOffersTotal] = useState(0);
  const [listingStats, setListingStats] = useState({ total: 0, activeCount: 0 });
  const [receivedStats, setReceivedStats] = useState({ total: 0, pendingCount: 0 });
  const [sentStats, setSentStats] = useState({ total: 0, acceptedCount: 0 });

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  useEffect(() => {
    fetch(`${API_URL}/api/config`)
      .then((r) => r.json())
      .then((data) => { if (data && data.name) setCfg((prev) => ({ ...prev, ...data })); })
      .catch(() => {});
  }, [API_URL]);

  const fetchData = useCallback(async () => {
    if (!token) { setLoading(false); return; }
    try {
      const [listingsRes, receivedRes, sentRes] = await Promise.all([
        fetch(`${API_URL}/api/marketplace/my?page=${listingsPage}&limit=${LIMIT}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/api/marketplace/received-offers?page=${receivedOffersPage}&limit=${LIMIT}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/api/marketplace/my-offers?page=${myOffersPage}&limit=${LIMIT}`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const [listingsData, receivedData, sentData] = await Promise.all([
        listingsRes.json(),
        receivedRes.json(),
        sentRes.json(),
      ]);
      if (listingsData.success) {
        setListings(listingsData.data.items);
        setListingsTotalPages(listingsData.data.totalPages);
        setListingsTotal(listingsData.data.total);
        if (listingsData.data.stats) setListingStats(listingsData.data.stats);
      }
      if (receivedData.success) {
        setReceivedOffers(receivedData.data.items);
        setReceivedOffersTotalPages(receivedData.data.totalPages);
        setReceivedOffersTotal(receivedData.data.total);
        if (receivedData.data.stats) setReceivedStats(receivedData.data.stats);
      }
      if (sentData.success) {
        setSentOffers(sentData.data.items);
        setMyOffersTotalPages(sentData.data.totalPages);
        setMyOffersTotal(sentData.data.total);
        if (sentData.data.stats) setSentStats(sentData.data.stats);
      }
    } catch {}
    setLoading(false);
  }, [token, API_URL, listingsPage, receivedOffersPage, myOffersPage]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleOfferAction = async (listingId: string, offerId: string, status: string) => {
    try {
      const res = await fetch(`${API_URL}/api/marketplace/${listingId}/offers/${offerId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) fetchData();
    } catch {}
  };


  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "clamp(1rem, 3vw, 2rem)" }}>
      <PageHeader
        badgeLabel="Marketplace"
        heading="My"
        accentText="Marketplace"
        description="Manage your listings and offers."
        right={
          <a href="/marketplace/new">
            <Button variant="primary" size="sm">+ List Item</Button>
          </a>
        }
      />

      <StaggerChildren staggerDelay={100} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.5rem", marginBottom: "2rem" }}>
        <StatCard label="Active Listings" value={String(listingStats.activeCount)} change={`${listingStats.total} total`} positive variant="default" />
        <StatCard label="Pending Offers" value={String(receivedStats.pendingCount)} change={`${receivedStats.total} received`} positive variant="warm" />
        <StatCard label="My Offers" value={String(sentStats.total)} change={`${sentStats.acceptedCount} accepted`} positive variant="default" />
      </StaggerChildren>

      {/* Tabs */}
      <FadeInUp delay={200}>
        <div style={{ display: "flex", gap: "0.25rem", backgroundColor: "#F5F7F5", borderRadius: "0.5rem", padding: "0.2rem", marginBottom: "1.5rem", width: "fit-content" }}>
          {([["listings", "My Listings"], ["received", "Received Offers"], ["sent", "My Offers"]] as const).map(([key, label]) => (
            <button key={key} onClick={() => { setTab(key); setListingsPage(1); setReceivedOffersPage(1); setMyOffersPage(1); }}
              style={{ padding: "0.5rem 1rem", borderRadius: "0.375rem", fontSize: "12px", fontWeight: 600, border: "none", cursor: "pointer", transition: "all 0.2s ease", backgroundColor: tab === key ? "#ffffff" : "transparent", color: tab === key ? cfg.colors.primary : "#717171" }}>
              {label}
            </button>
          ))}
        </div>
      </FadeInUp>

      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.5rem" }}>
          {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : tab === "listings" ? (
        listings.length === 0 ? (
          <Card padding="3rem">
            <div style={{ textAlign: "center" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "#2D2D2D", marginBottom: "0.5rem" }}>No listings yet</h3>
              <p style={{ fontSize: "13px", color: "#717171", marginBottom: "1.5rem" }}>Create your first listing to start selling.</p>
              <a href="/marketplace/new"><Button variant="primary" size="sm">Create Listing</Button></a>
            </div>
          </Card>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.5rem" }}>
              {listings.map((listing) => (
                <a key={listing.id} href={`/marketplace/${listing.id}`} style={{ textDecoration: "none" }}>
                  <div style={{ padding: "1.25rem", borderRadius: "1.5rem", cursor: "pointer", transition: "all 0.2s ease", backgroundColor: "#FFFFFFDF", boxShadow: "0 2px 8px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.02)", borderTop: `3px solid ${cfg.colors.primary}22` }}
                    onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.06)"; }}
                    onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.02)"; }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                      <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#2D2D2D", flex: 1, marginRight: "0.5rem" }}>{listing.title}</h3>
                      <span style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase", fontFamily: "'JetBrains Mono', monospace", color: STATUS_COLORS[listing.status], backgroundColor: `${STATUS_COLORS[listing.status]}12`, padding: "0.125rem 0.5rem", borderRadius: "0.375rem" }}>{listing.status}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "14px", fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: cfg.colors.primary }}>{formatNaira(listing.price)}</span>
                      <span style={{ fontSize: "11px", color: "#999" }}>{listing._count.offers} offer{listing._count.offers !== 1 ? "s" : ""}</span>
                    </div>
                    <span style={{ fontSize: "10px", color: "#999", display: "block", marginTop: "0.5rem" }}>
                      Listed {new Date(listing.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                    </span>
                  </div>
                </a>
              ))}
            </div>
            <Pagination page={listingsPage} totalPages={listingsTotalPages} total={listingsTotal} limit={LIMIT} onPageChange={setListingsPage} loading={loading} />
          </>
        )
      ) : tab === "received" ? (
        receivedOffers.length === 0 ? (
          <Card padding="3rem">
            <div style={{ textAlign: "center" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "#2D2D2D", marginBottom: "0.5rem" }}>No offers received</h3>
              <p style={{ fontSize: "13px", color: "#717171" }}>Offers on your listings will appear here.</p>
            </div>
          </Card>
        ) : (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {receivedOffers.map((offer) => (
                <Card key={offer.id} padding="1.25rem">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <div style={{ width: "32px", height: "32px", borderRadius: "50%", backgroundColor: "#F0F0F0", color: "#717171", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700 }}>
                        {offer.offerer.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                      </div>
                      <div>
                        <span style={{ fontSize: "12px", fontWeight: 600, color: "#2D2D2D", display: "block" }}>{offer.offerer.name}</span>
                        <span style={{ fontSize: "11px", color: "#999" }}>for {offer.listing.title}</span>
                        {offer.message && <span style={{ fontSize: "11px", color: "#717171", display: "block", marginTop: "0.125rem" }}>{offer.message}</span>}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <span style={{ fontSize: "14px", fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: cfg.colors.primary }}>{formatNaira(offer.amount)}</span>
                      <span style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase", fontFamily: "'JetBrains Mono', monospace", color: STATUS_COLORS[offer.status], backgroundColor: `${STATUS_COLORS[offer.status]}12`, padding: "0.125rem 0.5rem", borderRadius: "0.375rem" }}>{offer.status}</span>
                      {offer.status === "pending" && (
                        <div style={{ display: "flex", gap: "0.375rem" }}>
                          <button onClick={() => handleOfferAction(offer.listing.id, offer.id, "accepted")} style={{ padding: "0.375rem 0.75rem", borderRadius: "9999px", fontSize: "11px", fontWeight: 600, backgroundColor: "#059669", color: "#ffffff", border: "none", cursor: "pointer" }}>Accept</button>
                          <button onClick={() => handleOfferAction(offer.listing.id, offer.id, "rejected")} style={{ padding: "0.375rem 0.75rem", borderRadius: "9999px", fontSize: "11px", fontWeight: 600, backgroundColor: "#ffffff", color: "#DC2626", border: "1px solid #FECACA", cursor: "pointer" }}>Reject</button>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            <Pagination page={receivedOffersPage} totalPages={receivedOffersTotalPages} total={receivedOffersTotal} limit={LIMIT} onPageChange={setReceivedOffersPage} loading={loading} />
          </>
        )
      ) : sentOffers.length === 0 ? (
        <Card padding="3rem">
          <div style={{ textAlign: "center" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "#2D2D2D", marginBottom: "0.5rem" }}>No offers made</h3>
            <p style={{ fontSize: "13px", color: "#717171" }}>Offers you make on listings will appear here.</p>
          </div>
        </Card>
      ) : (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {sentOffers.map((offer) => (
              <Card key={offer.id} padding="1.25rem">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
                  <div>
                    <a href={`/marketplace/${offer.listing.id}`} style={{ fontSize: "12px", fontWeight: 600, color: "#2D2D2D", textDecoration: "none" }}>{offer.listing.title}</a>
                    <span style={{ fontSize: "11px", color: "#999", display: "block" }}>by {offer.listing.seller.name}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <span style={{ fontSize: "14px", fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: cfg.colors.primary }}>{formatNaira(offer.amount)}</span>
                    <span style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase", fontFamily: "'JetBrains Mono', monospace", color: STATUS_COLORS[offer.status], backgroundColor: `${STATUS_COLORS[offer.status]}12`, padding: "0.125rem 0.5rem", borderRadius: "0.375rem" }}>{offer.status}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          <Pagination page={myOffersPage} totalPages={myOffersTotalPages} total={myOffersTotal} limit={LIMIT} onPageChange={setMyOffersPage} loading={loading} />
        </>
      )}
    </div>
  );
}
