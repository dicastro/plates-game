import type { PlatformService } from "./PlatformService";
import { seal, unseal, isPersistedEnvelope } from "./crypto/PayloadCrypto";

const IS_DEV = import.meta.env.DEV;

export class MemoryPlatform implements PlatformService {
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

  async saveData(key: string, data: unknown): Promise<void> {
    const envelope = await seal(data);
    sessionStorage.setItem(key, JSON.stringify(envelope));
  }

  async loadData(key: string): Promise<unknown> {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      console.error(`[MemoryPlatform] Corrupted JSON at key "${key}". Discarding.`);
      sessionStorage.removeItem(key);
      return null;
    }

    if (!isPersistedEnvelope(parsed)) {
      console.error(`[MemoryPlatform] Invalid envelope structure at key "${key}". Possible injection attempt.`);
      sessionStorage.removeItem(key);
      return null;
    }

    try {
      return await unseal(parsed);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[MemoryPlatform] unseal failed at key "${key}": ${msg}`);
      sessionStorage.removeItem(key);
      return null;
    }
  }

  async submitScore(_leaderboardId: string, _value: number): Promise<void> {
    // No-op in MEMORY mode
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