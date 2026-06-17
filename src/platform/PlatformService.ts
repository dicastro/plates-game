import { MemoryPlatform } from "./MemoryPlatform";

export interface PlatformService {
  initialize(): Promise<void>;
  saveData(key: string, data: unknown): Promise<void>;
  loadData(key: string): Promise<unknown>;
  submitScore(leaderboardId: string, value: number): Promise<void>;
  getLanguage(): string;
  showRewardedVideoAd(): Promise<boolean>;
  muteAudio(isMuted: boolean): void;
  onPause(callback: () => void): void;
  onResume(callback: () => void): void;
}

export class PlatformFactory {
  static create(): PlatformService {
    const target = import.meta.env.VITE_PLATFORM_TARGET;
    switch (target) {
      case "YOUTUBE":
        throw new Error("YouTubePlatform not yet implemented.");
      case "CLOUDFLARE":
        throw new Error("CloudflarePlatform not yet implemented.");
      case "MEMORY":
      default:
        return new MemoryPlatform();
    }
  }
}