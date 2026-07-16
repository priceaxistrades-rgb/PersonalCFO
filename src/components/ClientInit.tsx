"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { installGlobalErrorHandlers } from "@/lib/client-logger";
import { GlobalQuickActionModal } from "@/components/QuickActionCenter";
import { CommandSearchModal } from "@/components/CommandSearchModal";
import { FirstLoginGuide } from "@/components/FirstLoginGuide";

/**
 * One-time client-side initializer.
 * Installs global error handlers, mounts global quick entry and search modals, and handles client setup.
 * Must be rendered inside <ThemeProvider> for hydration safety.
 */
export function ClientInit() {
  const pathname = usePathname();

  useEffect(() => {
    installGlobalErrorHandlers();
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  useEffect(() => {
    document.body.style.overflow = "";
    document.documentElement.style.overflow = "";
    document.body.classList.remove("no-scroll");

    const reset = () => window.scrollTo(0, 0);
    requestAnimationFrame(reset);
    const early = window.setTimeout(reset, 60);
    const late = window.setTimeout(reset, 280);
    return () => {
      window.clearTimeout(early);
      window.clearTimeout(late);
    };
  }, [pathname]);

  return (
    <>
      <FirstLoginGuide />
      <GlobalQuickActionModal />
      <CommandSearchModal />
    </>
  );
}
