# Time Service Architecture

## 1. Purpose

Two distinct temporal concerns exist in PLATES and must never share an abstraction:

| Concern | Source | Security-critical? |
|---|---|---|
| Cosmetic date (Theme, Badges) | `TimeService.getCosmeticDate()` — local, synchronous, zero network | No |
| Authoritative game epoch (daily reset, seed, anti-cheat) | Cloudflare Worker, resolved lazily at score-submission time | Yes — see `doc/technical/security-anticheat.md` |

`TimeService` covers only the cosmetic concern. It is never the anti-cheat mechanism — a
player manipulating their local clock only affects which Theme/Badge they see, never their
ability to submit a fraudulent score.

## 2. Strategies

| Strategy | Behavior |
|---|---|
| `RealClockTimeService` | Returns the real system date directly. |
| `FastForwardTimeService` | Dev-only. Applies an in-memory day offset on top of the real clock, controllable via a debug window hook (mirrors the `__SIMULATE_YT_PAUSE__` pattern in `MemoryPlatform`). |

Selected via `VITE_TIME_STRATEGY` (`REAL_CLOCK` default / `FAST_FORWARD`). Guarded at build
time in `vite.config.ts` — `demo`/`yt-zip` builds fail if `FAST_FORWARD` is detected.

## 3. Singleton

Like `PlatformService`, `TimeService` is instantiated once and shared application-wide,
imported directly wherever needed — never re-instantiated per-component. The singleton
file is intentionally named to avoid a case-only collision with the interface file on
case-insensitive filesystems (Windows).