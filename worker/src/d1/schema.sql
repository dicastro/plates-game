-- Closed-period leaderboard projection. Written exclusively by PlayerDO's
-- daily rollover (see PlayerDO.syncPeriodStatsToD1) — never by same-day
-- attempts. Read by the ranking endpoints (pending — item 9 continuation)
-- behind a Cache API layer keyed on (lang, window, country?), TTL until
-- next UTC midnight.
--
-- Note: a player's contribution to a closed period only lands here once
-- they play again on a later day (the rollover that closes that period).
-- A player who stops playing mid-period is not retroactively included in
-- that period's closed totals. Acceptable per product decision — see
-- AI_CONTEXT.md.

CREATE TABLE player_period_stats (
  player_id                        TEXT    NOT NULL,
  lang                              TEXT    NOT NULL,
  alias                             TEXT    NOT NULL,
  country                           TEXT    NOT NULL,
  previous_week_key                 TEXT    NOT NULL,
  previous_week_total               INTEGER NOT NULL,
  previous_month_key                TEXT    NOT NULL,
  previous_month_total              INTEGER NOT NULL,
  previous_year_key                 TEXT    NOT NULL,
  previous_year_total               INTEGER NOT NULL,
  lifetime_total_up_to_yesterday    INTEGER NOT NULL,
  updated_at                        INTEGER NOT NULL,
  PRIMARY KEY (player_id, lang)
);

CREATE INDEX idx_pps_lang ON player_period_stats (lang);
CREATE INDEX idx_pps_lang_country ON player_period_stats (lang, country);