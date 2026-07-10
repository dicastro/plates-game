import { MemoryPlatform } from "./MemoryPlatform";
import { CloudflarePlatform } from "./CloudflarePlatform";
import type {
  PlayerProfile, AttemptRecord, NormalModeStatus, AttemptResult, AuthProviderId,
  AliasAvailability, AliasSetupResult, AvailableLeaderboardPeriods, LeaderboardResult, LeaderboardPeriodType, LeaderboardEntry,
} from "../../shared/types";

export type {
  PlayerProfile, AttemptRecord, NormalModeStatus, AttemptResult, AuthProviderId,
  AliasAvailability, AliasSetupResult, AvailableLeaderboardPeriods, LeaderboardResult, LeaderboardPeriodType as LeaderboardPeriod, LeaderboardEntry,
};

export const SUPPORTED_AUTH_PROVIDERS: readonly AuthProviderId[] = ["google"];

export interface PlatformService {
  initialize(lang: string): Promise<PlayerProfile | null>;
  login(provider: AuthProviderId, intent?: string): Promise<void>;
  logout(): Promise<void>;
  enterNormalMode(lang: string): Promise<NormalModeStatus>;
  submitAttempt(lang: string, word: string): Promise<AttemptResult>;
  markRulesIntroSeen(lang: string): Promise<void>;
  checkAliasAvailability(alias: string): Promise<AliasAvailability>;
  setupAlias(alias: string): Promise<AliasSetupResult>;
  getAvailableLeaderboardPeriods(lang: string): Promise<AvailableLeaderboardPeriods>;
  getLeaderboard(lang: string, period: LeaderboardPeriodType, country?: string, year?: number, month?: number): Promise<LeaderboardResult>;
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