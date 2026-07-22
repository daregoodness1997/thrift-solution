import { useState } from "react";
import Header from "./components/Header";
import Hero from "./components/Hero";
import Logos from "./components/Logos";
import InteractiveShowcase from "./components/InteractiveShowcase";
import CoreFeatures from "./components/CoreFeatures";
import AnalyticsSection from "./components/AnalyticsSection";
import DeveloperFocus from "./components/DeveloperFocus";
import GallerySection from "./components/GallerySection";
import FaqSection from "./components/FaqSection";
import ContactSection from "./components/ContactSection";
import Footer from "./components/Footer";
import WaveAssistant from "./components/WaveAssistant";

export default function App() {
  const [highlightPulse, setHighlightPulse] = useState(false);

  // Smooth scroll handler
  const handleScrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      
      // If scrolling to checkout simulator, trigger a temporary visual highlight pulse
      if (sectionId === "payments-simulator") {
        setHighlightPulse(true);
        setTimeout(() => setHighlightPulse(false), 2000);
      }
    }
  };

  const handleOpenDemoGate = () => {
    handleScrollToSection("payments-simulator");
  };

  return (
    <div className="relative min-h-screen bg-[#FAF9F6] dark:bg-slate-950 text-brand-dark dark:text-slate-100 overflow-x-hidden antialiased">
      {/* Decorative Global Background Gradient Ring */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#FF9800]/5 rounded-full blur-[120px] pointer-events-none -z-10"></div>
      
      {/* Core Layout Header */}
      <Header 
        onScrollToSection={handleScrollToSection} 
        openDemo={handleOpenDemoGate} 
      />

      {/* Main Content Sections */}
      <main className="w-full">
        {/* Hero Landing banner */}
        <Hero 
          onScrollToSection={handleScrollToSection} 
          openDemo={handleOpenDemoGate} 
        />
        
        {/* Brand marquee */}
        <Logos />
        
        {/* Core Value Proposition & Calculator */}
        <CoreFeatures />
        
        {/* Telemetry analytics and performance dashboard */}
        <AnalyticsSection />
        
        {/* Interactive Payment Checkout Sandbox */}
        <div className={highlightPulse ? "ring-4 ring-brand-accent/30 rounded-[40px] transition-all duration-700" : "transition-all duration-700"}>
          <InteractiveShowcase />
        </div>
        
        {/* Developer code editor and API sandbox */}
        <DeveloperFocus />

        {/* Gallery section demonstrating global presence and merchant success */}
        <GallerySection />
        
        {/* Question and Accordions */}
        <FaqSection />
        
        {/* Sales Inquiry and Enterprise Contact */}
        <ContactSection />
      </main>

      {/* Persistent floating AI consultation desk */}
      <WaveAssistant />

      {/* Complete Footer Section */}
      <Footer onScrollToSection={handleScrollToSection} />
    </div>
  );
}
