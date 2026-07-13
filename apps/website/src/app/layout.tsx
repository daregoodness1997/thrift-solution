import type { Metadata } from "next";
import { config } from "@thrift/config";
import { ThemeProvider, CookieConsent, Footer } from "@thrift/ui";
import { Toaster } from "sonner";
import { SiteHeader } from "@/components/SiteHeader";
import { ScrollToTop } from "@/components/ScrollToTop";
import "./globals.css";

export const metadata: Metadata = {
  title: config.name,
  description: config.tagline,
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon-192x192.png", type: "image/png", sizes: "192x192" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          <ScrollToTop />
          <SiteHeader />
          {children}
          <Footer
            links={[
              { label: "Terms of Use", href: "#" },
              { label: "Privacy Policy", href: "#" },
              { label: "Contact", href: `mailto:${config.contact.email}` },
            ]}
          />
          <CookieConsent />
          <Toaster position="top-right" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
