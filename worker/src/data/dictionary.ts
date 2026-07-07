import { ES_CNT_WORDS } from "./dictionaries/es.cnt";

export function resolveDictionary(lang: string, consonants: string[]): Set<string> {
  const key = `${lang}.${consonants.join("")}`;
  const registry: Record<string, Set<string>> = { "es.CNT": ES_CNT_WORDS };
  return registry[key] ?? new Set();
}