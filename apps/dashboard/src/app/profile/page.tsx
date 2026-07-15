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
      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          padding: "clamp(1rem, 3vw, 2rem)",
        }}
      >
        <div
          style={{
            textAlign: "center",
            padding: "4rem",
            color: "#999",
            fontSize: "13px",
          }}
        >
          Loading profile...
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          padding: "clamp(1rem, 3vw, 2rem)",
        }}
      >
        <div
          style={{
            textAlign: "center",
            padding: "4rem",
            color: "#999",
            fontSize: "13px",
          }}
        >
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
    <div
      style={{
        maxWidth: "900px",
        margin: "0 auto",
        padding: "clamp(1rem, 3vw, 2rem)",
      }}
    >
      <PageHeader badgeLabel="Account" heading="My" accentText="Profile" />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "1.5rem",
          marginBottom: "2rem",
        }}
      >
        <FadeInUp delay={200}>
          <Card padding="1.5rem">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                marginBottom: "1.5rem",
              }}
            >
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "50%",
                  background: `linear-gradient(135deg, ${cfg.colors.primary}, ${cfg.colors.accent})`,
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "24px",
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {initials}
              </div>
              <div>
                <h2
                  style={{
                    fontSize: "1.125rem",
                    fontWeight: 600,
                    color: "#1A1A1A",
                  }}
                >
                  {profile.name}
                </h2>
                <p style={{ fontSize: "12px", color: "#717171" }}>
                  {profile.email}
                </p>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.375rem",
                    marginTop: "0.25rem",
                  }}
                >
                  <div
                    style={{
                      width: "16px",
                      height: "16px",
                      borderRadius: "50%",
                      background: `linear-gradient(135deg, ${cfg.colors.primary}, ${cfg.colors.accent})`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
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
                    style={{
                      fontSize: "10px",
                      fontWeight: 700,
                      color: cfg.colors.accent,
                    }}
                  >
                    {profile.stats.trustLevel}
                  </span>
                </div>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "0.75rem",
              }}
            >
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
                  style={{
                    padding: "0.625rem",
                    borderRadius: "0.5rem",
                    backgroundColor: "#FAFAFA",
                  }}
                >
                  <span
                    style={{
                      fontSize: "9px",
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      color: "#999",
                      fontWeight: 700,
                      display: "block",
                    }}
                  >
                    {item.label}
                  </span>
                  <span
                    style={{
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#2D2D2D",
                      display: "block",
                      marginTop: "0.125rem",
                    }}
                  >
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </FadeInUp>

        <FadeInUp delay={250}>
          <Card padding="1.5rem">
            <div style={{ marginBottom: "1.25rem" }}>
              <ColorfulBadge label="Account" color={cfg.colors.primary} />
              <h3
                style={{
                  fontSize: "1rem",
                  fontWeight: 500,
                  color: "#1A1A1A",
                  marginTop: "0.5rem",
                }}
              >
                Account Details
              </h3>
            </div>

            <div style={{ marginBottom: "1.25rem" }}>
              <span
                style={{
                  fontSize: "9px",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "#999",
                  fontWeight: 700,
                  display: "block",
                  marginBottom: "0.375rem",
                }}
              >
                {virtualAccount ? "Bank Account Number" : "Account Number"}
              </span>
              <div
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                <span
                  style={{
                    fontSize: "1.25rem",
                    fontFamily: "'JetBrains Mono', monospace",
                    fontWeight: 700,
                    color: "#1A1A1A",
                    letterSpacing: "0.05em",
                  }}
                >
                  {virtualAccount
                    ? virtualAccount.accountNumber
                    : profile.accountNumber}
                </span>
                <button
                  onClick={handleCopyAccount}
                  style={{
                    padding: "0.25rem 0.5rem",
                    borderRadius: "0.375rem",
                    fontSize: "10px",
                    fontWeight: 600,
                    cursor: "pointer",
                    border: `1px solid ${cfg.colors.primary}`,
                    backgroundColor: accountCopied ? "#ECFDF5" : "transparent",
                    color: accountCopied ? "#059669" : cfg.colors.primary,
                    transition: "all 0.2s ease",
                    whiteSpace: "nowrap",
                  }}
                >
                  {accountCopied ? "Copied!" : "Copy"}
                </button>
              </div>
              {virtualAccount && (
                <span
                  style={{
                    fontSize: "11px",
                    color: "#717171",
                    display: "block",
                    marginTop: "0.25rem",
                  }}
                >
                  {virtualAccount.bankName}
                </span>
              )}
              {virtualAccount && (
                <span
                  style={{
                    fontSize: "13px",
                    color: "#717171",
                    display: "block",
                    marginTop: "0.25rem",
                    textTransform: "uppercase",
                    fontWeight: 700,
                  }}
                >
                  {virtualAccount.accountName}
                </span>
              )}
            </div>

            <div style={{ marginBottom: "1.25rem" }}>
              <span
                style={{
                  fontSize: "9px",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "#999",
                  fontWeight: 700,
                  display: "block",
                  marginBottom: "0.375rem",
                }}
              >
                Account Tier
              </span>
              {(() => {
                const tier =
                  tierConfig[profile.accountTier] || tierConfig.basic;
                return (
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      padding: "0.375rem 0.75rem",
                      borderRadius: "9999px",
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
                      style={{
                        fontSize: "12px",
                        fontWeight: 700,
                        color: tier.color,
                      }}
                    >
                      {tier.label}
                    </span>
                  </div>
                );
              })()}
            </div>

            <div
              style={{
                padding: "0.75rem",
                borderRadius: "0.5rem",
                backgroundColor: "#FAFAFA",
              }}
            >
              <span
                style={{
                  fontSize: "9px",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "#999",
                  fontWeight: 700,
                  display: "block",
                  marginBottom: "0.25rem",
                }}
              >
                Role
              </span>
              <span
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#2D2D2D",
                  textTransform: "capitalize",
                }}
              >
                {profile.role}
              </span>
            </div>
          </Card>
        </FadeInUp>

        <FadeInUp delay={300}>
          <Card padding="1.5rem">
            <div style={{ marginBottom: "1.25rem" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <ColorfulBadge label="Financial" color={cfg.colors.primary} />
                {!editing && (
                  <button
                    onClick={() => setEditing(true)}
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      color: cfg.colors.primary,
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    Edit
                  </button>
                )}
              </div>
              <h3
                style={{
                  fontSize: "1rem",
                  fontWeight: 500,
                  color: "#1A1A1A",
                  marginTop: "0.5rem",
                }}
              >
                Financial Summary
              </h3>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
              }}
            >
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
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "0.625rem 0",
                    borderBottom: "1px solid #F0F0F0",
                  }}
                >
                  <span style={{ fontSize: "12px", color: "#717171" }}>
                    {item.label}
                  </span>
                  <span
                    style={{
                      fontSize: "14px",
                      fontFamily: "'JetBrains Mono', monospace",
                      fontWeight: 700,
                      color: item.color,
                    }}
                  >
                    {item.value}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ marginTop: "1.25rem" }}>
              <span
                style={{
                  fontSize: "9px",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "#999",
                  fontWeight: 700,
                  display: "block",
                  marginBottom: "0.5rem",
                }}
              >
                Trust Score
              </span>
              <div style={{ display: "flex", gap: "0.25rem" }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <div
                    key={star}
                    style={{
                      width: "24px",
                      height: "24px",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
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
        <Card padding="1.5rem" style={{ marginBottom: "1.5rem" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1rem",
            }}
          >
            <ColorfulBadge label="Contact" color={cfg.colors.primary} />
            {saved && (
              <span
                style={{ fontSize: "11px", color: "#059669", fontWeight: 500 }}
              >
                Saved!
              </span>
            )}
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "1rem",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.375rem",
              }}
            >
              <label
                style={{
                  fontSize: "10px",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "#999",
                  fontWeight: 700,
                }}
              >
                Full Name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!editing}
                style={{
                  backgroundColor: editing ? "#ffffff" : "#FAFAFA",
                  border: `1px solid ${editing ? cfg.colors.primary : "#EAEAEA"}`,
                  borderRadius: "0.75rem",
                  padding: "0.5rem 0.75rem",
                  fontSize: "12px",
                  color: "#2D2D2D",
                  outline: "none",
                  fontFamily: "inherit",
                  transition: "border-color 0.2s",
                }}
              />
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.375rem",
              }}
            >
              <label
                style={{
                  fontSize: "10px",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "#999",
                  fontWeight: 700,
                }}
              >
                Email
              </label>
              <input
                value={profile.email}
                disabled
                style={{
                  backgroundColor: "#FAFAFA",
                  border: "1px solid #EAEAEA",
                  borderRadius: "0.75rem",
                  padding: "0.5rem 0.75rem",
                  fontSize: "12px",
                  color: "#999",
                  outline: "none",
                  fontFamily: "inherit",
                }}
              />
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.375rem",
              }}
            >
              <label
                style={{
                  fontSize: "10px",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "#999",
                  fontWeight: 700,
                }}
              >
                Phone Number
              </label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={!editing}
                placeholder="Not set"
                style={{
                  backgroundColor: editing ? "#ffffff" : "#FAFAFA",
                  border: `1px solid ${editing ? cfg.colors.primary : "#EAEAEA"}`,
                  borderRadius: "0.75rem",
                  padding: "0.5rem 0.75rem",
                  fontSize: "12px",
                  color: "#2D2D2D",
                  outline: "none",
                  fontFamily: "inherit",
                  transition: "border-color 0.2s",
                }}
              />
            </div>
          </div>
          {editing && (
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "0.5rem",
                marginTop: "1rem",
              }}
            >
              <button
                onClick={() => {
                  setEditing(false);
                  setName(profile.name);
                }}
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: "9999px",
                  fontSize: "12px",
                  fontWeight: 600,
                  border: "1px solid #EAEAEA",
                  backgroundColor: "#ffffff",
                  color: "#717171",
                  cursor: "pointer",
                }}
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
    </div>
  );
}
