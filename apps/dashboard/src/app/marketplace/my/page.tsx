"use client";

import { useState, useEffect, useCallback } from "react";
import { config, BrandConfig } from "@thrift/config";
import { Card, Button, FadeInUp, StaggerChildren, StatCard } from "@thrift/ui";
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
    <div className="mx-auto max-w-[1280px] p-[clamp(1rem,3vw,2rem)]">
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
        <div className="mb-6 flex w-fit gap-1 rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5">
          {([["listings", "My Listings"], ["received", "Received Offers"], ["sent", "My Offers"]] as const).map(([key, label]) => (
            <button key={key} onClick={() => { setTab(key); setListingsPage(1); setReceivedOffersPage(1); setMyOffersPage(1); }}
              className={`cursor-pointer rounded-md px-4 py-2 text-xs font-semibold transition-all ${
                tab === key
                  ? "bg-white dark:bg-slate-700 text-blue-600 shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
              }`}>
              {label}
            </button>
          ))}
        </div>
      </FadeInUp>

      {loading ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-6">
          {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : tab === "listings" ? (
        listings.length === 0 ? (
          <Card padding="3rem">
            <div className="text-center">
              <h3 className="mb-2 text-base font-semibold text-slate-900 dark:text-white">No listings yet</h3>
              <p className="mb-6 text-[13px] text-slate-500 dark:text-slate-400">Create your first listing to start selling.</p>
              <a href="/marketplace/new"><Button variant="primary" size="sm">Create Listing</Button></a>
            </div>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-6">
              {listings.map((listing) => (
                <a key={listing.id} href={`/marketplace/${listing.id}`} className="no-underline">
                  <div
                    className="cursor-pointer rounded-3xl bg-white dark:bg-slate-900 p-5 transition-all shadow-[0_2px_8px_rgba(0,0,0,0.04),0_0_0_1px_rgba(0,0,0,0.02)] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] border border-slate-200/80 dark:border-slate-800/80"
                  >
                    <div className="mb-3 flex items-start justify-between">
                      <h3 className="flex-1 mr-2 text-sm font-semibold text-slate-900 dark:text-white">{listing.title}</h3>
                      <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-mono font-bold uppercase tracking-wider">{listing.status}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-mono font-bold text-blue-600">{formatNaira(listing.price)}</span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">{listing._count.offers} offer{listing._count.offers !== 1 ? "s" : ""}</span>
                    </div>
                    <span className="mt-2 block text-[10px] text-slate-500 dark:text-slate-400">
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
            <div className="text-center">
              <h3 className="mb-2 text-base font-semibold text-slate-900 dark:text-white">No offers received</h3>
              <p className="text-[13px] text-slate-500 dark:text-slate-400">Offers on your listings will appear here.</p>
            </div>
          </Card>
        ) : (
          <>
            <div className="flex flex-col gap-3">
               {receivedOffers.map((offer) => (
                <Card key={offer.id} padding="1.5rem" className="rounded-3xl">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-500 dark:text-slate-400">
                        {offer.offerer.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                      </div>
                      <div>
                        <span className="block text-xs font-semibold text-slate-900 dark:text-white">{offer.offerer.name}</span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">for {offer.listing.title}</span>
                        {offer.message && <span className="mt-0.5 block text-[11px] text-slate-500 dark:text-slate-400">{offer.message}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-mono font-bold text-blue-600">{formatNaira(offer.amount)}</span>
                      <span className="px-2.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-[10px] font-mono font-bold uppercase tracking-wider">{offer.status}</span>
                      {offer.status === "pending" && (
                        <div className="flex gap-1.5">
                          <button onClick={() => handleOfferAction(offer.listing.id, offer.id, "accepted")} className="btn-primary py-1.5 px-3 text-[11px]">Accept</button>
                          <button onClick={() => handleOfferAction(offer.listing.id, offer.id, "rejected")} className="btn-secondary py-1.5 px-3 text-[11px] text-red-600 border-red-200 dark:border-red-800">Reject</button>
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
          <div className="text-center">
            <h3 className="mb-2 text-base font-semibold text-slate-900 dark:text-white">No offers made</h3>
            <p className="text-[13px] text-slate-500 dark:text-slate-400">Offers you make on listings will appear here.</p>
          </div>
        </Card>
      ) : (
        <>
          <div className="flex flex-col gap-3">
             {sentOffers.map((offer) => (
              <Card key={offer.id} padding="1.5rem" className="rounded-3xl">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <a href={`/marketplace/${offer.listing.id}`} className="block text-xs font-semibold text-slate-900 dark:text-white no-underline">{offer.listing.title}</a>
                    <span className="block text-[11px] text-slate-500 dark:text-slate-400">by {offer.listing.seller.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-mono font-bold text-blue-600">{formatNaira(offer.amount)}</span>
                    <span className="px-2.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-[10px] font-mono font-bold uppercase tracking-wider">{offer.status}</span>
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
