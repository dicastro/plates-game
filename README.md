# PLATES - The Ultimate License Plate Word Game

An engaging, lightweight, and linguistically inclusive word puzzle game built specifically for the **YouTube Playables** platform. 

The core game mechanic revolves around a daily challenge: players are given a specific combination of 3 consonants and must find the shortest valid word that contains all three of them.

## 🌟 Key Features

* **Daily Global Challenge:** Every player worldwide faces the same 3-consonant combination each day, aiming for the leaderboards with synchronized global resets.
* **Multi-Language Support:** The user interface and the game vocabulary dictionaries are completely decoupled. You can play in English using a Spanish dictionary, or vice versa.
* **Safe & Secure Vocabulary Validation:** To prevent cheating via automated scripts or client-side reverse engineering, the game utilizes an ultra-compressed **SHA-256 Hash Dictionary** architecture.
* **Social & Group Play:** Includes specialized multiplayer modes designed for instant local fun or casual asynchronous competition with friends, with zero onboarding friction.
* **Immersive & Dynamic Sound:** Features adaptive soundtrack loops generated directly via the native browser **Web Audio API** that respond dynamically to game time constraints and themes.

## 🛠️ Tech Stack & Philosophy

* **Frontend:** React, TypeScript, Vite, Tailwind CSS.
* **Hosting & Serverless Compute:** Cloudflare Pages + Cloudflare Workers + Cloudflare KV.
* **Platform Abstraction:** Architecture driven by the **Strategy Pattern** to decouple core game logic from backend platform implementations (`MemoryPlatform` vs `YouTubePlatform`).
* **Graphics Infrastructure:** 100% Vectorial UI via inline structural SVGs and dynamic Tailwind CSS layers. Strict zero-rasterized assets policy (No PNG/JPG/WebP) to minimize bundle size.
* **Audio Infrastructure:** Real-time mathematical music synthesis driven by deterministic Seeds. Zero static audio-file bandwidth policy.
* **Target Delivery:** Dual-target builds. Capable of running as a standard public web application (hosted on Cloudflare for external review and onboarding) or compiling into a self-contained HTML5 ZIP package for the native **YouTube Playables SDK**.
* **Architecture Goal:** 100% Serverless, Infinite Scalability, 0€ Infrastructure Maintenance Cost.

---

## 🚀 Local Development

```bash
# 1. Install dependencies
npm install

# 2. Run local development environment (Uses MEMORY strategy)
npm run dev

# 3. Compile, obfuscate and ZIP code for production
npm run build
```

## 🧪 Local QA Debugging Functions

While running the development environment (`VITE_PLATFORM_TARGET=MEMORY`), you can emulate platform-level triggers and lifecycle events directly from your browser's developer console (F12) to audit defensive programming mechanisms:

* `__SIMULATE_YT_PAUSE()`: Simulates the YouTube application minimizing or triggering an interruption, instantly engaging audio-muting loops.
* `__SIMULATE_YT_RESUME()`: Simulates the player returning focus to the active game viewport.
* Shifting browser tabs will also trigger automatic lifecycle muting via the Page Visibility API.

---

License: Private / Proprietary. Developed by Diego Castro Viadero.