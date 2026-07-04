"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type Theme = "light" | "dark" | "blue" | "black";

const ThemeContext = createContext<{
  theme: Theme;
  setTheme: (t: Theme) => void;
  hydrated: boolean;
}>({ theme: "light", setTheme: () => {}, hydrated: false });

const isTheme = (value: string | null): value is Theme =>
  Boolean(value && ["light", "dark", "blue", "black"].includes(value));

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      const stored = localStorage.getItem("cfo-theme");
      const next = isTheme(stored) ? stored : "light";
      setThemeState(next);
      document.documentElement.setAttribute("data-theme", next);
      setHydrated(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    document.documentElement.setAttribute("data-theme", t);
    localStorage.setItem("cfo-theme", t);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, hydrated }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
