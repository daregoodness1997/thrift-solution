export interface BrandConfig {
  name: string;
  tagline: string;
  logo: string;
  favicon: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textMuted: string;
  };
  contact: {
    email: string;
    phone?: string;
    address?: string;
    website: string;
  };
  socials?: {
    twitter?: string;
    facebook?: string;
    instagram?: string;
    linkedin?: string;
  };
  legal?: {
    privacyPolicy?: string;
    termsOfService?: string;
  };
}

const defaultConfig: BrandConfig = {
  name: "Global Freedom Worldwide",
  tagline:
    "Global Freedom Worldwide — community savings, collective prosperity.",
  logo: "/logo.png",
  favicon: "/favicon.ico",
  colors: {
    primary: "#1D4ED8",
    secondary: "#1E3A8A",
    accent: "#0EA5E9",
    background: "#F5F8FF",
    surface: "#EAF1FB",
    text: "#0B1220",
    textMuted: "#51607A",
  },
  contact: {
    email: "hello@globalfreedomworldwide.com",
    website: "https://app.globalfreedomworldwide.com",
  },
};

function deepMerge(target: any, source: any): any {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (
      source[key] &&
      typeof source[key] === "object" &&
      !Array.isArray(source[key])
    ) {
      result[key] = deepMerge(result[key] || {}, source[key]);
    } else if (source[key] !== undefined) {
      result[key] = source[key];
    }
  }
  return result;
}

export const config: BrandConfig = { ...defaultConfig };

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.API_URL ||
  "http://localhost:4000";

export async function fetchConfig(): Promise<BrandConfig> {
  try {
    const res = await fetch(`${API_URL}/api/config`, { cache: "no-store" });
    if (!res.ok) return config;
    const data = await res.json();
    return deepMerge(config, data);
  } catch {
    return config;
  }
}
