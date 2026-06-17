# Platform Strategy Architecture

## 1. Principle

All platform-specific capabilities are abstracted behind a single `PlatformService` interface.
React components, hooks, and styles are **strictly prohibited** from referencing `window.ytgame`
or any YouTube SDK syntax directly.

## 2. `PlatformService` Interface

| Method | Description |
|---|---|
| `initialize(): Promise<void>` | Bootstraps platform context. In production, triggers `ytgame.game.firstLaunchCompleted()` and fetches the canonical UTC timestamp. |
| `saveData(key, data): Promise<void>` | Persists encrypted state to platform storage. |
| `loadData(key): Promise<unknown>` | Retrieves and decrypts state from platform storage. |
| `submitScore(leaderboardId, value): Promise<void>` | Submits a Worker-verified score to the leaderboard. |
| `getLanguage(): string` | Returns the 2-letter locale code (e.g., `'en'`, `'es'`). |
| `showRewardedVideoAd(): Promise<boolean>` | Requests a rewarded video ad; resolves `true` if fully watched. |
| `muteAudio(isMuted: boolean): void` | Delegates to `ProceduralAudioEngine.setMute()`. |
| `onPause(callback): void` | Registers a listener for platform-forced pause events. |
| `onResume(callback): void` | Registers a listener for platform resume events. |

## 3. Available Strategies

### `MemoryPlatform` (`VITE_PLATFORM_TARGET=MEMORY`)
- Active during local development.
- Persistence: `sessionStorage` (volatile, cleared on tab close).
- Lifecycle events: native Page Visibility API (`visibilitychange`).
- Dev-only global hooks exposed on `window`:
  - `__SIMULATE_YT_PAUSE__()` — triggers all registered pause callbacks.
  - `__SIMULATE_YT_RESUME__()` — triggers all registered resume callbacks.
- All data is wrapped/unwrapped via `PayloadCrypto` (`seal` / `unseal`) identically to production.

### `CloudflarePlatform` (`VITE_PLATFORM_TARGET=CLOUDFLARE`)
- Active for the public web review URL required by Google for YouTube Playables submission.
- Bypasses the YouTube SDK; communicates via HTTP `fetch` with Cloudflare Workers and KV.
- Simulates remote user profiles and global leaderboards.
- **Status:** not yet implemented.

### `YouTubePlatform` (`VITE_PLATFORM_TARGET=YOUTUBE`)
- Active in the final production ZIP bundle.
- Maps all interface methods directly to `window.ytgame` SDK calls.
- **Status:** not yet implemented.

## 4. Factory

```typescript
// src/platform/PlatformService.ts
const target = import.meta.env.VITE_PLATFORM_TARGET; // 'MEMORY' | 'CLOUDFLARE' | 'YOUTUBE'
PlatformFactory.create() // → returns the correct strategy instance
```

## 5. Environment Variables

| Variable | Values | Location |
|---|---|---|
| `VITE_PLATFORM_TARGET` | `MEMORY` / `CLOUDFLARE` / `YOUTUBE` | `.env.development` / Cloudflare dashboard |
| `VITE_STORAGE_SALT` | arbitrary secret string | `.env.development` / Cloudflare dashboard (encrypted) |
| `VITE_DICTIONARY_SALT` | arbitrary secret string | Cloudflare dashboard only — never in repo |