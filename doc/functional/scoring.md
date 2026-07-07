# Scoring & Leaderboard Specification

## 1. Where Scoring Happens

All scoring is computed by the Worker, never by the client — see
`doc/technical/security-anticheat.md` §5. The client only renders whatever the Worker returns
for a given attempt; it never calculates or asserts a score itself.

## 2. Inverse Length Formula

```
Attempt Score = (PLATE_SCORING_BASE_SCORE - Word_Length) + Plate_Bonus
```

- `PLATE_SCORING_BASE_SCORE`: `100`
- A 3-letter word scores higher than a 10-letter word.
- An attempt that fails dictionary validation scores `0` and does not affect
  `bestScoreToday` (see §4).

## 3. Plate Digit Bonus

The 4 digits of the day's plate act as a score modifier, computed once per day by the Worker
when resolving that day's puzzle.

### 3.1 Sum Base Bonus
- Sum all 4 digits.
- If `PLATE_NUMERIC_BONUS_ENABLED` is `true`, multiply by `PLATE_NUMERIC_BONUS_MULTIPLIER` and
  add to the attempt score.

### 3.2 Jackpot Pattern Detection

| Pattern | Example | Trigger |
|---|---|---|
| Capicúa (Palindrome) | `1221`, `4334` | `PLATE_JACKPOT_PATTERN_MULTIPLIER` (×2.0) |
| Perfect Pairs | `2244`, `1188` | `PLATE_JACKPOT_PATTERN_MULTIPLIER` (×2.0) |
| Trio / Quartet | `7772`, `0000` | `PLATE_JACKPOT_PATTERN_MULTIPLIER` (×2.0) |

## 4. Daily Consolidation — `normalModeScore`

A day's best valid attempt is tracked as `bestScoreToday` on the player's Durable Object,
updated each time a new attempt scores higher than the current value. `bestScoreToday` is
**provisional** until the day closes (`attemptsUsedToday` reaches `DAILY_ATTEMPTS_LIMIT`), at
which point it is added once to `normalModeScore` and reset for the next day. Only the single
best word found across a given day's attempts ever contributes to the cumulative total — see
`doc/technical/security-anticheat.md` §6.

`normalModeScore` only ever increases. A day where no valid word was found contributes `0` —
the cumulative total is simply left unchanged, never reset or reduced.

## 5. Leaderboard Scope

`normalModeScore` is scoped per dictionary/plate language (`lang`), never mixed across
languages, and never scoped by the player's interface language — see
`doc/technical/worker-architecture.md` §6. Travel Mode and Remote Mode have their own
independent, room-scoped rankings (see `doc/functional/game-modes.md`) and do not contribute
to `normalModeScore`.

## 6. Status — Provisional

The current `calculateAttemptScore` implementation follows §2-3 literally, but the
model itself is open for revision: per-bonus-type multipliers (not just jackpot vs.
non-jackpot), word difficulty (model undefined), and a per-attempt-number penalty
(1st attempt vs. 5th) are all pending a full scoring redesign. `PLATE_SCORING_BASE_SCORE`
itself is also unconfirmed. See `doc/NEXT_STEPS.md`.