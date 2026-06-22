import type { PlatformService } from "./PlatformService";
import { seal, unseal, isPersistedEnvelope } from "./crypto/PayloadCrypto";
import { installDevSimulationHooks } from "./devTools"

const IS_DEV = import.meta.env.DEV;

export class MemoryPlatform implements PlatformService {
  private static readonly STORAGE_KEY = "plates_save";

  private pauseCallbacks: Array<() => void> = [];
  private resumeCallbacks: Array<() => void> = [];
  private audioChangeCallbacks: Array<(enabled: boolean) => void> = [];
  // No real platform audio signal exists locally — starts disabled until
  // __SIMULATE_YT_AUDIO_CHANGE__(true) is invoked from the console.
  private systemAudioEnabled = false;

  async initialize(): Promise<void> {
    // Per Playables integration requirements, games MUST NOT rely on the Page
    // Visibility API for pause/resume — only the SDK's onPause/onResume. This
    // strategy has no real SDK, so it exposes the same contract via debug hooks.
    if (IS_DEV) {
      installDevSimulationHooks({
        triggerPause: () => this.pauseCallbacks.forEach((cb) => cb()),
        triggerResume: () => this.resumeCallbacks.forEach((cb) => cb()),
        triggerAudioChange: (enabled: boolean) => {
          this.systemAudioEnabled = enabled;
          this.audioChangeCallbacks.forEach((cb) => cb(enabled));
        },
      });
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

  isSystemAudioEnabled(): boolean {
    return this.systemAudioEnabled;
  }

  onSystemAudioChange(callback: (enabled: boolean) => void): void {
    this.audioChangeCallbacks.push(callback);
  }
}