// Centralized, tunable game constants — see SPECS.md §1 for the full
// documented table. Values are plain exported constants, not env vars: they
// are game-design parameters, not per-environment configuration.

export const NORMAL_MODE_DAILY_ATTEMPTS_LIMIT = 5;
export const MIN_PLAYABLE_HEIGHT_PX = 480;
export const ALIAS_MIN_LENGTH = 3;
export const ALIAS_MAX_LENGTH = 20;
export const LEADERBOARD_TOP_N = 100;