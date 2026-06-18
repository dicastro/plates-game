import type { PlatformService } from "./PlatformService";
import { seal, unseal, isPersistedEnvelope } from "./crypto/PayloadCrypto";

export class YouTubePlatform implements PlatformService {
  private pauseCallbacks: Array<() => void> = [];
  private resumeCallbacks: Array<() => void> = [];

  async initialize(): Promise<void> {
    if (!window.ytgame) {
      console.warn("[YouTubePlatform] window.ytgame not found. Running outside Test Suite?");
      return;
    }

    window.ytgame.system.onPause(() => this.pauseCallbacks.forEach((cb) => cb()));
    window.ytgame.system.onResume(() => this.resumeCallbacks.forEach((cb) => cb()));

    window.ytgame.game.firstFrameReady();
    window.ytgame.game.gameReady();
  }

  async saveData(data: unknown): Promise<void> {
    if (!window.ytgame) return;

    // Aplicamos tu capa criptográfica antes de persistir en la nube de Google
    const envelope = await seal(data);
    
    try {
      await window.ytgame.game.saveData(JSON.stringify(envelope));
    } catch (error) {
      console.error("[YouTubePlatform] saveData failed:", error);
    }
  }

  async loadData(): Promise<unknown> {
    if (!window.ytgame) return null;
    // YouTube SDK exposes a single storage blob — the key parameter is unused.
    try {
      const raw = await window.ytgame.game.loadData();
      if (!raw) return null;

      const parsed = JSON.parse(raw);

      if (!isPersistedEnvelope(parsed)) {
        console.error("[YouTubePlatform] Invalid envelope structure. Possible injection attempt.");
        return null;
      }

      return await unseal(parsed);
    } catch (error) {
      console.error("[YouTubePlatform] loadData failed:", error);
      return null;
    }
  }

  async submitScore(value: number): Promise<void> {
    if (!window.ytgame) return;
    await window.ytgame.engagement.sendScore({ value: value });
  }

  getLanguage(): string {
    if (!window.ytgame) return navigator.language?.slice(0, 2).toLowerCase() ?? "en";
    return window.ytgame.system.getLanguage()?.slice(0, 2).toLowerCase() ?? "en";
  }

  async showRewardedVideoAd(): Promise<boolean> {
    return true;
  }

  muteAudio(_isMuted: boolean): void {
    // Audio state is managed externally via ProceduralAudioEngine.
    // YouTube SDK audio lifecycle is handled via onPause/onResume callbacks.
  }

  onPause(callback: () => void): void {
    this.pauseCallbacks.push(callback);
  }

  onResume(callback: () => void): void {
    this.resumeCallbacks.push(callback);
  }
}

// Extensión global temporal para tipar window.ytgame sin que TypeScript proteste
declare global {
  interface Window {
    ytgame?: {
      IN_PLAYABLES_ENV: boolean;
      SDK_VERSION: string;
      game: {
        firstFrameReady: () => void;
        gameReady: () => void;
        saveData: (data: string) => Promise<void>;
        loadData: () => Promise<string | null>;
      };
      system: {
        onPause: (cb: () => void) => void;
        onResume: (cb: () => void) => void;
        onAudioEnabledChange: (cb: (isEnabled: boolean) => void) => void;
        isAudioEnabled: () => boolean;
        getLanguage: () => string | null;
      };
      engagement: {
        sendScore: (config: { value: number }) => Promise<void>;
      };
      ads: {
        requestInterstitialAd: () => Promise<void>;
        requestRewardedAd: (rewardId: string) => Promise<boolean>;
      };
    };
  }
}