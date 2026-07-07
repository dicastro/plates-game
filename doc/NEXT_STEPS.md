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