import type { Metadata } from "next";
import { config } from "@thrift/config";
import { ThemeProvider, CookieConsent, Footer } from "@thrift/ui";
import { SiteHeader } from "@/components/SiteHeader";
import { ScrollToTop } from "@/components/ScrollToTop";
import "./globals.css";

export const metadata: Metadata = {
  title: config.name,
  description: config.tagline,
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
        </ThemeProvider>
      </body>
    </html>
  );
}
