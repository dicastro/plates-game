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
    ├── persistence-schema.md      ← Envelope format, schema versioning, migrations
    ├── security-anticheat.md      ← Dictionary validation, temporal anti-cheat, edge verdict
    ├── audio-engine.md            ← Procedural synthesis, PRNG, lifecycle
    ├── platform-strategy.md       ← PlatformService interface, strategies, env vars
    ├── build-pipeline.md          ← Vite config, obfuscation, ZIP packaging
    └── i18n-architecture.md       ← UI strings layer, player updates layer, locale detection
```

---

## 1. Centralized Game Configuration (`src/config/gameConfig.ts`)

All numerical constants are defined here for easy tuning.

### 1.1 General
| Constant | Value | Description |
|---|---|---|
| `DAILY_ATTEMPTS_LIMIT` | `5` | Max attempts per day in Normal Mode |
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
| `TRAVEL_KV_TTL_SECONDS` | `10800` | Cloudflare KV TTL (3 hours) |

### 1.4 Remote Mode
| Constant | Value | Description |
|---|---|---|
| `REMOTE_TIME_WINDOW_HOURS` | `24` | Hours for friends to submit scores |
| `REMOTE_ATTEMPTS_LIMIT` | `1` | Attempts per player |
| `REMOTE_KV_TTL_SECONDS` | `172800` | Cloudflare KV TTL (48 hours) |

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

---

## 3. YouTube Playables Compliance

| Requirement | Implementation |
|---|---|
| Bundle < 2MB (hard cap 5–10MB) | Zero raster assets; inline SVG; no external fonts |
| Responsive fluid layout | `w-screen h-screen overflow-hidden` root; orientation-safe |
| No pinch-to-zoom | `user-scalable=no` in `index.html` viewport meta |
| No elastic scroll | `overscroll-behavior: none` on `html, body` |
| Hybrid input (touch + pointer) | Custom virtual keyboard; no native `<input>` overlays |
| Audio lifecycle | `muteAudio()` on `onPause`; `AudioContext` disposed on unmount |
| No localStorage / IndexedDB | All persistence via `PlatformService.saveData()` only |