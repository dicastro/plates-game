import { useAudioRuntime } from "./AudioRuntimeContext";
import { HOME_AMBIENT_SEED } from "./audioConstants";

export function useAudio() {
  const { isPlaying, isMuted, toggleMute, play } = useAudioRuntime();

  function ensurePlayback(): void {
    if (!isPlaying) play(HOME_AMBIENT_SEED);
  }

  return { isPlaying, isMuted, toggleMute, ensurePlayback };
}