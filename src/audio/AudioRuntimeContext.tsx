import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { audioEngine } from "./audioEngineInstance";
import { platformService } from "../platform/platformServiceInstance";

/**
 * Runtime-only audio state. NEVER persisted — isPlaying always resets to
 * false on reload regardless of the player's last HUD toggle, due to the
 * browser autoplay policy (AudioContext requires a prior user gesture).
 *
 * This context is the ONLY place that calls audioEngine.start()/stop()/setMute().
 * It also owns the mute toggle exposed in the persistent HUD, and reacts to
 * tab visibility (PlatformService.onPause/onResume, backed by the Page
 * Visibility API) to stop/resume playback when the tab is backgrounded.
 *
 * UI components never touch audioEngine or this context directly — they go
 * through useAudio() (see useAudio.ts).
 */
interface AudioRuntimeContextValue {
  isPlaying: boolean;
  isMuted: boolean;
  toggleMute: () => void;
  play: (seed: number) => void;
  stop: () => void;
}

const AudioRuntimeContext = createContext<AudioRuntimeContextValue | null>(null);

export function AudioRuntimeProvider({ children }: { children: ReactNode }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const wantsAudioRef = useRef(false);
  const pausedByVisibilityRef = useRef(false);
  const lastSeedRef = useRef<number | null>(null);
  const isMutedRef = useRef(false); // mirrors isMuted synchronously, for use inside callbacks registered once

  function play(seed: number) {
    wantsAudioRef.current = true;
    lastSeedRef.current = seed;

    if (pausedByVisibilityRef.current) return;

    audioEngine.start(seed);
    audioEngine.setMute(isMutedRef.current);
    setIsPlaying(true);
  }

  function stop() {
    wantsAudioRef.current = false;
    audioEngine.stop();
    setIsPlaying(false);
  }

  function toggleMute() {
    const next = !isMuted;
    isMutedRef.current = next;
    setIsMuted(next);
    audioEngine.setMute(next);
  }

  useEffect(() => {
    platformService.onPause(() => {
      pausedByVisibilityRef.current = true;
      audioEngine.stop();
      setIsPlaying(false);
    });

    platformService.onResume(() => {
      pausedByVisibilityRef.current = false;
      if (wantsAudioRef.current && lastSeedRef.current !== null) {
        audioEngine.start(lastSeedRef.current);
        audioEngine.setMute(isMutedRef.current); // re-apply mute state lost on engine restart
        setIsPlaying(true);
      }
    });
  }, []);

  return (
    <AudioRuntimeContext.Provider value={{ isPlaying, isMuted, toggleMute, play, stop }}>
      {children}
    </AudioRuntimeContext.Provider>
  );
}

export function useAudioRuntime(): AudioRuntimeContextValue {
  const ctx = useContext(AudioRuntimeContext);
  if (!ctx) throw new Error("useAudioRuntime must be used within an AudioRuntimeProvider");
  return ctx;
}