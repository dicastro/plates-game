# AI Context & Project History

This document serves as the historical context and architectural alignment for any AI Assistant contributing to this project. It encapsulates the core decisions made during the system design phase.

## 🧠 Project Background & Intent
The developer is a Senior Java Backend Programmer building a specialized HTML5 client-side word puzzle game for YouTube Playables. Because the developer is a backend expert, the frontend layout (HTML, CSS, SVG) and specific client-side mathematics will be heavily assisted by AI generation.

## ⚔️ The Core Anti-Cheat Problem & Solution
* **The Risk:** Since the game rewards finding the *shortest* word, exposing a plain-text dictionary array in the JavaScript bundle would make it trivial for any user to write a browser script to scrape the file, sort by length, and automate a perfect score.
* **The Blueprint:** We do **not** store words. We store pre-computed **SHA-256 hashes** of the valid words. When a user submits a word, the frontend hashes it locally and checks if that hash exists in the pre-compiled Set. Word length is calculated directly from the user's plain-text input string before hashing. This protects intellectual property and integrity at 0 bytes of database lookups.

## 🧭 Architectural Constraints & Discoveries
1.  **YouTube Playables Sandbox:** The game runs inside an iframe. Standard storage APIs (`localStorage`, `IndexedDB`, Cookies) and standard visibility triggers (`document.hidden`) are strictly banned or restricted. We **must exclusively** use the native YouTube SDK (`ytgame.game.saveData`, `loadData`, `system.onPause`, `onResume`).
1. **Network Boundaries:** YouTube enforces a strict Content Security Policy (CSP). External dictionary asset downloads must be white-listed in the Google developer console.
1. **No Traditional Backend:** The project deliberately avoids standard relational databases, VPS hosting, or dedicated API servers to maintain **0€ infrastructure costs**. Cloudflare Pages (Frontend) and Cloudflare Workers + Key-Value Storage (Edge Compute) handle all dynamic behaviors.
1. **Geographic & Review Restrictions:** As of 2026, YouTube Playables is not natively accessible in certain regions (including Spain). To apply for official inclusion, Google requires a fully testable public web URL. 
1. **Environment Decoupling:** The codebase must never perform direct, hardcoded platform checks inside UI components. All platform capabilities (Save Data, Load Data, Leaderboards) are strictly abstracted behind a Strategy Pattern interface.

## 🎼 The Audio Engine Choice (Deterministic Synthesis)
Instead of packing heavy `.mp3` or `.wav` files that bloat the initial bundle weight, or using traditional asset streaming, the game relies on procedural audio generation. We use the browser's native **Web Audio API** to synthesize waveforms on the fly. 
* All musical structures (tempo, chords, melodies) are derived from a Pseudo-Random Number Generator (PRNG) driven by a specific numeric **Seed**. 
* Given the same Seed, the engine produces exactly identical tracks across different devices. 
* This architecture allows mathematical sound modulation (e.g., speeding up the BPM when the timer is low) and permits saving the seed alongside the game state to perfectly recreate the match's soundtrack.

---

## 🛡️ AI Developer Guardrails & Strict Coding Boundaries

Any AI contributing to this codebase must strictly enforce the following execution mandates:

### 1. Platform Isolation
* **Zero Direct SDK References:** You are strictly prohibited from referencing `window.ytgame` or any YouTube Playables SDK syntax inside visual React components, hooks, or styles. Everything must go through the abstracted `PlatformService`.
* **Testing Emulation:** The local testing strategy (`MemoryPlatform`) must mock all async data using `sessionStorage` and emulate lifecycle state events (`onPause`/`onResume`) using the native Page Visibility API (`visibilitychange`) alongside dev-only global hooks (`window.__SIMULATE_YT_PAUSE__` / `window.__SIMULATE_YT_RESUME__`).

### 2. Assets & Footprint Restrictions
* **Zero-Raster Policy:** Never include PNG, JPG, WebP, or GIF files. All visual assets—including the game logo, icons, thematic backgrounds, and illustrations—must be built exclusively using lightweight structural CSS layers or semantic, inline SVG components.
* **Zero-Audio-File Policy:** Static sound files are banned. Audio must be closed and destroyed strictly upon component unmounting to prevent memory leaks during Hot Module Replacements (HMR).

### 3. Defensive Client-Side UX & Anti-Cheat
* **Temporal Security:** Never rely on the client device's native clock or local timezones (`new Date()`) for daily reset synchronization. The current active epoch and puzzle seed calculation must derive entirely from the UTC standard provided by the platform initialization hook (fetched via server-driven Cloudflare Workers in production).
* **Double-Submit Mitigation:** Core gameplay actions (like on-screen virtual keyboard inputs) must implement timestamp-based throttling refs. Explicit state-driven `disabled` HTML attributes must lock asynchronous flow submission buttons to defend game integrity against frantic clicks or network lag.
* **Layout Lock:** Prevent WebView container resizing on mobile devices. The root setup must strictly block user-driven pinch-to-zoom (`user-scalable=no` meta viewport) and eliminate elastic bounce behaviors (`overscroll-behavior: none` on HTML/Body).
* **Console Injection Shield:** All user save states must be encrypted and cryptographically signed before being sent to the platform storage API. Raw text JSON strings are strictly banned from persistence. If the deserialization layer detects a signature mismatch during initialization, it must automatically treat the session as compromised and lock the user out for the day.