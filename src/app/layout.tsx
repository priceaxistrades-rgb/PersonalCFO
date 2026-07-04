import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { ThemeProvider } from "@/lib/theme";
import { MemberFilterProvider } from "@/lib/filters";
import { SessionProvider } from "@/lib/session";
import { PrivacyProvider } from "@/lib/privacy";
import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";

export const metadata: Metadata = {
  title: "Personal CFO — Indian Family Financial Planner",
  description:
    "A complete personal CFO dashboard for Indian households: track income, expenses, investments, debts, taxes, goals and net worth.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Personal CFO",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#4f46e5",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <body className="antialiased" style={{ color: "var(--text)" }}>
        <ThemeProvider>
          <SessionProvider>
            <PrivacyProvider>
              <MemberFilterProvider>
                <div className="flex min-h-screen">
                  <Sidebar />
                  <main className="flex-1 min-w-0 px-3 sm:px-4 lg:px-8 pt-16 lg:pt-6 pb-20 lg:pb-8 max-w-[1500px] mx-auto w-full">
                    {children}
                  </main>
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
