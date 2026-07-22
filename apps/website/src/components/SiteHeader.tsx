"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  ChevronDown,
  ArrowRight,
  Moon,
  Sun,
  GraduationCap,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { useTheme } from "@/lib/theme-context";

export const DASHBOARD_URL =
  process.env.NEXT_PUBLIC_DASHBOARD_URL ||
  "https://app.globalfreedomworldwide.com";

const primaryNavLinks = [
  { label: "How It Works", href: "/how-it-works" },
  { label: "About", href: "/about" },
  { label: "Donate", href: "/donate" },
];

const platformLinks = [
  {
    label: "Education & Training",
    desc: "Access quality tech training.",
    href: "/how-it-works",
    icon: null,
  },
  {
    label: "Economic Opportunity",
    desc: "Find jobs & build businesses.",
    href: "/how-it-works",
    icon: null,
  },
  {
    label: "Empowerment Tools",
    desc: "Knowledge & financial tools.",
    href: "/how-it-works",
    icon: null,
  },
  {
    label: "Support Our Mission",
    desc: "Help expand opportunity.",
    href: "/donate",
    icon: null,
  },
];

const exploreLinks = [
  { label: "Our Mission", href: "/about", desc: "Education, opportunity & empowerment" },
  { label: "How It Works", href: "/how-it-works", desc: "Learn about our programs" },
  { label: "Impact Stories", href: "/about", desc: "Real transformations" },
  { label: "Support Us", href: "/donate", desc: "Help expand opportunity" },
];

export function SiteHeader() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      const currentScroll = window.scrollY;
      setIsScrolled(currentScroll > 20);
      setScrollProgress(totalScroll > 0 ? (currentScroll / totalScroll) * 100 : 0);
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      {/* Top Scroll Progress Indicator */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-slate-200/50 dark:bg-slate-800/50 z-50 pointer-events-none">
        <div
          className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 transition-all duration-150 ease-out"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      <header
        className={`fixed top-1 left-0 right-0 z-40 transition-all duration-300 ${
          isScrolled
            ? "bg-white dark:bg-slate-900 backdrop-blur-xl shadow-sm border-b border-slate-200/60 dark:border-slate-800/60 py-3"
            : "bg-transparent py-5"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          
          {/* BRAND LOGO */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <Logo />
          </Link>

          {/* DESKTOP NAV LINKS (Clean & Spacious 4 Primary + Dropdown) */}
          <nav className="hidden lg:flex items-center gap-1.5 bg-slate-100/70 dark:bg-slate-800/60 p-1.5 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 backdrop-blur-md">
            {primaryNavLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive(link.href)
                    ? "text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900"
                    : "text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white dark:hover:bg-slate-900"
                }`}
              >
                {link.label}
              </Link>
            ))}

            {/* Dropdown Menu Trigger */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white dark:hover:bg-slate-900 transition-all flex items-center gap-1"
              >
                <span>Explore</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {/* Dropdown Panel */}
              {dropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-64 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl space-y-1 animate-fadeIn">
                  {exploreLinks.map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={() => setDropdownOpen(false)}
                      className="block p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group"
                    >
                      <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                        {item.label}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">
                        {item.desc}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </nav>

          {/* RIGHT ACTION GROUP */}
          <div className="hidden md:flex items-center gap-2.5">
            {/* Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme mode"
              className="p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
              title={`Switch to ${theme === "light" ? "Dark" : "Light"} Mode`}
            >
              {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-400" />}
            </button>

            <div className="h-5 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

            {/* SCHOLAR PORTAL BUTTON */}
            <a
              href={`${DASHBOARD_URL}/register`}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900 transition-all flex items-center gap-1.5"
            >
              <GraduationCap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Portal</span>
            </a>

            {/* PRIMARY CTA */}
            <a
              href={`${DASHBOARD_URL}/register`}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all flex items-center gap-1.5"
            >
              <span className="text-white">Join a Circle</span>
              <ArrowRight className="h-3.5 w-3.5 text-white" />
            </a>
          </div>

          {/* MOBILE MENU BUTTON */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300"
            >
              {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-400" />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle mobile menu"
              className="p-2.5 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>

        {/* MOBILE DROPDOWN DRAWER */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border-b border-slate-200 dark:border-slate-800 px-4 py-6 shadow-2xl animate-fadeIn">
            <div className="flex flex-col gap-4">
              
              <div className="grid grid-cols-2 gap-2 my-2">
                {[...primaryNavLinks, ...exploreLinks].map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-blue-600 transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-2.5">
                <a
                  href={`${DASHBOARD_URL}/login`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-3 rounded-xl text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 flex items-center justify-center gap-2"
                >
                  <GraduationCap className="w-4 h-4 text-blue-600" />
                  <span>Portal (Login)</span>
                </a>

                <a
                  href={`${DASHBOARD_URL}/register`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-3 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-2"
                >
                  <span className="text-white">Join a Circle</span>
                  <ArrowRight className="h-3.5 w-3.5 text-white" />
                </a>
              </div>

            </div>
          </div>
        )}
      </header>
    </>
  );
}
