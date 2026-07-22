"use client";

import { useState, useRef, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Quote,
  Sparkles,
  CheckCircle2,
  Image as ImageIcon,
  Clock,
  ArrowRight,
  X,
  Award,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface GalleryPhoto {
  id: string;
  url: string;
  caption: string;
  tag: string;
}

interface TimelineMilestone {
  id: string;
  year: string;
  title: string;
  description: string;
  tag: string;
  status: "completed" | "current";
}

interface LearnerNarrative {
  id: string;
  name: string;
  age: number;
  country: string;
  countryCode: string;
  role: string;
  cohort: string;
  avatarUrl: string;
  coverImageUrl: string;
  headlineQuote: string;
  impactMetric: string;
  impactLabel: string;
  longFormNarrative: string[];
  gallery: GalleryPhoto[];
  timeline: TimelineMilestone[];
}

export function ImpactSpotlightSection() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [learners, setLearners] = useState<LearnerNarrative[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeModalLearner, setActiveModalLearner] =
    useState<LearnerNarrative | null>(null);
  const [activePhoto, setActivePhoto] = useState<GalleryPhoto | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`${API_URL}/api/impact/narratives`);
        const data = await res.json();
        if (data.success) setLearners(data.data || []);
      } catch (err) {
        console.error("Failed to fetch impact data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = direction === "left" ? -420 : 420;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  if (loading) {
    return (
      <section className="py-24 bg-slate-50 dark:bg-slate-950 transition-colors relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-16 text-center text-[13px] text-gray-500">
            Loading impact stories...
          </div>
        </div>
      </section>
    );
  }

  if (learners.length === 0) return null;

  return (
    <section
      id="impact-spotlight-carousel"
      className="py-24 bg-slate-50 dark:bg-slate-950 transition-colors relative overflow-hidden"
    >
      <div className="absolute top-10 left-0 w-72 h-72 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-10 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Interactive Long-Form Impact Narratives</span>
            </div>
            <h2 className="font-bold text-3xl sm:text-5xl text-slate-900 dark:text-white tracking-tight">
              Impact Spotlight:{" "}
              <span className="text-blue-600 dark:text-blue-400">
                Human Stories of Resilience
              </span>
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mt-2 max-w-2xl">
              Scroll horizontally to explore deep-dive personal journeys, photo
              galleries, and milestone timelines of scholars transforming their
              communities.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => scroll("left")}
              className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-500 shadow-sm transition-all flex items-center justify-center active:scale-95"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={() => scroll("right")}
              className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-500 shadow-sm transition-all flex items-center justify-center active:scale-95"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div
          ref={scrollRef}
          className="flex gap-6 overflow-x-auto pb-8 pt-2 snap-x snap-mandatory no-scrollbar scroll-smooth"
        >
          {learners.map((learner) => (
            <div
              key={learner.id}
              className="snap-start shrink-0 w-[340px] sm:w-[420px] lg:w-[460px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                <div className="relative h-56 sm:h-64 overflow-hidden">
                  <img
                    src={learner.coverImageUrl}
                    alt={learner.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

                  <div className="absolute top-4 left-4 flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-slate-900/80 border border-slate-700 text-white text-xs font-bold backdrop-blur-md">
                      {learner.countryCode} {learner.country}
                    </span>
                  </div>

                  <div className="absolute top-4 right-4">
                    <span className="px-2.5 py-1 rounded-full bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider shadow-md">
                      {learner.cohort.split("#")[0]}
                    </span>
                  </div>

                  <div className="absolute bottom-4 left-4 right-4 flex items-center gap-3">
                    <img
                      src={learner.avatarUrl}
                      alt={learner.name}
                      className="w-12 h-12 rounded-2xl object-cover border-2 border-white shadow-lg shrink-0"
                    />
                    <div className="text-white overflow-hidden">
                      <h3 className="font-bold text-lg leading-tight truncate">
                        {learner.name}
                      </h3>
                      <p className="text-xs text-blue-200 truncate">
                        {learner.role}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-5">
                  <div className="relative pl-4 border-l-2 border-blue-500">
                    <p className="text-xs sm:text-sm font-medium italic text-slate-700 dark:text-slate-300 leading-relaxed">
                      "{learner.headlineQuote}"
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                      <Award className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-lg text-slate-900 dark:text-white leading-tight">
                        {learner.impactMetric}
                      </div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                        {learner.impactLabel}
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                      <span className="flex items-center gap-1.5">
                        <ImageIcon className="w-3.5 h-3.5 text-blue-500" />
                        <span>
                          Photo Field Gallery ({learner.gallery.length})
                        </span>
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Click to view
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {learner.gallery.map((photo, pIdx) => (
                        <div
                          key={photo.id}
                          onClick={() => setActivePhoto(photo)}
                          className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 cursor-pointer group/photo"
                        >
                          <img
                            src={photo.url}
                            alt={photo.caption}
                            className="w-full h-full object-cover group-hover/photo:scale-110 transition-transform"
                          />
                          <div className="absolute inset-0 bg-slate-900/20 group-hover/photo:bg-transparent transition-colors" />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Milestone Progress Timeline</span>
                      </span>
                    </div>

                    <div className="space-y-2">
                      {learner.timeline.slice(0, 2).map((ms) => (
                        <div
                          key={ms.id}
                          className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs flex items-center justify-between gap-2"
                        >
                          <div className="overflow-hidden">
                            <span className="font-bold text-blue-600 dark:text-blue-400 mr-1.5">
                              {ms.year}:
                            </span>
                            <span className="text-slate-800 dark:text-slate-200 font-medium truncate">
                              {ms.title}
                            </span>
                          </div>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 pt-0">
                <button
                  onClick={() => setActiveModalLearner(learner)}
                  className="w-full text-xs py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <span>Read Full Long-Form Narrative</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {activeModalLearner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn overflow-y-auto">
          <div
            className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative h-64 bg-slate-900 shrink-0 overflow-hidden">
              <img
                src={activeModalLearner.coverImageUrl}
                alt={activeModalLearner.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />

              <button
                onClick={() => setActiveModalLearner(null)}
                className="absolute top-4 right-4 p-2.5 rounded-full bg-slate-950/80 hover:bg-slate-900 text-white transition-colors border border-slate-700"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
                <div className="flex items-center gap-4">
                  <img
                    src={activeModalLearner.avatarUrl}
                    alt={activeModalLearner.name}
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-blue-500 shadow-xl shrink-0"
                  />
                  <div className="text-white">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-bold mb-1">
                      {activeModalLearner.countryCode}{" "}
                      {activeModalLearner.country}
                    </div>
                    <h3 className="font-bold text-2xl text-white leading-tight">
                      {activeModalLearner.name}
                    </h3>
                    <p className="text-xs text-blue-200">
                      {activeModalLearner.role}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-8 overflow-y-auto space-y-8 flex-1">
              <div className="p-5 rounded-2xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900">
                <Quote className="w-6 h-6 text-blue-600 dark:text-blue-400 mb-2" />
                <p className="font-bold text-base sm:text-lg text-slate-900 dark:text-white leading-relaxed">
                  "{activeModalLearner.headlineQuote}"
                </p>
              </div>

              <div className="space-y-4">
                <h4 className="font-bold text-lg text-slate-900 dark:text-white">
                  The Journey & Community Impact
                </h4>
                {activeModalLearner.longFormNarrative.map((para, pIdx) => (
                  <p
                    key={pIdx}
                    className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal"
                  >
                    {para}
                  </p>
                ))}
              </div>

              <div>
                <h4 className="font-bold text-lg text-slate-900 dark:text-white mb-3">
                  Photo Documentation Gallery
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {activeModalLearner.gallery.map((img) => (
                    <div
                      key={img.id}
                      onClick={() => setActivePhoto(img)}
                      className="group cursor-pointer rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800"
                    >
                      <div className="aspect-video relative overflow-hidden">
                        <img
                          src={img.url}
                          alt={img.caption}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-slate-900/80 text-[10px] font-bold text-white">
                          {img.tag}
                        </span>
                      </div>
                      <p className="p-2.5 text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
                        {img.caption}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-bold text-lg text-slate-900 dark:text-white mb-4">
                  Full Transformation Timeline
                </h4>
                <div className="relative pl-6 border-l-2 border-blue-500/30 space-y-6">
                  {activeModalLearner.timeline.map((ms) => (
                    <div key={ms.id} className="relative">
                      <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-blue-600 border-2 border-white dark:border-slate-900" />
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-xs text-blue-600 dark:text-blue-400">
                          {ms.year}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                          {ms.tag}
                        </span>
                      </div>
                      <h5 className="font-bold text-sm text-slate-900 dark:text-white">
                        {ms.title}
                      </h5>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                        {ms.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs shrink-0">
              <span className="text-slate-500">
                GFW Story Archive • Verified Case Study
              </span>
              <button
                onClick={() => setActiveModalLearner(null)}
                className="py-2 px-5 text-xs rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors"
              >
                Close Narrative
              </button>
            </div>
          </div>
        </div>
      )}

      {activePhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-lg animate-fadeIn"
          onClick={() => setActivePhoto(null)}
        >
          <div
            className="relative max-w-3xl w-full bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden p-4 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setActivePhoto(null)}
              className="absolute top-6 right-6 p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-white transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black">
              <img
                src={activePhoto.url}
                alt={activePhoto.caption}
                className="w-full h-full object-contain"
              />
            </div>

            <div className="p-2">
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider mb-2">
                {activePhoto.tag}
              </span>
              <p className="text-sm font-medium text-slate-200">
                {activePhoto.caption}
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
