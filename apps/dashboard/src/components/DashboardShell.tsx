"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { config } from "@thrift/config";
import { useAuth } from "@/lib/auth-context";
import { NotificationBell } from "@/components/NotificationBell";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface NavItem {
  label: string;
  href: string;
  icon: string;
  badge?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const AUTH_ROUTES = ["/login", "/register", "/forgot-password", "/reset-password"];

const STAFF_ROLES = ["admin", "superadmin", "support", "finance", "moderator"];

function isStaffRole(role?: string) {
  return !!role && STAFF_ROLES.includes(role);
}

const FALLBACK_NAV: NavSection[] = [
  {
    title: "",
    items: [
      { label: "Overview", href: "/", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1" },
      { label: "Transactions", href: "/transactions", icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" },
      { label: "Donate", href: "/donate", icon: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" },
      { label: "My Circles", href: "/my-circles", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
      { label: "Chat", href: "/chat", icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" },
      { label: "Marketplace", href: "/marketplace", icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4", badge: "Premium" },
      { label: "Jobs", href: "/jobs", icon: "M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z", badge: "Premium" },
    ],
  },
  {
    title: "Member Portal",
    items: [
      { label: "My Donations", href: "/donations", icon: "M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" },
      { label: "My Clearance", href: "/my-clearance", icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" },
      { label: "Referrals", href: "/referrals", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" },
      { label: "KYC Verification", href: "/kyc", icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" },
      { label: "Loans", href: "/loans", icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z", badge: "Premium" },
      { label: "Circle Savings", href: "/circles", icon: "M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" },
    ],
  },
  {
    title: "Community",
    items: [
      { label: "WhatsApp Groups", href: "/whatsapp-groups", icon: "M17.498 14.382c-.301-.15-1.767-.967-2.04-1.08-.273-.114-.473-.165-.673.165-.197.325-.767.997-.94 1.2-.175.208-.347.23-.644.08-.297-.15-1.261-.485-2.403-1.546-.888-.828-1.484-1.854-1.66-2.149-.173-.3-.019-.465.13-.615.13-.13.3-.345.45-.523.146-.181.194-.301.297-.5.1-.194.05-.372-.025-.527-.075-.15-.672-1.62-.922-2.206-.24-.584-.487-.51-.672-.51-.172-.015-.371-.015-.571-.015-.2 0-.523.074-.797.375-.273.3-1.045 1.02-1.045 2.475s1.07 2.865 1.219 3.075c.149.21 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.767-.721 2.016-1.426.247-.705.247-1.305.173-1.426-.074-.121-.274-.198-.575-.347z M12.05 21.785h-.001a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982 1.003-3.628-.235-.374A9.86 9.86 0 012.16 12c0-5.44 4.418-9.858 9.85-9.858 5.44 0 9.857 4.418 9.857 9.858 0 2.665-1.05 5.117-2.95 6.959l-.35.35.003.002-5.858 5.636z" },
    ],
  },
  {
    title: "Management",
    items: [
      { label: "Defaults", href: "/default-management", icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" },
      { label: "Clearance", href: "/clearance-management", icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" },
      { label: "KYC Reviews", href: "/kyc/admin", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" },
    ],
  },
  {
    title: "",
    items: [
      { label: "Profile", href: "/profile", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
      { label: "Settings", href: "/settings", icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" },
    ],
  },
];

const FALLBACK_STAFF: NavSection[] = [
  {
    title: "Administration",
    items: [
      { label: "Admin Overview", href: "/admin", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1" },
      { label: "User Management", href: "/admin/users", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
      { label: "Loan Requests", href: "/admin/loans", icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
      { label: "Audit Log", href: "/admin/audit-logs", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
    ],
  },
  {
    title: "Oversight",
    items: [
      { label: "Transactions", href: "/admin/transactions", icon: "M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" },
      { label: "Referrals", href: "/admin/referrals", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" },
      { label: "Virtual Accounts", href: "/admin/virtual-accounts", icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v9a2 2 0 002 2z" },
    ],
  },
  {
    title: "Moderation",
    items: [
      { label: "Marketplace", href: "/admin/marketplace", icon: "M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" },
      { label: "Jobs", href: "/admin/jobs", icon: "M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" },
      { label: "Donations", href: "/admin/donations", icon: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" },
    ],
  },
  {
    title: "Administration",
    items: [
      { label: "Configuration", href: "/admin/config", icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31 2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" },
    ],
  },
];

function Icon({ path, size = 20 }: { path: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d={path} />
    </svg>
  );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, token, loading, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [navSections, setNavSections] = useState<NavSection[]>(FALLBACK_NAV);
  const [navLoading, setNavLoading] = useState(true);
  const [virtualAccount, setVirtualAccount] = useState<{ accountNumber: string; bankName: string } | null>(null);

  const isAuthPage = AUTH_ROUTES.includes(pathname);

  const fetchNavigation = useCallback(async () => {
    if (!token) return;
    try {
      setNavLoading(true);
      const res = await fetch(`${API_URL}/api/navigation`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.data && data.data.length > 0) {
        setNavSections(data.data);
      } else {
        setNavSections(isStaffRole(user?.role) ? FALLBACK_STAFF : FALLBACK_NAV);
      }
    } catch {
      setNavSections(isStaffRole(user?.role) ? FALLBACK_STAFF : FALLBACK_NAV);
    } finally {
      setNavLoading(false);
    }
  }, [token, user]);

  const fetchVirtualAccount = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/virtual-accounts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.virtualAccounts && data.virtualAccounts.length > 0) {
        setVirtualAccount({
          accountNumber: data.virtualAccounts[0].accountNumber,
          bankName: data.virtualAccounts[0].bankName,
        });
      }
    } catch {}
  }, [token]);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!loading && !user && !isAuthPage) {
      router.push("/login");
    }
  }, [user, loading, isAuthPage, router]);

  useEffect(() => {
    if (user && token) {
      fetchNavigation();
      fetchVirtualAccount();
    }
  }, [user, token, fetchNavigation, fetchVirtualAccount]);

  if (isAuthPage) {
    return <>{children}</>;
  }

  if (loading || navLoading) {
    return (
      <div className="flex min-h-screen bg-brand-cream">
        <aside className="w-60 flex-shrink-0 border-r border-black/5 bg-white p-5">
          <div className="flex flex-col gap-4">
            <div className="h-5 w-20 animate-pulse rounded-md bg-gray-200" />
            <div className="mt-4 flex flex-col gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2.5 rounded-lg px-3 py-2">
                  <div className="h-[18px] w-[18px] animate-pulse rounded-md bg-gray-200" />
                  <div className="h-3 flex-1 animate-pulse rounded-md bg-gray-200" />
                </div>
              ))}
            </div>
          </div>
        </aside>
        <main className="ml-60 flex-1 p-[clamp(1rem,3vw,2rem)]">
          <div className="flex flex-col gap-6">
            <div className="h-3 w-52 animate-pulse rounded-md bg-gray-200" />
            <div className="h-7 w-72 animate-pulse rounded-md bg-gray-200" />
          </div>
        </main>
      </div>
    );
  }

  if (!user) return null;

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const displayName = user.name.split(" ")[0] + " " + (user.name.split(" ").slice(1)[0]?.[0] || "") + ".";

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <div className="flex min-h-screen bg-brand-cream">
      {isMobile && sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 z-[29] bg-black/40" />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-60 flex-shrink-0 flex-col overflow-y-auto border-r border-black/5 bg-white transition-transform duration-300 ${
          isMobile && !sidebarOpen ? "-translate-x-full" : "translate-x-0"
        }`}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-5 pb-4 pt-5">
          <div>
            <Link href="/" className="inline-block">
              <span className="font-display text-lg font-bold tracking-tight text-brand-primary transition-transform duration-200 hover:scale-105">
                {config.name.toUpperCase().replace(/\s+/g, "")}
              </span>
            </Link>
            <p className="mt-0.5 text-[10px] font-light text-gray-400">
              {isStaffRole(user.role) ? "Admin Portal" : "Member Portal"}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <NotificationBell />
            {isMobile && (
              <button onClick={() => setSidebarOpen(false)} className="cursor-pointer p-1 text-gray-500">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            )}
          </div>
        </div>

        <nav className="flex-1 p-3">
          {navSections.map((section, sIdx) => (
            <div key={sIdx} className={sIdx < navSections.length - 1 ? "mb-3" : ""}>
              {section.title && (
                <span className="block px-3 pb-1 pt-1.5 text-[9px] font-bold uppercase tracking-wider text-gray-400">
                  {section.title}
                </span>
              )}
              <div className="flex flex-col gap-0.5">
                {section.items.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`group flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] transition-all duration-200 ${
                        isActive
                          ? "bg-brand-primary/5 font-semibold text-brand-primary"
                          : "font-normal text-gray-500 hover:translate-x-1 hover:bg-brand-primary/5 hover:text-brand-dark"
                      }`}
                    >
                      <Icon path={item.icon} size={18} />
                      <span>{item.label}</span>
                      {item.badge && (
                        <span className="ml-auto rounded-full bg-gradient-to-br from-brand-gold to-brand-accent px-1.5 py-0.5 text-[9px] font-bold uppercase leading-[1.4] tracking-wide text-white">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-gray-100 p-3">
          <Link
            href="/profile"
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2 transition-all duration-200 ${
              pathname === "/profile" ? "bg-brand-primary/5" : "bg-gray-50 hover:bg-gray-100"
            }`}
          >
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-brand-primary text-[11px] font-bold text-white">{initials}</div>
            <div className="min-w-0 flex-1">
              <span className="block truncate text-xs font-semibold text-brand-dark">{displayName}</span>
              <span className="block truncate text-[10px] text-gray-400">{user.email}</span>
              {user.role === "member" && (virtualAccount?.accountNumber || user.accountNumber) && (
                <span className="mt-0.5 block font-mono text-[9px] font-semibold tracking-wide text-brand-primary">
                  {virtualAccount?.accountNumber || user.accountNumber}
                </span>
              )}
            </div>
            <button
              onClick={handleLogout}
              title="Sign out"
              className="flex-shrink-0 cursor-pointer p-1 text-gray-400 transition-colors hover:text-red-600"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </Link>
        </div>
      </aside>

      <main className={`min-w-0 flex-1 animate-fade-in ${isMobile ? "ml-0" : "ml-60"}`}>
        {isMobile && (
          <div className="sticky top-0 z-20 flex items-center gap-3 border-b border-black/5 bg-white px-4 py-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="cursor-pointer p-1 text-brand-dark">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <span className="font-display text-base font-bold tracking-tight text-brand-primary">{config.name.toUpperCase().replace(/\s+/g, "")}</span>
            <div className="ml-auto">
              <NotificationBell />
            </div>
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
