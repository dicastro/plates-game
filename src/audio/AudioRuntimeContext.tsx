import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { audioEngine } from "./audioEngineInstance";
import { platformService } from "../platform/platformServiceInstance";

/**
 * Runtime-only audio state. NEVER persisted — isPlaying always resets to
 * false on reload regardless of the player's saved preference, due to the
 * browser autoplay policy (AudioContext requires a prior user gesture).
 *
 * This context is the ONLY place that calls audioEngine.start()/stop(). It
 * also owns compliance with two distinct Playables SDK signals:
 *  - onPause/onResume: platform-forced execution pause — fully stops/restarts
 *    the engine, independent of the player's own intent.
 *  - onSystemAudioChange: YouTube/device-level mute — silences playback but
 *    never overrides what the player actually wanted once audio is re-enabled.
 *
 * UI components never touch audioEngine or this context directly — they go
 * through useAudio() (see useAudio.ts).
 */
interface AudioRuntimeContextValue {
  isPlaying: boolean;
  play: (seed: number) => void;
  stop: () => void;
}

const AudioRuntimeContext = createContext<AudioRuntimeContextValue | null>(null);

export function AudioRuntimeProvider({ children }: { children: ReactNode }) {
  const [isPlaying, setIsPlaying] = useState(false);

  // Player's actual intent — independent of forced platform pause/mute.
  const wantsAudioRef = useRef(false);
  const pausedByPlatformRef = useRef(false);
  const lastSeedRef = useRef<number | null>(null);

  function play(seed: number) {
    wantsAudioRef.current = true;
    lastSeedRef.current = seed;

    if (pausedByPlatformRef.current || !platformService.isSystemAudioEnabled()) {
      // Will start once the platform allows it (see onResume / onSystemAudioChange below).
      return;
    }

    audioEngine.start(seed);
    setIsPlaying(true);
  }

  function stop() {
    wantsAudioRef.current = false;
    audioEngine.stop();
    setIsPlaying(false);
  }

  useEffect(() => {
    platformService.onPause(() => {
      pausedByPlatformRef.current = true;
      audioEngine.stop();
      setIsPlaying(false);
    });

    platformService.onResume(() => {
      pausedByPlatformRef.current = false;
      if (wantsAudioRef.current && lastSeedRef.current !== null && platformService.isSystemAudioEnabled()) {
        audioEngine.start(lastSeedRef.current);
        setIsPlaying(true);
      }
    });

    platformService.onSystemAudioChange((enabled) => {
      if (!enabled) {
        audioEngine.stop();
        setIsPlaying(false);
        return;
      }
      // Restore exactly what the player wanted before — never force playback
      // that wasn't already the player's intent.
      if (wantsAudioRef.current && !pausedByPlatformRef.current && lastSeedRef.current !== null) {
        audioEngine.start(lastSeedRef.current);
        setIsPlaying(true);
      }
    });
  }, []);

  return (
    <AudioRuntimeContext.Provider value={{ isPlaying, play, stop }}>
      {children}
    </AudioRuntimeContext.Provider>
  );
}

export function useAudioRuntime(): AudioRuntimeContextValue {
  const ctx = useContext(AudioRuntimeContext);
  if (!ctx) throw new Error("useAudioRuntime must be used within an AudioRuntimeProvider");
  return ctx;
}