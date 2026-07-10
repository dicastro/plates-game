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
  hasCompletedAliasSetup: boolean;
  adsEnabled: boolean;
  todayScore: number;
  weekCurrentScore: number;
  monthCurrentScore: number;
  yearCurrentScore: number;
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
  attemptsHistory: AttemptRecord[];
  player: PlayerProfile;
}

export interface DailyPuzzle {
  consonants: string[];
  digits: string;
  bonusType: PlateBonusType;
}

// ---- Alias setup ----
export interface AliasAvailability {
  available: boolean;
}

export interface AliasSetupResult {
  success: boolean;
  reason?: "taken" | "invalid"; // "taken" = unique constraint violation on INSERT
  player: PlayerProfile;
}

// ---- Leaderboard ----
export type LeaderboardPeriodType = "week" | "month" | "year" | "total";

export interface LeaderboardEntry {
  rank: number;
  alias: string;
  country: string;
  score: number;
}

export interface LeaderboardResult {
  entries: LeaderboardEntry[];       // top N
  ownEntry: LeaderboardEntry | null; // present only if the requester isn't in `entries`
  intervalLabel: string;             // e.g. "2026-07-07" for period=day — client formats for display
  totalPlayers: number;
  totalCountries?: number;           // only present when no country filter is applied
}

export interface AvailableLeaderboardPeriods {
  week: boolean;
  months: Array<{ year: number; month: number }>; // closed months with data
  years: number[];                                 // closed years with data
}