import { createContext, useContext, useState, useRef, useCallback, type ReactNode } from "react";
import { platformService } from "../platform/platformServiceInstance";
import type { PlayerProfile } from "../platform/PlatformService";
import { DICT_TARGET_LANG } from "../config/locale";

interface PlayerSessionContextValue {
  player: PlayerProfile | null;
  isLoaded: boolean;
  /** Idempotent: returns the cached player if already resolved, otherwise
   *  performs the one-time session check. Safe to call from multiple
   *  places (HomeScreen on mount, a "Play" click, etc.) without firing
   *  redundant requests — concurrent callers share the same in-flight
   *  promise. */
  initialize: () => Promise<PlayerProfile | null>;
  updatePlayer: (player: PlayerProfile) => void;
}

const PlayerSessionContext = createContext<PlayerSessionContextValue | null>(null);

export function PlayerSessionProvider({ children }: { children: ReactNode }) {
  const [player, setPlayer] = useState<PlayerProfile | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Refs mirror the state above so initialize()/updatePlayer() can read the
  // latest value without closing over `player`/`isLoaded` — that's what lets
  // useCallback keep a permanently stable identity below, instead of a new
  // function on every state change (the actual cause of the /normal/enter
  // infinite loop: an unstable callback in an effect's dependency array
  // re-fires the effect every time the callback's identity changes).
  const playerRef = useRef<PlayerProfile | null>(null);
  const isLoadedRef = useRef(false);
  const inFlightRef = useRef<Promise<PlayerProfile | null> | null>(null);

  const initialize = useCallback((): Promise<PlayerProfile | null> => {
    if (isLoadedRef.current) return Promise.resolve(playerRef.current);
    if (inFlightRef.current) return inFlightRef.current;

    const promise = platformService.initialize(DICT_TARGET_LANG).then((profile) => {
      playerRef.current = profile;
      isLoadedRef.current = true;
      setPlayer(profile);
      setIsLoaded(true);
      inFlightRef.current = null;
      return profile;
    });
    inFlightRef.current = promise;
    return promise;
  }, []);

  const updatePlayer = useCallback((next: PlayerProfile): void => {
    playerRef.current = next;
    isLoadedRef.current = true;
    setPlayer(next);
    setIsLoaded(true);
  }, []);

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