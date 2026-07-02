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

- **`worker-architecture.md` §5 — `attemptsHistory` in enter response.** The `POST /normal/enter` endpoint must return the full `attemptsHistory` array for the current day, not just `attemptsUsedToday`. Document this in the Worker architecture spec once the Worker is implemented.

- **`markRulesIntroSeen` Worker endpoint.** `PlatformService.markRulesIntroSeen()` is implemented in `MemoryPlatform` (in-memory mutation) but `CloudflarePlatform` throws. Needs a Worker endpoint (e.g. `POST /player/prefs`) that persists `hasSeenRulesIntro` on the player's Durable Object.