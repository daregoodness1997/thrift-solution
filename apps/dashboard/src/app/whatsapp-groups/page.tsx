"use client";

import { useState, useEffect, useCallback } from "react";
import { config, BrandConfig } from "@thrift/config";
import { Card, Button, StatCard, ColorfulBadge, FadeInUp, StaggerChildren } from "@thrift/ui";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/PageHeader";

const WA_GREEN = "#25D366";
const WA_GREEN_LIGHT = "#DCF8C6";

interface MyGroup {
  id: string;
  name: string;
  circleName: string | null;
  description: string | null;
  memberCount: number;
  inviteLink: string | null;
  pinned: boolean;
}

interface AllGroup {
  id: string;
  name: string;
  circleName: string | null;
  description: string | null;
  memberCount: number;
  inviteLink: string | null;
  joined: boolean;
  isDefault: boolean;
}

const filterTabs = ["all", "pinned"] as const;
type Filter = (typeof filterTabs)[number];

function WhatsAppIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={WA_GREEN}>
      <path d="M17.498 14.382c-.301-.15-1.767-.967-2.04-1.08-.273-.114-.473-.165-.673.165-.197.325-.767.997-.94 1.2-.175.208-.347.23-.644.08-.297-.15-1.261-.485-2.403-1.546-.888-.828-1.484-1.854-1.66-2.149-.173-.3-.019-.465.13-.615.13-.13.3-.345.45-.523.146-.181.194-.301.297-.5.1-.194.05-.372-.025-.527-.075-.15-.672-1.62-.922-2.206-.24-.584-.487-.51-.672-.51-.172-.015-.371-.015-.571-.015-.2 0-.523.074-.797.375-.273.3-1.045 1.02-1.045 2.475s1.07 2.865 1.219 3.075c.149.21 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.767-.721 2.016-1.426.247-.705.247-1.305.173-1.426-.074-.121-.274-.198-.575-.347z M12.05 21.785h-.001a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982 1.003-3.628-.235-.374A9.86 9.86 0 012.16 12c0-5.44 4.418-9.858 9.85-9.858 5.44 0 9.857 4.418 9.857 9.858 0 2.665-1.05 5.117-2.95 6.959l-.35.35.003.002-5.858 5.636z" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={config.colors.accent} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 17v5M9 2h6l-1 7h4l-7 8v-5H7l2-7z" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth={2} strokeLinecap="round">
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
}

export default function WhatsAppGroupsPage() {
  const { token } = useAuth();
  const [cfg] = useState<BrandConfig>(config);
  const [filter, setFilter] = useState<Filter>("all");
  const [myGroups, setMyGroups] = useState<MyGroup[]>([]);
  const [allGroups, setAllGroups] = useState<AllGroup[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState<string | null>(null);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  const fetchMyGroups = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/whatsapp/my`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setMyGroups(data.data || []);
    } catch {}
  }, [token, API_URL]);

  const fetchAllGroups = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/whatsapp/`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setAllGroups(data.data || []);
    } catch {}
  }, [token, API_URL]);

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    Promise.all([fetchMyGroups(), fetchAllGroups()]).then(() => setLoading(false));
  }, [token, fetchMyGroups, fetchAllGroups]);

  const totalMembers = myGroups.reduce((sum, g) => sum + g.memberCount, 0);

  const filtered = myGroups.filter((g) => {
    if (filter === "pinned" && !g.pinned) return false;
    if (search && !g.name.toLowerCase().includes(search.toLowerCase()) && !(g.circleName || "").toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  async function joinGroup(groupId: string) {
    if (!token || joining) return;
    setJoining(groupId);
    try {
      const res = await fetch(`${API_URL}/api/whatsapp/${groupId}/join`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        await Promise.all([fetchMyGroups(), fetchAllGroups()]);
      }
    } catch {}
    setJoining(null);
  }

  const availableGroups = allGroups.filter((g) => !g.joined);

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "clamp(1rem, 3vw, 2rem)" }}>
      <PageHeader
        badgeLabel="WhatsApp Groups"
        badgeColor={WA_GREEN}
        heading="WhatsApp"
        accentText="Groups"
        description="Stay connected with your circles through WhatsApp"
      />

      <StaggerChildren staggerDelay={80} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        <StatCard
          label="My Groups"
          value={myGroups.length.toString()}
          icon={<WhatsAppIcon size={18} />}
          change="Active groups"
          positive
        />
        <StatCard
          label="Available to Join"
          value={availableGroups.length.toString()}
          icon={<span style={{ color: WA_GREEN, fontSize: "16px" }}>&#128269;</span>}
          variant="primary"
          change="Discover new groups"
          positive={availableGroups.length > 0}
        />
        <StatCard
          label="Total Members"
          value={totalMembers.toLocaleString()}
          icon={<UsersIcon />}
          change="Across your groups"
          positive
        />
      </StaggerChildren>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1.5rem" }}>
        <FadeInUp delay={300}>
          <Card padding="0" hover={false} style={{ overflow: "hidden" }}>
            <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid #F0F0F0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.75rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <h2 style={{ fontSize: "0.9375rem", fontWeight: 700, color: "#1A1A1A", letterSpacing: "-0.02em" }}>My Groups</h2>
                  <span style={{ fontSize: "10px", fontWeight: 700, color: "#999", backgroundColor: "#F5F5F5", padding: "0.125rem 0.5rem", borderRadius: "9999px" }}>{filtered.length}</span>
                </div>
                <div style={{ display: "flex", gap: "0.25rem", backgroundColor: "#F5F7F5", borderRadius: "0.625rem", padding: "0.25rem" }}>
                  {filterTabs.map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      style={{
                        padding: "0.375rem 0.75rem",
                        borderRadius: "0.5rem",
                        fontSize: "11px",
                        fontWeight: 600,
                        border: "none",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        textTransform: "capitalize",
                        backgroundColor: filter === f ? "#ffffff" : "transparent",
                        color: filter === f ? WA_GREEN : "#717171",
                        boxShadow: filter === f ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                      }}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ position: "relative" }}>
                <div style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
                  <SearchIcon />
                </div>
                <input
                  type="text"
                  placeholder="Search groups..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.625rem 0.75rem 0.625rem 2.25rem",
                    borderRadius: "0.625rem",
                    border: "1px solid #EAEAEA",
                    backgroundColor: "#FAFAFA",
                    fontSize: "12px",
                    color: "#2D2D2D",
                    outline: "none",
                    transition: "border-color 0.2s ease",
                    boxSizing: "border-box",
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = `${WA_GREEN}60`; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "#EAEAEA"; }}
                />
              </div>
            </div>

            <div style={{ padding: "0.5rem" }}>
              {loading ? (
                <div style={{ padding: "3rem 1rem", textAlign: "center" }}>
                  <p style={{ fontSize: "12px", color: "#999" }}>Loading groups...</p>
                </div>
              ) : filtered.length === 0 ? (
                <div style={{ padding: "3rem 1rem", textAlign: "center" }}>
                  <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>&#128269;</div>
                  <p style={{ fontSize: "13px", color: "#999", fontWeight: 500 }}>No groups found</p>
                  <p style={{ fontSize: "11px", color: "#BBB", marginTop: "0.25rem" }}>{myGroups.length === 0 ? "Join a group below to get started" : "Try adjusting your search or filter"}</p>
                </div>
              ) : (
                filtered.map((group, idx) => (
                  <div
                    key={group.id}
                    style={{
                      padding: "0.875rem 1rem",
                      borderRadius: "0.875rem",
                      marginBottom: idx < filtered.length - 1 ? "0.25rem" : 0,
                      border: "1px solid transparent",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#F8F8F8";
                      e.currentTarget.style.transform = "translateX(4px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                      e.currentTarget.style.transform = "translateX(0)";
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <div style={{ width: "44px", height: "44px", borderRadius: "0.875rem", backgroundColor: `${WA_GREEN}12`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <WhatsAppIcon size={22} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                          <span style={{ fontSize: "13px", fontWeight: 600, color: "#1A1A1A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {group.name}
                          </span>
                          {group.pinned && <PinIcon />}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", marginTop: "0.125rem" }}>
                          {group.circleName && <span style={{ fontSize: "11px", color: "#999", flexShrink: 0 }}>{group.circleName}</span>}
                          {group.circleName && <span style={{ fontSize: "8px", color: "#CCC" }}>&#8226;</span>}
                          <span style={{ fontSize: "11px", color: "#717171", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{group.description || "WhatsApp group"}</span>
                        </div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.375rem", flexShrink: 0 }}>
                        <span style={{ fontSize: "10px", color: "#BBB" }}>{group.memberCount} members</span>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.625rem", marginLeft: "calc(44px + 0.75rem)" }}>
                      {group.inviteLink && (
                        <Button
                          variant="outline"
                          size="sm"
                          style={{
                            fontSize: "10px",
                            padding: "0.25rem 0.625rem",
                            color: WA_GREEN,
                            borderColor: `${WA_GREEN}30`,
                            backgroundColor: `${WA_GREEN}08`,
                            borderRadius: "0.5rem",
                          }}
                          onClick={(e) => { e.stopPropagation(); window.open(group.inviteLink!, "_blank"); }}
                        >
                          Open in WhatsApp
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </FadeInUp>

        {availableGroups.length > 0 && (
          <FadeInUp delay={400}>
            <Card padding="1.5rem">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
                <div>
                  <h2 style={{ fontSize: "0.9375rem", fontWeight: 700, color: "#1A1A1A", letterSpacing: "-0.02em" }}>Available Groups</h2>
                  <p style={{ fontSize: "11px", color: "#999", marginTop: "0.25rem" }}>Join communities and start saving together</p>
                </div>
                <ColorfulBadge label="Quick Join" color={config.colors.accent} />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {availableGroups.map((g) => (
                  <div
                    key={g.id}
                    style={{
                      padding: "1rem",
                      borderRadius: "1rem",
                      border: "1px solid #F0F0F0",
                      backgroundColor: "#FAFAFA",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = `${WA_GREEN}40`;
                      e.currentTarget.style.backgroundColor = `${WA_GREEN}08`;
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.04)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "#F0F0F0";
                      e.currentTarget.style.backgroundColor = "#FAFAFA";
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <div style={{ width: "36px", height: "36px", borderRadius: "0.75rem", backgroundColor: `${WA_GREEN}10`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <WhatsAppIcon size={18} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: "12px", fontWeight: 600, color: "#2D2D2D", display: "block" }}>{g.name}</span>
                        <span style={{ fontSize: "10px", color: "#999", display: "block", marginTop: "0.0625rem" }}>{g.description || "Join this community group"}</span>
                      </div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.75rem", marginLeft: "calc(36px + 0.75rem)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                        <UsersIcon />
                        <span style={{ fontSize: "10px", color: "#999" }}>{g.memberCount} members</span>
                      </div>
                      <Button
                        variant="primary"
                        size="sm"
                        style={{ fontSize: "10px", padding: "0.3rem 0.75rem", backgroundColor: WA_GREEN, borderRadius: "0.5rem" }}
                        onClick={() => joinGroup(g.id)}
                        disabled={joining === g.id}
                      >
                        {joining === g.id ? "Joining..." : "Join"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </FadeInUp>
        )}
      </div>
    </div>
  );
}
