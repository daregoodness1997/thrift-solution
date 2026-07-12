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
  name: "Arosco",
  tagline: "Community savings, collective prosperity.",
  logo: "/logo.svg",
  favicon: "/favicon.ico",
  colors: {
    primary: "#2D5A3D",
    secondary: "#1E3D2A",
    accent: "#B8860B",
    background: "#F8F6F0",
    surface: "#EFEAE0",
    text: "#1A1A1A",
    textMuted: "#5A5A5A",
  },
  contact: {
    email: "hello@arosco.app",
    website: "https://arosco.app",
  },
};

function deepMerge(target: any, source: any): any {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === "object" && !Array.isArray(source[key])) {
      result[key] = deepMerge(result[key] || {}, source[key]);
    } else if (source[key] !== undefined) {
      result[key] = source[key];
    }
  }
  return result;
}

export const config: BrandConfig = { ...defaultConfig };

const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || "http://localhost:4000";

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
