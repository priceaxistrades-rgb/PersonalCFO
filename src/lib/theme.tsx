"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type Theme = "obsidian" | "aurora";

const ThemeContext = createContext<{
  theme: Theme;
  setTheme: (t: Theme) => void;
  hydrated: boolean;
}>({ theme: "obsidian", setTheme: () => {}, hydrated: false });

const ALL_THEMES: Theme[] = ["obsidian", "aurora"];

const isTheme = (value: string | null): value is Theme =>
  Boolean(value && ALL_THEMES.includes(value as Theme));

/** Map old theme names to new ones for backward compat */
function migrateTheme(stored: string | null): Theme {
  if (isTheme(stored)) return stored;
  // Legacy mappings — all old/extra themes migrate to either obsidian or aurora
  const map: Record<string, Theme> = {
    light: "aurora",
    dark: "obsidian",
    blue: "obsidian",
    black: "obsidian",
    midnight: "obsidian",
    violet: "obsidian",
    slate: "obsidian",
    contrast: "obsidian",
    emerald: "obsidian",
    rose: "obsidian",
    amber: "obsidian",
    royal: "obsidian",
  };
  return (stored && map[stored]) || "obsidian";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("obsidian");
  const [hydrated, setHydrated] = useState(false);

  const applyTheme = (next: Theme) => {
    document.documentElement.setAttribute("data-theme", next);
    document.body.setAttribute("data-theme", next);
    document.documentElement.style.colorScheme = next === "aurora" ? "light" : "dark";
    const themeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    themeColor?.setAttribute("content", next === "aurora" ? "#f7f6f2" : "#141412");
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      let stored: string | null = null;
      try {
        stored = localStorage.getItem("cfo-theme");
      } catch {
        // Storage can be unavailable in strict mobile privacy modes. The theme
        // still works for the current session through React and DOM state.
      }
      const next = migrateTheme(stored);
      setThemeState(next);
      applyTheme(next);
      setHydrated(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    document.documentElement.classList.add("theme-transition");
    applyTheme(t);
    try {
      localStorage.setItem("cfo-theme", t);
    } catch {
      // Keep the selected theme active for this session even if persistence is
      // blocked by the browser.
    }
    setTimeout(() => {
      document.documentElement.classList.remove("theme-transition");
    }, 350);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, hydrated }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
