import Link from "next/link";
import { Shield, Award, Heart, Globe, MessageCircle, Mail, Send } from "lucide-react";
import { Logo } from "@/components/Logo";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-brand-dark/80 bg-brand-dark py-16 text-gray-400">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-12 grid grid-cols-2 gap-8 md:grid-cols-5">
          <div className="col-span-2 flex flex-col gap-4 md:col-span-1">
            <Logo wordmarkClassName="text-white" />
            <p className="text-xs leading-relaxed text-gray-500">
              The modern home for Ajo &amp; communal thrift. Save together, grow
              together — with transparent tracking, secure escrow, and smart
              automation.
            </p>
          </div>

          <div>
            <h4 className="mb-4 text-xs font-bold uppercase tracking-wider text-white">
              Platform
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li><Link href="/marketplace" className="transition-colors hover:text-white">Ajo Circles</Link></li>
              <li><Link href="/marketplace" className="transition-colors hover:text-white">Contribution Tracking</Link></li>
              <li><Link href="/marketplace" className="transition-colors hover:text-white">Secure Escrow</Link></li>
              <li><Link href="/donate" className="transition-colors hover:text-white">Donations</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-xs font-bold uppercase tracking-wider text-white">
              Company
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li><Link href="/about" className="transition-colors hover:text-white">About Us</Link></li>
              <li><Link href="/how-it-works" className="transition-colors hover:text-white">How It Works</Link></li>
              <li><Link href="/pricing" className="transition-colors hover:text-white">Pricing</Link></li>
              <li><Link href="/register" className="transition-colors hover:text-white">Get Started</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-xs font-bold uppercase tracking-wider text-white">
              Resources
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li><Link href="/how-it-works" className="transition-colors hover:text-white">FAQ</Link></li>
              <li><Link href="/donate" className="transition-colors hover:text-white">Support a Cause</Link></li>
              <li><a href="mailto:hello@arosco.app" className="transition-colors hover:text-white">Contact Sales</a></li>
            </ul>
          </div>

          <div className="col-span-2 flex flex-col gap-4 md:col-span-1">
            <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-white">
              Trust &amp; Security
            </h4>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Shield className="h-4 w-4 text-brand-sage" />
              <span>Escrow-protected funds</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Award className="h-4 w-4 text-brand-accent" />
              <span>KYC &amp; BVN verified</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-4 border-t border-brand-dark/80 pt-6 text-xs text-gray-500 sm:flex-row sm:justify-between">
          <span>&copy; {year} GFW. Built for communal prosperity.</span>
          <div className="flex items-center gap-4">
            <a href="#" aria-label="Website" className="transition-colors hover:text-white"><Globe className="h-4 w-4" /></a>
            <a href="#" aria-label="Community" className="transition-colors hover:text-white"><MessageCircle className="h-4 w-4" /></a>
            <a href="mailto:hello@arosco.app" aria-label="Email" className="transition-colors hover:text-white"><Mail className="h-4 w-4" /></a>
            <a href="mailto:hello@arosco.app" aria-label="Send" className="transition-colors hover:text-white"><Send className="h-4 w-4" /></a>
          </div>
          <div className="flex items-center gap-1.5">
            <span>Crafted with</span>
            <Heart className="h-3 w-3 fill-brand-accent text-brand-accent" />
            <span>for communities.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
