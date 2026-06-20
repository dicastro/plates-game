import type { PlatformService } from "./PlatformService";
import { seal, unseal, isPersistedEnvelope } from "./crypto/PayloadCrypto";

const IS_DEV = import.meta.env.DEV;

export class MemoryPlatform implements PlatformService {
  private static readonly STORAGE_KEY = "plates_save";

  private pauseCallbacks: Array<() => void> = [];
  private resumeCallbacks: Array<() => void> = [];

  async initialize(): Promise<void> {
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        this.pauseCallbacks.forEach((cb) => cb());
      } else {
        this.resumeCallbacks.forEach((cb) => cb());
      }
    });

    if (IS_DEV) {
      (window as unknown as Record<string, unknown>)["__SIMULATE_YT_PAUSE__"] = () =>
        this.pauseCallbacks.forEach((cb) => cb());
      (window as unknown as Record<string, unknown>)["__SIMULATE_YT_RESUME__"] = () =>
        this.resumeCallbacks.forEach((cb) => cb());
    }
  }

  async saveData(data: unknown): Promise<void> {
    const envelope = await seal(data);
    sessionStorage.setItem(MemoryPlatform.STORAGE_KEY, JSON.stringify(envelope));
  }

  async loadData(): Promise<unknown> {
    try {
      const raw = sessionStorage.getItem(MemoryPlatform.STORAGE_KEY);
      if (!raw) return null;

      const parsed = JSON.parse(raw);

      if (!isPersistedEnvelope(parsed)) {
        console.error("[MemoryPlatform] Invalid envelope structure. Possible injection attempt.");
        sessionStorage.removeItem(MemoryPlatform.STORAGE_KEY);
        return null;
      }

      return await unseal(parsed);
    } catch (error) {
      console.error("[MemoryPlatform] loadData failed:", error);
      sessionStorage.removeItem(MemoryPlatform.STORAGE_KEY);
      return null;
    }
  }

  async submitScore(_value: number): Promise<void> {
    // No-op in MEMORY mode
  }

  notifyFirstFrameReady(): void {
    // No-op in MEMORY mode
  }

  notifyGameReady(): void {
    // No-op in MEMORY mode
  }

  async archiveFinishedSessions(): Promise<void> {
    // No-op in MEMORY mode — no Travel/Remote sessions exist locally
  }

  getLanguage(): string {
    return navigator.language?.slice(0, 2).toLowerCase() ?? "en";
  }

  async showRewardedVideoAd(): Promise<boolean> {
    return true;
  }

  muteAudio(_isMuted: boolean): void {
    // Delegated externally via ProceduralAudioEngine
  }

  onPause(callback: () => void): void {
    this.pauseCallbacks.push(callback);
  }

  onResume(callback: () => void): void {
    this.resumeCallbacks.push(callback);
  }
}