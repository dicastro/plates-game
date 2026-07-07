import type {
  PlatformService,
  PlayerProfile,
  NormalModeStatus,
  AttemptResult,
  AuthProviderId,
} from "./PlatformService";

const WORKER_BASE_URL = import.meta.env.VITE_WORKER_BASE_URL as string;

async function parseJsonOrThrow<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const message = await response.text().catch(() => "");
    throw new Error(message || `Request failed with status ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export class CloudflarePlatform implements PlatformService {
  async initialize(lang: string): Promise<PlayerProfile | null> {
    const response = await fetch(`${WORKER_BASE_URL}/player/session?lang=${encodeURIComponent(lang)}`, { credentials: "include" });
    if (response.status === 401) return null;
    return parseJsonOrThrow<PlayerProfile>(response);
  }

  async login(provider: AuthProviderId, intent?: string): Promise<void> {
    const url = new URL(`${WORKER_BASE_URL}/auth/${provider}/start`);
    if (intent) url.searchParams.set("intent", intent);
    window.location.href = url.toString();
    return new Promise(() => { }); // the page will navigate outside — this promise will never resolve here
  }

  async logout(): Promise<void> {
    await fetch(`${WORKER_BASE_URL}/auth/logout`, { method: "POST", credentials: "include" });
  }

  async enterNormalMode(lang: string): Promise<NormalModeStatus> {
    const response = await fetch(`${WORKER_BASE_URL}/normal/enter`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lang }),
    });
    return parseJsonOrThrow<NormalModeStatus>(response);
  }

  async submitAttempt(lang: string, word: string): Promise<AttemptResult> {
    const response = await fetch(`${WORKER_BASE_URL}/normal/attempt`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lang, word }),
    });
    return parseJsonOrThrow<AttemptResult>(response);
  }

  async markRulesIntroSeen(lang: string): Promise<void> {
    await fetch(`${WORKER_BASE_URL}/player/prefs`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lang, hasSeenRulesIntro: true }),
    });
  }

  onPause(callback: () => void): void {
    document.addEventListener("visibilitychange", () => { if (document.hidden) callback(); });
  }

  onResume(callback: () => void): void {
    document.addEventListener("visibilitychange", () => { if (!document.hidden) callback(); });
  }

  async showRewardedAd(): Promise<boolean> {
    throw new Error("CloudflarePlatform.showRewardedAd not yet implemented — see doc/NEXT_STEPS.md.");
  }
}