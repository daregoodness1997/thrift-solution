import { useState, MouseEvent } from "react";
import { MapPin, Calendar, ZoomIn, X, ChevronLeft, ChevronRight, Image as ImageIcon, Sparkles, Building, ArrowRight } from "lucide-react";

interface GalleryItem {
  id: number;
  title: string;
  category: "hubs" | "summits" | "merchants";
  categoryLabel: string;
  location: string;
  date: string;
  image: string;
  description: string;
  extendedStory: string;
}

const GALLERY_ITEMS: GalleryItem[] = [
  {
    id: 1,
    title: "San Francisco HQ",
    category: "hubs",
    categoryLabel: "Corporate Hubs",
    location: "San Francisco, CA",
    date: "July 2026",
    image: "https://images.unsplash.com/photo-1542744094-3a31f103e35f?auto=format&fit=crop&w=800&q=80",
    description: "Our North American headquarters coordinating regulatory partnerships and US-Africa trade lanes.",
    extendedStory: "Located in the heart of San Francisco's financial district, this office serves as our regulatory anchor in the United States. Here, our compliance experts, financial engineering teams, and sponsor bank coordinators collaborate daily to maintain secure, fully licensed, and compliant clearing channels that bridge North American capital with African digital markets."
  },
  {
    id: 2,
    title: "Lagos Operations Center",
    category: "hubs",
    categoryLabel: "Corporate Hubs",
    location: "Lagos, Nigeria",
    date: "May 2026",
    image: "https://images.unsplash.com/photo-1531538606174-0f90ff5dce83?auto=format&fit=crop&w=800&q=80",
    description: "The primary engine room for African real-time core settlement integrations.",
    extendedStory: "Our high-capacity hub in Lagos is home to our core infrastructure, regional developer advocacy, and rapid response merchant support squads. This team manages the high-volume API integrations with over 50 regional mobile money suppliers and direct banking clearing systems across West Africa, facilitating instantaneous multi-currency settlements."
  },
  {
    id: 3,
    title: "US-Africa Fintech Forum",
    category: "summits",
    categoryLabel: "Conferences & Summits",
    location: "New York City, NY",
    date: "April 2026",
    image: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=800&q=80",
    description: "Sponsoring dialogue on compliance and high-volume remittance rails.",
    extendedStory: "Flutterwave leaders stood alongside prominent US and African treasury officers to establish standard frameworks for fast, low-friction, B2B settlements. Our panels showcased how instant API-based clearing reduces the average cross-border transaction duration from five business days down to single-digit seconds, with full AML monitoring."
  },
  {
    id: 4,
    title: "Nairobi Innovation Lab",
    category: "hubs",
    categoryLabel: "Corporate Hubs",
    location: "Nairobi, Kenya",
    date: "June 2026",
    image: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80",
    description: "Fostering M-Pesa clearing integrations and mobile money innovation.",
    extendedStory: "Our East African center of excellence specializes in Mobile Money technology. Engineers here develop the real-time SDK layers that connect Shopify, WooCommerce, and global SaaS clients with M-Pesa. It stands as a beacon of fintech design, working in proximity to Silicon Savannah's outstanding technical minds."
  },
  {
    id: 5,
    title: "Money20/20 Showcase",
    category: "summits",
    categoryLabel: "Conferences & Summits",
    location: "Las Vegas, NV",
    date: "October 2025",
    image: "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=800&q=80",
    description: "Revealing the new transatlantic instant clearing API to US SaaS companies.",
    extendedStory: "At global fintech's premier stage, we debuted the Flutterwave US settlement gateway. We demonstrated to over 3,000 developers how a single RESTful payload could orchestrate automated USD-to-KES currency exchanges and disburse millions of dollars directly into rural micro-wallets in real-time, completely reshaping gig-economy payouts."
  },
  {
    id: 6,
    title: "Global SaaS Enterprise Success",
    category: "merchants",
    categoryLabel: "Merchant Success",
    location: "Austin, TX",
    date: "March 2026",
    image: "https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=800&q=80",
    description: "Processing subscriptions seamlessly across 15+ sub-Saharan markets.",
    extendedStory: "By integrating Flutterwave's checkout widget, this Austin-based AI and cloud storage enterprise successfully unlocked subscriptions in West and East Africa. Customers purchase in their localized currencies via bank app transfers or mobile wallets, while the corporate treasury enjoys automated, consolidated USD payouts weekly."
  },
  {
    id: 7,
    title: "African E-Commerce Pioneer",
    category: "merchants",
    categoryLabel: "Merchant Success",
    location: "Cape Town, South Africa",
    date: "January 2026",
    image: "https://images.unsplash.com/photo-1556742044-3c52d6e88c62?auto=format&fit=crop&w=800&q=80",
    description: "Accepting credit cards from US tourists and international patrons.",
    extendedStory: "A boutique luxury retailer based in South Africa utilizes Flutterwave's robust fraud shield to safely capture and process credit cards from international US buyers. Since integrating, their international order approval rate grew by 42% while chargebacks remained completely suppressed, protected by active 3D Secure 2.0 filtering."
  },
  {
    id: 8,
    title: "Creator Economy Settlement",
    category: "merchants",
    categoryLabel: "Merchant Success",
    location: "Atlanta, GA",
    date: "February 2026",
    image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80",
    description: "Enabling remote African creators to get paid instantly in USD/EUR.",
    extendedStory: "A global remote work and talent marketplace uses Flutterwave's bulk payout APIs to pay out thousands of digital designers, audio engineers, and developers across Kenya, Nigeria, and Rwanda. What used to take days of bank manual processing is now handled via a unified automated batch execution, resulting in immediate talent payouts."
  }
];

export default function GallerySection() {
  const [activeCategory, setActiveCategory] = useState<"all" | "hubs" | "summits" | "merchants">("all");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const filteredItems = activeCategory === "all"
    ? GALLERY_ITEMS
    : GALLERY_ITEMS.filter(item => item.category === activeCategory);

  const handleNext = (e?: MouseEvent) => {
    if (e) e.stopPropagation();
    if (lightboxIndex === null) return;
    const nextIdx = (lightboxIndex + 1) % filteredItems.length;
    setLightboxIndex(nextIdx);
  };

  const handlePrev = (e?: MouseEvent) => {
    if (e) e.stopPropagation();
    if (lightboxIndex === null) return;
    const prevIdx = (lightboxIndex - 1 + filteredItems.length) % filteredItems.length;
    setLightboxIndex(prevIdx);
  };

  const openLightbox = (id: number) => {
    const idxInFiltered = filteredItems.findIndex(item => item.id === id);
    if (idxInFiltered !== -1) {
      setLightboxIndex(idxInFiltered);
    }
  };

  const currentItem = lightboxIndex !== null ? filteredItems[lightboxIndex] : null;

  return (
    <section id="gallery-section" className="py-20 bg-white text-left scroll-mt-20">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 bg-orange-100/50 text-brand-accent px-3 py-1 rounded-full text-xs font-bold font-mono">
            <ImageIcon className="w-3.5 h-3.5" /> GLOBAL FOOTPRINT & STORIES
          </div>
          <h2 className="font-display font-extrabold text-3xl md:text-4xl text-brand-dark mt-4">
            Flutterwave in Action
          </h2>
          <p className="text-gray-500 text-sm sm:text-base mt-2">
            Explore our state-of-the-art office spaces, prominent transatlantic summit appearances, and the real merchants scaling globally with our checkout technology.
          </p>
        </div>

        {/* Tab Filters */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {[
            { id: "all", label: "All Moments" },
            { id: "hubs", label: "Corporate Hubs" },
            { id: "summits", label: "Fintech Events" },
            { id: "merchants", label: "Merchant Stories" }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveCategory(tab.id as any);
                setLightboxIndex(null);
              }}
              className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all ${
                activeCategory === tab.id
                  ? "bg-brand-dark text-white shadow-md shadow-brand-dark/10"
                  : "bg-gray-50 text-gray-500 hover:text-brand-dark hover:bg-gray-100/80 border border-gray-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredItems.map(item => (
            <div
              key={item.id}
              onClick={() => openLightbox(item.id)}
              className="group bg-[#FAF9F6] border border-gray-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:border-orange-200 transition-all duration-300 cursor-pointer flex flex-col justify-between"
            >
              {/* Image Container */}
              <div className="relative overflow-hidden aspect-[4/3] bg-gray-100">
                <img
                  src={item.image}
                  alt={item.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                  <span className="text-white text-xs font-bold font-mono flex items-center gap-1.5 bg-brand-accent/90 px-3 py-1.5 rounded-xl shadow-lg">
                    <ZoomIn className="w-3.5 h-3.5" /> View Story Detail
                  </span>
                </div>
                {/* Category Pill */}
                <span className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm text-brand-dark font-mono font-bold text-[9px] uppercase px-2.5 py-1 rounded-lg border border-gray-100 shadow-sm">
                  {item.categoryLabel}
                </span>
              </div>

              {/* Text Meta Container */}
              <div className="p-5 flex-grow flex flex-col justify-between">
                <div>
                  <h4 className="font-display font-extrabold text-sm sm:text-base text-brand-dark group-hover:text-brand-accent transition-colors">
                    {item.title}
                  </h4>
                  <p className="text-xs text-gray-500 line-clamp-2 mt-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="flex justify-between items-center pt-4 mt-4 border-t border-gray-100/60 text-[10px] text-gray-400 font-mono">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-brand-accent" /> {item.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {item.date}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Dynamic Lightbox Modal */}
        {lightboxIndex !== null && currentItem && (
          <div 
            className="fixed inset-0 bg-[#070913]/95 backdrop-blur-md z-50 flex items-center justify-center p-4 sm:p-6"
            onClick={() => setLightboxIndex(null)}
          >
            {/* Modal Container */}
            <div 
              className="bg-white rounded-3xl overflow-hidden w-full max-w-4xl shadow-2xl animate-scale-up text-left relative grid grid-cols-1 md:grid-cols-12 max-h-[90vh] md:max-h-none overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              
              {/* Close Button */}
              <button
                onClick={() => setLightboxIndex(null)}
                className="absolute top-4 right-4 z-20 bg-brand-dark/90 hover:bg-brand-accent text-white p-2 rounded-full transition-colors shadow-lg"
                title="Close overlay"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Left Column: Image with Overlays */}
              <div className="md:col-span-6 relative bg-black flex items-center min-h-[250px] md:min-h-[480px]">
                <img
                  src={currentItem.image}
                  alt={currentItem.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-6 text-white">
                  <span className="bg-brand-accent text-white font-mono font-bold text-[9px] uppercase px-2 py-0.5 rounded-md">
                    {currentItem.categoryLabel}
                  </span>
                  <h3 className="font-display font-extrabold text-lg sm:text-xl mt-2 flex items-center gap-1.5">
                    {currentItem.title}
                  </h3>
                </div>

                {/* Left/Right Slider Controls for desktop */}
                <button
                  onClick={handlePrev}
                  className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/45 text-white p-2 rounded-full backdrop-blur-sm transition-all"
                  title="Previous Story"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={handleNext}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/45 text-white p-2 rounded-full backdrop-blur-sm transition-all"
                  title="Next Story"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* Right Column: Detailed Narrative */}
              <div className="md:col-span-6 p-6 sm:p-8 flex flex-col justify-between bg-[#FAF9F6]">
                <div className="space-y-4">
                  
                  {/* Location and Date tags */}
                  <div className="flex flex-wrap gap-4 text-xs font-mono text-gray-500 pb-4 border-b border-gray-200">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-brand-accent" /> 
                      <strong>Location:</strong> {currentItem.location}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      <strong>Released:</strong> {currentItem.date}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <span className="text-[10px] font-bold text-brand-accent uppercase tracking-widest flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 animate-spin [animation-duration:4s]" /> Enterprise Case Study
                    </span>
                    <h4 className="font-display font-bold text-base text-brand-dark">
                      Transatlantic Clearings Impact
                    </h4>
                    <p className="text-xs sm:text-sm text-gray-600 leading-relaxed font-sans">
                      {currentItem.extendedStory}
                    </p>
                  </div>
                </div>

                {/* Bottom Call to action inside Lightbox */}
                <div className="pt-6 mt-6 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-left">
                    <span className="text-[9px] text-gray-400 font-bold block uppercase">TARGET DEPLOYMENT</span>
                    <span className="text-xs font-bold text-brand-dark flex items-center gap-1 mt-0.5">
                      <Building className="w-3.5 h-3.5 text-orange-500" /> Licensed Clearing
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setLightboxIndex(null);
                      const el = document.getElementById("contact-section");
                      if (el) el.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="bg-brand-dark hover:bg-brand-accent text-white font-bold text-xs px-5 py-2.5 rounded-full transition-colors flex items-center gap-1"
                  >
                    Discuss Expansion <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>

            </div>
          </div>
        )}

        {/* Bottom banner */}
        <div className="mt-16 bg-gradient-to-r from-brand-dark to-[#0E131F] rounded-[32px] p-8 text-white relative overflow-hidden border border-gray-800">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 bg-[radial-gradient(#F5A623_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>
          <div className="max-w-xl">
            <h4 className="font-display font-extrabold text-xl sm:text-2xl leading-snug">
              Powering businesses of all sizes, from Houston to Harare.
            </h4>
            <p className="text-gray-400 text-xs sm:text-sm mt-2 leading-relaxed">
              We process high-volume cards, regional bank triggers, and instant mobile commerce connections under a unified compliant network. Connect with us to elevate your operations.
            </p>
            <button
              onClick={() => {
                const el = document.getElementById("contact-section");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
              className="bg-brand-primary hover:bg-brand-primary/90 text-brand-dark font-bold text-xs px-6 py-3 rounded-full mt-6 transition-all shadow-md shadow-brand-primary/10"
            >
              Get Started Now
            </button>
          </div>
        </div>

      </div>
    </section>
  );
}
