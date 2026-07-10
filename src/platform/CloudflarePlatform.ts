import type {
  PlatformService,
  PlayerProfile,
  NormalModeStatus,
  AttemptResult,
  AuthProviderId,
} from "./PlatformService";
import { API_ROUTES } from "../../shared/apiRoutes";
import type { AliasAvailability, AliasSetupResult, AvailableLeaderboardPeriods, LeaderboardResult, LeaderboardPeriodType } from "../../shared/types";


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
    const response = await fetch(`${WORKER_BASE_URL}${API_ROUTES.playerSession.build({ lang })}`, { credentials: "include" });
    if (response.status === 401) return null;
    return parseJsonOrThrow<PlayerProfile>(response);
  }

  async login(provider: AuthProviderId, intent?: string): Promise<void> {
    window.location.href = `${WORKER_BASE_URL}${API_ROUTES.authStart.build({ provider, intent })}`;
    return new Promise(() => { }); // the page will navigate outside — this promise will never resolve here
  }

  async logout(): Promise<void> {
    await fetch(`${WORKER_BASE_URL}${API_ROUTES.authLogout.build({})}`, { method: "POST", credentials: "include" });
  }

  async checkAliasAvailability(alias: string): Promise<AliasAvailability> {
    const response = await fetch(`${WORKER_BASE_URL}${API_ROUTES.aliasCheck.build({ alias })}`, { credentials: "include" });
    return parseJsonOrThrow<AliasAvailability>(response);
  }

  async setupAlias(alias: string): Promise<AliasSetupResult> {
    const response = await fetch(`${WORKER_BASE_URL}${API_ROUTES.aliasSetup.build({})}`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ alias }),
    });
    return parseJsonOrThrow<AliasSetupResult>(response);
  }

  async getAvailableLeaderboardPeriods(lang: string): Promise<AvailableLeaderboardPeriods> {
    const response = await fetch(`${WORKER_BASE_URL}${API_ROUTES.leaderboardAvailable.build({ lang })}`, { credentials: "include" });
    return parseJsonOrThrow<AvailableLeaderboardPeriods>(response);
  }

  async getLeaderboard(lang: string, period: LeaderboardPeriodType, country?: string, year?: number, month?: number): Promise<LeaderboardResult> {
    const response = await fetch(`${WORKER_BASE_URL}${API_ROUTES.leaderboard.build({ lang, period, country, year, month })}`, { credentials: "include" });
    return parseJsonOrThrow<LeaderboardResult>(response);
  }

  async enterNormalMode(lang: string): Promise<NormalModeStatus> {
    const response = await fetch(`${WORKER_BASE_URL}${API_ROUTES.normalEnter.build({})}`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lang }),
    });
    return parseJsonOrThrow<NormalModeStatus>(response);
  }

  async submitAttempt(lang: string, word: string): Promise<AttemptResult> {
    const response = await fetch(`${WORKER_BASE_URL}${API_ROUTES.normalAttempt.build({})}`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lang, word }),
    });
    return parseJsonOrThrow<AttemptResult>(response);
  }

  async markRulesIntroSeen(lang: string): Promise<void> {
    await fetch(`${WORKER_BASE_URL}${API_ROUTES.playerPrefs.build({})}`, {
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