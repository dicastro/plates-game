// src/audio/useAudio.ts
import { useAudioRuntime } from "./AudioRuntimeContext";
import { HOME_AMBIENT_SEED } from "./audioConstants";

/** Call on any confirmed user gesture (e.g. pressing "Play") to start ambient audio. */
export function useAudio() {
  const { isPlaying, play } = useAudioRuntime();

  function ensurePlayback(): void {
    if (!isPlaying) play(HOME_AMBIENT_SEED);
  }

  return { isPlaying, ensurePlayback };
}