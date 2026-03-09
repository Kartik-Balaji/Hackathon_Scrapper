"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Theme = "neon" | "icecream";

interface ThemeCtx {
  theme: Theme;
  toggle: () => void;
}

const Ctx = createContext<ThemeCtx>({ theme: "neon", toggle: () => {} });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("neon");

  // Persist across refreshes
  useEffect(() => {
    const saved = localStorage.getItem("theme") as Theme | null;
    if (saved === "neon" || saved === "icecream") setTheme(saved);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme === "icecream" ? "icecream" : "";
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggle = () => setTheme((t) => (t === "neon" ? "icecream" : "neon"));

  return <Ctx.Provider value={{ theme, toggle }}>{children}</Ctx.Provider>;
}

export function useTheme() {
  return useContext(Ctx);
}
