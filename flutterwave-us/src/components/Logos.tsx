import { Globe, Shield, ShieldCheck, Zap, Award } from "lucide-react";

export default function Logos() {
  const brands = [
    { name: "Uber", logo: "Uber" },
    { name: "Microsoft", logo: "Microsoft" },
    { name: "Spotify", logo: "Spotify" },
    { name: "MTN", logo: "MTN MoMo" },
    { name: "PiggyVest", logo: "PiggyVest" },
    { name: "Chipper Cash", logo: "Chipper Cash" },
    { name: "SaaS Global", logo: "SaaS Global" },
    { name: "Netflix US", logo: "Netflix" }
  ];

  return (
    <section id="logos-section" className="py-12 bg-white border-y border-gray-100 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <p className="text-center text-xs font-semibold text-gray-400 uppercase tracking-widest mb-8">
          We power checkout and global payouts for forward-thinking enterprises
        </p>
        
        {/* Infinite Loop Marquee */}
        <div className="relative w-full flex items-center overflow-hidden">
          {/* Left/Right Fade Gradient Cover */}
          <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>
          <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"></div>

          <div className="flex gap-20 items-center animate-marquee whitespace-nowrap min-w-full">
            {/* Double the list for seamless loop */}
            {[...brands, ...brands].map((brand, idx) => (
              <div
                key={`${brand.name}-${idx}`}
                className="inline-flex items-center gap-2 text-xl font-display font-extrabold text-gray-300 hover:text-gray-900 transition-colors cursor-pointer"
              >
                {/* Visual Accent corresponding to the brand type */}
                {brand.name === "Uber" && <span className="text-2xl text-black">■</span>}
                {brand.name === "Microsoft" && (
                  <div className="grid grid-cols-2 gap-0.5 w-4 h-4">
                    <span className="bg-red-400 w-1.5 h-1.5"></span>
                    <span className="bg-green-400 w-1.5 h-1.5"></span>
                    <span className="bg-blue-400 w-1.5 h-1.5"></span>
                    <span className="bg-yellow-400 w-1.5 h-1.5"></span>
                  </div>
                )}
                {brand.name === "Spotify" && <span className="text-emerald-500 font-sans text-lg">●</span>}
                {brand.name === "MTN" && <span className="bg-yellow-400 text-black text-[10px] font-bold px-1.5 rounded-full py-0.5">MTN</span>}
                {brand.name === "PiggyVest" && <span className="text-blue-500">▼</span>}
                {brand.name === "Chipper Cash" && <span className="text-purple-500">◆</span>}
                {brand.name === "SaaS Global" && <Globe className="w-5 h-5 text-indigo-400" />}
                {brand.name === "Netflix US" && <span className="text-red-600 font-sans tracking-tighter">N</span>}
                
                <span className="tracking-tight text-gray-400 hover:text-gray-800 transition-colors font-medium text-lg">
                  {brand.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
