import { MemoryPlatform } from "./MemoryPlatform";
import { CloudflarePlatform } from "./CloudflarePlatform";

export interface PlayerProfile {
  alias: string;
  country: string;
  normalModeScore: number;
  currentStreakDays: number;
}

export interface NormalModeStatus {
  daySeed: string;
  puzzle: {
    consonants: string[];
    digits: string;
    bonusType: "none" | "sum" | "pairs" | "trio" | "quartet" | "palindrome";
  };
  attemptsUsedToday: number;
  bestScoreToday: number;
  player: PlayerProfile;
}

export interface AttemptResult {
  valid: boolean;
  scoreThisAttempt: number;
  attemptsUsedToday: number;
  bestScoreToday: number;
  player: PlayerProfile;
}

export type AuthProviderId = "google";

export interface PlatformService {
  /** Checks for an existing valid session and hydrates the player's profile if found. */
  initialize(): Promise<PlayerProfile | null>;
  login(provider: AuthProviderId): Promise<void>;
  logout(): Promise<void>;
  enterNormalMode(lang: string): Promise<NormalModeStatus>;
  submitAttempt(lang: string, word: string): Promise<AttemptResult>;
  onPause(callback: () => void): void;
  onResume(callback: () => void): void;
  showRewardedAd(): Promise<boolean>;
}

export class PlatformFactory {
  static create(): PlatformService {
    const target = import.meta.env.VITE_PLATFORM_TARGET;

    switch (target) {
      case "CLOUDFLARE":
        return new CloudflarePlatform();
      case "MEMORY":
      default:
        return new MemoryPlatform();
    }
  }
}