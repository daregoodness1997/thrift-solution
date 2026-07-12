import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Config — Thrift Solution",
  description: "Configure your white-label settings.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
