# Scoring & Leaderboard Specification

## 1. Inverse Scoring Formula

YouTube Playables leaderboards rank scores in **ascending** order by default.
To map shorter words (better performance) to higher leaderboard positions, scores are inverted:

```
Final Score = (PLATE_SCORING_BASE_SCORE - Word_Length) + Plate_Bonus
```

- `PLATE_SCORING_BASE_SCORE`: `100`
- A 3-letter word scores higher than a 10-letter word.
- Failed sessions (no valid word found) submit a score of `0`.

## 2. Plate Digit Bonus

The 4 digits of the license plate act as a dynamic score modifier.

### 2.1 Sum Base Bonus
- Sum all 4 digits.
- If `PLATE_NUMERIC_BONUS_ENABLED` is `true`, multiply by `PLATE_NUMERIC_BONUS_MULTIPLIER` and add to score.

### 2.2 Jackpot Pattern Detection
Before computing the bonus, the 4-digit string is audited for premium patterns:

| Pattern | Example | Trigger |
|---|---|---|
| Capicúa (Palindrome) | `1221`, `4334` | `PLATE_JACKPOT_PATTERN_MULTIPLIER` (×2.0) |
| Perfect Pairs | `2244`, `1188` | `PLATE_JACKPOT_PATTERN_MULTIPLIER` (×2.0) |
| Trio / Quartet | `7772`, `0000` | `PLATE_JACKPOT_PATTERN_MULTIPLIER` (×2.0) |

## 3. Platform Submission Flow

- Scores are submitted via `ytgame.engagement.sendScore({ value: N })`. YouTube resolves the target leaderboard automatically from the registered game identity — no leaderboard ID is passed by the client.
- The SDK aggregates daily scores into the player's lifetime historic profile automatically.
- **No direct leaderboard submission from the client.** A score is only committed after receiving a cryptographic authorization token from the Cloudflare Worker verification endpoint. See `doc/technical/security-anticheat.md` for the full verification flow.