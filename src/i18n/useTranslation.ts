import { useMemo } from "react";
import en from "./locales/en";
import es from "./locales/es";
import type { TranslationSchema } from "./types";

const SUPPORTED: Record<string, TranslationSchema> = { en, es };

function resolve(obj: unknown, path: string): string {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object") return (acc as Record<string, unknown>)[key];
    return undefined;
  }, obj) as string ?? path;
}

function detectLocale(): string {
  const lang = navigator.language?.slice(0, 2).toLowerCase() ?? "en";
  return lang in SUPPORTED ? lang : "en";
}

export function useTranslation() {
  const locale = useMemo(detectLocale, []);
  const dict = SUPPORTED[locale] ?? en;

  const t = (key: string, vars?: Record<string, string | number>): string => {
    let text = resolve(dict, key);
    if (text === key) text = resolve(en, key);
    if (!vars) return text;
    return Object.entries(vars).reduce(
      (acc, [k, v]) => acc.replace(`{{${k}}}`, String(v)),
      text
    );
  };

  return { t, locale };
}