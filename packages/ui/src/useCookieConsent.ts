"use client";

import { useState, useEffect, useCallback } from "react";

export interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  personalization: boolean;
}

const COOKIE_CONSENT_KEY = "arosco_cookie_consent";
const COOKIE_EXPIRY_DAYS = 365;

function setCookie(name: string, value: string, days: number) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function removeCookie(name: string) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
}

const DEFAULT_PREFERENCES: CookiePreferences = {
  necessary: true,
  analytics: false,
  marketing: false,
  personalization: false,
};

export function useCookieConsent() {
  const [preferences, setPreferences] = useState<CookiePreferences>(DEFAULT_PREFERENCES);
  const [hasConsented, setHasConsented] = useState<boolean | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    const stored = getCookie(COOKIE_CONSENT_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as CookiePreferences;
        setPreferences({ ...DEFAULT_PREFERENCES, ...parsed, necessary: true });
        setHasConsented(true);
      } catch {
        setHasConsented(false);
        setShowBanner(true);
      }
    } else {
      setHasConsented(false);
      setShowBanner(true);
    }
  }, []);

  const savePreferences = useCallback((prefs: CookiePreferences) => {
    const finalPrefs = { ...prefs, necessary: true };
    setPreferences(finalPrefs);
    setCookie(COOKIE_CONSENT_KEY, JSON.stringify(finalPrefs), COOKIE_EXPIRY_DAYS);
    setHasConsented(true);
    setShowBanner(false);
    setShowAdvanced(false);
  }, []);

  const acceptAll = useCallback(() => {
    savePreferences({ necessary: true, analytics: true, marketing: true, personalization: true });
  }, [savePreferences]);

  const rejectAll = useCallback(() => {
    savePreferences({ necessary: true, analytics: false, marketing: false, personalization: false });
  }, [savePreferences]);

  const openAdvanced = useCallback(() => {
    setShowAdvanced(true);
  }, []);

  const closeAdvanced = useCallback(() => {
    setShowAdvanced(false);
  }, []);

  const resetConsent = useCallback(() => {
    removeCookie(COOKIE_CONSENT_KEY);
    setPreferences(DEFAULT_PREFERENCES);
    setHasConsented(false);
    setShowBanner(true);
  }, []);

  return {
    preferences,
    hasConsented,
    showBanner,
    showAdvanced,
    acceptAll,
    rejectAll,
    savePreferences,
    openAdvanced,
    closeAdvanced,
    resetConsent,
  };
}
