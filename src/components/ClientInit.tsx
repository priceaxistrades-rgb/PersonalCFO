"use client";

import { useEffect } from "react";
import { installGlobalErrorHandlers } from "@/lib/client-logger";
import { GlobalQuickActionModal } from "@/components/QuickActionCenter";

/**
 * One-time client-side initializer.
 * Installs global error handlers, mounts global quick entry modal, and handles client setup.
 * Must be rendered inside <ThemeProvider> for hydration safety.
 */
export function ClientInit() {
  useEffect(() => {
    installGlobalErrorHandlers();
  }, []);
  return <GlobalQuickActionModal />;
}
