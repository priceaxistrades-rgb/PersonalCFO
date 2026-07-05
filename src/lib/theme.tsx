"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type Theme = "obsidian" | "aurora" | "emerald" | "royal";

const ThemeContext = createContext<{
  theme: Theme;
  setTheme: (t: Theme) => void;
  hydrated: boolean;
}>({ theme: "obsidian", setTheme: () => {}, hydrated: false });

const ALL_THEMES: Theme[] = ["obsidian", "aurora", "emerald", "royal"];

const isTheme = (value: string | null): value is Theme =>
  Boolean(value && ALL_THEMES.includes(value as Theme));

/** Map old theme names to new ones for backward compat */
function migrateTheme(stored: string | null): Theme {
  if (isTheme(stored)) return stored;
  // Legacy mappings
  const map: Record<string, Theme> = {
    light: "aurora",
    dark: "obsidian",
    blue: "emerald",
    black: "royal",
    midnight: "obsidian",
    violet: "obsidian",
    slate: "obsidian",
    contrast: "royal",
    emerald: "emerald",
    rose: "royal",
    amber: "royal",
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
    // Add transition class for smooth theme switching
    document.documentElement.classList.add("theme-transition");
    document.documentElement.setAttribute("data-theme", t);
    localStorage.setItem("cfo-theme", t);
    // Remove transition class after animation completes
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
