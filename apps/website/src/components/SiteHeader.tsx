"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  ChevronDown,
  ArrowRight,
  Handshake,
  Wallet,
  ShieldCheck,
  HeartHandshake,
  LineChart,
  Users,
} from "lucide-react";
import { Logo } from "@/components/Logo";

const platformLinks = [
  {
    label: "Ajo Circles",
    desc: "Create or join contribution groups.",
    href: "/marketplace",
    icon: Handshake,
  },
  {
    label: "Contribution Tracking",
    desc: "Transparent real-time ledgers.",
    href: "/marketplace",
    icon: Wallet,
  },
  {
    label: "Secure Escrow",
    desc: "Funds protected until payout.",
    href: "/marketplace",
    icon: ShieldCheck,
  },
  {
    label: "Donations",
    desc: "Support circles & community.",
    href: "/donate",
    icon: HeartHandshake,
  },
];

const navLinks = [
  { label: "How It Works", href: "/how-it-works" },
  { label: "Pricing", href: "/pricing" },
  { label: "About", href: "/about" },
  { label: "Donate", href: "/donate" },
];

const DASHBOARD_URL = process.env.NEXT_PUBLIC_DASHBOARD_URL || "http://localhost:3001";

export function SiteHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white/95 py-4 text-brand-dark shadow-md backdrop-blur-md"
          : "bg-transparent py-5 text-brand-dark"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6">
        <Link href="/" className="group flex items-center gap-2">
          <Logo />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-7 lg:flex">
          <div
            className="relative"
            onMouseEnter={() => setActiveDropdown("platform")}
            onMouseLeave={() => setActiveDropdown(null)}
          >
            <button className="flex items-center gap-1 py-2 text-sm font-medium transition-colors hover:text-brand-primary">
              Platform
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-300 ${
                  activeDropdown === "platform" ? "rotate-180" : ""
                }`}
              />
            </button>
            {activeDropdown === "platform" && (
              <div className="absolute left-1/2 top-full mt-1 w-[480px] -translate-x-1/2 grid-cols-2 gap-3 rounded-2xl border border-gray-100 bg-white p-6 shadow-xl">
                <div className="col-span-2 mb-1 border-b border-gray-100 pb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Build & manage thrift circles
                  </span>
                </div>
                {platformLinks.map((l) => {
                  const Icon = l.icon;
                  return (
                    <Link
                      key={l.label}
                      href={l.href}
                      className="flex gap-3 rounded-xl p-2 transition-colors hover:bg-brand-primary/5"
                    >
                      <div className="h-fit rounded-lg bg-brand-primary/10 p-2 text-brand-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-gray-900">
                          {l.label}
                        </h4>
                        <p className="mt-0.5 text-[11px] text-gray-500">
                          {l.desc}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`py-2 text-sm font-medium transition-colors hover:text-brand-primary ${
                isActive(l.href) ? "text-brand-primary" : "text-brand-dark"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-4 lg:flex">
          <a
            href={`${DASHBOARD_URL}/login`}
            className="text-sm font-semibold text-brand-dark transition-colors hover:text-brand-primary"
          >
            Sign In
          </a>
          <a
            href={`${DASHBOARD_URL}/register`}
            className="flex items-center gap-1.5 rounded-full bg-brand-primary px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-primary/20 transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-secondary"
          >
            Join a Circle <ArrowRight className="h-4 w-4" />
          </a>
        </div>

        <button
          className="rounded-xl p-2 transition-colors hover:bg-gray-100 lg:hidden"
          onClick={() => setIsMobileMenuOpen((v) => !v)}
        >
          {isMobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Mobile drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 top-[72px] z-40 flex flex-col overflow-y-auto border-t border-gray-100 bg-white p-6 lg:hidden">
          <div className="flex flex-grow flex-col gap-6">
            <div>
              <span className="mb-3 block text-xs font-bold uppercase tracking-wider text-gray-400">
                Platform
              </span>
              <div className="grid grid-cols-1 gap-3">
                {platformLinks.map((l) => {
                  const Icon = l.icon;
                  return (
                    <Link
                      key={l.label}
                      href={l.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-3 rounded-xl p-3 hover:bg-gray-50"
                    >
                      <div className="rounded-lg bg-brand-primary/10 p-2 text-brand-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-gray-900">
                          {l.label}
                        </h4>
                        <p className="text-[10px] text-gray-500">{l.desc}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="h-px w-full bg-gray-100" />

            <div className="flex flex-col gap-1">
              {navLinks.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-between border-b border-gray-50 p-3 text-base font-semibold text-gray-900"
                >
                  <span>{l.label}</span>
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 pb-10">
            <a
              href={`${DASHBOARD_URL}/login`}
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full rounded-full border border-gray-200 py-3 text-center text-sm font-semibold text-gray-700"
            >
              Sign In
            </a>
            <a
              href={`${DASHBOARD_URL}/register`}
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-brand-primary py-3 text-sm font-semibold text-white shadow-md"
            >
              <span className="text-white">Join a Circle</span>
              <ArrowRight className="h-4 w-4. bg-white" />
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
