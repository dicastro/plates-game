# Platform Strategy Architecture

## 1. Principle

All backend interactions are abstracted behind a single `PlatformService` interface. React
components, hooks, and styles never call `fetch()` against the Worker, handle cookies, or
know anything about Cloudflare directly — they only call `PlatformService` methods.

## 2. `PlatformService` Interface

| Method | Description |
|---|---|
| `initialize(lang: string): Promise<PlayerProfile \| null>` | Checks for an existing valid session and returns the player's profile if found, null otherwise. |
| `login(provider: AuthProviderId, intent?: string): Promise<void>` | Starts the OAuth full-page redirect flow for the given provider. |
| `logout(): Promise<void>` | Clears the Worker-issued session. |
| `enterNormalMode(lang: string): Promise<NormalModeStatus>` | Authoritative read: today's puzzle + the player's current attempts/score/streak for `lang`. |
| `submitAttempt(lang: string, word: string): Promise<AttemptResult>` | Submits a structurally-valid attempt. The Worker validates, scores, and updates the Durable Object. |
| `markRulesIntroSeen(lang: string): Promise<void>` | Persists `hasSeenRulesIntro = true` on the player's profile. Called once, the first time the player dismisses the rules overlay with "don't show again". |
| `onPause(callback): void` / `onResume(callback): void` | Page Visibility API wiring. |
| `showRewardedAd(): Promise<boolean>` | Delegates to the active `AdProvider`; resolves `true` if the rewarded flow completed. |

### Key shapes

```typescript
interface PlayerProfile {
  alias: string;
  country: string;
  dailyStreak: number;
  hasSeenRulesIntro: boolean; // resolved per queried lang on the Worker side
  adsEnabled: boolean;
}

interface AttemptRecord {
  word: string;
  valid: boolean;
  score: number;
}

interface NormalModeStatus {
  daySeed: string;
  puzzle: { consonants: string[]; digits: string; bonusType: PlateBonusType };
  attemptsUsedToday: number;
  bestScoreToday: number;
  attemptsHistory: AttemptRecord[]; // full history for the day, for the detail overlay
  player: PlayerProfile;
}

interface AttemptResult {
  valid: boolean;
  scoreThisAttempt: number;
  attemptsUsedToday: number;
  bestScoreToday: number;
  player: PlayerProfile;
}
```

## 3. Available Strategies

### `MemoryPlatform` (`VITE_PLATFORM_TARGET=MEMORY`)
- Active during local development.
- No real network calls, no persistence of any kind — every method operates on hardcoded
  in-memory data (a small fixed dictionary, a short fixed plate sequence, a mock authenticated
  player). State resets on every reload, by design.
- `login()` is a no-op that immediately resolves into the mock player — there is no real
  OAuth round-trip to simulate locally.

### `CloudflarePlatform` (`VITE_PLATFORM_TARGET=CLOUDFLARE`)
- The only production strategy.
- Communicates with the Cloudflare Worker over HTTPS via thin `fetch()` wrappers
  (`credentials: "include"`) against the endpoints in `worker-architecture.md` §5.
- `login()` performs a full-page redirect and returns a promise that deliberately
  never resolves — the page navigates away before that would matter.
- Requires the frontend's origin to be present in the Worker's `ALLOWED_ORIGINS` for
  that environment (see `worker-architecture.md` §11).

## 4. Factory

```typescript
// src/platform/PlatformService.ts
const target = import.meta.env.VITE_PLATFORM_TARGET; // 'MEMORY' | 'CLOUDFLARE'
PlatformFactory.create() // → returns the correct strategy instance
```

## 5. Environment Variables

| Variable | Values | Location |
|---|---|---|
| `VITE_PLATFORM_TARGET` | `MEMORY` / `CLOUDFLARE` | `.env.development` / `.env.production` |
| `VITE_DICT_TARGET` | `es` / `en` / ... | `.env.development` / `.env.production` |
| `VITE_WORKER_BASE_URL` | the Worker's own domain (environment-specific) | `.env.cf-staging` / `.env.production` |

Worker-side secrets (OAuth client secret, D1/DO bindings) are Cloudflare-managed and never
appear in any client-side `.env*` file — see `doc/technical/worker-architecture.md`.