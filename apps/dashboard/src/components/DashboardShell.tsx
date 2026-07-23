"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { config } from "@thrift/config";
import { useAuth } from "@/lib/auth-context";
import { wakeUpServer } from "@/lib/wake-up";
import { NotificationBell } from "@/components/NotificationBell";
import { fetchDeduped } from "@/lib/fetch-cache";
import {
  ArrowLeft,
  LogOut,
  Globe,
  Sun,
  Moon,
  Menu,
  X,
  ShieldCheck,
  ChevronRight,
  UserCheck,
  Wifi,
  Home,
  Users,
  Landmark,
  ClipboardList,
  ArrowRightLeft,
  Handshake,
  CreditCard,
  ShoppingBag,
  Briefcase,
  Heart,
  MessageCircle,
  BookOpen,
  Clock,
  Settings,
  HeadphonesIcon,
  FolderOpen,
  LifeBuoy,
} from "lucide-react";

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
      { label: "WhatsApp Groups", href: "/admin/whatsapp-groups", icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" },
      { label: "Prayer Requests", href: "/admin/prayer-requests", icon: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" },
      { label: "Prayer Sessions", href: "/admin/prayer-sessions", icon: "M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" },
      { label: "Intercessory Hours", href: "/admin/intercessory-hours", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
    ],
  },
  {
    title: "Administration",
    items: [
      { label: "Configuration", href: "/admin/config", icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31 2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" },
    ],
  },
  {
    title: "Support",
    items: [
      { label: "Ticket Inbox", href: "/admin/support", icon: "M18.364 5.636a9 9 0 11-12.728 0M12 3v9m0 0l3-3m-3 3l-3-3" },
      { label: "Ticket Categories", href: "/admin/support/categories", icon: "M7 7h.01M7 11h.01M7 15h.01M11 7h6M11 11h6M11 15h6" },
    ],
  },
];

function Icon({ path, size = 18 }: { path: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d={path} />
    </svg>
  );
}

const NAV_COLORS: Record<string, { active: string; hover: string; icon: string; badge: string }> = {
  blue:   { active: "bg-blue-600 border-blue-600 text-white shadow-md",    hover: "hover:border-blue-400",    icon: "text-blue-400",    badge: "bg-blue-500/20 text-blue-300" },
  purple: { active: "bg-purple-600 border-purple-600 text-white shadow-md", hover: "hover:border-purple-400", icon: "text-purple-400",  badge: "bg-purple-500/20 text-purple-300" },
  emerald:{ active: "bg-emerald-600 border-emerald-600 text-white shadow-md",hover:"hover:border-emerald-400",icon: "text-emerald-400", badge: "bg-emerald-500/20 text-emerald-300" },
  indigo: { active: "bg-indigo-600 border-indigo-600 text-white shadow-md", hover: "hover:border-indigo-400", icon: "text-indigo-400",  badge: "bg-indigo-500/20 text-indigo-300" },
  amber:  { active: "bg-amber-600 border-amber-600 text-white shadow-md",   hover: "hover:border-amber-400",  icon: "text-amber-400",   badge: "bg-amber-500/20 text-amber-300" },
  rose:   { active: "bg-rose-600 border-rose-600 text-white shadow-md",     hover: "hover:border-rose-400",   icon: "text-rose-400",    badge: "bg-rose-500/20 text-rose-300" },
  teal:   { active: "bg-teal-600 border-teal-600 text-white shadow-md",     hover: "hover:border-teal-400",   icon: "text-teal-400",    badge: "bg-teal-500/20 text-teal-300" },
  cyan:   { active: "bg-cyan-600 border-cyan-600 text-white shadow-md",     hover: "hover:border-cyan-400",   icon: "text-cyan-400",    badge: "bg-cyan-500/20 text-cyan-300" },
  pink:   { active: "bg-pink-600 border-pink-600 text-white shadow-md",     hover: "hover:border-pink-400",   icon: "text-pink-400",    badge: "bg-pink-500/20 text-pink-300" },
  orange: { active: "bg-orange-600 border-orange-600 text-white shadow-md", hover: "hover:border-orange-400", icon: "text-orange-400",  badge: "bg-orange-500/20 text-orange-300" },
};

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1": Home,
  "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z": Users,
  "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z": Landmark,
  "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z": ClipboardList,
  "M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4": ArrowRightLeft,
  "M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z": ShoppingBag,
  "M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z": Briefcase,
  "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z": Heart,
  "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z": MessageCircle,
  "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z": BookOpen,
  "M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z": BookOpen,
  "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z": Clock,
  "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31 2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z": Settings,
  "M18.364 5.636a9 9 0 11-12.728 0M12 3v9m0 0l3-3m-3 3l-3-3": LifeBuoy,
  "M7 7h.01M7 11h.01M7 15h.01M11 7h6M11 11h6M11 15h6": FolderOpen,
};

const SECTION_COLORS: Record<string, string> = {
  "Administration": "blue",
  "Oversight": "emerald",
  "Moderation": "purple",
  "Support": "amber",
};

function getNavColor(label: string, sectionTitle?: string): string {
  const lower = label.toLowerCase();
  if (lower.includes("admin overview") || lower.includes("home")) return "blue";
  if (lower.includes("user")) return "indigo";
  if (lower.includes("loan")) return "teal";
  if (lower.includes("audit") || lower.includes("config")) return "orange";
  if (lower.includes("transaction")) return "emerald";
  if (lower.includes("referral")) return "cyan";
  if (lower.includes("virtual")) return "amber";
  if (lower.includes("marketplace")) return "pink";
  if (lower.includes("job")) return "purple";
  if (lower.includes("donation")) return "rose";
  if (lower.includes("whatsapp") || lower.includes("prayer") || lower.includes("intercessory")) return "indigo";
  if (lower.includes("ticket") || lower.includes("support")) return "amber";
  return SECTION_COLORS[sectionTitle || ""] || "blue";
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, token, loading, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [navSections, setNavSections] = useState<NavSection[]>([]);
  const [navLoading, setNavLoading] = useState(true);
  const [virtualAccount, setVirtualAccount] = useState<{ accountNumber: string; bankName: string } | null>(null);
  const [wakeUpLoading, setWakeUpLoading] = useState(false);
  const [serverDown, setServerDown] = useState(false);
  const hasFetchedRef = useRef(false);

  const isAuthPage = AUTH_ROUTES.includes(pathname);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    if (stored === "dark" || (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      setDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleDark = () => {
    setDarkMode((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle("dark", next);
      localStorage.setItem("theme", next ? "dark" : "light");
      return next;
    });
  };

  const fetchNavigation = useCallback(async () => {
    if (!token) return;
    try {
      setNavLoading(true);
      const data = await fetchDeduped(`${API_URL}/api/navigation`, {
        headers: { Authorization: `Bearer ${token}` },
      }, 120_000);
      if (data.success && data.data && data.data.length > 0) {
        setNavSections(data.data);
      } else if (isStaffRole(user?.role)) {
        setNavSections(FALLBACK_STAFF);
      } else {
        setNavSections([]);
      }
    } catch {
      setNavSections(isStaffRole(user?.role) ? FALLBACK_STAFF : []);
    } finally {
      setNavLoading(false);
    }
  }, [token, user]);

  const fetchVirtualAccount = useCallback(async () => {
    if (!token) return;
    try {
      const data = await fetchDeduped(`${API_URL}/api/virtual-accounts`, {
        headers: { Authorization: `Bearer ${token}` },
      }, 120_000);
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

  useEffect(() => { setSidebarOpen(false); }, [pathname]);

  useEffect(() => {
    if (!loading && !user && !isAuthPage) router.push("/login");
  }, [user, loading, isAuthPage, router]);

  useEffect(() => {
    if (!loading && !user && !isAuthPage && !wakeUpLoading) setServerDown(true);
  }, [user, loading, isAuthPage, wakeUpLoading]);

  useEffect(() => {
    if (!loading && user && user.role === "member" && !user.registrationFeePaid && !isAuthPage) {
      router.push(`/register?mode=pay&userId=${user.id}&email=${encodeURIComponent(user.email)}&token=${token}`);
    }
  }, [user, loading, isAuthPage, router, token]);

  useEffect(() => {
    if (user && token && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchNavigation();
      fetchVirtualAccount();
    }
  }, [user, token, fetchNavigation, fetchVirtualAccount]);

  if (isAuthPage) return <>{children}</>;

  if (loading || navLoading) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <aside className="w-64 flex-shrink-0 border-r border-slate-800 bg-slate-950 p-5">
          <div className="flex flex-col gap-4">
            <div className="h-5 w-20 animate-pulse rounded-md bg-slate-800" />
            <div className="mt-4 flex flex-col gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2.5 rounded-2xl border border-slate-800 px-3.5 py-2.5">
                  <div className="h-4 w-4 animate-pulse rounded-md bg-slate-800" />
                  <div className="h-3 flex-1 animate-pulse rounded-md bg-slate-800" />
                </div>
              ))}
            </div>
          </div>
        </aside>
        <main className="ml-64 flex-1 p-[clamp(1rem,3vw,2rem)]">
          <div className="flex flex-col gap-6">
            <div className="h-3 w-52 animate-pulse rounded-md bg-slate-200" />
            <div className="h-7 w-72 animate-pulse rounded-md bg-slate-200" />
          </div>
        </main>
      </div>
    );
  }

  if (!user) return null;

  const handleLogout = () => { logout(); router.push("/login"); };

  const handleWakeUp = async () => {
    setWakeUpLoading(true);
    setServerDown(false);
    const success = await wakeUpServer();
    setWakeUpLoading(false);
    if (success) window.location.reload();
    else setServerDown(true);
  };

  if (serverDown || wakeUpLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="rounded-3xl bg-white dark:bg-slate-900 p-10 shadow-lg text-center max-w-md border border-slate-200 dark:border-slate-800">
          {wakeUpLoading ? (
            <>
              <div className="mx-auto mb-6 h-16 w-16 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Waking up server...</h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Please wait while we bring the service online.</p>
            </>
          ) : (
            <>
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-900/30">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="text-red-600">
                  <path d="M18.364 5.636a9 9 0 11-12.728 0M12 8v4m0 4h.01" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Server is asleep</h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">The backend has spun down. Click below to wake it up.</p>
              <button onClick={handleWakeUp} className="mt-6 btn-primary text-xs">Wake Up Server</button>
            </>
          )}
        </div>
      </div>
    );
  }

  const initials = user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const displayName = user.name.split(" ")[0] + " " + (user.name.split(" ").slice(1)[0]?.[0] || "") + ".";

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {isMobile && sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 z-[29] bg-black/50 backdrop-blur-sm" />
      )}

      {/* Sidebar - Always Dark */}
      <aside className={`fixed inset-y-0 left-0 z-30 flex w-64 flex-shrink-0 flex-col overflow-y-auto border-r border-slate-800 bg-slate-950 transition-transform duration-300 dark-scroll ${isMobile && !sidebarOpen ? "-translate-x-full" : "translate-x-0"}`}>
        {/* Sidebar Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-5 pb-4 pt-5">
          <div>
            <Link href="/" className="inline-block">
              <img src={config.logo} alt={config.name} className="h-8 w-auto object-contain transition-transform duration-200 hover:scale-105" />
            </Link>
            <p className="mt-1 text-[10px] font-bold text-blue-400 uppercase tracking-wider">
              {isStaffRole(user.role) ? "Admin Portal" : "Member Portal"}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <NotificationBell />
            {isMobile && (
              <button onClick={() => setSidebarOpen(false)} className="cursor-pointer p-2 rounded-2xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors">
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-3">
          {navSections.map((section, sIdx) => (
            <div key={sIdx}>
              {section.title && (
                <span className="block px-3 pb-1.5 pt-1 text-[9px] font-bold uppercase tracking-widest !text-slate-400">{section.title}</span>
              )}
              <div className="flex flex-col gap-1.5">
                {section.items.map((item) => {
                  const isActive = pathname === item.href;
                  const colorKey = getNavColor(item.label, section.title);
                  const colors = NAV_COLORS[colorKey];
                  const LucideIcon = ICON_MAP[item.icon];
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-2.5 rounded-2xl px-3.5 py-2.5 text-xs font-normal whitespace-nowrap transition-all duration-200 border ${
                        isActive
                          ? colors.active
                          : `!bg-slate-900 !border-slate-800 !text-white ${colors.hover}`
                      }`}
                    >
                      {LucideIcon ? (
                        <LucideIcon className={`w-4 h-4 ${isActive ? "!text-white" : colors.icon}`} />
                      ) : (
                        <Icon path={item.icon} size={16} />
                      )}
                      <span>{item.label}</span>
                      {item.badge && (
                        <span className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-extrabold ${colors.badge}`}>
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

        {/* User Footer */}
        <div className="border-t border-slate-800 p-3">
          <Link href="/profile" className={`flex items-center gap-3 rounded-2xl px-3 py-3 border transition-all duration-200 ${
            pathname === "/profile"
              ? "!bg-blue-600 !border-blue-600 !text-white shadow-md"
              : "!bg-slate-900 !border-slate-800 hover:!border-blue-400"
          }`}>
            <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-[11px] font-bold shadow-md ${
              pathname === "/profile"
                ? "bg-white/20 text-white"
                : "bg-gradient-to-br from-blue-600 to-indigo-600 text-white"
            }`}>{initials}</div>
            <div className="min-w-0 flex-1">
              <span className="block truncate text-xs font-bold !text-white">{displayName}</span>
              <span className={`block truncate text-[10px] !text-slate-400`}>{user.email}</span>
              {user.role === "member" && (virtualAccount?.accountNumber || user.accountNumber) && (
                <span className="mt-0.5 block font-mono text-[9px] font-semibold tracking-wide !text-blue-400">{virtualAccount?.accountNumber || user.accountNumber}</span>
              )}
            </div>
            <button onClick={handleLogout} title="Sign out" className={`flex-shrink-0 cursor-pointer p-2 rounded-xl transition-colors ${
              pathname === "/profile"
                ? "text-white/70 hover:text-white hover:bg-white/20"
                : "text-slate-400 hover:text-red-400 hover:bg-red-950/40"
            }`}>
              <LogOut className="w-4 h-4" />
            </button>
          </Link>
        </div>
      </aside>

      {/* Main Content - NO FOOTER */}
      <main className={`min-w-0 flex-1 animate-fade-in ${isMobile ? "ml-0" : "ml-64"}`}>
        {/* Top Header Bar - Theme Aware */}
        <header className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
            {/* Left: Mobile menu + Logo */}
            <div className="flex items-center gap-4">
              {isMobile && (
                <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all flex items-center gap-2 text-xs font-semibold">
                  <Menu className="w-5 h-5" />
                </button>
              )}

              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
                  <Globe className="w-4 h-4" />
                </div>
                <div className="hidden md:flex flex-col">
                  <span className="space-grotesk font-bold text-sm leading-tight text-slate-900 dark:text-white">{config.name}</span>
                  <span className="text-[10px] font-medium uppercase text-blue-600 dark:text-blue-400 tracking-wider">
                    {isStaffRole(user.role) ? "Admin Portal" : "Member Portal"}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Theme toggle, User badge, Logout */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button onClick={toggleDark} className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all border border-slate-200 dark:border-slate-700 flex items-center justify-center" title={`Switch to ${darkMode ? "Light" : "Dark"} Mode`}>
                {darkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-slate-500" />}
              </button>

              <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 px-3.5 py-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-[11px] font-bold text-white border border-blue-200 dark:border-blue-500 shadow-md">{initials}</div>
                <div className="text-left hidden sm:block">
                  <div className="space-grotesk font-bold text-xs text-slate-900 dark:text-white leading-tight">{user.name}</div>
                  <div className="text-[10px] text-blue-600 dark:text-blue-400">{user.role === "member" ? "Verified Scholar" : user.role}</div>
                </div>
              </div>

              <button onClick={handleLogout} className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/60 hover:text-red-600 dark:hover:text-red-300 text-slate-600 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 transition-colors">
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Log Out</span>
              </button>
            </div>
          </div>
        </header>

        {children}
      </main>
    </div>
  );
}
