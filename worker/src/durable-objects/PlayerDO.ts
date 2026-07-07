import { DurableObject } from "cloudflare:workers";
import { weekKeyUtc, monthKeyUtc, yearKeyUtc, daysBetween, weeksBetween, monthsBetween, yearsBetween } from "../dateKeys";
import { emptyBucket, advanceBucket, type PeriodBucket } from "../periodBucket";
import { resolveDailyPuzzle } from "../data/plateCalendar";
import { resolveDictionary } from "../data/dictionary";
import { resolveTodayDaySeed } from "../todayDaySeed";
import { isStructurallyValid } from "../../../shared/wordValidation";
import { calculateAttemptScore } from "../../../shared/scoring";
import { NORMAL_MODE_DAILY_ATTEMPTS_LIMIT } from "../../../shared/gameConfig";
import type { AttemptRecord, AuthProviderId, PlayerProfile, NormalModeStatus, AttemptResult } from "../../../shared/types";
import type { Env } from "../env";

interface PlayerRow {
  player_id: string;
  auth_provider_id: string;
  external_provider_id: string;
  alias: string;
  country: string;
  ads_enabled: number;
}

interface LangRow {
  lang: string;
  has_seen_rules_intro: number;
  today_day_seed: string;
  attempts_used_today: number;
  today_best_score: number;
  today_attempts_json: string;
  yesterday_best_score: number;
  week_current_key: string;
  week_current_total: number;
  week_previous_key: string;
  week_previous_total: number;
  month_current_key: string;
  month_current_total: number;
  month_previous_key: string;
  month_previous_total: number;
  year_current_key: string;
  year_current_total: number;
  year_previous_key: string;
  year_previous_total: number;
  lifetime_total_up_to_yesterday: number;
  daily_streak: number;
}

function rowToBuckets(row: LangRow) {
  return {
    week: {
      currentKey: row.week_current_key,
      currentTotal: row.week_current_total,
      previousKey: row.week_previous_key,
      previousTotal: row.week_previous_total
    } as PeriodBucket,
    month: {
      currentKey: row.month_current_key,
      currentTotal: row.month_current_total,
      previousKey: row.month_previous_key,
      previousTotal: row.month_previous_total
    } as PeriodBucket,
    year: {
      currentKey: row.year_current_key,
      currentTotal: row.year_current_total,
      previousKey: row.year_previous_key,
      previousTotal: row.year_previous_total
    } as PeriodBucket,
  };
}

type SqlRow<T> = T & Record<string, any>;

export class PlayerDO extends DurableObject<Env> {
  private sql = this.ctx.storage.sql;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);

    // Runs once, before any request is processed — per Cloudflare's own
    // recommendation for SQLite-backed DOs (Rules of Durable Objects).
    ctx.blockConcurrencyWhile(async () => {
      this.sql.exec(`CREATE TABLE IF NOT EXISTS player (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        player_id TEXT NOT NULL,
        auth_provider_id TEXT NOT NULL,
        external_provider_id TEXT NOT NULL,
        alias TEXT NOT NULL,
        country TEXT NOT NULL,
        ads_enabled INTEGER NOT NULL
      )`);

      this.sql.exec(`CREATE TABLE IF NOT EXISTS normal_mode_lang_state (
        lang TEXT PRIMARY KEY,
        has_seen_rules_intro INTEGER NOT NULL,
        today_day_seed TEXT NOT NULL,
        attempts_used_today INTEGER NOT NULL,
        today_best_score INTEGER NOT NULL,
        today_attempts_json TEXT NOT NULL,
        yesterday_best_score INTEGER NOT NULL,
        week_current_key TEXT NOT NULL,
        week_current_total INTEGER NOT NULL,
        week_previous_key TEXT NOT NULL,
        week_previous_total INTEGER NOT NULL,
        month_current_key TEXT NOT NULL,
        month_current_total INTEGER NOT NULL,
        month_previous_key TEXT NOT NULL,
        month_previous_total INTEGER NOT NULL,
        year_current_key TEXT NOT NULL,
        year_current_total INTEGER NOT NULL,
        year_previous_key TEXT NOT NULL,
        year_previous_total INTEGER NOT NULL,
        lifetime_total_up_to_yesterday INTEGER NOT NULL,
        daily_streak INTEGER NOT NULL
      )`);
    });
  }

  private getPlayerRow(): PlayerRow | null {
    const rows = this.sql.exec<SqlRow<PlayerRow>>("SELECT * FROM player WHERE id = 1").toArray();
    return rows.length > 0 ? rows[0] : null;
  }

  private requirePlayerRow(): PlayerRow {
    const row = this.getPlayerRow();
    if (!row) throw new Error("PlayerDO accessed before createIfMissing.");
    return row;
  }

  async createIfMissing(params: {
    authProviderId: AuthProviderId;
    externalProviderId: string;
    country: string;
  }): Promise<void> {
    if (this.getPlayerRow()) return;
    const playerId = crypto.randomUUID();

    this.sql.exec(
      `INSERT INTO player (id, player_id, auth_provider_id, external_provider_id, alias, country, ads_enabled)
       VALUES (1, ?, ?, ?, ?, ?, 1)`,
      playerId,
      params.authProviderId,
      params.externalProviderId,
      `Player-${params.externalProviderId.slice(0, 8)}`,
      params.country
    );
  }

  private getLangRow(lang: string): LangRow | null {
    const rows = this.sql.exec<SqlRow<LangRow>>("SELECT * FROM normal_mode_lang_state WHERE lang = ?", lang).toArray();
    return rows.length > 0 ? rows[0] : null;
  }

  private insertLangRow(lang: string, todayDaySeed: string): LangRow {
    const epoch = Date.parse(`${todayDaySeed}T00:00:00Z`);
    const week = emptyBucket(weekKeyUtc(epoch));
    const month = emptyBucket(monthKeyUtc(epoch));
    const year = emptyBucket(yearKeyUtc(epoch));

    this.sql.exec(
      `INSERT INTO normal_mode_lang_state (
        lang, has_seen_rules_intro, today_day_seed, attempts_used_today, today_best_score, today_attempts_json,
        yesterday_best_score,
        week_current_key, week_current_total, week_previous_key, week_previous_total,
        month_current_key, month_current_total, month_previous_key, month_previous_total,
        year_current_key, year_current_total, year_previous_key, year_previous_total,
        lifetime_total_up_to_yesterday, daily_streak
      ) VALUES (?, 0, ?, 0, 0, '[]', 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0)`,
      lang, todayDaySeed,
      week.currentKey, week.currentTotal, week.previousKey, week.previousTotal,
      month.currentKey, month.currentTotal, month.previousKey, month.previousTotal,
      year.currentKey, year.currentTotal, year.previousKey, year.previousTotal
    );
    return this.getLangRow(lang)!;
  }

  private async ensureLangRow(lang: string, todayDaySeed: string): Promise<LangRow> {
    const existing = this.getLangRow(lang);
    if (!existing) return this.insertLangRow(lang, todayDaySeed);
    if (existing.today_day_seed === todayDaySeed) return existing;
    return this.rolloverToDay(existing, todayDaySeed);
  }

  private async rolloverToDay(row: LangRow, todayDaySeed: string): Promise<LangRow> {
    const closingDayScore = row.today_best_score;
    const gapDays = daysBetween(row.today_day_seed, todayDaySeed);
    const buckets = rowToBuckets(row);

    const yesterdayBestScore = gapDays === 1 ? closingDayScore : 0;
    const lifetimeTotalUpToYesterday = row.lifetime_total_up_to_yesterday + closingDayScore;
    const dailyStreak = gapDays === 1 && closingDayScore > 0 ? row.daily_streak + 1 : 0;

    const todayEpoch = Date.parse(`${todayDaySeed}T00:00:00Z`);
    const newWeekKey = weekKeyUtc(todayEpoch), newMonthKey = monthKeyUtc(todayEpoch), newYearKey = yearKeyUtc(todayEpoch);
    const week = advanceBucket(buckets.week, weeksBetween(buckets.week.currentKey, newWeekKey), closingDayScore, newWeekKey);
    const month = advanceBucket(buckets.month, monthsBetween(buckets.month.currentKey, newMonthKey), closingDayScore, newMonthKey);
    const year = advanceBucket(buckets.year, yearsBetween(buckets.year.currentKey, newYearKey), closingDayScore, newYearKey);

    this.sql.exec(
      `UPDATE normal_mode_lang_state SET
        today_day_seed = ?, attempts_used_today = 0, today_best_score = 0, today_attempts_json = '[]',
        yesterday_best_score = ?,
        week_current_key = ?, week_current_total = ?, week_previous_key = ?, week_previous_total = ?,
        month_current_key = ?, month_current_total = ?, month_previous_key = ?, month_previous_total = ?,
        year_current_key = ?, year_current_total = ?, year_previous_key = ?, year_previous_total = ?,
        lifetime_total_up_to_yesterday = ?, daily_streak = ?
       WHERE lang = ?`,
      todayDaySeed, yesterdayBestScore,
      week.currentKey, week.currentTotal, week.previousKey, week.previousTotal,
      month.currentKey, month.currentTotal, month.previousKey, month.previousTotal,
      year.currentKey, year.currentTotal, year.previousKey, year.previousTotal,
      lifetimeTotalUpToYesterday, dailyStreak, row.lang
    );

    const updated = this.getLangRow(row.lang)!;
    await this.syncPeriodStatsToD1(updated);
    return updated;
  }

  private async syncPeriodStatsToD1(row: LangRow): Promise<void> {
    const player = this.requirePlayerRow();
    await this.env.DB.prepare(
      `INSERT INTO player_period_stats
         (player_id, lang, alias, country, previous_week_key, previous_week_total,
          previous_month_key, previous_month_total, previous_year_key, previous_year_total,
          lifetime_total_up_to_yesterday, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT (player_id, lang) DO UPDATE SET
         alias = excluded.alias, country = excluded.country,
         previous_week_key = excluded.previous_week_key, previous_week_total = excluded.previous_week_total,
         previous_month_key = excluded.previous_month_key, previous_month_total = excluded.previous_month_total,
         previous_year_key = excluded.previous_year_key, previous_year_total = excluded.previous_year_total,
         lifetime_total_up_to_yesterday = excluded.lifetime_total_up_to_yesterday, updated_at = excluded.updated_at`
    ).bind(
      player.player_id, row.lang, player.alias, player.country,
      row.week_previous_key, row.week_previous_total,
      row.month_previous_key, row.month_previous_total,
      row.year_previous_key, row.year_previous_total,
      row.lifetime_total_up_to_yesterday, Date.now()
    ).run();
  }

  private buildPlayerProfileDTO(player: PlayerRow, lang: LangRow): PlayerProfile {
    return {
      alias: player.alias,
      country: player.country,
      dailyStreak: lang.daily_streak,
      hasSeenRulesIntro: lang.has_seen_rules_intro === 1,
      adsEnabled: player.ads_enabled === 1,
    };
  }

  async getPlayerProfileForLang(lang: string): Promise<PlayerProfile> {
    const langRow = await this.ensureLangRow(lang, resolveTodayDaySeed());
    return this.buildPlayerProfileDTO(this.requirePlayerRow(), langRow);
  }

  async enterNormalMode(lang: string): Promise<NormalModeStatus> {
    const todayDaySeed = resolveTodayDaySeed();
    const langRow = await this.ensureLangRow(lang, todayDaySeed);
    const player = this.requirePlayerRow();
    const puzzle = resolveDailyPuzzle(lang, todayDaySeed);

    return {
      daySeed: todayDaySeed,
      puzzle,
      attemptsUsedToday: langRow.attempts_used_today,
      bestScoreToday: langRow.today_best_score,
      attemptsHistory: JSON.parse(langRow.today_attempts_json) as AttemptRecord[],
      player: this.buildPlayerProfileDTO(player, langRow),
    };
  }

  async submitAttempt(lang: string, word: string): Promise<AttemptResult> {
    const todayDaySeed = resolveTodayDaySeed();
    const langRow = await this.ensureLangRow(lang, todayDaySeed);
    const player = this.requirePlayerRow();

    if (langRow.attempts_used_today >= NORMAL_MODE_DAILY_ATTEMPTS_LIMIT) {
      throw new Error("Daily attempt limit reached.");
    }

    const puzzle = resolveDailyPuzzle(lang, todayDaySeed);
    const upperWord = word.toUpperCase();
    if (!isStructurallyValid(upperWord, puzzle.consonants)) throw new Error("Word fails structural validation.");

    const valid = resolveDictionary(lang, puzzle.consonants).has(upperWord);
    const scoreThisAttempt = valid ? calculateAttemptScore(upperWord.length, puzzle.digits, puzzle.bonusType) : 0;

    const attempts = JSON.parse(langRow.today_attempts_json) as AttemptRecord[];
    attempts.push({ word: upperWord, valid, score: scoreThisAttempt });
    const newBest = Math.max(langRow.today_best_score, scoreThisAttempt);
    const newAttemptsUsed = langRow.attempts_used_today + 1;

    this.sql.exec(
      "UPDATE normal_mode_lang_state SET attempts_used_today = ?, today_best_score = ?, today_attempts_json = ? WHERE lang = ?",
      newAttemptsUsed, newBest, JSON.stringify(attempts), lang
    );

    return {
      valid,
      scoreThisAttempt,
      attemptsUsedToday: newAttemptsUsed,
      bestScoreToday: newBest,
      player: this.buildPlayerProfileDTO(player, { ...langRow, attempts_used_today: newAttemptsUsed, today_best_score: newBest }),
    };
  }

  async setRulesIntroSeen(lang: string): Promise<void> {
    await this.ensureLangRow(lang, resolveTodayDaySeed());
    this.sql.exec("UPDATE normal_mode_lang_state SET has_seen_rules_intro = 1 WHERE lang = ?", lang);
  }
}