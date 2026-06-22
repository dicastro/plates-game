// src/player/PlayerDataContext.tsx
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { platformService } from "../platform/platformServiceInstance";

/**
 * Single source of truth for the player's PERSISTED data blob.
 *
 * YouTube's saveData()/loadData() is atomic — there is no partial read/write.
 * This context is therefore the ONLY place allowed to call saveData().
 *
 * Intentionally empty for now. There is no audio on/off preference — the
 * only platform-level audio control is YouTube's own mute button, handled
 * entirely by AudioRuntimeContext. Future persisted domains (e.g. volume,
 * daily attempts ledger, lastSeenVersion) get added here, each with its own
 * domain-specific setter, following the same pattern as below.
 */
export interface PlayerData {
  // empty — no fields yet
}

const DEFAULT_PLAYER_DATA: PlayerData = {};

interface PlayerDataContextValue {
  data: PlayerData;
  isLoaded: boolean;
  /** Called once by SplashScreen. Owns the load + default-merge logic internally. */
  load: () => Promise<void>;
}

const PlayerDataContext = createContext<PlayerDataContextValue | null>(null);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function mergeWithDefaults(loaded: unknown): PlayerData {
  if (!isRecord(loaded)) return DEFAULT_PLAYER_DATA;
  return { ...DEFAULT_PLAYER_DATA };
}

export function PlayerDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<PlayerData>(DEFAULT_PLAYER_DATA);
  const [isLoaded, setIsLoaded] = useState(false);
  const dataRef = useRef(data);
  dataRef.current = data;

  async function load(): Promise<void> {
    const loaded = await platformService.loadData();
    const next = mergeWithDefaults(loaded);
    dataRef.current = next;
    setData(next);
    setIsLoaded(true);
  }

  useEffect(() => {
    // Playables integration requirements: game SHOULD save user progress
    // when onPause occurs. No persisted field exists yet, but the pipeline
    // is wired now — this always flushes whatever PlayerData currently
    // holds, so future domains are covered automatically.
    platformService.onPause(() => {
      void platformService.saveData(dataRef.current);
    });
  }, []);

  return (
    <PlayerDataContext.Provider value={{ data, isLoaded, load }}>
      {children}
    </PlayerDataContext.Provider>
  );
}

export function usePlayerData(): PlayerDataContextValue {
  const ctx = useContext(PlayerDataContext);
  if (!ctx) throw new Error("usePlayerData must be used within a PlayerDataProvider");
  return ctx;
}