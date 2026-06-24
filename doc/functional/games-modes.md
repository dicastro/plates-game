# Game Modes Specification

## 1. Normal Mode (Daily Global Challenge)

- A global `daySeed`, resolved by the Worker, synchronizes the same 3-consonant combination
  across all players of a given dictionary/plate language worldwide.
- Resets daily at exactly **00:00 UTC** — the Worker is the sole authority on what day it is;
  client device timezones are never trusted.
- `DAILY_ATTEMPTS_LIMIT` (5) attempts allowed per day. A structurally-invalid guess (wrong
  consonant order/count) is rejected locally and never counts as an attempt — see
  `doc/technical/security-anticheat.md` §5.
- Scoring and daily consolidation: see `doc/functional/scoring.md`.
- A day where all attempts are exhausted without a valid word leaves `normalModeScore`
  unchanged (contributes `0`).

## 2. Travel Mode (Synchronous Local Party)

- The room host configures constraints; the Worker generates a unique 4-digit room token and
  creates a Durable Object for that room.
- Clients synchronize state against that room's Durable Object (HTTP polling initially; native
  WebSockets are a candidate upgrade — see `doc/technical/worker-architecture.md` §2).
- `TRAVEL_DEFAULT_ROUNDS` (5) sequential rounds per session.
- `TRAVEL_COUNTDOWN_SECONDS` (60) strict per-round timer.
- `TRAVEL_ATTEMPTS_LIMIT` (1) — one single high-stakes attempt per round.
- `TRAVEL_LOBBY_TIMEOUT_SECONDS` (300) — room auto-disposed if not filled within 5 minutes.
- **Audio Seed:** the 4-digit Room ID acts as the PRNG seed for the Web Audio synthesizer, so
  all players in the same physical space hear identical procedurally generated music.
- Ranking is room-scoped and independent of the Normal Mode leaderboard — see
  `doc/functional/scoring.md` §5.
- Room creation includes a player-chosen `roomName`, distinct from the join code/`roomId`. Finished rooms are listed in the lobby from the D1 projection described in `doc/technical/worker-architecture.md` §9, not from live Durable Object state.

## 3. Remote Mode (Asynchronous League)

- Extended `REMOTE_TIME_WINDOW_HOURS` (24h) for challenged friends to submit scores.
- `REMOTE_ATTEMPTS_LIMIT` (1) — one definitive attempt per player.
- **Blind Leaderboard:** players cannot view competitors' scores until they submit their own,
  preventing strategic word-length optimization.
- Ranking is room-scoped and independent of the Normal Mode leaderboard — see
  `doc/functional/scoring.md` §5.