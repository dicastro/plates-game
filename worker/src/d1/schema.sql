-- Closed-period leaderboard projection, non-historized granularities only
-- (day, week, lifetime-to-date). Historized month/year data lives in
-- player_year_stats. Written exclusively by PlayerDO's daily rollover.
--
-- previous_day_key / previous_week_key are the real UTC period keys the
-- "previous" totals refer to. Ranking queries filter on the key matching
-- the actual "yesterday"/"last week" (computed by the Worker), not just on
-- the total being non-null — this is what excludes a player who stopped
-- playing days ago instead of showing their stale total forever.
CREATE TABLE player_period_stats (
  player_id                        TEXT    NOT NULL,
  lang                             TEXT    NOT NULL,
  alias                            TEXT    NOT NULL,
  country                          TEXT    NOT NULL,
  week_previous_key                TEXT    NOT NULL,
  week_previous_score              INTEGER NOT NULL,
  lifetime_score_up_to_last_week   INTEGER NOT NULL,
  updated_at                       INTEGER NOT NULL,
  PRIMARY KEY (player_id, lang)
);

CREATE INDEX idx_pps_lang_week ON player_period_stats (lang, week_previous_key, week_previous_score);
CREATE INDEX idx_pps_lang_lifetime ON player_period_stats (lang, lifetime_score_up_to_last_week);
CREATE INDEX idx_pps_lang_country ON player_period_stats (lang, country);

-- Historized month-by-month + year total. One row per player/lang/year.
-- NULL column = that month/year hasn't closed for this player yet (never
-- played it, or the period itself hasn't ended). 0 = closed, played, scored
-- nothing. This distinction is what "available periods" queries rely on —
-- never inferred from wall-clock elapsed time.
CREATE TABLE player_year_stats (
  player_id  TEXT    NOT NULL,
  lang       TEXT    NOT NULL,
  year       INTEGER NOT NULL,
  alias      TEXT    NOT NULL,
  country    TEXT    NOT NULL,
  jan_score INTEGER, feb_score INTEGER, mar_score INTEGER, apr_score INTEGER,
  may_score INTEGER, jun_score INTEGER, jul_score INTEGER, aug_score INTEGER,
  sep_score INTEGER, oct_score INTEGER, nov_score INTEGER, dec_score INTEGER,
  year_score INTEGER,
  PRIMARY KEY (player_id, lang, year)
);

CREATE INDEX idx_pys_lang_year ON player_year_stats (lang, year);

-- Alias uniqueness + reverse lookup (alias -> player's Durable Object identity).
-- Durable Objects aren't queryable as a set, so this is the only way to
-- resolve "who owns this alias" without scanning every DO. The Worker
-- derives the DO id deterministically from
-- `${auth_provider_id}:${external_provider_id}` via idFromName() — no
-- separate do_id column, avoiding a second source of truth for that scheme.
CREATE TABLE aliases (
  alias                TEXT PRIMARY KEY,
  player_id            TEXT NOT NULL,
  auth_provider_id     TEXT NOT NULL,
  external_provider_id TEXT NOT NULL
);

CREATE TABLE available_periods (
  lang         TEXT NOT NULL,
  period_type  TEXT NOT NULL, -- 'week' | 'month' | 'year' | 'total'
  period_key   TEXT NOT NULL, -- ISO week key / "YYYY-MM" / "YYYY" / '' para total
  country      TEXT NOT NULL,
  player_count INTEGER NOT NULL,
  PRIMARY KEY (lang, period_type, period_key, country)
);
CREATE INDEX idx_available_periods_lookup ON available_periods (lang, period_type, period_key);