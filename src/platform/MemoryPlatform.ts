import type {
  PlatformService,
  PlayerProfile,
  NormalModeStatus,
  AttemptResult,
  AuthProviderId,
  AttemptRecord,
} from "./PlatformService";
import { calculateAttemptScore } from "../../shared/scoring";

const MOCK_PUZZLE: NormalModeStatus["puzzle"] = {
  consonants: ["C", "N", "T"],
  digits: "1221",
  bonusType: "palindrome",
};

const MOCK_DICTIONARY = ["CANTO", "TRAMO", "CARTA"];

const SIMULATED_DELAY_MIN_MS = 400;
const SIMULATED_DELAY_MAX_MS = 1200;

function simulatedNetworkDelay(): Promise<void> {
  const ms = SIMULATED_DELAY_MIN_MS + Math.random() * (SIMULATED_DELAY_MAX_MS - SIMULATED_DELAY_MIN_MS);
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class MemoryPlatform implements PlatformService {
  private player: PlayerProfile = {
    alias: "DevPlayer",
    country: "ES",
    dailyStreak: 0,
    hasSeenRulesIntro: false,
    adsEnabled: false,
  };

  private bestScoreToday = 0;
  private attemptsUsedToday = 0;
  private attemptsHistory: AttemptRecord[] = [];
  private pauseCallbacks: Array<() => void> = [];
  private resumeCallbacks: Array<() => void> = [];

  async initialize(_lang: string): Promise<PlayerProfile | null> {
    // Local dev always "logged in" as the mock player — no real OAuth round-trip to simulate.
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) this.pauseCallbacks.forEach((cb) => cb());
      else this.resumeCallbacks.forEach((cb) => cb());
    });
    return this.player;
  }

  async login(_provider: AuthProviderId, _intent?: string): Promise<void> {
    // No-op — MemoryPlatform has no real session to establish
  }

  async logout(): Promise<void> {
    // No-op
  }

  async enterNormalMode(_lang: string): Promise<NormalModeStatus> {
    return {
      daySeed: "dev-fixed-day",
      puzzle: MOCK_PUZZLE,
      attemptsUsedToday: this.attemptsUsedToday,
      bestScoreToday: this.bestScoreToday,
      attemptsHistory: [...this.attemptsHistory], // defensive copy — never leak the live mutable array
      player: this.player,
    };
  }

  async submitAttempt(_lang: string, word: string): Promise<AttemptResult> {
    await simulatedNetworkDelay();

    this.attemptsUsedToday += 1;
    const valid = MOCK_DICTIONARY.includes(word.toUpperCase());
    const scoreThisAttempt = valid
      ? calculateAttemptScore(word.length, MOCK_PUZZLE.digits, MOCK_PUZZLE.bonusType)
      : 0;
    if (scoreThisAttempt > this.bestScoreToday) this.bestScoreToday = scoreThisAttempt;

    this.attemptsHistory.push({ word: word.toUpperCase(), valid, score: scoreThisAttempt });

    return {
      valid,
      scoreThisAttempt,
      attemptsUsedToday: this.attemptsUsedToday,
      bestScoreToday: this.bestScoreToday,
      player: this.player,
    };
  }

  async markRulesIntroSeen(_lang: string): Promise<void> {
    this.player = { ...this.player, hasSeenRulesIntro: true };
  }

  onPause(callback: () => void): void {
    this.pauseCallbacks.push(callback);
  }

  onResume(callback: () => void): void {
    this.resumeCallbacks.push(callback);
  }

  async showRewardedAd(): Promise<boolean> {
    return true;
  }
}