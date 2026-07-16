"use client";

import { useState, useEffect, useCallback } from "react";
import { config, BrandConfig } from "@thrift/config";
import {
  Card,
  Button,
  ColorfulBadge,
  FadeInUp,
  StaggerChildren,
} from "@thrift/ui";
import { formatNaira } from "@thrift/utils";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/PageHeader";

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
          bankAccountName: bankAccountName.trim() || undefined,
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
        <div className="text-center p-16 text-gray-400 text-[13px]">
          Loading profile...
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-[900px] mx-auto p-[clamp(1rem,3vw,2rem)]">
        <div className="text-center p-16 text-gray-400 text-[13px]">
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
      <PageHeader badgeLabel="Account" heading="My" accentText="Profile" />

      <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-6 mb-8">
        <FadeInUp delay={200}>
          <Card padding="1.5rem">
            <div className="flex items-center gap-4 mb-6">
              <div
                className="w-16 h-16 rounded-full text-white flex items-center justify-center text-2xl font-bold flex-shrink-0"
                style={{ background: `linear-gradient(135deg, ${cfg.colors.primary}, ${cfg.colors.accent})` }}
              >
                {initials}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-brand-dark">
                  {profile.name}
                </h2>
                <p className="text-xs text-gray-500">
                  {profile.email}
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  <div
                    className="w-4 h-4 rounded-full flex items-center justify-center"
                    style={{ background: `linear-gradient(135deg, ${cfg.colors.primary}, ${cfg.colors.accent})` }}
                  >
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="#ffffff"
                    >
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  </div>
                  <span
                    className="text-[10px] font-bold"
                    style={{ color: cfg.colors.accent }}
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
                  className="p-2.5 rounded-lg bg-gray-50"
                >
                  <span className="block text-[9px] uppercase tracking-[0.1em] text-gray-400 font-bold">
                    {item.label}
                  </span>
                  <span className="block text-[13px] font-semibold text-brand-dark mt-0.5">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </FadeInUp>

        <FadeInUp delay={250}>
          <Card padding="1.5rem">
            <div className="mb-5">
              <ColorfulBadge label="Account" color={cfg.colors.primary} />
              <h3 className="text-base font-medium text-brand-dark mt-2">
                Account Details
              </h3>
            </div>

            <div className="mb-5">
              <span className="block text-[9px] uppercase tracking-[0.1em] text-gray-400 font-bold mb-1.5">
                {virtualAccount ? "Bank Account Number" : "Account Number"}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[1.25rem] font-mono font-bold text-brand-dark tracking-[0.05em]">
                  {virtualAccount
                    ? virtualAccount.accountNumber
                    : profile.accountNumber}
                </span>
                <button
                  onClick={handleCopyAccount}
                  className="px-2 py-1 rounded-md text-[10px] font-semibold cursor-pointer transition whitespace-nowrap border"
                  style={{
                    borderColor: cfg.colors.primary,
                    backgroundColor: accountCopied ? "#ECFDF5" : "transparent",
                    color: accountCopied ? "#059669" : cfg.colors.primary,
                  }}
                >
                  {accountCopied ? "Copied!" : "Copy"}
                </button>
              </div>
              {virtualAccount && (
                <span className="block text-[11px] text-gray-500 mt-1">
                  {virtualAccount.bankName}
                </span>
              )}
              {virtualAccount && (
                <span className="block text-[13px] text-gray-500 mt-1 uppercase font-bold">
                  {virtualAccount.accountName}
                </span>
              )}
            </div>

            <div className="mb-5">
              <span className="block text-[9px] uppercase tracking-[0.1em] text-gray-400 font-bold mb-1.5">
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

            <div className="p-3 rounded-lg bg-gray-50">
              <span className="block text-[9px] uppercase tracking-[0.1em] text-gray-400 font-bold mb-1">
                Role
              </span>
              <span className="text-[13px] font-semibold text-brand-dark capitalize">
                {profile.role}
              </span>
            </div>
          </Card>
        </FadeInUp>

        <FadeInUp delay={300}>
          <Card padding="1.5rem">
            <div className="mb-5">
              <div className="flex justify-between items-center">
                <ColorfulBadge label="Financial" color={cfg.colors.primary} />
                {!editing && (
                  <button
                    onClick={() => setEditing(true)}
                    className="text-[11px] font-semibold bg-none border-none cursor-pointer"
                    style={{ color: cfg.colors.primary }}
                  >
                    Edit
                  </button>
                )}
              </div>
              <h3 className="text-base font-medium text-brand-dark mt-2">
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
                  className="flex justify-between items-center py-2.5 border-b border-gray-100"
                >
                  <span className="text-xs text-gray-500">
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
              <span className="block text-[9px] uppercase tracking-[0.1em] text-gray-400 font-bold mb-2">
                Trust Score
              </span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <div
                    key={star}
                    className="w-6 h-6 rounded-full flex items-center justify-center"
                    style={{
                      backgroundColor:
                        star <= profile.stats.trustScore
                          ? `${cfg.colors.primary}15`
                          : "#F0F0F0",
                    }}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill={
                        star <= profile.stats.trustScore
                          ? cfg.colors.accent
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
        <Card padding="1.5rem" className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <ColorfulBadge label="Contact" color={cfg.colors.primary} />
            {saved && (
              <span className="text-[11px] text-emerald-600 font-medium">
                Saved!
              </span>
            )}
          </div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase tracking-[0.1em] text-gray-400 font-bold">
                Full Name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!editing}
                className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-brand-dark outline-none font-sans transition-colors"
                style={{
                  backgroundColor: editing ? "#ffffff" : "#FAFAFA",
                  border: `1px solid ${editing ? cfg.colors.primary : "#EAEAEA"}`,
                }}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase tracking-[0.1em] text-gray-400 font-bold">
                Email
              </label>
              <input
                value={profile.email}
                disabled
                className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-400 outline-none font-sans"
                style={{
                  backgroundColor: "#FAFAFA",
                  border: "1px solid #EAEAEA",
                }}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase tracking-[0.1em] text-gray-400 font-bold">
                Phone Number
              </label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={!editing}
                placeholder="Not set"
                className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-brand-dark outline-none font-sans transition-colors"
                style={{
                  backgroundColor: editing ? "#ffffff" : "#FAFAFA",
                  border: `1px solid ${editing ? cfg.colors.primary : "#EAEAEA"}`,
                }}
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
                className="px-4 py-2 rounded-full text-xs font-semibold border border-gray-200 bg-white text-gray-500 cursor-pointer"
              >
                Cancel
              </button>
              <Button onClick={handleSave} size="sm">
                Save Changes
              </Button>
            </div>
          )}
        </Card>
      </FadeInUp>

      <FadeInUp delay={450}>
        <Card padding="1.5rem" className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <ColorfulBadge label="Payout Bank Account" color={cfg.colors.primary} />
            {bankSaved && (
              <span className="text-[11px] text-emerald-600 font-medium">Saved!</span>
            )}
          </div>
          <p className="text-[12px] text-gray-500 mb-4">
            Used for circle payout disbursements via bank transfer. Keep this accurate to avoid failed transfers.
          </p>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase tracking-[0.1em] text-gray-400 font-bold">Bank Name</label>
              <input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="e.g. GTBank"
                className="bg-white border rounded-xl px-3 py-2 text-xs text-brand-dark outline-none font-sans"
                style={{ border: `1px solid ${cfg.colors.primary}30` }} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase tracking-[0.1em] text-gray-400 font-bold">Bank Code</label>
              <input value={bankCode} onChange={(e) => setBankCode(e.target.value)} placeholder="e.g. 058"
                className="bg-white border rounded-xl px-3 py-2 text-xs text-brand-dark outline-none font-mono"
                style={{ border: `1px solid ${cfg.colors.primary}30` }} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase tracking-[0.1em] text-gray-400 font-bold">Account Number</label>
              <input value={bankAccountNumber} onChange={(e) => setBankAccountNumber(e.target.value)} placeholder="10-digit NUBAN"
                className="bg-white border rounded-xl px-3 py-2 text-xs text-brand-dark outline-none font-mono"
                style={{ border: `1px solid ${cfg.colors.primary}30` }} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase tracking-[0.1em] text-gray-400 font-bold">Account Name</label>
              <input value={bankAccountName} onChange={(e) => setBankAccountName(e.target.value)} placeholder="Account holder name"
                className="bg-white border rounded-xl px-3 py-2 text-xs text-brand-dark outline-none font-sans"
                style={{ border: `1px solid ${cfg.colors.primary}30` }} />
            </div>
          </div>
          {bankError && (
            <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-medium text-red-600">
              {bankError}
            </div>
          )}
          <div className="flex justify-end mt-4">
            <Button onClick={handleSaveBank} size="sm" disabled={savingBank}>
              {savingBank ? "Saving..." : "Save Bank Details"}
            </Button>
          </div>
        </Card>
      </FadeInUp>
    </div>
  );
}
