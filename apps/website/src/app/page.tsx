import { Hero } from "@/components/sections/Hero";
import { Logos } from "@/components/sections/Logos";
import { Features } from "@/components/sections/Features";
import { Analytics } from "@/components/sections/Analytics";
import { DeveloperFocus } from "@/components/sections/DeveloperFocus";
import { Gallery } from "@/components/sections/Gallery";
import { BentoSocialProof } from "@/components/sections/BentoSocialProof";
import { Team } from "@/components/sections/Team";
import { Faq } from "@/components/sections/Faq";
import { Contact } from "@/components/sections/Contact";

export default function Home() {
  return (
    <main className="min-h-screen bg-brand-cream">
      <Hero />
      <Logos />
      <Features />
      <Analytics />
      <DeveloperFocus />
      <Gallery />
      <BentoSocialProof />
      <Team />
      <Faq />
      <Contact />
    </main>
  );
}
