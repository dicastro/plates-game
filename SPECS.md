# Project Specifications: Consonant Word Challenge

This specification document outlines the technical stack, state configuration, workflows, and core architecture of the application. All placeholders marked with `[DEFINE_VALUE]` represent configuration variables awaiting final numerical tunings.

---

## 1. System Constants & Placeholders (Configuration)

The following variables must be easily modifiable via a centralized `config.ts` file:

### General Game Variables
* `DAILY_ATTEMPTS_LIMIT`: `[DEFINE_VALUE]` (e.g., 5) - Maximum word entry attempts allowed per day in Normal Mode.
* `MAX_STORAGE_TRIPS_HISTORIC`: `[DEFINE_VALUE]` (e.g., 30) - Max number of historical travel/remote sessions stored in user Cloudflare KV / YouTube data to fit within constraints.

### Mode: Travel Mode Settings
* `TRAVEL_MAX_CONSONANTS`: `[DEFINE_VALUE]` (e.g., 4) - Maximum allowed consonants chosen by the creator.
* `TRAVEL_MIN_CONSONANTS`: `[DEFINE_VALUE]` (e.g., 3) - Minimum allowed consonants chosen by the creator.
* `TRAVEL_COUNTDOWN_SECONDS`: `[DEFINE_VALUE]` (e.g., 60) - Strict countdown timer per turn for instant synchronous tension.
* `TRAVEL_ATTEMPTS_LIMIT`: 1 (Fixed) - Only one single attempt is allowed.
* `TRAVEL_KV_TTL_SECONDS`: `[DEFINE_VALUE]` (e.g., 10800) - Time To Live for the room in Cloudflare KV before auto-deletion (e.g., 3 hours).

### Mode: Remote Mode Settings
* `REMOTE_TIME_WINDOW_HOURS`: `[DEFINE_VALUE]` (e.g., 24) - Time limit window allowed for players to submit their scores.
* `REMOTE_ATTEMPTS_LIMIT`: 1 (Fixed) - Only one single attempt allowed.
* `REMOTE_KV_TTL_SECONDS`: `[DEFINE_VALUE]` (e.g., 172800) - Time To Live for asynchronous rooms in Cloudflare KV (e.g., 48 hours).

---

## 2. Technical Stack & Architecture

### Frontend
* **Framework:** React 19 (Functional components, Hooks).
* **Language:** TypeScript (Strict typing enabled).
* **Build Tool:** Vite.
* **CSS Style Engine:** Tailwind CSS.
* **Routing:** Single Page Application (SPA) virtual hash routing (`#/`, `#/travel`). Native page-reloads are prohibited to preserve the YouTube SDK runtime lifecycle.

### External / Edge Backend
* **Static Asset Delivery:** Cloudflare Pages (Hosts the bundled assets and the pre-computed compressed dictionary hash files under-demand).
* **Micro-Services:** Cloudflare Workers (Intercepts `POST` requests for multiplayer sessions).
* **Transient Storage:** Cloudflare KV (Stores short-term JSON strings mapped to unique 4-digit room tokens).

---

## 3. Data Dictionary Validation Engine (Anti-Cheat)

### Dictionary Structural Format
Dictionaries are precompiled offline from plaintext lexical sources into binary or linear arrays of hex string segments representing the **SHA-256** checksum signature of each word.
* Example raw array output layout: `["8bc2...", "1a4f...", "f5a2..."]`
* Files are served over gzip/brotli encryption standards via Cloudflare CDN.

### Validation Flow Architecture
1.  User enters text string (e.g., `"Canto"`).
2.  System extracts plain length integer metrics (`string.length`).
3.  System checks if the text string explicitly contains the active day's 3-consonant variables.
4.  System hashes the clean string conversion to SHA-256 lowercase.
5.  System runs a lookup query: `DictionarySet.has(userHash)`.

---

## 4. Game Modes Layout

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

## 5. Security & Privacy Blueprint

* **Zero Personal Data Tracking:** The custom Cloudflare Worker system is completely blind to YouTube profile specifics (Handle names, user IDs, Avatars).
* **Session Aliasing:** Multiplayer features require an onboarding screen prompting the client to supply an ephemeral text Name Alias for display on the local leaderboard scoreboard.
* **Token Session Verification:** To prevent malicious score spoofing via identical nickname profiles within a single room instance, the game client instantiates a cryptographically random UUID token upon session entry. This token is packaged along with the payload data inside all Worker database operations to ensure data integrity.

---

## 6. Build Pipelines & Deployment Workflows

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