# Security & Anti-Cheat Architecture

## 1. Principle

The Worker is the sole authority for puzzle generation, word validation, scoring, and attempt
counting. The client never asserts its own state — it only sends *actions* (attempt a word,
enter Normal Mode) and renders whatever the Worker returns. There is nothing for the client to
forge, because nothing it claims about its own progress is ever trusted. HTTPS protects the request/response in transit; the Durable Object is the only thing that ever needs to be trusted, and it is never reachable except through the Worker's own logic.

## 2. Identity

Every action is tied to the player's OAuth-authenticated session (a Worker-issued
`httpOnly`/`Secure` cookie, sent automatically by the browser — never read or stored by
client code). The Worker resolves `playerId` from this session on every request; it is never
accepted as a request parameter from the client. See `doc/technical/worker-architecture.md`
for the OAuth flow.

## 3. Dictionary & Daily Puzzle — Server-Only

The dictionary and the daily plate sequence are generated offline and bundled directly into
the Worker's deployed code — never shipped to the client in any form, hashed or otherwise.
Both are pure in-memory lookups inside the Worker process. See
`doc/technical/worker-architecture.md` for the data format and update workflow.

## 4. Per-Player Authoritative State — Durable Objects

Each player has exactly one Durable Object instance, keyed by `playerId`, holding:

```
{
  daySeed: string,              // which day attemptsUsedToday/bestScoreToday refer to
  attemptsUsedToday: number,
  bestScoreToday: number,       // provisional, see §6
  normalModeScore: number,      // consolidated, monotonically increasing
  lastDaySeedPlayed: string,
  currentStreakDays: number
}
```

The Durable Object model serializes all operations on a given player, eliminating race
conditions between concurrent requests without manual locking — this is the actual mechanism
preventing a player from, for example, firing two simultaneous attempts to bypass the daily
limit.

## 5. Attempt Validation Flow

1. **Client-side structural pre-check** — implemented in `shared/wordValidation.ts`,
   imported by both the client and the Worker. Rules:
   - The word must contain each of the puzzle's consonants, in order, at least once.
   - Any number of other letters may appear before, between, or after them.
   - The word length must be strictly greater than the number of consonants (minimum
     one vowel guaranteed; no real word in any supported language consists solely of
     consonants).
   - Examples for consonants `[C, N, T]`: `CANTO` ✓, `CANT` ✓, `CNNNNT` ✓,
     `AAAACNT` ✓, `CNT` ✗ (length equals consonant count), `ACNT` ✓.
   - A word failing this check is rejected locally, never reaches the Worker, consumes
     no attempt, and does not affect the player's streak.
2. Only structurally-valid words are sent to the Worker as a `submitAttempt` action.
3. The Worker reads the player's Durable Object. If `attemptsUsedToday` has already reached
   `DAILY_ATTEMPTS_LIMIT`, the action is rejected outright.
4. Otherwise, the Worker checks the word against today's dictionary segment. Both outcomes
   below increment `attemptsUsedToday` and update `lastDaySeedPlayed`/`currentStreakDays` —
   submitting a structurally-valid guess that turns out not to be a real word still counts as
   a genuine attempt at today's puzzle:
   - **Not found in the dictionary:** rejected, no score.
   - **Found:** scored per `doc/functional/scoring.md`; if higher than the current
     `bestScoreToday`, replaces it.
5. The Worker returns the updated state (attempts remaining, this attempt's result,
   `bestScoreToday`); the client renders it without persisting anything itself.

## 6. Daily Consolidation

A day's `bestScoreToday` is provisional until the day closes — closing happens when
`attemptsUsedToday` reaches `DAILY_ATTEMPTS_LIMIT`, at which point `bestScoreToday` is added
to `normalModeScore` once, and `bestScoreToday` resets for the next day. This prevents
inflating the cumulative total by finding multiple valid words for the same day's puzzle —
only the single best word found across that day's attempts ever counts.

## 7. Rate Limiting

No dedicated rate-limiting product is used. The attempt counter in §4/§5 already bounds
Normal Mode abuse structurally — there is no way to attempt more than
`DAILY_ATTEMPTS_LIMIT` words per day regardless of how many requests are fired, because the
Durable Object rejects any attempt once the counter is exhausted. The equivalent bound for
Travel/Remote modes is the room's own Durable Object state (round count, attempts-per-round).