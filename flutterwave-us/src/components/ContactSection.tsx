import { useState, FormEvent } from "react";
import { Send, CheckCircle2, User, Building, Mail, Globe, ArrowRight, ShieldCheck, RefreshCw } from "lucide-react";

export default function ContactSection() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    companyName: "",
    website: "",
    volume: "10k-50k",
    message: ""
  });

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate server processing
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }, 1500);
  };

  return (
    <section id="contact-section" className="py-20 bg-[#FAF9F6] text-left scroll-mt-20">
      <div className="max-w-7xl mx-auto px-6">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Sales Copy */}
          <div className="lg:col-span-5 text-left">
            <span className="text-xs font-bold text-brand-accent uppercase tracking-widest bg-orange-100/50 px-3 py-1 rounded-full">
              Enterprise Consultation
            </span>
            <h2 className="font-display font-extrabold text-3xl md:text-4xl text-brand-dark mt-4 tracking-tight leading-tight">
              Ready to expand into African markets?
            </h2>
            <p className="text-gray-600 text-xs sm:text-sm leading-relaxed mt-4">
              Our specialized transatlantic compliance, pricing, and infrastructure consulting desks are ready to assist. Contact sales to design custom processing tunnels and enjoy volume discounts.
            </p>

            <div className="space-y-4 mt-8">
              <div className="flex gap-3 items-start text-left">
                <div className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0 mt-0.5">
                  ✓
                </div>
                <div>
                  <h4 className="text-xs font-bold text-brand-dark">Transatlantic Settle Routing</h4>
                  <p className="text-[11px] text-gray-500 mt-0.5">Automated settlement into domestic US accounts.</p>
                </div>
              </div>
              <div className="flex gap-3 items-start text-left">
                <div className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0 mt-0.5">
                  ✓
                </div>
                <div>
                  <h4 className="text-xs font-bold text-brand-dark">Enterprise Compliance Audit</h4>
                  <p className="text-[11px] text-gray-500 mt-0.5">Our US sponsor bank routes keep transitions fully regulated and legal.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Contact Form */}
          <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-xl shadow-gray-100/40 relative">
            
            {isSubmitted ? (
              <div className="py-12 flex flex-col items-center text-center animate-scale-up">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="font-display font-extrabold text-2xl text-brand-dark">Inquiry Submitted!</h3>
                <p className="text-sm text-gray-500 mt-2 max-w-sm">
                  Thank you! An expert from our transatlantic enterprise consulting desk will contact you at <strong>{formData.email}</strong> within two hours.
                </p>
                <button
                  onClick={() => {
                    setIsSubmitted(false);
                    setFormData({ fullName: "", email: "", companyName: "", website: "", volume: "10k-50k", message: "" });
                  }}
                  className="mt-6 text-xs font-bold text-brand-accent hover:text-brand-accent/80 border-b border-brand-accent pb-0.5"
                >
                  Submit another inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="pb-2 border-b border-gray-100 mb-4 flex justify-between items-center">
                  <h3 className="font-display font-bold text-base text-brand-dark">Enterprise Consultation Request</h3>
                  <span className="text-[10px] text-gray-400 font-mono flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-green-500" /> SECURE SSL ENCRYPTION
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Full name */}
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 block mb-1">YOUR FULL NAME</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-3.5 text-gray-400"><User className="w-4 h-4" /></span>
                      <input
                        type="text"
                        required
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-xs text-brand-dark focus:outline-none focus:border-brand-primary"
                        placeholder="John Doe"
                      />
                    </div>
                  </div>

                  {/* Corporate email */}
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 block mb-1">CORPORATE EMAIL</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-3.5 text-gray-400"><Mail className="w-4 h-4" /></span>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-xs text-brand-dark focus:outline-none focus:border-brand-primary"
                        placeholder="john@saas-corporate.com"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Company name */}
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 block mb-1">COMPANY NAME</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-3.5 text-gray-400"><Building className="w-4 h-4" /></span>
                      <input
                        type="text"
                        required
                        value={formData.companyName}
                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-xs text-brand-dark focus:outline-none focus:border-brand-primary"
                        placeholder="SaaS Global Inc."
                      />
                    </div>
                  </div>

                  {/* Company Website */}
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 block mb-1">COMPANY WEBSITE</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-3.5 text-gray-400"><Globe className="w-4 h-4" /></span>
                      <input
                        type="url"
                        required
                        value={formData.website}
                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-xs text-brand-dark focus:outline-none focus:border-brand-primary"
                        placeholder="https://saas-corporate.com"
                      />
                    </div>
                  </div>
                </div>

                {/* Processing volume */}
                <div>
                  <label className="text-[10px] font-bold text-gray-400 block mb-1">ESTIMATED MONTHLY PROCESSING VOLUME (USD)</label>
                  <select
                    value={formData.volume}
                    onChange={(e) => setFormData({ ...formData, volume: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 bg-white rounded-xl px-4 py-3 text-xs text-brand-dark focus:outline-none focus:border-brand-primary"
                  >
                    <option value="under-10k">Under $10,000 USD</option>
                    <option value="10k-50k">$10,000 - $50,000 USD</option>
                    <option value="50k-250k">$50,000 - $250,000 USD</option>
                    <option value="over-250k">Over $250,000 USD</option>
                  </select>
                </div>

                {/* Message */}
                <div>
                  <label className="text-[10px] font-bold text-gray-400 block mb-1">EXPANSION OBJECTIVES & TARGET MARKETS</label>
                  <textarea
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs text-brand-dark focus:outline-none focus:border-brand-primary"
                    placeholder="Briefly describe your expansion target regions (e.g. Kenya, Nigeria, South Africa) and settlement preferences..."
                  ></textarea>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-brand-dark hover:bg-brand-accent text-white font-bold text-xs uppercase tracking-wider py-4 rounded-xl transition-colors flex items-center justify-center gap-2 shadow shadow-brand-dark/10"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Dispatching Request...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" /> Request Custom Pricing Package
                    </>
                  )}
                </button>
              </form>
            )}

          </div>
        </div>

      </div>
    </section>
  );
}
