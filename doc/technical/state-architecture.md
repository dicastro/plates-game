# State Architecture — Persisted vs. Runtime Contexts

## 1. The Core Constraint

YouTube's `saveData()`/`loadData()` is **atomic** — a single blob, no key, no partial
read/write. This is a platform constraint, but per `PlatformService`'s design principle
("most restrictive platform constraint propagates to the interface"), it applies uniformly
across all platforms (`MEMORY`, `CLOUDFLARE`, `YOUTUBE`).

**Consequence:** there must be exactly **one** writer of persisted state in the entire app.
Multiple independent contexts each calling `saveData()` would race against each other and
silently lose data.

## 2. The Pattern

Two categories of React Context, never mixed in the same provider:

| | Persisted Context | Runtime Context |
|---|---|---|
| Example | `PlayerDataContext` | `AudioRuntimeContext` |
| Lifecycle | Survives across sessions | Resets every load (no persistence) |
| Writer | The single, sole `saveData()` caller | Owns its own engine/SDK calls directly |
| Initialized from | `platformService.loadData()` | May read an initial value from the persisted context, but never the other way around |
| Growth | One new field + one domain-specific setter per feature | One new context per independent runtime domain |

**Rule:** a runtime context may read from a persisted context to bootstrap itself, but a
persisted context must never depend on, or know about, runtime-only state. Mixing the two
inside one context violates SRP — persistence I/O and in-memory lifecycle management are
different reasons to change.

## 3. Reference Implementation — Audio

- `PlayerDataContext` — persisted blob, currently empty (no audio preference exists; see
  `doc/technical/audio-engine.md` §5 for why).
- `AudioRuntimeContext` — runtime-only `isPlaying`, subscribes to `PlatformService.onPause`/
  `onResume`/`onSystemAudioChange`.
- `useAudio()` — combinator hook consumed by UI. Components never touch either context, or
  `platformService`/`audioEngine` singletons, directly.

## 4. Multi-Subscriber Lifecycle Events

`PlatformService.onPause`/`onResume` are designed as callback arrays — multiple independent
subscribers are supported natively, no extra event bus needed. Both `AudioRuntimeContext`
(stops/resumes playback) and `PlayerDataContext` (flushes persisted data on pause, per the
Playables requirement to save progress on `onPause`) subscribe independently, each handling
its own concern.

## 5. Future Domain — Game Sessions

When in-progress game state is introduced (daily attempts, round timers), the same pattern
applies:

```
PlayerDataContext   // persisted: e.g. dailyAttempts ledger (hashes, never open counters)

GameRuntimeContext  // runtime: remainingAttempts, currentWord, round timer
                    // bootstraps from PlayerDataContext, writes back only at the
                    // moments that constitute real persisted progress
```

`GameRuntimeContext` will subscribe to `onPause`/`onResume` exactly like `AudioRuntimeContext`
does today (e.g. to pause a Travel Mode round timer) — the pipeline already supports this;
no architectural change will be required when it's implemented.

## 6. Provider Composition

All providers are composed in `src/app/AppProviders.tsx`. None of them depends on another
at the *provider definition* level — nesting order is for readability only. Hooks that
combine multiple contexts (e.g. `useAudio`) do so at the *consuming component* level, where
every provider is already available regardless of nesting order.
