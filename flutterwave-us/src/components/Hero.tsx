import { useState, useEffect } from "react";
import { ArrowRight, Play, CheckCircle2, RefreshCw, Sparkles, TrendingUp, ShieldCheck, ArrowUpRight } from "lucide-react";

interface HeroProps {
  onScrollToSection: (sectionId: string) => void;
  openDemo: () => void;
}

interface LiveTransaction {
  id: string;
  sender: string;
  origin: string;
  recipient: string;
  destination: string;
  amount: string;
  currency: string;
  type: "Card" | "M-Pesa" | "Bank Transfer" | "MTN MoMo";
  status: "Success" | "Processing";
}

const MOCK_ORIGINS = [
  { city: "San Francisco, USA", label: "US Merchant" },
  { city: "New York, USA", label: "US Merchant" },
  { city: "London, UK", label: "UK Entity" },
  { city: "Chicago, USA", label: "US Partner" },
  { city: "Atlanta, USA", label: "US FinTech" }
];

const MOCK_DESTINATIONS = [
  { city: "Lagos, Nigeria", currency: "NGN", name: "Adegoke O.", type: "Bank Transfer" },
  { city: "Nairobi, Kenya", currency: "KES", name: "Mwangi K.", type: "M-Pesa" },
  { city: "Johannesburg, South Africa", currency: "ZAR", name: "Dlamini S.", type: "Card" },
  { city: "Accra, Ghana", currency: "GHS", name: "Osei Y.", type: "MTN MoMo" },
  { city: "Kigali, Rwanda", currency: "RWF", name: "Gasana J.", type: "MTN MoMo" }
];

export default function Hero({ onScrollToSection, openDemo }: HeroProps) {
  const [transactions, setTransactions] = useState<LiveTransaction[]>([
    {
      id: "FLW-8392",
      sender: "Uber US Inc.",
      origin: "San Francisco, USA",
      recipient: "Adebayo O. (Lagos)",
      destination: "Lagos, Nigeria",
      amount: "450.00",
      currency: "USD",
      type: "Bank Transfer",
      status: "Success"
    },
    {
      id: "FLW-8393",
      sender: "Spotify USA",
      origin: "New York, USA",
      recipient: "Wanjiku N. (Nairobi)",
      destination: "Nairobi, Kenya",
      amount: "15.99",
      currency: "USD",
      type: "M-Pesa",
      status: "Success"
    },
    {
      id: "FLW-8394",
      sender: "Microsoft US",
      origin: "Seattle, USA",
      recipient: "Kamau M. (Nairobi)",
      destination: "Nairobi, Kenya",
      amount: "1,200.00",
      currency: "USD",
      type: "M-Pesa",
      status: "Processing"
    }
  ]);

  const [volCount, setVolCount] = useState(481523910.25);
  const [successRate, setSuccessRate] = useState(99.98);

  // Interval for transaction updates
  useEffect(() => {
    const txInterval = setInterval(() => {
      const origin = MOCK_ORIGINS[Math.floor(Math.random() * MOCK_ORIGINS.length)];
      const dest = MOCK_DESTINATIONS[Math.floor(Math.random() * MOCK_DESTINATIONS.length)];
      const amt = (Math.random() * 500 + 10).toFixed(2);
      
      const newTx: LiveTransaction = {
        id: `FLW-${Math.floor(Math.random() * 9000 + 1000)}`,
        sender: origin.label === "US Merchant" ? "SaaS Global US" : "Remote Team Payout",
        origin: origin.city,
        recipient: dest.name,
        destination: dest.city,
        amount: amt,
        currency: "USD",
        type: dest.type as any,
        status: "Success"
      };

      setTransactions(prev => {
        const next = [newTx, ...prev];
        if (next.length > 5) next.pop();
        return next;
      });

      // Update total volume
      setVolCount(prev => prev + parseFloat(amt));
      
      // Slightly fluctuate success rate
      setSuccessRate(prev => {
        const delta = (Math.random() * 0.04 - 0.02);
        const next = prev + delta;
        return next > 100 ? 100 : next < 99.9 ? 99.92 : parseFloat(next.toFixed(2));
      });
    }, 4000);

    return () => clearInterval(txInterval);
  }, []);

  return (
    <section 
      id="hero-section"
      className="relative pt-32 pb-24 md:pt-40 md:pb-32 bg-radial from-[#FAF9F6] via-[#FAF9F6] to-[#FFF3E0]/30 dark:from-slate-950 dark:via-slate-950 dark:to-orange-950/10 overflow-hidden"
    >
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-brand-primary/10 to-transparent rounded-full blur-3xl -z-10 pointer-events-none"></div>
      <div className="absolute -bottom-20 left-1/4 w-[400px] h-[400px] bg-brand-accent/5 rounded-full blur-2xl -z-10 pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left Column: Text Content */}
        <div className="lg:col-span-7 flex flex-col gap-6 text-left">
          {/* US Expansion Badge */}
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30 border border-orange-200/50 dark:border-orange-800/50 rounded-full px-4 py-1.5 w-fit animate-pulse">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-accent opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-accent"></span>
            </span>
            <span className="text-xs font-semibold text-orange-950 dark:text-orange-200 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
              Regulated US Bridge to Africa & Beyond
            </span>
          </div>

          <h1 className="font-display font-extrabold text-4xl sm:text-5xl md:text-6xl tracking-tight text-brand-dark dark:text-slate-100 leading-tight">
            Endless payment <br className="hidden md:block" />
            possibilities for <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-accent via-brand-secondary to-orange-500">
              US businesses
            </span>
          </h1>

          <p className="text-base sm:text-lg text-gray-600 dark:text-slate-400 max-w-xl leading-relaxed">
            The easiest way to connect your US company to Africa's digital economy. Accept payments locally from customers in 34+ African nations, make seamless payouts to contractors, and settle effortlessly in USD—all on a fully compliant, licensed Money Transmitter platform.
          </p>

          {/* Quick Stats list */}
          <div className="grid grid-cols-3 gap-4 border-y border-orange-100 dark:border-orange-900/30 py-4 my-2 max-w-lg">
            <div>
              <p className="text-xl font-bold text-brand-dark dark:text-slate-100 font-display">150+</p>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">Currencies</p>
            </div>
            <div>
              <p className="text-xl font-bold text-brand-dark dark:text-slate-100 font-display">34+</p>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">African Countries</p>
            </div>
            <div>
              <p className="text-xl font-bold text-brand-dark dark:text-slate-100 font-display">1M+</p>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">Businesses Served</p>
            </div>
          </div>

          {/* Call to Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <button
              onClick={() => onScrollToSection("payments-simulator")}
              className="bg-brand-accent hover:bg-brand-accent/90 text-white font-bold px-8 py-4 rounded-full transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-brand-accent/25 hover:shadow-xl hover:translate-y-[-2px]"
            >
              Try Interactive Demo <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => onScrollToSection("contact-section")}
              className="bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 text-brand-dark dark:text-slate-100 font-bold px-8 py-4 rounded-full border border-gray-200 dark:border-slate-700 transition-all duration-300 flex items-center justify-center gap-2 hover:border-gray-300 dark:hover:border-slate-600 hover:translate-y-[-2px]"
            >
              Contact Sales <ArrowUpRight className="w-5 h-5 text-gray-500 dark:text-slate-400" />
            </button>
          </div>

          {/* Compliance notice */}
          <div className="flex items-center gap-2 mt-2 text-xs text-gray-500 dark:text-slate-400">
            <ShieldCheck className="w-4 h-4 text-green-600" />
            <span>Licensed Money Transmitter platform & SOC 2 certified</span>
          </div>
        </div>

        {/* Right Column: Live Payment Visualizer */}
        <div className="lg:col-span-5 relative mt-8 lg:mt-0">
          <div className="absolute -top-10 -left-10 w-24 h-24 bg-amber-200/40 rounded-full blur-2xl pointer-events-none"></div>
          
          {/* Main Visual Box (Styled Dashboard Preview) */}
          <div className="bg-brand-dark rounded-3xl p-6 border border-gray-800 shadow-2xl relative overflow-hidden text-left text-white max-w-md mx-auto">
            {/* Top Bar */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-800">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></div>
                <span className="text-xs font-mono font-semibold text-gray-400">LIVE TRANS-ATLANTIC ROUTER</span>
              </div>
              <div className="bg-gray-800 text-[10px] font-mono px-2 py-0.5 rounded text-brand-primary">
                US-AFRICA ROUTE
              </div>
            </div>

            {/* Micro Stats Row */}
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="bg-gray-900/60 p-3 rounded-xl border border-gray-800/40">
                <p className="text-[10px] text-gray-400 font-medium">USD PROCESSED TODAY</p>
                <p className="text-base font-bold text-white font-mono mt-0.5">
                  ${volCount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <div className="bg-gray-900/60 p-3 rounded-xl border border-gray-800/40">
                <p className="text-[10px] text-gray-400 font-medium">TRANSACTION SUCCESS</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <p className="text-base font-bold text-green-400 font-mono">{successRate}%</p>
                  <TrendingUp className="w-3.5 h-3.5 text-green-400" />
                </div>
              </div>
            </div>

            {/* Live Feed Header */}
            <div className="flex items-center justify-between pb-2">
              <span className="text-xs font-bold text-gray-300">Live Settlements</span>
              <span className="text-[10px] text-gray-500 flex items-center gap-1 animate-spin duration-1000">
                <RefreshCw className="w-3 h-3 text-brand-primary" /> Auto-updating
              </span>
            </div>

            {/* List of transactions */}
            <div className="flex flex-col gap-3 max-h-[220px] overflow-hidden relative">
              <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-brand-dark to-transparent z-10 pointer-events-none"></div>
              {transactions.map((tx, idx) => (
                <div
                  key={tx.id}
                  className={`bg-gray-900/40 p-3 rounded-xl border border-gray-800/60 flex flex-col gap-1.5 transition-all duration-500 transform ${
                    idx === 0 ? "scale-[1.02] bg-gray-800/40 border-orange-500/30" : "scale-100 opacity-80"
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-mono text-gray-400">{tx.id}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                      tx.status === "Success" 
                        ? "bg-green-950 text-green-400 border border-green-900" 
                        : "bg-yellow-950 text-yellow-400 border border-yellow-900 animate-pulse"
                    }`}>
                      {tx.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-white">{tx.sender}</p>
                      <p className="text-[10px] text-gray-500">{tx.origin}</p>
                    </div>
                    {/* Visual bridge */}
                    <div className="flex items-center gap-1 px-1.5 text-brand-primary">
                      <div className="w-1.5 h-1.5 rounded-full bg-orange-400"></div>
                      <div className="w-6 h-[1px] border-t border-dashed border-orange-500/50"></div>
                      <div className="w-1.5 h-1.5 rounded-full bg-yellow-400"></div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-white">{tx.recipient}</p>
                      <p className="text-[10px] text-gray-500">{tx.destination}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] border-t border-gray-800/40 pt-1.5 mt-0.5">
                    <span className="text-gray-400">via <strong className="text-gray-300">{tx.type}</strong></span>
                    <span className="font-mono text-brand-primary font-bold">+${tx.amount} USD</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Decorative bottom glow */}
            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-4/5 h-10 bg-brand-primary/20 rounded-full blur-xl"></div>
          </div>

          {/* Floating mini-widget (Card Demo Invitation) */}
          <div className="absolute -bottom-6 -right-4 bg-white dark:bg-slate-800 text-brand-dark dark:text-slate-100 p-4 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 max-w-[180px] hidden md:block text-left animate-bounce duration-1000">
            <div className="flex items-center gap-1.5">
              <div className="p-1 bg-green-100 dark:bg-green-900/30 rounded text-green-600 dark:text-green-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold">Try Card Checkout</span>
            </div>
            <p className="text-[10px] text-gray-500 mt-1 leading-normal">
              Select card payment in our interactive simulator below.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
