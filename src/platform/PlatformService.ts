import { MemoryPlatform } from "./MemoryPlatform";
import { YouTubePlatform } from "./YoutubePlatform";

export interface PlatformService {
  initialize(): Promise<void>;
  saveData(data: unknown): Promise<void>;
  loadData(): Promise<unknown>;
  submitScore(value: number): Promise<void>;
  notifyFirstFrameReady(): void;
  notifyGameReady(): void;
  archiveFinishedSessions(): Promise<void>;
  getLanguage(): string;
  showRewardedVideoAd(): Promise<boolean>;
  muteAudio(isMuted: boolean): void;
  onPause(callback: () => void): void;
  onResume(callback: () => void): void;
  /** Current system-level audio permission (YouTube mute button / device mute). */
  isSystemAudioEnabled(): boolean;
  /** Fires whenever the platform's audio permission changes (mute/unmute at the system level). */
  onSystemAudioChange(callback: (enabled: boolean) => void): void;
}

export class PlatformFactory {
  static create(): PlatformService {
    const target = import.meta.env.VITE_PLATFORM_TARGET;

    switch (target) {
      case "YOUTUBE":
        return new YouTubePlatform();
      case "CLOUDFLARE":
        throw new Error("CloudflarePlatform not yet implemented.");
      case "MEMORY":
      default:
        return new MemoryPlatform();
    }
  }
}