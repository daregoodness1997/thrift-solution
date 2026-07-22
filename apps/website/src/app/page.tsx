"use client";

import { HeroSection } from "@/components/sections/HeroSection";
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
import { FinalCTASection } from "@/components/sections/FinalCTASection";

export default function Home() {
  const handleOpenImpactModal = () => {
    window.location.href = "/donate";
  };

  return (
    <main className="min-h-screen bg-brand-cream">
      <HeroSection
        theme="light"
        onOpenImpactModal={handleOpenImpactModal}
      />
      <Logos />
      <Features />
      <Analytics />
      <Gallery />
      <ImpactSpotlightSection />
      <BentoSocialProof />
      <PrayerNetworkSection />
      <Team />
      <Faq />
      <FinalCTASection />
    </main>
  );
}
