import { MemoryPlatform } from "./MemoryPlatform";
import { CloudflarePlatform } from "./CloudflarePlatform";
import type { PlayerProfile, AttemptRecord, NormalModeStatus, AttemptResult, AuthProviderId } from "../../shared/types";

export type { PlayerProfile, AttemptRecord, NormalModeStatus, AttemptResult, AuthProviderId };

export const SUPPORTED_AUTH_PROVIDERS: readonly AuthProviderId[] = ["google"];

export interface PlatformService {
  initialize(lang: string): Promise<PlayerProfile | null>;
  login(provider: AuthProviderId, intent?: string): Promise<void>;
  logout(): Promise<void>;
  enterNormalMode(lang: string): Promise<NormalModeStatus>;
  submitAttempt(lang: string, word: string): Promise<AttemptResult>;
  markRulesIntroSeen(lang: string): Promise<void>;
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