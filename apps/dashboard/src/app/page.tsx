"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { config, BrandConfig } from "@thrift/config";
import { formatNaira } from "@thrift/utils";
import { StatCard } from "@thrift/ui";
import { useAuth } from "@/lib/auth-context";
import { Skeleton, SkeletonCard } from "@/components/Skeleton";
import { PaymentModal } from "@/components/PaymentModal";
import { fetchDeduped } from "@/lib/fetch-cache";
import confetti from "canvas-confetti";
import { SimpleTable, SimpleColumn } from "@/components/SimpleTable";
import {
  Wallet,
  Users,
  ShieldCheck,
  ArrowRight,
  CreditCard,
  Copy,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  PiggyBank,
  TrendingUp,
  Plus,
  X,
  ArrowLeft,
  ChevronRight,
  Wifi,
  UserCheck,
  Globe,
  Coins,
  Calendar,
  DollarSign,
  Award,
  BookOpen,
  AlertTriangle,
  Bell,
  ShoppingBag,
} from "lucide-react";

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
  circle: { id: string; name: string; amount: number; durationMonths: number };
}

interface VirtualAccount {
  id: string;
  accountNumber: string;
  accountName: string;
  bankName: string;
  provider: string;
  reference: string;
  status: string;
  createdAt: string;
}

export default function Dashboard() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [cfg, setCfg] = useState<BrandConfig>(fallback);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [circleAccounts, setCircleAccounts] = useState<CircleAccount[]>([]);
  const [virtualAccounts, setVirtualAccounts] = useState<VirtualAccount[]>([]);
  const [bankAccountName, setBankAccountName] = useState("");
  const [walletBalance, setWalletBalance] = useState(0);
  const [walletAmount, setWalletAmount] = useState("");
  const [walletCustom, setWalletCustom] = useState("");
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [referralCode, setReferralCode] = useState("");
  const [referralCopied, setReferralCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showVirtualAccountModal, setShowVirtualAccountModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState("");
  const [bvn, setBvn] = useState("");
  const [creatingVirtualAccount, setCreatingVirtualAccount] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState<string | null>(null);
  const [reconciling, setReconciling] = useState<string | null>(null);
  const [reconcileResult, setReconcileResult] = useState<{
    success: boolean;
    transfersFound: number;
    transfersCredited: number;
    message: string;
  } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const hasFetchedDataRef = useRef(false);
  const [defaultsSummary, setDefaultsSummary] = useState<{
    totalDefaults: number;
    totalAmount: number;
    totalClearanceAmount: number;
  } | null>(null);
  const [upcomingClearance, setUpcomingClearance] = useState<{
    circleName: string;
    amount: number;
    dueDate: string;
    weekNumber: number;
  } | null>(null);
  const [latestAnnouncement, setLatestAnnouncement] = useState<{
    title: string;
    body: string;
  } | null>(null);
  const [latestListing, setLatestListing] = useState<{
    title: string;
    price: number;
    category: string;
  } | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  const STAFF_ROLES = [
    "admin",
    "superadmin",
    "support",
    "finance",
    "moderator",
  ];

  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    if (user && STAFF_ROLES.includes(user.role || "")) router.replace("/admin");
  }, [user, router]);

  useEffect(() => {
    fetchDeduped(`${API_URL}/api/config`, undefined, 300_000)
      .then((data) => {
        if (data && data.name) setCfg((prev) => ({ ...prev, ...data }));
      })
      .catch(() => {});
  }, [API_URL]);

  const fetchData = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const [
        profileData,
        txData,
        circlesData,
        referralData,
        vaData,
        overviewData,
        announcementsData,
        marketplaceData,
      ] = await Promise.all([
        fetchDeduped(
          `${API_URL}/api/user/profile`,
          { headers: { Authorization: `Bearer ${token}` } },
          60_000,
        ),
        fetchDeduped(
          `${API_URL}/api/transactions?limit=5`,
          { headers: { Authorization: `Bearer ${token}` } },
          30_000,
        ),
        fetchDeduped(
          `${API_URL}/api/circles/accounts/my`,
          { headers: { Authorization: `Bearer ${token}` } },
          60_000,
        ),
        fetchDeduped(
          `${API_URL}/api/referrals/code`,
          { headers: { Authorization: `Bearer ${token}` } },
          120_000,
        ),
        fetchDeduped(
          `${API_URL}/api/virtual-accounts`,
          { headers: { Authorization: `Bearer ${token}` } },
          120_000,
        ),
        fetchDeduped(
          `${API_URL}/api/user/overview`,
          { headers: { Authorization: `Bearer ${token}` } },
          60_000,
        ),
        fetchDeduped(
          `${API_URL}/api/notifications?limit=1`,
          { headers: { Authorization: `Bearer ${token}` } },
          60_000,
        ),
        fetchDeduped(
          `${API_URL}/api/marketplace?limit=1`,
          { headers: { Authorization: `Bearer ${token}` } },
          60_000,
        ),
      ]);
      if (profileData.success) {
        setProfile(profileData.data);
        setWalletBalance(profileData.data.stats.walletBalance);
        setBankAccountName(profileData.data.bankAccountName || "");
      }
      if (txData.success) setTransactions(txData.data.items || []);
      if (circlesData.success) setCircleAccounts(circlesData.data?.items || []);
      if (referralData?.data?.code) setReferralCode(referralData.data.code);
      if (vaData?.virtualAccounts) {
        setVirtualAccounts(vaData.virtualAccounts);
        for (const va of vaData.virtualAccounts) {
          handleReconcilePayment(va.id);
        }
      }

      if (overviewData?.success) {
        setDefaultsSummary(overviewData.data.defaults);
        setUpcomingClearance(overviewData.data.upcomingClearance);
      }
      if (announcementsData?.success)
        setLatestAnnouncement(announcementsData.data.items?.[0] || null);
      if (marketplaceData?.success)
        setLatestListing(marketplaceData.data.items?.[0] || null);
    } catch {}
    setLoading(false);
  }, [token, API_URL]);

  useEffect(() => {
    if (!hasFetchedDataRef.current) {
      hasFetchedDataRef.current = true;
      fetchData();
    }
  }, [fetchData]);

  const handlePaymentSuccess = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/wallet/balance`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setWalletBalance(data.data.balance);
        confetti({ particleCount: 110, spread: 85, origin: { y: 0.6 } });
        triggerToast(
          `Wallet funded successfully! New balance: ${formatNaira(data.data.balance)}`,
        );
        setWalletAmount("");
        setWalletCustom("");
        setSelectedPreset(null);
      }
    } catch {}
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
        triggerToast("Virtual account created successfully!");
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

  const handleReconcilePayment = async (virtualAccountId: string) => {
    if (!token) return;
    setReconciling(virtualAccountId);
    setReconcileResult(null);
    try {
      const res = await fetch(`${API_URL}/api/virtual-accounts/reconcile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ virtualAccountId, sinceHours: 24 }),
      });
      const data = await res.json();
      if (data.success) {
        setReconcileResult({
          success: true,
          transfersFound: data.data.transfersFound,
          transfersCredited: data.data.transfersCredited,
          message:
            data.data.transfersCredited > 0
              ? `Successfully credited ${data.data.transfersCredited} transfer(s)!`
              : data.data.transfersFound > 0
                ? "Found transfer(s) but already processed."
                : "No recent transfers found.",
        });
        if (data.data.transfersCredited > 0) {
          const balanceRes = await fetch(`${API_URL}/api/wallet/balance`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const balanceData = await balanceRes.json();
          if (balanceData.success) {
            setWalletBalance(balanceData.data.balance);
            confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
          }
        }
      } else {
        setReconcileResult({
          success: false,
          transfersFound: 0,
          transfersCredited: 0,
          message: data.error || "Failed to reconcile",
        });
      }
    } catch {
      setReconcileResult({
        success: false,
        transfersFound: 0,
        transfersCredited: 0,
        message: "Network error",
      });
    }
    setTimeout(() => setReconcileResult(null), 5000);
    setReconciling(null);
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
  const displayInitials =
    user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "M";

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "contribution":
        return "Contribution";
      case "payout":
        return "Payout";
      case "donation":
        return "Donation";
      case "funding":
        return "Funding";
      case "referral_earning":
        return "Referral";
      case "wallet_funding":
        return "Wallet Funding";
      case "wallet_funding_reversal":
        return "Reversed";
      case "circle_reversal":
        return "Reversed";
      case "circle_deposit":
        return "Circle Deposit";
      case "circle_contribution":
        return "Contribution";
      case "circle_processing_fee":
        return "Fee";
      default:
        return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "contribution":
        return "#2563EB";
      case "payout":
        return "#059669";
      case "donation":
        return "#7C3AED";
      case "funding":
        return "#2563EB";
      case "referral_earning":
        return "#D97706";
      case "wallet_funding":
        return "#2563EB";
      case "wallet_funding_reversal":
        return "#DC2626";
      case "circle_reversal":
        return "#DC2626";
      case "circle_deposit":
        return "#7C3AED";
      case "circle_contribution":
        return "#7C3AED";
      case "circle_processing_fee":
        return "#D97706";
      default:
        return "#64748B";
    }
  };

  const historyColumns: SimpleColumn<Transaction>[] = [
    {
      key: "date",
      header: "Date",
      mono: true,
      render: (t) =>
        new Date(t.createdAt).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
    },
    {
      key: "type",
      header: "Type",
      render: (t) => {
        const c = getTypeColor(t.type);
        return (
          <span
            className="rounded-lg px-2 py-1 font-mono text-[9px] font-bold uppercase"
            style={{ backgroundColor: `${c}12`, color: c }}
          >
            {getTypeLabel(t.type)}
          </span>
        );
      },
    },
    {
      key: "description",
      header: "Description",
      render: (t) => (
        <span className="font-medium text-slate-900 dark:text-white">
          {t.description || getTypeLabel(t.type)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      align: "right",
      render: (t) => (
        <span
          className={`rounded-lg px-2 py-1 text-[9px] font-bold ${t.status === "completed" ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400" : t.status === "pending" ? "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}`}
        >
          {t.status}
        </span>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      mono: true,
      render: (t) => (
        <span
          className={`font-bold ${["payout", "funding", "wallet_funding", "referral_earning", "circle_interest"].includes(t.type) ? "text-emerald-600 dark:text-emerald-400" : ["wallet_funding_reversal", "circle_reversal"].includes(t.type) ? "text-red-600 dark:text-red-400" : "text-slate-900 dark:text-white"}`}
        >
          {formatNaira(t.amount)}
        </span>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl p-[clamp(1rem,3vw,2rem)]">
        <div className="mb-8">
          <Skeleton width="100px" height="12px" className="mb-3" />
          <Skeleton width="280px" height="28px" className="mb-2" />
          <Skeleton width="200px" height="12px" />
        </div>
        <div className="mb-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <Skeleton width="100%" height="200px" className="mb-8" />
        <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl p-[clamp(1rem,3vw,2rem)] space-y-8">
      {/* Banner Card - LearnerDashboardView style */}
      <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Sparkles className="w-64 h-64 text-blue-400" />
        </div>
        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-semibold flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>Verified Member</span>
            </span>
            {virtualAccounts.length > 0 && (
              <div className="text-xs text-slate-400 flex items-center gap-1.5">
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span>Account: {virtualAccounts[0].accountNumber}</span>
              </div>
            )}
          </div>
          <h1 className="font-display font-bold text-2xl sm:text-4xl text-white">
            Welcome back, {displayName}!
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Track your savings, manage circle contributions, apply for loans,
            and grow your financial future.
          </p>
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-800/80">
            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Active Circles
              </div>
              <div className="font-display font-bold text-xl text-white mt-1">
                {profile?.stats.activeCircles || 0}
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Total Saved
              </div>
              <div className="font-display font-bold text-xl text-emerald-400 mt-1">
                {formatNaira(profile?.stats.totalSaved || 0)}
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Wallet Balance
              </div>
              <div className="font-display font-bold text-xl text-blue-400 mt-1">
                {formatNaira(walletBalance)}
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Trust Score
              </div>
              <div className="font-display font-bold text-xl text-amber-400 mt-1">
                {profile?.stats.trustScore || 1}/5
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KYC Banner */}
      {user &&
        (!user.kycStatus ||
          user.kycStatus === "none" ||
          user.kycStatus === "rejected" ||
          user.kycStatus === "expired") && (
          <div className="rounded-3xl border border-amber-200 dark:border-amber-800/60 bg-amber-50/50 dark:bg-amber-950/20 p-5">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-950/60">
                <ShieldCheck className="w-5 h-5 text-amber-600" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[13px] font-bold text-slate-900 dark:text-white">
                  Complete Your KYC Verification
                </span>
                <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
                  {user.kycStatus === "rejected"
                    ? "Your previous submission was rejected. Please resubmit."
                    : "Verify your identity to unlock full features."}
                </span>
              </div>
              <a
                href="/kyc"
                className="btn-primary py-2.5 px-5 text-xs whitespace-nowrap"
              >
                {user.kycStatus === "rejected"
                  ? "Resubmit KYC"
                  : "Start Verification"}
              </a>
            </div>
          </div>
        )}

      {/* Defaults Alert Banner */}
      {defaultsSummary && defaultsSummary.totalDefaults > 0 && (
        <div className="rounded-3xl border border-red-200 dark:border-red-800/60 bg-red-50/50 dark:bg-red-950/20 p-5">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-red-100 dark:bg-red-950/60">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[13px] font-bold text-slate-900 dark:text-white">
                Outstanding Defaults ({defaultsSummary.totalDefaults})
              </span>
              <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
                You have {defaultsSummary.totalDefaults} pending default(s)
                totaling {formatNaira(defaultsSummary.totalAmount)}. Clear them
                to restore full access.
              </span>
            </div>
            <a
              href="/my-defaults"
              className="btn-primary py-2.5 px-5 text-xs whitespace-nowrap"
            >
              Clear Defaults
            </a>
          </div>
        </div>
      )}

      {/* Color-coded Stat Cards - LearnerDashboardView style */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Saved"
          value={formatNaira(profile?.stats.totalSaved || 0)}
          change={`Across ${profile?.stats.activeCircles || 0} circles`}
          icon={<Wallet className="w-4 h-4" />}
          color="blue"
        />
        <StatCard
          label="Total Donated"
          value={formatNaira(profile?.stats.totalDonated || 0)}
          change={`${profile?.stats.clearances || 0} clearances`}
          icon={<Sparkles className="w-4 h-4" />}
          color="emerald"
        />
        <StatCard
          label="Active Circles"
          value={String(profile?.stats.activeCircles || 0)}
          change="All circles on track"
          icon={<PiggyBank className="w-4 h-4" />}
          color="rose"
        />
        <StatCard
          label="Trust Score"
          value={`${profile?.stats.trustScore || 1}/5`}
          change={profile?.stats.trustLevel || "Member"}
          icon={<ShieldCheck className="w-4 h-4" />}
          color="amber"
        />
      </div>

      {/* Overview + Wallet Row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Quick Overview Card */}
        <div className="lg:col-span-2 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-5 space-y-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-emerald-500/10 to-blue-500/10 dark:from-emerald-500/20 dark:to-blue-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/80 text-[10px] font-mono font-bold uppercase tracking-wider">
            <Sparkles className="w-3 h-3" /> Quick Overview
          </span>

          {/* Upcoming Clearance */}
          <a
            href="/my-clearance"
            className="flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50/50 dark:from-emerald-950/40 dark:to-teal-950/20 border border-emerald-200/60 dark:border-emerald-800/40 hover:shadow-md transition-all group"
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                Next Clearance
              </span>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                {upcomingClearance
                  ? formatNaira(upcomingClearance.amount)
                  : "None scheduled"}
              </h3>
              {upcomingClearance && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {upcomingClearance.circleName} · Week{" "}
                  {upcomingClearance.weekNumber} · Due{" "}
                  {new Date(upcomingClearance.dueDate).toLocaleDateString()}
                </p>
              )}
            </div>
            <ArrowRight className="w-4 h-4 text-emerald-400 group-hover:text-emerald-600 transition-colors" />
          </a>

          {/* Latest Announcement */}
          <a
            href="/notifications"
            className="flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50/50 dark:from-blue-950/40 dark:to-indigo-950/20 border border-blue-200/60 dark:border-blue-800/40 hover:shadow-md transition-all group"
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                Latest Update
              </span>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                {latestAnnouncement
                  ? latestAnnouncement.title
                  : "No announcements"}
              </h3>
              {latestAnnouncement && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {latestAnnouncement.body}
                </p>
              )}
            </div>
            <ArrowRight className="w-4 h-4 text-blue-400 group-hover:text-blue-600 transition-colors" />
          </a>

          {/* Latest Marketplace Item */}
          <a
            href="/marketplace"
            className="flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-r from-purple-50 to-pink-50/50 dark:from-purple-950/40 dark:to-pink-950/20 border border-purple-200/60 dark:border-purple-800/40 hover:shadow-md transition-all group"
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                New on Marketplace
              </span>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                {latestListing ? latestListing.title : "No listings yet"}
              </h3>
              {latestListing && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {formatNaira(latestListing.price)} · {latestListing.category}
                </p>
              )}
            </div>
            <ArrowRight className="w-4 h-4 text-purple-400 group-hover:text-purple-600 transition-colors" />
          </a>
        </div>

        {/* Wallet Card */}
        <div className="lg:col-span-3 relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-600 text-white border border-indigo-500/30 shadow-xl shadow-purple-500/20">
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />

          <div className="relative z-10 p-6 sm:p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-white" />
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-[0.2em] text-white/70 font-bold block">
                    My Wallet
                  </span>
                  <span className="text-xs text-white/50">
                    Available Balance
                  </span>
                </div>
              </div>
              <a
                href="/wallet"
                className="text-[11px] font-bold text-white/70 hover:text-white transition-colors flex items-center gap-1"
              >
                View All <ArrowRight className="w-3 h-3" />
              </a>
            </div>

            {/* Balance Display */}
            <div className="mb-6 p-5 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20">
              <span className="font-display font-bold text-[clamp(2rem,5vw,3.5rem)] text-white block">
                {formatNaira(walletBalance)}
              </span>
              <span className="text-[11px] text-white/60 mt-1 block">
                Total wallet balance
              </span>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-4 gap-3 mb-5">
              <button
                onClick={() => {
                  setPaymentAmount(5000);
                  setPaymentModalOpen(true);
                }}
                className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500/80 flex items-center justify-center">
                  <Plus className="w-5 h-5 text-white" />
                </div>
                <span className="text-[10px] font-bold text-white/80">
                  Fund
                </span>
              </button>
              <button
                onClick={() => {
                  setWalletAmount("5000");
                  setWalletCustom("");
                  setSelectedPreset(5000);
                }}
                className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-500/80 flex items-center justify-center">
                  <ArrowRight className="w-5 h-5 text-white" />
                </div>
                <span className="text-[10px] font-bold text-white/80">
                  Send
                </span>
              </button>
              <button
                onClick={() => {
                  const selected = walletCustom || walletAmount;
                  setPaymentAmount(
                    selected && parseFloat(selected) > 0
                      ? parseFloat(selected)
                      : 0,
                  );
                  setPaymentModalOpen(true);
                }}
                className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-500/80 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-white" />
                </div>
                <span className="text-[10px] font-bold text-white/80">Pay</span>
              </button>
              <button
                onClick={() => setShowVirtualAccountModal(true)}
                className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-500/80 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-white" />
                </div>
                <span className="text-[10px] font-bold text-white/80">
                  Account
                </span>
              </button>
            </div>

            {/* Preset Amounts */}
            <div className="mb-5">
              <span className="text-[10px] font-bold text-white/60 uppercase tracking-wider block mb-2">
                Quick Fund
              </span>
              <div className="grid grid-cols-3 gap-2">
                {[1000, 5000, 10000].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => {
                      setPaymentAmount(preset);
                      setPaymentModalOpen(true);
                    }}
                    className="py-2.5 rounded-xl border border-white/20 bg-white/10 text-xs font-bold font-mono text-white hover:bg-white/20 transition-all"
                  >
                    {formatNaira(preset)}
                  </button>
                ))}
              </div>
            </div>

            {/* Virtual Accounts */}
            <div className="p-4 rounded-2xl bg-white/10 border border-white/15">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Wifi className="w-4 h-4 text-emerald-400" />
                  <span className="text-[11px] font-bold text-white/90 uppercase tracking-wider">
                    Virtual Accounts
                  </span>
                </div>
                <button
                  onClick={() => setShowVirtualAccountModal(true)}
                  className="text-[10px] font-bold text-white bg-white/15 border border-white/20 rounded-lg px-3 py-1.5 hover:bg-white/25 transition-colors"
                >
                  + Add
                </button>
              </div>
              {virtualAccounts.length === 0 ? (
                <p className="text-[11px] text-white/50">
                  No accounts yet. Add one to receive payments.
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {virtualAccounts.slice(0, 2).map((va) => (
                    <div
                      key={va.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-white/10 border border-white/10"
                    >
                      <div>
                        <div className="text-xs font-mono font-bold text-white">
                          {va.accountNumber}
                        </div>
                        <div className="text-[10px] text-white/60">
                          {va.bankName}
                        </div>
                        <div className="text-[10px] text-white/60 text-uppercase truncate max-w-[150px]">
                          {va.accountName || ""}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            handleCopyAccount(va.accountNumber, va.bankName)
                          }
                          className={`text-[9px] font-bold text-white rounded-md px-2 py-1 transition-colors ${copiedAccount === va.accountNumber ? "bg-emerald-500" : "bg-white/15 hover:bg-white/25"}`}
                        >
                          {copiedAccount === va.accountNumber
                            ? "Copied!"
                            : "Copy"}
                        </button>
                        <button
                          onClick={() => handleReconcilePayment(va.id)}
                          disabled={reconciling === va.id}
                          className={`text-[9px] font-bold text-white rounded-md px-2 py-1 transition-colors ${reconciling === va.id ? "bg-white/10" : "bg-emerald-500/30 hover:bg-emerald-500/40"}`}
                        >
                          {reconciling === va.id ? (
                            <RefreshCw className="w-3 h-3 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {reconcileResult && (
                <div
                  className={`mt-3 px-3 py-2 rounded-lg text-[11px] font-medium flex items-center gap-2 ${reconcileResult.success ? "bg-emerald-500/20 text-emerald-300" : "bg-red-500/20 text-red-300"}`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                  {reconcileResult.message}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Referral Card */}
      {referralCode && (
        <div className="rounded-3xl border border-blue-200/80 dark:border-blue-800/60 bg-gradient-to-br from-blue-50/80 to-indigo-50/40 dark:from-blue-950/30 dark:to-indigo-950/20 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-400 border border-blue-200/80 dark:border-blue-800/80 text-[10px] font-mono font-bold uppercase tracking-wider">
                Referral Code
              </span>
              <h2 className="mt-2 text-lg font-bold text-slate-900 dark:text-white">
                Your Referral Code
              </h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Share with friends to earn tiered rewards.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-[clamp(1.25rem,3vw,1.75rem)] font-extrabold tracking-wide text-blue-600 dark:text-blue-400">
                {referralCode}
              </span>
              <button
                onClick={handleReferralCopy}
                className={`btn-secondary py-2 px-4 text-xs ${referralCopied ? "!border-emerald-300 !text-emerald-600 !bg-emerald-50 dark:!bg-emerald-950/40" : ""}`}
              >
                {referralCopied ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> Copy
                  </>
                )}
              </button>
              <a href="/referrals" className="btn-primary py-2 px-4 text-xs">
                View Details <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}

      <PaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        amount={paymentAmount}
        onSuccess={handlePaymentSuccess}
      />

      {/* Virtual Account Creation Modal */}
      {showVirtualAccountModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/75 backdrop-blur-md p-4">
          <div className="w-full max-w-[400px] rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative space-y-5">
            <button
              onClick={() => {
                setShowVirtualAccountModal(false);
                setSelectedProvider("");
                setBvn("");
              }}
              className="absolute top-5 right-5 p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-500 text-white flex items-center justify-center shrink-0">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider font-mono">
                  CREATE ACCOUNT
                </span>
                <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white">
                  Virtual Account
                </h3>
              </div>
            </div>
            <div>
              <label className="mb-2 block text-xs font-bold text-slate-700 dark:text-slate-300">
                Select Provider
              </label>
              <div className="flex flex-col gap-2">
                {[
                  {
                    id: "flutterwave",
                    name: "Flutterwave",
                    desc: "Flutterwave MFB",
                  },
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedProvider(p.id)}
                    className={`cursor-pointer rounded-xl border-2 p-3 text-left transition-all ${selectedProvider === p.id ? "border-blue-500 bg-blue-50 dark:bg-blue-950/40" : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"}`}
                  >
                    <div className="text-[13px] font-bold text-slate-900 dark:text-white">
                      {p.name}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      {p.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-2 block text-xs font-bold text-slate-700 dark:text-slate-300">
                BVN
              </label>
              <input
                type="text"
                value={bvn}
                onChange={(e) => setBvn(e.target.value)}
                placeholder="Enter your 11-digit BVN"
                maxLength={11}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowVirtualAccountModal(false);
                  setSelectedProvider("");
                  setBvn("");
                }}
                className="flex-1 btn-secondary py-2.5 text-xs justify-center"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateVirtualAccount}
                disabled={
                  !selectedProvider ||
                  bvn.length !== 11 ||
                  creatingVirtualAccount
                }
                className="flex-1 btn-primary py-2.5 text-xs justify-center"
              >
                {creatingVirtualAccount ? "Creating..." : "Create Account"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Grid - Circles & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* My Circles */}
        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-6">
          <div className="mb-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200/80 dark:border-rose-800/80 text-[10px] font-mono font-bold uppercase tracking-wider">
              <PiggyBank className="w-3 h-3" /> Quick Actions
            </span>
            <h2 className="mt-2 text-lg font-bold text-slate-900 dark:text-white">
              My Circles
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Select a circle and make your contribution.
            </p>
          </div>
          <div className="mb-4 flex flex-col gap-1">
            {circleAccounts.length > 0 ? (
              circleAccounts.slice(0, 3).map((ca) => (
                <a
                  key={ca.id}
                  href="/circles"
                  className="flex items-center gap-3 rounded-xl p-3 transition-all hover:bg-slate-50 dark:hover:bg-slate-800/60 group"
                >
                  <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/60 flex items-center justify-center text-[10px] font-bold font-mono text-rose-600">
                    {formatNaira(ca.principalAmount).split(" ")[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="block text-xs font-bold text-slate-900 dark:text-white truncate">
                      {ca.circle.name}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {formatNaira(ca.principalAmount)} &middot; {ca.status}
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-rose-500 transition-colors" />
                </a>
              ))
            ) : (
              <div className="p-4 text-center text-xs text-slate-400">
                No circles yet.{" "}
                <a href="/circles" className="text-blue-600 font-semibold">
                  Join one
                </a>
              </div>
            )}
          </div>
          <a
            href="/circles"
            className="block rounded-xl border border-rose-200/80 dark:border-rose-800/80 bg-rose-50/50 dark:bg-rose-950/20 px-4 py-2.5 text-center text-[13px] font-bold text-rose-600 dark:text-rose-400 transition-all hover:bg-rose-50 dark:hover:bg-rose-950/40"
          >
            View All Circles &rarr;
          </a>
        </div>

        {/* Financial Summary */}
        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-6">
          <div className="mb-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-800/80 text-[10px] font-mono font-bold uppercase tracking-wider">
              <TrendingUp className="w-3 h-3" /> Financial Summary
            </span>
            <h2 className="mt-2 text-lg font-bold text-slate-900 dark:text-white">
              My Stats
            </h2>
          </div>
          <div className="flex flex-col gap-5">
            {(() => {
              const stats = [
                {
                  label: "Total Contributed",
                  value: profile?.stats.totalContributed || 0,
                  color: "#2563EB",
                  bgColor: "bg-blue-600",
                },
                {
                  label: "Total Received",
                  value: profile?.stats.totalReceived || 0,
                  color: "#059669",
                  bgColor: "bg-emerald-600",
                },
                {
                  label: "Total Donated",
                  value: profile?.stats.totalDonated || 0,
                  color: "#7C3AED",
                  bgColor: "bg-purple-600",
                },
              ];
              const maxValue = Math.max(...stats.map((s) => s.value), 1);
              return stats.map((m) => (
                <div key={m.label}>
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {m.label}
                    </span>
                    <span
                      className="font-mono text-xs font-bold"
                      style={{ color: m.color }}
                    >
                      {formatNaira(m.value)}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className={`h-full rounded-full transition-[width] duration-1000 ${m.bgColor}`}
                      style={{ width: `${(m.value / maxValue) * 100}%` }}
                    />
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-6">
        <div className="mb-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-slate-700/80 text-[10px] font-mono font-bold uppercase tracking-wider">
              Recent Activity
            </span>
            <h2 className="mt-2 text-lg font-bold text-slate-900 dark:text-white">
              Contribution History
            </h2>
          </div>
          <span className="font-mono text-[10px] text-slate-400">
            {transactions.length} entries
          </span>
        </div>
        <SimpleTable
          columns={historyColumns}
          data={transactions}
          onRowClick={(t) => router.push(`/transactions/${t.id}`)}
          minWidth="500px"
          emptyMessage="No transactions yet."
        />
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed top-24 right-6 z-50 bg-emerald-600 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-emerald-400 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-100" />
          <div className="text-xs font-semibold">
            <div>{toast}</div>
            <div className="text-[10px] text-emerald-200">
              Financial Ledger Updated
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
