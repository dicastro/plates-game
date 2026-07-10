import type {
  PlatformService,
  PlayerProfile,
  NormalModeStatus,
  AttemptResult,
  AuthProviderId,
  AttemptRecord,
  AliasAvailability,
  AliasSetupResult,
  AvailableLeaderboardPeriods,
  LeaderboardResult,
  LeaderboardPeriod,
  LeaderboardEntry,
} from "./PlatformService";
import { calculateAttemptScore } from "../../shared/scoring";
import { previousWeekKeyUtc } from "../../shared/isoWeek";
import { timeService } from "../time/timeServiceInstance";

const MOCK_PUZZLE: NormalModeStatus["puzzle"] = {
  consonants: ["C", "N", "T"],
  digits: "1221",
  bonusType: "palindrome",
};

const MOCK_DICTIONARY = ["CANTO", "TRAMO", "CARTA"];
const RESERVED_MOCK_ALIAS = "TAKEN23";

interface MockRankingEntry {
  alias: string;
  country: string;
  weekScore: number;
  monthScore: number;
  yearScore: number
}

const MOCK_RANKING_ENTRIES: MockRankingEntry[] = [
  { alias: "MEJOR01", country: "ES", weekScore: 170, monthScore: 720, yearScore: 7200 },
  { alias: "MEJOR02", country: "ES", weekScore: 169, monthScore: 716, yearScore: 7160 },
  { alias: "MEJOR03", country: "ES", weekScore: 168, monthScore: 712, yearScore: 7120 },
  { alias: "MEJOR04", country: "ES", weekScore: 167, monthScore: 708, yearScore: 7080 },
  { alias: "MEJOR05", country: "ES", weekScore: 166, monthScore: 704, yearScore: 7040 },
  { alias: "MEJOR06", country: "ES", weekScore: 165, monthScore: 700, yearScore: 7000 },
  { alias: "MEJOR07", country: "ES", weekScore: 164, monthScore: 656, yearScore: 6560 },
  { alias: "MEJOR08", country: "ES", weekScore: 163, monthScore: 652, yearScore: 6520 },
  { alias: "MEJOR09", country: "ES", weekScore: 162, monthScore: 648, yearScore: 6480 },
  { alias: "MEJOR10", country: "ES", weekScore: 161, monthScore: 644, yearScore: 6440 },
  { alias: "MEJOR11", country: "AR", weekScore: 160, monthScore: 640, yearScore: 6400 },
  { alias: "MEJOR12", country: "AR", weekScore: 159, monthScore: 636, yearScore: 6360 },
  { alias: "MEJOR13", country: "AR", weekScore: 158, monthScore: 632, yearScore: 6320 },
  { alias: "MEJOR14", country: "AR", weekScore: 157, monthScore: 628, yearScore: 6280 },
  { alias: "MEJOR15", country: "AR", weekScore: 156, monthScore: 624, yearScore: 6240 },
  { alias: "MEJOR16", country: "AR", weekScore: 155, monthScore: 620, yearScore: 6200 },
  { alias: "MEJOR17", country: "AR", weekScore: 154, monthScore: 616, yearScore: 6160 },
  { alias: "MEJOR18", country: "AR", weekScore: 153, monthScore: 612, yearScore: 6120 },
  { alias: "MEJOR19", country: "AR", weekScore: 152, monthScore: 608, yearScore: 6080 },
  { alias: "MEJOR20", country: "AR", weekScore: 151, monthScore: 604, yearScore: 6040 },
  { alias: "MEJOR31", country: "ES", weekScore: 150, monthScore: 600, yearScore: 6000 },
  { alias: "MEJOR32", country: "ES", weekScore: 149, monthScore: 596, yearScore: 5960 },
  { alias: "MEJOR33", country: "ES", weekScore: 148, monthScore: 592, yearScore: 5920 },
  { alias: "MEJOR34", country: "ES", weekScore: 147, monthScore: 588, yearScore: 5880 },
  { alias: "MEJOR35", country: "ES", weekScore: 146, monthScore: 584, yearScore: 5840 },
  { alias: "MEJOR36", country: "ES", weekScore: 145, monthScore: 580, yearScore: 5800 },
  { alias: "MEJOR37", country: "ES", weekScore: 144, monthScore: 576, yearScore: 5760 },
  { alias: "MEJOR38", country: "ES", weekScore: 143, monthScore: 572, yearScore: 5720 },
  { alias: "MEJOR39", country: "ES", weekScore: 142, monthScore: 568, yearScore: 5680 },
  { alias: "MEJOR30", country: "ES", weekScore: 141, monthScore: 564, yearScore: 5640 },
  { alias: "QOPUIR", country: "ES", weekScore: 140, monthScore: 560, yearScore: 5600 },
  { alias: "PEOR01", country: "ES", weekScore: 139, monthScore: 556, yearScore: 5560 },
  { alias: "PEOR02", country: "ES", weekScore: 138, monthScore: 552, yearScore: 5520 },
  { alias: "PEOR03", country: "ES", weekScore: 137, monthScore: 548, yearScore: 5480 },
  { alias: "PEOR04", country: "ES", weekScore: 136, monthScore: 544, yearScore: 5440 },
  { alias: "PEOR05", country: "ES", weekScore: 135, monthScore: 540, yearScore: 5400 },
  { alias: "PEOR06", country: "ES", weekScore: 134, monthScore: 536, yearScore: 5360 },
  { alias: "PEOR07", country: "ES", weekScore: 133, monthScore: 532, yearScore: 5320 },
  { alias: "PEOR08", country: "ES", weekScore: 132, monthScore: 528, yearScore: 5280 },
  { alias: "PEOR09", country: "ES", weekScore: 131, monthScore: 524, yearScore: 5240 },
  { alias: "PEOR10", country: "ES", weekScore: 130, monthScore: 520, yearScore: 5200 },
  { alias: "PEOR11", country: "ES", weekScore: 129, monthScore: 516, yearScore: 5160 },
  { alias: "PEOR12", country: "ES", weekScore: 128, monthScore: 512, yearScore: 5120 },
  { alias: "PEOR13", country: "ES", weekScore: 127, monthScore: 508, yearScore: 5080 },
  { alias: "PEOR14", country: "ES", weekScore: 126, monthScore: 504, yearScore: 5040 },
  { alias: "PEOR15", country: "ES", weekScore: 125, monthScore: 500, yearScore: 5000 },
  { alias: "PEOR16", country: "ES", weekScore: 124, monthScore: 496, yearScore: 4960 },
  { alias: "PEOR17", country: "ES", weekScore: 123, monthScore: 492, yearScore: 4920 },
  { alias: "PEOR18", country: "ES", weekScore: 122, monthScore: 488, yearScore: 4880 },
  { alias: "PEOR19", country: "ES", weekScore: 121, monthScore: 484, yearScore: 4840 },
  { alias: "PEOR10", country: "ES", weekScore: 120, monthScore: 480, yearScore: 4800 },
];

const RANKING_TOP_LIMIT = 50;

const SIMULATED_DELAY_MIN_MS = 400;
const SIMULATED_DELAY_MAX_MS = 1200;

function simulatedNetworkDelay(): Promise<void> {
  const ms = SIMULATED_DELAY_MIN_MS + Math.random() * (SIMULATED_DELAY_MAX_MS - SIMULATED_DELAY_MIN_MS);
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class MemoryPlatform implements PlatformService {
  private player: PlayerProfile = {
    alias: "QOPUIR",
    country: "ES",
    dailyStreak: 0,
    hasSeenRulesIntro: false,
    hasCompletedAliasSetup: false,
    adsEnabled: false,
    todayScore: 0,
    weekCurrentScore: 0,
    monthCurrentScore: 0,
    yearCurrentScore: 0,
  };

  private bestScoreToday = 0;
  private attemptsUsedToday = 0;
  private attemptsHistory: AttemptRecord[] = [];
  private pauseCallbacks: Array<() => void> = [];
  private resumeCallbacks: Array<() => void> = [];

  async initialize(_lang: string): Promise<PlayerProfile | null> {
    // Local dev always "logged in" as the mock player — no real OAuth round-trip to simulate.
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) this.pauseCallbacks.forEach((cb) => cb());
      else this.resumeCallbacks.forEach((cb) => cb());
    });
    return this.player;
  }

  async login(_provider: AuthProviderId, _intent?: string): Promise<void> {
    // No-op — MemoryPlatform has no real session to establish
  }

  async logout(): Promise<void> {
    // No-op
  }

  async enterNormalMode(_lang: string): Promise<NormalModeStatus> {
    return {
      daySeed: new Date(timeService.now()).toISOString().slice(0, 10),
      puzzle: MOCK_PUZZLE,
      attemptsUsedToday: this.attemptsUsedToday,
      bestScoreToday: this.bestScoreToday,
      attemptsHistory: [...this.attemptsHistory], // defensive copy — never leak the live mutable array
      player: this.player,
    };
  }

  async submitAttempt(_lang: string, word: string): Promise<AttemptResult> {
    await simulatedNetworkDelay();

    this.attemptsUsedToday += 1;
    const valid = MOCK_DICTIONARY.includes(word.toUpperCase());
    const scoreThisAttempt = valid
      ? calculateAttemptScore(word.length, MOCK_PUZZLE.digits, MOCK_PUZZLE.bonusType)
      : 0;
    if (scoreThisAttempt > this.bestScoreToday) this.bestScoreToday = scoreThisAttempt;

    this.attemptsHistory.push({ word: word.toUpperCase(), valid, score: scoreThisAttempt });

    this.player = {
      ...this.player,
      todayScore: this.bestScoreToday,
      weekCurrentScore: this.player.weekCurrentScore + scoreThisAttempt,
      monthCurrentScore: this.player.monthCurrentScore + scoreThisAttempt,
      yearCurrentScore: this.player.yearCurrentScore + scoreThisAttempt
    }

    return {
      valid,
      scoreThisAttempt,
      attemptsUsedToday: this.attemptsUsedToday,
      bestScoreToday: this.bestScoreToday,
      attemptsHistory: [...this.attemptsHistory],
      player: this.player,
    };
  }

  async markRulesIntroSeen(_lang: string): Promise<void> {
    this.player = { ...this.player, hasSeenRulesIntro: true };
  }

  async checkAliasAvailability(alias: string): Promise<AliasAvailability> {
    await simulatedNetworkDelay();
    return { available: alias.toUpperCase() !== RESERVED_MOCK_ALIAS };
  }

  async setupAlias(alias: string): Promise<AliasSetupResult> {
    await simulatedNetworkDelay();
    if (alias.toUpperCase() === RESERVED_MOCK_ALIAS) {
      return { success: false, reason: "taken", player: this.player };
    }
    this.player = { ...this.player, alias: alias.toUpperCase(), hasCompletedAliasSetup: true };
    return { success: true, player: this.player };
  }

  async getAvailableLeaderboardPeriods(_lang: string): Promise<AvailableLeaderboardPeriods> {
    await simulatedNetworkDelay();
    return {
      week: true,
      years: [2025],
      months: [
        { year: 2025, month: 11 },
        { year: 2025, month: 12 },
        { year: 2026, month: 1 },
        { year: 2026, month: 2 },
        { year: 2026, month: 3 },
        { year: 2026, month: 4 },
        { year: 2026, month: 5 },
        { year: 2026, month: 6 },
      ],
    };
  }

  async getLeaderboard(_lang: string, period: LeaderboardPeriod, country?: string, year?: number, month?: number): Promise<LeaderboardResult> {
    await simulatedNetworkDelay();

    const previousWeekKey = previousWeekKeyUtc(timeService.now());

    const scoreKey = period === "week" ? "weekScore" : period === "month" ? "monthScore" : "yearScore";
    const pool = country ? MOCK_RANKING_ENTRIES.filter((e) => e.country === country) : MOCK_RANKING_ENTRIES;
    const sorted = [...pool].sort((a, b) => b[scoreKey] - a[scoreKey]);
    const top = sorted.slice(0, RANKING_TOP_LIMIT).map((e, i) => ({ rank: i + 1, alias: e.alias, country: e.country, score: e[scoreKey] }));

    const totalPlayers = pool.length;
    const totalCountries = country ? undefined : new Set(MOCK_RANKING_ENTRIES.map((e) => e.country)).size;

    if (period === "total") {
      return { entries: [], ownEntry: null, intervalLabel: previousWeekKey, totalPlayers: 0, totalCountries: 0 };
    }

    const alreadyIncluded = top.some((e) => e.alias === this.player.alias);
    let ownEntry: LeaderboardEntry | null = null;

    if (!alreadyIncluded) {
      let myRankingPos = sorted.findIndex((e) => e.alias === this.player.alias);
      
      if (myRankingPos !== -1) {
        const myScore = sorted[myRankingPos][scoreKey];
        ownEntry = { rank: myRankingPos + 1, alias: this.player.alias, country: this.player.country, score: myScore };
      }
    }

    const intervalLabel =
      period === "week"
        ? previousWeekKey
        : period === "month"
          ? `${year}-${String(month).padStart(2, "0")}`
          : String(year);

    return { entries: top, ownEntry, intervalLabel, totalPlayers, totalCountries };
  }

  onPause(callback: () => void): void {
    this.pauseCallbacks.push(callback);
  }

  onResume(callback: () => void): void {
    this.resumeCallbacks.push(callback);
  }

  async showRewardedAd(): Promise<boolean> {
    return true;
  }
}