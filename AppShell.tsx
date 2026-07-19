"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const PUBLIC_SHELL_PATHS = ["/login", "/signup", "/reset-password", "/privacy", "/terms"];

function isPublicShellPath(pathname: string) {
  return PUBLIC_SHELL_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const publicShell = isPublicShellPath(pathname);

  if (publicShell) {
    return (
      <main id="main-content" role="main" className="min-h-screen overflow-x-hidden app-public-canvas">
        <ErrorBoundary name="Public Page">{children}</ErrorBoundary>
      </main>
    );
  }

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[200] focus:px-5 focus:py-2.5 focus:rounded-xl focus:text-sm focus:font-extrabold shadow-2xl transition-all"
        style={{ background: "var(--primary)", color: "#fff" }}
      >
        Skip to main content
      </a>
      <div className="app-shell flex min-h-screen flex-col lg:flex-row">
        <nav aria-label="Main navigation" className="w-full lg:w-auto">
          <Sidebar />
        </nav>
        <div className="app-content flex-1 min-w-0 min-h-screen overflow-x-hidden" id="main-content" role="main">
          <main className="app-main page-canvas px-4 sm:px-6 md:px-7 lg:px-10 pt-5 sm:pt-7 lg:pt-8 pb-[calc(7.75rem+env(safe-area-inset-bottom))] lg:pb-10 max-w-[1500px] mx-auto w-full">
            <ErrorBoundary name="Main Content">{children}</ErrorBoundary>
          </main>

          {/* Footer with legal links */}
          <footer className="border-t border-white/10 py-6 text-center text-xs text-slate-400">
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-1">
              <a href="/privacy" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="/terms" className="hover:text-white transition-colors">Terms of Service</a>
              <span>© 2026 Personal CFO</span>
            </div>
          </footer>
        </div>
      </div>
      <MobileNav />
    </>
  );
}
