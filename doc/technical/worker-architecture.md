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
| Per-player state (attempts, score, streak) | 1 Durable Object per player, SQLite-backed (`ctx.storage.sql`, real tables `player`/`normal_mode_lang_state`) | Real relational tables — inspectable via Wrangler's Local Explorer, indexable, transactional. Cloudflare's recommended backend for all new DO classes. |
| Per-room state (Travel/Remote) | 1 Durable Object per room | Same reasoning, enables a future move to native WebSockets for real-time sync. |
| Leaderboard | D1, one table per `lang` (or a `lang` column with all queries scoped by it) | Durable Objects cannot be queried/sorted as a set; D1 holds a sortable, filterable projection updated by each player's Durable Object on every score change. Never the source of truth — that remains the Durable Object. |
| Immutable summary of finished rooms (Travel/Remote) | D1 | Once a room finishes, its Durable Object projects an immutable snapshot; the room's Durable Object can then be cleaned up. The finished-rooms lobby reads this projection, never Durable Objects directly — it needs to sort/paginate/filter, same as the leaderboard. |
| Leaderboard projection | D1 — `player_period_stats` (week+lifetime), `player_year_stats` (month/year history), `available_periods` (country×period availability + counts, see `AI_CONTEXT.md` decision 21) | Durable Objects aren't queryable as a set; D1 holds sortable/filterable projections. `available_periods` exists specifically so "which rankings exist" and "how many players/countries" never scan the player-grain tables. |
| Alias uniqueness | D1 — `aliases` (alias PK, player_id, auth/external provider id) | Real `UNIQUE` constraint + reverse index to re-derive a Durable Object ID from an alias — see `AI_CONTEXT.md` decision 24. |

## 3. Multi-Language Parametrization

Every endpoint takes an explicit `lang` value (the dictionary/plate language, e.g. `es`,
`en` — never the player's interface language). One Worker deployment serves every language
variant; adding a new language means adding new bundled data (dictionary segments, plate
sequence) and a new D1 partition/binding, not new Worker code.

## 4. Authentication

- OAuth Authorization Code flow, implemented directly in the Worker via a generic
  `AuthProvider` interface + `authProviderRegistry.ts` — see `AI_CONTEXT.md` decision 19.
- Routes are provider-agnostic: `GET /auth/:provider/start`, `GET /auth/:provider/callback`.
- **Full-page redirect only** — no popups, no iframes.
- Only `openid` scope requested.
- `id_token` verified via JWKS (`GOOGLE_JWKS_URL`, the `v3` certs endpoint — RS256 via
  Web Crypto), not the `v1` X.509 certificate endpoint.
- The OAuth `state` param is a stateless, HMAC-signed token (`stateToken.ts`) carrying
  a nonce, an issuedAt timestamp, and an optional `intent` (the `AppScreen` the player
  was trying to reach before being sent to login). On successful callback, the Worker
  redirects to `${FRONTEND_BASE_URL}/?intent=<intent>` (or `/` if none) — **never** a
  path relative to the Worker's own origin, since the Worker doesn't serve the SPA.
- Session cookie: `httpOnly`/`Secure`/`SameSite` is configurable per environment via
  `SESSION_COOKIE_SAME_SITE` (`Lax`/`None`/`Strict`) — must be `None` whenever the frontend
  and Worker sit on different sites, since `Lax` cookies are not attached to cross-site `fetch()`
  requests even with `credentials: "include"`, only to top-level navigations. HMAC-signed,
  payload `${authProviderId}:${externalProviderId}` — never the internal `playerId` — so the
  same Durable Object can be re-resolved via `idFromName()` on every request without a
  lookup table.
- `PlayerDO.createIfMissing()` assigns the internal `playerId` (UUID) and `country`
  (from `CF-IPCountry`) once, at first login.

## 5. Endpoints (Normal Mode)

| Endpoint | Auth required | Notes |
|---|---|---|
| `GET /auth/:provider/start` | No | Redirects to the provider's authorization URL. |
| `GET /auth/:provider/callback` | No | Exchanges code, creates/loads the player, sets the session cookie, redirects to the frontend. |
| `POST /auth/logout` | No | Clears the session cookie. |
| `GET /player/session?lang=<lang>` | Yes | Returns `PlayerProfile` for that lang. |
| `POST /normal/enter` | Yes | Body: `{ lang }`. Returns `NormalModeStatus`. |
| `POST /normal/attempt` | Yes | Body: `{ lang, word }`. Returns `AttemptResult`. |
| `POST /player/prefs` | Yes | Body: `{ lang, hasSeenRulesIntro: true }`. |
| `GET /alias/check?alias=` | Yes | Real-time availability hint only — never the source of truth. |
| `POST /alias/setup` | Yes | Body: `{ alias }`. The `INSERT` into `aliases` is what actually enforces uniqueness. |
| `GET /leaderboard/:lang/available` | Yes | Which periods (week/month/year) have any data, driven by `available_periods` existence — never by elapsed wall-clock time. |
| `GET /leaderboard/:lang?period=&country=&year=&month=` | Yes | Top-N + own entry if outside it + `totalPlayers`/`totalCountries` (from `available_periods`, not a scan of the ranking table). |

Every route above is defined once in `shared/apiRoutes.ts` via `defineRoute()` —
match, build, and parse (including named missing-parameter errors) live
together per route, never duplicated between client and Worker. `index.ts`
iterates `API_ROUTES` generically; there are no hand-written regexes per
endpoint outside that one file.

All authenticated routes are wrapped by `withSession()` (`routes/withSession.ts`), a
higher-order function — not a class hierarchy, since Worker route handlers are plain
functions, not stateful objects — that resolves and validates the session cookie once,
before the handler runs.

## 6. Dynamic Sharing — Open Graph Previews

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

## 7. Caching

No endpoint in this design is anonymous/cacheable at the zone level — every Normal Mode and
leaderboard call is tied to a specific authenticated player or a specific `lang`/`resultId`
lookup that varies per request. Caching is not part of this design; if a future endpoint
needs it (e.g. a fully public, non-personalized summary), it will be evaluated then.

## 8. Finished Rooms Projection (Travel/Remote)

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

## 9. Environments

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

## 10. CORS

Every fetch-based endpoint (all except the OAuth start/callback, which are full-page
navigations, unaffected by CORS) requires explicit CORS headers, since the frontend
(`localhost:5173` in dev, a separate Cloudflare Pages domain in staging/production) is
a different origin from the Worker. `Access-Control-Allow-Origin` reflects the request's
`Origin` header only if it matches the `ALLOWED_ORIGINS` allow-list (comma-separated,
per environment) — never `"*"`, since credentialed requests (`credentials: "include"`)
require an explicit origin. See `worker/src/cors.ts`.