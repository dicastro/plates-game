# Platform Strategy Architecture

## 1. Principle

All platform-specific capabilities are abstracted behind a single `PlatformService` interface.
React components, hooks, and styles are **strictly prohibited** from referencing `window.ytgame`
or any YouTube SDK syntax directly.

## 2. `PlatformService` Interface

| Method | Description |
|---|---|
| `initialize(): Promise<void>` | Bootstraps platform context. In production, triggers `ytgame.game.firstLaunchCompleted()` and fetches the canonical UTC timestamp. |
| `notifyFirstFrameReady(): void` | Signals the platform that something is visibly rendered. Owned exclusively by `SplashScreen`, called as early as possible. |
| `notifyGameReady(): void` | Signals the platform that the game is fully interactive. Owned exclusively by `SplashScreen`, called right before navigating to `HOME`. |
| `archiveFinishedSessions(): Promise<void>` | Migrates `FINISHED` Travel/Remote KV sessions into player storage. No-op on platforms without KV-backed sessions. |
| `saveData(data): Promise<void>` | Persists encrypted state to platform storage as a single blob. |
| `loadData(): Promise<unknown>` | Retrieves and decrypts state from platform storage. |
| `submitScore(value): Promise<void>` | Submits a Worker-verified score to the leaderboard. |
| `getLanguage(): string` | Returns the 2-letter locale code (e.g., `'en'`, `'es'`). |
| `showRewardedVideoAd(): Promise<boolean>` | Requests a rewarded video ad; resolves `true` if fully watched. |
| `muteAudio(isMuted: boolean): void` | Delegates to `ProceduralAudioEngine.setMute()`. |
| `onPause(callback): void` | Registers a listener for platform-forced pause events. |
| `onResume(callback): void` | Registers a listener for platform resume events. |
| `isSystemAudioEnabled(): boolean` | Current platform-level audio permission (YouTube mute button / device mute). |
| `onSystemAudioChange(callback): void` | Registers a listener fired when the platform's audio permission changes. |

## 3. Available Strategies

### `MemoryPlatform` (`VITE_PLATFORM_TARGET=MEMORY`)
- Active during local development.
- Persistence: `sessionStorage` under a fixed internal key `"plates_save"` (volatile, cleared on tab close).
- Lifecycle events: **no longer uses the Page Visibility API** (forbidden per Playables integration requirements — see `doc/technical/playables-references.md`). Exposes the same debug-hook contract as the real SDK via `installDevSimulationHooks()` (`src/platform/devTools.ts`), shared with the future `CloudflarePlatform`.
- Dev-only global hooks exposed on `window` (installed via `installDevSimulationHooks`):
  - `__SIMULATE_YT_PAUSE__()` / `__SIMULATE_YT_RESUME__()`
  - `__SIMULATE_YT_AUDIO_CHANGE__(enabled: boolean)`
- All data is wrapped/unwrapped via `PayloadCrypto` (`seal` / `unseal`) identically to production.

### `CloudflarePlatform` (`VITE_PLATFORM_TARGET=CLOUDFLARE`)
- Active for the public web review URL required by Google for YouTube Playables submission.
- Bypasses the YouTube SDK; communicates via HTTP `fetch` with Cloudflare Workers and KV.
- Simulates remote user profiles and global leaderboards.
- **Status:** not yet implemented.
- When implemented, must reuse `installDevSimulationHooks()` (`src/platform/devTools.ts`) for the same reason as `MemoryPlatform`: no real Playables SDK signal exists, so pause/resume/audio-change must be simulated identically.

### `YouTubePlatform` (`VITE_PLATFORM_TARGET=YOUTUBE`)
- Active in `yt-local` (dev) and `yt-zip` (production) modes.
- Requires `window.ytgame` SDK to be present — guards with a warn-and-return if absent.
- Persistence: `ytgame.game.saveData()` / `loadData()` — single blob, no key namespacing.
  The `PlatformService` interface enforces the same single-blob constraint on all platforms.
- Lifecycle: `ytgame.system.onPause` / `onResume`.
- Score: `ytgame.engagement.sendScore({ value })`.
- Language: `ytgame.system.getLanguage()` sliced to 2-char locale code.
- `firstFrameReady()`/`gameReady()` are NOT called inside `initialize()` — they are separate `PlatformService` methods, called explicitly by `SplashScreen` at the correct points in its own sequence (see `doc/functional/screen-map.md` §5).

## 4. Factory

```typescript
// src/platform/PlatformService.ts
const target = import.meta.env.VITE_PLATFORM_TARGET; // 'MEMORY' | 'CLOUDFLARE' | 'YOUTUBE'
PlatformFactory.create() // → returns the correct strategy instance
```

## 5. Environment Variables

| Variable | Values | Location |
|---|---|---|
| `VITE_PLATFORM_TARGET` | `MEMORY` / `CLOUDFLARE` / `YOUTUBE` | `.env.development` / `.env.demo` / `.env.yt-local` / `.env.yt-zip` |
| VITE_DICT_TARGET | `es` / `en` / `fr` / ... | `.env.development` / `.env.demo` / `.env.yt-local` / `.env.yt-zip` |
| `VITE_STORAGE_SALT` | arbitrary secret string | `.env.development` / Cloudflare dashboard (encrypted) |
| `VITE_DICTIONARY_SALT` | arbitrary secret string | Cloudflare dashboard only — never in repo |