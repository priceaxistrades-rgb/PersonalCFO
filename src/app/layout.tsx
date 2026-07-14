import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { ThemeProvider } from "@/lib/theme";
import { MemberFilterProvider } from "@/lib/filters";
import { SessionProvider } from "@/lib/session";
import { PrivacyProvider } from "@/lib/privacy";
import { AppShell } from "@/components/AppShell";
import { ClientInit } from "@/components/ClientInit";

export const metadata: Metadata = {
  title: "Personal CFO — Indian Family Financial Planner",
  description: "A complete personal CFO dashboard for Indian households: track income, expenses, investments, debts, taxes, goals and net worth.",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Personal CFO" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#07080c" },
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-theme="obsidian" suppressHydrationWarning className="theme-transition selection:bg-indigo-500/30 selection:text-white">
      <head>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased min-h-screen font-sans selection:bg-indigo-500/20" style={{ color: "var(--text)" }}>
        <ThemeProvider>
          <SessionProvider>
            <PrivacyProvider>
              <MemberFilterProvider>
                <ClientInit />
                <AppShell>{children}</AppShell>
              </MemberFilterProvider>
            </PrivacyProvider>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
