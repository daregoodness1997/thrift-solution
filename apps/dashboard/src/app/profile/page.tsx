"use client";

import { useState, useEffect, useCallback } from "react";
import { config, BrandConfig } from "@thrift/config";
import {
  Card,
  FadeInUp,
  StaggerChildren,
} from "@thrift/ui";
import { formatNaira, NIGERIAN_BANKS, getBankByCode } from "@thrift/utils";
import { useAuth } from "@/lib/auth-context";
import { User, CreditCard, PiggyBank, Star, Copy, CheckCircle2 } from "lucide-react";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  accountNumber: string;
  accountTier: string;
  createdAt: string;
  bankName?: string | null;
  bankCode?: string | null;
  bankAccountNumber?: string | null;
  bankAccountName?: string | null;
  stats: {
    totalSaved: number;
    totalDonated: number;
    totalContributed: number;
    totalReceived: number;
    activeCircles: number;
    trustScore: number;
    trustLevel: string;
    defaults: number;
    clearances: number;
    referralCount: number;
  };
}

const tierConfig: Record<
  string,
  { label: string; bg: string; color: string; icon: string }
> = {
  basic: {
    label: "Basic",
    bg: "#F3F4F6",
    color: "#6B7280",
    icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
  },
  silver: {
    label: "Silver",
    bg: "#F3F4F6",
    color: "#9CA3AF",
    icon: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  },
  gold: {
    label: "Gold",
    bg: "#FFFBEB",
    color: "#D97706",
    icon: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  },
  platinum: {
    label: "Platinum",
    bg: "#F5F3FF",
    color: "#7C3AED",
    icon: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  },
  diamond: {
    label: "Diamond",
    bg: "#ECFDF5",
    color: "#059669",
    icon: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  },
};

const typeColors: Record<string, { bg: string; color: string }> = {
  wallet: { bg: "#EFF6FF", color: "#2563EB" },
  contribution: { bg: "#ECFDF5", color: "#059669" },
  payout: { bg: "#ECFDF5", color: "#059669" },
  donation: { bg: "#FDF2F8", color: "#DB2777" },
  referral_earning: { bg: "#F5F3FF", color: "#7C3AED" },
  funding: { bg: "#EFF6FF", color: "#2563EB" },
};

export default function ProfilePage() {
  const { token } = useAuth();
  const [cfg] = useState<BrandConfig>(config);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [saved, setSaved] = useState(false);
  const [accountCopied, setAccountCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [bankName, setBankName] = useState("");
  const [bankCode, setBankCode] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankAccountName, setBankAccountName] = useState("");
  const [savingBank, setSavingBank] = useState(false);
  const [bankSaved, setBankSaved] = useState(false);
  const [bankError, setBankError] = useState("");
  const [resolving, setResolving] = useState(false);
  const [resolvedName, setResolvedName] = useState("");
  const [resolvedBankName, setResolvedBankName] = useState("");
  const [resolveError, setResolveError] = useState("");
  const [matchedUser, setMatchedUser] = useState<{ name: string; accountNumber: string } | null>(null);
  const [virtualAccount, setVirtualAccount] = useState<{
    accountNumber: string;
    bankName: string;
    provider: string;
    accountName: string;
  } | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  const fetchProfile = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const [profileRes, vaRes] = await Promise.all([
        fetch(`${API_URL}/api/user/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/api/virtual-accounts`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      const [profileData, vaData] = await Promise.all([
        profileRes.json(),
        vaRes.json(),
      ]);
      if (profileData.success) {
        setProfile(profileData.data);
        setName(profileData.data.name);
        setBankName(profileData.data.bankName || "");
        setBankCode(profileData.data.bankCode || "");
        setBankAccountNumber(profileData.data.bankAccountNumber || "");
        setBankAccountName(profileData.data.bankAccountName || "");
      }
      if (vaData?.virtualAccounts && vaData.virtualAccounts.length > 0) {
        setVirtualAccount({
          accountNumber: vaData.virtualAccounts[0].accountNumber,
          bankName: vaData.virtualAccounts[0].bankName,
          provider: vaData.virtualAccounts[0].provider,
          accountName: profileData.data.virtualAccount?.accountName,
        });
      }
    } catch {}
    setLoading(false);
  }, [token, API_URL]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSave = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/user/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (data.success) {
        setProfile((prev) => (prev ? { ...prev, name } : null));
        setEditing(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch {}
  };

  const handleSaveBank = async () => {
    if (!token) return;
    if (!bankName.trim() || !bankAccountNumber.trim()) {
      setBankError("Bank name and account number are required");
      return;
    }
    setBankError("");
    setSavingBank(true);
    try {
      const res = await fetch(`${API_URL}/api/user/bank-details`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          bankName: bankName.trim(),
          bankCode: bankCode.trim() || undefined,
          bankAccountNumber: bankAccountNumber.trim(),
          bankAccountName: (bankAccountName.trim() || resolvedName || undefined),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setProfile((prev) => (prev ? { ...prev, bankName: data.data.bankName, bankCode: data.data.bankCode, bankAccountNumber: data.data.bankAccountNumber, bankAccountName: data.data.bankAccountName } : prev));
        setBankSaved(true);
        setTimeout(() => setBankSaved(false), 2000);
      } else {
        setBankError(data.error || "Failed to save bank details");
      }
    } catch {
      setBankError("Failed to save bank details");
    }
    setSavingBank(false);
  };

  const handleResolveAccount = async () => {
    if (!token || !bankCode || bankAccountNumber.trim().length < 6) return;
    setResolveError("");
    setResolvedName("");
    setMatchedUser(null);
    setResolving(true);
    try {
      const res = await fetch(`${API_URL}/api/user/resolve-account`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          accountNumber: bankAccountNumber.trim(),
          bankCode: bankCode.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setResolvedName(data.data.accountName);
        setResolvedBankName(data.data.bankName);
        setBankName(data.data.bankName || bankName);
        setBankAccountName(data.data.accountName);
        if (data.data.isThriftUser && data.data.thriftUser) {
          setMatchedUser({
            name: data.data.thriftUser.name,
            accountNumber: data.data.thriftUser.accountNumber,
          });
        }
      } else {
        setResolveError(data.error || "Could not verify account");
      }
    } catch {
      setResolveError("Failed to verify account. Please try again.");
    }
    setResolving(false);
  };

  const handleCopyAccount = async () => {
    const accountToCopy =
      virtualAccount?.accountNumber || profile?.accountNumber;
    if (!accountToCopy) return;
    try {
      await navigator.clipboard.writeText(accountToCopy);
      setAccountCopied(true);
      setTimeout(() => setAccountCopied(false), 2000);
    } catch {}
  };

  if (loading) {
    return (
      <div className="max-w-[900px] mx-auto p-[clamp(1rem,3vw,2rem)]">
        <div className="text-center p-16 text-slate-400 text-[13px]">
          Loading profile...
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-[900px] mx-auto p-[clamp(1rem,3vw,2rem)]">
        <div className="text-center p-16 text-slate-400 text-[13px]">
          Failed to load profile.
        </div>
      </div>
    );
  }

  const initials = profile.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const memberSince = new Date(profile.createdAt).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="max-w-[900px] mx-auto p-[clamp(1rem,3vw,2rem)]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-blue-500" />
              <span>Account</span>
            </span>
          </div>
          <h3 className="font-display font-bold text-xl sm:text-2xl text-slate-900 dark:text-white mt-1">My <span className="bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 bg-clip-text text-transparent">Profile</span></h3>
        </div>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-6 mb-8">
        <FadeInUp delay={200}>
          <Card padding="1.5rem" className="rounded-3xl">
            <div className="flex items-center gap-4 mb-6">
              <div
                className="w-16 h-16 rounded-full text-white flex items-center justify-center text-2xl font-bold flex-shrink-0 bg-gradient-to-br from-blue-600 to-blue-400"
              >
                {initials}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  {profile.name}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {profile.email}
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  <div
                    className="w-4 h-4 rounded-full flex items-center justify-center bg-gradient-to-br from-blue-600 to-blue-400"
                  >
                    <Star className="w-2.5 h-2.5 text-white" />
                  </div>
                  <span
                    className="text-[10px] font-bold text-blue-500 dark:text-blue-400"
                  >
                    {profile.stats.trustLevel}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Member Since", value: memberSince },
                {
                  label: "Active Circles",
                  value: String(profile.stats.activeCircles),
                },
                {
                  label: "Trust Score",
                  value: `${profile.stats.trustScore}/5`,
                },
                {
                  label: "Referrals",
                  value: String(profile.stats.referralCount),
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60"
                >
                  <span className="block text-[9px] uppercase tracking-[0.1em] text-slate-400 font-bold">
                    {item.label}
                  </span>
                  <span className="block text-[13px] font-semibold text-slate-900 dark:text-white mt-0.5">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </FadeInUp>

        <FadeInUp delay={250}>
          <Card padding="1.5rem" className="rounded-3xl">
            <div className="mb-5">
              <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 w-fit">
                <CreditCard className="w-3.5 h-3.5 text-blue-500" />
                <span>Account</span>
              </span>
              <h3 className="text-base font-medium text-slate-900 dark:text-white mt-2">
                Account Details
              </h3>
            </div>

            <div className="mb-5">
              <span className="block text-[9px] uppercase tracking-[0.1em] text-slate-400 font-bold mb-1.5">
                {virtualAccount ? "Bank Account Number" : "Account Number"}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[1.25rem] font-mono font-bold text-slate-900 dark:text-white tracking-[0.05em]">
                  {virtualAccount
                    ? virtualAccount.accountNumber
                    : profile.accountNumber}
                </span>
                <button
                  onClick={handleCopyAccount}
                  className={`px-2 py-1 rounded-md text-[10px] font-semibold cursor-pointer transition whitespace-nowrap border ${
                    accountCopied
                      ? "border-emerald-300 bg-emerald-50 text-emerald-600"
                      : "border-blue-600 bg-transparent text-blue-600 dark:text-blue-400 dark:border-blue-400"
                  }`}
                >
                  {accountCopied ? "Copied!" : "Copy"}
                </button>
              </div>
              {virtualAccount && (
                <span className="block text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  {virtualAccount.bankName}
                </span>
              )}
              {virtualAccount && (
                <span className="block text-[13px] text-slate-500 dark:text-slate-400 mt-1 uppercase font-bold">
                  {virtualAccount.accountName}
                </span>
              )}
            </div>

            <div className="mb-5">
              <span className="block text-[9px] uppercase tracking-[0.1em] text-slate-400 font-bold mb-1.5">
                Account Tier
              </span>
              {(() => {
                const tier =
                  tierConfig[profile.accountTier] || tierConfig.basic;
                return (
                  <div
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full"
                    style={{
                      backgroundColor: tier.bg,
                      border: `1px solid ${tier.color}20`,
                    }}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={tier.color}
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d={tier.icon} />
                    </svg>
                    <span
                      className="text-xs font-bold"
                      style={{ color: tier.color }}
                    >
                      {tier.label}
                    </span>
                  </div>
                );
              })()}
            </div>

            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60">
              <span className="block text-[9px] uppercase tracking-[0.1em] text-slate-400 font-bold mb-1">
                Role
              </span>
              <span className="text-[13px] font-semibold text-slate-900 dark:text-white capitalize">
                {profile.role}
              </span>
            </div>
          </Card>
        </FadeInUp>

        <FadeInUp delay={300}>
          <Card padding="1.5rem" className="rounded-3xl">
            <div className="mb-5">
              <div className="flex justify-between items-center">
                <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 w-fit">
                  <PiggyBank className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Financial</span>
                </span>
                {!editing && (
                  <button
                    onClick={() => setEditing(true)}
                    className="text-[11px] font-semibold bg-none border-none cursor-pointer text-blue-600 dark:text-blue-400"
                  >
                    Edit
                  </button>
                )}
              </div>
              <h3 className="text-base font-medium text-slate-900 dark:text-white mt-2">
                Financial Summary
              </h3>
            </div>
            <div className="flex flex-col gap-3">
              {[
                {
                  label: "Total Saved",
                  value: formatNaira(profile.stats.totalSaved),
                  color: "#059669",
                },
                {
                  label: "Total Donated",
                  value: formatNaira(profile.stats.totalDonated),
                  color: "#DB2777",
                },
                {
                  label: "Defaults",
                  value:
                    profile.stats.defaults === 0
                      ? "None"
                      : String(profile.stats.defaults),
                  color: profile.stats.defaults === 0 ? "#059669" : "#DC2626",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex justify-between items-center py-2.5 border-b border-slate-200/80 dark:border-slate-800/80"
                >
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {item.label}
                  </span>
                  <span
                    className="text-[14px] font-mono font-bold"
                    style={{ color: item.color }}
                  >
                    {item.value}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-5">
              <span className="block text-[9px] uppercase tracking-[0.1em] text-slate-400 font-bold mb-2">
                Trust Score
              </span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <div
                    key={star}
                    className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      star <= profile.stats.trustScore
                        ? "bg-blue-100 dark:bg-blue-900/40"
                        : "bg-slate-100 dark:bg-slate-800"
                    }`}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill={
                        star <= profile.stats.trustScore
                          ? "#3B82F6"
                          : "#D1D5DB"
                      }
                    >
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </FadeInUp>
      </div>

      <FadeInUp delay={400}>
        <Card padding="1.5rem" className="mb-6 rounded-3xl">
          <div className="flex justify-between items-center mb-4">
            <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 w-fit">
              <User className="w-3.5 h-3.5 text-blue-500" />
              <span>Contact</span>
            </span>
            {saved && (
              <span className="text-[11px] text-emerald-600 font-medium">
                Saved!
              </span>
            )}
          </div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase tracking-[0.1em] text-slate-400 font-bold">
                Full Name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!editing}
                className={`bg-slate-50 dark:bg-slate-800/60 border rounded-2xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none font-sans transition-colors ${
                  editing ? "border-blue-600 dark:border-blue-400 bg-white dark:bg-slate-800" : "border-slate-200 dark:border-slate-700"
                }`}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase tracking-[0.1em] text-slate-400 font-bold">
                Email
              </label>
              <input
                value={profile.email}
                disabled
                className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl px-3 py-2 text-xs text-slate-400 outline-none font-sans"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase tracking-[0.1em] text-slate-400 font-bold">
                Phone Number
              </label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={!editing}
                placeholder="Not set"
                className={`bg-slate-50 dark:bg-slate-800/60 border rounded-2xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none font-sans transition-colors ${
                  editing ? "border-blue-600 dark:border-blue-400 bg-white dark:bg-slate-800" : "border-slate-200 dark:border-slate-700"
                }`}
              />
            </div>
          </div>
          {editing && (
            <div className="flex justify-end gap-2 mt-4">
               <button
                onClick={() => {
                  setEditing(false);
                  setName(profile.name);
                }}
                className="btn-secondary py-2 px-4 text-xs"
              >
                Cancel
              </button>
              <button onClick={handleSave} className="btn-primary py-2 px-4 text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-md">
                Save Changes
              </button>
            </div>
          )}
        </Card>
      </FadeInUp>

      <FadeInUp delay={450}>
        <Card padding="1.5rem" className="mb-6 rounded-3xl">
          <div className="flex justify-between items-center mb-2">
            <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 w-fit">
              <CreditCard className="w-3.5 h-3.5 text-blue-500" />
              <span>Payout Bank Account</span>
            </span>
            {bankSaved && (
              <span className="text-[11px] text-emerald-600 font-medium">Saved!</span>
            )}
          </div>
           <p className="text-[12px] text-slate-500 dark:text-slate-400 mb-4">
            Used for circle payout disbursements via bank transfer. Keep this accurate to avoid failed transfers.
          </p>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase tracking-[0.1em] text-slate-400 font-bold">Bank</label>
              <select
                value={bankCode}
                onChange={(e) => {
                  const code = e.target.value;
                  setBankCode(code);
                  const bank = getBankByCode(code);
                  setBankName(bank ? bank.name : "");
                  setResolvedBankName("");
                  setResolvedName("");
                  setMatchedUser(null);
                  setResolveError("");
                }}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none font-sans"
              >
                <option value="">Select bank</option>
                {NIGERIAN_BANKS.map((b) => (
                  <option key={b.code} value={b.code}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase tracking-[0.1em] text-slate-400 font-bold">Account Number</label>
              <div className="flex gap-2">
                <input
                  value={bankAccountNumber}
                  onChange={(e) => {
                    setBankAccountNumber(e.target.value);
                    setResolvedName("");
                    setMatchedUser(null);
                    setResolveError("");
                  }}
                  placeholder="10-digit NUBAN"
                  maxLength={15}
                  className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none font-mono"
                />
                <button
                  className="btn-secondary py-2 px-4 text-xs"
                  onClick={handleResolveAccount}
                  disabled={resolving || !bankCode || bankAccountNumber.trim().length < 6}
                >
                  {resolving ? "Verifying..." : "Verify"}
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-[10px] uppercase tracking-[0.1em] text-slate-400 font-bold">Account Name</label>
              <input
                value={bankAccountName}
                onChange={(e) => setBankAccountName(e.target.value)}
                placeholder={resolvedName ? resolvedName : "Resolved automatically after verify"}
                className={`bg-white dark:bg-slate-800 border rounded-2xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none font-sans ${
                  resolvedName ? "border-emerald-300 dark:border-emerald-600" : "border-slate-200 dark:border-slate-700"
                }`}
              />
              {resolvedName && (
                <span className="text-[10px] text-emerald-600 font-medium">
                  ✓ Verified: {resolvedName} {resolvedBankName ? `· ${resolvedBankName}` : ""}
                </span>
              )}
            </div>
          </div>
          {matchedUser && (
            <div className="mt-3 rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 px-4 py-2.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
              This account belongs to a Thrift Solution member: <strong>{matchedUser.name}</strong> ({matchedUser.accountNumber}).
              Transfers to this account will be processed in-app.
            </div>
          )}
          {resolveError && (
            <div className="mt-3 rounded-2xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/40 px-4 py-2.5 text-xs font-medium text-red-600 dark:text-red-400">
              {resolveError}
            </div>
          )}
          {bankError && (
            <div className="mt-3 rounded-2xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/40 px-4 py-2.5 text-xs font-medium text-red-600 dark:text-red-400">
              {bankError}
            </div>
          )}
          <div className="flex justify-end mt-4">
            <button onClick={handleSaveBank} className="btn-primary py-3 px-5 text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-md" disabled={savingBank}>
              {savingBank ? "Saving..." : "Save Bank Details"}
            </button>
          </div>
        </Card>
      </FadeInUp>
    </div>
  );
}
