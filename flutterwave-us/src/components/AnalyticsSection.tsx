import { useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from "recharts";
import { TrendingUp, Award, ShieldCheck, Zap, Activity, Users, Globe2, ArrowRight } from "lucide-react";

interface MonthlyData {
  month: string;
  volumeUSD: number; // Millions of USD
  successRate: number; // Percentage
  payoutSpeed: number; // Minutes
}

const MONTHLY_ANALYTICS_DATA: MonthlyData[] = [
  { month: "Feb 2026", volumeUSD: 410, successRate: 94.2, payoutSpeed: 15.4 },
  { month: "Mar 2026", volumeUSD: 520, successRate: 95.8, payoutSpeed: 12.1 },
  { month: "Apr 2026", volumeUSD: 640, successRate: 96.9, payoutSpeed: 8.5 },
  { month: "May 2026", volumeUSD: 710, successRate: 97.4, payoutSpeed: 4.2 },
  { month: "Jun 2026", volumeUSD: 820, successRate: 98.6, payoutSpeed: 2.1 },
  { month: "Jul 2026", volumeUSD: 890, successRate: 99.1, payoutSpeed: 1.8 }
];

interface RegionalVolume {
  region: string;
  volumeUSD: number; // Millions of USD
  growth: string;
  color: string;
}

const REGIONAL_DISTRIBUTION: RegionalVolume[] = [
  { region: "Nigeria (NGN)", volumeUSD: 380, growth: "+42% YoY", color: "#F5A623" },
  { region: "Kenya (KES)", volumeUSD: 240, growth: "+55% YoY", color: "#E0533C" },
  { region: "South Africa (ZAR)", volumeUSD: 160, growth: "+38% YoY", color: "#10B981" },
  { region: "US Corridor (USD)", volumeUSD: 110, growth: "+92% YoY", color: "#3B82F6" }
];

export default function AnalyticsSection() {
  const [activeMetric, setActiveMetric] = useState<"volume" | "success" | "speed">("volume");

  const getMetricTitle = () => {
    switch (activeMetric) {
      case "volume":
        return "Aggregated Transaction Volume";
      case "success":
        return "Transaction Success Rate";
      case "speed":
        return "Average Settlement Speed";
    }
  };

  const getMetricDesc = () => {
    switch (activeMetric) {
      case "volume":
        return "Simulated monthly volume in Millions of USD transferred across transatlantic channels.";
      case "success":
        return "Real-time payment approval rate backed by Flutterwave Shield's automated fraud scoring.";
      case "speed":
        return "Average dispatch-to-credit time for cross-border payouts directly into mobile money wallets.";
    }
  };

  // Custom tooltips for Recharts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-gray-800 p-4 rounded-xl text-white font-mono text-xs shadow-2xl">
          <p className="font-bold text-gray-400 mb-1.5">{label}</p>
          <div className="space-y-1">
            {activeMetric === "volume" && (
              <p className="text-white">
                Volume: <span className="text-brand-primary font-bold">${payload[0].value}M USD</span>
              </p>
            )}
            {activeMetric === "success" && (
              <p className="text-white">
                Success Rate: <span className="text-green-400 font-bold">{payload[0].value}%</span>
              </p>
            )}
            {activeMetric === "speed" && (
              <p className="text-white">
                Payout Speed: <span className="text-blue-400 font-bold">{payload[0].value} mins</span>
              </p>
            )}
          </div>
        </div>
      );
    };
    return null;
  };

  return (
    <section id="analytics-section" className="py-20 bg-slate-950 text-white scroll-mt-20 text-left relative overflow-hidden">
      {/* Visual background ambient lighting */}
      <div className="absolute top-1/2 left-1/4 w-[400px] h-[400px] bg-brand-primary/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 right-10 w-[300px] h-[300px] bg-brand-accent/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        {/* Header Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end mb-16">
          <div className="lg:col-span-7">
            <span className="text-xs font-bold text-brand-primary uppercase tracking-widest bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
              System Telemetry & Metrics
            </span>
            <h2 className="font-display font-extrabold text-3xl md:text-4xl tracking-tight mt-4 leading-tight">
              Scaling Payments without Boundaries
            </h2>
            <p className="text-gray-400 text-xs sm:text-sm leading-relaxed mt-4">
              Monitor the performance, velocity, and health of Flutterwave's simulated transatlantic routes. Our optimized channels maintain robust settlement indices even at peak volume thresholds.
            </p>
          </div>

          {/* Metric Selector Buttons */}
          <div className="lg:col-span-5 bg-slate-900/60 rounded-2xl p-1.5 border border-gray-800 flex gap-1">
            <button
              onClick={() => setActiveMetric("volume")}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                activeMetric === "volume"
                  ? "bg-brand-accent text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Volume</span>
            </button>
            <button
              onClick={() => setActiveMetric("success")}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                activeMetric === "success"
                  ? "bg-brand-accent text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Success Rate</span>
            </button>
            <button
              onClick={() => setActiveMetric("speed")}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                activeMetric === "speed"
                  ? "bg-brand-accent text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Payout Speed</span>
            </button>
          </div>
        </div>

        {/* Dashboard Visualization Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Main Chart Card */}
          <div className="lg:col-span-8 bg-[#0E131F]/80 backdrop-blur-sm rounded-3xl border border-gray-800 p-6 flex flex-col justify-between min-h-[420px]">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-800/80 mb-6 gap-2">
                <div>
                  <h3 className="font-display font-extrabold text-base text-white">
                    {getMetricTitle()}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {getMetricDesc()}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-gray-500 font-mono uppercase">LATEST REPORT</span>
                  <div className="font-mono font-bold text-sm text-brand-primary">
                    {activeMetric === "volume" && "$890M USD"}
                    {activeMetric === "success" && "99.10%"}
                    {activeMetric === "speed" && "1.8 Mins"}
                  </div>
                </div>
              </div>

              {/* Chart container */}
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={MONTHLY_ANALYTICS_DATA}
                    margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                        <stop 
                          offset="5%" 
                          stopColor={activeMetric === "volume" ? "#F5A623" : activeMetric === "success" ? "#10B981" : "#3B82F6"} 
                          stopOpacity={0.3}
                        />
                        <stop 
                          offset="95%" 
                          stopColor={activeMetric === "volume" ? "#F5A623" : activeMetric === "success" ? "#10B981" : "#3B82F6"} 
                          stopOpacity={0.0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                    <XAxis 
                      dataKey="month" 
                      stroke="#475569" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false} 
                      dy={10}
                    />
                    <YAxis 
                      stroke="#475569" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false}
                      domain={activeMetric === "success" ? [90, 100] : ["auto", "auto"]}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey={
                        activeMetric === "volume" 
                          ? "volumeUSD" 
                          : activeMetric === "success" 
                          ? "successRate" 
                          : "payoutSpeed"
                      }
                      stroke={activeMetric === "volume" ? "#F5A623" : activeMetric === "success" ? "#10B981" : "#3B82F6"}
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorMetric)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Micro details row */}
            <div className="pt-4 border-t border-gray-800/80 flex justify-between items-center text-[10px] text-gray-500 font-mono">
              <span className="flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-green-500" /> +117% volume growth since Q1
              </span>
              <span>UPDATE CYCLE: REAL-TIME SECONDS</span>
            </div>
          </div>

          {/* Side distribution info */}
          <div className="lg:col-span-4 flex flex-col justify-between gap-6">
            
            {/* Regional breakdown card */}
            <div className="bg-[#0E131F]/80 backdrop-blur-sm rounded-3xl border border-gray-800 p-6 flex-grow flex flex-col justify-between">
              <div>
                <span className="text-[10px] text-gray-500 font-mono font-bold uppercase tracking-wider block mb-1">
                  REGIONAL INDEX
                </span>
                <h4 className="font-display font-extrabold text-sm text-white">
                  Active Regional Settle Shares
                </h4>
                <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                  Distribution of monthly processing volumes across the major transatlantic destination networks.
                </p>

                {/* Region items */}
                <div className="space-y-3.5 mt-6">
                  {REGIONAL_DISTRIBUTION.map((item, idx) => (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs font-mono">
                        <span className="text-gray-300 font-bold flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: item.color }}></span>
                          {item.region}
                        </span>
                        <span className="text-gray-400">
                          ${item.volumeUSD}M <span className="text-green-500 text-[10px] ml-1">{item.growth}</span>
                        </span>
                      </div>
                      {/* Bar indicator */}
                      <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-1000" 
                          style={{ 
                            width: `${(item.volumeUSD / 890) * 100}%`,
                            backgroundColor: item.color 
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-800/80 text-[10px] text-gray-500 font-mono flex items-center gap-1.5">
                <Globe2 className="w-3.5 h-3.5 text-brand-primary" /> Supported across 150+ countries
              </div>
            </div>

            {/* Quick action card */}
            <div className="bg-gradient-to-r from-brand-dark to-slate-900 rounded-3xl border border-gray-800 p-6 flex flex-col justify-between">
              <div>
                <h5 className="font-display font-bold text-xs text-brand-primary uppercase tracking-wider">Enterprise Pricing</h5>
                <p className="text-xs text-gray-300 mt-2 leading-relaxed">
                  Process over $50,000 USD monthly? Get in touch with our treasury desk to discuss specialized interchange corridors and settlement terms.
                </p>
              </div>
              <button
                onClick={() => {
                  const el = document.getElementById("contact-section");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
                className="bg-brand-accent hover:bg-brand-accent/90 text-white font-bold text-[11px] px-4 py-2.5 rounded-xl mt-4 self-start transition-colors flex items-center gap-1 shadow shadow-brand-accent/20"
              >
                Contact Treasury Sales <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
