import { Globe, Heart, Shield, Award, HelpCircle } from "lucide-react";

interface FooterProps {
  onScrollToSection: (sectionId: string) => void;
}

export default function Footer({ onScrollToSection }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer id="main-footer" className="bg-[#0A0E1A] text-gray-400 py-16 text-left border-t border-gray-900">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Main Footer Links Columns */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          
          {/* Brand Col */}
          <div className="col-span-2 md:col-span-1 text-left flex flex-col gap-4">
            <div 
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            >
              <svg viewBox="0 0 100 100" className="w-6 h-6">
                <path
                  d="M10 50 C 30 10, 40 90, 60 50 C 80 10, 70 90, 90 50"
                  fill="none"
                  stroke="#F5A623"
                  strokeWidth="16"
                  strokeLinecap="round"
                />
              </svg>
              <span className="font-display font-bold text-lg text-white">flutterwave</span>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              We connect global commerce networks seamlessly, enabling transatlantic collection and payouts from the United States directly into African financial hubs.
            </p>
          </div>

          {/* Col 2: Products */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Products</h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <button 
                  onClick={() => onScrollToSection("payments-simulator")} 
                  className="hover:text-white transition-colors"
                >
                  Checkout Widget
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onScrollToSection("features-section")} 
                  className="hover:text-white transition-colors"
                >
                  Instant Payouts
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onScrollToSection("features-section")} 
                  className="hover:text-white transition-colors"
                >
                  Flutterwave Shield
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onScrollToSection("rate-converter-widget")} 
                  className="hover:text-white transition-colors"
                >
                  Live FX converter
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Developers */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Developers</h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <button 
                  onClick={() => onScrollToSection("developer-section")} 
                  className="hover:text-white transition-colors"
                >
                  V3 API Integrations
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onScrollToSection("developer-section")} 
                  className="hover:text-white transition-colors"
                >
                  REST API reference
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onScrollToSection("developer-section")} 
                  className="hover:text-white transition-colors"
                >
                  System Webhooks
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Resources */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Resources</h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <button 
                  onClick={() => onScrollToSection("faq-section")} 
                  className="hover:text-white transition-colors"
                >
                  Frequently Asked
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onScrollToSection("contact-section")} 
                  className="hover:text-white transition-colors"
                >
                  Contact Support
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onScrollToSection("contact-section")} 
                  className="hover:text-white transition-colors"
                >
                  Sales Desk
                </button>
              </li>
            </ul>
          </div>

          {/* Col 5: Security Certs */}
          <div className="col-span-2 md:col-span-1 text-left flex flex-col gap-4">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2">Compliance</h4>
            <div className="flex gap-2 items-center text-xs text-gray-400">
              <Shield className="w-4 h-4 text-green-500" />
              <span>PCI-DSS Level 1 certified</span>
            </div>
            <div className="flex gap-2 items-center text-xs text-gray-400">
              <Award className="w-4 h-4 text-brand-primary" />
              <span>Licensed Money Transmitter Partner</span>
            </div>
          </div>

        </div>

        {/* Regulatory/Licensing Disclaimer section */}
        <div className="border-t border-gray-900 pt-8 pb-4 text-[10px] text-gray-600 leading-normal flex flex-col gap-4">
          <p>
            Flutterwave is a regulated global payment facilitator. Services in the United States are provided in partnership with fully licensed sponsor banks, state financial departments, and authorized Money Transmitter license holders. Transactions are securely encrypted via SSL/TLS and guarded by real-time automated fraud scoring filters. Settle-bridge tunnels satisfy strict KYC/AML guidelines under CFT regulations.
          </p>
          <p>
            This website is a highly styled demonstration clone constructed to illustrate professional visual and interactive full-stack integration workflows. All transactions simulated within the sandbox environment are strictly mock trials with zero actual financial settlements occurring.
          </p>
        </div>

        {/* Copyright Footer Row */}
        <div className="border-t border-gray-900 pt-6 flex flex-col sm:flex-row justify-between items-center text-xs text-gray-500 gap-4">
          <span>&copy; {currentYear} Flutterwave US Clone. Developed with meticulous craft in the AI Studio platform.</span>
          <div className="flex gap-1.5 items-center">
            <span>Crafted with</span>
            <Heart className="w-3 h-3 text-brand-accent fill-brand-accent" />
            <span>for US businesses.</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
