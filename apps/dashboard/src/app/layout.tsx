import type { Metadata } from "next";
import { config } from "@thrift/config";
import { ThemeProvider } from "@thrift/ui";
import { Toaster } from "sonner";
import { AuthProvider } from "@/lib/auth-context";
import { DashboardShell } from "@/components/DashboardShell";
import "./globals.css";

export const metadata: Metadata = {
  title: `${config.name} — Dashboard`,
  description: `Manage your savings with ${config.name}.`,
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
          <AuthProvider>
            <DashboardShell>{children}</DashboardShell>
          </AuthProvider>
          <Toaster position="top-right" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
