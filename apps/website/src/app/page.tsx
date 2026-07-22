import { Hero } from "@/components/sections/Hero";
import { Logos } from "@/components/sections/Logos";
import { Features } from "@/components/sections/Features";
import { Analytics } from "@/components/sections/Analytics";
import { Gallery } from "@/components/sections/Gallery";
import { ImpactSpotlightSection } from "@/components/sections/ImpactSpotlight";
import { BentoSocialProof } from "@/components/sections/BentoSocialProof";
import { Team } from "@/components/sections/Team";
import { Faq } from "@/components/sections/Faq";
import { Contact } from "@/components/sections/Contact";
import { PrayerNetworkSection } from "@/components/sections/PrayerNetwork";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "GFW — Community Savings & Collective Prosperity",
  description: "Join trusted Ajo savings circles. Secure escrow, transparent tracking, and automated payouts for communal thrift savings in Nigeria.",
  openGraph: {
    title: "GFW — Community Savings & Collective Prosperity",
    description: "Join trusted Ajo savings circles. Secure escrow, transparent tracking, and automated payouts.",
  },
};

export default function Home() {
  return (
    <main className="min-h-screen bg-brand-cream">
      <Hero />
      <Logos />
      <Features />
      <Analytics />
      <Gallery />
      <ImpactSpotlightSection />
      <BentoSocialProof />
      <PrayerNetworkSection />
      <Team />
      <Faq />
      <Contact />
    </main>
  );
}
