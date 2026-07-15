import { useState, useEffect } from "react";
import { CreditCard, Smartphone, Landmark, CheckCircle, RefreshCw, Send, Lock, HelpCircle, ChevronRight, AlertCircle, Sparkles } from "lucide-react";
import { PaymentMethodType, ExchangeRate, SimulatedTransaction } from "../types";

const RATES: ExchangeRate[] = [
  { currency: "NGN", name: "Nigerian Naira", rate: 1540.25, flag: "🇳🇬", speed: "Instant Bank Transfer" },
  { currency: "KES", name: "Kenyan Shilling", rate: 129.50, flag: "🇰🇪", speed: "Instant M-Pesa Wallet" },
  { currency: "ZAR", name: "South African Rand", rate: 18.22, flag: "🇿🇦", speed: "2-Day Local EFT" },
  { currency: "GHS", name: "Ghanaian Cedi", rate: 15.10, flag: "🇬🇭", speed: "Instant MTN/Airtel Wallet" },
  { currency: "UGX", name: "Ugandan Shilling", rate: 3720.00, flag: "🇺🇬", speed: "Instant Mobile Money" }
];

export default function InteractiveShowcase() {
  // Simulator input state
  const [amountUsd, setAmountUsd] = useState<number>(50);
  const [selectedRate, setSelectedRate] = useState<ExchangeRate>(RATES[0]);
  const [email, setEmail] = useState<string>("finance@us-saas.com");
  const [customerName, setCustomerName] = useState<string>("Adegoke Olabode");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>("card");

  // Mock form inputs inside checkout
  const [cardNumber, setCardNumber] = useState<string>("4000 1234 5678 9010");
  const [cardExpiry, setCardExpiry] = useState<string>("12/28");
  const [cardCvv, setCardCvv] = useState<string>("123");
  const [momoPhone, setMomoPhone] = useState<string>("+254 712 345 678");
  const [momoProvider, setMomoProvider] = useState<string>("mpesa");

  // Simulation running states
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingStep, setProcessingStep] = useState<string>("");
  const [transactionResult, setTransactionResult] = useState<SimulatedTransaction | null>(null);

  // Auto-calculate local amount equivalent
  const amountLocal = (amountUsd * selectedRate.rate).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  const handleCountryChange = (currencyCode: string) => {
    const rate = RATES.find(r => r.currency === currencyCode);
    if (rate) {
      setSelectedRate(rate);
      // Auto-set dummy info relevant to country
      if (rate.currency === "KES") {
        setCustomerName("Mwangi Kamau");
        setPaymentMethod("momo");
        setMomoPhone("+254 712 345 678");
        setMomoProvider("mpesa");
      } else if (rate.currency === "NGN") {
        setCustomerName("Adegoke Olabode");
        setPaymentMethod("card");
      } else if (rate.currency === "ZAR") {
        setCustomerName("Sipho Dlamini");
        setPaymentMethod("transfer");
      } else {
        setCustomerName("Kwame Osei");
        setPaymentMethod("momo");
        setMomoPhone("+233 24 123 4567");
        setMomoProvider("mtn");
      }
    }
  };

  const handlePredefinedAmount = (amt: number) => {
    setAmountUsd(amt);
  };

  // Submit payment simulation via API
  const handleSimulatePayment = async () => {
    setIsProcessing(true);
    setProcessingStep("Securing browser connection (3D Secure 2.0)...");
    
    setTimeout(() => {
      setProcessingStep("Verifying routing paths via Flutterwave US hub...");
    }, 700);

    setTimeout(() => {
      setProcessingStep(`Exchanging USD to ${selectedRate.currency} dynamically...`);
    }, 1400);

    try {
      const response = await fetch("/api/payment/simulate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          amount: amountUsd,
          currency: selectedRate.currency,
          email,
          cardName: customerName,
          paymentMethod
        })
      });

      if (!response.ok) {
        throw new Error("Simulation failed on server side");
      }

      const data = await response.json();
      
      setTimeout(() => {
        setTransactionResult({
          id: data.data.id,
          txRef: data.data.txRef,
          amount: data.data.amount,
          currency: data.data.currency,
          email: data.data.email,
          paymentMethod: data.data.paymentMethod,
          cardName: data.data.cardName,
          created_at: data.data.created_at,
          status: "successful",
          charge_response_message: data.data.charge_response_message
        });
        setIsProcessing(false);
      }, 2200);

    } catch (err) {
      console.error(err);
      setIsProcessing(false);
      alert("Something went wrong during the simulation. Please try again.");
    }
  };

  const handleResetSimulation = () => {
    setTransactionResult(null);
    setIsProcessing(false);
    setProcessingStep("");
  };

  return (
    <section 
      id="payments-simulator" 
      className="py-20 bg-gradient-to-b from-white to-[#FAF9F6] scroll-mt-20"
    >
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold text-brand-accent uppercase tracking-widest bg-orange-100/50 px-3 py-1 rounded-full">
            Checkout Simulator
          </span>
          <h2 className="font-display font-extrabold text-3xl md:text-4xl text-brand-dark mt-4">
            Experience how payments clear seamlessly
          </h2>
          <p className="text-gray-600 mt-3 text-base">
            See exactly how African customers buy from your US-based platform. Try our fully interactive sandbox—adjust pricing, choose a localization country, and fire a real API payment request.
          </p>
        </div>

        {/* Simulator Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch">
          
          {/* Left Panel: Configuration Form (5 cols) */}
          <div className="lg:col-span-5 bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-xl shadow-gray-100/40 flex flex-col justify-between text-left">
            <div>
              <div className="flex items-center gap-2 pb-4 mb-6 border-b border-gray-100">
                <Sparkles className="w-5 h-5 text-brand-accent" />
                <h3 className="font-display font-bold text-lg text-brand-dark">SaaS Configurator</h3>
              </div>

              {/* Email Input */}
              <div className="mb-4">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                  US Merchant Email (Receipts)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-brand-dark focus:outline-none focus:border-brand-primary"
                  placeholder="finance@us-saas.com"
                />
              </div>

              {/* Customer Name Input */}
              <div className="mb-4">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                  African Customer Name
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-brand-dark focus:outline-none focus:border-brand-primary"
                />
              </div>

              {/* Amount Settings */}
              <div className="mb-6">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                  Transaction Amount (USD)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="5"
                    max="1000"
                    step="5"
                    value={amountUsd}
                    onChange={(e) => setAmountUsd(parseInt(e.target.value))}
                    className="flex-grow accent-brand-accent h-1.5 bg-gray-200 rounded-lg cursor-pointer"
                  />
                  <span className="font-mono font-extrabold text-brand-dark border border-gray-200 bg-gray-50 px-3 py-1.5 rounded-xl min-w-[70px] text-center">
                    ${amountUsd}
                  </span>
                </div>
                <div className="flex gap-2 mt-2">
                  {[20, 50, 150, 500].map(amt => (
                    <button
                      key={amt}
                      onClick={() => handlePredefinedAmount(amt)}
                      className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${
                        amountUsd === amt
                          ? "bg-brand-dark text-white border-brand-dark"
                          : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      ${amt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Target Country Selection */}
              <div className="mb-6">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">
                  Destination Country & Rate
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {RATES.map((rate) => (
                    <button
                      key={rate.currency}
                      onClick={() => handleCountryChange(rate.currency)}
                      className={`flex flex-col p-3 rounded-xl border text-left transition-all ${
                        selectedRate.currency === rate.currency
                          ? "bg-orange-50/40 border-brand-accent ring-2 ring-brand-accent/10"
                          : "bg-white border-gray-100 hover:border-gray-200"
                      }`}
                    >
                      <span className="text-lg">{rate.flag}</span>
                      <span className="text-xs font-bold text-brand-dark mt-1">{rate.currency}</span>
                      <span className="text-[10px] text-gray-400 mt-0.5 font-mono">1 USD = {rate.rate}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Helper Box */}
            <div className="bg-orange-50/50 p-4 rounded-2xl border border-orange-100 text-xs text-orange-950 flex gap-2">
              <AlertCircle className="w-5 h-5 text-brand-accent shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Real-time Currency Conversion</p>
                <p className="text-gray-600 mt-0.5 leading-relaxed">
                  Flutterwave collects equivalent local funds from customers (e.g. <strong>{amountLocal} {selectedRate.currency}</strong>) and processes settlements to your US treasury directly in USD.
                </p>
              </div>
            </div>
          </div>

          {/* Right Panel: Interactive Checkout Widget (7 cols) */}
          <div className="lg:col-span-7 bg-[#0F172A] rounded-3xl p-6 md:p-8 flex items-center justify-center relative min-h-[500px]">
            {/* Background elements */}
            <div className="absolute top-4 left-4 font-mono text-[10px] text-gray-500 uppercase tracking-widest hidden md:block">
              FLUTTERWAVE CHECKOUT ENGINE (US)
            </div>

            {/* If Processing */}
            {isProcessing && (
              <div className="absolute inset-0 bg-slate-950/95 rounded-3xl z-30 flex flex-col items-center justify-center p-8 text-center text-white">
                <RefreshCw className="w-12 h-12 text-brand-primary animate-spin mb-4" />
                <h4 className="font-display font-bold text-lg">Processing Transaction...</h4>
                <p className="text-xs text-gray-400 mt-2 font-mono max-w-sm">
                  {processingStep}
                </p>
              </div>
            )}

            {/* If Finished - SUCCESS RECEIPT SCREEN */}
            {transactionResult && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-2xl p-6 md:p-8 w-full max-w-md text-brand-dark animate-scale-up text-left">
                <div className="flex flex-col items-center text-center pb-6 border-b border-dashed border-gray-200">
                  <div className="w-14 h-14 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-3">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <h4 className="font-display font-extrabold text-xl text-brand-dark">Simulation Successful!</h4>
                  <p className="text-xs text-gray-500 mt-1">Settled to your US treasury in USD</p>
                </div>

                {/* Receipt Details */}
                <div className="py-6 flex flex-col gap-3 font-mono text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-400">TX REF:</span>
                    <span className="font-bold text-brand-dark">{transactionResult.txRef}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">SETTLED TO:</span>
                    <span className="font-bold text-brand-dark">{transactionResult.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">CUSTOMER:</span>
                    <span className="font-bold text-brand-dark">{transactionResult.cardName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">PAID LOCAL:</span>
                    <span className="font-bold text-indigo-600">{amountLocal} {transactionResult.currency}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-100">
                    <span className="text-gray-400">SETTLED AMOUNT:</span>
                    <span className="font-bold text-green-600 text-sm">${transactionResult.amount.toFixed(2)} USD</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">DELIVERY SPEED:</span>
                    <span className="font-bold text-brand-accent">{selectedRate.speed}</span>
                  </div>
                </div>

                <button
                  onClick={handleResetSimulation}
                  className="w-full bg-brand-accent hover:bg-brand-accent/90 text-white text-xs font-bold uppercase tracking-wider py-3.5 rounded-xl transition-all"
                >
                  Reset and Run Another
                </button>
              </div>
            )}

            {/* MAIN CHECKOUT PREVIEW CARD (Visible when idle) */}
            {!transactionResult && !isProcessing && (
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col text-brand-dark">
                
                {/* Header */}
                <div className="bg-slate-50 border-b border-gray-100 p-4 flex justify-between items-center text-left">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-brand-primary text-white flex items-center justify-center font-display font-bold text-xs">
                      FLW
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-brand-dark leading-none">Your Platform SaaS</h4>
                      <p className="text-[9px] text-gray-500 mt-0.5">{email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-gray-400">Pay in {selectedRate.currency}</p>
                    <p className="text-sm font-extrabold text-brand-dark leading-none">{selectedRate.flag} {amountLocal}</p>
                  </div>
                </div>

                {/* Main checkout body */}
                <div className="p-5 flex-grow text-left">
                  
                  {/* Payment Method Selector Tabs */}
                  <div className="flex bg-gray-100 p-0.5 rounded-xl mb-4">
                    <button
                      onClick={() => setPaymentMethod("card")}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all ${
                        paymentMethod === "card"
                          ? "bg-white text-brand-dark shadow"
                          : "text-gray-500 hover:text-brand-dark"
                      }`}
                    >
                      <CreditCard className="w-3.5 h-3.5" /> Card
                    </button>
                    <button
                      onClick={() => setPaymentMethod("momo")}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all ${
                        paymentMethod === "momo"
                          ? "bg-white text-brand-dark shadow"
                          : "text-gray-500 hover:text-brand-dark"
                      }`}
                    >
                      <Smartphone className="w-3.5 h-3.5" /> Mobile Money
                    </button>
                    <button
                      onClick={() => setPaymentMethod("transfer")}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all ${
                        paymentMethod === "transfer"
                          ? "bg-white text-brand-dark shadow"
                          : "text-gray-500 hover:text-brand-dark"
                      }`}
                    >
                      <Landmark className="w-3.5 h-3.5" /> Transfer
                    </button>
                  </div>

                  {/* Payment Form Contents */}
                  {paymentMethod === "card" && (
                    <div className="space-y-3">
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 block mb-1">CARD NUMBER</label>
                        <input
                          type="text"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs font-mono"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-bold text-gray-400 block mb-1">EXPIRY DATE</label>
                          <input
                            type="text"
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(e.target.value)}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs font-mono text-center"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-gray-400 block mb-1">CVV</label>
                          <input
                            type="text"
                            value={cardCvv}
                            onChange={(e) => setCardCvv(e.target.value)}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs font-mono text-center"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {paymentMethod === "momo" && (
                    <div className="space-y-3">
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 block mb-1">MOBILE WALLET PROVIDER</label>
                        <select
                          value={momoProvider}
                          onChange={(e) => setMomoProvider(e.target.value)}
                          className="w-full border border-gray-200 bg-white rounded-lg px-3 py-2 text-xs"
                        >
                          {selectedRate.currency === "KES" && <option value="mpesa">Safaricom M-Pesa</option>}
                          {selectedRate.currency === "GHS" && (
                            <>
                              <option value="mtn">MTN Mobile Money</option>
                              <option value="airtel">AirtelTigo Money</option>
                            </>
                          )}
                          {selectedRate.currency !== "KES" && selectedRate.currency !== "GHS" && (
                            <>
                              <option value="momo">MTN MoMo</option>
                              <option value="orange">Orange Money</option>
                            </>
                          )}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 block mb-1">MOBILE PHONE NUMBER</label>
                        <input
                          type="tel"
                          value={momoPhone}
                          onChange={(e) => setMomoPhone(e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs font-mono"
                        />
                      </div>
                    </div>
                  )}

                  {paymentMethod === "transfer" && (
                    <div className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-xl text-left">
                      <div className="flex gap-2">
                        <Landmark className="w-5 h-5 text-indigo-600 shrink-0" />
                        <div>
                          <h5 className="text-xs font-bold text-indigo-950">Local Account Deposit</h5>
                          <p className="text-[10px] text-indigo-700 leading-normal mt-1">
                            A designated mock account number will be generated on click. Settle easily via standard African instant EFT.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    onClick={handleSimulatePayment}
                    className="w-full bg-brand-primary hover:bg-brand-secondary text-white text-xs font-bold uppercase tracking-wider py-3 rounded-xl mt-6 transition-colors shadow-md flex items-center justify-center gap-1.5"
                  >
                    <Lock className="w-3.5 h-3.5" /> Pay {selectedRate.flag} {amountLocal}
                  </button>

                  <div className="flex justify-center items-center gap-1.5 mt-4 text-[10px] text-gray-400">
                    <Lock className="w-3 h-3 text-green-500" />
                    <span>SOCIALLY SECURED & PCI-DSS ENCRYPTED</span>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </section>
  );
}
