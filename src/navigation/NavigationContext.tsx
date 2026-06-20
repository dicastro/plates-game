import { createContext, useContext, useState, type ReactNode } from "react";
import type { AppScreen, AppOverlay, SessionContext, NavigationState } from "./types";

interface NavigationContextValue {
  state: NavigationState;
  navigate: (screen: AppScreen, sessionContext?: SessionContext | null) => void;
  openOverlay: (overlay: Exclude<AppOverlay, null>) => void;
  closeOverlay: () => void;
}

const NavigationContext = createContext<NavigationContextValue | null>(null);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<NavigationState>({
    screen: "SPLASH",
    overlay: null,
    sessionContext: null,
  });

  function navigate(screen: AppScreen, sessionContext?: SessionContext | null) {
    setState((prev) => ({
      screen,
      overlay: null,
      sessionContext: sessionContext === undefined ? prev.sessionContext : sessionContext,
    }));
  }

  function openOverlay(overlay: Exclude<AppOverlay, null>) {
    setState((prev) => ({ ...prev, overlay }));
  }

  function closeOverlay() {
    setState((prev) => ({ ...prev, overlay: null }));
  }

  return (
    <NavigationContext.Provider value={{ state, navigate, openOverlay, closeOverlay }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation(): NavigationContextValue {
  const ctx = useContext(NavigationContext);
  if (!ctx) throw new Error("useNavigationContext must be used within a NavigationProvider");
  return ctx;
}