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
  - **Home / menu (ambient):** `HOME_AMBIENT_SEED`, a fixed placeholder constant
    (`src/audio/audioConstants.ts`). No music-personalization design has been decided
    yet — this exists only so ambient playback is real audio, not a stub.
  - **Normal Mode:** derived from the UTC day seed (not yet implemented).
  - **Travel Mode:** the 4-digit Room ID — enabling all players in the same room to hear
    identical music on their individual devices (not yet implemented).

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

## 5. No In-Game Mute Button — Playables Design Requirement

Per the official [Playables integration requirements](https://developers.google.com/youtube/gaming/playables/certification/requirements_integration):

> Game SHOULD NOT show an overall mute button within the game itself; allow users to rely
> on the YouTube-level features for this. Game MAY have separate granular audio controls
> in the game, such as for music and sound effects, but they MUST follow all other audio
> control requirements.

Consequently, **`PersistentHUD` has no mute/unmute button**. The only audio-related UI will
be granular volume controls inside the future Settings overlay (music/SFX sliders) — never
an overall mute toggle. There is no persisted `audio.enabled` preference: the only platform-
level on/off authority is YouTube's own mute button, surfaced via `isSystemAudioEnabled()` /
`onSystemAudioChange()` (see §6 and `doc/technical/platform-strategy.md`).

## 6. Runtime Audio State — `AudioRuntimeContext`

`isPlaying` is **runtime-only state, never persisted**. It always starts `false` on every
load/reload, regardless of any future saved preference, due to the browser autoplay policy
(`AudioContext` requires a prior user gesture). See `doc/technical/state-architecture.md`
for the general persisted-vs-runtime pattern this follows.

`AudioRuntimeContext` is the **only** component allowed to call `audioEngine.start()/stop()`.
It owns compliance with two distinct, independent Playables SDK signals — conflating them
was an earlier implementation mistake, now corrected:

| Signal | SDK source | Meaning | Effect |
|---|---|---|---|
| Pause / Resume | `onPause` / `onResume` | Platform-forced execution pause (ads, app backgrounding, etc.) | Fully stops/restarts the engine, independent of player intent |
| System audio change | `isSystemAudioEnabled()` / `onSystemAudioChange()` | YouTube/device-level mute | Silences playback without erasing the player's intent — restores exactly what was wanted once unmuted |

Internal state tracked by `AudioRuntimeContext`:
- `wantsAudioRef` — whether the player has actually requested audio (set by `play()`/`stop()`).
- `pausedByPlatformRef` — whether a platform-forced pause is currently active.
- `lastSeedRef` — the seed to resume with once playback is allowed again.

`play(seed)` only starts the engine immediately if not platform-paused and
`isSystemAudioEnabled()` is `true`; otherwise it records intent and starts later when
`onResume`/`onSystemAudioChange(true)` fires.

## 7. Triggering Playback — User Gesture Requirement

- Splash and Home mount **silent** — `AudioRuntimeContext` never calls `play()` on mount.
- The first real trigger in the app is `HomeScreen`'s "Play" button, which calls
  `useAudio().ensurePlayback()` on click — a confirmed user gesture, valid on any platform
  including `YOUTUBE`.
- `useAudio()` (`src/audio/useAudio.ts`) is the only audio entry point UI components use.
  It currently exposes `{ isPlaying, ensurePlayback }`. It will grow as Settings (volume)
  and `GameEngine` (mode-specific seeds) are implemented.

## 8. Lifecycle Integration

- `onPause`/`onResume`/`onSystemAudioChange` are registered once inside
  `AudioRuntimeProvider`, via `PlatformService`. They are multi-subscriber by design (the
  underlying callback arrays already support multiple listeners) — `PlayerDataContext` also
  subscribes to `onPause` independently to flush persisted data (see
  `doc/technical/state-architecture.md`).
- `audioEngine.stop()` is invoked on platform pause; disposal on component unmount is
  guaranteed by the engine's own `stop()` implementation.

## 9. Evolutionary Scalability

The engine is intentionally decoupled from game state. Future extensions may inject:
- BPM acceleration when the round timer is low.
- Key/instrument shifts based on the active game mode or season.
- Harmonic chord layers for Travel Mode rooms.
- Separate music/SFX channels and volume controls (Settings overlay) — see §5.

## 10. Device Volume

No JavaScript API exists to read the OS/device volume level. Web Audio output already
passes through the system's audio pipeline, which the OS scales automatically. The
requirement to "respect the device's main volume control" is satisfied by default — the
engine must simply avoid any internal gain normalization that would fight it. No code is
needed for this beyond what already exists.