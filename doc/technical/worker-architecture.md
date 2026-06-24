# Worker Architecture

## 1. Code Location & Deployment

Worker code lives in its own top-level directory (`/worker`), outside `src/`, with its own
`wrangler.toml` and dependencies. It is deployed independently from the frontend build — Vite
only bundles `src/`, so Worker code never ends up in the frontend's build output. Secrets
(OAuth client secret) are set via Cloudflare's secret store, never committed to the repo.

## 2. Storage Model

| Data | Storage | Rationale |
|---|---|---|
| Dictionary, daily plate sequence | Bundled static data inside the Worker's own deployed code | Pure in-memory lookup, zero runtime storage cost, updated by redeploying when content changes (see `doc/technical/security-anticheat.md` §3). |
| Per-player state (attempts, score, streak) | 1 Durable Object per player | Strong consistency per entity — see `doc/technical/security-anticheat.md` §4. |
| Per-room state (Travel/Remote) | 1 Durable Object per room | Same reasoning, enables a future move to native WebSockets for real-time sync. |
| Leaderboard | D1, one table per `lang` (or a `lang` column with all queries scoped by it) | Durable Objects cannot be queried/sorted as a set; D1 holds a sortable, filterable projection updated by each player's Durable Object on every score change. Never the source of truth — that remains the Durable Object. |
| Immutable summary of finished rooms (Travel/Remote) | D1 | Once a room finishes, its Durable Object projects an immutable snapshot; the room's Durable Object can then be cleaned up. The finished-rooms lobby reads this projection, never Durable Objects directly — it needs to sort/paginate/filter, same as the leaderboard. |

## 3. Multi-Language Parametrization

Every endpoint takes an explicit `lang` value (the dictionary/plate language, e.g. `es`,
`en` — never the player's interface language). One Worker deployment serves every language
variant; adding a new language means adding new bundled data (dictionary segments, plate
sequence) and a new D1 partition/binding, not new Worker code.

## 4. Authentication

- OAuth Authorization Code flow, implemented directly in the Worker — no third-party auth
  provider (Firebase or similar).
- **Full-page redirect only** — no popups, no iframes — for compatibility with constrained
  embedded browsers (car infotainment, smart TVs) that commonly block both.
- Only the `openid` scope is requested. No email, name, or photo.
- On successful callback, the Worker creates/looks up the player's Durable Object (keyed by
  `authProvider + externalProviderId`) and issues a session: an `httpOnly`/`Secure`/`SameSite`
  cookie. The client never reads, stores, or transmits this token directly.
- `AuthProvider` is a Worker-side strategy interface; `GoogleAuthProvider` is the only
  implementation for now. Adding a provider later means adding a new implementation, not
  touching the OAuth orchestration code or any game logic.
- First-login onboarding (alias selection with uniqueness check, interface language,
  Terms acceptance) happens once, immediately after the first successful callback.

## 5. Endpoints (Normal Mode)

| Endpoint | Auth required | Reads | Writes | Returns |
|---|---|---|---|---|
| `POST /normal/enter` | Yes | Player's Durable Object (read-only) | None | Today's puzzle (consonants, digits, bonus) + the player's current `attemptsUsedToday`/`bestScoreToday`/`normalModeScore`/`currentStreakDays` |
| `POST /normal/attempt` | Yes | Player's Durable Object | Player's Durable Object; D1 leaderboard row if `normalModeScore` changes | Per-attempt result (valid/invalid, score, updated counters) |

No separate "player status" endpoint is needed beyond `enter` — entering Normal Mode always
resolves the authoritative state in the same call that resolves today's puzzle.

## 6. Leaderboard Read Endpoints

| Endpoint | Scope |
|---|---|
| `GET /leaderboard/:lang` | Global ranking for that dictionary/plate language. |
| `GET /leaderboard/:lang?country=XX` | Same language, filtered to one country (derived from `CF-IPCountry` at write time, stored on the D1 row — never a separate ranking dimension on its own). |

## 7. Dynamic Sharing — Open Graph Previews

When a player shares a result, an **immutable snapshot** is written to a dedicated D1 table
(`shared_results: resultId, lang, alias, plateDisplay, score, createdAt, expiresAt`) — never
the player's live, mutable state. This guarantees that a shared link always reflects what
happened at the moment it was generated, regardless of what the player does afterward (plays
again the next day, etc.), and that a link re-shared by a friend-of-a-friend days later still
renders correctly.

A dedicated route (`GET /r/:resultId`) serves a minimal HTML response with `<meta>` tags
built from that snapshot and a generated preview image, then redirects a real browser into
the SPA. If `resultId` does not exist or `expiresAt` has passed, the route falls back to the
game's static, generic Open Graph metadata rather than showing an error.

`expiresAt` and the exact cleanup strategy (scheduled deletion vs. filtering expired rows at
read time) are implementation details to be finalized in the relevant implementation session.

## 8. Caching

No endpoint in this design is anonymous/cacheable at the zone level — every Normal Mode and
leaderboard call is tied to a specific authenticated player or a specific `lang`/`resultId`
lookup that varies per request. Caching is not part of this design; if a future endpoint
needs it (e.g. a fully public, non-personalized summary), it will be evaluated then.

## 9. Finished Rooms Projection (Travel/Remote)

When a Travel/Remote room finishes, its Durable Object projects an immutable summary to D1:

```
finished_rooms: roomId, mode, roomName, country, startedAt, finishedAt, expiresAt, finalRanking (JSON array of {alias, score})
```

- `roomName`: a player-facing name chosen at room creation (separate from `roomId`, which
  stays an internal/join-code identifier).
- `country`: derived from `request.cf.country` at room-creation time — most relevant for
  Travel Mode, kept for Remote Mode too for consistency, no extra consent flow needed (same
  reasoning as the leaderboard's `country` column).
- `startedAt`: when the room transitioned from waiting/lobby into active play.
- `expiresAt`: TTL still to be confirmed — **90 days** is a reasonable starting candidate, to
  be validated against actual usage once the lobby UI exists.
- The lobby's "finished rooms" list reads exclusively from this table, never from a
  Durable Object directly — consistent with the leaderboard's read model (§6).

## 10. Environments

Cloudflare Workers supports multiple named environments per project (`wrangler.toml`'s
`[env.*]` blocks), each with its own bindings (Durable Object namespace, D1 database,
secrets) while sharing the same deployed code:

- **`production`** — the real game, real players.
- **`staging`** — same code, isolated bindings (its own D1, its own Durable Object
  namespace). Deployed via `wrangler deploy --env staging`, independently of `production` —
  any local branch can be deployed here without affecting real player data.

The frontend points at whichever backend it needs via `VITE_WORKER_BASE_URL`, set per Vite
mode (`development`, `cf-staging`, `production` — see `doc/technical/build-pipeline.md`).
`npm run dev:cf:stg` runs the frontend locally against the real `staging` Worker — useful for
exercising Durable Objects/D1/OAuth, which `MemoryPlatform` cannot simulate, without ever
touching `production` data.