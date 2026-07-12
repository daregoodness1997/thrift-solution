"use client";

import { useState, useEffect, useCallback } from "react";
import { config, BrandConfig } from "@thrift/config";
import { Card, Button } from "@thrift/ui";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/PageHeader";

const fallback = config;

export default function SettingsPage() {
  const { user, token } = useAuth();
  const [cfg, setCfg] = useState<BrandConfig>(fallback);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [notifications, setNotifications] = useState(true);
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 0", borderBottom: "1px solid #F0F0F0" }}>
          <div>
            <span style={{ fontSize: "12px", fontWeight: 500, color: "#2D2D2D", display: "block" }}>Email Notifications</span>
            <span style={{ fontSize: "11px", color: "#717171", fontWeight: 300 }}>Receive updates about your activity and contributions.</span>
          </div>
          <button onClick={() => setNotifications(!notifications)} style={{ width: "40px", height: "22px", borderRadius: "11px", border: "none", backgroundColor: notifications ? cfg.colors.primary : "#E5E7EB", cursor: "pointer", position: "relative", transition: "background 0.2s" }}>
            <div style={{ width: "18px", height: "18px", borderRadius: "50%", backgroundColor: "#ffffff", position: "absolute", top: "2px", left: notifications ? "20px" : "2px", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }} />
          </button>
        </div>
        <div style={{ padding: "0.75rem 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <span style={{ fontSize: "12px", fontWeight: 500, color: "#2D2D2D", display: "block" }}>Contribution Alerts</span>
              <span style={{ fontSize: "11px", color: "#717171", fontWeight: 300 }}>Get notified when your circles reach new milestones or payouts.</span>
            </div>
            <button style={{ width: "40px", height: "22px", borderRadius: "11px", border: "none", backgroundColor: cfg.colors.primary, cursor: "pointer", position: "relative" }}>
              <div style={{ width: "18px", height: "18px", borderRadius: "50%", backgroundColor: "#ffffff", position: "absolute", top: "2px", left: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }} />
            </button>
          </div>
        </div>
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
