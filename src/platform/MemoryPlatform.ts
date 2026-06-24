import type {
  PlatformService,
  PlayerProfile,
  NormalModeStatus,
  AttemptResult,
  AuthProviderId,
} from "./PlatformService";
import { calculateAttemptScore } from "../../shared/scoring";

const MOCK_PLAYER: PlayerProfile = {
  alias: "DevPlayer",
  country: "ES",
  normalModeScore: 0,
  currentStreakDays: 0,
};

// Small fixed dictionary + fixed daily sequence, enough to exercise the attempt flow locally.
const MOCK_DICTIONARY = ["CANTO", "TRAMO", "CARTA"];
const MOCK_PUZZLE: NormalModeStatus["puzzle"] = {
  consonants: ["C", "N", "T"],
  digits: "1221",
  bonusType: "palindrome",
};

export class MemoryPlatform implements PlatformService {
  private bestScoreToday = 0;
  private attemptsUsedToday = 0;
  private pauseCallbacks: Array<() => void> = [];
  private resumeCallbacks: Array<() => void> = [];

  async initialize(): Promise<PlayerProfile | null> {
    // Local dev always "logged in" as the mock player — no real OAuth round-trip to simulate.
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) this.pauseCallbacks.forEach((cb) => cb());
      else this.resumeCallbacks.forEach((cb) => cb());
    });
    return MOCK_PLAYER;
  }

  async login(_provider: AuthProviderId): Promise<void> {
    // No-op — MemoryPlatform has no real session to establish.
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
      player: MOCK_PLAYER,
    };
  }

  async submitAttempt(_lang: string, word: string): Promise<AttemptResult> {
    this.attemptsUsedToday += 1;
    const valid = MOCK_DICTIONARY.includes(word.toUpperCase());
    const scoreThisAttempt = valid
      ? calculateAttemptScore(word.length, MOCK_PUZZLE.digits, MOCK_PUZZLE.bonusType)
      : 0;
    if (scoreThisAttempt > this.bestScoreToday) this.bestScoreToday = scoreThisAttempt;

    return {
      valid,
      scoreThisAttempt,
      attemptsUsedToday: this.attemptsUsedToday,
      bestScoreToday: this.bestScoreToday,
      player: MOCK_PLAYER,
    };
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