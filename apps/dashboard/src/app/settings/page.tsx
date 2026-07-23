"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@thrift/ui";
import type { NotificationPreferences } from "@thrift/types";
import { useAuth } from "@/lib/auth-context";
import { Settings, Shield, Bell, Trash2 } from "lucide-react";
import { fetchNotificationPreferences, updateNotificationPreferences } from "@/lib/notifications";

export default function SettingsPage() {
  const { user, token } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  const fetchProfile = useCallback(async () => {
    if (!token) { setLoading(false); return; }
    try {
      const res = await fetch(`${API_URL}/api/user/profile`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) {
        setName(data.data.name);
        setEmail(data.data.email);
      }
    } catch {}
    setLoading(false);
  }, [token, API_URL]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  useEffect(() => {
    if (!token) return;
    fetchNotificationPreferences().then(setPrefs).catch(() => {});
  }, [token]);

  const handlePref = async (key: "inApp" | "email" | "sms", value: boolean) => {
    if (!prefs) return;
    setPrefs({ ...prefs, [key]: value });
    try {
      const updated = await updateNotificationPreferences({ [key]: value });
      setPrefs(updated);
    } catch {
      setPrefs(prefs);
    }
  };

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (loading) {
    return (
      <div className="max-w-[900px] mx-auto p-[clamp(1rem,3vw,2rem)]">
        <div className="text-center p-16 text-slate-400 dark:text-slate-500 text-[13px]">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="max-w-[900px] mx-auto p-[clamp(1rem,3vw,2rem)]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1">
              <Settings className="w-3.5 h-3.5 text-blue-500" />
              <span>Account</span>
            </span>
          </div>
          <h3 className="font-display font-bold text-xl sm:text-2xl text-slate-900 dark:text-white mt-1">Settings</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">Manage your account preferences and notifications.</p>
        </div>
      </div>

      <Card padding="1.5rem" className="mb-4 rounded-3xl">
        <div className="flex items-center gap-2 mb-4">
          <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 w-fit">
            <Settings className="w-3.5 h-3.5 text-blue-500" />
            <span>Profile</span>
          </span>
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase tracking-[0.1em] text-slate-400 dark:text-slate-500 font-bold">Display Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none font-sans" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase tracking-[0.1em] text-slate-400 dark:text-slate-500 font-bold">Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none font-sans" />
          </div>
        </div>
      </Card>

      <Card padding="1.5rem" className="mb-4 rounded-3xl">
        <div className="flex items-center gap-2 mb-4">
          <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 w-fit">
            <Shield className="w-3.5 h-3.5 text-blue-500" />
            <span>Security</span>
          </span>
        </div>
        <div className="flex justify-between items-center">
          <div>
            <span className="text-xs font-medium text-slate-900 dark:text-white block">Two-Factor Authentication</span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-light">Secure your account with email or authenticator app 2FA.</span>
          </div>
          <a href="/settings/security" className="btn-secondary py-2 px-4 text-xs no-underline">
            Manage
          </a>
        </div>
      </Card>

      <Card padding="1.5rem" className="mb-4 rounded-3xl">
        <div className="flex items-center gap-2 mb-4">
          <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 w-fit">
            <Bell className="w-3.5 h-3.5 text-blue-500" />
            <span>Notifications</span>
          </span>
        </div>
        {prefs ? (
          <div className="flex flex-col">
            <div className="flex justify-between items-center py-3 border-b border-slate-200/80 dark:border-slate-800/80">
              <div>
                <span className="text-xs font-medium text-slate-900 dark:text-white block">In-App Notifications</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-light">See updates inside your dashboard.</span>
              </div>
              <button onClick={() => handlePref("inApp", !prefs.inApp)} aria-label="Toggle in-app notifications" className="w-10 h-[22px] rounded-[11px] border-none relative transition-colors cursor-pointer"
                style={{ backgroundColor: prefs.inApp ? "#2563EB" : "#E5E7EB" }}>
                <div className="w-[18px] h-[18px] rounded-full bg-white absolute top-0.5 shadow" style={{ left: prefs.inApp ? "20px" : "2px", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }} />
              </button>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-slate-200/80 dark:border-slate-800/80">
              <div>
                <span className="text-xs font-medium text-slate-900 dark:text-white block">Email Notifications</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-light">Receive updates about your activity and contributions.</span>
              </div>
              <button onClick={() => handlePref("email", !prefs.email)} aria-label="Toggle email notifications" className="w-10 h-[22px] rounded-[11px] border-none relative transition-colors cursor-pointer"
                style={{ backgroundColor: prefs.email ? "#2563EB" : "#E5E7EB" }}>
                <div className="w-[18px] h-[18px] rounded-full bg-white absolute top-0.5 shadow" style={{ left: prefs.email ? "20px" : "2px", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }} />
              </button>
            </div>
            <div className="flex justify-between items-center py-3">
              <div>
                <span className="text-xs font-medium text-slate-900 dark:text-white block">SMS Alerts</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-light">Get critical alerts sent to your phone.</span>
              </div>
              <button onClick={() => handlePref("sms", !prefs.sms)} aria-label="Toggle SMS alerts" className="w-10 h-[22px] rounded-[11px] border-none relative transition-colors cursor-pointer"
                style={{ backgroundColor: prefs.sms ? "#2563EB" : "#E5E7EB" }}>
                <div className="w-[18px] h-[18px] rounded-full bg-white absolute top-0.5 shadow" style={{ left: prefs.sms ? "20px" : "2px", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }} />
              </button>
            </div>
          </div>
        ) : (
          <div className="text-xs text-slate-400 dark:text-slate-500 py-2">Loading preferences…</div>
        )}
      </Card>

      <Card padding="1.5rem" className="mb-4 rounded-3xl">
        <div className="flex items-center gap-2 mb-4">
          <span className="px-3 py-1 rounded-full bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 w-fit">
            <Trash2 className="w-3.5 h-3.5 text-red-500" />
            <span>Danger Zone</span>
          </span>
        </div>
        <div className="flex justify-between items-center">
          <div>
            <span className="text-xs font-medium text-slate-900 dark:text-white block">Delete Account</span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-light">Permanently delete your account and all associated data.</span>
          </div>
          <button className="btn-secondary py-2 px-4 text-xs !border-red-300 !text-red-500">Delete Account</button>
        </div>
      </Card>

      <div className="flex justify-end gap-3">
        {saved && <span className="text-xs text-emerald-600 font-medium self-center">Settings saved!</span>}
        <button onClick={handleSave} className="btn-primary py-3 px-5 text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-md">Save Changes</button>
      </div>
    </div>
  );
}
