# AI_CONTEXT.md — Project Context & Architectural Decisions

This file gives any AI assistant the background needed to understand **what this project is**
and **why** key decisions were made. Operating rules and guardrails are in `AGENT.md`.

---

## Project Background

**PLATES** is a lightweight HTML5 word puzzle game, served as a standalone web application
hosted on Cloudflare. Players are given 3 consonants extracted from a license plate and must
find the **shortest valid word** that contains all three, in order. Shorter words score
higher (inverse scoring formula). Scores accumulate across days into a persistent leaderboard
per player — see `doc/functional/scoring.md`.

The developer is a Senior Java Backend Engineer — frontend layout, SVG graphics, and
client-side mathematics are heavily AI-assisted.

### Target Platform

Cloudflare is the **production platform**, not a staging/demo target. The game is a normal
authenticated web application: Cloudflare Pages (static hosting) + Cloudflare Workers (edge
compute, OAuth, game logic authority) + Durable Objects (per-player and per-room state) +
D1 (queryable leaderboard projection).

### Multi-Language Distribution

A single Vite build configuration (parametrized by `VITE_DICT_TARGET` at build time)
is deployed independently once per supported dictionary language (starting with
Spanish, `es`; English, `en`, planned for a later phase). Each deployment has its own
domain, its own interface language (implied by `VITE_DICT_TARGET`), and its own
independent leaderboard — rankings are never mixed across languages, and the
leaderboard is scoped by the dictionary/plate language, never by the player's
interface language.

The Worker is a single deployment that serves every language variant. Every endpoint
takes an explicit `lang` parameter — never inferred from the caller's domain — so the
same Worker code serves all game deployments. Adding a new language means: one new
game deployment (new `VITE_DICT_TARGET` value, new domain), one new bundled
dictionary/plate-sequence segment in the Worker, and one new D1/Durable Object
binding set — not new Worker code.

---

## Key Architectural Decisions & Rationale

### 1. Dictionary and Daily Plate Sequence — Server-Only, Bundled, Never Shipped to Client

**Problem:** the validation dictionary is the core value of the game. Shipping it to the
client in any form (plaintext or hashed) lets a determined player extract it via static
analysis or targeted rainbow-table attacks against a fixed, discoverable salt.

**Solution:** the dictionary never leaves the Worker. It is generated **offline** (see
authoring notes below) and shipped as static data bundled directly into the Worker's deployed
code — re-deployed whenever the dictionary or the daily sequence is updated. Validating a
word and resolving "today's plate" are both pure in-memory lookups inside the Worker process,
with no client-side fallback and no KV/storage read involved for this part.

**Authoring approach:** the dictionary and the daily sequence are generated together, offline,
from a master word list:
1. For each valid word, compute every ordered 3-consonant subsequence it contains (consonant
   filtering is locale-specific — e.g. `Ñ` is excluded from Spanish plates).
2. Group words by the resulting consonant triplet; the number of matching words per triplet is
   a natural difficulty signal (rare triplets = harder puzzles).
3. Build a year-long calendar assigning one triplet + 4 digits to each day, optionally pairing
   harder triplets with higher-bonus digits.
4. Ship two artifacts to the Worker's own repo: the day→puzzle calendar, and, **per
   combination actually used**, the small word list valid for that specific triplet (not one
   monolithic dictionary) — this keeps each unit of bundled data small regardless of how large
   the master dictionary eventually grows.

This also means the client performs a **structural pre-check only** (does the submitted word
contain the 3 required consonants, in order, with the right repetition count?) before ever
calling the Worker — a word that fails this check is rejected locally, consumes no attempt,
and never reaches the Worker. Only structurally-valid words are sent for real dictionary
validation.

### 2. Strategy Pattern for Platform Abstraction

**Problem:** the game must run in 2 environments: local development (no real backend) and
production (Cloudflare).

**Solution:** a `PlatformService` interface abstracts all backend interactions (auth status,
puzzle retrieval, attempt submission, player profile). `PlatformFactory` selects the correct
implementation via `VITE_PLATFORM_TARGET`: `MemoryPlatform` (local dev, hardcoded
plates/dictionary/mock auth) or `CloudflarePlatform` (talks to the real Worker over HTTPS).
There is no third platform target — this strategy previously also covered YouTube Playables;
see "Discarded Direction" below for why that was removed.

### 3. Procedural Audio via Web Audio API

Unchanged from the original rationale: MP3/WAV files would bloat the bundle, so all music is
synthesized in real time via a deterministic LCG PRNG. Same seed = identical track on any
device. The only change from earlier iterations: **a mute/volume control is now allowed in
the persistent HUD** (see decision 9 below) — this was previously prohibited under YouTube
Playables design requirements, which no longer apply.

### 4. Cloudflare as the Real Backend (not a review/demo target)

**Problem:** the game needs authoritative game logic, real anti-cheat, real-time multiplayer
coordination, and a real leaderboard — none of which is achievable inside a sandboxed,
client-only distribution model (see "Discarded Direction").

**Solution:** Cloudflare Workers are the sole authority for puzzle generation, word
validation, scoring, attempt counting, and multiplayer room state. The client never computes
or asserts any of these — it only sends *actions* (attempt a word, create a room) and renders
whatever the Worker returns. See `doc/technical/security-anticheat.md` and
`doc/technical/worker-architecture.md`.

### 5. Durable Objects (per-entity state) + D1 (queryable projection)

**Problem:** Workers KV offers only eventual consistency — unsuitable for per-player attempt
counters (race conditions between concurrent requests) or for real-time multiplayer room
state. KV also has no query/sort capability, which a leaderboard needs.

**Solution:**
- **1 Durable Object per player** — strong consistency for that player's daily attempts,
  running score, and streak. The DO serializes all operations on that player, eliminating
  race conditions without manual locking.
- **1 Durable Object per Travel/Remote room** — same reasoning for multiplayer room state;
  enables a future move from HTTP polling to native WebSockets for true real-time sync.
- **D1** — holds a queryable, sortable projection of the leaderboard
  (`playerId`, `alias`, `country`, `normalModeScore`), partitioned by `lang` (the dictionary/plate language, never the UI language). The default view is global within that language (all
  players competing on that language's daily plates); an optional secondary view filters
  that same global ranking by `country` (e.g. "Spanish-plate players from Argentina"). There
  is no cross-language ranking of any kind, and no ranking scoped only by interface language.
  The DO remains the source of truth; D1 is a read-optimized projection, acceptable to lag by
  milliseconds/seconds.
- **KV is not used** in the current design — every former KV use case (dictionary, daily
  sequence, player state, room state, leaderboard) is better served by bundled static data,
  Durable Objects, or D1 respectively.

### 6. Authentication via OAuth (Google first), No Third-Party Auth Provider

**Problem:** without real player identity, any client-asserted attempt counter or score is
spoofable (a malicious client can simply claim to be a "new player" indefinitely).

**Solution:** the Worker implements the OAuth Authorization Code flow itself (no Firebase or
similar third party), starting with Google as the only provider, behind an `AuthProvider`
strategy interface so additional providers can be added later without touching game logic.
**Full-page redirect flow only** (no popups/iframes) — this is deliberately chosen for broad
compatibility with constrained embedded browsers (car infotainment systems, smart TVs), which
commonly block popups or third-party-cookie iframes but support ordinary page navigation.
Only the `openid` scope is requested — no email, no real name — to minimize personal data
collected (see decision 10).

Session state is a Worker-issued `httpOnly`/`Secure` cookie. The client never reads or stores
any identity/session token directly.

### 7. Zero Client-Side Persistence

**Problem:** the previous design (before settling on real authentication) relied on a
two-layer signing scheme (symmetric envelope + Worker-issued asymmetric signature) specifically
to compensate for the lack of real identity, so a client couldn't fabricate or roll back its
own state. With real OAuth-backed identity, this entire problem disappears — the Worker never
trusts client-submitted state in the first place, it always reads its own Durable Object.

**Solution:** the client persists **nothing** sensitive — no `localStorage`, no
`sessionStorage`, no signed envelope. All player state lives in memory for the duration of the
session and is re-fetched from the Worker on load (cookie-authenticated, no user interaction
required if the session cookie is still valid). On reload, the app returns to `SPLASH`,
checks session validity, and re-hydrates from the Worker. This removes the previous
"Opaque Persistence Layer" / `PayloadCrypto` seal-unseal mechanism entirely — there is nothing
left for it to protect.

### 8. Minimal Personal Data — Alias + OAuth Subject ID Only

**Problem:** minimize legal/privacy surface (see `doc/legal/` once drafted) while still
supporting a public leaderboard with display names and rough geography.

**Solution:** the player record stores only `authProvider`, `externalProviderId` (the OAuth
`sub`, opaque), a self-chosen unique `alias`, and `country` — the latter derived from
Cloudflare's `CF-IPCountry` request header (edge geolocation by IP, no extra consent flow,
approximate but sufficient for a leaderboard), never asked of or stored against the player's
real identity. No name, email, or photo is requested or stored — supported by requesting only
the `openid` OAuth scope (decision 6).

### 9. HUD Audio Control — Now Allowed, Included

**Reversal of a previous decision:** an earlier design explicitly removed any in-game
mute/volume control because YouTube Playables design requirements prohibited it. That
constraint no longer applies (see "Discarded Direction"). The persistent HUD now includes a
mute/volume control as a deliberate product choice, not a platform requirement.

### 10. Ad Engine via Strategy Pattern

**Problem:** monetization via ads is a goal, but the specific provider may change over time.

**Solution:** an `AdProvider` interface (`initialize()`, `showInterstitial()`,
`showRewarded()`) decouples the game from any specific ad SDK. Starting provider and exact
ad-unit product to be confirmed in the implementation session — likely a Google product
suited to in-game interstitial/rewarded video, to be verified rather than assumed.

### 11. UTC-Only Temporal Logic (unchanged)

The Worker is the sole authority for "what day is it" for game-logic purposes — `new Date()`
remains forbidden in client game logic. Only `TimeService.getCosmeticDate()` (local, for
theme/badge resolution) uses the real device clock, and is explicitly non-authoritative.

### 12. Custom Virtual Keyboard (unchanged)

Native `<input>` elements remain forbidden; a custom keyboard avoids native mobile keyboard
resize issues and gives full control over per-language layouts.

### 13. Dynamic Open Graph Metadata for Sharing

**Problem:** without official platform distribution, organic sharing (challenge-a-friend,
social posting) is the primary growth channel — a static, generic OG card gives no incentive
to share a specific result.

**Solution:** a dedicated Worker route (e.g. `/r/<resultId>`) serves a minimal HTML response
with result-specific `<meta>` tags (score, plate, challenge text) and a dynamically generated
preview image, before redirecting a real browser into the SPA. Static, generic OG metadata
remains the fallback for the bare game URL. Full design deferred to the relevant
implementation session.

### 14. Known Risk — Selective ISP-Level IP Blocking (Spain, La Liga)

**Problem:** in Spain, La Liga (the professional football league operator) has obtained the
ability to have ISPs block specific IP ranges suspected of streaming-piracy use, without
judicial intervention per request, during live matches. Cloudflare IP ranges have reportedly
been swept up in these blocks more than once, affecting unrelated traffic sharing the same
range. If this happens, a Spanish player's device-to-Cloudflare requests fail at the ISP
level — they never reach the Worker, so there is no `CF-IPCountry` header or any other
server-side signal to detect this. The Worker has no way to distinguish "this player is
offline" from "this player is selectively blocked."

**Status:** known risk, not mitigated. Currently surfaced to the player only as a generic
network-failure overlay on `submitAttempt()` failure (see
`doc/functional/mockups/normal-mode-mockups.html` §4 and
`doc/technical/state-architecture.md` for where `GameRuntimeContext` owns this state).

**Mitigation proposed (not implemented):** a client-side connectivity probe — a `HEAD`
request against a large, unrelated CDN/domain (e.g. a widely-used Google or Cloudflare
resource outside this game) — fired only when `submitAttempt()` fails. If the probe succeeds
while the Worker call fails, that's a reasonable signal of selective domain blocking rather
than a general outage, and the error overlay could show a more specific message (e.g.
referencing sports-event-related IP blocks, common in Spain) without ever needing to know the
player's country — which is precisely the data that is unavailable in this failure mode.

**Open questions before implementing:** false-positive risk if the probe's own target is
unreachable for unrelated reasons; an extra network request fired on every failure path;
exact wording of the more specific message. Tracked in `doc/NEXT_STEPS.md`.

### 15. Landscape Mode Removed — Viewport Gate Instead

**Decision:** explicit landscape layout variants were abandoned after multiple
implementation iterations proved them more complex than valuable. The game is
played in portrait orientation; landscape on a phone-sized device is an edge case
with limited screen height that degrades the experience.

**Current behavior:** `useViewportSupport` checks `window.innerHeight` at mount
and on resize/`orientationchange`. If the current viewport height is below
`MIN_PLAYABLE_HEIGHT_PX` (480px):
- If the *other* orientation would satisfy the threshold (current width ≥ 480px),
  a "rotate your device" notice is shown.
- If neither orientation satisfies it, an "unsupported resolution" notice is shown.
The notice is rendered *inside* `GameRuntimeProvider` (not outside) so that any
in-progress game state survives while the notice is displayed.

**What this replaces:** CSS `landscape:` variants, `landscape-compact` custom
Tailwind breakpoint, and the side-keyboard layout. None of these exist in the
codebase.

### 16. `shared/` as Explicit Architectural Zone

Code that must be consumed by both the client bundle and the Cloudflare Worker
lives in `shared/` at the project root. `tsconfig.app.json` includes it; the
Worker will have its own `tsconfig` that also includes it. Current modules:

| File | Purpose |
|---|---|
| `shared/scoring.ts` | Score formula, `PlateBonusType` |
| `shared/wordValidation.ts` | Structural pre-check (`isStructurallyValid`) |
| `shared/gameConfig.ts` | Tunable game constants (`NORMAL_MODE_DAILY_ATTEMPTS_LIMIT`, `MIN_PLAYABLE_HEIGHT_PX`) |
| `shared/apiRoutes.ts` | Route definitions (path+query match/build/parse) — single source of truth for every Worker endpoint, shared by client and Worker |
| `shared/isoWeek.ts` | ISO-8601 week-key helpers shared by Worker (`dateKeys.ts` re-exports `weekKeyUtc`) and client (week-range display) |

Rule: a module belongs in `shared/` if and only if the Worker needs it. Pure
client UI logic stays in `src/`.

### 17. `ScrollableWord` — Deliberate DOM Measurement Exception

`ScrollableWord` (`src/components/ScrollableWord.tsx`) reads `scrollWidth`,
`clientWidth`, and `scrollLeft` in a `useLayoutEffect` and on `onScroll` events.
This is a deliberate, narrowly scoped exception to the "no DOM measurement"
architectural rule (which prohibits JS measuring rendered elements to *size* them).

`ScrollableWord` does not size anything — it only answers a binary question
("does this content overflow its container?") that CSS alone cannot answer
conditionally to drive interactive behavior (directional scroll arrows). The
component never changes any element's width, height, or font size based on
measurement; it only shows/hides navigation buttons and animates `scrollLeft`.

### 18. Virtual Keyboard — No Throttle, Debounce Instead

Interactive buttons throughout the app use the timestamp-based throttle in
`Button.tsx` (400ms). The virtual keyboard keys use a shared `lastPressRef`
debounce (150ms) instead — a throttle per-key would allow rapid alternation
between two keys at full speed, which is the correct behavior for typing. A
single shared debounce prevents double-fires from mouse/touch event overlap
without blocking natural fast typing across different keys.

### 19. Auth Provider Registry — Generic Multi-Provider Design

`AuthProvider` is a Worker-side interface (`buildAuthorizationUrl`, `handleCallback`)
resolved through `authProviderRegistry.ts`, keyed by `AuthProviderId` (a type shared
with the client via `shared/types.ts`, so both sides always agree on which provider
IDs are valid). Routes are generic (`/auth/:provider/start`, `/auth/:provider/callback`)
— adding a new provider means one new `AuthProvider` implementation plus one registry
entry, no route changes. `GoogleAuthProvider` verifies the `id_token` by fetching
Google's JWK Set (`/oauth2/v3/certs`) and validating the RS256 signature via Web
Crypto — not the `/oauth2/v1/certs` X.509 certificate endpoint, which requires
extracting a public key from a certificate first and has no native Web Crypto import
path. Client-side, `LoginScreen` iterates `SUPPORTED_AUTH_PROVIDERS` to render one
button per provider.

### 20. PlayerDO Storage — SQLite Tables, Not the KV API

`PlayerDO` uses `ctx.storage.sql` (real SQL tables: `player`, `normal_mode_lang_state`),
not the legacy KV-style `ctx.storage.get/put`. This is Cloudflare's own recommended
storage backend for all new Durable Object classes regardless of billing plan — not a
free-plan-only requirement — and it does not change storage billing (SQLite storage is
billed the same way whether accessed via the KV API or the SQL API; the KV API simply
persists into a hidden `__cf_kv` table that is excluded from SQL queries by Cloudflare's
own design, making the data invisible to any SQL inspector regardless of tooling used).
Tables are created via `ctx.blockConcurrencyWhile()` in the constructor, before any
request is processed. This also makes the DO's data visible in Wrangler's Local
Explorer (`/cdn-cgi/explorer`) during local development — see
`doc/technical/local-development.md`.

### 21. Ranking Model — Closed-Period Projection, Country-Scoped Availability Index

`player_period_stats` (D1) holds one row per `(player, lang)` with only the
**previous week** total (`week_previous_key`/`score`) plus a lifetime running
total (`lifetime_score_up_to_last_week`) — no day-level or month/year-level
"previous" columns; those don't need a rolling previous/current pair because
they're historized in full.

`player_year_stats` (D1) holds one row per `(player, lang, year)` with a
NULLable column per month plus `year_score` — NULL means "not yet closed for
this player", 0 means "closed, scored nothing". Written only on the exact
rollover that closes that month/year, regardless of how long the player was
away — no discard-on-gap behavior here (unlike week, which does discard on
gaps >1, an accepted tradeoff for a rolling single-slot value).

Neither table is ever scanned in full to answer "what rankings exist" or
"how many players/countries are in this one" — both tables scale with
player count, which is unbounded. `available_periods` (D1) is a
country×period grain projection (`lang, period_type, period_key, country` →
`player_count`), written once per period-close event (same `env.DB.batch()`
call as the score write), that answers both questions in time bounded by
country count (≤250), never player count. `period_type` covers
`week`/`month`/`year`/`total` uniformly; `total`'s "first time this player
ever closes a week for this lang" flag lives on the Durable Object itself
(`has_counted_in_lifetime_total`), read for free from the already-loaded
row — no extra D1 read needed to decide whether a player counts toward the
lifetime total more than once.

The Normal Mode leaderboard has four views: **last week**, **month**
(navigable across any closed month), **year** (navigable across any closed
year), and **total** (lifetime up to last week's close). There is no "daily"
ranking view — removed from the original design; a single day's score is too
volatile and too easily gamed by refresh-timing to be a meaningful ranking
window.

### 22. Login Gating Model — Home Reachable Without a Session

`HOME` never requires authentication — `SplashScreen` always navigates there (no
forced session check on cold start). `PlayerSessionContext.initialize()` is idempotent
(dedup via `isLoaded` + an in-flight promise ref) and is triggered lazily: once by
`HomeScreen` on mount (to silently enrich the screen if a session already exists), and
again by any action that actually requires a session (e.g. pressing "Play"). Login is
gated per-action via `navigateToLogin(intent)`, which stores the screen the player was
trying to reach; that intent travels inside the OAuth `state` token (already used for
CSRF) round-trip and comes back as a `?intent=` query param on the Worker's redirect to
`FRONTEND_BASE_URL`, letting `SplashScreen` land the player directly back on what they
were doing instead of a bare `HOME` after the full-page OAuth redirect/reload.

### 23. Alias System — Editable Handle, D1-Enforced Uniqueness

The player's `alias` is set once, mandatorily, right after first login
(`hasCompletedAliasSetup` flag on `player`, global — not per-`lang`) via a
dedicated `ALIAS_SETUP` screen gated both from `SplashScreen` (post-login
intent flow) and `HomeScreen` (lazy check on mount, covering the "no forced
session on cold start" case per decision 22). It is **not permanently
frozen** — a future Settings screen will allow changing it; nothing about
the schema or the gating treats it as an immutable identifier (the Worker
never uses `alias` for DO resolution, only `authProviderId:externalProviderId`).

Uniqueness cannot be enforced by querying Durable Objects as a set (they
aren't queryable that way), so a dedicated D1 table
(`aliases: alias PK, player_id, auth_provider_id, external_provider_id`)
serves two purposes at once: a real `UNIQUE` constraint (the actual source
of truth — client-side real-time availability checks are UX convenience
only, always re-validated by the `INSERT` itself) and a reverse index
(alias → the two fields needed to re-derive that player's Durable Object ID
via `idFromName()`, without storing a redundant `do_id`).

---

## Discarded Direction — YouTube Playables

An earlier phase of this project targeted YouTube Playables as the primary distribution
platform, with Cloudflare as a secondary/demo target. This was **fully discarded** after
reviewing Playables' official certification requirements in detail. Documented here so the
reasoning is not lost, and so it is not re-explored without re-confirming these constraints
still hold.

### Why it was discarded

1. **No real anti-cheat possible.** Playables' Privacy & Data requirements state: *"Game MUST
   NOT make external calls to any URLs or services, except... APIs owned by Google or
   YouTube."* This forbids calling any self-hosted backend (Cloudflare or otherwise) from a
   Playables build, which rules out server-side validation, scoring, or attempt-counting
   authority entirely. Any anti-cheat would have had to be purely client-side.
2. **No real multiplayer possible.** The same restriction makes the Travel Mode / Remote Mode
   room-synchronization mechanic (HTTP polling/WebSockets against a third-party backend)
   categorically impossible inside a Playables build, independent of the anti-cheat question.
3. **No durable player identity available.** The public Playables SDK surface
   (`system`/`game`/`engagement`/`ads`/`health`) exposes no player/user identifier. Without
   one, any self-assigned client identifier is trivially resettable, making per-player
   attempt limits unenforceable against a motivated cheater.
4. **Obfuscation is prohibited**, beyond plain minification — further weakening any
   client-side-only protection scheme that relied on hiding logic or constants.
5. **Consequence accepted as decisive:** a leaderboard that is this easily falsified would
   undermine the core engagement loop the game is designed around (accumulating score across
   daily plays) — the risk was judged to outweigh the reach benefit of YouTube distribution.

The Single Page Application requirement was checked too and was **already satisfied** by the
existing React state-machine navigation — it was never a blocker, included here only for
completeness.

### What was removed as a result

`YouTubePlatform`, the `yt-local`/`yt-zip` build modes and their `.env` files, SDK injection
in `vite.config.ts`, the ZIP packaging pipeline, the Test Suite validation workflow, the
"no mute button" / Page Visibility API prohibitions, and all related documentation
(`doc/technical/playables-reference.md`).

---

## Platform Constraints Discovered (Cloudflare era)

- OAuth must use a full-page redirect flow, not popups, for compatibility with constrained
  embedded browsers (car infotainment, smart TVs) that commonly block popups/third-party
  cookies in iframes.
- `CF-IPCountry`, automatically added by Cloudflare at the edge, is sufficient for
  approximate leaderboard geography without asking the player or handling extra consent.
- Durable Objects provide strong consistency per entity at the cost of being unqueryable as a
  set — hence the D1 projection for anything that needs sorting/filtering across players.
- Cloudflare KV write operations are an order of magnitude more expensive than reads
  ($5/million vs $0.50/million as of this writing) — informed the decision to avoid KV
  altogether in favor of bundled static data + Durable Objects + D1.

---

## What's New System (Player Updates)

Unchanged in principle from the original design — see `doc/functional/player-updates.md`.
Player-facing release notes remain separate from the technical `CHANGELOG.md`.