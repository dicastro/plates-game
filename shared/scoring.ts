// Pure, dependency-free module — imported by both the game client and the Worker.

export type PlateBonusType = "none" | "sum" | "pairs" | "trio" | "quartet" | "palindrome";

export const PLATE_SCORING_BASE_SCORE = 100;
export const PLATE_NUMERIC_BONUS_ENABLED = true;
export const PLATE_NUMERIC_BONUS_MULTIPLIER = 1;
export const PLATE_JACKPOT_PATTERN_MULTIPLIER = 2.0;

// See doc/functional/scoring.md §2-3.
export function calculateAttemptScore(wordLength: number, digits: string, bonusType: PlateBonusType): number {
  const digitSum = digits.split("").reduce((sum, d) => sum + Number(d), 0);
  const baseBonus = PLATE_NUMERIC_BONUS_ENABLED ? digitSum * PLATE_NUMERIC_BONUS_MULTIPLIER : 0;

  // Only the four listed jackpot patterns double the bonus — "sum" is the
  // plain baseline (always-on) bonus, not a jackpot pattern. See the open
  // question flagged below re: PlateHeader.isJackpot() on the client.
  const isJackpotPattern = bonusType === "palindrome" || bonusType === "pairs" || bonusType === "trio" || bonusType === "quartet";
  const plateBonus = isJackpotPattern ? baseBonus * PLATE_JACKPOT_PATTERN_MULTIPLIER : baseBonus;

  return (PLATE_SCORING_BASE_SCORE - wordLength) + plateBonus;
}