"use client";

import { useEffect } from "react";
import { installGlobalErrorHandlers } from "@/lib/client-logger";

/**
 * One-time client-side initializer.
 * Installs global error handlers and other client-only setup.
 * Must be rendered inside <ThemeProvider> for hydration safety.
 */
export function ClientInit() {
  useEffect(() => {
    installGlobalErrorHandlers();
  }, []);
  return null;
}
