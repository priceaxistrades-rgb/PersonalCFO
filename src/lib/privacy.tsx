"use client";

import { createContext, ReactNode, useContext, useEffect, useState } from "react";

type PrivacyMode = "global" | "local" | "none";

type PrivacyContextValue = {
  globalHidden: boolean;
  isHidden: (key?: string, mode?: PrivacyMode) => boolean;
  toggle: (key?: string, mode?: PrivacyMode) => void;
  setGlobalHidden: (hidden: boolean) => void;
  mask: (value: string, key?: string, mode?: PrivacyMode) => string;
};

const PrivacyContext = createContext<PrivacyContextValue>({
  globalHidden: false,
  isHidden: () => false,
  toggle: () => {},
  setGlobalHidden: () => {},
  mask: (value) => value,
});

export function PrivacyProvider({ children }: { children: ReactNode }) {
  const [globalHidden, setGlobalHiddenState] = useState(false);
  const [localHidden, setLocalHidden] = useState<Record<string, boolean>>({});
  const [revealedWhileGlobalHidden, setRevealedWhileGlobalHidden] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const timer = setTimeout(() => {
      const stored = localStorage.getItem("pcfo-hide-values");
      setGlobalHiddenState(stored === "1");
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const setGlobalHidden = (next: boolean) => {
    setGlobalHiddenState(next);
    localStorage.setItem("pcfo-hide-values", next ? "1" : "0");
    // Parent control resets children so show-all really shows all, hide-all really hides all.
    setLocalHidden({});
    setRevealedWhileGlobalHidden({});
  };

  const isHidden = (key = "default", mode: PrivacyMode = "local") => {
    if (mode === "none") return false;
    if (mode === "global") return globalHidden;
    if (globalHidden) return !revealedWhileGlobalHidden[key];
    return Boolean(localHidden[key]);
  };

  const toggle = (key = "default", mode: PrivacyMode = "local") => {
    if (mode === "none") return;

    if (mode === "global") {
      setGlobalHidden(!globalHidden);
      return;
    }

    if (globalHidden) {
      setRevealedWhileGlobalHidden((current) => ({
        ...current,
        [key]: !current[key],
      }));
      return;
    }

    setLocalHidden((current) => ({
      ...current,
      [key]: !current[key],
    }));
  };

  const mask = (value: string, key = "default", mode: PrivacyMode = "local") =>
    isHidden(key, mode) ? "**" : value;

  return (
    <PrivacyContext.Provider value={{ globalHidden, isHidden, toggle, setGlobalHidden, mask }}>
      {children}
    </PrivacyContext.Provider>
  );
}

export const usePrivacy = () => useContext(PrivacyContext);
