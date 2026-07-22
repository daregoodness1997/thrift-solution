import type { Metadata } from "next";
import { config } from "@thrift/config";
import { CookieConsent } from "@thrift/ui";
import { Toaster } from "sonner";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ScrollToTop } from "@/components/ScrollToTop";
import { AdUnit } from "@/components/AdUnit";
import { ThemeProvider } from "@/lib/theme-context";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "GFW — Expanding Education, Technology & Economic Opportunity",
    template: "%s | GFW",
  },
  description:
    "Global Freedom Worldwide — expanding access to education, tech training, and economic opportunity so everyone can build secure, independent lives.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon-192x192.png", type: "image/png", sizes: "192x192" },
    ],
    apple: "/apple-touch-icon.png",
  },
  metadataBase: new URL("https://globalfreedomworldwide.com"),
  alternates: {
    canonical: "/",
  },
  verification: {
    google: "SbaVtr26fKd_c3fb_XrcUONDbVeP9LsduQthJJDadUE",
  },
  openGraph: {
    type: "website",
    locale: "en_NG",
    url: "https://globalfreedomworldwide.com",
    siteName: "Global Freedom Worldwide",
    title: "GFW — Expanding Education, Technology & Economic Opportunity",
    description:
      "Expanding access to education, tech training, and economic opportunity so everyone can build secure, independent lives.",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "GFW - Global Freedom Worldwide",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GFW — Expanding Education, Technology & Economic Opportunity",
    description: "Expanding access to education, tech training, and economic opportunity worldwide.",
    images: ["/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {process.env.NEXT_PUBLIC_ADSENSE_PUB_ID && (
          <script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_PUB_ID}`}
            crossOrigin="anonymous"
          />
        )}
      </head>
      <body>
        <ThemeProvider>
          <ScrollToTop />
          <SiteHeader />
          {children}
          {/* <div className="mx-auto max-w-7xl px-4 py-8">
            <AdUnit slot="YOUR_AD_SLOT_ID" />
          </div> */}
          <SiteFooter />
          <CookieConsent />
          <Toaster position="top-right" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
