import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { AppScreen, AppOverlay, SessionContext, NavigationState } from "./types";

interface NavigationContextValue {
  state: NavigationState;
  navigate: (screen: AppScreen, sessionContext?: SessionContext | null) => void;
  navigateToLogin: (intent: AppScreen) => void;
  openOverlay: (overlay: Exclude<AppOverlay, null>) => void;
  closeOverlay: () => void;
}

const NavigationContext = createContext<NavigationContextValue | null>(null);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<NavigationState>({
    screen: "SPLASH",
    overlay: null,
    sessionContext: null,
    pendingIntent: null,
  });

  // All four use the functional setState form — no closure over `state` —
  // so useCallback([]) gives each a permanently stable identity. Same fix
  // as PlayerSessionContext, same root cause avoided.
  const navigate = useCallback((screen: AppScreen, sessionContext?: SessionContext | null) => {
    setState((prev) => ({
      screen,
      overlay: null,
      sessionContext: sessionContext === undefined ? prev.sessionContext : sessionContext,
      pendingIntent: null,
    }));
  }, []);

  const navigateToLogin = useCallback((intent: AppScreen) => {
    setState((prev) => ({ ...prev, screen: "LOGIN", overlay: null, pendingIntent: intent }));
  }, []);

  const openOverlay = useCallback((overlay: Exclude<AppOverlay, null>) => {
    setState((prev) => ({ ...prev, overlay }));
  }, []);

  const closeOverlay = useCallback(() => {
    setState((prev) => ({ ...prev, overlay: null }));
  }, []);

  return (
    <NavigationContext.Provider value={{ state, navigate, navigateToLogin, openOverlay, closeOverlay }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation(): NavigationContextValue {
  const ctx = useContext(NavigationContext);
  if (!ctx) throw new Error("useNavigationContext must be used within a NavigationProvider");
  return ctx;
}