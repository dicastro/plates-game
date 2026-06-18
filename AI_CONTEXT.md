# AI_CONTEXT.md — Project Context & Architectural Decisions

This file gives any AI assistant the background needed to understand **what this project is**
and **why** key decisions were made. Operating rules and guardrails are in `AGENT.md`.

---

## Project Background

**PLATES** is a lightweight HTML5 word puzzle game built for the **YouTube Playables** platform.

The developer is a Senior Java Backend Engineer — frontend layout, SVG graphics, and
client-side mathematics are heavily AI-assisted.

### Core Mechanic
Players are given 3 consonants extracted from a license plate and must find the **shortest
valid word** that contains all three. Shorter words score higher (inverse scoring formula).

### Target Platform
YouTube Playables — an iframe-sandboxed HTML5 game runtime inside the YouTube app.
Strict constraints apply: bundle size, CSP, storage APIs, and input handling.

---

## Key Architectural Decisions & Rationale

### 1. SHA-256 Hash Dictionary (Anti-Cheat)
**Problem:** Exposing a plaintext word list in the JS bundle lets any user script a perfect score.
**Solution:** Store only pre-computed SHA-256 hashes of valid words. The frontend hashes the
user's input (+ a private salt) and checks existence in a `Set`. Word length is read from
the plain-text input before hashing — never from the dictionary.

### 2. Strategy Pattern for Platform Abstraction
**Problem:** The game must run in 3 environments: local dev, Cloudflare public review, YouTube production.
**Solution:** A `PlatformService` interface abstracts all platform calls. `PlatformFactory`
selects the correct implementation at runtime via `VITE_PLATFORM_TARGET`.
Components never reference `window.ytgame` directly.

### 3. Procedural Audio via Web Audio API
**Problem:** MP3/WAV files bloat the bundle beyond YouTube's size cap.
**Solution:** All music is synthesized in real-time using the browser's native Web Audio API,
driven by a deterministic LCG PRNG seeded by a numeric value. Same seed = identical track
on any device. Travel Mode uses the Room ID as the seed so co-located players hear the same music.

### 4. Cloudflare Serverless Backend (0€ Cost)
**Problem:** No budget for VPS or traditional API servers.
**Solution:** Cloudflare Pages (static assets) + Cloudflare Workers (edge compute) +
Cloudflare KV (transient storage). Infinite scalability at zero infrastructure cost.

### 5. Opaque Persistence (Console Injection Shield)
**Problem:** Users can invoke `ytgame.game.saveData()` directly from the browser console
to manipulate saved state (e.g., reset daily attempt counters).
**Solution:** All persisted data is wrapped in a `PersistedEnvelope` with a Base64 payload
and HMAC-SHA-256 signature. Tampered or raw JSON payloads are detected on load and trigger
an automatic day-lock penalty.

### 6. Cloudflare Worker as Leaderboard Authority
**Problem:** Client-side validation can be bypassed; arbitrary scores can be submitted.
**Solution:** The Worker holds the private dictionary salt (never exposed to the client).
It independently re-validates every submitted word and issues a short-lived cryptographic
token. Only token-bearing requests are authorized to invoke `submitScore()`.

### 7. UTC-Only Temporal Logic
**Problem:** Client device clocks can be manipulated to unlock future daily puzzles.
**Solution:** `PlatformService.initialize()` fetches the canonical epoch from a Cloudflare
Worker. All game timers, seed derivation, and daily resets use this server-provided timestamp.
`new Date()` is forbidden in game logic.

### 8. Custom Virtual Keyboard
**Problem:** Native mobile OS keyboards resize the WebView, breaking the layout.
**Solution:** A fully custom HTML/CSS virtual keyboard handles all text input. Native
`<input>` elements are forbidden. Physical keyboard events (`keydown`) are mapped to the
same React state as the virtual keys for desktop support.

---

## Platform Constraints Discovered

- YouTube Playables runs in an iframe — `localStorage`, `IndexedDB`, and `Cookies` are banned.
  Only `ytgame.game.saveData()` / `loadData()` are permitted for persistence.
- YouTube enforces a strict CSP — external dictionary CDN domains must be whitelisted in
  the Google developer console.
- YouTube Playables is not accessible in Spain (as of 2026). A public Cloudflare review URL
  is required to apply for official inclusion.
- The YouTube SDK uses `document.hidden` alternatives — the `visibilitychange` event behavior
  inside the iframe differs from standard browser behavior; rely on `ytgame.system.onPause/onResume`.
- The YouTube SDK (`game_api/v1`) redirects to a versioned file, adding network latency.
  When served locally, a Vite `type="module"` bundle executes before the SDK resolves the
  redirect. `main.tsx` polls for `window.ytgame` before mounting React to guard against this.
  The Test Suite's "SDK loaded before game code" check is a false negative in this local scenario; it does not reflect production behavior where YouTube injects the SDK before any game code.
- The YouTube SDK exposes a single storage blob (`saveData`/`loadData` with no key). The
  `PlatformService` interface adopts this constraint across all platforms — all game state is
  serialized into one envelope. `MemoryPlatform` uses a fixed internal key `"plates_save"`.

---

## What's New System (Player Updates)

Post-1.0.0, player-facing release notes are stored in `src/i18n/updates/XX.json` (one file
per locale). These are separate from the technical `CHANGELOG.md`. The authoring workflow
is: English draft from changelog → Spanish adaptation (developer-reviewed) → AI translation
to remaining locales. See `doc/functional/player-updates.md` for full spec.