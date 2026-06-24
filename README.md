# PLATES - The License Plate Word Game

A word puzzle game where players are given 3 consonants extracted from a license plate and
must find the **shortest valid word** that contains all three, in the right order. Shorter
words score higher. Scores accumulate across days into a persistent per-language leaderboard.

## 🌟 Key Features

* **Daily Global Challenge:** every player worldwide faces the same 3-consonant combination
  each day, with a synchronized global reset.
* **Independent Per-Language Editions:** the UI and the game dictionary are decoupled — you
  can play with an English interface against the Spanish dictionary, or vice versa. Each
  dictionary/plate language is a fully separate game with its own leaderboard.
* **Server-Side Validation & Scoring:** the dictionary, the daily plate sequence, word
  validation, and scoring all live exclusively in a Cloudflare Worker — never shipped to the
  client, in any form.
* **Social & Group Play:** Travel Mode (real-time, same-room) and Remote Mode (asynchronous,
  between friends), both backed by Cloudflare Durable Objects.
* **Account-Based Identity:** sign in with Google (more providers planned) to keep your score
  and streak across devices. No persistent player data is ever stored in the browser.
* **Immersive & Dynamic Sound:** adaptive soundtrack generated via the native browser
  **Web Audio API**.
* **Built to Share:** every result/challenge link renders a dynamic preview card (score,
  plate, dare-a-friend text) when shared on social platforms.

## 🛠️ Tech Stack & Philosophy

* **Frontend:** React, TypeScript, Vite, Tailwind CSS.
* **Backend:** Cloudflare Workers (game authority, OAuth) + Durable Objects (per-player and
  per-room state) + D1 (queryable leaderboard projection).
* **Platform Abstraction:** Strategy Pattern (`PlatformService`) decoupling game logic from
  backend implementation — `MemoryPlatform` (local dev, mocked) vs `CloudflarePlatform`
  (production).
* **Graphics:** 100% vectorial UI via inline SVG and Tailwind. Zero rasterized assets.
* **Audio:** real-time procedural synthesis driven by deterministic seeds. Zero static audio
  files.
* **Monetization:** ad engine via a `AdProvider` strategy interface, provider-agnostic.
* **Architecture Goal:** serverless, scalable, low infrastructure cost.

---

## 🚀 Local Development

```bash
# 1. Install dependencies
npm install

# 2. Run local development environment (Uses MEMORY strategy — no real backend)
npm run dev

# 3. Build for production (Cloudflare)
npm run build
```

## 🧪 Local QA Debugging Functions

While running the development environment, you can emulate backend/lifecycle behavior from
the browser console (F12):

* `__SIMULATE_DATE_OFFSET__(days)`: shifts the cosmetic date used by the Theme system
  forward, for testing seasonal themes/badges without waiting for the real calendar date.

---

License: Private / Proprietary. Developed by Diego Castro Viadero.