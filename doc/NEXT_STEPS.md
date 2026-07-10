# Next Steps

Backlog of deferred items. Not detailed specs — each entry points to where the problem/proposal is documented, or carries enough context inline when no such document exists yet. Removed once implemented (or promoted into a real spec).

- **Normal Mode result-sharing semantics & icon placement.** The Normal Mode best-score panel originally had an icon-only share button, but icon-only cannot disambiguate two genuinely different actions: (1) posting a result publicly (e.g. to X/social media, addressed to no one in particular) vs. (2) challenging one specific friend to beat a score (a dare, not a public post). These likely need different framing/copy and possibly different share payloads, but two buttons in an already-tight collapsed panel may hurt the UI. Needs a product decision on: one button with a choice sheet, two distinct buttons, or dropping one use case for Normal Mode entirely. Removed from `BestScorePanel` for now — see `doc/functional/mockups/normal-mode-mockups.html` §1 for the original icon-only mockup design, now superseded by this open question. Generic share icon (`src/components/icons.tsx` `ShareIcon`) is ready for use once resolved. Also affects the share payload/OG preview content referenced in `doc/technical/worker-architecture.md` §7 (mechanism is defined there; message/image content is not).

- **Difficulty badge — categorization model not defined.** `PlateBadgesRow` in `PlateHeader` has a comment placeholder for a future difficulty badge. Before any visual design or rendering work, this needs: (1) define the categorization model (how many tiers, numeric vs named); (2) how many difficulty categories/tiers exist; (3) whether difficulty is a numeric score or a small set of named categories (e.g. easy/medium/hard/tricky). Only once that model is defined can the badge's visual treatment be designed and the rendering implemented in `PlateBadge.tsx`. See `doc/functional/mockups/normal-mode-mockups.html` §1 for the original placeholder.

- **Selective network-block detection (Spain/La Liga IP blocks).** Distinguish generic connectivity failure from selective domain blocking during `submitAttempt()`. See `AI_CONTEXT.md` decision 14 for the problem description and the connectivity-probe proposal discussed.

- **Extra-attempt-via-ad Worker endpoint.** `CollapsedFooter` renders a "watch ad for 1 extra attempt" button (gated by `PlayerProfile.adsEnabled`) with a no-op `onExtraAttemptGranted` handler. The Worker must confirm ad completion before granting the extra attempt — no client-only unlock. Needs: new Worker endpoint, new `PlatformService` method, and a `EXTRA_ATTEMPT_GRANTED` reducer action in `GameRuntimeContext`. See `doc/functional/mockups/normal-mode-mockups.html` §6 and `doc/technical/security-anticheat.md` §4

- **Forced PWA install prompt.** Chrome/Chromium browsers may delay the automatic install banner; the `beforeinstallprompt` event can be captured and triggered on demand via a button. Add this button to the Settings overlay once it exists (currently a disabled HUD icon — see `src/hud/PersistentHUD.tsx`).

- **PWA install icons — placeholder quality.** `public/icon-192.png` and `public/icon-512.png` were generated programmatically with DejaVu Sans Bold. Replace with a properly kerned, brand-consistent version before public launch.

- **Unsupported-resolution telemetry.** When `useViewportSupport()` resolves "unsupported", consider logging width/height to the Worker for future analysis. Needs a new `PlatformService` method and a Worker endpoint/D1 table once that's prioritized. See `src/layout/useViewportSupport.ts`.

- **Container query thresholds — real-device validation.** Several `cqw`/`cqh` multipliers and the `@container game-area (max-height: 360px)` badge-hiding threshold were set as reasonable starting values. Validate on a representative set of real devices (especially mid-range Android phones in both portrait and the `needs-rotation` edge case) before release.

- **`screen-map.md` §8 Travel/Remote GameEngine contract.** The multi-round emit pattern (`onRoundComplete`) is not yet defined for Travel/Remote modes. To be specified in the Travel Mode implementation session.

- **BonusInfoOverlay word-count table.** `BonusInfoOverlay` renders a placeholder with a TODO comment. The per-length word count data must be added to `NormalModeStatus.puzzle` and surfaced by the Worker's `/normal/enter` endpoint. See `doc/technical/worker-architecture.md` §5.

- **Leaderboard read endpoints.** D1 schema and write path exist (`player_period_stats`);
  `GET /leaderboard/:lang` (+ `?country=`) with a Cache API layer (TTL to next UTC
  midnight) is designed but not implemented. See `doc/technical/worker-architecture.md` §6.

- **Full scoring model redesign.** Current formula is a literal implementation of
  `doc/functional/scoring.md` §2-3, explicitly flagged provisional: per-bonus-type
  multipliers, word difficulty (model undefined), and an attempt-number penalty are
  all open. Also resolves the `PlateHeader.tsx::isJackpot()` badge bug (treats `"sum"`
  as jackpot when it isn't). See `doc/functional/scoring.md` §6.

- **Country tracking & player-selectable active country.** Track a per-`lang` map of
  country → attempt count on the Durable Object; expose a Settings section letting the
  player choose their active ranking country among ones they've actually played from
  (not the full country list). See `AI_CONTEXT.md` decision 8 addendum.

- **`release-it` `commitsPath` cross-directory validation.** `worker/.release-it.json`
  uses `". ../shared"` to include `shared/`-only commits in the worker's version
  candidacy — unverified whether git resolves `../shared` correctly from that CWD.
  Validate with `--dry-run` before the first real worker release; adjust if needed.

- **OAuth callback redirect is not language-aware.** `FRONTEND_BASE_URL` (Worker env
  var) is a single fixed value per Worker environment, but the game will eventually be
  deployed N times (one per language), each on its own domain. The Worker has no way
  to know which of those N frontend domains initiated a given login request, so the
  callback redirect only works correctly while a single frontend domain exists per
  environment. Needs a solution before the second language deployment — e.g. passing
  the originating frontend origin through the OAuth `state` token itself, the same way
  `intent` already travels through it. See `doc/technical/worker-architecture.md` §4.

- **Hardcoded styles outside the theming system — requires a dedicated session.**
  Several new screens (`AliasSetupScreen`, `LeaderboardScreen`) have accumulated
  Tailwind classes with arbitrary colors/sizes (`bg-[rgba(192,57,43,0.18)]`,
  `text-[#e87070]`, ad-hoc font sizes) instead of exclusively using the
  `ThemeProvider`/`--color-*` contract (see `doc/technical/theming-architecture.md`)
  and the centralized typography tokens in `tailwind.config.js` (`text-overlay-title`,
  `text-panel-label`, etc. — added in this session). This breaks the goal of being able
  to switch visual templates with a single configuration variable: any color/size written
  directly into a component will not react to a theme change. **Scope of the dedicated session:**
  (1) audit `src/screens/` and `src/game/` for color literals (`#`, `rgba(`, default
  Tailwind color names like `bg-black/60`) and replace them with existing or new `--color-*`
  variables if any are missing (e.g., there is currently no semantic equivalent for a
  "soft error background" — the `rgba(192,57,43,0.18)` used in several banners should be
  a theme variable, e.g., `--color-danger-soft-bg`); (2) retrofit `OverlayCard`, `ResultOverlay`,
  `RulesOverlay`, and `BestScorePanel` (already visually validated) to use the new typography
  tokens instead of their inline `clamp()` — same visual value, no design changes, just
  centralization; (3) ensure that no new components repeat this in the future — possibly
  via a lint rule or a checklist in `AGENT.md`.

- **No shared response-shape contract between Worker and client.** `shared/apiRoutes.ts`
  already centralizes routes and query-param shapes (`ParseResult<T>`, `QueryCodec`), but
  the *response bodies* each endpoint returns are only implicitly shared via
  `shared/types.ts` interfaces (`PlayerProfile`, `LeaderboardResult`, `AttemptResult`,
  etc.) — nothing enforces that a given Worker handler's `Response.json(...)` payload
  actually conforms to the interface the client expects to parse. A field renamed,
  removed, or retyped on one side compiles fine on both sides independently and only
  surfaces at runtime (or not at all, if the client just reads `undefined` silently).
  **Scope of the fix:** extend the `RouteDefinition`/`API_ROUTES` mechanism
  (`shared/apiRoutes.ts`) with an explicit `ResponseBody` generic per route — e.g.
  `RouteDefinition<PathParams, Query, ResponseBody>` — so each Worker handler's return
  type and each client-side `parseJsonOrThrow<T>()` call both derive `T` from the same
  route definition (`RouteResponse<typeof API_ROUTES.leaderboard>`, mirroring the
  existing `RouteContext<...>` pattern), instead of independently importing a
  `shared/types.ts` interface that nothing forces them to actually match at the call
  site. Candidate for the same dedicated session as the theming/styles cleanup item
  above, since both are "tighten an existing shared contract" work rather than new
  features.

- **Accented-letter input via long-press popover (game mode word entry only).**
  Interaction model decided: long-press (not simple tap, to avoid slowing down
  regular typing since accents are a residual use case) on a key with variants
  opens a popover in a **fixed position** (not anchored per-key — avoids all
  edge-of-keyboard positioning math). The popover stays open until a second tap
  either (a) selects an option — commits that character and closes, or (b) lands
  outside the popover — closes without committing anything. No drag/slide
  gesture — this is what makes it equally simple on touch and mouse/desktop.
  Data model: extend `KeyboardLayout` (`keyboardLayouts.ts`) with
  `variants?: Record<string, string[]>` per language (e.g. es: A→Á, E→É, I→Í,
  O→Ó, U→Ú/Ü). `VirtualKeyboard` needs a capabilities prop
  (`{ allowSymbols, allowAccents }`) so each screen opts in independently —
  game mode: accents on, symbols off; **explicitly out of scope for the Alias
  Setup screen**, which only needs letters + digits (see
  `doc/functional/mockups/alias-setup-mockups.html`). Digits stay on a
  mode-toggle key (`Aa ⇄ 123`), never folded into the popover mechanism —
  digits are a primary character class, not a rare alternate, so mixing the
  two interaction patterns would be inconsistent with what players already
  expect from OS keyboards.

- **Multi-device attempt history goes stale mid-session.** `AttemptResult`
  (`shared/types.ts`) does not include the full `attemptsHistory` — only the new
  attempt's own result plus `attemptsUsedToday`/`bestScoreToday` totals. The client
  (`GameRuntimeContext`'s `SUBMIT_SUCCESS` reducer action) locally appends the new
  attempt to its in-memory history instead of replacing it with the backend's
  authoritative list, which only refreshes on `enterNormalMode` (page reload / re-enter
  Normal Mode). Effect: a player using two devices simultaneously against the same
  daily puzzle sees a stale attempts list/history on the device they're not actively
  using, until they leave and re-enter. Not a security issue — `attemptsUsedToday` is
  always enforced server-side regardless of what the client displays — purely a visual
  consistency gap. A related, more visible symptom: if the daily limit gets reached via
  a *different* device, the next attempt from the stale device surfaces a generic
  "Algo ha ido mal" (`SubmitErrorOverlay`) instead of a clear "no attempts left" message,
  because `GameRuntimeContext.submit()`'s `catch` block treats every thrown error the
  same way (`SUBMIT_FAILURE`) without distinguishing a legitimate 400 (limit reached /
  structurally invalid) from a real network failure. Fix requires: (1) add
  `attemptsHistory: AttemptRecord[]` to `AttemptResult` so the Worker always returns the
  authoritative full list on every attempt, (2) have the reducer replace instead of
  append, (3) differentiate error types in `submit()`'s catch to show the correct
  overlay/message.se

- **`GameRuntimeContext`'s `SUBMIT_SUCCESS` reducer still locally constructs and
  appends the attempt record instead of replacing `attemptsHistory` from the
  Worker's response.** `AttemptResult.attemptsHistory` was added and the Worker/
  `MemoryPlatform` both now populate it correctly, but the client-side reducer
  was never updated to consume it — it still builds `record` from `state.typedWord`
  and does `[...state.attemptsHistory, record]`. This means the original
  multi-device staleness bug (see the fuller description already in this file)
  is only half-fixed: the data is now available, but not yet used. Also still
  open: differentiating a legitimate 400 (limit reached / structurally invalid)
  from a real network failure in `submit()`'s `catch` block.

- **Full country list per leaderboard view.** The country filter currently offers
  only "All countries" or the player's own country — a real per-view distinct
  country list was designed against (and would be answerable via
  `available_periods`, grain-bounded by country count) but the client-side combo
  and a corresponding client method were never wired. `MemoryPlatform` doesn't
  reflect this either. See `LeaderboardScreen.tsx`'s country `<select>`.

- **`shared/isoWeek.ts` / `worker/src/dateKeys.ts` still have adjacent, not fully
  unified, ISO-week logic.** `weekKeyUtc`/`mondayOfIsoWeek1` live in
  `shared/isoWeek.ts` and are re-exported by `dateKeys.ts` — no duplication of
  those two — but `dateKeys.ts`'s own remaining helpers (`weeksBetween`,
  `monthsBetween`, etc.) and `shared/isoWeek.ts`'s client-only range formatting
  (`src/leaderboard/weekRangeFormat.ts`) evolved somewhat independently during
  this session. Worth a pass to confirm there's no remaining redundant logic
  once the response-shape-contract session (see below) happens.

- **`screen-flow.svg` is stale.** Its `LEADERBOARD` node still says "YouTube
  native"（obsolete, no `ALIAS_SETUP` node exists at all. Per the file's own
  header note, all updates to this diagram are AI-generated from natural-language
  requests, never hand-edited — needs a dedicated request to regenerate it once
  the current screen set is considered stable.