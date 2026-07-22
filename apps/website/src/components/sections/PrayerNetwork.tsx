"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Flame,
  MessageSquare,
  Send,
  CheckCircle2,
  Radio,
  Plus,
  Globe,
  Calendar,
  Volume2,
  VolumeX,
  ExternalLink
} from "lucide-react";
import confetti from "canvas-confetti";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface PrayerRequest {
  id: string;
  authorName: string;
  location: string | null;
  category: string;
  request: string;
  prayersCount: number;
  createdAt: string;
  hasPrayed?: boolean;
}

interface LiveSession {
  id: string;
  title: string;
  description: string | null;
  streamUrl: string | null;
  joinLink: string | null;
  isLive: boolean;
}

interface IntercessoryHour {
  id: string;
  name: string;
  timeUtc: string;
  joinLink: string | null;
  description: string | null;
}

function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} mins ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hour${Math.floor(seconds / 3600) > 1 ? "s" : ""} ago`;
  return `${Math.floor(seconds / 86400)} day${Math.floor(seconds / 86400) > 1 ? "s" : ""} ago`;
}

export const PrayerNetworkSection: React.FC = () => {
  const [prayerList, setPrayerList] = useState<PrayerRequest[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newPrayerName, setNewPrayerName] = useState("");
  const [newPrayerCategory, setNewPrayerCategory] = useState("Academic & Exams");
  const [newPrayerText, setNewPrayerText] = useState("");
  const [submittedSuccess, setSubmittedSuccess] = useState("");
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [loading, setLoading] = useState(true);
  const [liveSession, setLiveSession] = useState<LiveSession | null>(null);
  const [intercessoryHours, setIntercessoryHours] = useState<IntercessoryHour[]>([]);
  const [loadingLive, setLoadingLive] = useState(true);
  const [loadingHours, setLoadingHours] = useState(true);

  const fetchPrayers = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/prayer-requests?limit=10`);
      const data = await res.json();
      if (data.success) {
        setPrayerList(data.data.items.map((p: PrayerRequest) => ({ ...p, hasPrayed: false })));
      }
    } catch (err) {
      console.error("Failed to fetch prayers:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchLiveSession = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/prayer-sessions/live`);
      const data = await res.json();
      if (data.success && data.data) {
        setLiveSession(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch live session:", err);
    } finally {
      setLoadingLive(false);
    }
  }, []);

  const fetchIntercessoryHours = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/intercessory-hours`);
      const data = await res.json();
      if (data.success) {
        setIntercessoryHours(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch intercessory hours:", err);
    } finally {
      setLoadingHours(false);
    }
  }, []);

  useEffect(() => {
    fetchPrayers();
    fetchLiveSession();
    fetchIntercessoryHours();
  }, [fetchPrayers, fetchLiveSession, fetchIntercessoryHours]);

  const handlePray = async (id: string) => {
    const prayer = prayerList.find((p) => p.id === id);
    if (!prayer || prayer.hasPrayed) return;

    try {
      const res = await fetch(`${API_URL}/api/prayer-requests/${id}/pray`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setPrayerList((prev) =>
          prev.map((p) =>
            p.id === id ? { ...p, prayersCount: p.prayersCount + 1, hasPrayed: true } : p
          )
        );
        confetti({ particleCount: 35, spread: 50, origin: { y: 0.8 } });
      }
    } catch (err) {
      console.error("Failed to record prayer:", err);
    }
  };

  const handleAddPrayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPrayerText.trim()) return;

    try {
      const res = await fetch(`${API_URL}/api/prayer-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorName: newPrayerName.trim() || "Anonymous Scholar",
          location: "Global Network",
          category: newPrayerCategory,
          request: newPrayerText,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setPrayerList((prev) => [{ ...data.data, hasPrayed: true }, ...prev]);
        setNewPrayerText("");
        setNewPrayerName("");
        setShowForm(false);
        setSubmittedSuccess("Your prayer request has been broadcast across the Interdenominational Prayer Network!");
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });

        setTimeout(() => setSubmittedSuccess(""), 5000);
      }
    } catch (err) {
      console.error("Failed to submit prayer:", err);
    }
  };

  if (loading) {
    return (
      <section id="prayer-network" className="py-16 sm:py-24 bg-slate-900 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-slate-400 text-sm">Loading prayer network...</div>
        </div>
      </section>
    );
  }

  return (
    <section id="prayer-network" className="py-16 sm:py-24 bg-slate-900 text-white relative overflow-hidden">
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 relative z-10">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold uppercase tracking-wider">
            <Flame className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>INTERDENOMINATIONAL PRAYER NETWORK PLATFORM</span>
          </div>

          <h2 className="font-display font-bold text-3xl sm:text-5xl text-white tracking-tight">
            Uniting Scholars & Intercessors Worldwide
          </h2>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            An inclusive interdenominational fellowship space connecting scholars, mentors, and intercessors across all Christian traditions to support learners through daily prayer, spiritual encouragement, and academic breakthrough.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 rounded-3xl bg-slate-800/80 border border-slate-700/80 backdrop-blur-md">
          <div className="text-center space-y-1">
            <div className="text-2xl sm:text-3xl font-bold font-mono text-amber-400">1,420+</div>
            <div className="text-xs text-slate-300 font-sans">Active Intercessors</div>
          </div>
          <div className="text-center space-y-1">
            <div className="text-2xl sm:text-3xl font-bold font-mono text-emerald-400">8,940+</div>
            <div className="text-xs text-slate-300 font-sans">Prayers Offered</div>
          </div>
          <div className="text-center space-y-1">
            <div className="text-2xl sm:text-3xl font-bold font-mono text-indigo-300">45</div>
            <div className="text-xs text-slate-300 font-sans">Global Prayer Chains</div>
          </div>
          <div className="text-center space-y-1">
            <div className="text-2xl sm:text-3xl font-bold font-mono text-rose-400">100%</div>
            <div className="text-xs text-slate-300 font-sans">Interdenominational Unity</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 space-y-6 bg-slate-800/60 p-6 sm:p-8 rounded-3xl border border-slate-700/80 backdrop-blur-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-700/80">
              <div className="space-y-1">
                <h3 className="font-display font-bold text-xl text-white flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-amber-400" />
                  <span>Live Intercessory Prayer Wall</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Read scholar requests or broadcast your own request to intercessors around the globe.
                </p>
              </div>

              <button
                onClick={() => setShowForm(!showForm)}
                className="py-2.5 px-4 text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shrink-0 shadow-md flex items-center justify-center gap-1.5 rounded-xl transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Submit Prayer Request</span>
              </button>
            </div>

            {submittedSuccess && (
              <div className="p-3.5 rounded-2xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{submittedSuccess}</span>
              </div>
            )}

            {showForm && (
              <form onSubmit={handleAddPrayer} className="p-5 rounded-2xl bg-slate-900 border border-amber-500/40 space-y-3 animate-fade-in">
                <div className="flex justify-between items-center pb-1">
                  <span className="text-xs font-bold text-amber-300 font-display flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-amber-400" />
                    New Interdenominational Prayer Request
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Your Name / Fellowship Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Fellow Grace (Nairobi)"
                      value={newPrayerName}
                      onChange={(e) => setNewPrayerName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Prayer Category
                    </label>
                    <select
                      value={newPrayerCategory}
                      onChange={(e) => setNewPrayerCategory(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="Academic & Exams">Academic & Exams</option>
                      <option value="Micro-Loan & Equipment">Micro-Loan & Equipment</option>
                      <option value="Family & Health">Family & Health</option>
                      <option value="Career Breakthrough">Career Breakthrough</option>
                      <option value="Spiritual Wisdom">Spiritual Wisdom & Peace</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Prayer Request
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={newPrayerText}
                    onChange={(e) => setNewPrayerText(e.target.value)}
                    placeholder="Share your request with fellow intercessors..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 transition-colors shadow-md flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Broadcast Request Across Interdenominational Platform</span>
                </button>
              </form>
            )}

            <div className="space-y-4 max-h-[480px] overflow-y-auto pr-1">
              {prayerList.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-sm">
                  No prayer requests yet. Be the first to submit one!
                </div>
              ) : (
                prayerList.map((item) => (
                  <div
                    key={item.id}
                    className="p-5 rounded-2xl bg-slate-900/90 border border-slate-700/70 hover:border-amber-500/50 transition-all space-y-3"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-500 to-indigo-500 flex items-center justify-center font-bold text-[10px] text-slate-950">
                          {item.authorName.charAt(0)}
                        </div>
                        <div>
                          <span className="font-bold text-white block leading-none">{item.authorName}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{item.location || "Global Network"}</span>
                        </div>
                      </div>

                      <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold border border-amber-500/30">
                        {item.category}
                      </span>
                    </div>

                    <p className="text-xs text-slate-200 leading-relaxed italic">
                      &quot;{item.request}&quot;
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px]">
                      <span className="text-slate-400 font-mono text-[10px]">
                        {timeAgo(item.createdAt)}
                      </span>

                      <button
                        onClick={() => handlePray(item.id)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                          item.hasPrayed
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                            : "bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-white border border-slate-700 shadow-sm"
                        }`}
                      >
                        <Flame className={`w-3.5 h-3.5 ${item.hasPrayed ? "text-amber-400 fill-amber-400" : "text-slate-400"}`} />
                        <span>{item.hasPrayed ? "Prayed" : "I Prayed For This"}</span>
                        <span className="font-mono text-[10px] opacity-80">({item.prayersCount})</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-900 border border-indigo-700/60 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Radio className={`w-4 h-4 animate-pulse ${liveSession?.isLive ? "text-emerald-400" : "text-slate-500"}`} />
                  <span className="text-xs font-bold font-mono text-emerald-300 uppercase tracking-wider">
                    INTERDENOMINATIONAL STREAM
                  </span>
                </div>
                {liveSession?.isLive && (
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold">
                    LIVE NOW
                  </span>
                )}
              </div>

              <div className="space-y-1">
                <h4 className="font-display font-bold text-base text-white">
                  {liveSession?.title || "Global Scholar Intercession Audio Stream"}
                </h4>
                <p className="text-xs text-indigo-200 leading-relaxed">
                  {liveSession?.description || "Join fellows from 32 countries streaming live non-denominational praise, scripture, and student prayer."}
                </p>
              </div>

              {loadingLive ? (
                <div className="w-full py-3 px-4 rounded-2xl bg-slate-800 text-xs font-bold text-slate-400 flex items-center justify-center gap-2">
                  Loading stream...
                </div>
              ) : liveSession?.isLive ? (
                <div className="space-y-2">
                  {liveSession.streamUrl && (
                    <a
                      href={liveSession.streamUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-md"
                    >
                      <Volume2 className="w-4 h-4 animate-bounce" />
                      <span>Watch Live Stream</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                  {liveSession.joinLink && (
                    <a
                      href={liveSession.joinLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-md"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Join Prayer Session</span>
                    </a>
                  )}
                  {!liveSession.streamUrl && !liveSession.joinLink && (
                    <button
                      onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                      className={`w-full py-3 px-4 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-md ${
                        isPlayingAudio
                          ? "bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                          : "bg-indigo-600 hover:bg-indigo-500 text-white"
                      }`}
                    >
                      {isPlayingAudio ? (
                        <>
                          <Volume2 className="w-4 h-4 animate-bounce" />
                          <span>Streaming Intercessory Audio (Active)</span>
                        </>
                      ) : (
                        <>
                          <VolumeX className="w-4 h-4" />
                          <span>Listen Live to Prayer Session</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              ) : (
                <button
                  disabled
                  className="w-full py-3 px-4 rounded-2xl bg-slate-700 text-slate-400 text-xs font-bold flex items-center justify-center gap-2 cursor-not-allowed"
                >
                  <VolumeX className="w-4 h-4" />
                  <span>No Active Session</span>
                </button>
              )}
            </div>

            <div className="p-6 rounded-3xl bg-slate-800/60 border border-slate-700/80 space-y-3">
              <h4 className="font-display font-bold text-sm text-amber-300 flex items-center gap-2">
                <Globe className="w-4 h-4 text-amber-400" />
                <span>Interdenominational Fellowship Principles</span>
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Our prayer network welcomes students from Catholic, Evangelical, Pentecostal, Protestant, Orthodox, and all Christian backgrounds under three core pillars:
              </p>

              <ul className="space-y-2 text-xs text-slate-300 pt-1">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Unity in Purpose:</strong> Mutual support for academic excellence and ethical leadership.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Inclusive Grace:</strong> No denominational barriers or theological debates—focused purely on love and intercession.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Holistic Well-being:</strong> Uplifting student mental health, spiritual peace, and hardware loan success.</span>
                </li>
              </ul>
            </div>

            <div className="p-6 rounded-3xl bg-slate-800/60 border border-slate-700/80 space-y-3">
              <h4 className="font-display font-bold text-sm text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-400" />
                <span>Daily Intercessory Hours</span>
              </h4>

              {loadingHours ? (
                <div className="text-center py-4 text-slate-400 text-xs">Loading schedule...</div>
              ) : intercessoryHours.length === 0 ? (
                <div className="text-center py-4 text-slate-400 text-xs">No scheduled hours yet.</div>
              ) : (
                <div className="space-y-2 text-xs font-mono">
                  {intercessoryHours.map((hour) => (
                    <div
                      key={hour.id}
                      className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center"
                    >
                      <div>
                        <span className="text-amber-300 font-bold block">{hour.timeUtc} UTC</span>
                        <span className="text-[10px] text-slate-400 font-sans">{hour.name}</span>
                        {hour.description && (
                          <span className="text-[9px] text-slate-500 font-sans block">{hour.description}</span>
                        )}
                      </div>
                      {hour.joinLink ? (
                        <a
                          href={hour.joinLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold flex items-center gap-1 transition-colors"
                        >
                          <span>Join</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-[10px] text-slate-400">Global</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
