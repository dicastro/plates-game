import type {
  PlatformService,
  PlayerProfile,
  NormalModeStatus,
  AttemptResult,
  AuthProviderId,
} from "./PlatformService";

export class CloudflarePlatform implements PlatformService {
  async initialize(): Promise<PlayerProfile | null> {
    throw new Error("CloudflarePlatform.initialize not yet implemented.");
  }

  async login(_provider: AuthProviderId): Promise<void> {
    throw new Error("CloudflarePlatform.login not yet implemented.");
  }

  async logout(): Promise<void> {
    throw new Error("CloudflarePlatform.logout not yet implemented.");
  }

  async enterNormalMode(_lang: string): Promise<NormalModeStatus> {
    throw new Error("CloudflarePlatform.enterNormalMode not yet implemented.");
  }

  async submitAttempt(_lang: string, _word: string): Promise<AttemptResult> {
    throw new Error("CloudflarePlatform.submitAttempt not yet implemented.");
  }

  async markRulesIntroSeen(): Promise<void> {
    throw new Error("CloudflarePlatform.markRulesIntroSeen not yet implemented.");
  }

  onPause(_callback: () => void): void {
    throw new Error("CloudflarePlatform.onPause not yet implemented.");
  }

  onResume(_callback: () => void): void {
    throw new Error("CloudflarePlatform.onResume not yet implemented.");
  }

  async showRewardedAd(): Promise<boolean> {
    throw new Error("CloudflarePlatform.showRewardedAd not yet implemented.");
  }
}