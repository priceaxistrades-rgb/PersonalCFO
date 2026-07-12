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

  useEffect(() => {
    const timer = setTimeout(() => {
      const stored = localStorage.getItem("cfo-theme");
      const next = migrateTheme(stored);
      setThemeState(next);
      document.documentElement.setAttribute("data-theme", next);
      setHydrated(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    document.documentElement.classList.add("theme-transition");
    document.documentElement.setAttribute("data-theme", t);
    localStorage.setItem("cfo-theme", t);
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
