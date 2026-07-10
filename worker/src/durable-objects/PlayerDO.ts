import { DurableObject } from "cloudflare:workers";
import { monthKeyUtc, weekKeyUtc, yearKeyUtc, daysBetween, weeksBetween, monthsBetween, yearsBetween } from "../dateKeys";
import { resolveDailyPuzzle } from "../data/plateCalendar";
import { resolveDictionary } from "../data/dictionary";
import { resolveTodayDaySeed } from "../todayDaySeed";
import { MONTH_COLUMNS } from "../monthColumns";
import { isStructurallyValid } from "../../../shared/wordValidation";
import { calculateAttemptScore } from "../../../shared/scoring";
import { NORMAL_MODE_DAILY_ATTEMPTS_LIMIT } from "../../../shared/gameConfig";
import type { AttemptRecord, AuthProviderId, PlayerProfile, NormalModeStatus, AttemptResult, LeaderboardPeriodType } from "../../../shared/types";
import type { Env } from "../env";
import { resolveTimeService } from "../time/timeServiceInstance";

interface PlayerRow {
  player_id: string;
  auth_provider_id: string;
  external_provider_id: string;
  alias: string;
  country: string;
  ads_enabled: number;
  has_completed_alias_setup: number;
}

interface LangRow {
  lang: string;
  has_seen_rules_intro: number;
  today_day_seed: string;
  attempts_used_today: number;
  today_score: number;
  today_attempts_json: string;
  week_current_key: string;
  week_current_score: number;
  month_current_key: string;
  month_current_score: number;
  year_current_key: string;
  year_current_score: number;
  daily_streak: number;
  has_counted_in_lifetime_total: number;
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
        ads_enabled INTEGER NOT NULL,
        has_completed_alias_setup INTEGER NOT NULL
      )`);

      this.sql.exec(`CREATE TABLE IF NOT EXISTS normal_mode_lang_state (
        lang TEXT PRIMARY KEY,
        has_seen_rules_intro INTEGER NOT NULL,
        today_day_seed TEXT NOT NULL,
        attempts_used_today INTEGER NOT NULL,
        today_score INTEGER NOT NULL,
        today_attempts_json TEXT NOT NULL,
        week_current_key TEXT NOT NULL,
        week_current_score INTEGER NOT NULL,
        month_current_key TEXT NOT NULL,
        month_current_score INTEGER NOT NULL,
        year_current_key TEXT NOT NULL,
        year_current_score INTEGER NOT NULL,
        daily_streak INTEGER NOT NULL,
        has_counted_in_lifetime_total INTEGER NOT NULL
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

  async getPlayerId(): Promise<string> {
    return this.requirePlayerRow().player_id;
  }

  async createIfMissing(params: {
    authProviderId: AuthProviderId;
    externalProviderId: string;
    country: string;
  }): Promise<void> {
    if (this.getPlayerRow()) return;
    const playerId = crypto.randomUUID();

    this.sql.exec(
      `INSERT INTO player (id, player_id, auth_provider_id, external_provider_id, alias, country, ads_enabled, has_completed_alias_setup)
       VALUES (1, ?, ?, ?, ?, ?, 1, 0)`,
      playerId,
      params.authProviderId,
      params.externalProviderId,
      `Player-${params.externalProviderId.slice(0, 8)}`,
      params.country
    );
  }

  async completeAliasSetup(alias: string): Promise<PlayerProfile> {
    this.sql.exec("UPDATE player SET alias = ?, has_completed_alias_setup = 1 WHERE id = 1", alias);
    const player = this.requirePlayerRow();

    return {
      alias: player.alias,
      country: player.country,
      dailyStreak: 0,
      hasSeenRulesIntro: false,
      hasCompletedAliasSetup: true,
      adsEnabled: player.ads_enabled === 1,
      todayScore: 0,
      weekCurrentScore: 0,
      monthCurrentScore: 0,
      yearCurrentScore: 0
    };
  }

  private getLangRow(lang: string): LangRow | null {
    const rows = this.sql.exec<SqlRow<LangRow>>("SELECT * FROM normal_mode_lang_state WHERE lang = ?", lang).toArray();
    return rows.length > 0 ? rows[0] : null;
  }

  private insertLangRow(lang: string, todayDaySeed: string): LangRow {
    const epoch = Date.parse(`${todayDaySeed}T00:00:00Z`);

    this.sql.exec(
      `INSERT INTO normal_mode_lang_state (
        lang, has_seen_rules_intro, today_day_seed, attempts_used_today, today_score, today_attempts_json,
        week_current_key, week_current_score,
        month_current_key, month_current_score,
        year_current_key, year_current_score,
        daily_streak, has_counted_in_lifetime_total
      ) VALUES (?, 0, ?, 0, 0, '[]', ?, 0, ?, 0, ?, 0, 0, 0)`,
      lang, todayDaySeed, weekKeyUtc(epoch), monthKeyUtc(epoch), yearKeyUtc(epoch)
    );
    return this.getLangRow(lang)!;
  }

  private async ensureLangRow(lang: string, todayDaySeed: string): Promise<LangRow> {
    const existing = this.getLangRow(lang);
    if (!existing) return this.insertLangRow(lang, todayDaySeed);
    if (existing.today_day_seed === todayDaySeed) return existing;
    return this.rolloverToDay(existing, todayDaySeed);
  }

  private buildWeekCloseStatement(lang: string, weekPreviousKey: string, weekPreviousScore: number, lifetimeIncrement: number): D1PreparedStatement {
    const player = this.requirePlayerRow();

    const updatedAt = resolveTimeService(this.env).now();

    if (weekPreviousKey === "") {
      // Gap larger than 1 week — no genuine "previous week" to report (the
      // real previous week has zero data), but the score still counts
      // toward lifetime. week_previous_key/score are left untouched on
      // conflict — stale values never match a future ranking query's exact
      // key filter, so leaving them causes no incorrect display.
      return this.env.DB.prepare(
        `INSERT INTO player_period_stats (player_id, lang, alias, country, week_previous_key, week_previous_score, lifetime_score_up_to_last_week, updated_at)
         VALUES (?, ?, ?, ?, '', 0, ?, ?)
         ON CONFLICT (player_id, lang) DO UPDATE SET
           alias = excluded.alias, country = excluded.country,
           lifetime_score_up_to_last_week = lifetime_score_up_to_last_week + ?, updated_at = excluded.updated_at`
      ).bind(player.player_id, lang, player.alias, player.country, lifetimeIncrement, updatedAt, lifetimeIncrement);
    }

    return this.env.DB.prepare(
      `INSERT INTO player_period_stats (player_id, lang, alias, country, week_previous_key, week_previous_score, lifetime_score_up_to_last_week, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT (player_id, lang) DO UPDATE SET
         alias = excluded.alias, country = excluded.country,
         week_previous_key = excluded.week_previous_key, week_previous_score = excluded.week_previous_score,
         lifetime_score_up_to_last_week = lifetime_score_up_to_last_week + ?, updated_at = excluded.updated_at`
    ).bind(player.player_id, lang, player.alias, player.country, weekPreviousKey, weekPreviousScore, lifetimeIncrement, updatedAt, lifetimeIncrement);
  }

  // Single statement for month and/or year closing — both land on the same
  // player_year_stats row (the year that's closing), so when a rollover
  // crosses both boundaries at once this is still exactly one write.
  private buildYearRowStatement(lang: string, closingMonthKey: string, monthScore: number | null, yearScore: number | null): D1PreparedStatement {
    const player = this.requirePlayerRow();
    const [yearStr, monthStr] = closingMonthKey.split("-");
    const year = Number(yearStr);

    const insertCols = ["player_id", "lang", "year", "alias", "country"];
    const insertVals: unknown[] = [player.player_id, lang, year, player.alias, player.country];
    const setClauses = ["alias = excluded.alias", "country = excluded.country"];

    if (monthScore !== null) {
      const col = `${MONTH_COLUMNS[Number(monthStr) - 1]}_score`;
      insertCols.push(col);
      insertVals.push(monthScore);
      setClauses.push(`${col} = excluded.${col}`);
    }
    if (yearScore !== null) {
      insertCols.push("year_score");
      insertVals.push(yearScore);
      setClauses.push("year_score = excluded.year_score");
    }

    return this.env.DB.prepare(
      `INSERT INTO player_year_stats (${insertCols.join(", ")})
       VALUES (${insertCols.map(() => "?").join(", ")})
       ON CONFLICT (player_id, lang, year) DO UPDATE SET ${setClauses.join(", ")}`
    ).bind(...insertVals);
  }

  private buildAvailablePeriodStatement(lang: string, periodType: LeaderboardPeriodType, periodKey: string, country: string): D1PreparedStatement {
    return this.env.DB.prepare(
      `INSERT INTO available_periods (lang, period_type, period_key, country, player_count)
     VALUES (?, ?, ?, ?, 1)
     ON CONFLICT (lang, period_type, period_key, country) DO UPDATE SET player_count = player_count + 1`
    ).bind(lang, periodType, periodKey, country);
  }

  private async rolloverToDay(row: LangRow, todayDaySeed: string): Promise<LangRow> {
    const player = this.requirePlayerRow();
    const closingDayScore = row.today_score;
    const gapDays = daysBetween(row.today_day_seed, todayDaySeed);
    const newDailyStreak = gapDays === 1 && closingDayScore > 0 ? row.daily_streak + 1 : 0;

    const todayEpoch = Date.parse(`${todayDaySeed}T00:00:00Z`);
    const newWeekKey = weekKeyUtc(todayEpoch);
    const newMonthKey = monthKeyUtc(todayEpoch);
    const newYearKey = yearKeyUtc(todayEpoch);

    const weekElapsed = weeksBetween(row.week_current_key, newWeekKey);
    const monthElapsed = monthsBetween(row.month_current_key, newMonthKey);
    const yearElapsed = yearsBetween(row.year_current_key, newYearKey);

    const closingWeekScore = row.week_current_score + closingDayScore;
    const closingMonthScore = row.month_current_score + closingDayScore;
    const closingYearScore = row.year_current_score + closingDayScore;

    const newWeekCurrentKey = weekElapsed === 0 ? row.week_current_key : newWeekKey;
    const newWeekCurrentScore = weekElapsed === 0 ? closingWeekScore : 0;
    const newMonthCurrentKey = monthElapsed === 0 ? row.month_current_key : newMonthKey;
    const newMonthCurrentScore = monthElapsed === 0 ? closingMonthScore : 0;
    const newYearCurrentKey = yearElapsed === 0 ? row.year_current_key : newYearKey;
    const newYearCurrentScore = yearElapsed === 0 ? closingYearScore : 0;

    // First time this player ever closes a week for this lang → counts once
    // toward the lifetime totals. Read from the DO's own already-loaded row —
    // zero extra D1 round-trips, unlike checking player_period_stats directly.
    const countsTowardLifetime = weekElapsed >= 1 && row.has_counted_in_lifetime_total === 0;


    this.sql.exec(
      `UPDATE normal_mode_lang_state SET
        today_day_seed = ?, attempts_used_today = 0, today_score = 0, today_attempts_json = '[]',
        week_current_key = ?, week_current_score = ?,
        month_current_key = ?, month_current_score = ?,
        year_current_key = ?, year_current_score = ?,
        daily_streak = ?, has_counted_in_lifetime_total = ?
       WHERE lang = ?`,
      todayDaySeed,
      newWeekCurrentKey, newWeekCurrentScore,
      newMonthCurrentKey, newMonthCurrentScore,
      newYearCurrentKey, newYearCurrentScore,
      newDailyStreak, countsTowardLifetime,
      row.lang
    );

    const statements: D1PreparedStatement[] = [];

    if (weekElapsed >= 1) {
      statements.push(this.buildWeekCloseStatement(
        row.lang,
        weekElapsed === 1 ? row.week_current_key : "",
        weekElapsed === 1 ? closingWeekScore : 0,
        closingWeekScore
      ));

      // this is to avoid an extra update for a week that is not the previous one,
      // that is the only one being shown in the ranking
      if (weekElapsed === 1) {
        statements.push(this.buildAvailablePeriodStatement(row.lang, "week", row.week_current_key, player.country))
      }
    }

    if (countsTowardLifetime) {
      statements.push(this.buildAvailablePeriodStatement(row.lang, "total", "", player.country))
    }

    if (monthElapsed >= 1 || yearElapsed >= 1) {
      statements.push(this.buildYearRowStatement(
        row.lang,
        row.month_current_key,
        monthElapsed >= 1 ? closingMonthScore : null,
        yearElapsed >= 1 ? closingYearScore : null
      ));

      if (monthElapsed >= 1) {
        statements.push(this.buildAvailablePeriodStatement(row.lang, "month", row.month_current_key, player.country))
      }

      if (yearElapsed >= 1) {
        statements.push(this.buildAvailablePeriodStatement(row.lang, "year", row.year_current_key, player.country));
      }
    }

    if (statements.length > 0) {
      await this.env.DB.batch(statements);
    }

    return this.getLangRow(row.lang)!;
  }

  private buildPlayerProfileDTO(player: PlayerRow, lang: LangRow): PlayerProfile {
    return {
      alias: player.alias,
      country: player.country,
      dailyStreak: lang.daily_streak,
      hasSeenRulesIntro: lang.has_seen_rules_intro === 1,
      hasCompletedAliasSetup: player.has_completed_alias_setup === 1,
      adsEnabled: player.ads_enabled === 1,
      todayScore: lang.today_score,
      weekCurrentScore: lang.week_current_score,
      monthCurrentScore: lang.month_current_score,
      yearCurrentScore: lang.year_current_score
    };
  }

  async getPlayerProfileForLang(lang: string): Promise<PlayerProfile> {
    const langRow = await this.ensureLangRow(lang, resolveTodayDaySeed(resolveTimeService(this.env)));
    return this.buildPlayerProfileDTO(this.requirePlayerRow(), langRow);
  }

  async enterNormalMode(lang: string): Promise<NormalModeStatus> {
    const todayDaySeed = resolveTodayDaySeed(resolveTimeService(this.env));
    const langRow = await this.ensureLangRow(lang, todayDaySeed);
    const player = this.requirePlayerRow();
    const puzzle = resolveDailyPuzzle(lang, todayDaySeed);

    return {
      daySeed: todayDaySeed,
      puzzle,
      attemptsUsedToday: langRow.attempts_used_today,
      bestScoreToday: langRow.today_score,
      attemptsHistory: JSON.parse(langRow.today_attempts_json) as AttemptRecord[],
      player: this.buildPlayerProfileDTO(player, langRow),
    };
  }

  async submitAttempt(lang: string, word: string): Promise<AttemptResult> {
    const todayDaySeed = resolveTodayDaySeed(resolveTimeService(this.env));
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
    const newBest = Math.max(langRow.today_score, scoreThisAttempt);
    const newAttemptsUsed = langRow.attempts_used_today + 1;

    this.sql.exec(
      "UPDATE normal_mode_lang_state SET attempts_used_today = ?, today_score = ?, today_attempts_json = ? WHERE lang = ?",
      newAttemptsUsed, newBest, JSON.stringify(attempts), lang
    );

    return {
      valid,
      scoreThisAttempt,
      attemptsUsedToday: newAttemptsUsed,
      bestScoreToday: newBest,
      attemptsHistory: attempts,
      player: this.buildPlayerProfileDTO(player, { ...langRow, attempts_used_today: newAttemptsUsed, today_score: newBest }),
    };
  }

  async setRulesIntroSeen(lang: string): Promise<void> {
    await this.ensureLangRow(lang, resolveTodayDaySeed(resolveTimeService(this.env)));
    this.sql.exec("UPDATE normal_mode_lang_state SET has_seen_rules_intro = 1 WHERE lang = ?", lang);
  }
}