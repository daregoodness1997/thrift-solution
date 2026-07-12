import React, { useState } from 'react';
import { Leaf, RefreshCw, Sparkles, TrendingUp, ShieldCheck, Heart } from 'lucide-react';
import { ImpactMetrics } from '../types';

interface SecondaryViewsProps {
  activeTab: 'how-it-works' | 'impact';
  metrics: ImpactMetrics;
  onDonateClick: () => void;
}

export const SecondaryViews: React.FC<SecondaryViewsProps> = ({
  activeTab,
  metrics,
  onDonateClick
}) => {
  const [hoveredDataIndex, setHoveredDataIndex] = useState<number | null>(null);

  // Mock historical data for our circular charts
  const historicalImpact = [
    { week: 'Wk 1', CO2: 2400, items: 780, funds: 7900 },
    { week: 'Wk 2', CO2: 2900, items: 910, funds: 9200 },
    { week: 'Wk 3', CO2: 3400, items: 1040, funds: 10600 },
    { week: 'Wk 4', CO2: 3800, items: 1190, funds: 11500 },
    { week: 'Active', CO2: metrics.co2Saved, items: metrics.itemsDonated, funds: metrics.fundsRaised },
  ];

  if (activeTab === 'how-it-works') {
    return (
      <div className="flex-1 overflow-y-auto space-y-12 py-4" id="view-how-it-works">
        {/* Intro */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-[#4A5D4E] uppercase tracking-widest text-[10px] font-bold block">
            The Circular Economy Loop
          </span>
          <h2 className="text-3xl md:text-4xl font-light text-[#1A1A1A] tracking-tight">
            How <span className="italic font-serif text-[#4A5D4E] font-medium">RE:CIRCLE</span> works.
          </h2>
          <p className="text-[#717171] text-xs md:text-sm font-light leading-relaxed">
            We exist to dismantle the linear "take-make-waste" textile chain, replacing it with an elegant, neighborhood-scale loop of mindful reuse.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {/* Step 1 */}
          <div className="bg-white rounded-3xl p-6 relative overflow-hidden group transition-all">
            <span className="text-6xl font-serif italic text-[#4A5D4E]/10 absolute -top-2 right-4 select-none">
              01
            </span>
            <div className="w-10 h-10 bg-[#F5F7F5] text-[#4A5D4E] rounded-2xl flex items-center justify-center mb-6 shadow-xs">
              <Leaf className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-medium text-[#1A1A1A] mb-2">Donate Mindfully</h3>
            <p className="text-[#717171] text-xs leading-relaxed font-light">
              Submit your vintage treasures, high-quality garments, or modern home goods. Our system computes the carbon and resource savings immediately.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-white rounded-3xl p-6 relative overflow-hidden group transition-all">
            <span className="text-6xl font-serif italic text-[#4A5D4E]/10 absolute -top-2 right-4 select-none">
              02
            </span>
            <div className="w-10 h-10 bg-[#F5F7F5] text-[#4A5D4E] rounded-2xl flex items-center justify-center mb-6 shadow-xs">
              <RefreshCw className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-medium text-[#1A1A1A] mb-2">Curation & Display</h3>
            <p className="text-[#717171] text-xs leading-relaxed font-light">
              We catalog items with original provenance information, listing sizes, conditions, and materials. Clean Minimal presentation guides active discovery.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-white rounded-3xl p-6 relative overflow-hidden group transition-all">
            <span className="text-6xl font-serif italic text-[#4A5D4E]/10 absolute -top-2 right-4 select-none">
              03
            </span>
            <div className="w-10 h-10 bg-[#F5F7F5] text-[#4A5D4E] rounded-2xl flex items-center justify-center mb-6 shadow-xs">
              <Heart className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-medium text-[#1A1A1A] mb-2">Rehome & Fund</h3>
            <p className="text-[#717171] text-xs leading-relaxed font-light">
              Neighbors adopt circular listings. 100% of standard contributions fund community greening programs, local composting nodes, and circular arts workshops.
            </p>
          </div>
        </div>

        {/* Highlight Quote banner */}
        <div className="bg-[#F5F7F5] rounded-3xl p-8 max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-lg">
            <h4 className="text-lg font-medium text-[#1A1A1A]">Ready to circulate a vintage treasure?</h4>
            <p className="text-[#666] text-xs font-light">
              It takes less than 2 minutes to catalog an item. You will immediately see how many kilograms of carbon emissions your single act preserves.
            </p>
          </div>
          <button
            onClick={onDonateClick}
            className="bg-[#4A5D4E] text-white text-xs font-semibold px-6 py-3 rounded-full hover:bg-[#3D4D40] active:scale-[0.98] transition-all cursor-pointer shadow-sm shrink-0"
            id="btn-howitworks-donate"
          >
            Start Your First Donation
          </button>
        </div>
      </div>
    );
  }

  // OUR IMPACT TAB
  return (
    <div className="flex-1 overflow-y-auto space-y-12 py-4" id="view-our-impact">
      {/* Intro */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <span className="text-[#4A5D4E] uppercase tracking-widest text-[10px] font-bold block">
          Environmental Restoration Scorecard
        </span>
        <h2 className="text-3xl md:text-4xl font-light text-[#1A1A1A] tracking-tight">
          Tracking our <span className="italic font-serif text-[#4A5D4E] font-medium">cumulative weight</span>.
        </h2>
        <p className="text-[#717171] text-xs md:text-sm font-light leading-relaxed">
          Through deliberate community-led redistribution, we bypass traditional high-emissions manufacturing and redirect materials directly to neighbor closets.
        </p>
      </div>

      {/* Bento Grid Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-5xl mx-auto">
        {/* Interactive SVG Chart Card */}
        <div className="col-span-12 lg:col-span-8 bg-white rounded-3xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-sm font-medium text-[#1A1A1A]">Cumulative Carbon Offset Velocity</h4>
                <p className="text-xs text-[#999] font-light mt-0.5">Kilograms of carbon dioxide (CO₂) emissions saved over time.</p>
              </div>
              <div className="flex items-center gap-1 bg-[#F5F7F5] border border-[#E1E8E1] rounded-md px-2 py-0.5 text-[10px] text-[#4A5D4E] font-mono">
                <TrendingUp className="w-3 h-3" />
                <span>ACTIVE TREND</span>
              </div>
            </div>
          </div>

          {/* Interactive Custom SVG Chart */}
          <div className="h-52 w-full mt-6 relative flex items-end">
            <svg viewBox="0 0 500 200" className="w-full h-full overflow-visible">
              <defs>
                {/* Sage color area gradient */}
                <linearGradient id="sage-gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4A5D4E" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#4A5D4E" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="0" y1="180" x2="500" y2="180" stroke="#F0F0F0" strokeWidth="1" />
              <line x1="0" y1="130" x2="500" y2="130" stroke="#F0F0F0" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="0" y1="80" x2="500" y2="80" stroke="#F0F0F0" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="0" y1="30" x2="500" y2="30" stroke="#F0F0F0" strokeWidth="1" strokeDasharray="4 4" />

              {/* Chart Area */}
              <path
                d={`M 10,180 
                    L 10,${180 - (historicalImpact[0].CO2 / 5000) * 150} 
                    L 120,${180 - (historicalImpact[1].CO2 / 5000) * 150} 
                    L 240,${180 - (historicalImpact[2].CO2 / 5000) * 150} 
                    L 360,${180 - (historicalImpact[3].CO2 / 5000) * 150} 
                    L 480,${180 - (historicalImpact[4].CO2 / 5000) * 150} 
                    L 480,180 Z`}
                fill="url(#sage-gradient)"
              />

              {/* Chart Line */}
              <path
                d={`M 10,${180 - (historicalImpact[0].CO2 / 5000) * 150} 
                    L 120,${180 - (historicalImpact[1].CO2 / 5000) * 150} 
                    L 240,${180 - (historicalImpact[2].CO2 / 5000) * 150} 
                    L 360,${180 - (historicalImpact[3].CO2 / 5000) * 150} 
                    L 480,${180 - (historicalImpact[4].CO2 / 5000) * 150}`}
                fill="none"
                stroke="#4A5D4E"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Interactive Circles / Dots */}
              {historicalImpact.map((d, index) => {
                const x = 10 + index * 117.5;
                const y = 180 - (d.CO2 / 5000) * 150;
                const isHovered = hoveredDataIndex === index;

                return (
                  <g key={d.week}>
                    <circle
                      cx={x}
                      cy={y}
                      r={isHovered ? 6 : 4}
                      fill={isHovered ? '#4A5D4E' : 'white'}
                      stroke="#4A5D4E"
                      strokeWidth={isHovered ? 2.5 : 2}
                      className="transition-all duration-150 cursor-pointer"
                      onMouseEnter={() => setHoveredDataIndex(index)}
                      onMouseLeave={() => setHoveredDataIndex(null)}
                      id={`chart-node-${index}`}
                    />
                    {/* Tick label */}
                    <text
                      x={x}
                      y="195"
                      textAnchor="middle"
                      fill="#999"
                      fontSize="9"
                      className="font-mono font-medium uppercase"
                    >
                      {d.week}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Dynamic floating tooltip inside the chart */}
            {hoveredDataIndex !== null && (
              <div 
                className="absolute bg-white/95 backdrop-blur-xs border border-[#EAEAEA] shadow-lg rounded-xl p-3 text-[10px] pointer-events-none transition-all duration-150"
                style={{
                  left: `${hoveredDataIndex * 22}%`,
                  bottom: `${(historicalImpact[hoveredDataIndex].CO2 / 5000) * 100 + 10}%`,
                  transform: 'translateX(-10px)'
                }}
              >
                <p className="font-semibold text-[#1A1A1A] font-serif italic">{historicalImpact[hoveredDataIndex].week}</p>
                <div className="space-y-0.5 mt-1 text-[#717171] font-mono">
                  <p>CO₂: <strong className="text-[#4A5D4E]">{historicalImpact[hoveredDataIndex].CO2} kg</strong></p>
                  <p>Items: {historicalImpact[hoveredDataIndex].items}</p>
                  <p>Proceeds: ${historicalImpact[hoveredDataIndex].funds}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Carbon equivalence facts */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          {/* Fact 1 */}
          <div className="bg-[#F5F7F5] rounded-3xl p-6 flex flex-col justify-between h-1/2">
            <div>
              <div className="w-8 h-8 rounded-full bg-white text-[#4A5D4E] flex items-center justify-center shadow-xs mb-3">
                <Leaf className="w-4.5 h-4.5" />
              </div>
              <h4 className="text-sm font-semibold text-[#4A5D4E] uppercase tracking-wider font-mono">Tree Equivalent</h4>
              <p className="text-xs text-[#717171] font-light leading-relaxed mt-1">
                Your community savings of <strong className="font-semibold text-[#1A1A1A]">{metrics.co2Saved} kg of CO₂</strong> equates to the carbon offset by approximately <strong className="font-semibold text-[#1A1A1A]">{Math.round(metrics.co2Saved / 22)} mature pine trees</strong> absorbing emissions for a full year.
              </p>
            </div>
            <span className="text-[9px] text-[#999] uppercase tracking-widest font-mono mt-4">EPA Equivalency Index</span>
          </div>

          {/* Fact 2 */}
          <div className="bg-white rounded-3xl p-6 flex flex-col justify-between h-[calc(50%-12px)]">
            <div>
              <div className="w-8 h-8 rounded-full bg-neutral-50 text-amber-700 flex items-center justify-center shadow-xs mb-3">
                <ShieldCheck className="w-4.5 h-4.5" />
              </div>
              <h4 className="text-sm font-semibold text-neutral-800 uppercase tracking-wider font-mono">100% Transparency</h4>
              <p className="text-xs text-[#717171] font-light leading-relaxed mt-1">
                All listed prices represent contributions. Every penny goes directly to funding regional composting networks and public park greening programs.
              </p>
            </div>
            <span className="text-[9px] text-[#999] uppercase tracking-widest font-mono mt-4">Certified Social Ledger</span>
          </div>
        </div>
      </div>
    </div>
  );
};
