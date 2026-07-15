import { useState } from "react";
import { CreditCard, Globe, ShieldAlert, Zap, Landmark, DollarSign, Calculator, ArrowRight, ShieldCheck, Heart } from "lucide-react";

interface ConverterRate {
  source: string;
  target: string;
  rate: number;
  feePercent: number;
  speed: string;
  flag: string;
}

const CALCULATOR_RATES: ConverterRate[] = [
  { source: "USD", target: "NGN", rate: 1540.25, feePercent: 1.0, speed: "Instant Delivery", flag: "🇳🇬" },
  { source: "USD", target: "KES", rate: 129.50, feePercent: 1.2, speed: "Instant Delivery", flag: "🇰🇪" },
  { source: "USD", target: "ZAR", rate: 18.22, feePercent: 1.5, speed: "Same Day (EFT)", flag: "🇺🇦" }, // Wait, ZAR is South Africa
  { source: "USD", target: "GHS", rate: 15.10, feePercent: 1.1, speed: "Instant Delivery", flag: "🇬🇭" },
  { source: "GBP", target: "NGN", rate: 1980.50, feePercent: 1.0, speed: "Instant Delivery", flag: "🇳🇬" },
  { source: "GBP", target: "KES", rate: 167.30, feePercent: 1.2, speed: "Instant Delivery", flag: "🇰🇪" },
  { source: "EUR", target: "NGN", rate: 1680.10, feePercent: 1.0, speed: "Instant Delivery", flag: "🇳🇬" },
  { source: "EUR", target: "ZAR", rate: 19.95, feePercent: 1.5, speed: "Same Day (EFT)", flag: "🇿🇦" }
];

export default function CoreFeatures() {
  const [sourceCurrency, setSourceCurrency] = useState<string>("USD");
  const [targetCurrency, setTargetCurrency] = useState<string>("NGN");
  const [amountInput, setAmountInput] = useState<number>(1000);

  // Find matching rate
  const currentRate = CALCULATOR_RATES.find(
    r => r.source === sourceCurrency && r.target === targetCurrency
  ) || CALCULATOR_RATES[0];

  // Calculations
  const calculatedFee = amountInput * (currentRate.feePercent / 100);
  const netAmount = amountInput - calculatedFee;
  const payoutAmount = (netAmount * currentRate.rate).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  return (
    <section id="features-section" className="py-20 bg-white text-left scroll-mt-20">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Section Header */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end mb-16">
          <div className="lg:col-span-7">
            <span className="text-xs font-bold text-brand-accent uppercase tracking-widest bg-orange-100/50 px-3 py-1 rounded-full">
              Engineered for Global Scale
            </span>
            <h2 className="font-display font-extrabold text-3xl md:text-4xl text-brand-dark mt-4">
              A single integration for boundless growth
            </h2>
          </div>
          <div className="lg:col-span-5">
            <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
              Accept localized checkout methods globally and initiate payouts into bank accounts and mobile wallets from one unified dashboard. Flutterwave manages the underlying complexities.
            </p>
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          
          {/* Feature 1 */}
          <div className="bg-[#FAF9F6] p-8 rounded-3xl border border-gray-100 flex flex-col justify-between hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300">
            <div>
              <div className="w-12 h-12 bg-orange-100 text-brand-accent rounded-2xl flex items-center justify-center mb-6">
                <CreditCard className="w-6 h-6" />
              </div>
              <h3 className="font-display font-bold text-xl text-brand-dark mb-3">Accept Payments</h3>
              <p className="text-gray-600 text-xs sm:text-sm leading-relaxed mb-6">
                Deliver local checkout experiences. Accept cards (Visa, Mastercard, Amex), Apple Pay, Google Pay, and key African payment systems like Mobile Money (M-Pesa, MTN, Airtel) and local bank apps.
              </p>
            </div>
            <div className="flex items-center gap-2 font-bold text-xs text-brand-dark cursor-pointer group">
              <span>EXPLORE PAYMENT METHODS</span>
              <ArrowRight className="w-4 h-4 text-brand-accent transform transition-transform group-hover:translate-x-1" />
            </div>
          </div>

          {/* Feature 2 */}
          <div className="bg-[#FAF9F6] p-8 rounded-3xl border border-gray-100 flex flex-col justify-between hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300">
            <div>
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
                <Globe className="w-6 h-6" />
              </div>
              <h3 className="font-display font-bold text-xl text-brand-dark mb-3">Instant Global Payouts</h3>
              <p className="text-gray-600 text-xs sm:text-sm leading-relaxed mb-6">
                Pay remote developers, contractors, and suppliers instantly. Trigger single or mass transfers directly into local bank accounts and popular mobile money wallets across Africa and Europe.
              </p>
            </div>
            <div className="flex items-center gap-2 font-bold text-xs text-brand-dark cursor-pointer group">
              <span>EXPLORE PAYOUT SYSTEM</span>
              <ArrowRight className="w-4 h-4 text-brand-accent transform transition-transform group-hover:translate-x-1" />
            </div>
          </div>

          {/* Feature 3 */}
          <div className="bg-[#FAF9F6] p-8 rounded-3xl border border-gray-100 flex flex-col justify-between hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300">
            <div>
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center mb-6">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-display font-bold text-xl text-brand-dark mb-3">Advanced Fraud Defense</h3>
              <p className="text-gray-600 text-xs sm:text-sm leading-relaxed mb-6">
                Our active AI safety engine, Flutterwave Shield, actively audits every check, reducing chargeback rates, monitoring fraud indices, and enforcing robust 3D Secure 2.0 authorization rules.
              </p>
            </div>
            <div className="flex items-center gap-2 font-bold text-xs text-brand-dark cursor-pointer group">
              <span>EXPLORE SECURITY RULES</span>
              <ArrowRight className="w-4 h-4 text-brand-accent transform transition-transform group-hover:translate-x-1" />
            </div>
          </div>

        </div>

        {/* Dynamic Rate Converter widget (Bento Card Style) */}
        <div id="rate-converter-widget" className="bg-brand-dark rounded-3xl border border-gray-800 p-6 md:p-10 text-white grid grid-cols-1 lg:grid-cols-12 gap-8 items-center shadow-2xl relative overflow-hidden">
          
          {/* Left: Info Text */}
          <div className="lg:col-span-5 text-left">
            <div className="inline-flex items-center gap-1.5 bg-gray-800/80 border border-gray-700 rounded-full px-3 py-1 text-xs text-brand-primary mb-4 font-mono">
              <Calculator className="w-3.5 h-3.5" /> LIVE FX CALCULATION
            </div>
            <h3 className="font-display font-extrabold text-2xl md:text-3xl tracking-tight leading-tight mb-4 text-white">
              Settle globally, paid locally
            </h3>
            <p className="text-gray-400 text-xs sm:text-sm leading-relaxed mb-6">
              Calculate transfer amounts and payouts using direct mid-market conversion metrics. We maintain full transparency over transaction fees with absolutely zero hidden exchange margins.
            </p>
            <div className="flex items-center gap-2 text-xs text-gray-500 font-mono">
              <ShieldCheck className="w-4 h-4 text-green-500" /> Fully licensed money transmitter transparency
            </div>
          </div>

          {/* Right: Calculator Interactive Layout */}
          <div className="lg:col-span-7 bg-gray-900/50 border border-gray-800 p-6 rounded-2xl">
            
            {/* Input fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              
              {/* Source currency & input */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-gray-800 text-left">
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1">Send Amount</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={amountInput}
                    onChange={(e) => setAmountInput(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="bg-transparent text-white font-mono font-bold text-lg focus:outline-none w-full"
                  />
                  <select
                    value={sourceCurrency}
                    onChange={(e) => {
                      setSourceCurrency(e.target.value);
                      // Set default fitting target
                      if (e.target.value === "GBP") setTargetCurrency("NGN");
                      else if (e.target.value === "EUR") setTargetCurrency("ZAR");
                    }}
                    className="bg-gray-800 text-white font-bold text-xs px-2.5 py-1.5 rounded-lg border border-gray-700"
                  >
                    <option value="USD">USD</option>
                    <option value="GBP">GBP</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
              </div>

              {/* Target Currency Selection */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-gray-800 text-left">
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1">Payout Currency</span>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-gray-400 text-xs font-medium">To Africa</span>
                  <select
                    value={targetCurrency}
                    onChange={(e) => setTargetCurrency(e.target.value)}
                    className="bg-gray-800 text-white font-bold text-xs px-2.5 py-1.5 rounded-lg border border-gray-700"
                  >
                    {/* Filter appropriate options matching source */}
                    {CALCULATOR_RATES.filter(r => r.source === sourceCurrency).map(r => (
                      <option key={r.target} value={r.target}>
                        {r.target} ({r.target === "NGN" ? "Naira" : r.target === "KES" ? "KES" : r.target === "ZAR" ? "Rand" : "Cedi"})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

            </div>

            {/* Calculations Breakdown */}
            <div className="space-y-3 font-mono text-xs pt-2 pb-4 border-b border-gray-800/60 text-left">
              <div className="flex justify-between text-gray-400">
                <span>FX Exchange Rate:</span>
                <span className="text-white">
                  1 {sourceCurrency} = {currentRate.rate} {currentRate.target} {currentRate.flag}
                </span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Transfer Fee ({currentRate.feePercent}%):</span>
                <span className="text-white">
                  -{calculatedFee.toFixed(2)} {sourceCurrency}
                </span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Net Transferable:</span>
                <span className="text-white">
                  {(netAmount).toFixed(2)} {sourceCurrency}
                </span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Delivery Speed:</span>
                <span className="text-brand-primary font-bold">
                  {currentRate.speed}
                </span>
              </div>
            </div>

            {/* Final output */}
            <div className="flex items-center justify-between pt-4 text-left">
              <div>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Recipients Receives</p>
                <p className="text-xl sm:text-2xl font-mono font-extrabold text-brand-primary mt-1">
                  {payoutAmount} {targetCurrency}
                </p>
              </div>
              <button 
                onClick={() => {
                  const el = document.getElementById("payments-simulator");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
                className="bg-brand-accent hover:bg-brand-accent/90 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
              >
                Send Settle Now <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
