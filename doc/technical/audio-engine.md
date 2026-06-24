# Procedural Audio Engine

## 1. Architecture Constraints

- Static audio files (MP3/WAV/OGG) are strictly banned.
- All audio is synthesized in real-time via the native browser **Web Audio API**.
- `AudioContext` must be fully disposed and closed on component unmount to prevent memory
  leaks during HMR cycles.

## 2. Deterministic Seeding (PRNG)

- All musical decisions (tempo, key, chord progressions, melody) derive from a
  Linear Congruential Generator (LCG) driven by a numeric **seed**.
- Given the same seed, the engine produces **identical output** across all devices and sessions.
- Seed sources by mode:
  - **Home / menu (ambient):** `HOME_AMBIENT_SEED`, a fixed placeholder constant.
  - **Normal Mode:** derived from the day's `daySeed` (not yet implemented).
  - **Travel Mode:** the room ID — enabling all players in the same room to hear identical
    music on their individual devices (not yet implemented).

## 3. Public Interface

Exposed by `ProceduralAudioEngine`:

| Method | Description |
|---|---|
| `start(seed: number): void` | Initializes `AudioContext`, boots oscillators/gain nodes, starts the infinite playback loop. |
| `stop(): void` | Halts all scheduled notes and closes/disposes the `AudioContext`. |
| `setMute(isMuted: boolean): void` | Ramps the master gain to `0` or `0.15` over 100ms. Does not break the playback timeline. |

## 4. Implementation Details

- **PRNG:** LCG (`s = (1664525 * s + 1013904223) >>> 0`).
- **Note pool:** C4–B4 diatonic scale (7 frequencies).
- **Scheduler:** 200ms lookahead window, 100ms polling interval via `setTimeout`.
- **Oscillator types:** `sine` / `triangle` — selected randomly per note.
- **Envelope:** attack 20ms, exponential decay to silence.
- **Tempo:** `BPM_BASE = 90`, note grid at `0.5 * BEAT_SEC`.

## 5. Runtime Audio State — `AudioRuntimeContext`

`isPlaying` is **runtime-only state, never persisted**. It always starts `false` on every
load/reload, regardless of the player's last HUD toggle state, due to the browser autoplay
policy (`AudioContext` requires a prior user gesture on every page load — this is a permanent
browser constraint, unrelated to any backend or session). See
`doc/technical/state-architecture.md` for why this context's naming reflects that distinction.

`AudioRuntimeContext` is the **only** component allowed to call `audioEngine.start()/stop()`.
It tracks:
- `wantsAudio` — whether the player has toggled the HUD mute control to "on".
- `pausedByVisibility` — whether the tab is currently backgrounded (Page Visibility API).
- `lastSeedRef` — the seed to resume with once playback is allowed again.

`play(seed)` starts the engine immediately unless the tab is backgrounded; otherwise it
records intent and starts when the tab regains visibility.

## 6. Triggering Playback — User Gesture Requirement

- Splash and Home mount **silent** — `AudioRuntimeContext` never calls `play()` on mount.
- The first real trigger in the app is `HomeScreen`'s "Play" button, which calls
  `useAudio().ensurePlayback()` on click — a confirmed user gesture.
- `useAudio()` (`src/audio/useAudio.ts`) is the only audio entry point UI components use.

## 7. Lifecycle Integration

- `PlatformService.onPause`/`onResume` wrap the standard Page Visibility API (tab
  backgrounded/foregrounded). `AudioRuntimeContext` subscribes to stop/resume playback
  accordingly.
- `audioEngine.stop()` is invoked when the tab is backgrounded; disposal on component unmount
  is guaranteed by the engine's own `stop()` implementation.

## 8. Evolutionary Scalability

The engine is intentionally decoupled from game state. Future extensions may inject:
- BPM acceleration when a round timer is low (Travel Mode).
- Key/instrument shifts based on the active game mode or season.
- Separate music/SFX channels and volume sliders (Settings overlay).

## 9. Device Volume

No JavaScript API exists to read the OS/device volume level. Web Audio output already
passes through the system's audio pipeline, which the OS scales automatically. No code is
needed for this beyond what already exists.