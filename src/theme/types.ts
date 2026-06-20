import type { ReactNode } from "react";

/** Full visual identity: colors + optional base logo decoration */
export interface Theme {
  id: string;
  cssVars: Record<string, string>;
  logoBadge?: LogoBadge;
}

/**
 * Lightweight logo overlay, independent of the active theme.
 * Applied on top of whatever theme is currently active.
 */
export interface LogoBadge {
  id: string;
  decoration: ReactNode;
}

/** Resolved output of ThemeScheduler — what ThemeProvider consumes */
export interface ResolvedThemeContext {
  theme: Theme;
  badges: LogoBadge[];
}