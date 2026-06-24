import { createContext, useContext, useState, type ReactNode } from "react";
import { platformService } from "../platform/platformServiceInstance";
import type { PlayerProfile } from "../platform/PlatformService";

interface PlayerSessionContextValue {
  player: PlayerProfile | null;
  isLoaded: boolean;
  /** Called once by SplashScreen. Resolves the player profile if a valid session exists. */
  initialize: () => Promise<PlayerProfile | null>;
  /** Applied after any Worker response carrying an updated player snapshot
   *  (e.g. enterNormalMode, submitAttempt). The Worker is always the source
   *  of truth — this never computes or merges anything locally. */
  updatePlayer: (player: PlayerProfile) => void;
}

const PlayerSessionContext = createContext<PlayerSessionContextValue | null>(null);

export function PlayerSessionProvider({ children }: { children: ReactNode }) {
  const [player, setPlayer] = useState<PlayerProfile | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  async function initialize(): Promise<PlayerProfile | null> {
    const profile = await platformService.initialize();
    setPlayer(profile);
    setIsLoaded(true);
    return profile;
  }

  function updatePlayer(next: PlayerProfile): void {
    setPlayer(next);
  }

  return (
    <PlayerSessionContext.Provider value={{ player, isLoaded, initialize, updatePlayer }}>
      {children}
    </PlayerSessionContext.Provider>
  );
}

export function usePlayerSession(): PlayerSessionContextValue {
  const ctx = useContext(PlayerSessionContext);
  if (!ctx) throw new Error("usePlayerSession must be used within a PlayerSessionProvider");
  return ctx;
}