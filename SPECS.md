# PLATES — Project Specifications

This file is the **high-level orchestrator**. All detailed specifications live in `/doc`.

---

## Documentation Structure

```
README.md                          ← Product description, stack, local setup
SPECS.md                           ← This file: config constants + /doc index
AGENT.md                           ← AI operating rules (guardrails, workflow)
AI_CONTEXT.md                      ← AI project context (decisions, constraints)
CHANGELOG.md                       ← Auto-generated technical changelog (release-it)

doc/
├── functional/
│   ├── game-modes.md              ← Normal / Travel / Remote mode specs
│   ├── scoring.md                 ← Inverse formula, plate bonus, leaderboard flow
│   ├── versioning-changelog.md    ← Version bump rules, release toolchain
│   └── player-updates.md         ← What's New system for players (multi-language)
└── technical/
    ├── security-anticheat.md      ← Dictionary validation, temporal anti-cheat, edge verdict
    ├── audio-engine.md            ← Procedural synthesis, PRNG, lifecycle
    ├── platform-strategy.md       ← PlatformService interface, strategies, env vars
    ├── worker-architecture.md     ← Worker endpoints, Durable Objects/D1 model, OAuth flow, KV-less storage strategy
    ├── build-pipeline.md          ← Vite config, obfuscation, ZIP packaging
    ├── local-development.md       ← Local Explorer, SQL inspection, resetting local state
    ├── deployment-runbook.md      ← Google Console setup, D1/secrets/environments step-by-step
    └── i18n-architecture.md       ← UI strings layer, player updates layer, locale detection

```

---

## 1. Centralized Game Configuration

All numerical constants shared between the client and the Worker live in
`shared/gameConfig.ts`. Constants used only by the client live in `src/config/`
(currently empty — all existing constants were promoted to `shared/`).

### 1.1 General
| Constant | Value | Description |
|---|---|---|
| `NORMAL_MODE_DAILY_ATTEMPTS_LIMIT` | `5` | Max attempts per day in Normal Mode. Lives in `shared/gameConfig.ts` (also consumed by the Worker). |
| `MIN_PLAYABLE_HEIGHT_PX` | `480` | Minimum viewport height (px) required to render the game. Below this the viewport gate triggers. Lives in `shared/gameConfig.ts`. |
| `MAX_STORAGE_TRIPS_HISTORIC` | `30` | Max historical sessions stored per user |
| `DICTIONARY_FALLBACK_LANG` | `"en"` | Fallback locale for missing translation keys |

### 1.2 Plate Scoring
| Constant | Value | Description |
|---|---|---|
| `PLATE_SCORING_BASE_SCORE` | `100` | Base score before word-length subtraction |
| `PLATE_NUMERIC_BONUS_ENABLED` | `true` | Enables digit-sum bonus calculation |
| `PLATE_NUMERIC_BONUS_MULTIPLIER` | `1` | Scale factor applied to digit sum |
| `PLATE_JACKPOT_PATTERN_MULTIPLIER` | `2.0` | Multiplier for palindromes, pairs, trios |

### 1.3 Travel Mode
| Constant | Value | Description |
|---|---|---|
| `TRAVEL_DEFAULT_ROUNDS` | `5` | Rounds per session |
| `TRAVEL_MIN_CONSONANTS` | `3` | Floor for consonant extraction |
| `TRAVEL_MAX_CONSONANTS` | `3` | Ceiling for consonant extraction |
| `TRAVEL_COUNTDOWN_SECONDS` | `60` | Per-round countdown timer |
| `TRAVEL_ATTEMPTS_LIMIT` | `1` | Attempts per round |
| `TRAVEL_LOBBY_TIMEOUT_SECONDS` | `300` | Room auto-disposal if unfilled (5 min) |

### 1.4 Remote Mode
| Constant | Value | Description |
|---|---|---|
| `REMOTE_TIME_WINDOW_HOURS` | `24` | Hours for friends to submit scores |
| `REMOTE_ATTEMPTS_LIMIT` | `1` | Attempts per player |

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19, TypeScript, Vite |
| Styling | Tailwind CSS |
| Edge Compute | Cloudflare Workers + KV |
| Static Hosting | Cloudflare Pages |
| Platform Abstraction | Strategy Pattern (`PlatformService`) |
| Audio | Web Audio API (procedural synthesis) |
| Graphics | Inline SVG + Tailwind (zero raster assets) |