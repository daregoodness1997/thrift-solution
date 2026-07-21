"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from "react";
import { fetchDeduped } from "./fetch-cache";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role?: string;
  accountNumber?: string;
  accountTier?: string;
  kycStatus?: string;
  email2faEnabled?: boolean;
  twoFactorEnabled?: boolean;
  registrationFeePaid?: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (identifier: { email?: string; phone?: string }, password: string) => Promise<{ error?: string; data?: any }>;
  register: (data: { email: string; name: string; password: string; referralCode?: string }) => Promise<{ error?: string }>;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_REFRESH_INTERVAL = 14 * 60 * 1000; // 14 minutes (token expires in 15)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const refreshTimeoutRef = useState<{ current: ReturnType<typeof setTimeout> | null }>({ current: null })[0];
  const hasFetchedUserRef = useRef(false);

  const clearRefreshTimer = useCallback(() => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }
  }, [refreshTimeoutRef]);

  const scheduleTokenRefresh = useCallback(() => {
    clearRefreshTimer();
    refreshTimeoutRef.current = setTimeout(async () => {
      const success = await refreshTokenFn();
      if (success) {
        scheduleTokenRefresh();
      }
    }, TOKEN_REFRESH_INTERVAL);
  }, [clearRefreshTimer, refreshTimeoutRef]);

  const refreshTokenFn = useCallback(async (): Promise<boolean> => {
    const storedRefreshToken = localStorage.getItem("refreshToken");
    if (!storedRefreshToken) return false;

    try {
      const res = await fetch(`${API_URL}/api/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: storedRefreshToken }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        const { token: newToken, refreshToken: newRefreshToken } = data.data;
        localStorage.setItem("token", newToken);
        localStorage.setItem("refreshToken", newRefreshToken);
        setToken(newToken);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  const fetchUser = useCallback(async (tk: string) => {
    try {
      const data = await fetchDeduped(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${tk}` },
      }, 60_000);
      if (data.success && data.data) {
        setUser(data.data);
      } else {
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        setToken(null);
        setUser(null);
      }
    } catch {
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      setToken(null);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("token");
    const storedRefreshToken = localStorage.getItem("refreshToken");
    if (stored && !hasFetchedUserRef.current) {
      hasFetchedUserRef.current = true;
      setToken(stored);
      fetchUser(stored).finally(() => setLoading(false));
      if (storedRefreshToken) {
        scheduleTokenRefresh();
      }
    } else if (!stored) {
      setLoading(false);
    }
    return () => clearRefreshTimer();
  }, [fetchUser, scheduleTokenRefresh, clearRefreshTimer]);

  const login = async (identifier: { email?: string; phone?: string }, password: string) => {
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...identifier, password }),
      });
      const data = await res.json();
      if (!data.success) return { error: data.error || "Login failed" };

      const { user: u, token: t, refreshToken: rt, needsVerification, needsPayment, twoFactorRequired } = data.data;

      if (needsVerification || needsPayment || twoFactorRequired) {
        return { data: data.data };
      }

      localStorage.setItem("token", t);
      localStorage.setItem("refreshToken", rt);
      setToken(t);
      setUser(u);
      scheduleTokenRefresh();
      return {};
    } catch {
      return { error: "Network error. Please try again." };
    }
  };

  const register = async (body: { email: string; name: string; password: string; referralCode?: string }) => {
    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!data.success) return { error: data.error || "Registration failed" };

      const { user: u, token: t, refreshToken: rt } = data.data;
      localStorage.setItem("token", t);
      localStorage.setItem("refreshToken", rt);
      setToken(t);
      setUser(u);
      scheduleTokenRefresh();
      return {};
    } catch {
      return { error: "Network error. Please try again." };
    }
  };

  const logout = () => {
    clearRefreshTimer();
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, refreshToken: refreshTokenFn }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
