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

## 3. Reference Implementation — Game Engine

- `GameRuntimeContext` — pure-runtime, **scoped to the game screen lifetime**
  (not app-wide). Mounted and unmounted together with `GameEngine`. Bootstraps
  from `GameConfig.initial*` values (hydrated by `NormalGameScreen` from the
  `enterNormalMode()` response); every real attempt round-trips through the Worker
  and the context is updated from the Worker's response via `SUBMIT_SUCCESS`.
- `GameRuntimeProvider` must **always remain mounted** regardless of whether the
  viewport gate (`useViewportSupport`) is showing a notice screen. If the provider
  were unmounted when the device is rotated out of the supported viewport, the
  in-progress game state (attempts used, history, typed word) would be lost and
  the player could bypass the daily attempt limit by rotating and returning.
  `GameEngine` therefore always renders `<GameRuntimeProvider>` and only switches
  its *child* between `<GameEngineLayout>` and `<ViewportNoticeScreen>`.
- `useGameRuntime()` — consuming hook. Components inside the engine never touch
  `platformService` or `PlayerSessionContext` directly; all side effects go through
  context actions (`submit()`, `openOverlay()`, etc.).

## 4. Provider Nesting & Scoping Summary

| Context | Scope | Resets when |
|---|---|---|
| `ThemeProvider` | App lifetime | Never within a session |
| `PlayerSessionContext` | App lifetime | Session cookie expires / explicit logout |
| `AudioRuntimeContext` | App lifetime | Every page load (browser autoplay policy) |
| `NavigationContext` | App lifetime | Every page load (pure state machine) |
| `GameRuntimeContext` | Game screen lifetime | `navigate()` away from `NORMAL_GAME` |

## 5. Reference Implementation — Player

- `PlayerSessionContext` — session-hydrated. On `initialize()`, asks
  `PlatformService.getSession()`; if a valid session exists, the player's profile (alias,
  country, normal-mode score/streak) is already available without any user interaction. If
  not, the UI prompts for login.
- Game-specific runtime state while actually playing (remaining attempts this load, current
  word being typed) is owned by `GameRuntimeContext` (see §5) — it bootstraps from
  `PlayerSessionContext`'s last known snapshot but is itself never the source of truth; every
  real attempt round-trips through the Worker.

## 6. Future Domain — Game Sessions

```
PlayerSessionContext  // session-hydrated: alias, country, normalModeScore, streak
GameRuntimeContext    // pure-runtime: current word being typed, remaining attempts as of
                      // the last Worker response, round timer (Travel/Remote)
```

`GameRuntimeContext` does not subscribe to `onPause`/`onResume` for Normal Mode (no timer to
pause — see `doc/functional/game-modes.md`). If Travel Mode's per-round countdown needs to
react to tab visibility, that subscription lives inside `GameEngine` itself, not in this
context — to be confirmed in the relevant implementation session.

## 7. Provider Composition

All providers are composed in `src/app/AppProviders.tsx`. None of them depends on another at
the *provider definition* level — nesting order is for readability only. Hooks that combine
multiple contexts (e.g. `useAudio`) do so at the *consuming component* level, where every
provider is already available regardless of nesting order.