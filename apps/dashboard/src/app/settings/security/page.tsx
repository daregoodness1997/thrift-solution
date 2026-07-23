"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Card } from "@thrift/ui";
import { useAuth } from "@/lib/auth-context";
import { Shield, Mail, Lock } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function SecuritySettingsPage() {
  const { user, token } = useAuth();
  const [totpEnabled, setTotpEnabled] = useState(false);
  const [email2faEnabled, setEmail2faEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  // TOTP setup state
  const [totpSetupMode, setTotpSetupMode] = useState(false);
  const [totpSecret, setTotpSecret] = useState("");
  const [totpUri, setTotpUri] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [totpSetupLoading, setTotpSetupLoading] = useState(false);

  // TOTP disable state
  const [totpDisableCode, setTotpDisableCode] = useState("");
  const [totpDisableLoading, setTotpDisableLoading] = useState(false);

  // Email 2FA setup state
  const [email2faSetupMode, setEmail2faSetupMode] = useState(false);
  const [email2faCode, setEmail2faCode] = useState("");
  const [email2faSetupLoading, setEmail2faSetupLoading] = useState(false);
  const [email2faCodeSent, setEmail2faCodeSent] = useState(false);

  // Email 2FA disable state
  const [email2faDisableCode, setEmail2faDisableCode] = useState("");
  const [email2faDisableLoading, setEmail2faDisableLoading] = useState(false);

  const fetchStatus = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.data) {
        setTotpEnabled(!!data.data.twoFactorEnabled && !!data.data.email2faEnabled === false);
        setEmail2faEnabled(!!data.data.email2faEnabled);
        setTotpEnabled(!!(data.data.twoFactorEnabled && !data.data.email2faEnabled));
      }
    } catch {}
    setLoading(false);
  }, [token, API_URL]);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  const handleSetupTotp = async () => {
    setTotpSetupLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/setup-2fa`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.data) {
        setTotpSecret(data.data.secret);
        setTotpUri(data.data.uri);
        setTotpSetupMode(true);
      } else {
        toast.error(data.error || "Failed to set up TOTP");
      }
    } catch {
      toast.error("Network error");
    }
    setTotpSetupLoading(false);
  };

  const handleVerifyTotp = async () => {
    if (!totpCode || totpCode.length !== 6) {
      toast.error("Enter a 6-digit code");
      return;
    }
    setTotpSetupLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/verify-2fa`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ code: totpCode }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("TOTP 2FA enabled successfully");
        setTotpEnabled(true);
        setTotpSetupMode(false);
        setTotpCode("");
        setTotpSecret("");
        setTotpUri("");
      } else {
        toast.error(data.error || "Invalid code");
      }
    } catch {
      toast.error("Network error");
    }
    setTotpSetupLoading(false);
  };

  const handleDisableTotp = async () => {
    if (!totpDisableCode || totpDisableCode.length !== 6) {
      toast.error("Enter a 6-digit code from your authenticator app");
      return;
    }
    setTotpDisableLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/disable-2fa`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ code: totpDisableCode }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("TOTP 2FA disabled");
        setTotpEnabled(false);
        setTotpDisableCode("");
      } else {
        toast.error(data.error || "Invalid code");
      }
    } catch {
      toast.error("Network error");
    }
    setTotpDisableLoading(false);
  };

  const handleSetupEmail2fa = async () => {
    setEmail2faSetupLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/setup-email-2fa`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setEmail2faSetupMode(true);
        setEmail2faCodeSent(true);
        toast.success("Verification code sent to your email");
      } else {
        toast.error(data.error || "Failed to send code");
      }
    } catch {
      toast.error("Network error");
    }
    setEmail2faSetupLoading(false);
  };

  const handleVerifyEmail2fa = async () => {
    if (!email2faCode || email2faCode.length !== 6) {
      toast.error("Enter a 6-digit code");
      return;
    }
    setEmail2faSetupLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/verify-email-2fa`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ code: email2faCode }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Email 2FA enabled successfully");
        setEmail2faEnabled(true);
        setEmail2faSetupMode(false);
        setEmail2faCode("");
      } else {
        toast.error(data.error || "Invalid code");
      }
    } catch {
      toast.error("Network error");
    }
    setEmail2faSetupLoading(false);
  };

  const handleDisableEmail2fa = async () => {
    if (!email2faDisableCode || email2faDisableCode.length !== 6) {
      toast.error("Enter a 6-digit code sent to your email");
      return;
    }
    setEmail2faDisableLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/disable-email-2fa`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ code: email2faDisableCode }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Email 2FA disabled");
        setEmail2faEnabled(false);
        setEmail2faDisableCode("");
      } else {
        toast.error(data.error || "Invalid code");
      }
    } catch {
      toast.error("Network error");
    }
    setEmail2faDisableLoading(false);
  };

  const handleResendEmail2faCode = async () => {
    try {
      const res = await fetch(`${API_URL}/api/auth/send-email-2fa-code`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        toast.success("New code sent to your email");
      } else {
        toast.error(data.error || "Failed to resend code");
      }
    } catch {
      toast.error("Network error");
    }
  };

  if (loading) {
    return (
      <div className="max-w-[900px] mx-auto p-[clamp(1rem,3vw,2rem)]">
        <div className="text-center p-16 text-slate-400 dark:text-slate-500 text-[13px]">Loading security settings...</div>
      </div>
    );
  }

  return (
    <div className="max-w-[900px] mx-auto p-[clamp(1rem,3vw,2rem)]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-blue-500" />
              <span>Security</span>
            </span>
          </div>
          <h3 className="font-display font-bold text-xl sm:text-2xl text-slate-900 dark:text-white mt-1">Security Settings</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">Manage two-factor authentication and account security.</p>
        </div>
      </div>

      {/* Email 2FA Section */}
      <Card padding="1.5rem" className="mb-4 rounded-3xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-100 dark:bg-blue-900/20">
            <Mail className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-slate-900 dark:text-white">Email Two-Factor Authentication</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Receive a verification code via email each time you sign in.</p>
          </div>
        </div>

        {email2faEnabled ? (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <span className="text-[11px] font-medium text-emerald-600">Enabled</span>
            </div>
            {!email2faSetupMode && (
              <div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3">To disable email 2FA, enter the code sent to your email.</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={email2faDisableCode}
                    onChange={(e) => setEmail2faDisableCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="Enter 6-digit code"
                    className="flex-1 max-w-[200px] bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none font-mono"
                  />
                  <button className="btn-secondary py-2 px-4 text-xs !border-red-300 !text-red-500" onClick={handleDisableEmail2fa} disabled={email2faDisableLoading}>
                    {email2faDisableLoading ? "Disabling..." : "Disable"}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div>
            {!email2faSetupMode ? (
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600"></div>
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Not enabled</span>
              </div>
            ) : (
              <div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3">
                  {email2faCodeSent ? `A verification code has been sent to ${user?.email}` : "Click below to send a verification code."}
                </p>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={email2faCode}
                    onChange={(e) => setEmail2faCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="Enter 6-digit code"
                    className="flex-1 max-w-[200px] bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none font-mono"
                  />
                  <button className="btn-primary py-2 px-4 text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-md" onClick={handleVerifyEmail2fa} disabled={email2faSetupLoading}>
                    {email2faSetupLoading ? "Verifying..." : "Verify & Enable"}
                  </button>
                </div>
                <button onClick={handleResendEmail2faCode} className="text-[11px] font-medium cursor-pointer bg-none border-none text-blue-600">
                  Resend code
                </button>
              </div>
            )}
            {!email2faSetupMode && (
              <button className="btn-secondary py-2 px-4 text-xs" onClick={handleSetupEmail2fa} disabled={email2faSetupLoading}>
                {email2faSetupLoading ? "Sending..." : "Enable Email 2FA"}
              </button>
            )}
          </div>
        )}
      </Card>

      {/* TOTP Section */}
      <Card padding="1.5rem" className="mb-4 rounded-3xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-100 dark:bg-blue-900/20">
            <Lock className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-slate-900 dark:text-white">Authenticator App (TOTP)</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Use an authenticator app like Google Authenticator or Authy.</p>
          </div>
        </div>

        {totpEnabled ? (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <span className="text-[11px] font-medium text-emerald-600">Enabled</span>
            </div>
            {!totpSetupMode && (
              <div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3">To disable TOTP, enter a code from your authenticator app.</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={totpDisableCode}
                    onChange={(e) => setTotpDisableCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="Enter 6-digit code"
                    className="flex-1 max-w-[200px] bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none font-mono"
                  />
                  <button className="btn-secondary py-2 px-4 text-xs !border-red-300 !text-red-500" onClick={handleDisableTotp} disabled={totpDisableLoading}>
                    {totpDisableLoading ? "Disabling..." : "Disable"}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div>
            {!totpSetupMode ? (
              <>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600"></div>
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Not enabled</span>
                </div>
                <button className="btn-secondary py-2 px-4 text-xs" onClick={handleSetupTotp} disabled={totpSetupLoading}>
                  {totpSetupLoading ? "Setting up..." : "Set Up Authenticator App"}
                </button>
              </>
            ) : (
              <div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3">
                  Scan this QR code with your authenticator app, or enter the secret key manually.
                </p>
                {totpUri && (
                  <div className="mb-3 p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 inline-block">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(totpUri)}`}
                      alt="TOTP QR Code"
                      width={160}
                      height={160}
                    />
                  </div>
                )}
                {totpSecret && (
                  <div className="mb-3">
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-bold mb-1">Secret Key</p>
                    <code className="block p-2 bg-slate-50 dark:bg-slate-800/60 rounded-lg text-[11px] font-mono text-slate-900 dark:text-white break-all">{totpSecret}</code>
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="Enter 6-digit code"
                    className="flex-1 max-w-[200px] bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none font-mono"
                  />
                  <button className="btn-primary py-2 px-4 text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-md" onClick={handleVerifyTotp} disabled={totpSetupLoading}>
                    {totpSetupLoading ? "Verifying..." : "Verify & Enable"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Info Card */}
      <Card padding="1.5rem" className="mb-4 rounded-3xl">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 w-fit">
            <Shield className="w-3.5 h-3.5 text-blue-500" />
            <span>Info</span>
          </span>
        </div>
        <div className="space-y-2">
          <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
            Two-factor authentication adds an extra layer of security to your account. When enabled, you&apos;ll need to enter a verification code in addition to your password when signing in.
          </p>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
            You can enable both email and authenticator app methods. During sign-in, you&apos;ll be able to choose which method to use.
          </p>
        </div>
      </Card>
    </div>
  );
}
