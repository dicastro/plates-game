# AI Context & Project History

This document serves as the historical context and architectural alignment for any AI Assistant contributing to this project. It encapsulates the core decisions made during the system design phase.

## 🧠 Project Background & Intent
The developer is a Senior Java Backend Programmer building a specialized HTML5 client-side word puzzle game for YouTube Playables. Because the developer is a backend expert, the frontend layout (HTML, CSS, SVG) and specific client-side mathematics will be heavily assisted by AI generation.

## ⚔️ The Core Anti-Cheat Problem & Solution
* **The Risk:** Since the game rewards finding the *shortest* word, exposing a plain-text dictionary array in the JavaScript bundle would make it trivial for any user to write a browser script to scrape the file, sort by length, and automate a perfect score.
* **The Blueprint:** We do **not** store words. We store pre-computed **SHA-256 hashes** of the valid words. When a user submits a word, the frontend hashes it locally and checks if that hash exists in the pre-compiled Set. Word length is calculated directly from the user's plain-text input string before hashing. This protects intellectual property and integrity at 0 bytes of database lookups.

## 🧭 Architectural Constraints & Discoveries
1.  **YouTube Playables Sandbox:** The game runs inside an iframe. Standard storage APIs (`localStorage`, `IndexedDB`, Cookies) and standard visibility triggers (`document.hidden`) are strictly banned or restricted. We **must exclusively** use the native YouTube SDK (`ytgame.game.saveData`, `loadData`, `system.onPause`, `onResume`).
2.  **Network Boundaries:** YouTube enforces a strict Content Security Policy (CSP). External dictionary asset downloads must be white-listed in the Google developer console.
3.  **No Traditional Backend:** The project deliberately avoids standard relational databases, VPS hosting, or dedicated API servers to maintain **0€ infrastructure costs**. Cloudflare Pages (Frontend) and Cloudflare Workers + Key-Value Storage (Edge Compute) handle all dynamic behaviors.
4.  **Geographic & Review Restrictions:** As of 2026, YouTube Playables is not natively accessible in certain regions (including Spain). To apply for official inclusion, Google requires a fully testable public web URL. 
5.  **Environment Decoupling:** The codebase must never perform direct, hardcoded platform checks inside UI components. All platform capabilities (Save Data, Load Data, Leaderboards) are strictly abstracted behind a Strategy Pattern interface.

## 🎼 The Audio Engine Choice
Instead of packing heavy `.mp3` files that bloat the initial `.zip` submission limit, or using traditional asset streaming, the game explores procedural audio generation. We use the browser's native **Web Audio API** to synthesize retro/minimalist chip-tune waveforms on the fly. This enables mathematical sound modulation (e.g., speeding up the music when the timer is low) and allows game seeds to perfectly synchronize identical tracks across different devices.