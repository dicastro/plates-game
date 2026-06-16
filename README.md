# Project: Consonant Word Challenge (Working Title)

An engaging, lightweight, and linguistically inclusive word puzzle game built specifically for the **YouTube Playables** platform. 

The core game mechanic revolves around a daily challenge: players are given a specific combination of 3 consonants and must find the shortest valid word that contains all three of them.

## 🌟 Key Features

* **Daily Global Challenge:** Every player worldwide faces the same 3-consonant combination each day, aiming for the leaderboards.
* **Multi-Language Support:** The user interface and the game vocabulary dictionaries are completely decoupled. You can play in English using a Spanish dictionary, or vice versa.
* **Safe & Secure Vocabulary Validation:** To prevent cheating via automated scripts or client-side reverse engineering, the game utilizes an ultra-compressed **SHA-256 Hash Dictionary** architecture.
* **Social & Group Play:** Includes specialized multiplayer modes designed for instant local fun or casual asynchronous competition with friends, with zero onboarding friction.
* **Immersive & Dynamic Sound:** Features adaptive soundtrack loops generated directly via the native browser **Web Audio API** that respond dynamically to game time constraints and themes.

## 🛠️ Tech Stack & Philosophy

* **Frontend:** React, TypeScript, Vite, Tailwind CSS.
* **Hosting & Serverless Compute:** Cloudflare Pages + Cloudflare Workers + Cloudflare KV.
* **Platform Abstraction:** Architecture driven by the **Strategy Pattern** to decouple core game logic from backend platform implementations.
* **Target Delivery:** Dual-target builds. Capable of running as a standard public web application (hosted on Cloudflare for external review and onboarding) or compiling into a self-contained HTML5 ZIP package for the native **YouTube Playables SDK**.
* **Architecture Goal:** 100% Serverless, Infinite Scalability, 0€ Infrastructure Maintenance Cost.

---

License: Private / Proprietary. Developed by Diego Castro Viadero.