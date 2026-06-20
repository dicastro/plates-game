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
  - **Normal Mode:** derived from the UTC day seed.
  - **Travel Mode:** the 4-digit Room ID — enabling all players in the same room to hear
    identical music on their individual devices.

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

## 5. Lifecycle Integration

- `App.tsx` registers `platform.onPause(() => audio.setMute(true))` and
  `platform.onResume(() => audio.setMute(false))` on mount.
- `audio.stop()` is called in the `useEffect` cleanup to guarantee disposal on unmount.

## 6. Evolutionary Scalability

The engine is intentionally decoupled from game state. Future extensions may inject:
- BPM acceleration when the round timer is low.
- Key/instrument shifts based on the active game mode or season.
- Harmonic chord layers for Travel Mode rooms.

## 7. Settings Persistence & Autoplay Constraint

- `audio.enabled` is a normal persisted player setting, stored in the same `saveData()`
  envelope as other preferences. Default `false` when no save data exists (first launch).
- Once a player opts in, the preference persists across sessions via the standard
  `PlatformService.saveData()`/`loadData()` flow — no special-casing required.
- Per Playables best practices, the game should expose volume/mute controls (HUD), not a
  one-time-only consent flow.
- **Browser autoplay policy** (Chromium/Web Audio API, not a YouTube-specific rule) blocks
  `AudioContext` playback without a prior user gesture. This means even with
  `audio.enabled: true` loaded from a save, actual playback cannot start automatically on
  Splash or Home mount — it starts on the player's first tap/interaction.
- No ambient/menu audio architecture exists yet (Splash and Home are currently silent).
  Seed-driven music is only defined for in-game contexts (§2).