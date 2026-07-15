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
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "clamp(1rem, 3vw, 2rem)" }}>
        <div style={{ textAlign: "center", padding: "4rem", color: "#999", fontSize: "13px" }}>Loading settings...</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "clamp(1rem, 3vw, 2rem)" }}>
      <PageHeader badgeLabel="Account" heading="Settings" description="Manage your account preferences and notifications." />

      <Card padding="1.5rem" style={{ marginBottom: "1rem" }}>
        <h3 style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#999", fontWeight: 700, marginBottom: "1rem" }}>Profile Information</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
            <label style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#999", fontWeight: 700 }}>Display Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} style={{ backgroundColor: "#FAFAFA", border: "1px solid #EAEAEA", borderRadius: "0.75rem", padding: "0.5rem 0.75rem", fontSize: "12px", color: "#2D2D2D", outline: "none", fontFamily: "inherit" }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
            <label style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#999", fontWeight: 700 }}>Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" style={{ backgroundColor: "#FAFAFA", border: "1px solid #EAEAEA", borderRadius: "0.75rem", padding: "0.5rem 0.75rem", fontSize: "12px", color: "#2D2D2D", outline: "none", fontFamily: "inherit" }} />
          </div>
        </div>
      </Card>

      <Card padding="1.5rem" style={{ marginBottom: "1rem" }}>
        <h3 style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#999", fontWeight: 700, marginBottom: "1rem" }}>Notifications</h3>
        {prefs ? (
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 0", borderBottom: "1px solid #F0F0F0" }}>
              <div>
                <span style={{ fontSize: "12px", fontWeight: 500, color: "#2D2D2D", display: "block" }}>In-App Notifications</span>
                <span style={{ fontSize: "11px", color: "#717171", fontWeight: 300 }}>See updates inside your dashboard.</span>
              </div>
              <button onClick={() => handlePref("inApp", !prefs.inApp)} aria-label="Toggle in-app notifications" style={{ width: "40px", height: "22px", borderRadius: "11px", border: "none", backgroundColor: prefs.inApp ? cfg.colors.primary : "#E5E7EB", cursor: "pointer", position: "relative", transition: "background 0.2s" }}>
                <div style={{ width: "18px", height: "18px", borderRadius: "50%", backgroundColor: "#ffffff", position: "absolute", top: "2px", left: prefs.inApp ? "20px" : "2px", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }} />
              </button>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 0", borderBottom: "1px solid #F0F0F0" }}>
              <div>
                <span style={{ fontSize: "12px", fontWeight: 500, color: "#2D2D2D", display: "block" }}>Email Notifications</span>
                <span style={{ fontSize: "11px", color: "#717171", fontWeight: 300 }}>Receive updates about your activity and contributions.</span>
              </div>
              <button onClick={() => handlePref("email", !prefs.email)} aria-label="Toggle email notifications" style={{ width: "40px", height: "22px", borderRadius: "11px", border: "none", backgroundColor: prefs.email ? cfg.colors.primary : "#E5E7EB", cursor: "pointer", position: "relative", transition: "background 0.2s" }}>
                <div style={{ width: "18px", height: "18px", borderRadius: "50%", backgroundColor: "#ffffff", position: "absolute", top: "2px", left: prefs.email ? "20px" : "2px", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }} />
              </button>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 0" }}>
              <div>
                <span style={{ fontSize: "12px", fontWeight: 500, color: "#2D2D2D", display: "block" }}>SMS Alerts</span>
                <span style={{ fontSize: "11px", color: "#717171", fontWeight: 300 }}>Get critical alerts sent to your phone.</span>
              </div>
              <button onClick={() => handlePref("sms", !prefs.sms)} aria-label="Toggle SMS alerts" style={{ width: "40px", height: "22px", borderRadius: "11px", border: "none", backgroundColor: prefs.sms ? cfg.colors.primary : "#E5E7EB", cursor: "pointer", position: "relative", transition: "background 0.2s" }}>
                <div style={{ width: "18px", height: "18px", borderRadius: "50%", backgroundColor: "#ffffff", position: "absolute", top: "2px", left: prefs.sms ? "20px" : "2px", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }} />
              </button>
            </div>
          </div>
        ) : (
          <div style={{ fontSize: "12px", color: "#999", padding: "0.5rem 0" }}>Loading preferences…</div>
        )}
      </Card>

      <Card padding="1.5rem" style={{ marginBottom: "1rem" }}>
        <h3 style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#EF4444", fontWeight: 700, marginBottom: "1rem" }}>Danger Zone</h3>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <span style={{ fontSize: "12px", fontWeight: 500, color: "#2D2D2D", display: "block" }}>Delete Account</span>
            <span style={{ fontSize: "11px", color: "#717171", fontWeight: 300 }}>Permanently delete your account and all associated data.</span>
          </div>
          <button style={{ padding: "0.375rem 1rem", borderRadius: "9999px", fontSize: "11px", fontWeight: 600, cursor: "pointer", border: "1px solid #FCA5A5", backgroundColor: "#ffffff", color: "#EF4444" }}>Delete Account</button>
        </div>
      </Card>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
        {saved && <span style={{ fontSize: "12px", color: "#059669", fontWeight: 500, alignSelf: "center" }}>Settings saved!</span>}
        <Button onClick={handleSave}>Save Changes</Button>
      </div>
    </div>
  );
}
