"use client";

import { useState, useEffect, useCallback } from "react";
import { config, BrandConfig } from "@thrift/config";
import { Card, Button, StatCard, ColorfulBadge, FadeInUp, StaggerChildren } from "@thrift/ui";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/PageHeader";
import Pagination from "@/components/Pagination";

const WA_GREEN = "#25D366";
const WA_GREEN_LIGHT = "#DCF8C6";
const LIMIT = 20;

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
  const [myGroupsPage, setMyGroupsPage] = useState(1);
  const [allGroupsPage, setAllGroupsPage] = useState(1);
  const [myGroupsTotal, setMyGroupsTotal] = useState(0);
  const [myGroupsTotalPages, setMyGroupsTotalPages] = useState(0);
  const [allGroupsTotal, setAllGroupsTotal] = useState(0);
  const [allGroupsTotalPages, setAllGroupsTotalPages] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState<string | null>(null);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  const fetchMyGroups = useCallback(async () => {
    if (!token) return;
    try {
      const searchParam = search ? `&search=${encodeURIComponent(search)}` : "";
      const pinnedParam = filter === "pinned" ? "&pinned=true" : "";
      const res = await fetch(`${API_URL}/api/whatsapp/my?page=${myGroupsPage}&limit=${LIMIT}${searchParam}${pinnedParam}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) {
        setMyGroups(data.data.items || []);
        setMyGroupsTotal(data.data.total || 0);
        setMyGroupsTotalPages(data.data.totalPages || 0);
      }
    } catch {}
  }, [token, API_URL, myGroupsPage, search, filter]);

  const fetchAllGroups = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/whatsapp?page=${allGroupsPage}&limit=${LIMIT}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) {
        setAllGroups(data.data.items || []);
        setAllGroupsTotal(data.data.total || 0);
        setAllGroupsTotalPages(data.data.totalPages || 0);
      }
    } catch {}
  }, [token, API_URL, allGroupsPage]);

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    const timeout = setTimeout(() => {
      Promise.all([fetchMyGroups(), fetchAllGroups()]).then(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timeout);
  }, [token, fetchMyGroups, fetchAllGroups, myGroupsPage, allGroupsPage, search, filter]);

  const totalMembers = myGroups.reduce((sum, g) => sum + g.memberCount, 0);

  const filtered = myGroups;

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

  const availableGroups = allGroups;

  return (
    <div className="mx-auto max-w-[1280px] p-[clamp(1rem,3vw,2rem)]">
      <PageHeader
        badgeLabel="WhatsApp Groups"
        badgeColor={WA_GREEN}
        heading="WhatsApp"
        accentText="Groups"
        description="Stay connected with your circles through WhatsApp"
      />

      <StaggerChildren staggerDelay={80} className="mb-8 grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
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
          icon={<span className="text-base" style={{ color: WA_GREEN }}>&#128269;</span>}
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

      <div className="grid grid-cols-1 gap-6">
        <FadeInUp delay={300}>
          <Card padding="0" hover={false} className="overflow-hidden">
            <div className="border-b border-[#F0F0F0] px-6 py-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-[15px] font-bold tracking-[-0.02em] text-brand-dark">My Groups</h2>
                  <span className="rounded-full bg-[#F5F5F5] px-2 py-0.5 text-[10px] font-bold text-gray-400">{filtered.length}</span>
                </div>
                <div className="flex gap-1 rounded-[10px] bg-[#F5F7F5] p-1">
                  {filterTabs.map((f) => (
                    <button
                      key={f}
                      onClick={() => { setFilter(f); setMyGroupsPage(1); }}
                      className="cursor-pointer rounded-lg border-0 px-3 py-1.5 text-[11px] font-semibold capitalize transition-all"
                      style={{ backgroundColor: filter === f ? "#ffffff" : "transparent", color: filter === f ? WA_GREEN : "#717171", boxShadow: filter === f ? "0 1px 3px rgba(0,0,0,0.08)" : "none" }}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
              <div className="relative">
                <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
                  <SearchIcon />
                </div>
                <input
                  type="text"
                  placeholder="Search groups..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-[0.625rem] border border-gray-200 bg-gray-50 px-3 py-2.5 pl-9 text-xs text-[#2D2D2D] outline-none"
                  onFocus={(e) => { e.currentTarget.style.borderColor = `${WA_GREEN}60`; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "#EAEAEA"; }}
                />
              </div>
            </div>

            <div className="p-2">
              {loading ? (
                <div className="px-4 py-12 text-center">
                  <p className="text-xs text-gray-400">Loading groups...</p>
                </div>
              ) : filtered.length === 0 ? (
                <div className="px-4 py-12 text-center">
                  <div className="mb-2 text-[2rem]">&#128269;</div>
                  <p className="text-[13px] font-medium text-gray-400">No groups found</p>
                  <p className="mt-1 text-[11px] text-[#BBB]">{myGroups.length === 0 ? "Join a group below to get started" : "Try adjusting your search or filter"}</p>
                </div>
              ) : (
                filtered.map((group, idx) => (
                  <div
                    key={group.id}
                    className="cursor-pointer rounded-xl border border-transparent p-4 transition-all"
                    style={{ marginBottom: idx < filtered.length - 1 ? "0.25rem" : 0 }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#F8F8F8";
                      e.currentTarget.style.transform = "translateX(4px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                      e.currentTarget.style.transform = "translateX(0)";
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: `${WA_GREEN}12` }}>
                        <WhatsAppIcon size={22} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="mt-0.5 flex items-center gap-1.5">
                          <span className="block truncate text-[13px] font-semibold text-brand-dark">
                            {group.name}
                          </span>
                          {group.pinned && <PinIcon />}
                        </div>
                        <div className="mt-0.5 flex items-center gap-1.5">
                          {group.circleName && <span className="flex-shrink-0 text-[11px] text-gray-400">{group.circleName}</span>}
                          {group.circleName && <span className="text-[8px] text-[#CCC]">&#8226;</span>}
                          <span className="block truncate text-[11px] text-gray-500">{group.description || "WhatsApp group"}</span>
                        </div>
                      </div>
                      <div className="flex flex-shrink-0 flex-col items-end gap-1.5">
                        <span className="text-[10px] text-[#BBB]">{group.memberCount} members</span>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-2.5" style={{ marginLeft: "calc(44px + 0.75rem)" }}>
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

            {myGroupsTotalPages > 1 && (
              <div className="px-4 pb-2">
                <Pagination
                  page={myGroupsPage}
                  totalPages={myGroupsTotalPages}
                  total={myGroupsTotal}
                  limit={LIMIT}
                  onPageChange={setMyGroupsPage}
                  loading={loading}
                />
              </div>
            )}
          </Card>
        </FadeInUp>

        {availableGroups.length > 0 && (
          <FadeInUp delay={400}>
            <Card padding="1.5rem">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-[15px] font-bold tracking-[-0.02em] text-brand-dark">Available Groups</h2>
                  <p className="mt-1 text-[11px] text-gray-400">Join communities and start saving together</p>
                </div>
                <ColorfulBadge label="Quick Join" color={config.colors.accent} />
              </div>

              <div className="flex flex-col gap-3">
                {availableGroups.map((g) => (
                  <div
                    key={g.id}
                    className="rounded-xl border border-[#F0F0F0] bg-gray-50 p-4 transition-all"
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
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `${WA_GREEN}10` }}>
                        <WhatsAppIcon size={18} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="block text-xs font-semibold text-[#2D2D2D]">{g.name}</span>
                        <span className="mt-0.5 block text-[10px] text-gray-400">{g.description || "Join this community group"}</span>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between" style={{ marginLeft: "calc(36px + 0.75rem)" }}>
                      <div className="mt-0.5 flex items-center gap-1.5">
                        <UsersIcon />
                        <span className="text-[10px] text-gray-400">{g.memberCount} members</span>
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

              {allGroupsTotalPages > 1 && (
                <Pagination
                  page={allGroupsPage}
                  totalPages={allGroupsTotalPages}
                  total={allGroupsTotal}
                  limit={LIMIT}
                  onPageChange={setAllGroupsPage}
                  loading={loading}
                />
              )}
            </Card>
          </FadeInUp>
        )}
      </div>
    </div>
  );
}
