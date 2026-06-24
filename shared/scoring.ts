// shared/scoring.ts
// Pure, dependency-free module — imported by both the game client and the Worker.
// See doc/functional/scoring.md for the formula. Implementation pending.

export type PlateBonusType = "none" | "sum" | "pairs" | "trio" | "quartet" | "palindrome";

export const PLATE_SCORING_BASE_SCORE = 100;

export function calculateAttemptScore(
  wordLength: number,
  digits: string,
  bonusType: PlateBonusType
): number {
  // FIXME: remove this log, it is just to avoid issue regarding unused variables
  console.log(`Pending to implement score calculation (wordLength: ${wordLength} - digits: ${digits} - bonusType: ${bonusType})`);
  // TODO: implement per doc/functional/scoring.md §2-3.
  return 0;
}