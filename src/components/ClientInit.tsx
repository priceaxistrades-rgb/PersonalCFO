"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { installGlobalErrorHandlers } from "@/lib/client-logger";
import { GlobalQuickActionModal } from "@/components/QuickActionCenter";
import { CommandSearchModal } from "@/components/CommandSearchModal";

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
    requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0, behavior: "instant" }));
  }, [pathname]);

  return (
    <>
      <GlobalQuickActionModal />
      <CommandSearchModal />
    </>
  );
}
