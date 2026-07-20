"use client";

import { useState, useEffect, useCallback } from "react";
import { config, BrandConfig } from "@thrift/config";
import { Card, Button } from "@thrift/ui";
import type { NotificationPreferences } from "@thrift/types";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/PageHeader";
import { fetchNotificationPreferences, updateNotificationPreferences } from "@/lib/notifications";

const fallback = config;

export default function SettingsPage() {
  const { user, token } = useAuth();
  const [cfg, setCfg] = useState<BrandConfig>(fallback);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  useEffect(() => {
    fetch(`${API_URL}/api/config`)
      .then((r) => r.json())
      .then((data) => { if (data?.name) setCfg((p) => ({ ...p, ...data })); })
      .catch(() => {});
  }, [API_URL]);

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
        <div className="text-center p-16 text-gray-400 text-[13px]">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="max-w-[900px] mx-auto p-[clamp(1rem,3vw,2rem)]">
      <PageHeader badgeLabel="Account" heading="Settings" description="Manage your account preferences and notifications." />

      <Card padding="1.5rem" className="mb-4">
        <h3 className="text-[9px] uppercase tracking-[0.1em] text-gray-400 font-bold mb-4">Profile Information</h3>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase tracking-[0.1em] text-gray-400 font-bold">Display Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-brand-dark outline-none font-sans" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase tracking-[0.1em] text-gray-400 font-bold">Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-brand-dark outline-none font-sans" />
          </div>
        </div>
      </Card>

      <Card padding="1.5rem" className="mb-4">
        <h3 className="text-[9px] uppercase tracking-[0.1em] text-gray-400 font-bold mb-4">Security</h3>
        <div className="flex justify-between items-center">
          <div>
            <span className="text-xs font-medium text-brand-dark block">Two-Factor Authentication</span>
            <span className="text-[11px] text-gray-500 font-light">Secure your account with email or authenticator app 2FA.</span>
          </div>
          <a href="/settings/security" className="px-4 py-1.5 rounded-full text-[11px] font-semibold cursor-pointer border border-gray-200 bg-white no-underline" style={{ color: config.colors.primary }}>
            Manage
          </a>
        </div>
      </Card>

      <Card padding="1.5rem" className="mb-4">
        <h3 className="text-[9px] uppercase tracking-[0.1em] text-gray-400 font-bold mb-4">Notifications</h3>
        {prefs ? (
          <div className="flex flex-col">
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <div>
                <span className="text-xs font-medium text-brand-dark block">In-App Notifications</span>
                <span className="text-[11px] text-gray-500 font-light">See updates inside your dashboard.</span>
              </div>
              <button onClick={() => handlePref("inApp", !prefs.inApp)} aria-label="Toggle in-app notifications" className="w-10 h-[22px] rounded-[11px] border-none relative transition-colors cursor-pointer"
                style={{ backgroundColor: prefs.inApp ? cfg.colors.primary : "#E5E7EB" }}>
                <div className="w-[18px] h-[18px] rounded-full bg-white absolute top-0.5 shadow" style={{ left: prefs.inApp ? "20px" : "2px", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }} />
              </button>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <div>
                <span className="text-xs font-medium text-brand-dark block">Email Notifications</span>
                <span className="text-[11px] text-gray-500 font-light">Receive updates about your activity and contributions.</span>
              </div>
              <button onClick={() => handlePref("email", !prefs.email)} aria-label="Toggle email notifications" className="w-10 h-[22px] rounded-[11px] border-none relative transition-colors cursor-pointer"
                style={{ backgroundColor: prefs.email ? cfg.colors.primary : "#E5E7EB" }}>
                <div className="w-[18px] h-[18px] rounded-full bg-white absolute top-0.5 shadow" style={{ left: prefs.email ? "20px" : "2px", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }} />
              </button>
            </div>
            <div className="flex justify-between items-center py-3">
              <div>
                <span className="text-xs font-medium text-brand-dark block">SMS Alerts</span>
                <span className="text-[11px] text-gray-500 font-light">Get critical alerts sent to your phone.</span>
              </div>
              <button onClick={() => handlePref("sms", !prefs.sms)} aria-label="Toggle SMS alerts" className="w-10 h-[22px] rounded-[11px] border-none relative transition-colors cursor-pointer"
                style={{ backgroundColor: prefs.sms ? cfg.colors.primary : "#E5E7EB" }}>
                <div className="w-[18px] h-[18px] rounded-full bg-white absolute top-0.5 shadow" style={{ left: prefs.sms ? "20px" : "2px", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }} />
              </button>
            </div>
          </div>
        ) : (
          <div className="text-xs text-gray-400 py-2">Loading preferences…</div>
        )}
      </Card>

      <Card padding="1.5rem" className="mb-4">
        <h3 className="text-[9px] uppercase tracking-[0.1em] text-red-500 font-bold mb-4">Danger Zone</h3>
        <div className="flex justify-between items-center">
          <div>
            <span className="text-xs font-medium text-brand-dark block">Delete Account</span>
            <span className="text-[11px] text-gray-500 font-light">Permanently delete your account and all associated data.</span>
          </div>
          <button className="px-4 py-1.5 rounded-full text-[11px] font-semibold cursor-pointer border border-red-300 bg-white text-red-500">Delete Account</button>
        </div>
      </Card>

      <div className="flex justify-end gap-3">
        {saved && <span className="text-xs text-emerald-600 font-medium self-center">Settings saved!</span>}
        <Button onClick={handleSave}>Save Changes</Button>
      </div>
    </div>
  );
}
