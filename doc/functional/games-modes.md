# Game Modes Specification

## 1. Normal Mode (Daily Global Challenge)

- A global seed synchronizes the same 3-consonant combination across all players worldwide.
- Resets daily at exactly **00:00 UTC** — client device timezones are never trusted.
- `DAILY_ATTEMPTS_LIMIT` (5) attempts allowed per day.
- Scores map directly to the YouTube Leaderboard API payload via the inverse formula.
- A failed session (all attempts exhausted without a valid word) submits a score of `0`.

## 2. Travel Mode (Synchronous Local Party)

- The room host configures constraints; a Cloudflare Worker generates a unique 4-digit room token.
- Clients synchronize state via HTTP interval polling against Cloudflare KV.
- `TRAVEL_DEFAULT_ROUNDS` (5) sequential rounds per session.
- `TRAVEL_COUNTDOWN_SECONDS` (60) strict per-round timer.
- `TRAVEL_ATTEMPTS_LIMIT` (1) — one single high-stakes attempt per round.
- `TRAVEL_LOBBY_TIMEOUT_SECONDS` (300) — room auto-disposed if not filled within 5 minutes.
- `TRAVEL_KV_TTL_SECONDS` (10800) — room state expires after 3 hours in Cloudflare KV.
- **Audio Seed:** The 4-digit Room ID acts as the PRNG seed for the Web Audio synthesizer,
  so all players in the same physical space hear identical procedurally generated music.

## 3. Remote Mode (Asynchronous League)

- Extended `REMOTE_TIME_WINDOW_HOURS` (24h) for challenged friends to submit scores.
- `REMOTE_ATTEMPTS_LIMIT` (1) — one definitive attempt per player.
- `REMOTE_KV_TTL_SECONDS` (172800) — room expires after 48 hours.
- **Blind Leaderboard:** Players cannot view competitors' scores until they submit their own,
  preventing strategic word-length optimization.