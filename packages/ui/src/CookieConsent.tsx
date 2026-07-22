"use client";

import { useState, useEffect, useCallback } from "react";
import { config } from "@thrift/config";
import { useCookieConsent, CookiePreferences } from "./useCookieConsent";

const COOKIE_CATEGORIES = [
  {
    key: "necessary" as const,
    label: "Strictly Necessary",
    description: "Essential cookies that enable core website functionality. These cannot be disabled.",
    required: true,
  },
  {
    key: "analytics" as const,
    label: "Analytics & Performance",
    description: "Help us understand how visitors interact with our website by collecting anonymous usage data.",
    required: false,
  },
  {
    key: "marketing" as const,
    label: "Marketing & Advertising",
    description: "Used to track visitors across websites for displaying relevant advertisements.",
    required: false,
  },
  {
    key: "personalization" as const,
    label: "Personalization",
    description: "Allow the website to remember choices you make and provide enhanced, personalized features.",
    required: false,
  },
] as const;

function useIsDark() {
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains("dark"));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);
  return isDark;
}

const getOverlayStyle = (isDark: boolean): React.CSSProperties => ({
  position: "fixed",
  inset: 0,
  backgroundColor: isDark ? "rgba(0, 0, 0, 0.6)" : "rgba(0, 0, 0, 0.4)",
  backdropFilter: "blur(4px)",
  zIndex: 9998,
});

const getModalStyle = (isDark: boolean): React.CSSProperties => ({
  position: "fixed",
  bottom: "1.5rem",
  left: "50%",
  transform: "translateX(-50%)",
  width: "min(640px, calc(100vw - 2rem))",
  maxHeight: "calc(100vh - 3rem)",
  backgroundColor: isDark ? "#1E293B" : "#ffffff",
  borderRadius: "1rem",
  boxShadow: isDark ? "0 25px 50px -12px rgba(0, 0, 0, 0.4)" : "0 25px 50px -12px rgba(0, 0, 0, 0.15)",
  zIndex: 9999,
  overflow: "hidden",
  fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif",
});

const getBannerStyle = (isDark: boolean): React.CSSProperties => ({
  position: "fixed",
  bottom: 0,
  left: 0,
  right: 0,
  backgroundColor: isDark ? "#1E293B" : "#ffffff",
  borderTop: `1px solid ${isDark ? "#334155" : "#F0F0F0"}`,
  boxShadow: isDark ? "0 -4px 20px rgba(0, 0, 0, 0.3)" : "0 -4px 20px rgba(0, 0, 0, 0.06)",
  zIndex: 9999,
  padding: "1.25rem 2rem",
  fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif",
});

function Toggle({
  checked,
  onChange,
  disabled = false,
}: {
  checked: boolean;
  onChange: (val: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      style={{
        position: "relative",
        width: 40,
        height: 22,
        borderRadius: 11,
        backgroundColor: checked ? config.colors.primary : "#D1D5DB",
        border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "background-color 0.2s ease",
        flexShrink: 0,
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 2,
          left: checked ? 20 : 2,
          width: 18,
          height: 18,
          borderRadius: "50%",
          backgroundColor: "#ffffff",
          transition: "left 0.2s ease",
          boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
        }}
      />
    </button>
  );
}

function AdvancedModal({
  preferences,
  onSave,
  onClose,
}: {
  preferences: CookiePreferences;
  onSave: (prefs: CookiePreferences) => void;
  onClose: () => void;
}) {
  const isDark = useIsDark();
  const [localPrefs, setLocalPrefs] = useState<CookiePreferences>({ ...preferences });
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const handleClose = useCallback(() => {
    setClosing(true);
    setTimeout(() => onClose(), 200);
  }, [onClose]);

  const handleSave = useCallback(() => {
    setClosing(true);
    setTimeout(() => onSave(localPrefs), 200);
  }, [onSave, localPrefs]);

  const toggle = (key: keyof CookiePreferences) => {
    setLocalPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const overlayAnim: React.CSSProperties = {
    opacity: closing ? 0 : visible ? 1 : 0,
    transition: "opacity 0.25s ease",
  };

  const modalAnim: React.CSSProperties = {
    opacity: closing ? 0 : 1,
    transform: closing
      ? "translateX(-50%) translateY(12px) scale(0.97)"
      : visible
        ? "translateX(-50%) translateY(0) scale(1)"
        : "translateX(-50%) translateY(12px) scale(0.97)",
    transition: "opacity 0.25s ease, transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
  };

  return (
    <>
      <div style={{ ...getOverlayStyle(isDark), ...overlayAnim }} onClick={handleClose} />
      <div style={{ ...getModalStyle(isDark), ...modalAnim }}>
        <div style={{ padding: "1.5rem 1.5rem 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: 600, color: isDark ? "#F5F8FF" : "#1A1A1A", margin: 0, letterSpacing: "-0.02em" }}>
                Cookie Preferences
              </h3>
              <p style={{ fontSize: "12px", color: isDark ? "#94A3B8" : "#717171", margin: "0.375rem 0 0", lineHeight: 1.5 }}>
                Manage how we use cookies on this site.
              </p>
            </div>
            <button
              onClick={handleClose}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "0.25rem",
                color: isDark ? "#64748B" : "#999",
                fontSize: "18px",
                lineHeight: 1,
                borderRadius: "0.25rem",
                transition: "color 0.2s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = isDark ? "#F5F8FF" : "#1A1A1A")}
              onMouseLeave={(e) => (e.currentTarget.style.color = isDark ? "#64748B" : "#999")}
              aria-label="Close"
            >
              &#x2715;
            </button>
          </div>
        </div>

        <div style={{ padding: "0 1.5rem", maxHeight: "50vh", overflowY: "auto" }}>
          {COOKIE_CATEGORIES.map((cat, i) => (
            <div
              key={cat.key}
              style={{
                padding: "1rem 0",
                borderBottom: `1px solid ${isDark ? "#334155" : "#F5F5F5"}`,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: "1rem",
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(6px)",
                transition: `opacity 0.3s ease ${0.05 + i * 0.04}s, transform 0.3s ease ${0.05 + i * 0.04}s`,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                  <span style={{ fontSize: "13px", fontWeight: 600, color: isDark ? "#F5F8FF" : "#1A1A1A" }}>{cat.label}</span>
                  {cat.required && (
                    <span
                      style={{
                        fontSize: "9px",
                        fontWeight: 600,
                        color: config.colors.primary,
                        backgroundColor: `${config.colors.primary}10`,
                        padding: "0.125rem 0.375rem",
                        borderRadius: "0.25rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      Always On
                    </span>
                  )}
                </div>
                <p style={{ fontSize: "11px", color: isDark ? "#94A3B8" : "#717171", margin: 0, lineHeight: 1.6 }}>{cat.description}</p>
              </div>
              <Toggle checked={localPrefs[cat.key]} onChange={() => toggle(cat.key)} disabled={cat.required} />
            </div>
          ))}
        </div>

        <div style={{ padding: "1.25rem 1.5rem", borderTop: `1px solid ${isDark ? "#334155" : "#F0F0F0"}`, display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
          <button
            onClick={handleClose}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "0.5rem",
              border: `1px solid ${isDark ? "#475569" : "#E5E7EB"}`,
              backgroundColor: isDark ? "#0F172A" : "#ffffff",
              color: isDark ? "#CBD5E1" : "#374151",
              fontSize: "12px",
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = isDark ? "#1E293B" : "#F9FAFB";
              e.currentTarget.style.borderColor = isDark ? "#64748B" : "#D1D5DB";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = isDark ? "#0F172A" : "#ffffff";
              e.currentTarget.style.borderColor = isDark ? "#475569" : "#E5E7EB";
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: "0.5rem 1.25rem",
              borderRadius: "0.5rem",
              border: "none",
              backgroundColor: config.colors.primary,
              color: "#ffffff",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = "0.9";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = "1";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            Save Preferences
          </button>
        </div>
      </div>
    </>
  );
}

export function CookieConsent() {
  const isDark = useIsDark();
  const {
    preferences,
    showBanner,
    showAdvanced,
    acceptAll,
    rejectAll,
    savePreferences,
    openAdvanced,
    closeAdvanced,
  } = useCookieConsent();

  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (showBanner && !mounted) {
      setMounted(true);
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
    }
  }, [showBanner, mounted]);

  const handleClose = useCallback(() => {
    setClosing(true);
    setTimeout(() => {
      setVisible(false);
      setMounted(false);
      setClosing(false);
    }, 300);
  }, []);

  const handleAccept = useCallback(() => {
    handleClose();
    setTimeout(() => acceptAll(), 300);
  }, [handleClose, acceptAll]);

  const handleReject = useCallback(() => {
    handleClose();
    setTimeout(() => rejectAll(), 300);
  }, [handleClose, rejectAll]);

  const handleOpenAdvanced = useCallback(() => {
    handleClose();
    setTimeout(() => openAdvanced(), 300);
  }, [handleClose, openAdvanced]);

  if (!mounted) return null;

  const bannerAnim: React.CSSProperties = {
    transform: closing ? "translateY(100%)" : visible ? "translateY(0)" : "translateY(100%)",
    opacity: closing ? 0 : visible ? 1 : 0,
    transition: "transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease",
  };

  return (
    <>
      <div style={{ ...getBannerStyle(isDark), ...bannerAnim }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "2rem", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: "280px" }}>
            <p style={{ fontSize: "13px", color: isDark ? "#CBD5E1" : "#374151", margin: 0, lineHeight: 1.6 }}>
              We use cookies to enhance your experience, analyze site traffic, and personalize content.{" "}
              <button
                onClick={handleOpenAdvanced}
                style={{
                  background: "none",
                  border: "none",
                  color: config.colors.primary,
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                  textDecoration: "underline",
                  textUnderlineOffset: "2px",
                  padding: 0,
                }}
              >
                Customize settings
              </button>
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0, flexWrap: "wrap" }}>
            <button
              onClick={handleReject}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "0.5rem",
                border: `1px solid ${isDark ? "#475569" : "#E5E7EB"}`,
                backgroundColor: isDark ? "#0F172A" : "#ffffff",
                color: isDark ? "#CBD5E1" : "#374151",
                fontSize: "12px",
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = isDark ? "#1E293B" : "#F9FAFB";
                e.currentTarget.style.borderColor = isDark ? "#64748B" : "#D1D5DB";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = isDark ? "#0F172A" : "#ffffff";
                e.currentTarget.style.borderColor = isDark ? "#475569" : "#E5E7EB";
              }}
            >
              Reject All
            </button>
            <button
              onClick={handleOpenAdvanced}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "0.5rem",
                border: `1px solid ${config.colors.primary}30`,
                backgroundColor: isDark ? "#0F172A" : "#ffffff",
                color: config.colors.primary,
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = `${config.colors.primary}08`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = isDark ? "#0F172A" : "#ffffff";
              }}
            >
              Manage
            </button>
            <button
              onClick={handleAccept}
              style={{
                padding: "0.5rem 1.25rem",
                borderRadius: "0.5rem",
                border: "none",
                backgroundColor: config.colors.primary,
                color: "#ffffff",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = "0.9";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = "1";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              Accept All
            </button>
          </div>
        </div>
      </div>

      {showAdvanced && (
        <AdvancedModal
          preferences={preferences}
          onSave={savePreferences}
          onClose={closeAdvanced}
        />
      )}
    </>
  );
}
