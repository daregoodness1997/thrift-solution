import React from 'react';
import { motion } from 'motion/react';
import { Leaf, ArrowRight, Sparkles } from 'lucide-react';
import { ImpactMetrics } from '../types';

interface HeroSectionProps {
  metrics: ImpactMetrics;
  onShopClick: () => void;
  onLearnMoreClick: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  metrics,
  onShopClick,
  onLearnMoreClick
}) => {
  return (
    <div className="grid grid-cols-12 gap-6 mb-8 shrink-0">
      {/* Main Campaign Panel */}
      <div className="col-span-12 lg:col-span-8 bg-[#F5F7F5] rounded-3xl p-6 md:p-8 flex flex-col justify-center relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#E9EFE9] rounded-full blur-3xl opacity-60 group-hover:opacity-80 transition-opacity duration-700 pointer-events-none"></div>
        
        <div className="flex items-center gap-1.5 mb-2.5">
          <Leaf className="w-3.5 h-3.5 text-[#4A5D4E]" />
          <span className="text-[#4A5D4E] uppercase tracking-widest text-[10px] font-bold">
            Sustainable Giving
          </span>
        </div>

        <h1 className="text-2xl md:text-4xl font-light leading-tight mb-4 text-[#1A1A1A] tracking-tight">
          Give your items a <span className="italic font-serif text-[#4A5D4E] font-medium">second life</span>.<br />
          Shop curated vintage essentials.
        </h1>
        
        <p className="text-[#666] text-xs md:text-sm max-w-md mb-6 leading-relaxed">
          A community-driven thrift marketplace where every donation supports local green initiatives, funds neighborhood programs, and reduces waste.
        </p>
        
        <div className="flex flex-wrap gap-3 mt-auto">
          <button
            onClick={onShopClick}
            className="bg-white border border-[#4A5D4E] text-[#4A5D4E] px-5 py-2.5 rounded-xl text-xs md:text-sm font-semibold hover:bg-[#4A5D4E] hover:text-white transition-all duration-300 shadow-sm cursor-pointer active:scale-[0.98]"
            id="btn-hero-shop"
          >
            Shop Marketplace
          </button>
          <button
            onClick={onLearnMoreClick}
            className="bg-transparent text-[#4A5D4E] px-5 py-2.5 rounded-xl text-xs md:text-sm font-semibold underline underline-offset-4 hover:text-[#2D2D2D] transition-colors cursor-pointer"
            id="btn-hero-learn"
          >
            Our Circular Impact
          </button>
        </div>
      </div>

      {/* Real-time Metrics Panel */}
      <div className="col-span-12 lg:col-span-4 bg-[#4A5D4E] rounded-3xl p-6 md:p-8 text-white flex flex-col justify-between shadow-md relative overflow-hidden">
        {/* Soft background design elements */}
        <div className="absolute -bottom-12 -right-12 w-36 h-36 border border-white/10 rounded-full"></div>
        <div className="absolute -top-6 -left-6 w-24 h-24 bg-white/5 rounded-full blur-xl"></div>
        
        <div className="relative z-10">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg md:text-xl font-medium tracking-tight mb-1">Weekly Impact</h3>
              <p className="text-white/70 text-xs font-light">Real-time metrics from our circular system.</p>
            </div>
            <div className="bg-white/10 p-1.5 rounded-lg">
              <Sparkles className="w-4 h-4 text-white/90" />
            </div>
          </div>
        </div>

        <div className="space-y-4 mt-8 lg:mt-0 relative z-10">
          <div className="flex justify-between items-end border-b border-white/20 pb-2.5">
            <span className="text-xs text-white/70">Items Circularized</span>
            <div className="flex flex-col items-end">
              <motion.span 
                key={metrics.itemsDonated}
                initial={{ y: -5, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-xl md:text-2xl font-mono tracking-tight"
                id="metric-items-donated"
              >
                {metrics.itemsDonated.toLocaleString()}
              </motion.span>
            </div>
          </div>
          
          <div className="flex justify-between items-end border-b border-white/20 pb-2.5">
            <span className="text-xs text-white/70">CO₂ Restored (kg)</span>
            <div className="flex flex-col items-end">
              <motion.span 
                key={metrics.co2Saved}
                initial={{ y: -5, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-xl md:text-2xl font-mono tracking-tight"
                id="metric-co2-saved"
              >
                {metrics.co2Saved.toLocaleString()}
              </motion.span>
            </div>
          </div>

          <div className="flex justify-between items-end">
            <span className="text-xs text-white/70 font-sans">Funds Raised</span>
            <div className="flex flex-col items-end">
              <motion.span 
                key={metrics.fundsRaised}
                initial={{ y: -5, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-xl md:text-2xl font-mono italic tracking-tight text-white"
                id="metric-funds-raised"
              >
                ${metrics.fundsRaised.toLocaleString()}
              </motion.span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
