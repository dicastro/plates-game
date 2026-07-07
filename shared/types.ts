// Pure, dependency-free module — the actual wire contract between the game
// client and the Worker. PlayerDO's route-facing methods declare these as
// explicit return types (not inferred object literals) so any mismatch
// between what the Worker returns and what the client expects is a
// compile-time error in the Worker itself, not a silent runtime drift.

import type { PlateBonusType } from "./scoring";

export type AuthProviderId = "google";

export interface AttemptRecord {
  word: string;
  valid: boolean;
  score: number;
}

export interface PlayerProfile {
  alias: string;
  country: string;
  dailyStreak: number;
  hasSeenRulesIntro: boolean;
  adsEnabled: boolean;
}

export interface DailyPuzzle {
  consonants: string[];
  digits: string;
  bonusType: PlateBonusType;
}

export interface NormalModeStatus {
  daySeed: string;
  puzzle: DailyPuzzle;
  attemptsUsedToday: number;
  bestScoreToday: number;
  attemptsHistory: AttemptRecord[];
  player: PlayerProfile;
}

export interface AttemptResult {
  valid: boolean;
  scoreThisAttempt: number;
  attemptsUsedToday: number;
  bestScoreToday: number;
  player: PlayerProfile;
}

export interface DailyPuzzle {
  consonants: string[];
  digits: string;
  bonusType: PlateBonusType;
}