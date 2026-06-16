# Project Specifications: PLATES - The Ultimate License Plate Word Game

This specification document outlines the technical stack, state configuration, workflows, and core architecture of the application. All placeholders marked with `[DEFINE_VALUE]` represent configuration variables awaiting final numerical tunings.

---

## 1. System Constants & Placeholders (Configuration)

The following variables must be easily modifiable via a centralized `src/config/gameConfig.ts` file to govern the global mechanics:

### 1.1 General & Core Game Settings
* `DAILY_ATTEMPTS_LIMIT`: `5` - Maximum word entry attempts allowed per day in Normal (Global) Mode.
* `MAX_STORAGE_TRIPS_HISTORIC`: `30` - Max number of historical travel/remote sessions stored in user Cloudflare KV / YouTube data.
* `DICTIONARY_FALLBACK_LANG`: `"en"` - System language recovery toggle to prevent undefined key rendering.

### 1.2 Plate Digit Mechanics (Luck & Scoring Modifiers)
* `PLATE_SCORING_BASE_SCORE`: `100` - Base points awarded for a valid word validation.
* `PLATE_NUMERIC_BONUS_ENABLED`: `true` - Toggle to enable digit extraction logic from license plates.
* `PLATE_NUMERIC_BONUS_MULTIPLIER`: `1` - Scale factor applied to the sum of the 4 digits (e.g., Plate `9210` -> Sum = 12 * factor).
* `PLATE_JACKPOT_PATTERN_MULTIPLIER`: `2.0` - Score multiplier if the 4 digits trigger a special pattern (Pairs like `2244`, Trios like `7771`, or Palindromes/Capicúa like `1221`).

### 1.3 Mode: Travel Mode Settings (Synchronous Local Multplayer)
* `TRAVEL_DEFAULT_ROUNDS`: `5` - Number of sequential license plate rounds that constitute a full game session inside a vehicle/room.
* `TRAVEL_MIN_CONSONANTS`: `3` - Fixed floor for consonant extraction.
* `TRAVEL_MAX_CONSONANTS`: `3` - Fixed ceiling for consonant extraction (Spanish plate standard constraint).
* `TRAVEL_COUNTDOWN_SECONDS`: `60` - Strict countdown timer per round for instant synchronous tension.
* `TRAVEL_ATTEMPTS_LIMIT`: `1` - Only one single high-stakes attempt allowed per round.
* `TRAVEL_LOBBY_TIMEOUT_SECONDS`: `300` - Maximum time (5 minutes) a room can stay in "Lobby" status waiting for players to join before auto-disposal.
* `TRAVEL_KV_TTL_SECONDS`: `10800` - Time To Live (3 hours) for the room state in Cloudflare KV before hard deletion.

### 1.4 Mode: Remote Mode Settings (Asynchronous Friends Challenge)
* `REMOTE_TIME_WINDOW_HOURS`: `24` - Time limit window allowed for challenged friends to submit their scores to the room.
* `REMOTE_ATTEMPTS_LIMIT`: `1` - Only one single definitive attempt allowed per player.
* `REMOTE_KV_TTL_SECONDS`: `172800` - Time To Live (48 hours) for asynchronous rooms in Cloudflare KV before expiration.

---

## 2. Technical Stack & Architecture

### Frontend
* **Framework:** React 19 (Functional components, Hooks).
* **Language:** TypeScript (Strict typing enabled).
* **Build Tool:** Vite.
* **CSS Style Engine:** Tailwind CSS.
* **Platform Layer:** Decoupled architecture using the **Strategy Pattern** to swap platform providers at compile-time via Vite Environment Variables (`VITE_PLATFORM_TARGET`).

### External / Edge Backend
* **Static Asset Delivery:** Cloudflare Pages (Hosts the bundled assets and the pre-computed compressed dictionary hash files under-demand).
* **Micro-Services:** Cloudflare Workers (Intercepts `POST` requests for multiplayer sessions).
* **Transient Storage:** Cloudflare KV (Stores short-term JSON strings mapped to unique 4-digit room tokens).

---

## 3. Security, Validation & Anti-Cheat Architecture

### 3.1 Data Dictionary Validation Engine
#### Dictionary Structural Format
Dictionaries are precompiled offline from plaintext lexical sources into binary or linear arrays of hex string segments representing the **SHA-256** checksum signature of each word.
* Example raw array output layout: `["8bc2...", "1a4f...", "f5a2..."]`
* Files are served over gzip/brotli encryption standards via Cloudflare CDN.

#### Validation Flow Architecture
1.  User enters text string (e.g., `"Canto"`).
2.  System extracts plain length integer metrics (`string.length`).
3.  System checks if the text string explicitly contains the active day's 3-consonant variables.
4.  System hashes the clean string conversion to SHA-256 lowercase.
5.  System runs a lookup query: `DictionarySet.has(userHash)`.

### 3.2 Timezone & Temporal Anti-Cheat (Deterministic Reset)
* **Global UTC Standard:** The Daily Challenge resets globally and simultaneously for all players at exactly **00:00 UTC**. Local device timezones, regional offsets, or GPS/VPN locations must never dictate active game seeds or unlock future puzzles ahead of time.
* **Server-Driven Clock Validation:** During `PlatformService.initialize()`, production environments (`CLOUDFLARE` or `YOUTUBE`) must fetch the current canonical timestamp from a secure, lightweight Cloudflare Worker endpoint.
* **Drift Protection:** The core game loop, input verification, and daily timer countdown must rely strictly on this server-provided epoch time. The frontend will dynamically calculate and enforce elapsed duration from that safe baseline, rendering client-side clock tampering completely useless.

#### 3.2.1 Client-Side Opaque Persistence Layer (Console Injection Shield)
To mitigate malicious users intercepting execution flows or invoking native platform storage APIs directly via the browser developer console (e.g., executing `window.ytgame.game.saveData()` to manually clear daily attempts), the application must enforce an immutable, encrypted serialization protocol:

1. **State Payload Structure:** The game state must never store open numerical variables like `attempts: 3`. Instead, it must persist a deterministic, incremental ledger, such as an array of the SHA-256 hashes of the words submitted during the session (`attemptsLedger: [hash1, hash2, ...]`).
1. **Cryptographic Wrapping:** Before forwarding any stringified state to `PlatformService.saveData()`, the data must pass through a lightweight symmetric encryption utility or structural obfuscation cycle running a custom checksum routine (HMAC/SHA-256) combined with a hardcoded internal salt.
1. **Serialized Output Format:** The payload written to the platform storage must resolve to an opaque structure:
```json
   {
     "payload": "U2FsdGVkX19v...", 
     "signature": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
   }
```
1. **Tamper Detection Policy**: During `PlatformService.loadData()`, the system must decrypt the payload and re-verify the integrity signature against the internal salt. If the signatures do not match, or if the data structure is corrupted (indicating a raw JSON console injection attempt), the validation layer must trip a security flag: the save file is treated as compromised, the UI locks, and the player's active day is automatically penalized and marked as depleted (5 failed attempts).

### 3.3 Advanced Cryptographic Countermeasures (Vector Defense)

#### 3.3.1 Dictionary Salt Protection (Anti-Rainbow Table)
* **Mechanism:** To prevent attackers from downloading the compiled SHA-256 JSON dictionaries from the CDN and reverse-engineering them using pre-computed local wordlists (Rainbow Table attacks), all word signatures must be compiled offline using a dynamic salting pattern: `SHA-256(lowercase_word + project_secret_salt)`.
* **Execution:** The frontend runtime validation engine will append this immutable internal salt to the user's input string before hashing and checking existence within the `DictionarySet`.

#### 3.3.2 Leaderboard Submission Integrity & Identity Binding
* **Identity Injection:** The encrypted storage payload must bind the player's unique platform identifier (`ytgame.system.getUserId()`) and the active day's temporal timestamp inside the encrypted string block before calculating the security integrity signature.
* **Replay Attack Mitigation:** If a player attempts to copy a valid encrypted save state from another user or session, the decryption routine will detect an identity or seed mismatch against the live environment variables, triggering an immediate session invalidation and corruption penalty.
* **Score Verification Flow:** Scores pushed to `PlatformService.submitScore()` must be accompanied by the verified state ledger token. Pure console invocations attempting to push arbitrary integers to the leaderboard interface without a cryptographically sealed game-completion event will be structurally flagged as anomalous.

#### 3.3.3 Edge Server Verification Flow (Cloudflare Worker Verdict)
To achieve true data integrity without relying on frontend security obfuscation alone, the definitive validation of the match and leaderboard authorization must be delegated to a secure, serverless Cloudflare Worker endpoint.

1. **Client-Side Match Execution:** The frontend handles all real-time UX, visual validation, and incremental local state tracking.
1. **The Verification Payload:** Upon solving the puzzle or exhausting all attempts, the frontend must bypass direct YouTube leaderboard submission and instead dispatch an asynchronous HTTP POST request to the secure Cloudflare Worker containing:
   * The active player's Platform Identifier (`userId`).
   * The target puzzle configuration (`daySeed`).
   * The plain-text sequence of attempted words entered by the user (not the hashes).
   * The elapsed resolution time.
1. **Server-Side Re-Evaluation:** The Cloudflare Worker—running in an isolated, private server environment—performs the absolute verification audit:
   * It appends the private `VITE_DICTIONARY_SALT` (stored securely as an encrypted environment variable in Cloudflare's dashboard, completely invisible to the client) to each received plain-text word.
   * It hashes the salted strings to SHA-256 and validates their existence against the master dictionary set.
   * It re-verifies that the words explicitly contain the 3 consonants required by the active `daySeed` and checks for logical time-drift anomalies.
1. **The Score Signature Token:** If the Worker deems the match fully legitimate, it signs a short-lived cryptographic validation token. The frontend receives this token and is only then authorized to invoke `PlatformService.submitScore()` to commit the verified score to YouTube's global leaderboard.

---

## 4. Scoring & Leaderboard Architecture (Plate Mechanics)

### 4.1 The Inverse Scoring Formula
To maintain seamless compatibility with the YouTube Playables SDK Leaderboard sub-system (which natively ranks scores in ascending numeric order), the game translates word length efficiency into a high-value score integer using an inverse baseline layout:

```text
Final Score = (PLATE_SCORING_BASE_SCORE - Word_Length) + Calculated_Plate_Bonus
```

### 4.2 Plate Digit Logic & Pattern Detection

The 4 digits extracted from the license plate act as a dynamic gameplay modifier to introduce excitement and tactical risk:

1. **Sum Base Bonus**: The absolute sum of the 4 digits is calculated. If `PLATE_NUMERIC_BONUS_ENABLED` is true, this sum is multiplied by `PLATE_NUMERIC_BONUS_MULTIPLIER` and added to the score pool.
1. **Premium Plate Patterns (Jackpots)**: Before score computation, the 4-digit string is audited by a regex/pattern engine to check for structural lottery states:
    * **Capicúa (Palindrome)**: e.g., `1221`, `4334`. Triggers `PLATE_JACKPOT_PATTERN_MULTIPLIER`.
    * **Perfect Pairs**: e.g., `2244`, `1188`. Triggers standard jackpot multiplication.
    * **The Trio/Quartet**: e.g., `7772`, `0000`. High-tier score scaling.

### 4.3 Platform Submission Flow

* **Daily Reset Synch**: The `Daily Challenge` scores are submitted to a volatile daily leaderboard ID managed by YouTube. The SDK aggregates these scores into the player's lifetime historic profile automatically.
* **Failed Sessions**: If a player exhausts all `DAILY_ATTEMPTS_LIMIT` without finding a valid word, the submitted score for that dynamic day seed is strictly `0`.

---

## 5. Game Modes Layout

### 🟢 Normal Mode (Daily Sandbox Challenge)
* Global seed synchronizes the daily 3 consonants across all users globally.
* Results score outputs map directly to the YouTube Leaderboard API payloads.
* Fixed structural mechanics across the global instance ecosystem.

### 🚗 Travel Mode (Synchronous Local Party)
* The room host configures constraints. The Cloudflare worker generates an isolated 4-digit ID Room code token.
* Clients pull/push status via automated HTTP Interval Polling.
* **Audio Synchronization Feature:** The Room ID acts as a pseudo-random mathematical seed for the Web Audio API synthesizer. All players sitting in the same physical space hear the exact same procedurally generated musical arrangements on their respective hardware devices.

### 🌍 Remote Mode (Asynchronous League)
* Extended time horizons for casual play across long distances.
* **Blind Leaderboard Mechanism:** Players cannot inspect competitors' scores until they successfully submit their own single attempt score entry, preventing strategic length optimization advantages.

---

## 6. Security & Privacy Blueprint

* **Zero Personal Data Tracking:** The custom Cloudflare Worker system is completely blind to YouTube profile specifics (Handle names, user IDs, Avatars).
* **Session Aliasing:** Multiplayer features require an onboarding screen prompting the client to supply an ephemeral text Name Alias for display on the local leaderboard scoreboard.
* **Token Session Verification:** To prevent malicious score spoofing via identical nickname profiles within a single room instance, the game client instantiates a cryptographically random UUID token upon session entry. This token is packaged along with the payload data inside all Worker database operations to ensure data integrity.

---

## 7. Build Pipelines & Deployment Workflows

### Target Build Requirements
The final deployment bundle must compile directly into a single self-contained, standard standalone flat directory zipped structure (`.zip`) containing the `index.html` file alongside asset files, weighing safely under YouTube’s strict size cap limit.

### Configuration (`vite.config.ts`)
The project utilizes automated compilation middleware hook chains to guarantee hands-free deployment artifact creation.

1.  **Code Obfuscation Phase:** Uses `vite-plugin-javascript-obfuscator` to obfuscate logic files automatically on production compiles.
    * *Constraint configuration mandatory requirement:* `renameGlobals: false` must remain disabled to prevent corruption of global platform SDK entry methods belonging to `window.ytgame`.
2.  **Zip Generation Phase:** Invokes `vite-plugin-zip-pack` directly targeting the output production build folder `/dist`.

### Build Verification Workflow script execution command
```bash
# Executing this single pipeline compiles TypeScript, obfuscates structures, and creates the ready-to-upload ZIP file
npm run build
```

---

## 8. Internationalization (i18n) Architecture Blueprint

To keep the application lightweight and avoid external library overhead, the project uses a custom React Hook and strict TypeScript schema approach for translations.

### Directory Structure
* `src/i18n/locales/en.ts` - Base English dictionary object defining the ground-truth schema.
* `src/i18n/locales/es.ts` - Spanish dictionary object implementing `TranslationSchema`.
* `src/i18n/types.ts` - Explicit types exported using `typeof en`.
* `src/i18n/useTranslation.ts` - Custom hook executing language detection from `window.ytgame.system.getLanguage()` and rendering text strings with primitive variable injection (`{{variable}}`).

### Core Implementation Rules
1. Component text must NEVER be hardcoded. Always invoke the `t('namespace.key')` function.
2. The `useTranslation` hook must safe-guard missing keys by falling back to the English dictionary string equivalent before printing the path string literal.

---

## 9. Multi-Language Communication & Documentation Rules

### Language Boundaries
1. All codebase items—including variables, component logic, code comments, inline documentation, and Markdown files (`README.md`, `AI_CONTEXT.md`, `SPECS.md`, etc.)—must be written **100% in English**.
2. Conversation, prompts, and feedback with the developer may happen in **Spanish**. The system must automatically ingest Spanish feedback but output English code/documentation.

### Documentation Lifecycle
1. Documentation must never store a changelog or chronological history of modifications. It must strictly represent the **current ground-truth state** of the production code.
2. Whenever a feature or code change is validated and finalized, all relevant Markdown documents must be updated immediately to reflect the new architecture.

### Commit Messages
Every time a feature is successfully completed and documents are aligned, the system must generate a precise Git commit message using semantic commits conventions (e.g., `feat:`, `fix:`, `docs:`).

### Code Quality & Refactoring Standards
1. **No Hacks or Workarounds:** Always adhere to software engineering best practices. Avoid temporary patches, anti-patterns, or technical debt shortcuts.
2. **Modular Architecture Over Monoliths:** If a function, component, or module grows significantly in complexity, branching (deep nesting/conditionals), or line count, the system must pause and evaluate if a refactor into smaller, decoupled, and highly cohesive sub-units is necessary before applying new logic.
3. **Agile MVP Testing Strategy:** Formal testing (unit, integration, or E2E) is strictly suspended during this initial development phase to maximize agility and ease massive architectural refactors. The focus is to reach a robust Minimum Viable Product (MVP) rapidly through clean code design alone.

### Token Optimization & Communication Protocol
1. **Modular Documentation (`/doc`):** To prevent massive token consumption and unmaintainable file growth, generic and detailed technical/functional specifications must be isolated into dedicated, cohesive markdown files inside the `/doc` directory. `SPECS.md` remains the high-level orchestrator.
2. **Function as the Minimum Update Unit:** When modifying existing code, the system must avoid rewriting entire files if the changes are tightly scoped. It should output only the specific functions or blocks that changed. The developer will manually swap them.
3. **Clarification Guardrail:** If an instruction or feature request contains ambiguity, the system must pause immediately and ask a single, targeted clarification question instead of making assumptions and generating potentially wasted code.

---

## 10. Platform Provider Strategy Architecture

To support local development, a public web-review deployment on Cloudflare, and the final production deployment inside YouTube's native sandbox, all platform interactions are governed by a strict Strategy Pattern interface.

### The Interface: `PlatformService`
Every platform implementation must satisfy a shared TypeScript interface that abstracts the core functionalities of the YouTube Playables SDK (Persistence, Ads, Leaderboards, and Lifecycle):

* `initialize(): Promise<void>` -> Initializes the platform context (and triggers `ytgame.game.firstLaunchCompleted()` on YouTube).
* `saveData(key: string, data: any): Promise<void>` -> Persists player progress/state to the cloud storage (`ytgame.game.saveData`).
* `loadData(key: string): Promise<any>` -> Retrieves saved player progress from the cloud storage (`ytgame.game.loadData`).
* `submitScore(leaderboardId: string, value: number): Promise<void>` -> Submits a high score to a specific platform leaderboard (`ytgame.game.submitScore`).
* `getLanguage(): string` -> Returns the user's current platform language code (e.g., 'en', 'es', 'fr' via `ytgame.system.getLanguage()`).
* `showRewardedVideoAd(): Promise<boolean>` -> Pauses the game loop, requests a rewarded video ad (`ytgame.ads.showRewardedVideo`), and resolves true if the user watched it completely.
* `muteAudio(isMuted: boolean): void` -> Instantly mutes or unmutes all Web Audio API nodes.
* `onPause(callback: () => void): void` -> Registers a listener for when the platform forces a pause (`ytgame.system.onPause`).
* `onResume(callback: () => void): void` -> Registers a listener for when the platform resumes the action (`ytgame.system.onResume`).

### Available Strategies
1.  **Memory Strategy (`MEMORY`):** Active during local rapid prototyping. Stores state in standard JavaScript memory structures. Volatile, clean slate on reload.
2.  **Cloudflare Review Strategy (`CLOUDFLARE`):** Active for the public web review URL. Bypasses the YouTube SDK and communicates directly via HTTP `fetch` with custom Cloudflare Workers and KV storage to simulate remote user profiles and global leaderboards.
3.  **YouTube Native Strategy (`YOUTUBE`):** Active for the final production bundle. Strictly maps all interface actions directly to the official `window.ytgame` SDK payloads.

### Environment Control
The active strategy is injected at runtime through a centralized Factory pattern determined by the Vite environment config variable:
```typescript
// Example configuration mapping
const target = import.meta.env.VITE_PLATFORM_TARGET; // 'MEMORY' | 'CLOUDFLARE' | 'YOUTUBE'
```

---

## 11. YouTube Technical Quality Assurance & Compliance

To successfully pass YouTube's automated testing suite for external web previews, the codebase must strictly satisfy four core technical metrics:

### 1. Ultra-Fast Load Times & Assets Weight
* The total initial download size of the production bundle must strictly stay **below 5-10 MB** (ideally < 2MB).
* **Strict Vector Graphics Mandate:** The use of rasterized image files (PNG, JPG, BMP, WebP) is strictly prohibited across the entire codebase. All visual assets—including the game logo, UI icons, thematic backgrounds, and illustrations—must be built exclusively using structural CSS layers or lightweight, semantic SVG code embedded directly as inline React components.
* No external web fonts are allowed; system font fallbacks or Tailwind-controlled font stacks must be used.

### 2. Mandatory Responsive Fluidity (Dynamic Layouts)
* The root layout must dynamically scale to 100% of the viewport (`w-screen h-screen overflow-hidden`) without reloading the page or breaking the UI state when switching orientations (Portrait to Landscape and vice-versa).
* The UI must account for dynamic overlay shifts (e.g., YouTube's live chat or application top-bars).
* **Viewport & Input Lock:** The root `index.html` and global CSS must strictly disable browser-level intrusive mobile features. This includes blocking user-driven pinch-to-zoom (`user-scalable=no` inside the viewport meta) and preventing elastic bounce scrolling (`overscroll-behavior: none` applied to HTML/Body tags) to guarantee a native-app feel inside the YouTube sandbox.

### 3. Unified Hybrid Input (Touch + Pointer)
* All interactive components must be naturally accessible. Interaction logic must support both mouse clicks and mobile taps (`touchstart`/`touchend` or synthetic React `onClick` event wrappers) flawlessly.
* **Custom Virtual Keyboard:** To guarantee layout stability and prevent mobile OS keyboards from resizing or shifting the WebView container, the game must strictly use a custom, in-game HTML/CSS virtual keyboard for text input. 
* **Input Synchronization:** The interaction loop must support hybrid text input: capturing global desktop physical keyboard events (`keydown`) and mapping them to the same React state updated by the custom on-screen tactile buttons. Native HTML `<input>` overlays are strictly prohibited.
* **Double-Submit Mitigation:** To protect game balance against network lag or frantic user inputs (double-clicking buttons), the codebase must implement strict debouncing/throttling mechanisms. Core gameplay input actions (like keypresses on the virtual keyboard) must use timestamp-based throttling refs, and state-driven submission flows must utilize explicit `disabled` states during asynchronous processing.

### 4. Audio Lifecycle Management
* The system must implement immediate audio muting and pausing capabilities.
* The `PlatformService` interface must enforce a `muteAudio(isMuted: boolean): void` method.
* Whenever the active platform triggers a pause or background event (such as `ytgame.system.onPause`), audio generation must instantly cease.

## 12. Procedural Audio & Music Engine (Deterministic Synthesis)

To adhere to YouTube's strict asset weight restrictions, the project prohibits static audio files (MP3/WAV) for background music. It relies entirely on real-time mathematical audio synthesis via the native Web Audio API.

### 1. Deterministic Seeding (PRNG)
* All musical choices (tempo, key, chord progressions, melody patterns) must derive from a Pseudo-Random Number Generator (PRNG) driven by a specific numeric **Seed**.
* Given the same Seed, the engine must produce exactly identical musical tracks across different devices and sessions. This seed can be stored alongside game saves to allow identical playback.

### 2. Audio Engine Interface & Lifecycle
The module must expose a isolated control interface:
* `start(seed: number): void` -> Initializes the Web Audio API context, boots oscillators/gain nodes, and kicks off the infinite procedural playback loop based on the seed.
* `stop(): void` -> Instantly halts all schedules and disposes of the active audio context.
* `setMute(isMuted: boolean): void` -> Dynamically ramps gain nodes to 0 (or back to normal) to support real-time platform muting without breaking the playback timeline.

### 3. Evolutionary Scalability
* The baseline implementation will utilize simple primitive wave oscillators (Sine/Triangle) running an infinite random arpeggiator or chord drone.
* The architecture must remain fully decoupled, allowing future updates to inject complexity based on external game state parameters (e.g., speeding up BPM when the timer is low, shifting keys based on the Travel ID, or changing instruments based on the season).