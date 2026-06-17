# AGENT.md — AI Operating Rules

This file contains the operational guardrails and workflow rules for any AI assistant
contributing to this project. It is **not** a product description — see `AI_CONTEXT.md`
for project context and architectural decisions.

---

## Absolute Guardrails

### 1. Language & Communication
- Developer communicates in **Spanish**.
- ALL outputs — code, comments, TypeScript types, markdown files — must be **100% English**.

### 2. Clarification Over Assumption
- If a requirement is ambiguous, **stop immediately** and ask a single, precise question.
- Never generate code or analysis based on guesswork.

### 3. Proactive Challenge (Critical Thinking Before Executing)

Before executing any request, evaluate it against software engineering best practices,
project standards, and architectural constraints. If the request conflicts with any of
these, **raise the concern first** — even if the developer did not explicitly ask for feedback.

**Challenge proactively when the developer:**
- Proposes placing content in a file/location that violates the established structure
  (e.g., dev workflow docs in `README.md`, product info in `AGENT.md`).
- Requests a quick hack, workaround, or pattern that introduces technical debt.
- Asks for something that contradicts a documented architectural decision without
  acknowledging the conflict.
- Proposes a non-standard approach when a well-established industry convention exists.

**Do not challenge:**
- **Observed facts:** if the developer says "X is happening in local" or "the value is Y",
  accept the observation. Only question the *diagnosis or proposed fix* if there is a clear
  technical contradiction.
- **Explicit decisions made after being warned:** if the developer has been presented with
  a trade-off and explicitly confirms a path — including a known shortcut — execute without
  insisting further. The developer retains full control.

**How to challenge:**
- One concise sentence explaining the concern.
- One concrete counter-proposal (the standard/correct approach).
- Then ask for confirmation before proceeding.
- Never refuse outright — the final decision always belongs to the developer.

**Example:**
> Developer: "Add the release workflow to README.md."
> AI: "README.md is scoped to product description and setup. The standard location for
> contributor workflow is `CONTRIBUTING.md`. Shall I create that instead?"

### 4. Documentation Architecture

The documentation system has **five root files**, one contributor guide, and a `/doc` directory:

| File | Audience | Purpose |
|---|---|---|
| `README.md` | Public / Dev | Product description, stack, local setup commands |
| `CONTRIBUTING.md` | Dev | Commit conventions, release workflow, versioning guide |
| `SPECS.md` | Dev / AI | Config constants + `/doc` directory index |
| `AGENT.md` | AI only | Operating rules, guardrails, workflow (this file) |
| `AI_CONTEXT.md` | AI only | Project background, architectural decisions, discovered constraints |
| `CHANGELOG.md` | Dev | Auto-generated technical changelog via `release-it` |

The `/doc` directory holds all granular specifications:
```
doc/functional/   ← game-modes, scoring, versioning-changelog, player-updates
doc/technical/    ← persistence-schema, security-anticheat, audio-engine,
                     platform-strategy, build-pipeline, i18n-architecture
```

**Rules:**
- `AGENT.md` = *how to work* on the project.
- `AI_CONTEXT.md` = *what the project is and why* decisions were made.
- They share the same audience (AI) but must never duplicate content.
- Documentation must always reflect the **current ground-truth state** — never a changelog.
- Do not add detail to `SPECS.md`; redirect to the appropriate `/doc` file instead.

### 5. Update & Commit Workflow
- During a development session, propose changes freely without updating documentation.
- **Only after the developer explicitly validates a change as accepted:**
  1. Update the relevant markdown files (minimum set — only what changed).
  2. Generate a single, clean semantic commit message.
- If the feature required multiple correction cycles, the commit message reflects only
  the **final delivered result** — no mention of intermediate fixes or revisions.
- Commit format: `type(scope): concise description`
  - Examples: `feat(audio): add deterministic PRNG engine`, `fix(crypto): handle tamper edge case`
  - `docs:` commits do not trigger a version bump.

### 6. Token Optimization (Function as Minimum Unit)
- Never rewrite a whole file when only a function changed.
- Output only the updated function or code block. Developer replaces it manually.

### 7. Clean Code — No Hacks
- Always follow software engineering best practices.
- If a module grows complex or branchy, propose a refactor **before** adding new logic.
- No unit, integration, or E2E tests during the MVP phase.

### 8. Workflow Boundaries
- This is a web LLM interface — no live terminal.
- Never suggest running bash scripts or local verification commands.

### 9. Architectural Source of Truth
- Always read `README.md`, `AI_CONTEXT.md`, `SPECS.md`, and `/doc` before generating.
- Stack: React 19, TypeScript, Vite, Tailwind CSS.

### 10. Platform Isolation
- Zero `window.ytgame` references outside of `YouTubePlatform`.
- All platform interactions go through `PlatformService` / `PlatformFactory`.
- `MemoryPlatform` uses `sessionStorage` + Page Visibility API + dev window hooks.

### 11. No External UI/State Libraries
- No Redux, Zustand, i18next, or heavy UI libraries.
- Use React Hooks, Context, and native Tailwind CSS.

### 12. Security & Temporal Anti-Cheat
- Never expose plaintext dictionary words in the bundle.
- Never use `new Date()` for game timing — server-provided UTC epoch only.
- See `doc/technical/security-anticheat.md` for full details.

### 13. Asset Restrictions
- **Zero-Raster Policy:** No PNG/JPG/WebP/GIF. All graphics via inline SVG or Tailwind.
- **Zero-Audio-File Policy:** No MP3/WAV/OGG. Audio via Web Audio API only.
- `AudioContext` must be disposed on component unmount.
- All interactive buttons must be throttled (timestamp-based) or `disabled`-state locked.
- `index.html`: `user-scalable=no`. Global CSS: `overscroll-behavior: none`.

### 14. Tonality
- Extremely concise, direct, and highly technical. No conversational filler.

---

## Versioning Rules (Summary)

Full rules in `doc/functional/versioning-changelog.md` and `CONTRIBUTING.md`.

- Format: `major.minor.patch`
- Pre-1.0.0: new feature/refactor → minor bump (`0.X.0`); fix → patch; docs-only → no bump.
- `SCHEMA_VERSION` frozen at `1` until `1.0.0` — breaking schema changes discard data silently.
- Automated via `release-it` + `@release-it/conventional-changelog`.