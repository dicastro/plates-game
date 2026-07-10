import { withSession } from "./withSession";
import { resolvePlayerStub } from "./resolvePlayerStub";
import { LEADERBOARD_TOP_N } from "../../../shared/gameConfig";
import { previousWeekKeyUtc } from "../../../shared/isoWeek";
import { MONTH_COLUMNS } from "../monthColumns";
import type { LeaderboardEntry, LeaderboardResult, AvailableLeaderboardPeriods, LeaderboardPeriodType } from "../../../shared/types";
import type { LeaderboardContext, LeaderboardAvailableContext, LeaderboardQueryParams } from "../../../shared/apiRoutes";
import { resolveTimeService } from "../time/timeServiceInstance";

interface RankedRow {
  player_id: string;
  alias: string;
  country: string;
  score: number
}

interface OwnRow {
  alias: string;
  country: string;
  score: number
}

interface RankRow {
  rank: number
}

interface MonthYearRow {
  year: number;
  month: number
}

interface PeriodSource {
  table: string;
  scoreCol: string;
  extraWhere: string;
  extraBinds: unknown[];
  intervalLabel: string;
  periodType: LeaderboardPeriodType
}

interface CountRow {
  count: number;
}

interface ExistsRow {
  flag: number;
}

interface SumRow {
  total: number;
}

interface PeriodTypeKeyRow {
  period_type: string;
  period_key: string;
}

function resolvePeriodSource(query: LeaderboardQueryParams, nowMs: number): PeriodSource {
  switch (query.period) {
    case "week": {
      const key = previousWeekKeyUtc(nowMs);
      return {
        table: "player_period_stats",
        scoreCol: "week_previous_score",
        extraWhere: "week_previous_key = ?",
        extraBinds: [key],
        intervalLabel: key,
        periodType: query.period
      };
    }
    case "total":
      const key = previousWeekKeyUtc(nowMs);
      return {
        table: "player_period_stats",
        scoreCol: "lifetime_score_up_to_last_week",
        extraWhere: "",
        extraBinds: [],
        intervalLabel: key,
        periodType: query.period
      };
    case "month": {
      if (!query.year || !query.month) throw new Error("month period requires year and month.");
      const col = `${MONTH_COLUMNS[query.month - 1]}_score`;
      return {
        table: "player_year_stats",
        scoreCol: col,
        extraWhere: `year = ? AND ${col} IS NOT NULL`,
        extraBinds: [query.year],
        intervalLabel: `${query.year}-${String(query.month).padStart(2, "0")}`,
        periodType: query.period
      };
    }
    case "year": {
      if (!query.year) throw new Error("year period requires year.");
      return {
        table: "player_year_stats",
        scoreCol: "year_score",
        extraWhere: "year = ? AND dec_score IS NOT NULL",
        extraBinds: [query.year],
        intervalLabel: String(query.year),
        periodType: query.period
      };
    }
  }
}

function buildWhereClause(source: PeriodSource, lang: string, country?: string): { clause: string; binds: unknown[] } {
  const parts = ["lang = ?"];
  const binds: unknown[] = [lang];
  if (source.extraWhere) {
    parts.push(source.extraWhere);
    binds.push(...source.extraBinds);
  }
  if (country) {
    parts.push("country = ?");
    binds.push(country);
  }
  return { clause: parts.join(" AND "), binds };
}

export const handleLeaderboard = withSession<LeaderboardContext>(async (_request, env, session, context) => {
  const nowMs = resolveTimeService(env).now();
  const source = resolvePeriodSource(context, nowMs);
  const topWhere = buildWhereClause(source, context.lang, context.country);

  const topResult = await env.DB.prepare(
    `SELECT player_id, alias, country, ${source.scoreCol} AS score FROM ${source.table} WHERE ${topWhere.clause} ORDER BY score DESC LIMIT ?`
  ).bind(...topWhere.binds, LEADERBOARD_TOP_N).all<RankedRow>();
  const rows = topResult.results ?? [];

  const stub = resolvePlayerStub(env, session);
  const requesterId = await stub.getPlayerId();

  const entries: LeaderboardEntry[] = rows.map((r, i) => ({
    rank: i + 1, alias: r.alias, country: r.country, score: r.score,
  }));
  const alreadyIncluded = rows.some((r) => r.player_id === requesterId);

  let ownEntry: LeaderboardEntry | null = null;
  if (!alreadyIncluded) {
    const ownWhere = buildWhereClause(source, context.lang, context.country);
    const own = await env.DB.prepare(
      `SELECT alias, country, ${source.scoreCol} AS score FROM ${source.table} WHERE ${ownWhere.clause} AND player_id = ?`
    ).bind(...ownWhere.binds, requesterId).first<OwnRow>();

    if (own) {
      const rankWhere = buildWhereClause(source, context.lang, context.country);
      const rankRow = await env.DB.prepare(
        `SELECT COUNT(*) + 1 AS rank FROM ${source.table} WHERE ${rankWhere.clause} AND ${source.scoreCol} > ?`
      ).bind(...rankWhere.binds, own.score).first<RankRow>();

      ownEntry = { rank: rankRow?.rank ?? entries.length + 1, alias: own.alias, country: own.country, score: own.score };
    }
  }

  const statsCountryClause = context.country ? " AND country = ?" : "";
  const statsCountryBind: unknown[] = context.country ? [context.country] : [];

  const totalPlayersRow = await env.DB.prepare(
    `SELECT COALESCE(SUM(player_count), 0) as total FROM available_periods WHERE lang = ? AND period_type = ? AND period_key = ?${statsCountryClause}`
  ).bind(context.lang, source.periodType, source.intervalLabel, ...statsCountryBind).first<SumRow>();
  const totalPlayers = totalPlayersRow?.total ?? 0;

  let totalCountries: number | undefined;
  if (!context.country) {
    const countriesRow = await env.DB.prepare(
      `SELECT COUNT(*) AS count FROM available_periods WHERE lang = ? AND period_type = ? AND period_key = ?`
    ).bind(context.lang, source.periodType, source.intervalLabel).first<CountRow>();
    totalCountries = countriesRow?.count ?? 0;
  }

  const result: LeaderboardResult = { entries, ownEntry, intervalLabel: source.intervalLabel, totalPlayers, totalCountries };

  return Response.json(result);
});

export const handleLeaderboardAvailable = withSession<LeaderboardAvailableContext>(async (_request, env, _session, context) => {
  const nowMs = resolveTimeService(env).now();

  const weekRow = await env.DB.prepare(
    "SELECT 1 AS flag FROM player_period_stats WHERE lang = ? AND week_previous_key = ? LIMIT 1"
  ).bind(context.lang, previousWeekKeyUtc(nowMs)).first<ExistsRow>();

  const monthsYearsResult = await env.DB.prepare(
    "SELECT DISTINCT period_type, period_key FROM available_periods WHERE lang = ? AND period_type IN ('month', 'year') ORDER BY period_key"
  ).bind(context.lang).all<PeriodTypeKeyRow>();

  let months: MonthYearRow[] = [];
  let years: number[] = [];

  if (monthsYearsResult.results) {
    monthsYearsResult.results.forEach((r) => {
      if (r.period_type === "month") {
        const [year, month] = r.period_key.split("-").map(Number);
        months.push({year, month});
      }

      if (r.period_type === "year") {
        years.push(Number(r.period_key));
      }
    });
  }

  const result: AvailableLeaderboardPeriods = { week: !!weekRow, years, months };
  return Response.json(result);
});