import { useState } from "react";
import { ChevronDown, ChevronUp, HelpCircle, MessageSquare } from "lucide-react";

interface FaqItem {
  question: string;
  answer: string;
}

const FAQ_DATA: FaqItem[] = [
  {
    question: "Is Flutterwave licensed to operate in the United States?",
    answer: "Yes, Flutterwave operates as a fully regulated and licensed Money Transmitter in multiple United States jurisdictions. We partner with premier US partner financial institutions and sponsor banks to deliver secure, compliant, and reliable cross-border clearing between North America, Africa, and global destinations."
  },
  {
    question: "What payout speeds can I expect when sending funds to Africa?",
    answer: "Payout delivery is optimized for maximum efficiency. Transfers to mobile money wallets (e.g. M-Pesa, MTN MoMo, Orange Money) are completely instant, clearing in seconds. Payouts to bank accounts in major commercial hubs like Nigeria, Kenya, South Africa, and Ghana are typically instant, while smaller rural regions settle within same-day or 24 business hours."
  },
  {
    question: "Which payment methods can my African customers use to buy from me?",
    answer: "Your platform can collect from customers via standard card checkouts (Visa, Mastercard, Discover, Amex), digital wallets (Apple Pay, Google Pay), and crucial local African payment options. This includes widespread Mobile Money networks (Safaricom M-Pesa, MTN, Airtel, Orange) and instant bank transfers depending on the customer's home market."
  },
  {
    question: "Does Flutterwave support multi-currency collection and settlement?",
    answer: "Absolutely. Flutterwave supports transaction collections in over 150 currencies worldwide. Your customers pay in their native currencies (e.g. NGN, KES, ZAR, GHS, UGX) to reduce exchange friction, while your business receives direct USD, GBP, or EUR payouts settled straight to your domestic corporate bank accounts."
  },
  {
    question: "How does Flutterwave Shield protect my business against fraudulent card charges?",
    answer: "Flutterwave Shield is our built-in enterprise fraud protection infrastructure. It runs real-time behavioral diagnostics and AI-powered risk scoring on every checkout request. We enforce strict 3D Secure 2.0 (3DS) authorization, block high-risk IP blocks, and monitor global card indexes to reduce chargebacks while maintaining friction-free checkout flows."
  }
];

export default function FaqSection() {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const toggleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <section id="faq-section" className="py-20 bg-white text-left scroll-mt-20">
      <div className="max-w-4xl mx-auto px-6">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 bg-orange-100/50 text-brand-accent px-3 py-1 rounded-full text-xs font-bold font-mono">
            <HelpCircle className="w-3.5 h-3.5" /> RECENT INQUIRIES
          </div>
          <h2 className="font-display font-extrabold text-3xl md:text-4xl text-brand-dark mt-4">
            Frequently Asked Questions
          </h2>
          <p className="text-gray-500 text-sm sm:text-base mt-2">
            Everything you need to know about setting up payment tunnels from the United States to Africa and around the globe.
          </p>
        </div>

        {/* Accordion List */}
        <div className="space-y-4">
          {FAQ_DATA.map((faq, idx) => {
            const isOpen = expandedIndex === idx;
            return (
              <div 
                key={idx}
                className="border border-gray-100 bg-gray-50/30 rounded-2xl overflow-hidden transition-all duration-300"
              >
                <button
                  onClick={() => toggleExpand(idx)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-gray-50/70 transition-colors"
                >
                  <span className="font-display font-bold text-sm sm:text-base text-brand-dark pr-4">
                    {faq.question}
                  </span>
                  <span className="shrink-0 text-brand-accent">
                    {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </span>
                </button>
                
                {isOpen && (
                  <div className="px-6 pb-6 pt-1 text-xs sm:text-sm text-gray-600 leading-relaxed bg-white border-t border-gray-50/40 animate-fade-in">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Sales Prompt */}
        <div className="bg-[#FAF9F6] p-6 rounded-2xl border border-gray-100 mt-12 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex gap-3 items-center text-left">
            <div className="p-2.5 bg-orange-100 text-brand-accent rounded-xl">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-display font-bold text-sm text-brand-dark">Still have unanswered queries?</h4>
              <p className="text-xs text-gray-500 mt-0.5">Connect directly with our transatlantic enterprise consulting desk.</p>
            </div>
          </div>
          <button
            onClick={() => {
              const el = document.getElementById("contact-section");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }}
            className="bg-brand-dark hover:bg-brand-dark/90 text-white font-bold text-xs px-6 py-3 rounded-full transition-colors whitespace-nowrap"
          >
            Contact Payment Sales
          </button>
        </div>

      </div>
    </section>
  );
}
