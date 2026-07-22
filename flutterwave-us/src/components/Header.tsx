import { useState, useEffect } from "react";
import { Menu, X, ChevronDown, ArrowRight, ShieldCheck, Globe, Zap, Cpu, Store, CreditCard } from "lucide-react";

interface HeaderProps {
  onScrollToSection: (sectionId: string) => void;
  openDemo: () => void;
}

export default function Header({ onScrollToSection, openDemo }: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavClick = (sectionId: string) => {
    onScrollToSection(sectionId);
    setIsMobileMenuOpen(false);
    setActiveDropdown(null);
  };

  return (
    <header
      id="main-header"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white dark:bg-slate-900 backdrop-blur-md shadow-md py-4 text-brand-dark dark:text-slate-100"
          : "bg-transparent py-5 text-brand-dark dark:text-slate-100"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <div 
          id="logo-container"
          className="flex items-center gap-2 cursor-pointer group"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          <div className="relative w-8 h-8 flex items-center justify-center">
            {/* Styled Flutterwave inspired wave logo using SVGs */}
            <svg viewBox="0 0 100 100" className="w-full h-full transform transition-transform group-hover:scale-110 duration-300">
              <path
                d="M10 50 C 30 10, 40 90, 60 50 C 80 10, 70 90, 90 50"
                fill="none"
                stroke="url(#waveGradient)"
                strokeWidth="14"
                strokeLinecap="round"
              />
              <defs>
                <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#EF5A24" />
                  <stop offset="50%" stopColor="#F5A623" />
                  <stop offset="100%" stopColor="#FBBA16" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span className="font-display font-bold text-xl tracking-tight flex items-center gap-0.5">
            flutterwave<span className="text-brand-accent font-semibold text-xs relative -top-2 px-1 py-0.5 bg-orange-100 rounded text-orange-700">US</span>
          </span>
        </div>

        {/* Desktop Navigation */}
        <nav id="desktop-nav" className="hidden lg:flex items-center gap-8">
          {/* Payments Dropdown */}
          <div 
            className="relative"
            onMouseEnter={() => setActiveDropdown("payments")}
            onMouseLeave={() => setActiveDropdown(null)}
          >
            <button className="flex items-center gap-1 font-medium text-sm hover:text-brand-accent transition-colors py-2">
              Payments <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${activeDropdown === "payments" ? "rotate-180" : ""}`} />
            </button>
            {activeDropdown === "payments" && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 w-[480px] bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-800 p-6 grid grid-cols-2 gap-4 mt-1 transition-all duration-300">
                <div className="col-span-2 pb-2 mb-2 border-b border-gray-100 dark:border-slate-800">
                  <span className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Accept & Send Payments</span>
                </div>
                <div 
                  className="flex gap-3 p-2 hover:bg-orange-50/50 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                  onClick={() => handleNavClick("payments-simulator")}
                >
                  <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg text-brand-accent h-fit">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900 dark:text-slate-100">Checkout Demo</h4>
                    <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5">Simulate global card and mobile money flows.</p>
                  </div>
                </div>
                <div 
                  className="flex gap-3 p-2 hover:bg-orange-50/50 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                  onClick={() => handleNavClick("features-section")}
                >
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400 h-fit">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900 dark:text-slate-100">Global Payouts</h4>
                    <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5">Send bulk transfers directly to banks/wallets.</p>
                  </div>
                </div>
                <div 
                  className="flex gap-3 p-2 hover:bg-orange-50/50 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                  onClick={() => handleNavClick("features-section")}
                >
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400 h-fit">
                    <Store className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900 dark:text-slate-100">Flutterwave Store</h4>
                    <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5">Direct e-commerce storefronts without coding.</p>
                  </div>
                </div>
                <div 
                  className="flex gap-3 p-2 hover:bg-orange-50/50 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                  onClick={() => handleNavClick("security-section")}
                >
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600 dark:text-green-400 h-fit">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900 dark:text-slate-100">Flutterwave Shield</h4>
                    <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5">AI-backed security and transaction protection.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <button 
            onClick={() => handleNavClick("features-section")}
            className="font-medium text-sm hover:text-brand-accent transition-colors py-2"
          >
            Global Reach
          </button>

          <button 
            onClick={() => handleNavClick("analytics-section")}
            className="font-medium text-sm hover:text-brand-accent transition-colors py-2"
          >
            Analytics
          </button>

          <button 
            onClick={() => handleNavClick("gallery-section")}
            className="font-medium text-sm hover:text-brand-accent transition-colors py-2"
          >
            Gallery
          </button>

          <button 
            onClick={() => handleNavClick("developer-section")}
            className="font-medium text-sm hover:text-brand-accent transition-colors py-2"
          >
            Developers
          </button>

          <button 
            onClick={() => handleNavClick("faq-section")}
            className="font-medium text-sm hover:text-brand-accent transition-colors py-2"
          >
            Resources
          </button>

          <button 
            onClick={() => handleNavClick("contact-section")}
            className="font-medium text-sm hover:text-brand-accent transition-colors py-2"
          >
            Pricing & Sales
          </button>
        </nav>

        {/* CTA Buttons */}
        <div id="header-ctas" className="hidden lg:flex items-center gap-4">
          <button 
            onClick={openDemo}
            className="text-sm font-semibold hover:text-brand-accent transition-colors"
          >
            Sign In
          </button>
          <button
            onClick={openDemo}
            className="bg-brand-dark hover:bg-brand-dark/90 text-white font-semibold text-sm px-5 py-2.5 rounded-full transition-all duration-300 flex items-center gap-1.5 shadow-md shadow-brand-dark/10 hover:shadow-lg"
          >
            Create account <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button
          id="mobile-menu-toggle"
          className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer Navigation */}
      {isMobileMenuOpen && (
        <div id="mobile-drawer" className="lg:hidden fixed inset-0 top-[72px] bg-white dark:bg-slate-900 z-40 flex flex-col p-6 animate-fade-in border-t border-gray-100 dark:border-slate-800 overflow-y-auto">
          <div className="flex flex-col gap-6 flex-grow">
            <div>
              <span className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider block mb-3">Products</span>
              <div className="grid grid-cols-1 gap-4">
                <button
                  onClick={() => handleNavClick("payments-simulator")}
                  className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl text-left"
                >
                  <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg text-brand-accent">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900 dark:text-slate-100">Interactive Checkout Demo</h4>
                    <p className="text-[10px] text-gray-500 dark:text-slate-400">Test global payment processing flow</p>
                  </div>
                </button>
                <button
                  onClick={() => handleNavClick("features-section")}
                  className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl text-left"
                >
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900 dark:text-slate-100">Global Transfers & Payouts</h4>
                    <p className="text-[10px] text-gray-500 dark:text-slate-400">Send money instantly across Africa</p>
                  </div>
                </button>
              </div>
            </div>

            <div className="h-[1px] bg-gray-100 dark:bg-slate-800 w-full"></div>

            <div className="flex flex-col gap-4">
              <button 
                onClick={() => handleNavClick("features-section")}
                className="flex items-center justify-between text-base font-semibold text-gray-900 dark:text-slate-100 hover:text-brand-accent p-2"
              >
                <span>Global Reach</span>
                <ArrowRight className="w-4 h-4 text-gray-400 dark:text-slate-500" />
              </button>
              <button 
                onClick={() => handleNavClick("analytics-section")}
                className="flex items-center justify-between text-base font-semibold text-gray-900 dark:text-slate-100 hover:text-brand-accent p-2"
              >
                <span>Analytics</span>
                <ArrowRight className="w-4 h-4 text-gray-400 dark:text-slate-500" />
              </button>
              <button 
                onClick={() => handleNavClick("gallery-section")}
                className="flex items-center justify-between text-base font-semibold text-gray-900 dark:text-slate-100 hover:text-brand-accent p-2"
              >
                <span>Gallery</span>
                <ArrowRight className="w-4 h-4 text-gray-400 dark:text-slate-500" />
              </button>
              <button 
                onClick={() => handleNavClick("developer-section")}
                className="flex items-center justify-between text-base font-semibold text-gray-900 dark:text-slate-100 hover:text-brand-accent p-2"
              >
                <span>Developers</span>
                <ArrowRight className="w-4 h-4 text-gray-400 dark:text-slate-500" />
              </button>
              <button 
                onClick={() => handleNavClick("faq-section")}
                className="flex items-center justify-between text-base font-semibold text-gray-900 dark:text-slate-100 hover:text-brand-accent p-2"
              >
                <span>Resources</span>
                <ArrowRight className="w-4 h-4 text-gray-400 dark:text-slate-500" />
              </button>
              <button 
                onClick={() => handleNavClick("contact-section")}
                className="flex items-center justify-between text-base font-semibold text-gray-900 dark:text-slate-100 hover:text-brand-accent p-2"
              >
                <span>Sales & Pricing</span>
                <ArrowRight className="w-4 h-4 text-gray-400 dark:text-slate-500" />
              </button>
            </div>
          </div>

          {/* Mobile Footer CTAs */}
          <div className="flex flex-col gap-3 mt-8 pb-10">
            <button 
              onClick={openDemo}
              className="w-full text-center py-3 font-semibold text-gray-700 hover:text-brand-accent border border-gray-200 rounded-full text-sm"
            >
              Sign In
            </button>
            <button 
              onClick={openDemo}
              className="w-full text-center py-3 font-semibold bg-brand-dark text-white rounded-full text-sm flex items-center justify-center gap-2 shadow-md"
            >
              Create Account <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
