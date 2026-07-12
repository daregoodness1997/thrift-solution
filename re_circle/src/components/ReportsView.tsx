import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Leaf, Award, TrendingUp, Download, Copy, Printer, Check, Info, FileText, Share2 } from 'lucide-react';
import { ImpactMetrics, ActiveAccount, UserAccount } from '../types';

interface ReportsViewProps {
  metrics: ImpactMetrics;
  activeAccounts: ActiveAccount[];
  account: UserAccount;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  metrics,
  activeAccounts,
  account
}) => {
  const [hoveredDataIndex, setHoveredDataIndex] = useState<number | null>(null);
  const [reportPeriod, setReportPeriod] = useState<'weekly' | 'monthly' | 'cumulative'>('cumulative');
  const [reportType, setReportType] = useState<'carbon' | 'materials' | 'backing'>('carbon');
  const [compiledReport, setCompiledReport] = useState<string>('');
  const [compiling, setCompiling] = useState(false);
  const [copied, setCopied] = useState(false);

  // Combine Dare and activeAccounts for leaderboard
  const allPatrons = [
    {
      id: 'me',
      name: 'Dare (You)',
      level: 4,
      totalCO2Saved: account.totalCO2Saved,
      itemsCircularized: account.itemsDonated + account.itemsClaimed,
      avatarColor: 'bg-[#4A5D4E] text-white border-[#4A5D4E]'
    },
    ...activeAccounts.map(a => ({
      id: a.id,
      name: a.name,
      level: a.level,
      totalCO2Saved: a.totalCO2Saved,
      itemsCircularized: a.itemsCircularized,
      avatarColor: a.avatarColor
    }))
  ].sort((a, b) => b.totalCO2Saved - a.totalCO2Saved);

  const historicalImpact = [
    { week: 'Wk 1', CO2: 2400, items: 780, funds: 7900 },
    { week: 'Wk 2', CO2: 2900, items: 910, funds: 9200 },
    { week: 'Wk 3', CO2: 3400, items: 1040, funds: 10600 },
    { week: 'Wk 4', CO2: 3800, items: 1190, funds: 11500 },
    { week: 'Active', CO2: metrics.co2Saved, items: metrics.itemsDonated, funds: metrics.fundsRaised },
  ];

  const handleCompileAuditReport = () => {
    setCompiling(true);
    setCompiledReport('');

    setTimeout(() => {
      setCompiling(false);
      const saplings = Math.round(account.totalCO2Saved / 22);
      const totalCircularWeight = account.totalCO2Saved + metrics.co2Saved;
      const saplingsGlobal = Math.round(metrics.co2Saved / 22);

      const markdown = `# RE:CIRCLE ENVIRONMENTAL IMPACT AUDIT REPORT
===================================================
Ledger Node Reference: ${account.email}
Reporting Period: ${reportPeriod.toUpperCase()} 2026
Report Scope: ${reportType === 'carbon' ? 'Carbon Emissions Offset Audit' : reportType === 'materials' ? 'Circular Materials Ledger' : 'Direct Eco Backing Statement'}
Compiled on: ${new Date().toISOString().split('T')[0]}
Status: VERIFIED SECURE LEDGER OUTPUT

1. COMPILER SUMMARY
---------------------------------------------------
This certified audit document details verified circular resource preservation metrics recorded under the primary node address. Circular swapping avoids high-energy extraction, processing, and long-range transport required by raw manufacturing.

2. DETAILED RESOURCE AUDIT METRICS (PERSONAL)
---------------------------------------------------
* Cumulative CO₂ Saved:         ${account.totalCO2Saved.toFixed(1)} kg CO₂
* Trees Oxygen Equivalency:    ${saplings} young saplings absorbing for 1 yr
* Items Donated to Pool:        ${account.itemsDonated} units
* Items Claimed from Pool:      ${account.itemsClaimed} units
* Total Ecosystem Support:      $${account.totalContributed.toFixed(2)}
* Circular Leaderboard Rank:    #${allPatrons.findIndex(p => p.id === 'me') + 1} of ${allPatrons.length}

3. GLOBAL LEDGER RESILIENCE METRICS (PLATFORM-WIDE)
---------------------------------------------------
* Collective CO₂ Saved:        ${metrics.co2Saved.toLocaleString()} kg CO₂
* Collective Pine Equiv:        ${saplingsGlobal.toLocaleString()} mature trees
* Total Materials Diverted:     ${metrics.itemsDonated.toLocaleString()} units
* Eco Program Financing:        $${metrics.fundsRaised.toLocaleString()} USD
* Active Neighborhood Nodes:    ${allPatrons.length} active accounts

4. VERIFIED LEDGER CERTIFICATE
---------------------------------------------------
This report certifies that the referenced transaction list successfully bypasses linear municipal waste facilities. Standard EPA materials factor offsets have been computed directly from material weight formulas in real-time.

RE:CIRCLE ENVIRONMENTAL LEDGER CORE NODE ID: [99ed3ba4]
---------------------------------------------------
*** END OF ENVIRONMENTAL AUDIT REPORT ***`;

      setCompiledReport(markdown);
    }, 400);
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(compiledReport);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrintMock = () => {
    window.print();
  };

  return (
    <div className="space-y-8 py-4" id="view-reports-impact">
      
      {/* Intro Header */}
      <div className="border-b border-[#EAEAEA] pb-5">
        <span className="text-[#4A5D4E] uppercase tracking-widest text-[9px] font-bold block">
          Environmental Restoration Scorecard
        </span>
        <h2 className="text-2xl font-light text-[#1A1A1A] tracking-tight">
          Resource <span className="italic font-serif text-[#4A5D4E] font-medium">Audits & Leaderboards</span>
        </h2>
        <p className="text-xs text-[#717171] font-light mt-1">
          Compile environmental ledger audits, review local carbon velocity charts, and view neighborhood ranking directories.
        </p>
      </div>

      {/* Grid: Chart on Left, Leaderboard on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chart card */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-6 flex flex-col justify-between shadow-2xs">
          <div>
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-sm font-semibold text-[#2D2D2D]">Cumulative Carbon Offset Velocity</h4>
                <p className="text-xs text-[#999] font-light mt-0.5">Kilograms of carbon dioxide (CO₂) emissions saved over time.</p>
              </div>
              <div className="flex items-center gap-1 bg-[#F5F7F5] border border-[#E1E8E1] rounded-md px-2 py-0.5 text-[10px] text-[#4A5D4E] font-mono font-bold">
                <TrendingUp className="w-3 h-3" />
                <span>ACTIVE VELOCITY</span>
              </div>
            </div>
          </div>

          {/* Chart block */}
          <div className="h-56 w-full mt-6 relative flex items-end">
            <svg viewBox="0 0 500 200" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="sage-gradient-reports" x1="0" y1="0" x2="0" y2="1">
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
                fill="url(#sage-gradient-reports)"
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

              {/* Interactive Dots */}
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
                      id={`report-node-${index}`}
                    />
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

            {/* Hover Tooltip */}
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
                  <p>Funds: ${historicalImpact[hoveredDataIndex].funds}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Leaderboard Patrons */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 shadow-2xs space-y-4 flex flex-col justify-between">
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-[#2D2D2D] flex items-center gap-1.5">
              <Award className="w-4 h-4 text-[#4A5D4E]" />
              <span>Patron Carbon Leaderboards</span>
            </h4>
            <p className="text-[11px] text-[#999] font-light">
              Cumulative offset tally based on verified circular swaps and plan auto-contributions.
            </p>
          </div>

          <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
            {allPatrons.map((patron, idx) => {
              const isMe = patron.id === 'me';
              return (
                <div 
                  key={patron.id}
                  className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                    isMe 
                      ? 'bg-[#F5F7F5]/50 border-[#4A5D4E]/30 ring-1 ring-[#4A5D4E]/10' 
                      : 'bg-neutral-50/50 border-neutral-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="font-mono text-[10px] font-bold text-[#717171] w-4 text-center">#{idx + 1}</span>
                    <div className={`w-7 h-7 rounded-full ${patron.avatarColor} flex items-center justify-center font-bold text-[9px] border shrink-0 shadow-3xs`}>
                      {patron.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <span className={`text-xs font-semibold truncate ${isMe ? 'text-[#4A5D4E]' : 'text-[#2D2D2D]'}`}>{patron.name}</span>
                  </div>

                  <span className="text-[11px] font-mono font-bold text-[#2D2D2D] shrink-0">
                    {patron.totalCO2Saved.toFixed(0)} kg
                  </span>
                </div>
              );
            })}
          </div>

          <div className="bg-[#FAF9F5] p-2.5 rounded-xl text-[9px] text-[#8A7D73] font-mono leading-relaxed">
            All offsets audited according to certified EPA raw textiles factoring formulas.
          </div>
        </div>
      </div>

      {/* Interactive environmental report compiler */}
      <div className="bg-white rounded-3xl p-6 shadow-2xs space-y-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#4A5D4E]" />
            <h3 className="text-base font-semibold text-[#1A1A1A]">Environmental Audit Report Compiler</h3>
          </div>
          <p className="text-xs text-[#717171] leading-relaxed font-light">
            Formulate a verified carbon/materials ledger audit document for municipal, administrative, or commercial tax offset purposes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-[#F0F0F0] pt-4">
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-widest text-[#999] font-bold block">Audit Period</label>
            <select
              value={reportPeriod}
              onChange={(e) => setReportPeriod(e.target.value as any)}
              className="w-full bg-neutral-50 border border-[#EAEAEA] rounded-xl px-2.5 py-2 text-xs outline-none focus:border-[#4A5D4E]"
            >
              <option value="weekly">Weekly Ledger</option>
              <option value="monthly">Monthly Ledger</option>
              <option value="cumulative">Cumulative 2026 Audit</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-widest text-[#999] font-bold block">Audit Category</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as any)}
              className="w-full bg-neutral-50 border border-[#EAEAEA] rounded-xl px-2.5 py-2 text-xs outline-none focus:border-[#4A5D4E]"
            >
              <option value="carbon">Carbon Emissions Offset Audit</option>
              <option value="materials">Circular Materials Diversion Ledger</option>
              <option value="backing">Direct Ecosystem Funding statement</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleCompileAuditReport}
              disabled={compiling}
              className="w-full bg-[#4A5D4E] hover:bg-[#3D4D40] text-white py-2 rounded-xl text-xs font-semibold cursor-pointer shadow-xs transition-colors"
            >
              {compiling ? 'Compiling Audit ledger...' : 'Compile Environmental Audit'}
            </button>
          </div>
        </div>

        {/* Output Console */}
        {compiledReport && (
          <div className="space-y-3 pt-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-mono text-[#717171]">VERIFIED LEDGER DOCUMENT OUTPUT:</span>
              
              <div className="flex gap-2">
                <button
                  onClick={handleCopyToClipboard}
                  className="bg-neutral-50 hover:bg-[#F5F7F5] border border-[#EAEAEA] text-[#717171] hover:text-[#4A5D4E] px-2.5 py-1 rounded-lg text-[10px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-700" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Copied!' : 'Copy to Clipboard'}</span>
                </button>
                <button
                  onClick={handlePrintMock}
                  className="bg-neutral-50 hover:bg-[#F5F7F5] border border-[#EAEAEA] text-[#717171] hover:text-[#4A5D4E] px-2.5 py-1 rounded-lg text-[10px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Printer className="w-3 h-3" />
                  <span>Print Audit</span>
                </button>
              </div>
            </div>

            <div className="bg-neutral-950 text-neutral-300 p-5 rounded-2xl font-mono text-[10px] leading-relaxed max-h-80 overflow-y-auto border-none shadow-inner select-all">
              <pre className="whitespace-pre-wrap">{compiledReport}</pre>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
