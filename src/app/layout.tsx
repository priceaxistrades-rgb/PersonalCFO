import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { ThemeProvider } from "@/lib/theme";
import { MemberFilterProvider } from "@/lib/filters";
import { SessionProvider } from "@/lib/session";
import { PrivacyProvider } from "@/lib/privacy";
import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";
import { ErrorBoundary } from "@/components/ErrorBoundary";
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
                <a
                  href="#main-content"
                  className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[200] focus:px-5 focus:py-2.5 focus:rounded-xl focus:text-sm focus:font-extrabold shadow-2xl transition-all"
                  style={{ background: "var(--primary)", color: "#fff" }}
                >
                  Skip to main content
                </a>
                <div className="flex min-h-screen">
                  <nav aria-label="Main navigation">
                    <Sidebar />
                  </nav>
                  <div className="flex-1 min-w-0 min-h-screen overflow-x-hidden" id="main-content" role="main">
                    <main className="px-4 sm:px-6 lg:px-10 pt-[4.5rem] lg:pt-8 pb-24 lg:pb-10 max-w-[1500px] mx-auto w-full">
                      <ErrorBoundary name="Main Content">
                        {children}
                      </ErrorBoundary>
                    </main>
                  </div>
                </div>
                <MobileNav />
              </MemberFilterProvider>
            </PrivacyProvider>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
