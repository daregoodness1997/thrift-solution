import React from 'react';
import { ArrowRight, Heart, Sparkles, Globe } from 'lucide-react';
import Link from 'next/link';

export const FinalCTASection: React.FC = () => {
  return (
    <section className="relative py-28 overflow-hidden bg-slate-950 text-white">
      {/* Background Graphic Illustration Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:32px_32px] opacity-15 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/15 rounded-full blur-[160px] pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        
        {/* Top Tag Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-950/80 border border-blue-800 text-blue-300 text-xs font-semibold mb-8 shadow-lg">
          <Globe className="w-4 h-4 text-emerald-400" />
          <span>Education • Opportunity • Empowerment</span>
        </div>

        {/* Headline */}
        <h2 className="space-grotesk font-bold text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-[1.12] mb-6 max-w-4xl mx-auto">
          Help Us Build a World Where <span className="text-blue-400">Everyone</span> Can Thrive.
        </h2>

        {/* Supporting Text */}
        <p className="text-lg sm:text-xl text-slate-300 leading-relaxed max-w-2xl mx-auto mb-10">
          When people gain access to education, technology, and economic opportunity, entire communities are transformed. Join us in expanding what's possible.
        </p>

        {/* Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/donate"
            className="btn-primary px-8 py-4 text-base inline-flex items-center gap-2"
          >
            <span>Start Impacting</span>
            <Heart className="w-4 h-4 fill-white/20 group-hover:scale-110 transition-transform" />
          </Link>

          <Link
            href="/register"
            className="btn-secondary px-8 py-4 text-base text-slate-200 border-slate-700 hover:border-blue-400 hover:text-white inline-flex items-center gap-2"
          >
            Partner With Us
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

      </div>
    </section>
  );
};
