import { createContext, useContext, useLayoutEffect, useState, type ReactNode } from "react";
import type { ResolvedThemeContext } from "./types";
import { ThemeScheduler } from "./ThemeScheduler";
import { timeService } from "../time/timeServiceInstance";

const scheduler = new ThemeScheduler(timeService);

const ThemeContext = createContext<ResolvedThemeContext | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [resolved] = useState<ResolvedThemeContext>(() => scheduler.resolve());

  useLayoutEffect(() => {
    Object.entries(resolved.theme.cssVars).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value);
    });
  }, [resolved]);

  return <ThemeContext.Provider value={resolved}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ResolvedThemeContext {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}