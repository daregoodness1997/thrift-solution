"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { config, BrandConfig } from "@thrift/config";
import { StatCard, Card, Button, GradientStrip, SavingsGrowthChart, ColorfulBadge, ColorBar, FadeIn, FadeInUp, StaggerChildren } from "@thrift/ui";
import { KYC_STATUS_CONFIG } from "@thrift/types";
import { formatNaira } from "@thrift/utils";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/PageHeader";
import { Skeleton, SkeletonCard } from "@/components/Skeleton";
import { PaymentModal } from "@/components/PaymentModal";

const fallback = config;

interface UserProfile {
  name: string;
  email: string;
  stats: {
    totalSaved: number;
    totalDonated: number;
    activeCircles: number;
    trustScore: number;
    trustLevel: string;
    clearances: number;
    totalContributed: number;
    totalReceived: number;
    walletBalance: number;
  };
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description?: string;
  status: string;
  createdAt: string;
  groupId?: string;
}

interface CircleAccount {
  id: string;
  circleId: string;
  principalAmount: number;
  interestEarned: number;
  status: string;
  maturityDate: string;
  circle: {
    id: string;
    name: string;
    amount: number;
    durationMonths: number;
  };
}

interface VirtualAccount {
  id: string;
  accountNumber: string;
  bankName: string;
  bankCode?: string;
  provider: string;
  reference: string;
  status: string;
  createdAt: string;
  lastTransferAt?: string;
}

export default function Dashboard() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [cfg, setCfg] = useState<BrandConfig>(fallback);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [circleAccounts, setCircleAccounts] = useState<CircleAccount[]>([]);
  const [virtualAccounts, setVirtualAccounts] = useState<VirtualAccount[]>([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [walletAmount, setWalletAmount] = useState("");
  const [walletCustom, setWalletCustom] = useState("");
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletFunded, setWalletFunded] = useState(false);
  const [walletHovered, setWalletHovered] = useState(false);
  const [walletOpen, setWalletOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [balanceAnimating, setBalanceAnimating] = useState(false);
  const [confettiVisible, setConfettiVisible] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [referralCode, setReferralCode] = useState("");
  const [referralCopied, setReferralCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showVirtualAccountModal, setShowVirtualAccountModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string>("");
  const [bvn, setBvn] = useState("");
  const [creatingVirtualAccount, setCreatingVirtualAccount] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  const STAFF_ROLES = ["admin", "superadmin", "support", "finance", "moderator"];

  useEffect(() => {
    if (user && STAFF_ROLES.includes(user.role || "")) {
      router.replace("/admin");
    }
  }, [user, router]);

  useEffect(() => {
    fetch(`${API_URL}/api/config`)
      .then((r) => r.json())
      .then((data) => { if (data && data.name) setCfg((prev) => ({ ...prev, ...data })); })
      .catch(() => {});
  }, [API_URL]);

  const fetchData = useCallback(async () => {
    if (!token) { setLoading(false); return; }
    try {
      const [profileRes, txRes, circlesRes, referralRes, vaRes] = await Promise.all([
        fetch(`${API_URL}/api/user/profile`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/api/transactions?limit=5`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/api/circles/accounts/my`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/api/referrals/code`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/api/virtual-accounts`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const [profileData, txData, circlesData, referralData, vaData] = await Promise.all([
        profileRes.json(),
        txRes.json(),
        circlesRes.json(),
        referralRes.json(),
        vaRes.json(),
      ]);

      if (profileData.success) {
        setProfile(profileData.data);
        setWalletBalance(profileData.data.stats.walletBalance);
      }
      if (txData.success) setTransactions(txData.data.items || []);
      if (circlesData.success) setCircleAccounts(circlesData.data?.items || []);
      if (referralData?.data?.code) setReferralCode(referralData.data.code);
      if (vaData?.virtualAccounts) setVirtualAccounts(vaData.virtualAccounts);
    } catch {}
    setLoading(false);
  }, [token, API_URL]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleWalletFunding = async () => {
    const selected = walletCustom || walletAmount;
    if (!selected || parseFloat(selected) <= 0 || !token) return;
    
    // Open payment modal with selected amount
    setPaymentAmount(parseFloat(selected));
    setPaymentModalOpen(true);
  };

  const handlePaymentSuccess = async () => {
    // Refresh wallet balance after successful payment
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/wallet/balance`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setWalletBalance(data.data.balance);
        setBalanceAnimating(true);
        setConfettiVisible(true);
        setWalletFunded(true);
        setWalletAmount("");
        setWalletCustom("");
        setSelectedPreset(null);
        
        setTimeout(() => {
          setWalletFunded(false);
          setBalanceAnimating(false);
          setConfettiVisible(false);
        }, 3000);
      }
    } catch {
      // Balance will refresh on next page load
    }
  };

  const handleCreateVirtualAccount = async () => {
    if (!selectedProvider || !bvn || !token || !user) return;

    setCreatingVirtualAccount(true);
    try {
      const res = await fetch(`${API_URL}/api/virtual-accounts/create`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          provider: selectedProvider,
          bvn,
          firstName: user.name?.split(" ")[0] || "",
          lastName: user.name?.split(" ").slice(1).join(" ") || "",
          email: user.email,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setVirtualAccounts([data.virtualAccount, ...virtualAccounts]);
        setShowVirtualAccountModal(false);
        setSelectedProvider("");
        setBvn("");
      }
    } catch {}
    setCreatingVirtualAccount(false);
  };

  const handleCopyAccount = async (accountNumber: string, bankName: string) => {
    try {
      await navigator.clipboard.writeText(`${accountNumber}\n${bankName}`);
      setCopiedAccount(accountNumber);
      setTimeout(() => setCopiedAccount(null), 2000);
    } catch {}
  };

  const handleReferralCopy = async () => {
    if (!referralCode) return;
    try {
      await navigator.clipboard.writeText(referralCode);
      setReferralCopied(true);
      setTimeout(() => setReferralCopied(false), 2000);
    } catch {}
  };

  const displayName = user?.name?.split(" ")[0] || "Member";
  const displayInitials = user?.name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "M";

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "contribution": return "Contribution";
      case "payout": return "Payout";
      case "donation": return "Donation";
      case "funding": return "Funding";
      case "referral_earning": return "Referral";
      default: return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "contribution": return "#4A5D4E";
      case "payout": return "#059669";
      case "donation": return cfg.colors.primary;
      case "funding": return "#2563EB";
      case "referral_earning": return "#8A7D73";
      default: return "#717171";
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-[1280px] p-[clamp(1rem,3vw,2rem)]">
        <div className="mb-8">
          <Skeleton width="100px" height="12px" className="mb-3" />
          <Skeleton width="280px" height="28px" className="mb-2" />
          <Skeleton width="200px" height="12px" />
        </div>
        <div className="mb-8 grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <Skeleton width="100%" height="160px" className="mb-8" />
        <div className="mb-8 grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-6">
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <Skeleton width="100%" height="240px" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1280px] p-[clamp(1rem,3vw,2rem)]">
      <PageHeader
        badgeLabel="Member Portal"
        heading={`Welcome back, ${displayName}`}
        description="Your Arosco savings dashboard"
        right={
          <div className="flex flex-wrap gap-3">
            {(virtualAccounts.length > 0 || user?.accountNumber) && (
              <div className="flex items-center gap-2.5 rounded-2xl bg-brand-surface/40 px-4 py-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M7 8h10M7 12h6" /></svg>
                </div>
                <div>
                  <span className="block text-[9px] font-bold uppercase tracking-wider text-gray-400">Account</span>
                  <span className="font-mono text-[11px] font-bold tracking-wide text-brand-dark">
                    {virtualAccounts.length > 0 ? virtualAccounts[0].accountNumber : user?.accountNumber}
                  </span>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2.5 rounded-2xl bg-brand-surface/40 px-4 py-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-primary to-brand-accent text-xs font-bold text-white">{profile?.stats.trustScore || 1}</div>
              <div>
                <span className="block text-[9px] font-bold uppercase tracking-wider text-brand-accent">Trust Score</span>
                <span className="text-xs font-semibold text-brand-dark">{profile?.stats.trustLevel || "Member"}</span>
              </div>
            </div>
          </div>
        }
      />

      {user && (!user.kycStatus || user.kycStatus === "none" || user.kycStatus === "rejected" || user.kycStatus === "expired") && (
        <FadeInUp delay={200}>
          <Card padding="1.25rem" style={{ marginBottom: "2rem", border: `1px solid ${KYC_STATUS_CONFIG[user.kycStatus as keyof typeof KYC_STATUS_CONFIG]?.border || KYC_STATUS_CONFIG.none.border}` }}>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: KYC_STATUS_CONFIG[user.kycStatus as keyof typeof KYC_STATUS_CONFIG]?.bg || KYC_STATUS_CONFIG.none.bg }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={KYC_STATUS_CONFIG[user.kycStatus as keyof typeof KYC_STATUS_CONFIG]?.color || KYC_STATUS_CONFIG.none.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d={KYC_STATUS_CONFIG[user.kycStatus as keyof typeof KYC_STATUS_CONFIG]?.icon || KYC_STATUS_CONFIG.none.icon} />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[13px] font-semibold text-brand-dark">Complete Your KYC Verification</span>
                  {user.accountTier && (
                    <span className="rounded-full border border-gray-200 bg-gray-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gray-500">
                      {user.accountTier} tier
                    </span>
                  )}
                </div>
                <span className="mt-0.5 block text-xs text-gray-500">
                  {user.kycStatus === "rejected"
                    ? "Your previous submission was rejected. Please resubmit your documents."
                    : "Verify your identity to unlock full platform features and build trust."}
                </span>
              </div>
              <a href="/kyc" className="whitespace-nowrap rounded-full bg-brand-primary px-5 py-2 text-xs font-semibold text-white transition-all duration-200 hover:bg-brand-secondary">
                {user.kycStatus === "rejected" ? "Resubmit KYC" : "Start Verification"}
              </a>
            </div>
          </Card>
        </FadeInUp>
      )}

      <StaggerChildren staggerDelay={100} className="mb-8 grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-6">
        <StatCard label="Total Saved" value={formatNaira(profile?.stats.totalSaved || 0)} change={`Across ${profile?.stats.activeCircles || 0} circles`} positive variant="default" />
        <StatCard label="Total Donated" value={formatNaira(profile?.stats.totalDonated || 0)} change={`${profile?.stats.clearances || 0} clearances`} positive variant="warm" />
        <StatCard label="Active Circles" value={String(profile?.stats.activeCircles || 0)} change="All circles on track" positive variant="default" />
        <StatCard label="Trust Score" value={`${profile?.stats.trustScore || 1}/5`} change={profile?.stats.trustLevel || "Member"} positive variant="warm" />
      </StaggerChildren>

      {referralCode && (
        <FadeInUp delay={300}>
          <Card padding="1.5rem" style={{ marginBottom: "2rem" }} className="border border-brand-primary/20 bg-gradient-to-br from-brand-primary/[0.03] to-brand-primary/[0.06]">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <ColorfulBadge label="Referral Code" color={cfg.colors.primary} />
                <h2 className="mt-2 font-display text-lg font-semibold text-brand-dark">Your Referral Code</h2>
                <p className="mt-1 text-xs font-light text-gray-500">Share with friends to earn tiered rewards when they join.</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-[clamp(1.25rem,3vw,1.75rem)] font-extrabold tracking-wide text-brand-primary">
                  {referralCode}
                </span>
                <button onClick={handleReferralCopy}
                  className={`whitespace-nowrap rounded-full border border-brand-primary px-4 py-2 text-[11px] font-semibold transition-all duration-200 ${referralCopied ? "bg-emerald-50 text-emerald-600" : "bg-transparent text-brand-primary"}`}>
                  {referralCopied ? "Copied!" : "Copy"}
                </button>
                <a href="/referrals" className="whitespace-nowrap rounded-full bg-brand-primary px-4 py-2 text-[11px] font-semibold text-white transition-all duration-200 hover:bg-brand-secondary">
                  View Details
                </a>
              </div>
            </div>
          </Card>
        </FadeInUp>
      )}

      <FadeInUp delay={350}>
        <div 
          className={`wallet-container ${walletHovered ? 'hovered' : ''}`}
          style={{ 
            marginBottom: "2rem", 
            position: "relative",
            transformStyle: "preserve-3d"
          }}
          onMouseEnter={() => setWalletHovered(true)}
          onMouseLeave={() => setWalletHovered(false)}
        >
          {/* Confetti Animation */}
          {confettiVisible && (
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, pointerEvents: "none", zIndex: 20 }}>
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    width: "8px",
                    height: "8px",
                    borderRadius: i % 2 === 0 ? "50%" : "2px",
                    backgroundColor: i % 3 === 0 ? cfg.colors.accent : i % 3 === 1 ? cfg.colors.primary : "#059669",
                    left: `${15 + Math.random() * 70}%`,
                    top: `${20 + Math.random() * 30}%`,
                    animation: `confetti-fall 1.5s ease-out ${i * 0.08}s forwards`,
                    opacity: 0
                  }}
                />
              ))}
            </div>
          )}

          {/* Wallet Flap */}
          <div 
            className={`wallet-flap ${walletOpen ? 'wallet-flap-open' : ''}`}
            style={{
              background: `linear-gradient(135deg, ${cfg.colors.primary}F0, ${cfg.colors.secondary}E8, ${cfg.colors.primary}D0)`,
              height: "48px",
              borderRadius: "24px 24px 0 0",
              position: "relative",
              boxShadow: "inset 0 2px 6px rgba(255,255,255,0.25), inset 0 -2px 4px rgba(0,0,0,0.1), 0 -4px 12px rgba(0,0,0,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              perspective: "800px",
              transformStyle: "preserve-3d"
            }}
          >
            {/* Flap Texture - Leather Grain */}
            <div style={{
              position: "absolute",
              inset: 0,
              borderRadius: "24px 24px 0 0",
              opacity: 0.03,
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
              backgroundSize: "100px 100px"
            }} />

            {/* Flap Stitching */}
            <div style={{
              position: "absolute",
              bottom: "8px",
              left: "24px",
              right: "24px",
              height: "1px",
              background: "repeating-linear-gradient(90deg, rgba(255,255,255,0.2) 0px, rgba(255,255,255,0.2) 4px, transparent 4px, transparent 8px)"
            }} />

            {/* Flap Edge Highlight */}
            <div style={{
              position: "absolute",
              top: 0,
              left: "10%",
              right: "10%",
              height: "1px",
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)"
            }} />

            {/* Gold Clasp */}
            <div 
              className={`wallet-clasp ${walletHovered ? 'wallet-clasp-glow' : ''}`}
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                background: `linear-gradient(135deg, ${cfg.colors.accent}, ${cfg.colors.accent}EE, ${cfg.colors.accent}CC)`,
                boxShadow: `0 2px 8px ${cfg.colors.accent}60, inset 0 1px 3px rgba(255,255,255,0.4), inset 0 -1px 2px rgba(0,0,0,0.1)`,
                position: "absolute",
                bottom: "-14px",
                left: "50%",
                transform: "translateX(-50%)",
                zIndex: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.3s ease"
              }}
            >
              {/* Clasp Inner Ring */}
              <div style={{
                width: "18px",
                height: "18px",
                borderRadius: "50%",
                border: `2px solid ${cfg.colors.accent}40`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                {/* Clasp Center Dot */}
                <div style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: `linear-gradient(135deg, ${cfg.colors.accent}80, ${cfg.colors.accent}40)`,
                  boxShadow: `inset 0 1px 2px rgba(255,255,255,0.5)`
                }} />
              </div>
              
              {/* Clasp Shine */}
              <div style={{
                position: "absolute",
                top: "3px",
                left: "3px",
                width: "8px",
                height: "4px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, rgba(255,255,255,0.6), transparent)",
                transform: "rotate(-30deg)"
              }} />
            </div>
            
            {/* Flap Texture Lines */}
            <div style={{
              position: "absolute",
              top: "10px",
              left: "20%",
              right: "20%",
              height: "1px",
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)"
            }} />
            <div style={{
              position: "absolute",
              top: "18px",
              left: "15%",
              right: "15%",
              height: "1px",
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)"
            }} />
            <div style={{
              position: "absolute",
              top: "26px",
              left: "25%",
              right: "25%",
              height: "1px",
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)"
            }} />
          </div>

          {/* Wallet Body */}
          <div 
            className={`wallet-body-reveal`}
            style={{
              background: `linear-gradient(180deg, ${cfg.colors.primary}E8, ${cfg.colors.primary}F0, ${cfg.colors.primary}F8, ${cfg.colors.primary}FF)`,
              borderRadius: "0 0 24px 24px",
              padding: "2.25rem 1.5rem 1.5rem",
              position: "relative",
              boxShadow: walletHovered 
                ? "0 20px 60px rgba(45,90,61,0.4), 0 8px 20px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.15)"
                : "0 12px 40px rgba(45,90,61,0.3), 0 4px 12px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.1)",
              transition: "box-shadow 0.4s ease"
            }}
          >
            {/* Leather Texture Overlay */}
            <div style={{
              position: "absolute",
              inset: 0,
              borderRadius: "0 0 24px 24px",
              opacity: 0.04,
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
              backgroundSize: "120px 120px",
              pointerEvents: "none"
            }} />

            {/* Card Slots Decoration */}
            <div style={{ position: "absolute", top: "16px", left: "50%", transform: "translateX(-50%)", display: "flex", gap: "4px" }}>
              {[0, 1, 2].map((i) => (
                <div 
                  key={i}
                  className="wallet-card-slide"
                  style={{
                    width: `${50 - i * 8}px`,
                    height: "3px",
                    background: `linear-gradient(90deg, transparent, rgba(255,255,255,${0.25 - i * 0.06}), transparent)`,
                    borderRadius: "2px",
                    animationDelay: `${i * 0.1}s`
                  }}
                />
              ))}
            </div>

            {/* Brand Emboss */}
            <div style={{
              position: "absolute",
              top: "28px",
              right: "20px",
              fontSize: "7px",
              fontWeight: 800,
              letterSpacing: "0.2em",
              color: "rgba(255,255,255,0.08)",
              textTransform: "uppercase"
            }}>
              AROSCO
            </div>

            {/* Success Notification */}
            {walletFunded && (
              <div className="wallet-success-burst" style={{
                padding: "0.875rem 1rem",
                borderRadius: "12px",
                backgroundColor: "#ECFDF5",
                border: "1px solid #A7F3D0",
                color: "#059669",
                fontSize: "12px",
                fontWeight: 500,
                marginBottom: "1.25rem",
                display: "flex",
                alignItems: "center",
                gap: "0.625rem",
                boxShadow: "0 4px 12px rgba(5, 150, 105, 0.15)"
              }}>
                <div style={{
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  backgroundColor: "#059669",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5" style={{ strokeDasharray: 50, animation: "success-checkmark 0.5s ease forwards 0.2s" }} />
                  </svg>
                </div>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: "2px" }}>Wallet Funded Successfully!</div>
                  <div style={{ fontSize: "11px", color: "#047857" }}>New balance: {formatNaira(walletBalance)}</div>
                </div>
              </div>
            )}

            {/* Balance Display */}
            <div style={{
              textAlign: "center",
              marginBottom: "1.5rem",
              padding: "1.5rem 1.25rem",
              background: "linear-gradient(135deg, rgba(255,255,255,0.12), rgba(255,255,255,0.06))",
              borderRadius: "16px",
              border: "1px solid rgba(255,255,255,0.18)",
              backdropFilter: "blur(10px)",
              position: "relative",
              overflow: "hidden"
            }}>
              {/* Balance Shimmer Effect */}
              <div className="wallet-balance-shimmer" style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)",
                backgroundSize: "200% 100%",
                animation: "balance-shimmer 4s ease-in-out infinite",
                pointerEvents: "none"
              }} />

              {/* Decorative Coins */}
              <div className="wallet-subtle-float" style={{
                position: "absolute",
                top: "8px",
                left: "12px",
                width: "20px",
                height: "20px",
                borderRadius: "50%",
                background: `linear-gradient(135deg, ${cfg.colors.accent}30, ${cfg.colors.accent}15)`,
                border: `1px solid ${cfg.colors.accent}25`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "8px",
                color: cfg.colors.accent
              }}>
                ₦
              </div>
              <div className="wallet-subtle-float" style={{
                position: "absolute",
                top: "12px",
                right: "16px",
                width: "16px",
                height: "16px",
                borderRadius: "50%",
                background: `linear-gradient(135deg, ${cfg.colors.accent}25, ${cfg.colors.accent}10)`,
                border: `1px solid ${cfg.colors.accent}20`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "6px",
                color: cfg.colors.accent,
                animationDelay: "1s"
              }}>
                ₦
              </div>

              <span style={{
                fontSize: "9px",
                textTransform: "uppercase",
                letterSpacing: "0.2em",
                color: "rgba(255,255,255,0.6)",
                fontWeight: 700,
                display: "block",
                marginBottom: "0.625rem",
                position: "relative"
              }}>
                Available Balance
              </span>
              <span 
                className={balanceAnimating ? 'wallet-balance-count' : ''}
                style={{
                  fontSize: "clamp(2rem, 5vw, 2.75rem)",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: 700,
                  color: "#ffffff",
                  textShadow: "0 2px 8px rgba(0,0,0,0.25), 0 0 40px rgba(255,255,255,0.1)",
                  position: "relative",
                  display: "inline-block"
                }}
              >
                {formatNaira(walletBalance)}
              </span>
            </div>

            {/* Amount Input Section */}
            <div style={{ marginTop: "1rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.5rem", marginBottom: "0.75rem" }}>
                {[1000, 2500, 5000, 10000, 25000, 50000].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => {
                      setWalletAmount(String(preset));
                      setWalletCustom("");
                      setSelectedPreset(preset);
                    }}
                    style={{
                      padding: "0.625rem",
                      borderRadius: "0.5rem",
                      border: `1px solid ${selectedPreset === preset ? "#ffffff" : "rgba(255,255,255,0.15)"}`,
                      backgroundColor: selectedPreset === preset ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.06)",
                      color: selectedPreset === preset ? "#ffffff" : "rgba(255,255,255,0.6)",
                      fontSize: "12px",
                      fontWeight: 600,
                      fontFamily: "'JetBrains Mono', monospace",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                  >
                    ₦{preset.toLocaleString()}
                  </button>
                ))}
              </div>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", fontSize: "13px", fontWeight: 600, color: "rgba(255,255,255,0.4)" }}>₦</span>
                <input
                  type="number"
                  placeholder="Custom amount"
                  value={walletCustom}
                  onChange={(e) => {
                    setWalletCustom(e.target.value);
                    setWalletAmount("");
                    setSelectedPreset(null);
                  }}
                  style={{
                    width: "100%",
                    padding: "0.625rem 0.75rem 0.625rem 1.75rem",
                    borderRadius: "0.5rem",
                    border: "1px solid rgba(255,255,255,0.15)",
                    backgroundColor: "rgba(255,255,255,0.06)",
                    fontSize: "13px",
                    fontFamily: "'JetBrains Mono', monospace",
                    color: "#ffffff",
                    outline: "none",
                    transition: "border-color 0.2s ease",
                    boxSizing: "border-box",
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.4)"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; }}
                />
              </div>
            </div>

            {/* Fund Wallet Button */}
            <button
              onClick={() => {
                const selected = walletCustom || walletAmount;
                if (selected && parseFloat(selected) > 0) {
                  setPaymentAmount(parseFloat(selected));
                } else {
                  setPaymentAmount(0);
                }
                setPaymentModalOpen(true);
              }}
              className="wallet-button-glow"
              style={{
                width: "100%",
                padding: "1rem",
                borderRadius: "12px",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
                backgroundColor: "#ffffff",
                color: cfg.colors.primary,
                border: "none",
                transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                boxShadow: "0 4px 16px rgba(0,0,0,0.1)"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.02) translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.1)";
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <path d="M2 10h20" />
              </svg>
              Fund Wallet
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>

            {/* Virtual Accounts Section */}
            <div style={{ marginTop: "1.25rem", padding: "1rem", background: "linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04))", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.12)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                <span style={{ fontSize: "11px", fontWeight: 600, color: "rgba(255,255,255,0.8)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Virtual Accounts</span>
                <button
                  onClick={() => setShowVirtualAccountModal(true)}
                  style={{ fontSize: "10px", fontWeight: 600, color: "#ffffff", backgroundColor: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "6px", padding: "0.375rem 0.75rem", cursor: "pointer", transition: "all 0.2s ease" }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.25)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.15)"; }}
                >
                  + Add Account
                </button>
              </div>
              
              {virtualAccounts.length === 0 ? (
                <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", margin: 0 }}>No virtual accounts yet. Add one to receive bank transfers.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {virtualAccounts.slice(0, 2).map((va) => (
                    <div key={va.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.625rem", backgroundColor: "rgba(255,255,255,0.08)", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)" }}>
                      <div>
                        <div style={{ fontSize: "12px", fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: "#ffffff" }}>{va.accountNumber}</div>
                        <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.6)" }}>{va.bankName}</div>
                      </div>
                      <button
                        onClick={() => handleCopyAccount(va.accountNumber, va.bankName)}
                        style={{ fontSize: "9px", fontWeight: 600, color: "#ffffff", backgroundColor: copiedAccount === va.accountNumber ? "#059669" : "rgba(255,255,255,0.12)", border: "none", borderRadius: "4px", padding: "0.25rem 0.5rem", cursor: "pointer", transition: "all 0.2s ease" }}
                      >
                        {copiedAccount === va.accountNumber ? "Copied!" : "Copy"}
                      </button>
                    </div>
                  ))}
                  {virtualAccounts.length > 2 && (
                    <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.5)", textAlign: "center" }}>+{virtualAccounts.length - 2} more accounts</span>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Stitching Decoration */}
            <div style={{
              position: "absolute",
              bottom: "14px",
              left: "24px",
              right: "24px",
              height: "1px",
              background: "repeating-linear-gradient(90deg, rgba(255,255,255,0.18) 0px, rgba(255,255,255,0.18) 4px, transparent 4px, transparent 8px)"
            }} />

            {/* Side Stitching */}
            <div style={{
              position: "absolute",
              top: "60px",
              bottom: "20px",
              left: "12px",
              width: "1px",
              background: "repeating-linear-gradient(180deg, rgba(255,255,255,0.1) 0px, rgba(255,255,255,0.1) 4px, transparent 4px, transparent 8px)"
            }} />
            <div style={{
              position: "absolute",
              top: "60px",
              bottom: "20px",
              right: "12px",
              width: "1px",
              background: "repeating-linear-gradient(180deg, rgba(255,255,255,0.1) 0px, rgba(255,255,255,0.1) 4px, transparent 4px, transparent 8px)"
            }} />
          </div>
        </div>
      </FadeInUp>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        amount={paymentAmount}
        onSuccess={handlePaymentSuccess}
      />

      {/* Virtual Account Creation Modal */}
      {showVirtualAccountModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-[400px] rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="mb-2 font-display text-lg font-semibold text-brand-dark">Create Virtual Account</h3>
            <p className="mb-5 text-[13px] text-gray-500">Get a dedicated bank account to receive transfers directly to your wallet.</p>
            
            <div className="mb-4">
              <label className="mb-2 block text-xs font-semibold text-brand-dark">Select Provider</label>
              <div className="flex flex-col gap-2">
                {[
                  { id: "flutterwave", name: "Flutterwave", desc: "Flutterwave MFB" },
                  { id: "paystack", name: "Paystack", desc: "Wema Bank" },
                  { id: "nomba", name: "Nomba", desc: "Nomba MFB" },
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedProvider(p.id)}
                    className={`cursor-pointer rounded-lg border p-3 text-left transition-all duration-200 ${selectedProvider === p.id ? "border-brand-primary bg-brand-primary/5" : "border-gray-200 bg-white"}`}
                  >
                    <div className="text-[13px] font-semibold text-brand-dark">{p.name}</div>
                    <div className="text-[11px] text-gray-500">{p.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-5">
              <label className="mb-2 block text-xs font-semibold text-brand-dark">BVN (Bank Verification Number)</label>
              <input
                type="text"
                value={bvn}
                onChange={(e) => setBvn(e.target.value)}
                placeholder="Enter your 11-digit BVN"
                maxLength={11}
                className="w-full rounded-lg border border-gray-200 p-3 text-sm outline-none focus:border-brand-primary"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setShowVirtualAccountModal(false); setSelectedProvider(""); setBvn(""); }}
                className="flex-1 rounded-lg bg-gray-100 p-3 text-[13px] font-semibold text-gray-500 transition-all duration-200 hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateVirtualAccount}
                disabled={!selectedProvider || bvn.length !== 11 || creatingVirtualAccount}
                className="flex-1 rounded-lg bg-brand-primary p-3 text-[13px] font-semibold text-white transition-all duration-200 hover:bg-brand-secondary disabled:opacity-50"
              >
                {creatingVirtualAccount ? "Creating..." : "Create Account"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-8 grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-6">
        <FadeInUp delay={400}>
          <Card padding="1.5rem">
            <div className="mb-4">
              <ColorfulBadge label="Quick Actions" color={cfg.colors.primary} />
              <h2 className="mt-3 font-display text-lg font-semibold text-brand-dark">My Circles</h2>
              <p className="mt-1 text-xs font-light text-gray-500">Select a circle and make your contribution.</p>
            </div>
            <div className="mb-4 flex flex-col gap-2">
              {circleAccounts.length > 0 ? circleAccounts.slice(0, 3).map((ca) => (
                <a key={ca.id} href="/circles"
                  className="block rounded-xl p-3 transition-all duration-200 hover:translate-x-1 hover:bg-gray-50">
                  <span className="block text-xs font-semibold text-brand-dark">{ca.circle.name}</span>
                  <span className="text-[10px] font-light text-gray-500">{formatNaira(ca.principalAmount)} deposited &middot; {ca.status}</span>
                </a>
              )) : (
                <div className="p-4 text-center text-xs text-gray-400">
                  No circles yet. <a href="/circles" className="text-brand-primary">Join one</a>
                </div>
              )}
            </div>
            <a href="/circles" className="block rounded-full border border-brand-primary/30 bg-brand-primary/5 px-4 py-2.5 text-center text-[13px] font-semibold text-brand-primary transition-all duration-200 hover:bg-brand-primary/10">
              View All Circles &rarr;
            </a>
          </Card>
        </FadeInUp>

        <FadeInUp delay={500}>
          <Card padding="1.5rem">
            <div className="mb-4">
              <ColorfulBadge label="Financial Summary" color={cfg.colors.accent} />
              <h2 className="mt-3 font-display text-lg font-semibold text-brand-dark">My Stats</h2>
            </div>
            <div className="flex flex-col gap-5">
              {(() => {
                const stats = [
                  { label: "Total Contributed", value: profile?.stats.totalContributed || 0, color: "#4A5D4E" },
                  { label: "Total Received", value: profile?.stats.totalReceived || 0, color: "#059669" },
                  { label: "Total Donated", value: profile?.stats.totalDonated || 0, color: cfg.colors.accent },
                ];
                const maxValue = Math.max(...stats.map((s) => s.value), 1);
                return stats.map((m) => (
                  <div key={m.label}>
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="text-xs font-medium text-brand-dark">{m.label}</span>
                      <span className="font-mono text-xs font-semibold" style={{ color: m.color }}>{formatNaira(m.value)}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
                      <div className="h-full rounded-full transition-[width] duration-1000" style={{ backgroundColor: m.color, width: `${(m.value / maxValue) * 100}%` }} />
                    </div>
                  </div>
                ));
              })()}
            </div>
          </Card>
        </FadeInUp>
      </div>

      <FadeInUp delay={700}>
        <Card padding="1.5rem">
          <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <ColorfulBadge label="Recent Activity" color="#8A7D73" />
              <h2 className="mt-2 font-display text-lg font-semibold text-brand-dark">Contribution History</h2>
            </div>
            <span className="font-mono text-[10px] text-gray-500">{transactions.length} entries</span>
          </div>
          {transactions.length === 0 ? (
            <div className="p-8 text-center text-[13px] text-gray-400">
              No transactions yet. <a href="/circles" className="text-brand-primary">Join a circle</a> to get started.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[500px] border-collapse text-xs">
                <thead>
                  <tr className="border-b border-gray-100 font-mono text-[9px] uppercase tracking-wider text-gray-400">
                    <th className="pb-3 text-left font-semibold">Date</th>
                    <th className="pb-3 text-left font-semibold">Type</th>
                    <th className="pb-3 text-left font-semibold">Description</th>
                    <th className="pb-3 text-right font-semibold">Status</th>
                    <th className="pb-3 text-right font-semibold">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t) => {
                    const typeColor = getTypeColor(t.type);
                    return (
                      <tr key={t.id} className="cursor-pointer border-b border-gray-50 transition-colors hover:bg-gray-50"
                        onClick={() => router.push(`/transactions/${t.id}`)}>
                        <td className="py-3 font-mono text-gray-500">
                          {new Date(t.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                        </td>
                        <td className="py-3">
                          <span className="rounded-md border px-2 py-0.5 font-mono text-[9px] font-bold uppercase" style={{ backgroundColor: `${typeColor}12`, color: typeColor, borderColor: `${typeColor}20` }}>{getTypeLabel(t.type)}</span>
                        </td>
                        <td className="py-3 font-medium text-brand-dark">{t.description || getTypeLabel(t.type)}</td>
                        <td className="py-3 text-right">
                          <span className={`rounded-md px-2 py-0.5 text-[9px] font-bold ${t.status === "completed" ? "bg-emerald-50 text-emerald-600" : t.status === "pending" ? "bg-amber-50 text-amber-600" : "bg-gray-100 text-gray-500"}`}>{t.status}</span>
                        </td>
                        <td className={`py-3 text-right font-mono font-semibold ${t.type === "payout" || t.type === "funding" ? "text-emerald-600" : "text-brand-dark"}`}>{formatNaira(t.amount)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </FadeInUp>
    </div>
  );
}
