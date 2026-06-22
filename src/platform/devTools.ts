/**
 * Installs window-level debug hooks for simulating platform-originated events
 * (pause/resume/system audio change) outside of the real YouTube SDK. Used by
 * any non-YOUTUBE strategy that needs to exercise the same event-driven
 * contract — MemoryPlatform today; CloudflarePlatform when implemented.
 */
export interface DevSimulationHandlers {
  triggerPause: () => void;
  triggerResume: () => void;
  triggerAudioChange: (enabled: boolean) => void;
}

export function installDevSimulationHooks(handlers: DevSimulationHandlers): void {
  const w = window as unknown as Record<string, unknown>;
  w["__SIMULATE_YT_PAUSE__"] = handlers.triggerPause;
  w["__SIMULATE_YT_RESUME__"] = handlers.triggerResume;
  w["__SIMULATE_YT_AUDIO_CHANGE__"] = handlers.triggerAudioChange;
}