import React from 'react';
import { ArrowRight, Users, Award, Globe } from 'lucide-react';
import Link from 'next/link';
import { HeroGlobe } from './HeroGlobe';
import { QuickSkillQuizWidget } from './QuickSkillQuizWidget';

const DASHBOARD_URL =
  process.env.NEXT_PUBLIC_DASHBOARD_URL ||
  'https://app.globalfreedomworldwide.com';

type ThemeMode = 'light' | 'dark';

interface HeroSectionProps {
  theme: ThemeMode;
  onOpenImpactModal: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  theme,
  onOpenImpactModal,
}) => {
  const isDark = theme === 'dark';

  return (
    <section className="relative min-h-screen pt-28 pb-20 md:pt-36 md:pb-28 overflow-hidden flex items-center justify-center bg-mesh transition-colors">
      {/* Background Lighting Blobs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/10 dark:bg-blue-600/15 rounded-full blur-[120px] pointer-events-none animate-pulse-glow" />
      <div className="absolute top-1/3 right-10 w-[400px] h-[400px] bg-indigo-500/10 dark:bg-indigo-600/15 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[350px] h-[350px] bg-emerald-500/10 dark:bg-emerald-600/15 rounded-full blur-[90px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Hero Column */}
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            {/* Mission Tag Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800/80 text-blue-600 dark:text-blue-400 text-xs font-semibold mb-6 shadow-sm">
              <span className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-pulse" />
              <span>Expanding Opportunity Worldwide</span>
            </div>

            {/* Headline */}
            <h1 className="space-grotesk font-bold text-4xl sm:text-6xl lg:text-7xl tracking-tight text-slate-900 dark:text-white leading-[1.05] mb-6">
              A World Where Everyone Has the{' '}
              <span className="text-blue-600 dark:text-blue-400">
                Freedom
              </span>{' '}
              to Learn and Thrive.
            </h1>

            {/* Supporting Text */}
            <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 font-normal leading-relaxed mb-8 max-w-xl">
              We believe people everywhere should have access to quality training, financial opportunities, and the tools they need to build secure, independent lives.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-3.5 w-full sm:w-auto mb-8">
              <Link
                href="/donate"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-base font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/25 transition-all duration-300 hover:-translate-y-0.5 w-full sm:w-auto justify-center"
              >
                <span>Support Our Mission</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href={`${DASHBOARD_URL}/register`}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-base font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 shadow-sm transition-all duration-300 hover:-translate-y-0.5 w-full sm:w-auto justify-center"
              >
                <span>Partner With Us</span>
              </Link>
            </div>

            {/* Quick Skill Assessment Interactive Widget */}
            <div className="w-full mb-8">
              <QuickSkillQuizWidget />
            </div>

            {/* Social Proof Avatar Stack & Stats */}
            <div className="pt-6 border-t border-slate-200/80 dark:border-slate-800/80 flex flex-wrap items-center gap-6 w-full">
              <div className="flex -space-x-2.5">
                <div className="w-9 h-9 rounded-full border-2 border-white dark:border-slate-900 bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold shadow-sm">
                  EK
                </div>
                <div className="w-9 h-9 rounded-full border-2 border-white dark:border-slate-900 bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold shadow-sm">
                  AM
                </div>
                <div className="w-9 h-9 rounded-full border-2 border-white dark:border-slate-900 bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold shadow-sm">
                  RJ
                </div>
                <div className="w-9 h-9 rounded-full border-2 border-white dark:border-slate-900 bg-slate-200 text-slate-800 flex items-center justify-center text-xs font-bold shadow-sm">
                  +12k
                </div>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                Joined by over <span className="text-slate-900 dark:text-white font-bold">12,000+</span> individuals this month
              </p>
            </div>
          </div>

          {/* Right Column: Globe & Floating Glass UI Cards */}
          <div className="lg:col-span-5 relative flex items-center justify-center">
            {/* 3D Interactive Canvas Globe */}
            <div className="w-full h-[450px] sm:h-[520px] relative">
              <HeroGlobe isDark={isDark} />

              {/* Floating Glass Badge 1: Live Activity */}
              <div className="absolute top-6 left-0 sm:-left-4 max-w-[230px] p-3.5 rounded-2xl glass shadow-xl border border-white/80 dark:border-slate-700/80 animate-float hidden sm:block">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold space-grotesk text-slate-900 dark:text-white">Nairobi Innovation Hub</div>
                    <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">+1,420 Active Learners</div>
                  </div>
                </div>
              </div>

              {/* Floating Glass Badge 2: Tech Grant */}
              <div
                className="absolute bottom-12 right-0 sm:-right-4 max-w-[240px] p-3.5 rounded-2xl glass shadow-xl border border-white/80 dark:border-slate-700/80 animate-float hidden sm:block"
                style={{ animationDelay: '2s' }}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/80 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold space-grotesk text-slate-900 dark:text-white">STEM Scholarship #402</div>
                    <div className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">Fully Funded by Coalition</div>
                  </div>
                </div>
              </div>

              {/* Floating Glass Badge 3: Global Impact */}
              <div
                className="absolute top-1/2 -right-6 -translate-y-1/2 p-3 rounded-2xl glass shadow-lg border border-white/80 dark:border-slate-700/80 hidden lg:flex items-center gap-2.5"
                style={{ animationDelay: '4s' }}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-xs font-bold space-grotesk text-slate-800 dark:text-slate-200">
                  Global Sync Active
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
