"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "@/lib/session";

const GUIDE_STORAGE_PREFIX = "pcfo:user-guide-seen:v1:";
const EXCLUDED_PATHS = new Set(["/guide", "/login", "/signup", "/reset-password", "/privacy", "/terms"]);

/**
 * Sends an authenticated user to the manual once on each browser profile.
 * The marker is namespaced by user ID so multiple accounts sharing a device
 * receive independent onboarding without changing authentication or DB logic.
 */
export function FirstLoginGuide() {
  const { session, loading } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (loading || !session || EXCLUDED_PATHS.has(pathname)) return;

    const storageKey = `${GUIDE_STORAGE_PREFIX}${session.userId}`;
    try {
      if (window.localStorage.getItem(storageKey)) return;
      // Set the marker before navigating to prevent redirect loops if the guide
      // page is interrupted or React effects run twice in development.
      window.localStorage.setItem(storageKey, new Date().toISOString());
      router.replace("/guide?welcome=1");
    } catch {
      // Privacy modes can block localStorage. The product remains fully usable;
      // users can still open the manual from the sidebar or mobile Suite.
    }
  }, [loading, pathname, router, session]);

  return null;
}
