// Dev-only daily plate calendar — a single fixed entry mirroring
// MemoryPlatform's mock puzzle (CNT / 1221 / palindrome), enough to
// exercise the endpoints end-to-end. Real authoring workflow (offline
// generation of a year-long calendar + per-triplet word lists) is
// documented in AI_CONTEXT.md decision 1 — not implemented here.

import type { DailyPuzzle } from "../../../shared/types";


const DEV_PUZZLE: DailyPuzzle = {
  consonants: ["C", "N", "T"],
  digits: "1221",
  bonusType: "palindrome",
};

/** Dev stub: same puzzle every day, for every lang. */
export function resolveDailyPuzzle(_lang: string, _todayDaySeed: string): DailyPuzzle {
  return DEV_PUZZLE;
}