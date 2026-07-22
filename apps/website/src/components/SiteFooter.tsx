import Link from "next/link";
import {
  Shield,
  Award,
  Heart,
  Globe,
  MessageCircle,
  Mail,
  Send,
} from "lucide-react";
import { Logo } from "@/components/Logo";
const DASHBOARD_URL =
  process.env.NEXT_PUBLIC_DASHBOARD_URL ||
  "https://app.globalfreedomworldwide.com";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-brand-dark/80 bg-brand-dark py-16 text-gray-400">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-12 grid grid-cols-2 gap-8 md:grid-cols-5">
          <div className="col-span-2 flex flex-col gap-4 md:col-span-1">
            <Logo wordmarkClassName="text-white" />
            <p className="text-xs leading-relaxed text-gray-500">
              Expanding access to education, technology, and economic
              opportunity so everyone can build secure, independent lives.
            </p>
          </div>

          <div>
            <h4 className="mb-4 text-xs font-bold uppercase tracking-wider text-white">
              Mission
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link
                  href="/how-it-works"
                  className="transition-colors hover:text-white"
                >
                  Education & Training
                </Link>
              </li>
              <li>
                <Link
                  href="/how-it-works"
                  className="transition-colors hover:text-white"
                >
                  Economic Opportunity
                </Link>
              </li>
              <li>
                <Link
                  href="/how-it-works"
                  className="transition-colors hover:text-white"
                >
                  Empowerment Tools
                </Link>
              </li>
              <li>
                <Link
                  href="/donate"
                  className="transition-colors hover:text-white"
                >
                  Support Our Mission
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-xs font-bold uppercase tracking-wider text-white">
              Company
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link
                  href="/about"
                  className="transition-colors hover:text-white"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="/how-it-works"
                  className="transition-colors hover:text-white"
                >
                  How It Works
                </Link>
              </li>
              <li>
                <Link
                  href="/donate"
                  className="transition-colors hover:text-white"
                >
                  Donate
                </Link>
              </li>
              <li>
                <a
                  href={`${DASHBOARD_URL}/login`}
                  className="transition-colors hover:text-white"
                >
                  Get Started
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-xs font-bold uppercase tracking-wider text-white">
              Resources
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link
                  href="/how-it-works"
                  className="transition-colors hover:text-white"
                >
                  FAQ
                </Link>
              </li>
              <li>
                <Link
                  href="/donate"
                  className="transition-colors hover:text-white"
                >
                  Make an Impact
                </Link>
              </li>
              <li>
                <a
                  href="mailto:hello@globalfreedomworldwide.com"
                  className="transition-colors hover:text-white"
                >
                  Contact Us
                </a>
              </li>
            </ul>
          </div>

          <div className="col-span-2 flex flex-col gap-4 md:col-span-1">
            <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-white">
              Our Impact
            </h4>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Award className="h-4 w-4 text-brand-sage" />
              <span>12,000+ learners empowered</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Globe className="h-4 w-4 text-brand-accent" />
              <span>34 countries reached</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-4 border-t border-brand-dark/80 pt-6 text-xs text-gray-500 sm:flex-row sm:justify-between">
          <span>&copy; {year} GFW. Expanding opportunity worldwide.</span>
          <div className="flex items-center gap-4">
            <a
              href="#"
              aria-label="Website"
              className="transition-colors hover:text-white"
            >
              <Globe className="h-4 w-4" />
            </a>
            <a
              href="#"
              aria-label="Community"
              className="transition-colors hover:text-white"
            >
              <MessageCircle className="h-4 w-4" />
            </a>
            <a
              href="mailto:hello@globalfreedomworldwide.com"
              aria-label="Email"
              className="transition-colors hover:text-white"
            >
              <Mail className="h-4 w-4" />
            </a>
            <a
              href="mailto:hello@globalfreedomworldwide.com"
              aria-label="Send"
              className="transition-colors hover:text-white"
            >
              <Send className="h-4 w-4" />
            </a>
          </div>
          <div className="flex items-center gap-1.5">
            <span>Built with</span>
            <Heart className="h-3 w-3 fill-brand-accent text-brand-accent" />
            <span>for global empowerment.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
