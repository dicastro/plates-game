# State Architecture — Session-Hydrated vs. Pure-Runtime Contexts

## 1. The Core Distinction

There is no client-side persistence of any kind (no `localStorage`, `sessionStorage`, or
signed envelope) — see `AI_CONTEXT.md`, decision 7. Every React Context in this app falls
into one of two categories, and the naming convention reflects *why* each one resets, since
the two reasons are unrelated to each other:

| | Session-hydrated Context | Pure-runtime Context |
|---|---|---|
| Example | `PlayerSessionContext` | `AudioRuntimeContext` |
| Resets when | The Worker session cookie is invalid/expired, or on first load before hydration completes | Every single page load, unconditionally |
| Why it resets | No backend session to read from (authentication boundary) | Permanent browser constraint (autoplay policy requires a fresh user gesture every load) — true even with a perfectly valid session |
| Source of truth | The player's Durable Object, read via the Worker on `initialize()` | Nothing external — it's pure in-memory UI state with no canonical source elsewhere |
| Writer | `PlatformService.enterNormalMode()` / `submitAttempt()` responses update it; never writes anything back as "this is my state", only sends actions | Owns its own engine calls directly |

**Rule:** a Session-hydrated context may be re-fetched at any point (re-login, explicit
refresh) without any client-held data to reconcile — the Worker is unconditionally
authoritative. A pure-runtime context never has anything to fetch in the first place; it is
simply reset to its default and rebuilt from user interaction.

## 2. Reference Implementation — Audio

- `AudioRuntimeContext` — pure-runtime `isPlaying`, subscribes to
  `PlatformService.onPause`/`onResume` (tab visibility) and to the HUD mute toggle.
- `useAudio()` — combinator hook consumed by UI. Components never touch the context or the
  `audioEngine`/`platformService` singletons directly.

## 3. Reference Implementation — Player

- `PlayerSessionContext` — session-hydrated. On `initialize()`, asks
  `PlatformService.getSession()`; if a valid session exists, the player's profile (alias,
  country, normal-mode score/streak) is already available without any user interaction. If
  not, the UI prompts for login.
- Game-specific runtime state while actually playing (remaining attempts this load, current
  word being typed) is owned by `GameRuntimeContext` (see §5) — it bootstraps from
  `PlayerSessionContext`'s last known snapshot but is itself never the source of truth; every
  real attempt round-trips through the Worker.

## 4. Future Domain — Game Sessions

```
PlayerSessionContext  // session-hydrated: alias, country, normalModeScore, streak
GameRuntimeContext    // pure-runtime: current word being typed, remaining attempts as of
                      // the last Worker response, round timer (Travel/Remote)
```

`GameRuntimeContext` does not subscribe to `onPause`/`onResume` for Normal Mode (no timer to
pause — see `doc/functional/game-modes.md`). If Travel Mode's per-round countdown needs to
react to tab visibility, that subscription lives inside `GameEngine` itself, not in this
context — to be confirmed in the relevant implementation session.

## 5. Provider Composition

All providers are composed in `src/app/AppProviders.tsx`. None of them depends on another at
the *provider definition* level — nesting order is for readability only. Hooks that combine
multiple contexts (e.g. `useAudio`) do so at the *consuming component* level, where every
provider is already available regardless of nesting order.